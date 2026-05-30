/**
 * AACC Continuing Education (CEU) tracking service.
 *
 * Supports BCPCC and NCCA credentialing tracks for counselors pursuing
 * AACC credentials.  Tenant isolation is enforced on every DB query.
 *
 * No PHI is logged.  Description and provider fields are not PHI.
 */

import crypto from 'node:crypto';

// ─── Credential constants ─────────────────────────────────────────────────────

const BCPCC_HOURS_REQUIRED = 50;
const BCPCC_CYCLE_YEARS = 5;
const NCCA_HOURS_REQUIRED = 30;
const NCCA_CYCLE_YEARS = 3;

export const AACC_CATEGORIES = new Set([
  'clinical_training',
  'faith_integration',
  'ethics_and_law',
  'supervision',
  'personal_spiritual_development',
  'specialty_training',
  'self_care',
]);

export const VALID_CREDENTIAL_TYPES = new Set([
  'bcpcc',
  'ncca_fellow',
  'ncca_diplomate',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function credentialRequirements(credentialType) {
  if (credentialType === 'bcpcc') {
    return { hoursRequired: BCPCC_HOURS_REQUIRED, cycleYears: BCPCC_CYCLE_YEARS };
  }
  // ncca_fellow and ncca_diplomate share the same requirements
  return { hoursRequired: NCCA_HOURS_REQUIRED, cycleYears: NCCA_CYCLE_YEARS };
}

/**
 * Adds `years` calendar years to a date string or Date.
 * Returns a YYYY-MM-DD string.
 */
function addYears(dateValue, years) {
  const d = new Date(dateValue);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Fetches the AACC credential type and cycle start date for a staff member.
 *
 * @param {string} tenantId
 * @param {string} staffId
 * @param {object} db  pg pool
 * @returns {Promise<{ credentialType: string|null, cycleStartDate: string|null }|null>}
 *   Returns null if the staff member is not found.
 */
export async function getCredentialStatus(tenantId, staffId, db) {
  const result = await db.query(
    `SELECT aacc_credential_type, aacc_cycle_start_date
       FROM staff_members
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1`,
    [staffId, tenantId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    credentialType: row.aacc_credential_type ?? null,
    cycleStartDate: row.aacc_cycle_start_date
      ? new Date(row.aacc_cycle_start_date).toISOString().slice(0, 10)
      : null,
  };
}

/**
 * Upserts the AACC credential type and cycle start date on a staff member.
 *
 * @param {string} tenantId
 * @param {string} staffId
 * @param {{ credentialType: string, cycleStartDate: string }} data
 * @param {object} db  pg pool
 * @returns {Promise<{ updated: true }>}
 * @throws {{ code: 'staff_not_found' }} if no matching row
 */
export async function upsertCredential(tenantId, staffId, { credentialType, cycleStartDate }, db) {
  const result = await db.query(
    `UPDATE staff_members
        SET aacc_credential_type  = $1,
            aacc_cycle_start_date = $2,
            updated_at            = NOW()
      WHERE id = $3 AND tenant_id = $4`,
    [credentialType, cycleStartDate, staffId, tenantId],
  );

  if (result.rowCount === 0) {
    const err = new Error('Staff member not found');
    err.code = 'staff_not_found';
    throw err;
  }

  return { updated: true };
}

/**
 * Returns the CEU progress summary for a staff member.
 *
 * @param {string} tenantId
 * @param {string} staffId
 * @param {object} db  pg pool
 * @returns {Promise<object>}
 */
export async function getCeuProgress(tenantId, staffId, db) {
  const credential = await getCredentialStatus(tenantId, staffId, db);
  if (!credential) return null; // caller should 404

  const { credentialType, cycleStartDate } = credential;

  if (!credentialType) {
    return { credentialType: null };
  }

  const sumResult = await db.query(
    `SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes
       FROM aacc_ceu_entries
      WHERE tenant_id = $1 AND staff_id = $2`,
    [tenantId, staffId],
  );

  const totalMinutes = Number(sumResult.rows[0].total_minutes);
  const totalHours = Math.floor(totalMinutes / 60);

  const { hoursRequired, cycleYears } = credentialRequirements(credentialType);
  const remainingHours = Math.max(0, hoursRequired - totalHours);
  const percentComplete = Math.min(100, Math.round((totalHours / hoursRequired) * 100));
  const cycleEndDate = cycleStartDate ? addYears(cycleStartDate, cycleYears) : null;

  return {
    credentialType,
    cycleStartDate,
    cycleEndDate,
    hoursRequired,
    totalHours,
    remainingHours,
    percentComplete,
  };
}

/**
 * Lists all CEU entries for a staff member ordered by entry date descending.
 *
 * @param {string} tenantId
 * @param {string} staffId
 * @param {object} db  pg pool
 * @returns {Promise<object[]>}
 */
export async function listCeuEntries(tenantId, staffId, db) {
  const result = await db.query(
    `SELECT id, tenant_id, staff_id, entry_type, time_entry_id, category,
            duration_minutes, entry_date, description, provider, created_at, updated_at
       FROM aacc_ceu_entries
      WHERE tenant_id = $1 AND staff_id = $2
      ORDER BY entry_date DESC`,
    [tenantId, staffId],
  );

  return result.rows;
}

/**
 * Adds a CEU entry for a staff member.
 *
 * @param {string} tenantId
 * @param {string} staffId
 * @param {{ category: string, durationMinutes: number, entryDate: string,
 *            description?: string, provider?: string,
 *            entryType?: string, timeEntryId?: string }} data
 * @param {object} db  pg pool
 * @returns {Promise<object>}  the inserted entry
 * @throws {Error} on validation failure (err.code = 'validation_error')
 */
export async function addCeuEntry(tenantId, staffId, data, db) {
  const {
    category,
    durationMinutes,
    entryDate,
    description = null,
    provider = null,
    entryType = 'standalone',
    timeEntryId = null,
  } = data;

  if (!AACC_CATEGORIES.has(category)) {
    const err = new Error(`Invalid category: ${category}`);
    err.code = 'validation_error';
    err.field = 'category';
    throw err;
  }

  const mins = Number(durationMinutes);
  if (!Number.isFinite(mins) || mins <= 0) {
    const err = new Error('durationMinutes must be greater than 0');
    err.code = 'validation_error';
    err.field = 'durationMinutes';
    throw err;
  }
  if (mins > 480) {
    const err = new Error('durationMinutes must not exceed 480');
    err.code = 'validation_error';
    err.field = 'durationMinutes';
    throw err;
  }

  const id = crypto.randomUUID();

  await db.query(
    `INSERT INTO aacc_ceu_entries
       (id, tenant_id, staff_id, entry_type, time_entry_id, category,
        duration_minutes, entry_date, description, provider)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, tenantId, staffId, entryType, timeEntryId, category, mins, entryDate, description, provider],
  );

  // If linked to a time entry, mark that time entry with the CEU id
  if (timeEntryId) {
    await db.query(
      `UPDATE time_entries
          SET aacc_ceu_id = $1
        WHERE id = $2 AND tenant_id = $3`,
      [id, timeEntryId, tenantId],
    );
  }

  const inserted = await db.query(
    `SELECT id, tenant_id, staff_id, entry_type, time_entry_id, category,
            duration_minutes, entry_date, description, provider, created_at, updated_at
       FROM aacc_ceu_entries
      WHERE id = $1`,
    [id],
  );

  return inserted.rows[0];
}

/**
 * Deletes a CEU entry and unlinks it from any associated time entry.
 *
 * @param {string} tenantId
 * @param {string} staffId
 * @param {string} entryId
 * @param {object} db  pg pool
 * @returns {Promise<{ deleted: true }>}
 * @throws {{ code: 'not_found' }} if entry not found
 */
export async function deleteCeuEntry(tenantId, staffId, entryId, db) {
  // Fetch before deleting so we can unlink the time entry if needed
  const fetchResult = await db.query(
    `SELECT time_entry_id FROM aacc_ceu_entries
      WHERE id = $1 AND staff_id = $2 AND tenant_id = $3`,
    [entryId, staffId, tenantId],
  );

  if (fetchResult.rows.length === 0) {
    const err = new Error('CEU entry not found');
    err.code = 'not_found';
    throw err;
  }

  const timeEntryId = fetchResult.rows[0].time_entry_id;

  const deleteResult = await db.query(
    `DELETE FROM aacc_ceu_entries
      WHERE id = $1 AND staff_id = $2 AND tenant_id = $3`,
    [entryId, staffId, tenantId],
  );

  if (deleteResult.rowCount === 0) {
    const err = new Error('CEU entry not found');
    err.code = 'not_found';
    throw err;
  }

  // Unlink from the time entry if this CEU entry was associated
  if (timeEntryId) {
    await db.query(
      `UPDATE time_entries
          SET aacc_ceu_id = NULL
        WHERE id = $1 AND tenant_id = $2`,
      [timeEntryId, tenantId],
    );
  }

  return { deleted: true };
}

/**
 * Renders a print-ready HTML renewal report for a staff member.
 *
 * @param {string} tenantId
 * @param {string} staffId
 * @param {object} db  pg pool
 * @returns {Promise<string>}  complete HTML string
 */
export async function renderRenewalReportHtml(tenantId, staffId, db) {
  const progress = await getCeuProgress(tenantId, staffId, db);
  const entries = await listCeuEntries(tenantId, staffId, db);

  if (!progress || !progress.credentialType) {
    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>AACC CE Renewal Report</title></head>
<body style="font-family:Arial,sans-serif;padding:40px;color:#222;">
<h1>AACC CE Renewal Report</h1>
<p>No credential data available for this counselor.</p>
</body>
</html>`;
  }

  // Group entries by category
  const grouped = {};
  for (const entry of entries) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  }

  const credentialLabel = {
    bcpcc: 'BCPCC (Board Certified Professional Christian Counselor)',
    ncca_fellow: 'NCCA Fellow',
    ncca_diplomate: 'NCCA Diplomate',
  }[progress.credentialType] ?? progress.credentialType;

  const categoryLabel = (cat) => cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const entryRowsHtml = (rows) => rows.map((e) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ccc;">${e.entry_date ? String(e.entry_date).slice(0, 10) : ''}</td>
      <td style="padding:4px 8px;border:1px solid #ccc;">${escHtml(e.description ?? '')}</td>
      <td style="padding:4px 8px;border:1px solid #ccc;">${escHtml(e.provider ?? '')}</td>
      <td style="padding:4px 8px;border:1px solid #ccc;text-align:right;">${(e.duration_minutes / 60).toFixed(2)}</td>
    </tr>`).join('');

  const categorySectionsHtml = Object.entries(grouped).map(([cat, rows]) => {
    const subtotalHours = (rows.reduce((s, r) => s + Number(r.duration_minutes), 0) / 60).toFixed(2);
    return `
    <h3 style="margin-top:24px;color:#333;">${categoryLabel(cat)}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th style="padding:4px 8px;border:1px solid #ccc;text-align:left;">Date</th>
          <th style="padding:4px 8px;border:1px solid #ccc;text-align:left;">Description</th>
          <th style="padding:4px 8px;border:1px solid #ccc;text-align:left;">Provider</th>
          <th style="padding:4px 8px;border:1px solid #ccc;text-align:right;">Hours</th>
        </tr>
      </thead>
      <tbody>${entryRowsHtml(rows)}</tbody>
      <tfoot>
        <tr style="font-weight:bold;background:#f9f9f9;">
          <td colspan="3" style="padding:4px 8px;border:1px solid #ccc;text-align:right;">Subtotal</td>
          <td style="padding:4px 8px;border:1px solid #ccc;text-align:right;">${subtotalHours}</td>
        </tr>
      </tfoot>
    </table>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AACC CE Renewal Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #222; max-width: 900px; margin: 0 auto; }
    h1 { color: #1a3c5e; border-bottom: 2px solid #1a3c5e; padding-bottom: 8px; }
    h2 { color: #1a3c5e; margin-top: 32px; }
    .summary-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .summary-table th, .summary-table td { padding: 8px 12px; border: 1px solid #ccc; }
    .summary-table th { background: #f0f0f0; text-align: left; }
    .progress-bar-outer { background: #e0e0e0; border-radius: 4px; height: 16px; width: 100%; margin-top: 8px; }
    .progress-bar-inner { background: #2e7d32; height: 16px; border-radius: 4px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>AACC Continuing Education Renewal Report</h1>
  <p><strong>Counselor:</strong> [Counselor Name]</p>
  <p><strong>Credential:</strong> ${credentialLabel}</p>
  <p><strong>Cycle Start:</strong> ${progress.cycleStartDate ?? 'Not set'}</p>
  <p><strong>Cycle End:</strong> ${progress.cycleEndDate ?? 'Not set'}</p>

  <h2>Hours Summary</h2>
  <table class="summary-table">
    <tr><th>Hours Required</th><td>${progress.hoursRequired}</td></tr>
    <tr><th>Hours Completed</th><td>${progress.totalHours}</td></tr>
    <tr><th>Hours Remaining</th><td>${progress.remainingHours}</td></tr>
    <tr><th>Percent Complete</th><td>${progress.percentComplete}%</td></tr>
  </table>
  <div class="progress-bar-outer">
    <div class="progress-bar-inner" style="width:${progress.percentComplete}%;"></div>
  </div>

  <h2>CEU Entries by Category</h2>
  ${entries.length === 0 ? '<p>No CEU entries recorded for this cycle.</p>' : categorySectionsHtml}

  <p style="margin-top:48px;font-size:11px;color:#888;">
    Generated ${new Date().toISOString().slice(0, 10)} &mdash; ChurchCore Care
  </p>
</body>
</html>`;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

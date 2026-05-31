/**
 * Ministry / Church Plan service.
 *
 * Manages church identity fields on practices, church directory references
 * on clients, and scholarship client flags (which block invoicing).
 *
 * Tenant isolation is enforced on every DB query.
 * No PHI is logged.
 */

// ─── Validation constants ─────────────────────────────────────────────────────

export const VALID_CHURCH_SIZES = new Set(['small', 'medium', 'large', 'megachurch']);

export const VALID_DENOMINATIONS = new Set([
  'broadly_christian',
  'southern_baptist',
  'sbc_affiliated',
  'nondenominational',
  'assemblies_of_god',
  'methodist',
  'presbyterian',
  'lutheran',
  'catholic',
  'reformed',
  'charismatic',
  'anglican',
  'mennonite',
  'quaker',
  'other',
]);

// ─── Church identity (practices) ─────────────────────────────────────────────

/**
 * Fetches church identity fields for a practice.
 *
 * @param {string} tenantId
 * @param {string} practiceId
 * @param {object} db  pg pool
 * @returns {Promise<object|null>}  the church identity fields or null if not found
 */
export async function getChurchIdentity(tenantId, practiceId, db) {
  const result = await db.query(
    `SELECT ministry_name, denomination, church_size, parent_organization, church_directory_url_pattern
       FROM practices
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1`,
    [practiceId, tenantId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ministryName: row.ministry_name ?? null,
    denomination: row.denomination ?? null,
    churchSize: row.church_size ?? null,
    parentOrganization: row.parent_organization ?? null,
    churchDirectoryUrlPattern: row.church_directory_url_pattern ?? null,
  };
}

/**
 * Updates church identity fields on a practice.
 *
 * @param {string} tenantId
 * @param {string} practiceId
 * @param {{ ministryName?, denomination?, churchSize?, parentOrganization?, churchDirectoryUrlPattern? }} fields
 * @param {object} db  pg pool
 * @returns {Promise<{ updated: true }>}
 * @throws {{ code: 'validation_error' }} on invalid denomination or churchSize
 * @throws {{ code: 'practice_not_found' }} if no matching row
 */
export async function upsertChurchIdentity(tenantId, practiceId, fields, db) {
  const {
    ministryName,
    denomination,
    churchSize,
    parentOrganization,
    churchDirectoryUrlPattern,
  } = fields;

  if (denomination !== undefined && denomination !== null && !VALID_DENOMINATIONS.has(denomination)) {
    const err = new Error(`Invalid denomination: ${denomination}`);
    err.code = 'validation_error';
    err.field = 'denomination';
    throw err;
  }

  if (churchSize !== undefined && churchSize !== null && !VALID_CHURCH_SIZES.has(churchSize)) {
    const err = new Error(`Invalid churchSize: ${churchSize}`);
    err.code = 'validation_error';
    err.field = 'churchSize';
    throw err;
  }

  // Build dynamic SET clause only for provided fields
  const setClauses = [];
  const params = [];

  if (ministryName !== undefined) {
    params.push(ministryName);
    setClauses.push(`ministry_name = $${params.length}`);
  }
  if (denomination !== undefined) {
    params.push(denomination);
    setClauses.push(`denomination = $${params.length}`);
  }
  if (churchSize !== undefined) {
    params.push(churchSize);
    setClauses.push(`church_size = $${params.length}`);
  }
  if (parentOrganization !== undefined) {
    params.push(parentOrganization);
    setClauses.push(`parent_organization = $${params.length}`);
  }
  if (churchDirectoryUrlPattern !== undefined) {
    params.push(churchDirectoryUrlPattern);
    setClauses.push(`church_directory_url_pattern = $${params.length}`);
  }

  if (setClauses.length === 0) {
    // Nothing to update — verify the row exists
    const check = await db.query(
      'SELECT 1 FROM practices WHERE id = $1 AND tenant_id = $2 LIMIT 1',
      [practiceId, tenantId],
    );
    if (check.rows.length === 0) {
      const err = new Error('Practice not found');
      err.code = 'practice_not_found';
      throw err;
    }
    return { updated: true };
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(practiceId);
  params.push(tenantId);

  const result = await db.query(
    `UPDATE practices
        SET ${setClauses.join(', ')}
      WHERE id = $${params.length - 1} AND tenant_id = $${params.length}`,
    params,
  );

  if (result.rowCount === 0) {
    const err = new Error('Practice not found');
    err.code = 'practice_not_found';
    throw err;
  }

  return { updated: true };
}

// ─── Church directory reference (clients) ─────────────────────────────────────

/**
 * Fetches church directory reference fields for a client.
 *
 * @param {string} tenantId
 * @param {string} clientId
 * @param {object} db  pg pool
 * @returns {Promise<{ churchDirectoryId: string|null, churchDirectorySource: string|null }|null>}
 *   Returns null if the client is not found.
 */
export async function getChurchDirectoryRef(tenantId, clientId, db) {
  const result = await db.query(
    `SELECT church_directory_id, church_directory_source
       FROM clients
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1`,
    [clientId, tenantId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    churchDirectoryId: row.church_directory_id ?? null,
    churchDirectorySource: row.church_directory_source ?? null,
  };
}

/**
 * Updates church directory reference fields on a client.
 *
 * @param {string} tenantId
 * @param {string} clientId
 * @param {{ churchDirectoryId: string|null, churchDirectorySource: string|null }} data
 * @param {object} db  pg pool
 * @returns {Promise<{ updated: true }>}
 * @throws {{ code: 'client_not_found' }} if no matching row
 */
export async function upsertChurchDirectoryRef(tenantId, clientId, { churchDirectoryId, churchDirectorySource }, db) {
  const result = await db.query(
    `UPDATE clients
        SET church_directory_id     = $1,
            church_directory_source = $2,
            updated_at              = NOW()
      WHERE id = $3 AND tenant_id = $4`,
    [churchDirectoryId ?? null, churchDirectorySource ?? null, clientId, tenantId],
  );

  if (result.rowCount === 0) {
    const err = new Error('Client not found');
    err.code = 'client_not_found';
    throw err;
  }

  return { updated: true };
}

// ─── Scholarship flag (clients) ───────────────────────────────────────────────

/**
 * Sets the scholarship flag on a client.
 *
 * @param {string} tenantId
 * @param {string} clientId
 * @param {boolean} scholarshipFlag
 * @param {object} db  pg pool
 * @returns {Promise<{ updated: true }>}
 * @throws {{ code: 'client_not_found' }} if no matching row
 */
export async function setScholarshipFlag(tenantId, clientId, scholarshipFlag, db) {
  const result = await db.query(
    `UPDATE clients
        SET scholarship_flag = $1,
            updated_at       = NOW()
      WHERE id = $2 AND tenant_id = $3`,
    [Boolean(scholarshipFlag), clientId, tenantId],
  );

  if (result.rowCount === 0) {
    const err = new Error('Client not found');
    err.code = 'client_not_found';
    throw err;
  }

  return { updated: true };
}

/**
 * Reads the scholarship flag for a client.
 *
 * @param {string} tenantId
 * @param {string} clientId
 * @param {object} db  pg pool
 * @returns {Promise<{ scholarshipFlag: boolean }|null>}
 *   Returns null if the client is not found.
 */
export async function getScholarshipFlag(tenantId, clientId, db) {
  const result = await db.query(
    `SELECT scholarship_flag
       FROM clients
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1`,
    [clientId, tenantId],
  );

  if (result.rows.length === 0) return null;

  return { scholarshipFlag: Boolean(result.rows[0].scholarship_flag) };
}

// ─── Ministry summary ─────────────────────────────────────────────────────────

/**
 * Returns aggregate counts for the ministry summary dashboard.
 *
 * @param {string} tenantId
 * @param {object} db  pg pool
 * @returns {Promise<{ totalClients: number, scholarshipClients: number, totalCounselors: number }>}
 */
export async function getMinistrySummary(tenantId, db) {
  const clientResult = await db.query(
    `SELECT
       COUNT(*) AS total_clients,
       SUM(CASE WHEN scholarship_flag = TRUE THEN 1 ELSE 0 END) AS scholarship_clients
     FROM clients
     WHERE tenant_id = $1`,
    [tenantId],
  );

  const counselorResult = await db.query(
    `SELECT COUNT(*) AS total_counselors
       FROM staff_members
      WHERE tenant_id = $1
        AND role = 'counselor'`,
    [tenantId],
  );

  const cr = clientResult.rows[0];
  const sr = counselorResult.rows[0];

  return {
    totalClients: Number(cr.total_clients ?? 0),
    scholarshipClients: Number(cr.scholarship_clients ?? 0),
    totalCounselors: Number(sr.total_counselors ?? 0),
  };
}

// ─── Invoice creation guard ───────────────────────────────────────────────────

/**
 * Returns true if the client has the scholarship_flag set, which blocks invoicing.
 *
 * @param {string} tenantId
 * @param {string} clientId
 * @param {object} db  pg pool
 * @returns {Promise<boolean>}
 */
export async function checkScholarshipBlock(tenantId, clientId, db) {
  const result = await db.query(
    `SELECT scholarship_flag
       FROM clients
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1`,
    [clientId, tenantId],
  );

  if (result.rows.length === 0) return false;
  return Boolean(result.rows[0].scholarship_flag);
}

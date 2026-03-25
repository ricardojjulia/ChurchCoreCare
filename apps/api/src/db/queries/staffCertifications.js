/**
 * Staff certification and CEU query helpers.
 *
 * Covers post-licensure certifications (EMDR, Gottman, etc.) and
 * continuing education unit (CEU) records — distinguished by the is_ceu flag.
 *
 * PHI columns: cert_number_enc, notes_enc (AES-256-GCM encrypted).
 *
 * All queries are tenant-scoped and parameterised — no string interpolation.
 */

import pool from '../pool.js';
import { encrypt, decrypt } from '../../lib/encrypt.js';

// ─── Row mapper ───────────────────────────────────────────────────────────────

function rowToCertification(row) {
  return {
    id:          row.id,
    staffId:     row.staff_id,
    tenantId:    row.tenant_id,
    certName:    row.cert_name,
    issuingBody: row.issuing_body,
    issueDate:   row.issue_date,
    expiryDate:  row.expiry_date,
    certNumber:  row.cert_number_enc != null ? decrypt(row.cert_number_enc) : null,
    ceuHours:    row.ceu_hours != null ? Number(row.ceu_hours) : null,
    isCeu:       Boolean(row.is_ceu),
    notes:       row.notes_enc != null ? decrypt(row.notes_enc) : null,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all certifications/CEUs for a staff member.
 * Certifications first (is_ceu=0), then CEUs ordered by most recent.
 */
export async function listStaffCertifications(staffId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM staff_certifications WHERE staff_id = ? AND tenant_id = ? ORDER BY is_ceu ASC, created_at DESC',
    [staffId, tenantId],
  );
  return rows.map(rowToCertification);
}

/**
 * Returns a single certification or null.
 */
export async function getStaffCertificationById(id, staffId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM staff_certifications WHERE id = ? AND staff_id = ? AND tenant_id = ?',
    [id, staffId, tenantId],
  );
  return rows.length ? rowToCertification(rows[0]) : null;
}

/**
 * Inserts a new certification/CEU record and returns the created object.
 */
export async function createStaffCertification({
  id,
  staffId,
  tenantId,
  certName,
  issuingBody = null,
  issueDate = null,
  expiryDate = null,
  certNumber = null,
  ceuHours = null,
  isCeu = 0,
  notes = null,
}) {
  await pool.query(
    `INSERT INTO staff_certifications
       (id, staff_id, tenant_id, cert_name, issuing_body,
        issue_date, expiry_date, cert_number_enc, ceu_hours, is_ceu, notes_enc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, staffId, tenantId, certName, issuingBody,
      issueDate, expiryDate,
      certNumber != null ? encrypt(String(certNumber)) : null,
      ceuHours ?? null,
      isCeu ? 1 : 0,
      notes != null ? encrypt(String(notes)) : null,
    ],
  );
  return getStaffCertificationById(id, staffId, tenantId);
}

/**
 * Updates the given fields on a certification and returns the updated object.
 */
export async function updateStaffCertification(id, staffId, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.certName !== undefined) {
    setClauses.push('cert_name = ?');
    values.push(fields.certName);
  }
  if (fields.issuingBody !== undefined) {
    setClauses.push('issuing_body = ?');
    values.push(fields.issuingBody);
  }
  if (fields.issueDate !== undefined) {
    setClauses.push('issue_date = ?');
    values.push(fields.issueDate);
  }
  if (fields.expiryDate !== undefined) {
    setClauses.push('expiry_date = ?');
    values.push(fields.expiryDate);
  }
  if (fields.certNumber !== undefined) {
    setClauses.push('cert_number_enc = ?');
    values.push(fields.certNumber != null ? encrypt(String(fields.certNumber)) : null);
  }
  if (fields.ceuHours !== undefined) {
    setClauses.push('ceu_hours = ?');
    values.push(fields.ceuHours ?? null);
  }
  if (fields.isCeu !== undefined) {
    setClauses.push('is_ceu = ?');
    values.push(fields.isCeu ? 1 : 0);
  }
  if (fields.notes !== undefined) {
    setClauses.push('notes_enc = ?');
    values.push(fields.notes != null ? encrypt(String(fields.notes)) : null);
  }

  if (setClauses.length === 0) return getStaffCertificationById(id, staffId, tenantId);

  values.push(id, staffId, tenantId);
  await pool.query(
    `UPDATE staff_certifications SET ${setClauses.join(', ')} WHERE id = ? AND staff_id = ? AND tenant_id = ?`,
    values,
  );
  return getStaffCertificationById(id, staffId, tenantId);
}

/**
 * Deletes a certification/CEU record and returns { deleted: true }.
 */
export async function deleteStaffCertification(id, staffId, tenantId) {
  await pool.query(
    'DELETE FROM staff_certifications WHERE id = ? AND staff_id = ? AND tenant_id = ?',
    [id, staffId, tenantId],
  );
  return { deleted: true };
}

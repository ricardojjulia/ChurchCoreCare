/**
 * Staff license query helpers.
 *
 * Supports multiple licenses per staff member (multi-state, multi-credential).
 *
 * PHI column: license_number_enc (AES-256-GCM encrypted at write, decrypted at read).
 *
 * All queries are tenant-scoped and parameterised — no string interpolation.
 */

import pool from '../pool.js';
import { encrypt, decrypt } from '../../lib/encrypt.js';

// ─── Row mapper ───────────────────────────────────────────────────────────────

function rowToLicense(row) {
  return {
    id:            row.id,
    staffId:       row.staff_id,
    tenantId:      row.tenant_id,
    licenseType:   row.license_type,
    licenseNumber: row.license_number_enc != null ? decrypt(row.license_number_enc) : null,
    issuingState:  row.issuing_state,
    issuingBody:   row.issuing_body,
    issueDate:     row.issue_date,
    expiryDate:    row.expiry_date,
    status:        row.status,
    isPrimary:     Boolean(row.is_primary),
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all licenses for a staff member, primary first then by creation date.
 */
export async function listStaffLicenses(staffId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM staff_licenses WHERE staff_id = ? AND tenant_id = ? ORDER BY is_primary DESC, created_at ASC',
    [staffId, tenantId],
  );
  return rows.map(rowToLicense);
}

/**
 * Returns a single license or null.
 */
export async function getStaffLicenseById(id, staffId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM staff_licenses WHERE id = ? AND staff_id = ? AND tenant_id = ?',
    [id, staffId, tenantId],
  );
  return rows.length ? rowToLicense(rows[0]) : null;
}

/**
 * Inserts a new license and returns the created object.
 */
export async function createStaffLicense({
  id,
  staffId,
  tenantId,
  licenseType,
  licenseNumber = null,
  issuingState = null,
  issuingBody = null,
  issueDate = null,
  expiryDate = null,
  status = 'active',
  isPrimary = 0,
}) {
  await pool.query(
    `INSERT INTO staff_licenses
       (id, staff_id, tenant_id, license_type, license_number_enc,
        issuing_state, issuing_body, issue_date, expiry_date, status, is_primary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, staffId, tenantId, licenseType,
      licenseNumber != null ? encrypt(String(licenseNumber)) : null,
      issuingState, issuingBody, issueDate, expiryDate, status, isPrimary ? 1 : 0,
    ],
  );
  return getStaffLicenseById(id, staffId, tenantId);
}

/**
 * Updates the given fields on a license and returns the updated object.
 */
export async function updateStaffLicense(id, staffId, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.licenseType !== undefined) {
    setClauses.push('license_type = ?');
    values.push(fields.licenseType);
  }
  if (fields.licenseNumber !== undefined) {
    setClauses.push('license_number_enc = ?');
    values.push(fields.licenseNumber != null ? encrypt(String(fields.licenseNumber)) : null);
  }
  if (fields.issuingState !== undefined) {
    setClauses.push('issuing_state = ?');
    values.push(fields.issuingState);
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
  if (fields.status !== undefined) {
    setClauses.push('status = ?');
    values.push(fields.status);
  }
  if (fields.isPrimary !== undefined) {
    setClauses.push('is_primary = ?');
    values.push(fields.isPrimary ? 1 : 0);
  }

  if (setClauses.length === 0) return getStaffLicenseById(id, staffId, tenantId);

  values.push(id, staffId, tenantId);
  await pool.query(
    `UPDATE staff_licenses SET ${setClauses.join(', ')} WHERE id = ? AND staff_id = ? AND tenant_id = ?`,
    values,
  );
  return getStaffLicenseById(id, staffId, tenantId);
}

/**
 * Deletes a license and returns { deleted: true }.
 */
export async function deleteStaffLicense(id, staffId, tenantId) {
  await pool.query(
    'DELETE FROM staff_licenses WHERE id = ? AND staff_id = ? AND tenant_id = ?',
    [id, staffId, tenantId],
  );
  return { deleted: true };
}

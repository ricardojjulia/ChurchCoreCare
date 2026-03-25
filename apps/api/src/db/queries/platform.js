import pool from '../pool.js';

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToTenantProvisioningRequest(row) {
  return {
    id: row.id,
    requestedTenantId: row.requested_tenant_id,
    requestedPracticeName: row.requested_practice_name,
    ownerEmail: row.owner_email,
    status: row.status,
    submittedByTenantId: row.submitted_by_tenant_id,
  };
}

function rowToImpersonationSession(row) {
  return {
    id: row.id,
    initiatorAccountId: row.initiator_account_id,
    targetTenantId: row.target_tenant_id,
    targetRole: row.target_role,
    reason: row.reason,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    endedAt: row.ended_at,
    status: row.status,
  };
}

function rowToDataExportJob(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    requestedBy: row.requested_by,
    exportScope: row.export_scope,
    status: row.status,
    requestedAt: row.requested_at,
    completedAt: row.completed_at,
    downloadUrl: row.download_url,
  };
}

function rowToRetentionPolicy(row) {
  return {
    tenantId: row.tenant_id,
    clinicalRecordsSchedule: row.clinical_records_schedule,
    billingSchedule: row.billing_schedule,
    auditLogSchedule: row.audit_log_schedule,
    includeDocumentVersions: Boolean(row.include_document_versions),
    legalHoldEnabled: Boolean(row.legal_hold_enabled),
  };
}

// ---------------------------------------------------------------------------
// Tenant Provisioning Requests
// ---------------------------------------------------------------------------

export async function listTenantProvisioningRequests(tenantId) {
  if (tenantId !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM tenant_provisioning WHERE submitted_by_tenant_id = ?',
      [tenantId]
    );
    return rows.map(rowToTenantProvisioningRequest);
  }
  const [rows] = await pool.query('SELECT * FROM tenant_provisioning');
  return rows.map(rowToTenantProvisioningRequest);
}

export async function createTenantProvisioningRequest({
  id,
  requestedTenantId,
  requestedPracticeName,
  ownerEmail,
  status,
  submittedByTenantId,
}) {
  await pool.query(
    `INSERT INTO tenant_provisioning
       (id, requested_tenant_id, requested_practice_name, owner_email, status, submitted_by_tenant_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, requestedTenantId, requestedPracticeName, ownerEmail, status, submittedByTenantId]
  );
  const [rows] = await pool.query(
    'SELECT * FROM tenant_provisioning WHERE id = ?',
    [id]
  );
  return rowToTenantProvisioningRequest(rows[0]);
}

export async function updateTenantProvisioningRequest(id, fields) {
  const setClauses = [];
  const values = [];

  if (fields.requestedTenantId !== undefined) { setClauses.push('requested_tenant_id = ?'); values.push(fields.requestedTenantId); }
  if (fields.requestedPracticeName !== undefined) { setClauses.push('requested_practice_name = ?'); values.push(fields.requestedPracticeName); }
  if (fields.ownerEmail !== undefined) { setClauses.push('owner_email = ?'); values.push(fields.ownerEmail); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.submittedByTenantId !== undefined) { setClauses.push('submitted_by_tenant_id = ?'); values.push(fields.submittedByTenantId); }

  if (setClauses.length > 0) {
    values.push(id);
    await pool.query(
      `UPDATE tenant_provisioning SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM tenant_provisioning WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToTenantProvisioningRequest(rows[0]);
}

// ---------------------------------------------------------------------------
// Impersonation Sessions
// ---------------------------------------------------------------------------

export async function listImpersonationSessions(tenantId) {
  if (tenantId !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM impersonation_sessions WHERE target_tenant_id = ?',
      [tenantId]
    );
    return rows.map(rowToImpersonationSession);
  }
  const [rows] = await pool.query('SELECT * FROM impersonation_sessions');
  return rows.map(rowToImpersonationSession);
}

export async function createImpersonationSession({
  id,
  initiatorAccountId,
  targetTenantId,
  targetRole,
  reason,
  startedAt,
  expiresAt,
  status,
}) {
  await pool.query(
    `INSERT INTO impersonation_sessions
       (id, initiator_account_id, target_tenant_id, target_role, reason, started_at, expires_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, initiatorAccountId, targetTenantId, targetRole, reason, startedAt, expiresAt, status]
  );
  const [rows] = await pool.query(
    'SELECT * FROM impersonation_sessions WHERE id = ?',
    [id]
  );
  return rowToImpersonationSession(rows[0]);
}

export async function endImpersonationSession(id) {
  await pool.query(
    `UPDATE impersonation_sessions SET status = 'ended', ended_at = NOW() WHERE id = ?`,
    [id]
  );
  const [rows] = await pool.query(
    'SELECT * FROM impersonation_sessions WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToImpersonationSession(rows[0]);
}

// ---------------------------------------------------------------------------
// Data Export Jobs
// ---------------------------------------------------------------------------

export async function listDataExportJobs(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM data_export_jobs WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToDataExportJob);
}

export async function createDataExportJob({
  id,
  tenantId,
  requestedBy,
  exportScope,
  status,
  requestedAt,
}) {
  await pool.query(
    `INSERT INTO data_export_jobs
       (id, tenant_id, requested_by, export_scope, status, requested_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tenantId, requestedBy, exportScope, status, requestedAt]
  );
  const [rows] = await pool.query(
    'SELECT * FROM data_export_jobs WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToDataExportJob(rows[0]);
}

export async function updateDataExportJob(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.requestedBy !== undefined) { setClauses.push('requested_by = ?'); values.push(fields.requestedBy); }
  if (fields.exportScope !== undefined) { setClauses.push('export_scope = ?'); values.push(fields.exportScope); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.requestedAt !== undefined) { setClauses.push('requested_at = ?'); values.push(fields.requestedAt); }
  if (fields.completedAt !== undefined) { setClauses.push('completed_at = ?'); values.push(fields.completedAt); }
  if (fields.downloadUrl !== undefined) { setClauses.push('download_url = ?'); values.push(fields.downloadUrl); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE data_export_jobs SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM data_export_jobs WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToDataExportJob(rows[0]);
}

// ---------------------------------------------------------------------------
// Retention Policies
// ---------------------------------------------------------------------------

export async function getRetentionPolicy(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM retention_policies WHERE tenant_id = ?',
    [tenantId]
  );
  if (rows.length === 0) return null;
  return rowToRetentionPolicy(rows[0]);
}

export async function upsertRetentionPolicy(tenantId, policy) {
  await pool.query(
    `INSERT INTO retention_policies
       (tenant_id, clinical_records_schedule, billing_schedule, audit_log_schedule,
        include_document_versions, legal_hold_enabled)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       clinical_records_schedule  = VALUES(clinical_records_schedule),
       billing_schedule           = VALUES(billing_schedule),
       audit_log_schedule         = VALUES(audit_log_schedule),
       include_document_versions  = VALUES(include_document_versions),
       legal_hold_enabled         = VALUES(legal_hold_enabled)`,
    [
      tenantId,
      policy.clinicalRecordsSchedule,
      policy.billingSchedule,
      policy.auditLogSchedule,
      policy.includeDocumentVersions ? 1 : 0,
      policy.legalHoldEnabled ? 1 : 0,
    ]
  );
  return getRetentionPolicy(tenantId);
}

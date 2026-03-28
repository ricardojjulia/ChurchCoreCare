import pool from '../pool.js';

function toSqlTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToDocumentTemplate(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    templateType: row.template_type,
    audience: row.audience,
    templateKey: row.template_key,
    versionNumber: row.version_number,
    contentBlocks: row.content_blocks
      ? typeof row.content_blocks === 'string'
        ? JSON.parse(row.content_blocks)
        : row.content_blocks
      : null,
  };
}

function rowToDocumentAssignment(row) {
  const accessHistory = row.access_history
    ? typeof row.access_history === 'string'
      ? JSON.parse(row.access_history)
      : row.access_history
    : null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    templateId: row.template_id,
    assigneeType: row.assignee_type,
    assigneeId: row.assignee_id,
    assignedAt: row.created_at,
    status: row.status,
    requiresSignature: Boolean(row.requires_signature),
    dueDate: row.due_at,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    accessHistory,
    responses: accessHistory,
  };
}

// ---------------------------------------------------------------------------
// Document templates
// ---------------------------------------------------------------------------

export async function listDocumentTemplates(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM document_templates WHERE tenant_id = ?',
    [tenantId],
  );
  return rows.map(rowToDocumentTemplate);
}

export async function getDocumentTemplateById(id, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM document_templates WHERE id = ? AND tenant_id = ?',
    [id, tenantId],
  );
  return rows.length ? rowToDocumentTemplate(rows[0]) : null;
}

export async function createDocumentTemplate({
  id,
  tenantId,
  title,
  templateType,
  audience,
  templateKey,
  versionNumber,
  contentBlocks,
}) {
  const contentBlocksJson = contentBlocks ? JSON.stringify(contentBlocks) : null;
  const resolvedTemplateKey = templateKey || `${templateType || 'template'}-${id}`;
  await pool.query(
    `INSERT INTO document_templates
       (id, tenant_id, title, template_type, audience, template_key, version_number, content_blocks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, title, templateType, audience, resolvedTemplateKey, versionNumber, contentBlocksJson],
  );
}

export async function updateDocumentTemplate(id, tenantId, fields) {
  const pairs = [];

  if (fields.title !== undefined) pairs.push(['title = ?', fields.title]);
  if (fields.templateType !== undefined) pairs.push(['template_type = ?', fields.templateType]);
  if (fields.audience !== undefined) pairs.push(['audience = ?', fields.audience]);
  if (fields.templateKey !== undefined) pairs.push(['template_key = ?', fields.templateKey]);
  if (fields.versionNumber !== undefined) pairs.push(['version_number = ?', fields.versionNumber]);
  if (fields.contentBlocks !== undefined)
    pairs.push(['content_blocks = ?', fields.contentBlocks ? JSON.stringify(fields.contentBlocks) : null]);

  if (!pairs.length) return;

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.map(([, value]) => value);

  await pool.query(
    `UPDATE document_templates SET ${setClauses} WHERE id = ? AND tenant_id = ?`,
    [...values, id, tenantId],
  );
}

// ---------------------------------------------------------------------------
// Document assignments
// ---------------------------------------------------------------------------

export async function listDocumentAssignments(tenantId, { clientId, assigneeId, templateId } = {}) {
  const conditions = ['tenant_id = ?'];
  const values = [tenantId];

  if (clientId !== undefined) {
    // client documents are those where assignee_type = 'client' and assignee_id matches
    conditions.push('(assignee_type = ? AND assignee_id = ?)');
    values.push('client', clientId);
  }
  if (assigneeId !== undefined) {
    conditions.push('assignee_id = ?');
    values.push(assigneeId);
  }
  if (templateId !== undefined) {
    conditions.push('template_id = ?');
    values.push(templateId);
  }

  const [rows] = await pool.query(
    `SELECT * FROM document_assignments WHERE ${conditions.join(' AND ')}`,
    values,
  );
  return rows.map(rowToDocumentAssignment);
}

export async function createDocumentAssignment({
  id,
  tenantId,
  templateId,
  assigneeType,
  assigneeId,
  assignedAt,
  status,
  dueDate,
  requiresSignature,
  accessHistory,
}) {
  const assignedAtSql = toSqlTimestamp(assignedAt);
  const dueAtSql = toSqlTimestamp(dueDate);
  const accessHistoryJson = accessHistory ? JSON.stringify(accessHistory) : null;
  await pool.query(
    `INSERT INTO document_assignments
       (id, tenant_id, template_id, assignee_type, assignee_id, created_at, status, requires_signature, due_at, access_history)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, templateId, assigneeType, assigneeId, assignedAtSql, status, requiresSignature ? 1 : 0, dueAtSql, accessHistoryJson],
  );
}

export async function updateDocumentAssignment(id, tenantId, fields) {
  const pairs = [];

  if (fields.status !== undefined) pairs.push(['status = ?', fields.status]);
  if (fields.completedAt !== undefined) pairs.push(['completed_at = ?', toSqlTimestamp(fields.completedAt)]);
  if (fields.requiresSignature !== undefined) pairs.push(['requires_signature = ?', fields.requiresSignature ? 1 : 0]);
  if (fields.responses !== undefined)
    pairs.push(['access_history = ?', fields.responses ? JSON.stringify(fields.responses) : null]);
  if (fields.accessHistory !== undefined)
    pairs.push(['access_history = ?', fields.accessHistory ? JSON.stringify(fields.accessHistory) : null]);
  if (fields.dueDate !== undefined) pairs.push(['due_at = ?', toSqlTimestamp(fields.dueDate)]);

  if (!pairs.length) return;

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.map(([, value]) => value);

  await pool.query(
    `UPDATE document_assignments SET ${setClauses} WHERE id = ? AND tenant_id = ?`,
    [...values, id, tenantId],
  );
}

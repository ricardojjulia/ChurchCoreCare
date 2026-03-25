import pool from '../pool.js';

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
  return {
    id: row.id,
    tenantId: row.tenant_id,
    templateId: row.template_id,
    assigneeType: row.assignee_type,
    assigneeId: row.assignee_id,
    assignedAt: row.assigned_at,
    status: row.status,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    responses: row.responses
      ? typeof row.responses === 'string'
        ? JSON.parse(row.responses)
        : row.responses
      : null,
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
  await pool.query(
    `INSERT INTO document_templates
       (id, tenant_id, title, template_type, audience, template_key, version_number, content_blocks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, title, templateType, audience, templateKey, versionNumber, contentBlocksJson],
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
}) {
  await pool.query(
    `INSERT INTO document_assignments
       (id, tenant_id, template_id, assignee_type, assignee_id, assigned_at, status, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, templateId, assigneeType, assigneeId, assignedAt, status, dueDate],
  );
}

export async function updateDocumentAssignment(id, tenantId, fields) {
  const pairs = [];

  if (fields.status !== undefined) pairs.push(['status = ?', fields.status]);
  if (fields.completedAt !== undefined) pairs.push(['completed_at = ?', fields.completedAt]);
  if (fields.responses !== undefined)
    pairs.push(['responses = ?', fields.responses ? JSON.stringify(fields.responses) : null]);
  if (fields.dueDate !== undefined) pairs.push(['due_date = ?', fields.dueDate]);

  if (!pairs.length) return;

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.map(([, value]) => value);

  await pool.query(
    `UPDATE document_assignments SET ${setClauses} WHERE id = ? AND tenant_id = ?`,
    [...values, id, tenantId],
  );
}

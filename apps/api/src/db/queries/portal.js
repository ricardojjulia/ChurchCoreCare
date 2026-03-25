import pool from '../pool.js';
import { encrypt, decrypt } from '../../lib/encrypt.js';

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToPortalAccount(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    tenantId: row.tenant_id,
    email: decrypt(row.email_enc),
    status: row.status,
    mfaEnabled: Boolean(row.mfa_enabled),
  };
}

function rowToPortalResource(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    content: row.content,
    resourceType: row.resource_type,
    assignedClientIds: typeof row.assigned_client_ids === 'string'
      ? JSON.parse(row.assigned_client_ids)
      : row.assigned_client_ids,
    publishedAt: row.published_at,
  };
}

function rowToPortalMessageThread(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    subject: row.subject,
    status: row.status,
    lastMessageAt: row.last_message_at,
  };
}

function rowToPortalMessage(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderType: row.sender_type,
    content: decrypt(row.content_enc),
    sentAt: row.sent_at,
  };
}

function rowToPortalAppointmentRequest(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    preferredDates: typeof row.preferred_dates === 'string'
      ? JSON.parse(row.preferred_dates)
      : row.preferred_dates,
    requestedCounselorId: row.requested_counselor_id,
    notes: row.notes,
    status: row.status,
  };
}

// ---------------------------------------------------------------------------
// Portal Accounts
// ---------------------------------------------------------------------------

export async function getPortalAccount(clientId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM portal_accounts WHERE client_id = ? AND tenant_id = ?',
    [clientId, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToPortalAccount(rows[0]);
}

export async function createPortalAccount({ id, clientId, tenantId, email, status, mfaEnabled }) {
  await pool.query(
    `INSERT INTO portal_accounts
       (id, client_id, tenant_id, email_enc, status, mfa_enabled)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, clientId, tenantId, encrypt(email), status, mfaEnabled ? 1 : 0]
  );
  return getPortalAccount(clientId, tenantId);
}

export async function updatePortalAccount(clientId, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.email !== undefined) { setClauses.push('email_enc = ?'); values.push(encrypt(fields.email)); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.mfaEnabled !== undefined) { setClauses.push('mfa_enabled = ?'); values.push(fields.mfaEnabled ? 1 : 0); }

  if (setClauses.length === 0) return getPortalAccount(clientId, tenantId);

  values.push(clientId, tenantId);
  await pool.query(
    `UPDATE portal_accounts SET ${setClauses.join(', ')} WHERE client_id = ? AND tenant_id = ?`,
    values
  );
  return getPortalAccount(clientId, tenantId);
}

// ---------------------------------------------------------------------------
// Portal Resources
// ---------------------------------------------------------------------------

export async function listPortalResources(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM portal_resources WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToPortalResource);
}

export async function createPortalResource({
  id,
  tenantId,
  title,
  content,
  resourceType,
  assignedClientIds,
  publishedAt,
}) {
  await pool.query(
    `INSERT INTO portal_resources
       (id, tenant_id, title, content, resource_type, assigned_client_ids, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, title, content, resourceType, JSON.stringify(assignedClientIds), publishedAt]
  );
  const [rows] = await pool.query(
    'SELECT * FROM portal_resources WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToPortalResource(rows[0]);
}

export async function updatePortalResource(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.title !== undefined) { setClauses.push('title = ?'); values.push(fields.title); }
  if (fields.content !== undefined) { setClauses.push('content = ?'); values.push(fields.content); }
  if (fields.resourceType !== undefined) { setClauses.push('resource_type = ?'); values.push(fields.resourceType); }
  if (fields.assignedClientIds !== undefined) { setClauses.push('assigned_client_ids = ?'); values.push(JSON.stringify(fields.assignedClientIds)); }
  if (fields.publishedAt !== undefined) { setClauses.push('published_at = ?'); values.push(fields.publishedAt); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE portal_resources SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM portal_resources WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToPortalResource(rows[0]);
}

// ---------------------------------------------------------------------------
// Portal Message Threads
// ---------------------------------------------------------------------------

export async function listPortalMessageThreads(tenantId, clientId) {
  if (clientId !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM portal_message_threads WHERE tenant_id = ? AND client_id = ?',
      [tenantId, clientId]
    );
    return rows.map(rowToPortalMessageThread);
  }
  const [rows] = await pool.query(
    'SELECT * FROM portal_message_threads WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToPortalMessageThread);
}

export async function getPortalMessageThread(id, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM portal_message_threads WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToPortalMessageThread(rows[0]);
}

export async function createPortalMessageThread({
  id,
  tenantId,
  clientId,
  subject,
  status,
  lastMessageAt,
}) {
  await pool.query(
    `INSERT INTO portal_message_threads
       (id, tenant_id, client_id, subject, status, last_message_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tenantId, clientId, subject, status, lastMessageAt]
  );
  return getPortalMessageThread(id, tenantId);
}

export async function updatePortalMessageThread(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.subject !== undefined) { setClauses.push('subject = ?'); values.push(fields.subject); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.lastMessageAt !== undefined) { setClauses.push('last_message_at = ?'); values.push(fields.lastMessageAt); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE portal_message_threads SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  return getPortalMessageThread(id, tenantId);
}

// ---------------------------------------------------------------------------
// Portal Messages
// ---------------------------------------------------------------------------

export async function listPortalMessages(threadId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM portal_messages WHERE thread_id = ? AND tenant_id = ? ORDER BY sent_at ASC',
    [threadId, tenantId]
  );
  return rows.map(rowToPortalMessage);
}

export async function createPortalMessage({
  id,
  tenantId,
  threadId,
  senderId,
  senderType,
  content,
  sentAt,
}) {
  await pool.query(
    `INSERT INTO portal_messages
       (id, tenant_id, thread_id, sender_id, sender_type, content_enc, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, threadId, senderId, senderType, encrypt(content), sentAt]
  );
  const [rows] = await pool.query(
    'SELECT * FROM portal_messages WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToPortalMessage(rows[0]);
}

// ---------------------------------------------------------------------------
// Portal Appointment Requests
// ---------------------------------------------------------------------------

export async function listPortalAppointmentRequests(tenantId, clientId) {
  if (clientId !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM portal_appointment_requests WHERE tenant_id = ? AND client_id = ?',
      [tenantId, clientId]
    );
    return rows.map(rowToPortalAppointmentRequest);
  }
  const [rows] = await pool.query(
    'SELECT * FROM portal_appointment_requests WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToPortalAppointmentRequest);
}

export async function createPortalAppointmentRequest({
  id,
  tenantId,
  clientId,
  preferredDates,
  requestedCounselorId,
  notes,
  status,
}) {
  await pool.query(
    `INSERT INTO portal_appointment_requests
       (id, tenant_id, client_id, preferred_dates, requested_counselor_id, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, clientId, JSON.stringify(preferredDates), requestedCounselorId, notes, status]
  );
  const [rows] = await pool.query(
    'SELECT * FROM portal_appointment_requests WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToPortalAppointmentRequest(rows[0]);
}

export async function updatePortalAppointmentRequest(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.preferredDates !== undefined) { setClauses.push('preferred_dates = ?'); values.push(JSON.stringify(fields.preferredDates)); }
  if (fields.requestedCounselorId !== undefined) { setClauses.push('requested_counselor_id = ?'); values.push(fields.requestedCounselorId); }
  if (fields.notes !== undefined) { setClauses.push('notes = ?'); values.push(fields.notes); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE portal_appointment_requests SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM portal_appointment_requests WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToPortalAppointmentRequest(rows[0]);
}

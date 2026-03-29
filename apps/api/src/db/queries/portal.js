import pool from '../pool.js';
import { encrypt, decrypt } from '../../lib/encrypt.js';

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
    audience: row.audience,
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
    lastMessageAt: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPortalMessage(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderType: row.sender_role,
    senderRole: row.sender_role,
    content: decrypt(row.content_enc),
    sentAt: row.sent_at,
  };
}

function rowToPortalAppointmentRequest(row) {
  const preferredTimes = typeof row.preferred_times === 'string'
    ? JSON.parse(row.preferred_times)
    : row.preferred_times;
  const first = Array.isArray(preferredTimes) ? preferredTimes[0] : null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    requestedType: row.requested_type,
    preferredTimes,
    preferredStartAt: first?.startAt ?? null,
    preferredEndAt: first?.endAt ?? null,
    mode: first?.mode ?? 'remote',
    notes: row.notes,
    status: row.status,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToPortalSettings(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    practiceName: row.practice_name,
    logoUrl: row.logo_url ?? '',
    brandColor: row.brand_color ?? '#1f7a8c',
    accentColor: row.accent_color ?? '#f0f7f8',
    welcomeHeadline: row.welcome_headline,
    welcomeMessage: row.welcome_message,
    helpMessage: row.help_message ?? '',
    supportEmail: row.support_email_enc ? decrypt(row.support_email_enc) : '',
    registrationMode: row.registration_mode,
    allowCreateAccount: Boolean(row.allow_create_account),
    allowCareRequests: Boolean(row.allow_care_requests),
    allowSchedulingRequests: Boolean(row.allow_scheduling_requests),
    showPublicCounselorDirectory: Boolean(row.show_public_counselor_directory),
    financialMode: row.financial_mode ?? 'billing',
    contactPreferenceOptions: parseJsonArray(row.contact_preference_options),
    defaultSignupFormKeys: parseJsonArray(row.default_signup_form_keys),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
// Portal Settings
// ---------------------------------------------------------------------------

export async function getPortalSettings(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM portal_settings WHERE tenant_id = ? LIMIT 1',
    [tenantId]
  );
  if (!rows.length) return null;
  return rowToPortalSettings(rows[0]);
}

export async function upsertPortalSettings({
  id,
  tenantId,
  practiceName,
  logoUrl,
  brandColor,
  accentColor,
  welcomeHeadline,
  welcomeMessage,
  helpMessage,
  supportEmail,
  registrationMode,
  allowCreateAccount,
  allowCareRequests,
  allowSchedulingRequests,
  showPublicCounselorDirectory,
  financialMode,
  contactPreferenceOptions,
  defaultSignupFormKeys,
}) {
  const existing = await getPortalSettings(tenantId);
  const targetId = existing?.id ?? id;
  if (!targetId) {
    throw new Error('Portal settings id is required');
  }

  await pool.query(
    `INSERT INTO portal_settings
      (id, tenant_id, practice_name, logo_url, brand_color, accent_color, welcome_headline, welcome_message, help_message,
       support_email_enc, registration_mode, allow_create_account, allow_care_requests, allow_scheduling_requests,
       show_public_counselor_directory, financial_mode, contact_preference_options, default_signup_form_keys)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       practice_name = VALUES(practice_name),
       logo_url = VALUES(logo_url),
       brand_color = VALUES(brand_color),
       accent_color = VALUES(accent_color),
       welcome_headline = VALUES(welcome_headline),
       welcome_message = VALUES(welcome_message),
       help_message = VALUES(help_message),
       support_email_enc = VALUES(support_email_enc),
       registration_mode = VALUES(registration_mode),
       allow_create_account = VALUES(allow_create_account),
       allow_care_requests = VALUES(allow_care_requests),
       allow_scheduling_requests = VALUES(allow_scheduling_requests),
       show_public_counselor_directory = VALUES(show_public_counselor_directory),
       financial_mode = VALUES(financial_mode),
       contact_preference_options = VALUES(contact_preference_options),
       default_signup_form_keys = VALUES(default_signup_form_keys)`,
    [
      targetId,
      tenantId,
      practiceName,
      logoUrl,
      brandColor,
      accentColor,
      welcomeHeadline,
      welcomeMessage,
      helpMessage,
      supportEmail ? encrypt(supportEmail) : null,
      registrationMode,
      allowCreateAccount ? 1 : 0,
      allowCareRequests ? 1 : 0,
      allowSchedulingRequests ? 1 : 0,
      showPublicCounselorDirectory ? 1 : 0,
      financialMode,
      JSON.stringify(contactPreferenceOptions ?? []),
      JSON.stringify(defaultSignupFormKeys ?? []),
    ],
  );

  return getPortalSettings(tenantId);
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
  audience,
  publishedAt,
}) {
  await pool.query(
    `INSERT INTO portal_resources
       (id, tenant_id, title, content, resource_type, audience, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, title, content, resourceType, audience ?? 'all', toSqlTimestamp(publishedAt)]
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
  if (fields.audience !== undefined) { setClauses.push('audience = ?'); values.push(fields.audience); }
  if (fields.publishedAt !== undefined) { setClauses.push('published_at = ?'); values.push(toSqlTimestamp(fields.publishedAt)); }

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
}) {
  await pool.query(
    `INSERT INTO portal_message_threads
       (id, tenant_id, client_id, subject, status)
     VALUES (?, ?, ?, ?, ?)`,
    [id, tenantId, clientId, subject, status]
  );
  return getPortalMessageThread(id, tenantId);
}

export async function updatePortalMessageThread(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.subject !== undefined) { setClauses.push('subject = ?'); values.push(fields.subject); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }

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
       (id, tenant_id, thread_id, sender_id, sender_role, content_enc, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, threadId, senderId, senderType, encrypt(content), toSqlTimestamp(sentAt)]
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
  preferredTimes,
  requestedType,
  notes,
  status,
  resolvedAt,
}) {
  await pool.query(
    `INSERT INTO portal_appointment_requests
       (id, tenant_id, client_id, requested_type, preferred_times, notes, status, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, clientId, requestedType ?? 'session', JSON.stringify(preferredTimes ?? []), notes, status, toSqlTimestamp(resolvedAt)]
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
  if (fields.preferredTimes !== undefined) { setClauses.push('preferred_times = ?'); values.push(JSON.stringify(fields.preferredTimes)); }
  if (fields.requestedType !== undefined) { setClauses.push('requested_type = ?'); values.push(fields.requestedType); }
  if (fields.notes !== undefined) { setClauses.push('notes = ?'); values.push(fields.notes); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.resolvedAt !== undefined) { setClauses.push('resolved_at = ?'); values.push(toSqlTimestamp(fields.resolvedAt)); }

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

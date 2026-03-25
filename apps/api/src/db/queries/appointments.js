import pool from '../pool.js';
import { encrypt, decrypt } from '../../lib/encrypt.js';

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToAppointment(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    clientName: decrypt(row.client_name_enc),
    counselorName: decrypt(row.counselor_name_enc),
    startsAt: row.starts_at instanceof Date ? row.starts_at.toISOString() : row.starts_at,
    endsAt: row.ends_at instanceof Date ? row.ends_at.toISOString() : row.ends_at,
    status: row.status,
    appointmentType: row.appointment_type,
    locationName: row.location_name,
    remoteSession: Boolean(row.remote_session),
    timezone: row.timezone,
    createdAt: row.created_at,
  };
}

function rowToReminder(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    appointmentId: row.appointment_id,
    reminderType: row.reminder_type,
    scheduledFor: row.scheduled_for instanceof Date ? row.scheduled_for.toISOString() : row.scheduled_for,
    status: row.status,
    channel: row.channel,
    createdAt: row.created_at,
  };
}

function rowToWaitlist(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientId: row.client_id,
    requestedCounselorId: row.requested_counselor_id,
    preferredDays: typeof row.preferred_days === 'string' ? JSON.parse(row.preferred_days) : row.preferred_days,
    estimatedWait: row.estimated_wait,
    priority: row.priority,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function rowToAvailabilityTemplate(row) {
  return {
    id: row.id,
    staffId: row.staff_id,
    tenantId: row.tenant_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function listAppointments(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM appointments WHERE tenant_id = ? ORDER BY starts_at ASC',
    [tenantId]
  );
  return rows.map(rowToAppointment);
}

export async function getAppointmentById(id, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM appointments WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToAppointment(rows[0]);
}

export async function createAppointment({
  id,
  tenantId,
  clientId,
  clientName,
  counselorName,
  startsAt,
  endsAt,
  status,
  appointmentType,
  locationName,
  remoteSession,
  timezone,
}) {
  await pool.query(
    `INSERT INTO appointments
       (id, tenant_id, client_id, client_name_enc, counselor_name_enc,
        starts_at, ends_at, status, appointment_type, location_name,
        remote_session, timezone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantId,
      clientId,
      encrypt(clientName),
      encrypt(counselorName),
      startsAt,
      endsAt,
      status,
      appointmentType,
      locationName,
      remoteSession ? 1 : 0,
      timezone,
    ]
  );
  return getAppointmentById(id, tenantId);
}

export async function updateAppointment(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientName !== undefined) {
    setClauses.push('client_name_enc = ?');
    values.push(encrypt(fields.clientName));
  }
  if (fields.counselorName !== undefined) {
    setClauses.push('counselor_name_enc = ?');
    values.push(encrypt(fields.counselorName));
  }
  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.startsAt !== undefined) { setClauses.push('starts_at = ?'); values.push(fields.startsAt); }
  if (fields.endsAt !== undefined) { setClauses.push('ends_at = ?'); values.push(fields.endsAt); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.appointmentType !== undefined) { setClauses.push('appointment_type = ?'); values.push(fields.appointmentType); }
  if (fields.locationName !== undefined) { setClauses.push('location_name = ?'); values.push(fields.locationName); }
  if (fields.remoteSession !== undefined) { setClauses.push('remote_session = ?'); values.push(fields.remoteSession ? 1 : 0); }
  if (fields.timezone !== undefined) { setClauses.push('timezone = ?'); values.push(fields.timezone); }

  if (setClauses.length === 0) return getAppointmentById(id, tenantId);

  values.push(id, tenantId);
  await pool.query(
    `UPDATE appointments SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
    values
  );
  return getAppointmentById(id, tenantId);
}

export async function deleteAppointment(id, tenantId) {
  await pool.query(
    'DELETE FROM appointments WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return { deleted: true };
}

export async function listAppointmentsByDateRange(tenantId, startDate, endDate) {
  const [rows] = await pool.query(
    'SELECT * FROM appointments WHERE tenant_id = ? AND starts_at BETWEEN ? AND ? ORDER BY starts_at ASC',
    [tenantId, startDate, endDate]
  );
  return rows.map(rowToAppointment);
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export async function listReminders(tenantId, clientId) {
  if (clientId !== undefined) {
    const [rows] = await pool.query(
      'SELECT * FROM reminders WHERE tenant_id = ? AND client_id = ?',
      [tenantId, clientId]
    );
    return rows.map(rowToReminder);
  }
  const [rows] = await pool.query(
    'SELECT * FROM reminders WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToReminder);
}

export async function createReminder({
  id,
  tenantId,
  clientId,
  appointmentId,
  reminderType,
  scheduledFor,
  status,
  channel,
}) {
  await pool.query(
    `INSERT INTO reminders
       (id, tenant_id, client_id, appointment_id, reminder_type, scheduled_for, status, channel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tenantId, clientId, appointmentId, reminderType, scheduledFor, status, channel]
  );
  const [rows] = await pool.query(
    'SELECT * FROM reminders WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToReminder(rows[0]);
}

export async function updateReminder(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.appointmentId !== undefined) { setClauses.push('appointment_id = ?'); values.push(fields.appointmentId); }
  if (fields.reminderType !== undefined) { setClauses.push('reminder_type = ?'); values.push(fields.reminderType); }
  if (fields.scheduledFor !== undefined) { setClauses.push('scheduled_for = ?'); values.push(fields.scheduledFor); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if (fields.channel !== undefined) { setClauses.push('channel = ?'); values.push(fields.channel); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE reminders SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM reminders WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToReminder(rows[0]);
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

export async function listWaitlist(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM waitlist_metadata WHERE tenant_id = ?',
    [tenantId]
  );
  return rows.map(rowToWaitlist);
}

export async function createWaitlistEntry({
  id,
  tenantId,
  clientId,
  requestedCounselorId,
  preferredDays,
  estimatedWait,
  priority,
  notes,
}) {
  await pool.query(
    `INSERT INTO waitlist_metadata
       (id, tenant_id, client_id, requested_counselor_id, preferred_days,
        estimated_wait, priority, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantId,
      clientId,
      requestedCounselorId,
      JSON.stringify(preferredDays),
      estimatedWait,
      priority,
      notes,
    ]
  );
  const [rows] = await pool.query(
    'SELECT * FROM waitlist_metadata WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  return rowToWaitlist(rows[0]);
}

export async function updateWaitlistEntry(id, tenantId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.clientId !== undefined) { setClauses.push('client_id = ?'); values.push(fields.clientId); }
  if (fields.requestedCounselorId !== undefined) { setClauses.push('requested_counselor_id = ?'); values.push(fields.requestedCounselorId); }
  if (fields.preferredDays !== undefined) { setClauses.push('preferred_days = ?'); values.push(JSON.stringify(fields.preferredDays)); }
  if (fields.estimatedWait !== undefined) { setClauses.push('estimated_wait = ?'); values.push(fields.estimatedWait); }
  if (fields.priority !== undefined) { setClauses.push('priority = ?'); values.push(fields.priority); }
  if (fields.notes !== undefined) { setClauses.push('notes = ?'); values.push(fields.notes); }

  if (setClauses.length > 0) {
    values.push(id, tenantId);
    await pool.query(
      `UPDATE waitlist_metadata SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM waitlist_metadata WHERE id = ? AND tenant_id = ?',
    [id, tenantId]
  );
  if (rows.length === 0) return null;
  return rowToWaitlist(rows[0]);
}

// ---------------------------------------------------------------------------
// Availability Templates
// ---------------------------------------------------------------------------

export async function listAvailabilityTemplates(staffId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM availability_templates WHERE staff_id = ? AND tenant_id = ?',
    [staffId, tenantId]
  );
  return rows.map(rowToAvailabilityTemplate);
}

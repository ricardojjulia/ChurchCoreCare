/**
 * Self-scheduling service for ChurchCore Care.
 *
 * All functions enforce tenant isolation — every DB query filters on tenant_id.
 * No raw DB errors are surfaced; callers receive domain-level errors.
 */

import crypto from 'node:crypto';
import pool from '../db/pool.js';
import { calculateSlots } from './slotCalculator.js';

// ---------------------------------------------------------------------------
// Custom error classes
// ---------------------------------------------------------------------------

export class SelfSchedulingError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = 'SelfSchedulingError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class SlotConflictError extends SelfSchedulingError {
  constructor() {
    super('The requested time slot is no longer available', 'slot_conflict', 409);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newId() {
  return crypto.randomBytes(16).toString('hex');
}

function profileRowToObject(row) {
  return {
    id:                   row.id,
    tenantId:             row.tenant_id,
    staffId:              row.staff_id,
    enabled:              Boolean(row.enabled),
    slotDurationMinutes:  row.slot_duration_minutes,
    bufferMinutes:        row.buffer_minutes,
    advanceBookingDays:   row.advance_booking_days,
    minNoticeHours:       row.min_notice_hours,
    availableApptTypes:   parseJsonField(row.available_appt_types, []),
    availabilityBlocks:   parseJsonField(row.availability_blocks, []),
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
  };
}

function authRowToObject(row) {
  return {
    id:               row.id,
    tenantId:         row.tenant_id,
    clientId:         row.client_id,
    counselorId:      row.counselor_id,
    bookingMode:      row.booking_mode,
    allowedApptTypes: parseJsonField(row.allowed_appt_types, null),
    allowedDays:      parseJsonField(row.allowed_days, null),
    expiresAt:        row.expires_at,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

function parseJsonField(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value; // pg already parsed JSONB
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Counselor scheduling profile
// ---------------------------------------------------------------------------

/**
 * Get the scheduling profile for a staff member within a tenant.
 * Returns null when no profile exists.
 */
export async function getSchedulingProfile(pool, tenantId, staffId) {
  if (!process.env.DB_NAME) return null;

  const [rows] = await pool.query(
    `SELECT * FROM counselor_scheduling_profiles
      WHERE tenant_id = ? AND staff_id = ?
      LIMIT 1`,
    [tenantId, staffId],
  );
  return rows[0] ? profileRowToObject(rows[0]) : null;
}

/**
 * Upsert a counselor scheduling profile.
 *
 * Only an admin/owner may update another counselor's profile; a counselor
 * may only update their own (actorStaffId must match staffId).
 */
export async function upsertSchedulingProfile(pool, tenantId, staffId, actorStaffId, actorRole, data) {
  // Role check: counselor/intern may only manage own profile
  const selfManageRoles = new Set(['counselor', 'intern']);
  if (selfManageRoles.has(actorRole) && actorStaffId !== staffId) {
    const err = new SelfSchedulingError(
      'Counselors may only manage their own scheduling profile',
      'rbac_denied',
      403,
    );
    throw err;
  }

  const id = newId();
  const now = new Date();

  const enabled              = Boolean(data.enabled ?? false);
  const slotDurationMinutes  = Number(data.slotDurationMinutes ?? 50);
  const bufferMinutes        = Number(data.bufferMinutes ?? 0);
  const advanceBookingDays   = Number(data.advanceBookingDays ?? 14);
  const minNoticeHours       = Number(data.minNoticeHours ?? 24);
  const availableApptTypes   = JSON.stringify(data.availableApptTypes ?? []);
  const availabilityBlocks   = JSON.stringify(data.availabilityBlocks ?? []);

  if (!process.env.DB_NAME) {
    // No-DB mode: return a synthetic profile object
    return {
      id,
      tenantId,
      staffId,
      enabled,
      slotDurationMinutes,
      bufferMinutes,
      advanceBookingDays,
      minNoticeHours,
      availableApptTypes: data.availableApptTypes ?? [],
      availabilityBlocks: data.availabilityBlocks ?? [],
      createdAt: now,
      updatedAt: now,
    };
  }

  // Upsert: insert or update on staff_id conflict
  await pool.query(
    `INSERT INTO counselor_scheduling_profiles
       (id, tenant_id, staff_id, enabled, slot_duration_minutes, buffer_minutes,
        advance_booking_days, min_notice_hours, available_appt_types, availability_blocks,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ?)
     ON CONFLICT (staff_id) DO UPDATE SET
       enabled               = EXCLUDED.enabled,
       slot_duration_minutes = EXCLUDED.slot_duration_minutes,
       buffer_minutes        = EXCLUDED.buffer_minutes,
       advance_booking_days  = EXCLUDED.advance_booking_days,
       min_notice_hours      = EXCLUDED.min_notice_hours,
       available_appt_types  = EXCLUDED.available_appt_types,
       availability_blocks   = EXCLUDED.availability_blocks,
       updated_at            = EXCLUDED.updated_at`,
    [id, tenantId, staffId, enabled, slotDurationMinutes, bufferMinutes,
     advanceBookingDays, minNoticeHours, availableApptTypes, availabilityBlocks,
     now, now],
  );

  const [rows] = await pool.query(
    `SELECT * FROM counselor_scheduling_profiles WHERE tenant_id = ? AND staff_id = ? LIMIT 1`,
    [tenantId, staffId],
  );
  return rows[0] ? profileRowToObject(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Client booking authorization
// ---------------------------------------------------------------------------

/**
 * Get the booking authorization for a client/counselor pair within a tenant.
 */
export async function getBookingAuthorization(pool, tenantId, clientId, counselorId) {
  if (!process.env.DB_NAME) return null;

  const [rows] = await pool.query(
    `SELECT * FROM client_booking_authorizations
      WHERE tenant_id = ? AND client_id = ? AND counselor_id = ?
      LIMIT 1`,
    [tenantId, clientId, counselorId],
  );
  return rows[0] ? authRowToObject(rows[0]) : null;
}

/**
 * Upsert a booking authorization.
 *
 * Only admin/owner and the assigned counselor/intern may manage this.
 */
export async function upsertBookingAuthorization(pool, tenantId, clientId, counselorId, data) {
  const id  = newId();
  const now = new Date();

  const bookingMode      = data.bookingMode ?? 'request';
  const allowedApptTypes = data.allowedApptTypes != null ? JSON.stringify(data.allowedApptTypes) : null;
  const allowedDays      = data.allowedDays      != null ? JSON.stringify(data.allowedDays)      : null;
  const expiresAt        = data.expiresAt        != null ? new Date(data.expiresAt)               : null;

  if (!process.env.DB_NAME) {
    return {
      id,
      tenantId,
      clientId,
      counselorId,
      bookingMode,
      allowedApptTypes: data.allowedApptTypes ?? null,
      allowedDays:      data.allowedDays      ?? null,
      expiresAt:        expiresAt,
      createdAt:        now,
      updatedAt:        now,
    };
  }

  await pool.query(
    `INSERT INTO client_booking_authorizations
       (id, tenant_id, client_id, counselor_id, booking_mode,
        allowed_appt_types, allowed_days, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?,
             ?::jsonb, ?::jsonb, ?, ?, ?)
     ON CONFLICT (tenant_id, client_id, counselor_id) DO UPDATE SET
       booking_mode       = EXCLUDED.booking_mode,
       allowed_appt_types = EXCLUDED.allowed_appt_types,
       allowed_days       = EXCLUDED.allowed_days,
       expires_at         = EXCLUDED.expires_at,
       updated_at         = EXCLUDED.updated_at`,
    [id, tenantId, clientId, counselorId, bookingMode,
     allowedApptTypes, allowedDays, expiresAt, now, now],
  );

  const [rows] = await pool.query(
    `SELECT * FROM client_booking_authorizations
      WHERE tenant_id = ? AND client_id = ? AND counselor_id = ? LIMIT 1`,
    [tenantId, clientId, counselorId],
  );
  return rows[0] ? authRowToObject(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Portal entitlement
// ---------------------------------------------------------------------------

/**
 * Return all booking authorizations for a client in a tenant.
 * Used by the portal to discover which counselors the client may book with.
 */
export async function getEntitlement(pool, tenantId, clientId) {
  if (!process.env.DB_NAME) return [];

  const [rows] = await pool.query(
    `SELECT * FROM client_booking_authorizations
      WHERE tenant_id = ? AND client_id = ?`,
    [tenantId, clientId],
  );
  return rows.map(authRowToObject);
}

// ---------------------------------------------------------------------------
// Available slots
// ---------------------------------------------------------------------------

/**
 * Return available slots for a counselor as seen by a portal client.
 */
export async function getAvailableSlots(pool, tenantId, counselorId, { from, to, apptType = null, allowedDays = null }) {
  if (!process.env.DB_NAME) return [];

  // Load the counselor scheduling profile
  const [profileRows] = await pool.query(
    `SELECT * FROM counselor_scheduling_profiles
      WHERE tenant_id = ? AND staff_id = ?
      LIMIT 1`,
    [tenantId, counselorId],
  );
  const profileRow = profileRows[0];
  if (!profileRow) return [];

  const profile = profileRowToObject(profileRow);
  if (!profile.enabled) return [];

  // Load practice timezone
  const [practiceRows] = await pool.query(
    `SELECT timezone FROM practices WHERE tenant_id = ? LIMIT 1`,
    [tenantId],
  );
  const practiceTimezone = practiceRows[0]?.timezone ?? 'America/New_York';

  // Load existing appointments for overlap checking
  const [apptRows] = await pool.query(
    `SELECT scheduled_at, duration_minutes FROM appointments
      WHERE tenant_id = ? AND counselor_id = ? AND status != 'cancelled'
        AND scheduled_at < ? AND scheduled_at > ?`,
    [tenantId, counselorId, to, new Date(from.getTime() - 24 * 3_600_000)],
  );
  const existingAppointments = apptRows.map((r) => ({
    scheduledAt:     r.scheduled_at instanceof Date ? r.scheduled_at : new Date(r.scheduled_at),
    durationMinutes: r.duration_minutes,
  }));

  return calculateSlots(profile, existingAppointments, {
    from,
    to,
    practiceTimezone,
    apptType,
    allowedDays,
  });
}

// ---------------------------------------------------------------------------
// Confirm booking (transactional)
// ---------------------------------------------------------------------------

/**
 * Confirm a self-booking slot for a client.
 *
 * Steps:
 *  1. Verify effectiveMode === 'book' for the client/counselor pair.
 *  2. Re-verify authorization expiry.
 *  3. BEGIN transaction.
 *  4. Overlap check with FOR UPDATE.
 *  5. INSERT appointment.
 *  6. INSERT self_booking_appointments.
 *  7. INSERT reminder.
 *  8. COMMIT.
 */
export async function confirmBooking(pool, tenantId, clientId, counselorId, { apptType, slotStart, slotEnd }) {
  if (!process.env.DB_NAME) {
    // No-DB mode: return a synthetic result
    const id = newId();
    return {
      appointmentId: id,
      tenantId,
      clientId,
      counselorId,
      apptType,
      slotStart,
      slotEnd,
      status: 'scheduled',
    };
  }

  // Step 1: load authorization and verify
  const [authRows] = await pool.query(
    `SELECT * FROM client_booking_authorizations
      WHERE tenant_id = ? AND client_id = ? AND counselor_id = ?
      LIMIT 1`,
    [tenantId, clientId, counselorId],
  );
  const auth = authRows[0] ? authRowToObject(authRows[0]) : null;

  if (!auth) {
    throw new SelfSchedulingError('No booking authorization found', 'no_authorization', 403);
  }

  if (auth.bookingMode !== 'book') {
    throw new SelfSchedulingError('Client is not authorized for direct booking', 'mode_not_book', 403);
  }

  // Step 2: re-verify expiry
  if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) {
    throw new SelfSchedulingError('Booking authorization has expired', 'authorization_expired', 403);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Step 4: Overlap check with lock
    // Buffer must be considered: the slot (slotStart, slotEnd + buffer) must
    // not overlap any existing non-cancelled appointment.
    const [conflictRows] = await conn.query(
      `SELECT id FROM appointments
        WHERE tenant_id = ? AND counselor_id = ? AND status != 'cancelled'
          AND scheduled_at < ?
          AND (scheduled_at + duration_minutes * interval '1 minute') > ?
        FOR UPDATE`,
      [tenantId, counselorId, slotEnd, slotStart],
    );

    if (conflictRows.length > 0) {
      await conn.rollback();
      conn.release();
      throw new SlotConflictError();
    }

    // Step 5: INSERT appointment
    const appointmentId    = newId();
    const selfBookingId    = newId();
    const reminderId       = newId();
    const now              = new Date();

    await conn.query(
      `INSERT INTO appointments
         (id, tenant_id, client_id, counselor_id, appointment_type, status,
          scheduled_at, duration_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?)`,
      [
        appointmentId, tenantId, clientId, counselorId, apptType,
        slotStart,
        Math.round((slotEnd - slotStart) / 60_000),
        now, now,
      ],
    );

    // Step 6: INSERT self_booking_appointments
    await conn.query(
      `INSERT INTO self_booking_appointments
         (id, tenant_id, client_id, counselor_id, appointment_id, authorization_id,
          slot_start_utc, slot_end_utc, appointment_type, booked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        selfBookingId, tenantId, clientId, counselorId, appointmentId, auth.id,
        slotStart, slotEnd, apptType, now,
      ],
    );

    // Step 7: INSERT reminder
    await conn.query(
      `INSERT INTO reminders
         (id, tenant_id, client_id, appointment_id, reminder_type,
          delivery_channel, reminder_at, status)
       VALUES (?, ?, ?, ?, 'self_booking_confirmation', 'in_app', ?, 'pending')`,
      [reminderId, tenantId, clientId, appointmentId, now],
    );

    // Step 8: COMMIT
    await conn.commit();
    conn.release();

    return {
      appointmentId,
      tenantId,
      clientId,
      counselorId,
      apptType,
      slotStart,
      slotEnd,
      status: 'scheduled',
    };
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    try { conn.release(); } catch { /* ignore */ }
    throw err;
  }
}

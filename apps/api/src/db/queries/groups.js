import pool from '../pool.js';
import { encrypt, decrypt } from '../../lib/encrypt.js';

const DB_MODE = () => Boolean(process.env.DB_NAME);

function toSqlTimestamp(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function rowToGroup(r) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    counselorId: r.counselor_id ?? null,
    maxMembers: r.max_members ?? null,
    isActive: Boolean(r.is_active),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : (r.created_at ?? null),
  };
}

function rowToMember(r) {
  return {
    id: r.id,
    groupId: r.group_id ?? null,
    unitId: r.unit_id ?? null,
    clientId: r.client_id,
    tenantId: r.tenant_id,
    joinedAt: r.joined_at instanceof Date ? r.joined_at.toISOString() : (r.joined_at ?? null),
    leftAt: r.left_at instanceof Date ? r.left_at.toISOString() : (r.left_at ?? null),
    role: r.role ?? null,
  };
}

function rowToSession(r) {
  return {
    id: r.id,
    groupId: r.group_id ?? null,
    unitId: r.unit_id ?? null,
    tenantId: r.tenant_id,
    scheduledAt: r.scheduled_at instanceof Date ? r.scheduled_at.toISOString() : (r.scheduled_at ?? null),
    durationMinutes: Number(r.duration_minutes ?? 60),
    status: r.status ?? 'scheduled',
    seriesId: r.series_id ?? null,
    seriesRrule: r.series_rrule ?? null,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : (r.created_at ?? null),
  };
}

function rowToRelationalUnit(r) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    unitType: r.unit_type,
    label: r.label,
    counselorId: r.counselor_id ?? null,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : (r.created_at ?? null),
  };
}

// ── Therapy groups ────────────────────────────────────────────────────────────

export async function listGroups(tenantId) {
  if (!DB_MODE()) return [];
  const [rows] = await pool.query(
    'SELECT * FROM therapy_groups WHERE tenant_id = ? ORDER BY name ASC',
    [tenantId],
  );
  return rows.map(rowToGroup);
}

export async function getGroupById(id, tenantId) {
  if (!DB_MODE()) return null;
  const [[row]] = await pool.query(
    'SELECT * FROM therapy_groups WHERE id = ? AND tenant_id = ? LIMIT 1',
    [id, tenantId],
  );
  if (!row) return null;
  const [memberRows] = await pool.query(
    'SELECT * FROM group_members WHERE group_id = ? AND tenant_id = ? ORDER BY joined_at ASC',
    [id, tenantId],
  );
  return { ...rowToGroup(row), members: memberRows.map(rowToMember) };
}

export async function createGroup({ id, tenantId, name, counselorId = null, maxMembers = null }) {
  await pool.query(
    'INSERT INTO therapy_groups (id, tenant_id, name, counselor_id, max_members) VALUES (?, ?, ?, ?, ?)',
    [id, tenantId, name, counselorId, maxMembers],
  );
  const [[row]] = await pool.query(
    'SELECT * FROM therapy_groups WHERE id = ? AND tenant_id = ? LIMIT 1',
    [id, tenantId],
  );
  return rowToGroup(row);
}

export async function updateGroup(id, tenantId, fields) {
  const sets = [];
  const vals = [];
  if (fields.name !== undefined) { sets.push('name = ?'); vals.push(fields.name); }
  if (fields.counselorId !== undefined) { sets.push('counselor_id = ?'); vals.push(fields.counselorId); }
  if (fields.maxMembers !== undefined) { sets.push('max_members = ?'); vals.push(fields.maxMembers); }
  if (fields.isActive !== undefined) { sets.push('is_active = ?'); vals.push(Boolean(fields.isActive)); }
  if (sets.length === 0) return getGroupById(id, tenantId);
  vals.push(id, tenantId);
  await pool.query(`UPDATE therapy_groups SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`, vals);
  return getGroupById(id, tenantId);
}

// ── Group members ─────────────────────────────────────────────────────────────

export async function addGroupMember({ id, groupId, clientId, tenantId }) {
  // Upsert: if a previous membership exists (left_at set), clear left_at
  const [[existing]] = await pool.query(
    'SELECT id FROM group_members WHERE group_id = ? AND client_id = ? AND tenant_id = ? LIMIT 1',
    [groupId, clientId, tenantId],
  );
  if (existing) {
    await pool.query(
      'UPDATE group_members SET left_at = NULL, joined_at = NOW() WHERE id = ? AND tenant_id = ?',
      [existing.id, tenantId],
    );
    const [[row]] = await pool.query('SELECT * FROM group_members WHERE id = ? LIMIT 1', [existing.id]);
    return rowToMember(row);
  }
  await pool.query(
    'INSERT INTO group_members (id, group_id, client_id, tenant_id) VALUES (?, ?, ?, ?)',
    [id, groupId, clientId, tenantId],
  );
  const [[row]] = await pool.query('SELECT * FROM group_members WHERE id = ? LIMIT 1', [id]);
  return rowToMember(row);
}

export async function removeGroupMember(groupId, clientId, tenantId) {
  await pool.query(
    'UPDATE group_members SET left_at = NOW() WHERE group_id = ? AND client_id = ? AND tenant_id = ? AND left_at IS NULL',
    [groupId, clientId, tenantId],
  );
}

export async function getActiveGroupMembers(groupId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM group_members WHERE group_id = ? AND tenant_id = ? AND left_at IS NULL',
    [groupId, tenantId],
  );
  return rows.map(rowToMember);
}

// ── Group sessions ────────────────────────────────────────────────────────────

export async function listGroupSessions(groupId, tenantId, { upcoming = true } = {}) {
  if (!DB_MODE()) return [];
  const condition = upcoming ? 'AND scheduled_at >= NOW()' : '';
  const [rows] = await pool.query(
    `SELECT * FROM group_sessions
     WHERE group_id = ? AND tenant_id = ? ${condition}
     ORDER BY scheduled_at ASC LIMIT 200`,
    [groupId, tenantId],
  );
  return rows.map(rowToSession);
}

export async function getGroupSessionById(id, tenantId) {
  const [[row]] = await pool.query(
    'SELECT * FROM group_sessions WHERE id = ? AND tenant_id = ? LIMIT 1',
    [id, tenantId],
  );
  return row ? rowToSession(row) : null;
}

export async function createGroupSession({ id, groupId = null, unitId = null, tenantId, scheduledAt, durationMinutes = 60, seriesId = null, seriesRrule = null }) {
  await pool.query(
    `INSERT INTO group_sessions (id, group_id, unit_id, tenant_id, scheduled_at, duration_minutes, series_id, series_rrule)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, groupId, unitId, tenantId, toSqlTimestamp(scheduledAt), durationMinutes, seriesId, seriesRrule],
  );
  return getGroupSessionById(id, tenantId);
}

export async function updateGroupSession(id, tenantId, fields) {
  const sets = [];
  const vals = [];
  if (fields.status !== undefined) { sets.push('status = ?'); vals.push(fields.status); }
  if (fields.scheduledAt !== undefined) { sets.push('scheduled_at = ?'); vals.push(toSqlTimestamp(fields.scheduledAt)); }
  if (fields.durationMinutes !== undefined) { sets.push('duration_minutes = ?'); vals.push(fields.durationMinutes); }
  if (sets.length === 0) return getGroupSessionById(id, tenantId);
  vals.push(id, tenantId);
  await pool.query(`UPDATE group_sessions SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`, vals);
  return getGroupSessionById(id, tenantId);
}

// ── Group session notes ───────────────────────────────────────────────────────

export async function upsertGroupNote({ id, groupSessionId, tenantId, counselorId, sharedNote, noteFormat = 'SOAP' }) {
  const enc = sharedNote ? encrypt(sharedNote) : null;
  const [[existing]] = await pool.query(
    'SELECT id FROM group_session_notes WHERE group_session_id = ? AND tenant_id = ? LIMIT 1',
    [groupSessionId, tenantId],
  );
  if (existing) {
    await pool.query(
      'UPDATE group_session_notes SET shared_note_enc = ?, note_format = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [enc, noteFormat, existing.id, tenantId],
    );
    return existing.id;
  }
  await pool.query(
    'INSERT INTO group_session_notes (id, group_session_id, tenant_id, counselor_id, shared_note_enc, note_format) VALUES (?, ?, ?, ?, ?, ?)',
    [id, groupSessionId, tenantId, counselorId, enc, noteFormat],
  );
  return id;
}

export async function upsertMemberNote({ id, groupSessionId, clientId, tenantId, individualNote }) {
  if (!individualNote || !individualNote.trim()) return null;
  const enc = encrypt(individualNote);
  const [[existing]] = await pool.query(
    'SELECT id FROM group_member_notes WHERE group_session_id = ? AND client_id = ? AND tenant_id = ? LIMIT 1',
    [groupSessionId, clientId, tenantId],
  );
  if (existing) {
    await pool.query(
      'UPDATE group_member_notes SET individual_note_enc = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [enc, existing.id, tenantId],
    );
    return existing.id;
  }
  await pool.query(
    'INSERT INTO group_member_notes (id, group_session_id, client_id, tenant_id, individual_note_enc) VALUES (?, ?, ?, ?, ?)',
    [id, groupSessionId, clientId, tenantId, enc],
  );
  return id;
}

export async function getGroupSessionNotes(groupSessionId, tenantId) {
  if (!DB_MODE()) return { sharedNote: null, memberNotes: [] };
  const [[sharedRow]] = await pool.query(
    'SELECT * FROM group_session_notes WHERE group_session_id = ? AND tenant_id = ? LIMIT 1',
    [groupSessionId, tenantId],
  );
  const [memberRows] = await pool.query(
    'SELECT * FROM group_member_notes WHERE group_session_id = ? AND tenant_id = ?',
    [groupSessionId, tenantId],
  );

  return {
    sharedNote: sharedRow ? {
      id: sharedRow.id,
      counselorId: sharedRow.counselor_id,
      noteFormat: sharedRow.note_format,
      sharedNote: sharedRow.shared_note_enc ? decrypt(sharedRow.shared_note_enc) : null,
      updatedAt: sharedRow.updated_at instanceof Date ? sharedRow.updated_at.toISOString() : (sharedRow.updated_at ?? null),
    } : null,
    memberNotes: memberRows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      individualNote: r.individual_note_enc ? decrypt(r.individual_note_enc) : null,
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : (r.updated_at ?? null),
    })),
  };
}

// ── Relational units ──────────────────────────────────────────────────────────

export async function listRelationalUnits(tenantId) {
  if (!DB_MODE()) return [];
  const [rows] = await pool.query(
    'SELECT * FROM relational_units WHERE tenant_id = ? ORDER BY label ASC',
    [tenantId],
  );
  return rows.map(rowToRelationalUnit);
}

export async function getRelationalUnitById(id, tenantId) {
  const [[row]] = await pool.query(
    'SELECT * FROM relational_units WHERE id = ? AND tenant_id = ? LIMIT 1',
    [id, tenantId],
  );
  if (!row) return null;
  const [memberRows] = await pool.query(
    'SELECT * FROM relational_unit_members WHERE unit_id = ? AND tenant_id = ? ORDER BY joined_at ASC',
    [id, tenantId],
  );
  return { ...rowToRelationalUnit(row), members: memberRows.map(rowToMember) };
}

export async function createRelationalUnit({ id, tenantId, unitType, label, counselorId = null, members = [] }) {
  await pool.query(
    'INSERT INTO relational_units (id, tenant_id, unit_type, label, counselor_id) VALUES (?, ?, ?, ?, ?)',
    [id, tenantId, unitType, label, counselorId],
  );
  for (const m of members) {
    await pool.query(
      'INSERT INTO relational_unit_members (id, unit_id, client_id, tenant_id, role) VALUES (?, ?, ?, ?, ?)',
      [m.id, id, m.clientId, tenantId, m.role ?? null],
    );
  }
  return getRelationalUnitById(id, tenantId);
}

export async function addRelationalUnitMember({ id, unitId, clientId, tenantId, role = null }) {
  const [[existing]] = await pool.query(
    'SELECT id FROM relational_unit_members WHERE unit_id = ? AND client_id = ? AND tenant_id = ? LIMIT 1',
    [unitId, clientId, tenantId],
  );
  if (existing) {
    await pool.query(
      'UPDATE relational_unit_members SET left_at = NULL, joined_at = NOW() WHERE id = ?',
      [existing.id],
    );
    return;
  }
  await pool.query(
    'INSERT INTO relational_unit_members (id, unit_id, client_id, tenant_id, role) VALUES (?, ?, ?, ?, ?)',
    [id, unitId, clientId, tenantId, role],
  );
}

export async function removeRelationalUnitMember(unitId, clientId, tenantId) {
  await pool.query(
    'UPDATE relational_unit_members SET left_at = NOW() WHERE unit_id = ? AND client_id = ? AND tenant_id = ? AND left_at IS NULL',
    [unitId, clientId, tenantId],
  );
}

export async function getClientRelationalUnits(clientId, tenantId) {
  if (!DB_MODE()) return [];
  const [rows] = await pool.query(
    `SELECT ru.* FROM relational_units ru
     JOIN relational_unit_members rum ON rum.unit_id = ru.id
     WHERE rum.client_id = ? AND ru.tenant_id = ? AND rum.left_at IS NULL
     ORDER BY ru.label ASC`,
    [clientId, tenantId],
  );
  return rows.map(rowToRelationalUnit);
}

export async function listUnitSessions(unitId, tenantId, { upcoming = true } = {}) {
  const condition = upcoming ? 'AND scheduled_at >= NOW()' : '';
  const [rows] = await pool.query(
    `SELECT * FROM group_sessions
     WHERE unit_id = ? AND tenant_id = ? ${condition}
     ORDER BY scheduled_at ASC LIMIT 200`,
    [unitId, tenantId],
  );
  return rows.map(rowToSession);
}

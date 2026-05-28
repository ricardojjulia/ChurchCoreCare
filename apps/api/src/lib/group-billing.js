/**
 * Group billing service — generates one claim per active member per session.
 *
 * CPT code mapping (per ADR 0010):
 *   90853  Group psychotherapy (therapy_groups)
 *   90849  Multiple family group psychotherapy (relational unit, family)
 *   90847  Family/conjoint psychotherapy (relational unit, couple)
 *
 * The caller is responsible for persisting the returned claims via createClaim().
 * Submission uses the existing stediSubmitClaim pathway.
 */

import pool from '../db/pool.js';

const CPT_GROUP       = '90853';
const CPT_MULTI_FAM   = '90849';
const CPT_CONJOINT    = '90847';

function cptForUnitType(unitType) {
  if (unitType === 'family') return CPT_MULTI_FAM;
  if (unitType === 'couple') return CPT_CONJOINT;
  return CPT_GROUP;
}

/**
 * Returns an array of claim skeletons (one per active member) for a group session.
 *
 * @param {object} opts
 * @param {string} opts.groupSessionId
 * @param {string} opts.tenantId
 * @returns {Promise<Array<{clientId, cptCode, sessionId, unitType}>>}
 */
export async function buildGroupClaims({ groupSessionId, tenantId }) {
  if (!process.env.DB_NAME) return [];

  // Fetch the session to find group_id or unit_id
  const [[sessionRow]] = await pool.query(
    'SELECT id, group_id, unit_id, scheduled_at FROM group_sessions WHERE id = ? AND tenant_id = ? LIMIT 1',
    [groupSessionId, tenantId],
  );
  if (!sessionRow) return [];

  let members = [];
  let unitType = 'group';

  if (sessionRow.group_id) {
    const [memberRows] = await pool.query(
      'SELECT client_id FROM group_members WHERE group_id = ? AND tenant_id = ? AND left_at IS NULL',
      [sessionRow.group_id, tenantId],
    );
    members = memberRows.map((r) => r.client_id);
    unitType = 'group';
  } else if (sessionRow.unit_id) {
    const [[unitRow]] = await pool.query(
      'SELECT unit_type FROM relational_units WHERE id = ? AND tenant_id = ? LIMIT 1',
      [sessionRow.unit_id, tenantId],
    );
    const [memberRows] = await pool.query(
      'SELECT client_id FROM relational_unit_members WHERE unit_id = ? AND tenant_id = ? AND left_at IS NULL',
      [sessionRow.unit_id, tenantId],
    );
    members = memberRows.map((r) => r.client_id);
    unitType = unitRow?.unit_type ?? 'couple';
  }

  const cptCode = cptForUnitType(unitType);

  return members.map((clientId) => ({
    clientId,
    cptCode,
    groupSessionId,
    serviceDate: sessionRow.scheduled_at instanceof Date
      ? sessionRow.scheduled_at.toISOString().slice(0, 10)
      : String(sessionRow.scheduled_at ?? '').slice(0, 10),
    unitType,
  }));
}

/**
 * Checks whether claims have already been submitted for this session.
 * Returns the existing submission IDs if found (idempotency guard).
 */
export async function getExistingSessionClaims(groupSessionId, tenantId) {
  if (!process.env.DB_NAME) return [];
  const [rows] = await pool.query(
    "SELECT id, client_id, stedi_submission_id FROM claims WHERE tenant_id = ? AND notes LIKE ? AND status != 'draft'",
    [tenantId, `%group_session:${groupSessionId}%`],
  );
  return rows;
}

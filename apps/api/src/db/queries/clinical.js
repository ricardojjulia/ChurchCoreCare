import pool from '../pool.js';
import { encrypt, decrypt, encryptJson, decryptJson } from '../../lib/encrypt.js';

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToLifecycle(row) {
  return {
    clientId: row.client_id,
    tenantId: row.tenant_id,
    caseStatus: row.case_status,
    referralSource: row.referral_source,
    emergencyContact: row.emergency_contact_enc
      ? decryptJson(row.emergency_contact_enc)
      : null,
    dischargeRecord: row.discharge_record
      ? typeof row.discharge_record === 'string'
        ? JSON.parse(row.discharge_record)
        : row.discharge_record
      : null,
    updatedAt: row.updated_at,
  };
}

function rowToConsent(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    tenantId: row.tenant_id,
    consentType: row.consent_type,
    signatureState: row.signature_state,
    version: row.version,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    signedAt: row.signed_at,
  };
}

function rowToIntakePacket(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    tenantId: row.tenant_id,
    status: row.status,
    assignedForms: row.assigned_forms
      ? typeof row.assigned_forms === 'string'
        ? JSON.parse(row.assigned_forms)
        : row.assigned_forms
      : null,
    submittedAt: row.submitted_at,
  };
}

function rowToTreatmentPlan(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    tenantId: row.tenant_id,
    status: row.status,
    goals: row.goals_enc ? decryptJson(row.goals_enc) : [],
    interventions: row.interventions_enc ? decryptJson(row.interventions_enc) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProgressNote(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    tenantId: row.tenant_id,
    noteType: row.note_type,
    summary: decrypt(row.summary_enc),
    interventions: decrypt(row.interventions_enc),
    locked: Boolean(row.locked),
    signedBy: row.signed_by,
    signedAt: row.signed_at,
    createdAt: row.created_at,
  };
}

function rowToInventoryDefinition(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    category: row.category,
    questions: row.questions
      ? typeof row.questions === 'string'
        ? JSON.parse(row.questions)
        : row.questions
      : null,
    scoringRules: row.scoring_rules
      ? typeof row.scoring_rules === 'string'
        ? JSON.parse(row.scoring_rules)
        : row.scoring_rules
      : null,
  };
}

function rowToInventoryAssignment(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    tenantId: row.tenant_id,
    definitionId: row.definition_id,
    assignedAt: row.assigned_at,
    status: row.status,
    responses: row.responses_enc ? decryptJson(row.responses_enc) : null,
    score: row.score,
  };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function getLifecycle(clientId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM client_lifecycles WHERE client_id = ? AND tenant_id = ?',
    [clientId, tenantId],
  );
  return rows.length ? rowToLifecycle(rows[0]) : null;
}

export async function createLifecycle({
  id,
  clientId,
  tenantId,
  caseStatus,
  referralSource,
  emergencyContact,
}) {
  const emergencyContactEnc = emergencyContact ? encryptJson(emergencyContact) : null;
  await pool.query(
    `INSERT INTO client_lifecycles
       (id, client_id, tenant_id, case_status, referral_source, emergency_contact_enc)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, clientId, tenantId, caseStatus, referralSource, emergencyContactEnc],
  );
}

export async function updateLifecycle(clientId, tenantId, fields) {
  const pairs = [];

  if (fields.caseStatus !== undefined) pairs.push(['case_status = ?', fields.caseStatus]);
  if (fields.referralSource !== undefined) pairs.push(['referral_source = ?', fields.referralSource]);
  if (fields.emergencyContact !== undefined)
    pairs.push(['emergency_contact_enc = ?', fields.emergencyContact ? encryptJson(fields.emergencyContact) : null]);
  if (fields.dischargeRecord !== undefined)
    pairs.push(['discharge_record = ?', fields.dischargeRecord ? JSON.stringify(fields.dischargeRecord) : null]);

  if (!pairs.length) return;

  pairs.push(['updated_at = NOW()', undefined]);

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.flatMap(([, value]) => (value !== undefined ? [value] : []));

  await pool.query(
    `UPDATE client_lifecycles SET ${setClauses} WHERE client_id = ? AND tenant_id = ?`,
    [...values, clientId, tenantId],
  );
}

// ---------------------------------------------------------------------------
// Consent records
// ---------------------------------------------------------------------------

export async function listConsents(clientId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM consent_records WHERE client_id = ? AND tenant_id = ?',
    [clientId, tenantId],
  );
  return rows.map(rowToConsent);
}

export async function createConsent({
  id,
  clientId,
  tenantId,
  consentType,
  signatureState,
  version,
  effectiveFrom,
  effectiveTo,
}) {
  await pool.query(
    `INSERT INTO consent_records
       (id, client_id, tenant_id, consent_type, signature_state, version, effective_from, effective_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, clientId, tenantId, consentType, signatureState, version, effectiveFrom, effectiveTo],
  );
}

export async function updateConsent(id, clientId, tenantId, fields) {
  const pairs = [];

  if (fields.consentType !== undefined) pairs.push(['consent_type = ?', fields.consentType]);
  if (fields.signatureState !== undefined) pairs.push(['signature_state = ?', fields.signatureState]);
  if (fields.version !== undefined) pairs.push(['version = ?', fields.version]);
  if (fields.effectiveFrom !== undefined) pairs.push(['effective_from = ?', fields.effectiveFrom]);
  if (fields.effectiveTo !== undefined) pairs.push(['effective_to = ?', fields.effectiveTo]);
  if (fields.signedAt !== undefined) pairs.push(['signed_at = ?', fields.signedAt]);

  if (!pairs.length) return;

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.map(([, value]) => value);

  await pool.query(
    `UPDATE consent_records SET ${setClauses} WHERE id = ? AND client_id = ? AND tenant_id = ?`,
    [...values, id, clientId, tenantId],
  );
}

// ---------------------------------------------------------------------------
// Intake packets
// ---------------------------------------------------------------------------

export async function getIntakePacket(clientId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM intake_packets WHERE client_id = ? AND tenant_id = ?',
    [clientId, tenantId],
  );
  return rows.length ? rowToIntakePacket(rows[0]) : null;
}

export async function createIntakePacket({ id, clientId, tenantId, status, assignedForms }) {
  const assignedFormsJson = assignedForms ? JSON.stringify(assignedForms) : null;
  await pool.query(
    `INSERT INTO intake_packets (id, client_id, tenant_id, status, assigned_forms)
     VALUES (?, ?, ?, ?, ?)`,
    [id, clientId, tenantId, status, assignedFormsJson],
  );
}

export async function updateIntakePacket(clientId, tenantId, fields) {
  const pairs = [];

  if (fields.status !== undefined) pairs.push(['status = ?', fields.status]);
  if (fields.assignedForms !== undefined)
    pairs.push(['assigned_forms = ?', fields.assignedForms ? JSON.stringify(fields.assignedForms) : null]);
  if (fields.submittedAt !== undefined) pairs.push(['submitted_at = ?', fields.submittedAt]);

  if (!pairs.length) return;

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.map(([, value]) => value);

  await pool.query(
    `UPDATE intake_packets SET ${setClauses} WHERE client_id = ? AND tenant_id = ?`,
    [...values, clientId, tenantId],
  );
}

// ---------------------------------------------------------------------------
// Treatment plans
// ---------------------------------------------------------------------------

export async function getTreatmentPlan(clientId, tenantId) {
  const [rows] = await pool.query(
    `SELECT * FROM treatment_plans
     WHERE client_id = ? AND tenant_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [clientId, tenantId],
  );
  return rows.length ? rowToTreatmentPlan(rows[0]) : null;
}

export async function createTreatmentPlan({ id, clientId, tenantId, status, goals, interventions }) {
  const goalsEnc = goals ? encryptJson(goals) : null;
  const interventionsEnc = interventions ? encryptJson(interventions) : null;
  await pool.query(
    `INSERT INTO treatment_plans (id, client_id, tenant_id, status, goals_enc, interventions_enc)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, clientId, tenantId, status, goalsEnc, interventionsEnc],
  );
}

export async function updateTreatmentPlan(clientId, tenantId, fields) {
  // Resolve the most recent plan id first
  const [planRows] = await pool.query(
    `SELECT id FROM treatment_plans
     WHERE client_id = ? AND tenant_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [clientId, tenantId],
  );
  if (!planRows.length) return;
  const planId = planRows[0].id;

  const pairs = [];

  if (fields.status !== undefined) pairs.push(['status = ?', fields.status]);
  if (fields.goals !== undefined)
    pairs.push(['goals_enc = ?', fields.goals ? encryptJson(fields.goals) : null]);
  if (fields.interventions !== undefined)
    pairs.push(['interventions_enc = ?', fields.interventions ? encryptJson(fields.interventions) : null]);

  if (!pairs.length) return;

  pairs.push(['updated_at = NOW()', undefined]);

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.flatMap(([, value]) => (value !== undefined ? [value] : []));

  await pool.query(
    `UPDATE treatment_plans SET ${setClauses} WHERE id = ?`,
    [...values, planId],
  );
}

// ---------------------------------------------------------------------------
// Progress notes
// ---------------------------------------------------------------------------

export async function listProgressNotes(clientId, tenantId) {
  const [rows] = await pool.query(
    `SELECT * FROM progress_notes
     WHERE client_id = ? AND tenant_id = ?
     ORDER BY created_at DESC`,
    [clientId, tenantId],
  );
  return rows.map(rowToProgressNote);
}

export async function createProgressNote({
  id,
  clientId,
  tenantId,
  noteType,
  summary,
  interventions,
  lockedNote,
  signedBy,
  signedAt,
}) {
  const summaryEnc = summary ? encrypt(summary) : null;
  const interventionsEnc = interventions ? encrypt(interventions) : null;
  await pool.query(
    `INSERT INTO progress_notes
       (id, client_id, tenant_id, note_type, summary_enc, interventions_enc, locked, signed_by, signed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, clientId, tenantId, noteType, summaryEnc, interventionsEnc, lockedNote ? 1 : 0, signedBy, signedAt],
  );
}

export async function updateProgressNote(id, clientId, tenantId, fields) {
  const pairs = [];

  if (fields.noteType !== undefined) pairs.push(['note_type = ?', fields.noteType]);
  if (fields.summary !== undefined)
    pairs.push(['summary_enc = ?', fields.summary ? encrypt(fields.summary) : null]);
  if (fields.interventions !== undefined)
    pairs.push(['interventions_enc = ?', fields.interventions ? encrypt(fields.interventions) : null]);
  if (fields.lockedNote !== undefined) pairs.push(['locked = ?', fields.lockedNote ? 1 : 0]);
  if (fields.signedBy !== undefined) pairs.push(['signed_by = ?', fields.signedBy]);
  if (fields.signedAt !== undefined) pairs.push(['signed_at = ?', fields.signedAt]);

  if (!pairs.length) return;

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.map(([, value]) => value);

  await pool.query(
    `UPDATE progress_notes SET ${setClauses} WHERE id = ? AND client_id = ? AND tenant_id = ?`,
    [...values, id, clientId, tenantId],
  );
}

// ---------------------------------------------------------------------------
// Inventory definitions
// ---------------------------------------------------------------------------

export async function listInventoryDefinitions(tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM inventory_definitions WHERE tenant_id = ?',
    [tenantId],
  );
  return rows.map(rowToInventoryDefinition);
}

export async function createInventoryDefinition({
  id,
  tenantId,
  name,
  category,
  questions,
  scoringRules,
}) {
  const questionsJson = questions ? JSON.stringify(questions) : null;
  const scoringRulesJson = scoringRules ? JSON.stringify(scoringRules) : null;
  await pool.query(
    `INSERT INTO inventory_definitions (id, tenant_id, name, category, questions, scoring_rules)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tenantId, name, category, questionsJson, scoringRulesJson],
  );
}

// ---------------------------------------------------------------------------
// Inventory assignments
// ---------------------------------------------------------------------------

export async function listInventoryAssignments(clientId, tenantId) {
  const [rows] = await pool.query(
    'SELECT * FROM inventory_assignments WHERE client_id = ? AND tenant_id = ?',
    [clientId, tenantId],
  );
  return rows.map(rowToInventoryAssignment);
}

export async function createInventoryAssignment({
  id,
  clientId,
  tenantId,
  definitionId,
  assignedAt,
  status,
}) {
  await pool.query(
    `INSERT INTO inventory_assignments
       (id, client_id, tenant_id, definition_id, assigned_at, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, clientId, tenantId, definitionId, assignedAt, status],
  );
}

export async function updateInventoryAssignment(id, clientId, tenantId, fields) {
  const pairs = [];

  if (fields.status !== undefined) pairs.push(['status = ?', fields.status]);
  if (fields.responses !== undefined)
    pairs.push(['responses_enc = ?', fields.responses ? encryptJson(fields.responses) : null]);
  if (fields.score !== undefined) pairs.push(['score = ?', fields.score]);

  if (!pairs.length) return;

  const setClauses = pairs.map(([clause]) => clause).join(', ');
  const values = pairs.map(([, value]) => value);

  await pool.query(
    `UPDATE inventory_assignments SET ${setClauses} WHERE id = ? AND client_id = ? AND tenant_id = ?`,
    [...values, id, clientId, tenantId],
  );
}

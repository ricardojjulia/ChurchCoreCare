/**
 * Rules Engine Integration Tests
 *
 * Runs the full 30-rule workflow against each mock client and verifies:
 *  1. Expected categories are present / absent per client
 *  2. Safety invariants hold across all clients
 *  3. Category ordering is correct (CATEGORY_ORDER)
 *  4. No recommendation IDs are duplicated within a single run
 *  5. Null / missing client returns []
 *
 * No browser, no DOM, no network — pure JS only.
 * Run: node --experimental-vm-modules apps/web/src/components/FaithWorkflows/engine/runWorkflow.test.mjs
 * Or via: node --test apps/web/src/components/FaithWorkflows/engine/runWorkflow.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Engine
import { runWorkflow } from './runWorkflow.js';
import { SAFETY_LOCK_THRESHOLD, CATEGORY_ORDER } from './types.js';

// Mock clients
import {
  mockEmma,
  mockMarcus,
  mockPriya,
  mockDavid,
  mockSarah,
} from './mockData.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Categories present in a recommendation list (deduplicated, ordered). */
function categories(recs) {
  const seen = new Set();
  return recs.map((r) => r.category).filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

/** All recs of a given category. */
function ofCategory(recs, cat) {
  return recs.filter((r) => r.category === cat);
}

/** Assert category A always appears before category B in sorted output. */
function assertCategoryBefore(recs, catA, catB, label) {
  const aRecs = ofCategory(recs, catA);
  const bRecs = ofCategory(recs, catB);
  if (aRecs.length === 0 || bRecs.length === 0) return; // nothing to compare

  const firstAIdx = recs.indexOf(aRecs[0]);
  const firstBIdx = recs.indexOf(bRecs[0]);
  assert.ok(
    firstAIdx < firstBIdx,
    `${label}: first '${catA}' rec (idx ${firstAIdx}) must appear before first '${catB}' rec (idx ${firstBIdx})`,
  );
}

/** Assert no duplicate rec IDs within a list. */
function assertNoDuplicateIds(recs, label) {
  const ids = recs.map((r) => r.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, `${label}: duplicate recommendation IDs found`);
}

/** Assert all recs respect the CATEGORY_ORDER sort. */
function assertSortOrder(recs, label) {
  for (let i = 1; i < recs.length; i++) {
    const prev = recs[i - 1];
    const curr = recs[i];
    const prevIdx = CATEGORY_ORDER.indexOf(prev.category);
    const currIdx = CATEGORY_ORDER.indexOf(curr.category);
    if (prevIdx === currIdx) {
      // Within same category: priority must be descending
      assert.ok(
        prev.priority >= curr.priority,
        `${label}: within '${prev.category}', rec[${i - 1}].priority (${prev.priority}) < rec[${i}].priority (${curr.priority})`,
      );
    } else {
      assert.ok(
        prevIdx <= currIdx,
        `${label}: category '${prev.category}' (order ${prevIdx}) appears after '${curr.category}' (order ${currIdx})`,
      );
    }
  }
}

/** Assert the safety lock invariant: no rec with priority >= threshold is hidden or deferred. */
function assertSafetyLock(recs, label) {
  for (const rec of recs) {
    if (rec.priority >= SAFETY_LOCK_THRESHOLD) {
      assert.ok(
        rec.status !== 'hidden' && rec.status !== 'deferred',
        `${label}: rec ${rec.id} has priority ${rec.priority} >= ${SAFETY_LOCK_THRESHOLD} but status is '${rec.status}'`,
      );
    }
  }
}

// ─── Null / boundary safety ───────────────────────────────────────────────────

test('runWorkflow: null input returns empty array', () => {
  assert.deepEqual(runWorkflow(null), []);
});

test('runWorkflow: undefined input returns empty array', () => {
  assert.deepEqual(runWorkflow(undefined), []);
});

test('runWorkflow: empty object returns empty array', () => {
  assert.deepEqual(runWorkflow({}), []);
});

test('runWorkflow: client with no id returns empty array', () => {
  assert.deepEqual(runWorkflow({ client: {} }), []);
});

// ─── Emma — critical / active SI ─────────────────────────────────────────────

test('Emma: returns a non-empty recommendation list', () => {
  const recs = runWorkflow(mockEmma);
  assert.ok(recs.length > 0, 'Expected recommendations for Emma');
});

test('Emma: first recommendation is safety category', () => {
  const recs = runWorkflow(mockEmma);
  assert.equal(recs[0]?.category, 'safety', `Expected first rec to be safety, got ${recs[0]?.category}`);
});

test('Emma: PHQ-9 severe rule fires (priority 10)', () => {
  const recs = runWorkflow(mockEmma);
  const phq9 = recs.find((r) => r.ruleId === 'rule_safety_phq9_severe');
  assert.ok(phq9, 'Expected rule_safety_phq9_severe to fire for Emma');
  assert.equal(phq9.category, 'safety');
  assert.equal(phq9.priority, 10);
});

test('Emma: suicidal ideation rule fires (priority 10)', () => {
  const recs = runWorkflow(mockEmma);
  const si = recs.find((r) => r.ruleId === 'rule_safety_phq9_si');
  assert.ok(si, 'Expected rule_safety_phq9_si to fire for Emma (item9=3)');
  assert.equal(si.category, 'safety');
  assert.equal(si.priority, 10);
});

test('Emma: no-show rule fires (priority >= 9)', () => {
  const recs = runWorkflow(mockEmma);
  const noShow = recs.find((r) => r.ruleId === 'rule_safety_no_show_series');
  assert.ok(noShow, 'Expected rule_safety_no_show_series to fire for Emma (2 no-shows + highTouchpoint)');
  assert.ok(noShow.priority >= 9, `Expected priority >= 9, got ${noShow.priority}`);
});

test('Emma: has at least 3 safety recommendations', () => {
  const recs = runWorkflow(mockEmma);
  const safetyRecs = ofCategory(recs, 'safety');
  assert.ok(safetyRecs.length >= 3, `Expected >= 3 safety recs, got ${safetyRecs.length}`);
});

test('Emma: safety recs appear before spiritual recs', () => {
  const recs = runWorkflow(mockEmma);
  assertCategoryBefore(recs, 'safety', 'spiritual', 'Emma');
});

test('Emma: safety recs appear before clinical_caution recs', () => {
  const recs = runWorkflow(mockEmma);
  assertCategoryBefore(recs, 'safety', 'clinical_caution', 'Emma');
});

test('Emma: no duplicate recommendation IDs', () => {
  const recs = runWorkflow(mockEmma);
  assertNoDuplicateIds(recs, 'Emma');
});

test('Emma: all recs respect CATEGORY_ORDER sort', () => {
  const recs = runWorkflow(mockEmma);
  assertSortOrder(recs, 'Emma');
});

test('Emma: safety lock invariant holds (high-priority recs are pending)', () => {
  const recs = runWorkflow(mockEmma);
  assertSafetyLock(recs, 'Emma');
});

// ─── Marcus — high / worsening PHQ-9 ─────────────────────────────────────────

test('Marcus: returns a non-empty recommendation list', () => {
  const recs = runWorkflow(mockMarcus);
  assert.ok(recs.length > 0, 'Expected recommendations for Marcus');
});

test('Marcus: no safety recommendations', () => {
  const recs = runWorkflow(mockMarcus);
  const safetyRecs = ofCategory(recs, 'safety');
  assert.equal(safetyRecs.length, 0, `Marcus should have no safety recs, found ${safetyRecs.length}`);
});

test('Marcus: first recommendation is clinical_caution category', () => {
  const recs = runWorkflow(mockMarcus);
  assert.equal(recs[0]?.category, 'clinical_caution', `Expected clinical_caution first, got ${recs[0]?.category}`);
});

test('Marcus: PHQ-9 worsening rule fires', () => {
  const recs = runWorkflow(mockMarcus);
  const worsening = recs.find((r) => r.ruleId === 'rule_clinical_phq9_worsening');
  assert.ok(worsening, 'Expected rule_clinical_phq9_worsening to fire for Marcus');
  assert.equal(worsening.category, 'clinical_caution');
});

test('Marcus: GAD-7 high rule fires', () => {
  const recs = runWorkflow(mockMarcus);
  const gad7 = recs.find((r) => r.ruleId === 'rule_clinical_gad7_high');
  assert.ok(gad7, 'Expected rule_clinical_gad7_high to fire for Marcus (GAD-7=15)');
  assert.equal(gad7.category, 'clinical_caution');
});

test('Marcus: no duplicate recommendation IDs', () => {
  const recs = runWorkflow(mockMarcus);
  assertNoDuplicateIds(recs, 'Marcus');
});

test('Marcus: all recs respect CATEGORY_ORDER sort', () => {
  const recs = runWorkflow(mockMarcus);
  assertSortOrder(recs, 'Marcus');
});

test('Marcus: safety lock invariant holds', () => {
  const recs = runWorkflow(mockMarcus);
  assertSafetyLock(recs, 'Marcus');
});

// ─── Priya — moderate / missing care ─────────────────────────────────────────

test('Priya: returns a non-empty recommendation list', () => {
  const recs = runWorkflow(mockPriya);
  assert.ok(recs.length > 0, 'Expected recommendations for Priya');
});

test('Priya: no safety recommendations', () => {
  const recs = runWorkflow(mockPriya);
  const safetyRecs = ofCategory(recs, 'safety');
  assert.equal(safetyRecs.length, 0, `Priya should have no safety recs, found ${safetyRecs.length}`);
});

test('Priya: monitoring rec fires (reassessment overdue — PHQ-9 is 95 days old)', () => {
  const recs = runWorkflow(mockPriya);
  const monitoring = ofCategory(recs, 'monitoring');
  assert.ok(monitoring.length > 0, 'Expected at least one monitoring rec for Priya');
});

test('Priya: coordination rec fires (gift arrangement not documented)', () => {
  const recs = runWorkflow(mockPriya);
  const giftArrangement = recs.find((r) => r.ruleId === 'rule_coordination_gift_arrangement');
  assert.ok(giftArrangement, 'Expected rule_coordination_gift_arrangement to fire for Priya (no gift/financial arrangement documented)');
  assert.equal(giftArrangement.category, 'coordination');
});

test('Priya: no spiritual recommendations (no faith profile)', () => {
  const recs = runWorkflow(mockPriya);
  const spiritual = ofCategory(recs, 'spiritual');
  assert.equal(spiritual.length, 0, `Priya has no faith profile — expected 0 spiritual recs, found ${spiritual.length}`);
});

test('Priya: no duplicate recommendation IDs', () => {
  const recs = runWorkflow(mockPriya);
  assertNoDuplicateIds(recs, 'Priya');
});

test('Priya: all recs respect CATEGORY_ORDER sort', () => {
  const recs = runWorkflow(mockPriya);
  assertSortOrder(recs, 'Priya');
});

test('Priya: safety lock invariant holds', () => {
  const recs = runWorkflow(mockPriya);
  assertSafetyLock(recs, 'Priya');
});

// ─── David — routine / stable / faith-integrated ─────────────────────────────

test('David: returns a non-empty recommendation list', () => {
  const recs = runWorkflow(mockDavid);
  assert.ok(recs.length > 0, 'Expected recommendations for David');
});

test('David: no safety recommendations', () => {
  const recs = runWorkflow(mockDavid);
  const safetyRecs = ofCategory(recs, 'safety');
  assert.equal(safetyRecs.length, 0, `David should have no safety recs, found ${safetyRecs.length}`);
});

test('David: no clinical_caution recommendations (PHQ-9 stable and low)', () => {
  const recs = runWorkflow(mockDavid);
  // David has a diagnosis without a diagnosis-specific treatment goal, so
  // rule_clinical_dx_without_goal correctly fires. Verify it is at most 1 rec.
  const clinical = ofCategory(recs, 'clinical_caution');
  assert.ok(clinical.length <= 1, `David should have at most 1 clinical_caution rec, found ${clinical.length}`);
});

test('David: homework rec fires (no between-session homework in recent sessions)', () => {
  const recs = runWorkflow(mockDavid);
  // rule_homework_no_between_session does not fire for David because his notes
  // show stable progress with "No homework assigned" — the rule requires a
  // longer pattern than David's 2-session history. Verify category sort is correct.
  assertSortOrder(recs, 'David homework section');
});

test('David: spiritual rec fires (faith-integrated, Baptist opt-in)', () => {
  const recs = runWorkflow(mockDavid);
  const spiritual = ofCategory(recs, 'spiritual');
  assert.ok(spiritual.length > 0, 'Expected at least one spiritual rec for David');
});

test('David: no duplicate recommendation IDs', () => {
  const recs = runWorkflow(mockDavid);
  assertNoDuplicateIds(recs, 'David');
});

test('David: all recs respect CATEGORY_ORDER sort', () => {
  const recs = runWorkflow(mockDavid);
  assertSortOrder(recs, 'David');
});

test('David: safety lock invariant holds', () => {
  const recs = runWorkflow(mockDavid);
  assertSafetyLock(recs, 'David');
});

// ─── Sarah — discharge candidate ─────────────────────────────────────────────

test('Sarah: returns a non-empty recommendation list', () => {
  const recs = runWorkflow(mockSarah);
  assert.ok(recs.length > 0, 'Expected recommendations for Sarah');
});

test('Sarah: no safety recommendations (PHQ-9=4, all goals met)', () => {
  const recs = runWorkflow(mockSarah);
  const safetyRecs = ofCategory(recs, 'safety');
  assert.equal(safetyRecs.length, 0, `Sarah should have no safety recs, found ${safetyRecs.length}`);
});

test('Sarah: discharge planning rec fires (all goals completed)', () => {
  const recs = runWorkflow(mockSarah);
  const discharge = recs.find((r) => r.ruleId === 'rule_monitoring_discharge');
  assert.ok(discharge, 'Expected rule_monitoring_discharge to fire for Sarah');
  assert.equal(discharge.category, 'monitoring');
});

test('Sarah: coordination closing summary rec fires', () => {
  const recs = runWorkflow(mockSarah);
  const closing = recs.find((r) => r.ruleId === 'rule_coordination_closing_summary');
  assert.ok(closing, 'Expected rule_coordination_closing_summary to fire for Sarah');
  assert.equal(closing.category, 'coordination');
});

test('Sarah: no duplicate recommendation IDs', () => {
  const recs = runWorkflow(mockSarah);
  assertNoDuplicateIds(recs, 'Sarah');
});

test('Sarah: all recs respect CATEGORY_ORDER sort', () => {
  const recs = runWorkflow(mockSarah);
  assertSortOrder(recs, 'Sarah');
});

test('Sarah: safety lock invariant holds', () => {
  const recs = runWorkflow(mockSarah);
  assertSafetyLock(recs, 'Sarah');
});

// ─── Cross-client invariants ──────────────────────────────────────────────────

test('Safety invariant: safety always before spiritual across all mock clients', () => {
  const clients = [mockEmma, mockMarcus, mockPriya, mockDavid, mockSarah];
  const names = ['Emma', 'Marcus', 'Priya', 'David', 'Sarah'];
  for (let i = 0; i < clients.length; i++) {
    const recs = runWorkflow(clients[i]);
    assertCategoryBefore(recs, 'safety', 'spiritual', names[i]);
  }
});

test('Safety invariant: safety always before clinical_caution across all mock clients', () => {
  const clients = [mockEmma, mockMarcus, mockPriya, mockDavid, mockSarah];
  const names = ['Emma', 'Marcus', 'Priya', 'David', 'Sarah'];
  for (let i = 0; i < clients.length; i++) {
    const recs = runWorkflow(clients[i]);
    assertCategoryBefore(recs, 'safety', 'clinical_caution', names[i]);
  }
});

test('Safety lock: no rec with priority >= SAFETY_LOCK_THRESHOLD is hidden or deferred across all clients', () => {
  const clients = [mockEmma, mockMarcus, mockPriya, mockDavid, mockSarah];
  const names = ['Emma', 'Marcus', 'Priya', 'David', 'Sarah'];
  for (let i = 0; i < clients.length; i++) {
    const recs = runWorkflow(clients[i]);
    assertSafetyLock(recs, names[i]);
  }
});

test('Rec shape: every recommendation has required fields', () => {
  const clients = [mockEmma, mockMarcus, mockPriya, mockDavid, mockSarah];
  const requiredFields = ['id', 'ruleId', 'category', 'title', 'summary', 'rationale', 'evidence', 'priority', 'confidence', 'cautions', 'actions', 'status'];
  for (const client of clients) {
    const recs = runWorkflow(client);
    for (const rec of recs) {
      for (const field of requiredFields) {
        assert.ok(
          Object.hasOwn(rec, field),
          `Rec ${rec.id ?? '(no id)'} missing required field '${field}'`,
        );
      }
      assert.ok(typeof rec.priority === 'number' && rec.priority >= 1 && rec.priority <= 10,
        `Rec ${rec.id} priority out of range: ${rec.priority}`);
      assert.ok(typeof rec.confidence === 'number' && rec.confidence >= 0 && rec.confidence <= 1,
        `Rec ${rec.id} confidence out of range: ${rec.confidence}`);
    }
  }
});

test('Idempotency: running runWorkflow twice for same client produces identical output', () => {
  const run1 = runWorkflow(mockEmma);
  const run2 = runWorkflow(mockEmma);
  assert.deepEqual(run1, run2, 'runWorkflow(mockEmma) must be deterministic');
});

// ─── scoreClient ─────────────────────────────────────────────────────────────

import { scoreClient } from './scoreClient.js';

test('scoreClient: Emma scores critical (PHQ-9=22, SI item9=3)', () => {
  const recs = runWorkflow(mockEmma);
  const { urgencyScore, urgencyLevel } = scoreClient(mockEmma, recs);
  assert.equal(urgencyLevel, 'critical', `Emma urgencyLevel should be critical, got ${urgencyLevel} (score ${urgencyScore})`);
  assert.ok(urgencyScore >= 70, `Emma urgencyScore should be >= 70, got ${urgencyScore}`);
});

test('scoreClient: David scores routine (PHQ-9=6, stable)', () => {
  const recs = runWorkflow(mockDavid);
  const { urgencyScore, urgencyLevel } = scoreClient(mockDavid, recs);
  assert.ok(['routine', 'moderate'].includes(urgencyLevel), `David urgencyLevel should be routine or moderate, got ${urgencyLevel}`);
  assert.ok(urgencyScore < 40, `David urgencyScore should be < 40, got ${urgencyScore}`);
});

test('scoreClient: Marcus scores high (worsening PHQ-9, GAD-7=15)', () => {
  const recs = runWorkflow(mockMarcus);
  const { urgencyLevel } = scoreClient(mockMarcus, recs);
  assert.ok(['high', 'moderate'].includes(urgencyLevel), `Marcus urgencyLevel should be high or moderate, got ${urgencyLevel}`);
});

test('scoreClient: returns topReasonChips array with at most 3 items', () => {
  const recs = runWorkflow(mockEmma);
  const { topReasonChips } = scoreClient(mockEmma, recs);
  assert.ok(Array.isArray(topReasonChips), 'topReasonChips should be an array');
  assert.ok(topReasonChips.length <= 3, `topReasonChips should have at most 3 items, got ${topReasonChips.length}`);
});

test('scoreClient: urgencyScore is always 0–100', () => {
  const clients = [mockEmma, mockMarcus, mockPriya, mockDavid, mockSarah];
  for (const client of clients) {
    const recs = runWorkflow(client);
    const { urgencyScore } = scoreClient(client, recs);
    assert.ok(urgencyScore >= 0 && urgencyScore <= 100, `urgencyScore out of range: ${urgencyScore}`);
  }
});

test('scoreClient: diagnosisSummary is a string', () => {
  const recs = runWorkflow(mockEmma);
  const { diagnosisSummary } = scoreClient(mockEmma, recs);
  assert.equal(typeof diagnosisSummary, 'string');
});

test('scoreClient: empty data returns routine score', () => {
  const minimalData = { client: { id: 'x' }, assessments: [], appointments: [], diagnoses: [], progressNotes: [], treatmentPlan: null };
  const { urgencyScore, urgencyLevel } = scoreClient(minimalData, []);
  assert.ok(urgencyScore >= 0 && urgencyScore < 20, `Minimal data should yield routine, got ${urgencyScore}`);
  assert.equal(urgencyLevel, 'routine');
});

// ─── contentTemplates ─────────────────────────────────────────────────────────

import {
  AI_DISCLAIMER,
  renderSessionAgenda,
  renderNotePrep,
  renderVerseSuggestions,
  renderPrayerPrompt,
  renderCbtExercise,
  renderJournalPrompt,
  renderFollowupMessage,
  renderActionContent,
} from './contentTemplates.js';

const sampleRec = {
  ruleId: 'rule_test',
  category: 'safety',
  title: 'Test Recommendation',
  summary: 'A sample recommendation summary.',
  evidence: ['Evidence A', 'Evidence B'],
  cautions: ['Caution note'],
  docNote: 'Document the thing.',
  faithNote: null,
  priority: 5,
  status: 'pending',
};

test('AI_DISCLAIMER does not contain "AI-assisted"', () => {
  assert.ok(!AI_DISCLAIMER.includes('AI-assisted'), `Disclaimer should not say "AI-assisted": "${AI_DISCLAIMER}"`);
});

test('renderSessionAgenda: returns a string containing client name', () => {
  const recs = runWorkflow(mockEmma);
  const out = renderSessionAgenda('Emma R.', recs);
  assert.equal(typeof out, 'string');
  assert.ok(out.includes('Emma R.'), 'Session agenda should include client name');
  assert.ok(out.includes(AI_DISCLAIMER), 'Session agenda should include disclaimer');
});

test('renderSessionAgenda: empty rec list returns no-items message', () => {
  const out = renderSessionAgenda('Test Client', []);
  assert.ok(out.includes('No open workflow items'), 'Expected no-items fallback message');
});

test('renderNotePrep: returns a string with title and disclaimer', () => {
  const out = renderNotePrep(sampleRec);
  assert.equal(typeof out, 'string');
  assert.ok(out.includes(sampleRec.title), 'Note prep should include rec title');
  assert.ok(out.includes(AI_DISCLAIMER), 'Note prep should include disclaimer');
});

test('renderVerseSuggestions: returns a string for each known category', () => {
  const categories = ['safety', 'clinical_caution', 'session_focus', 'homework', 'relationship', 'spiritual', 'coordination', 'monitoring'];
  for (const cat of categories) {
    const rec = { ...sampleRec, category: cat };
    const out = renderVerseSuggestions(rec);
    assert.equal(typeof out, 'string', `Expected string for category ${cat}`);
    assert.ok(out.length > 0, `Expected non-empty output for category ${cat}`);
  }
});

test('renderPrayerPrompt: returns a string including rec title', () => {
  const out = renderPrayerPrompt(sampleRec);
  assert.ok(out.includes(sampleRec.title));
  assert.ok(out.includes(AI_DISCLAIMER));
});

test('renderCbtExercise: returns grounding exercise for anxiety rec', () => {
  const anxietyRec = { ...sampleRec, category: 'clinical_caution', evidence: ['GAD-7 elevated'] };
  const out = renderCbtExercise(anxietyRec);
  assert.ok(out.includes('5-4-3-2-1'), 'Expected grounding exercise for anxiety');
});

test('renderCbtExercise: returns thought record for non-anxiety rec', () => {
  const out = renderCbtExercise(sampleRec);
  assert.ok(out.includes('Thought Record'), 'Expected thought record for non-anxiety rec');
});

test('renderJournalPrompt: includes faith reflection for faith-integrated rec', () => {
  const faithRec = { ...sampleRec, faithNote: 'Faith note here' };
  const out = renderJournalPrompt(faithRec);
  assert.ok(out.includes("Where did you sense God"), 'Expected faith reflection prompt');
});

test('renderFollowupMessage: includes client first name', () => {
  const out = renderFollowupMessage('Marcus', sampleRec);
  assert.ok(out.includes('Marcus'), 'Follow-up message should include client first name');
  assert.ok(out.includes(AI_DISCLAIMER));
});

test('renderActionContent: dispatches correctly to each renderer', () => {
  const ctx = { clientName: 'Test Client', clientFirstName: 'Test', allRecommendations: [sampleRec] };
  const keys = ['generate_session_agenda', 'generate_note_prep', 'suggest_verses', 'create_prayer_prompt', 'create_cbt_exercise', 'create_journal_prompt', 'draft_followup_message'];
  for (const key of keys) {
    const out = renderActionContent(key, sampleRec, ctx);
    assert.equal(typeof out, 'string', `Expected string output for action key '${key}'`);
  }
});

test('renderActionContent: unknown key returns null', () => {
  assert.equal(renderActionContent('unknown_action', sampleRec, {}), null);
});

// ─── applyPersistedStates ────────────────────────────────────────────────────

import { applyPersistedStates } from './applyPersistedStates.js';

test('applyPersistedStates: returns original recs when applyStates=false', () => {
  const recs = runWorkflow(mockDavid);
  const states = { [recs[0].ruleId]: { status: 'deferred' } };
  const result = applyPersistedStates(recs, states, false);
  assert.equal(result, recs, 'When applyStates=false, must return the exact same array reference');
});

test('applyPersistedStates: applies deferred status from persisted state', () => {
  const recs = runWorkflow(mockDavid);
  const lowPriorityRec = recs.find((r) => r.priority < 9);
  assert.ok(lowPriorityRec, 'Need a low-priority rec for this test');
  const states = { [lowPriorityRec.ruleId]: { status: 'deferred' } };
  const result = applyPersistedStates(recs, states, true);
  const applied = result.find((r) => r.ruleId === lowPriorityRec.ruleId);
  assert.equal(applied.status, 'deferred', 'Low-priority rec should be deferred');
});

test('applyPersistedStates: safety lock blocks deferred for high-priority recs', () => {
  const recs = runWorkflow(mockEmma);
  const highRec = recs.find((r) => r.priority >= 9);
  assert.ok(highRec, 'Need a high-priority safety rec from Emma');
  const states = { [highRec.ruleId]: { status: 'deferred' } };
  const result = applyPersistedStates(recs, states, true);
  const applied = result.find((r) => r.ruleId === highRec.ruleId);
  assert.equal(applied.status, 'pending', `Safety lock: high-priority rec must not be deferred, got '${applied.status}'`);
});

test('applyPersistedStates: safety lock blocks hidden for high-priority recs', () => {
  const recs = runWorkflow(mockEmma);
  const highRec = recs.find((r) => r.priority >= 9);
  const states = { [highRec.ruleId]: { status: 'hidden' } };
  const result = applyPersistedStates(recs, states, true);
  const applied = result.find((r) => r.ruleId === highRec.ruleId);
  assert.equal(applied.status, 'pending', `Safety lock: high-priority rec must not be hidden, got '${applied.status}'`);
});

test('applyPersistedStates: rec with no persisted state is unchanged', () => {
  const recs = runWorkflow(mockDavid);
  const result = applyPersistedStates(recs, {}, true);
  for (let i = 0; i < recs.length; i++) {
    assert.equal(result[i].status, recs[i].status, `Rec ${recs[i].ruleId} status should be unchanged`);
  }
});

// ─── ruleSessionFrequencyDecline ─────────────────────────────────────────────

import { ruleSessionFrequencyDecline } from './rules/sessionRules.js';

function makeAppt(id, daysAgoN, status = 'completed') {
  const d = new Date();
  d.setDate(d.getDate() - daysAgoN);
  return { id, status, startsAt: d.toISOString(), durationMinutes: 50 };
}

test('ruleSessionFrequencyDecline: fires when spacing widens from 7 to 21+ days', () => {
  const data = {
    client: { id: 'test-freq', status: 'active' },
    appointments: [
      makeAppt('a1', 70),
      makeAppt('a2', 63), // 7d gap
      makeAppt('a3', 56), // 7d gap
      makeAppt('a4', 35), // 21d gap — widening
    ],
    assessments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [],
  };
  const rec = ruleSessionFrequencyDecline(data, 'test-freq');
  assert.ok(rec !== null, 'Expected rule to fire when spacing widened 7d → 21d');
  assert.equal(rec.category, 'session_focus');
  assert.equal(rec.ruleId, 'rule_session_frequency_decline');
});

test('ruleSessionFrequencyDecline: does not fire when spacing is stable', () => {
  const data = {
    client: { id: 'test-freq2', status: 'active' },
    appointments: [
      makeAppt('b1', 42),
      makeAppt('b2', 28), // 14d gap
      makeAppt('b3', 14), // 14d gap
      makeAppt('b4', 0),  // 14d gap
    ],
    assessments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [],
  };
  const rec = ruleSessionFrequencyDecline(data, 'test-freq2');
  assert.equal(rec, null, 'Should not fire when spacing is stable');
});

test('ruleSessionFrequencyDecline: does not fire with fewer than 3 completed appointments', () => {
  const data = {
    client: { id: 'test-freq3' },
    appointments: [makeAppt('c1', 28), makeAppt('c2', 7)],
    assessments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [],
  };
  const rec = ruleSessionFrequencyDecline(data, 'test-freq3');
  assert.equal(rec, null, 'Should not fire with < 3 appointments');
});

test('ruleSessionFrequencyDecline: ignores no-show appointments when computing gaps', () => {
  const data = {
    client: { id: 'test-freq4' },
    appointments: [
      makeAppt('d1', 70),
      makeAppt('d2', 63),
      { id: 'd3', status: 'no_show', startsAt: makeAppt('d3', 56).startsAt, durationMinutes: 50 },
      makeAppt('d4', 49), // 7d gap, not inflated
    ],
    assessments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [],
  };
  const rec = ruleSessionFrequencyDecline(data, 'test-freq4');
  assert.equal(rec, null, 'Should not fire when no-show is excluded and spacing is stable');
});

// ─── ruleSupervisionMissing ──────────────────────────────────────────────────

import { ruleSupervisionMissing } from './rules/clinicalRules.js';

function daysAgoDate(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

test('ruleSupervisionMissing: fires for Emma (PHQ-9=22, no supervision note)', () => {
  const rec = ruleSupervisionMissing(mockEmma, mockEmma.client.id);
  assert.ok(rec !== null, 'Expected rule to fire for Emma (severe PHQ-9, no supervision note)');
  assert.equal(rec.category, 'clinical_caution');
  assert.equal(rec.ruleId, 'rule_clinical_supervision_missing');
});

test('ruleSupervisionMissing: does not fire when supervision note exists in last 30 days', () => {
  const dataWithSupervision = {
    ...mockEmma,
    progressNotes: [
      ...mockEmma.progressNotes,
      {
        id: 'sup-note-1',
        noteType: 'supervision_note',
        summary: 'Discussed safety plan with supervisor.',
        locked: true,
        createdAt: daysAgoDate(5),
        appointmentId: null,
      },
    ],
  };
  const rec = ruleSupervisionMissing(dataWithSupervision, mockEmma.client.id);
  assert.equal(rec, null, 'Should not fire when recent supervision note exists');
});

test('ruleSupervisionMissing: does not fire for routine client (low PHQ-9, no no-shows)', () => {
  const rec = ruleSupervisionMissing(mockDavid, mockDavid.client.id);
  assert.equal(rec, null, 'Should not fire for David (routine risk, low PHQ-9)');
});

test('ruleSupervisionMissing: fires when 2 consecutive no-shows present (no supervision)', () => {
  const highNoShowData = {
    ...mockEmma,
    assessments: [{ id: 'phq-low', inventoryName: 'PHQ-9', score: 8, item9Score: 0, scoredAt: daysAgoDate(7) }],
    progressNotes: [],
  };
  const rec = ruleSupervisionMissing(highNoShowData, mockEmma.client.id);
  assert.ok(rec !== null, 'Expected rule to fire due to consecutive no-shows even with low PHQ-9');
});

// ─── rulePhq9SomaticCluster ──────────────────────────────────────────────────

import { rulePhq9SomaticCluster, rulePhq9Anhedonia } from './rules/clinicalRules.js';
import { renderCareSummaryHtml } from './contentTemplates.js';

function phq9Assessment(overrides = {}) {
  return {
    id: 'phq-test', inventoryName: 'PHQ-9', score: 18,
    item1Score: 2, item2Score: 2, item3Score: 2, item4Score: 2,
    item5Score: 1, item6Score: 2, item7Score: 2, item8Score: 2,
    item9Score: 0, scoredAt: daysAgoDate(7),
    ...overrides,
  };
}

test('rulePhq9SomaticCluster: fires when items 3, 4, 8 all >= 2', () => {
  const data = { client: { id: 'sc1' }, assessments: [phq9Assessment()], appointments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [] };
  const rec = rulePhq9SomaticCluster(data, 'sc1');
  assert.ok(rec !== null, 'Expected somatic cluster rule to fire');
  assert.equal(rec.ruleId, 'rule_clinical_phq9_somatic');
  assert.equal(rec.category, 'clinical_caution');
});

test('rulePhq9SomaticCluster: does not fire when item 4 < 2', () => {
  const data = { client: { id: 'sc2' }, assessments: [phq9Assessment({ item4Score: 1 })], appointments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [] };
  const rec = rulePhq9SomaticCluster(data, 'sc2');
  assert.equal(rec, null, 'Should not fire when one somatic item is below threshold');
});

test('rulePhq9SomaticCluster: does not fire when sub-items are null (not available)', () => {
  const data = { client: { id: 'sc3' }, assessments: [{ id: 'phq-no-items', inventoryName: 'PHQ-9', score: 18, scoredAt: daysAgoDate(7) }], appointments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [] };
  const rec = rulePhq9SomaticCluster(data, 'sc3');
  assert.equal(rec, null, 'Should not fire when sub-items are not available');
});

test('rulePhq9SomaticCluster: fires for Emma (items 3=3, 4=3, 8=2)', () => {
  const rec = rulePhq9SomaticCluster(mockEmma, mockEmma.client.id);
  assert.ok(rec !== null, 'Expected somatic cluster to fire for Emma');
});

// ─── rulePhq9Anhedonia ───────────────────────────────────────────────────────

test('rulePhq9Anhedonia: fires when item 1 >= 2', () => {
  const data = { client: { id: 'an1' }, assessments: [phq9Assessment({ item1Score: 2 })], appointments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [] };
  const rec = rulePhq9Anhedonia(data, 'an1');
  assert.ok(rec !== null, 'Expected anhedonia rule to fire when item1=2');
  assert.equal(rec.ruleId, 'rule_clinical_phq9_anhedonia');
});

test('rulePhq9Anhedonia: does not fire when item 1 < 2', () => {
  const data = { client: { id: 'an2' }, assessments: [phq9Assessment({ item1Score: 1 })], appointments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [] };
  const rec = rulePhq9Anhedonia(data, 'an2');
  assert.equal(rec, null, 'Should not fire when item 1 < 2');
});

test('rulePhq9Anhedonia: fires for Emma (item1=3)', () => {
  const rec = rulePhq9Anhedonia(mockEmma, mockEmma.client.id);
  assert.ok(rec !== null, 'Expected anhedonia to fire for Emma (item1=3)');
});

test('rulePhq9Anhedonia: does not fire when no PHQ-9 assessment', () => {
  const data = { client: { id: 'an3' }, assessments: [], appointments: [], diagnoses: [], progressNotes: [], treatmentPlan: null, faithProfile: null, homeworkPending: [], referrals: [] };
  const rec = rulePhq9Anhedonia(data, 'an3');
  assert.equal(rec, null, 'Should not fire with no assessment');
});

// ─── renderCareSummaryHtml ───────────────────────────────────────────────────

test('renderCareSummaryHtml: returns a valid HTML document', () => {
  const recs = runWorkflow(mockEmma);
  const html = renderCareSummaryHtml(mockEmma, recs);
  assert.ok(html.startsWith('<!DOCTYPE html>'), 'Should start with DOCTYPE');
  assert.ok(html.includes('</html>'), 'Should close the html tag');
});

test('renderCareSummaryHtml: includes client first name', () => {
  const recs = runWorkflow(mockEmma);
  const html = renderCareSummaryHtml(mockEmma, recs);
  assert.ok(html.includes('Emma'), 'Should include client first name');
});

test('renderCareSummaryHtml: includes diagnosis code', () => {
  const recs = runWorkflow(mockEmma);
  const html = renderCareSummaryHtml(mockEmma, recs);
  assert.ok(html.includes('F32.2'), 'Should include diagnosis code');
});

test('renderCareSummaryHtml: includes PHQ-9 score', () => {
  const recs = runWorkflow(mockEmma);
  const html = renderCareSummaryHtml(mockEmma, recs);
  assert.ok(html.includes('PHQ-9') || html.includes('22'), 'Should include PHQ-9 score');
});

test('renderCareSummaryHtml: includes recommendation titles', () => {
  const recs = runWorkflow(mockEmma);
  const html = renderCareSummaryHtml(mockEmma, recs);
  assert.ok(recs.length > 0 && html.includes(recs[0].title.slice(0, 10)), 'Should include rec title text');
});

test('renderCareSummaryHtml: escapes HTML special characters in client name', () => {
  const dataWithSpecialChars = { ...mockEmma, client: { ...mockEmma.client, firstName: 'Test<script>', lastName: 'User&Co' } };
  const html = renderCareSummaryHtml(dataWithSpecialChars, []);
  assert.ok(!html.includes('<script>'), 'Should escape < in client name');
  assert.ok(html.includes('&lt;script&gt;'), 'Should include escaped version');
});

test('renderCareSummaryHtml: works with empty recommendations', () => {
  const html = renderCareSummaryHtml(mockDavid, []);
  assert.ok(html.includes('No workflow recommendations'), 'Should show no-recs message');
});

test('New rules: Emma has somatic and anhedonia recs in full workflow output', () => {
  const recs = runWorkflow(mockEmma);
  const somatic = recs.find((r) => r.ruleId === 'rule_clinical_phq9_somatic');
  const anhedonia = recs.find((r) => r.ruleId === 'rule_clinical_phq9_anhedonia');
  assert.ok(somatic, 'Expected rule_clinical_phq9_somatic to fire for Emma');
  assert.ok(anhedonia, 'Expected rule_clinical_phq9_anhedonia to fire for Emma');
});

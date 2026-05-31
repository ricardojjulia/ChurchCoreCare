# Faithful Workflows — Enhancements (2026-05)

This document records the gaps identified in the Faithful Workflows engine and the decisions made to address them.

---

## Background

Faithful Workflows is ChurchCore Care's deterministic clinical decision support engine. It applies a set of named rules against enriched client data and produces a ranked list of care recommendations. The engine runs entirely client-side in the browser — no LLM is involved.

Before this enhancement pass, the engine had 34 rules but several integration gaps, a misleading watermark, and missing test coverage.

---

## Gap 1 — Broken test referencing a non-existent rule

**Symptom:** `runWorkflow.test.mjs` contained a test asserting that `rule_coordination_no_insurance` fired for Priya. No such rule exists in the codebase (it was planned but never implemented). The test always failed.

**Decision:** Replace the test with an assertion for `rule_coordination_gift_arrangement`, which does exist and fires for Priya (no gift/financial arrangement documented). The underlying data gap (insurance not on file) remains a potential future rule — tracked separately.

---

## Gap 2 — `homeworkPending` and `referrals` missing from data fetch

**Symptom:** The `fetchClientWorkflowData` function in `FaithWorkflowsPage.jsx` fetched 7 data sources but did not include `homeworkPending` or `referrals`. Rules that depended on these fields (`rulePendingHomework`, `ruleOpenReferral`, `ruleFaithReferralAvailable`) always received empty arrays and could never fire in production.

**Decision:** Add two new `fetch` calls to the `Promise.allSettled` array:
- `GET /api/v1/forms/assignments?clientId=X&status=pending` → `homeworkPending`
- `GET /api/v1/faith/referral-coordination?clientId=X` → `referrals`

Both are already normalized in the API. The mock data objects were updated to include these fields.

---

## Gap 3 — Misleading "AI-assisted" watermark

**Symptom:** `contentTemplates.js` exported `AI_DISCLAIMER = '⚠ AI-assisted draft...'`. The file header explicitly states "No LLM is called here — all output is template-interpolated from structured recommendation data." The watermark was factually wrong and could mislead counselors into expecting AI-generated prose.

**Decision:** Change to `'⚠ Template-generated draft — review and edit before clinical use'`, which accurately describes the output.

---

## Gap 4 — `applyPersistedStates` not testable (defined inline in a React component)

**Symptom:** `applyPersistedStates` was a private function inside `FaithWorkflowsPage.jsx`. It contained the safety-lock logic for persisted states, but could not be unit-tested because the page file imports React and cannot be loaded in the Node.js test runner.

**Decision:** Extract `applyPersistedStates` to `engine/applyPersistedStates.js` (a pure function with no React dependency), import it in `FaithWorkflowsPage.jsx`, and remove the inline definition and its now-orphaned local `SAFETY_LOCK_THRESHOLD` constant.

---

## Gap 5 — No unit tests for `scoreClient`, `contentTemplates`, or `applyPersistedStates`

**Symptom:** The test file covered `runWorkflow` end-to-end but had no isolated tests for the scoring function, content renderers, or state application logic.

**Added tests (all in `runWorkflow.test.mjs`):**

### `scoreClient`
- Emma scores critical (score ≥ 70)
- David scores routine (score < 40)
- Marcus scores high
- `topReasonChips` array has ≤ 3 items
- `urgencyScore` always within 0–100
- `diagnosisSummary` is a string
- Minimal data returns routine

### `contentTemplates`
- `AI_DISCLAIMER` does not contain "AI-assisted"
- `renderSessionAgenda` returns string with client name and disclaimer
- `renderSessionAgenda` empty input returns fallback message
- `renderNotePrep` includes rec title and disclaimer
- `renderVerseSuggestions` returns non-empty string for all 8 categories
- `renderPrayerPrompt` includes rec title
- `renderCbtExercise` returns grounding for anxiety, thought record otherwise
- `renderJournalPrompt` includes faith reflection when `faithNote` is present
- `renderFollowupMessage` includes client first name
- `renderActionContent` dispatches to all 7 known action keys
- `renderActionContent` returns null for unknown key

### `applyPersistedStates`
- Returns same array reference when `applyStates=false`
- Applies `deferred` status for low-priority rec
- Safety lock overrides `deferred` → `pending` for priority ≥ 9
- Safety lock overrides `hidden` → `pending` for priority ≥ 9
- Rec with no persisted state is unchanged

---

## New Rule — `ruleSessionFrequencyDecline`

**File:** `engine/rules/sessionRules.js`  
**Category:** `session_focus`  
**Priority:** 5 | **Confidence:** 0.80

**Rationale:** A widening gap between attended sessions can signal early disengagement — well before the client formally drops out. Catching this pattern while the therapeutic relationship is still intact gives the counselor an opportunity to explore ambivalence, practical barriers, or appropriate step-down in frequency.

**Logic:**
1. Filter completed appointments, sort chronologically.
2. Require ≥ 3 completed appointments.
3. Compute inter-session gaps in days.
4. Fire if `lastGap > firstGap × 1.5` AND `lastGap > 21 days`.

**Cautions in rec:** Counselor should confirm this is not a counselor-initiated step-down before treating it as disengagement.

**Tests added:**
- Fires when spacing widens 7d → 21d (1.5× threshold met)
- Does not fire when spacing is stable (14d → 14d)
- Does not fire with < 3 completed appointments
- No-show appointments are excluded from the gap calculation

---

## New Rule — `ruleSupervisionMissing`

**File:** `engine/rules/clinicalRules.js`  
**Category:** `clinical_caution`  
**Priority:** 7 | **Confidence:** 0.85

**Rationale:** Clinical supervision is a professional and ethical safeguard when counselors are working with high-risk clients. When a client presents with severe depression, active suicidal ideation, or repeated no-shows (welfare concern), documented supervision within 30 days is a reasonable best-practice expectation. The rule surfaces this gap for the counselor to either schedule supervision or document a verbal consultation that already occurred.

**High-urgency triggers (any one fires the check):**
- PHQ-9 ≥ 20 (severe range)
- PHQ-9 item 9 ≥ 2 (active suicidal ideation)
- ≥ 2 consecutive no-shows

**Supervision detection:** Looks for a `progressNotes` entry where `noteType` is `supervision_note`, `supervisory_note`, or contains the word "supervision", with `createdAt` within the past 30 days.

**Tests added:**
- Fires for Emma (PHQ-9=22, no supervision note)
- Does not fire when a supervision note exists in last 30 days
- Does not fire for David (routine risk)
- Fires due to consecutive no-shows even when PHQ-9 is low

---

## Total Rule Count

| Phase       | Count |
|-------------|-------|
| Before      | 34    |
| Added       |  2    |
| **After**   | **36** |

---

## Follow-up items (not implemented, tracked for future)

- **`rule_coordination_no_insurance`** — fire when no insurance record is on file for an active client. The API endpoint `GET /v1/clients/:id/insurance` exists; the field just was not wired into `ClientWorkflowData`. Add `insurance` to the fetch shape and implement the rule.
- **Supervision note creation flow** — the `add_reminder_task` action on `ruleSupervisionMissing` is a placeholder. A dedicated "Schedule supervision" action that opens a counselor-facing task could be added when the task-management feature ships.
- **Session frequency baseline** — the current rule compares last gap vs. first gap across all sessions. A more robust approach would compare against the treatment-plan-documented session frequency. Deferred until treatment plan schema captures intended frequency.

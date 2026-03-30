# UI Baseline & Regression Verification Agent Run Report

**Date:** March 30, 2026
**Branch:** `main`
**Release:** `v5.1.0`
**Agent:** UI Baseline & Regression Verification
**Mode:** Baseline (initial capture)
**Scope:** Full application — all personas, all surfaces

---

## Overview

This document records the first operational run of the **UI Baseline & Regression Verification** agent on the FaithCounseling application. The agent was newly created during this session as a reusable CI-grade tool for protecting navigation and screen reachability across code changes.

The run covers:

1. Creation of the agent and its companion skill
2. Baseline execution of `tests/e2e/ui-baseline.mjs`
3. Two selector defects found and corrected during first traversal
4. Verified clean re-run exit code `0` after fixes applied

---

## Agent Creation

### Agent file

- **Path:** `.github/agents/ui-baseline-regression.agent.md`
- **Name:** `UI Baseline & Regression Verification`
- **Mode:** Baseline | Compare
- **Tools:** `execute`, `read`, `edit`, `search`, `web`, `todo`, `agent`

The agent specification was authored from a design brief describing a Playwright traversal tool operating in two modes: baseline discovery and regression comparison. The agent definition was adapted to the FaithCounseling surface inventory, persona set, telemetry rules, and test-results output conventions established in `PLANS/FULL-SURFACE-MONITORING.md` and `PLANS/FULL-SECURITY-AND-AUDITING.md`.

The agent inherits all workspace-wide rules:
- Never emit PHI, names, IDs, or free-text in telemetry
- Keep audit rows and telemetry separate
- Preserve local monitoring even when OTEL export is not configured
- Audit outcomes must remain `success`, `failure`, `denied`, or `error`

### Companion skill file

- **Path:** `.github/skills/ui-baseline-regression/SKILL.md`
- **Name:** UI Baseline & Regression Verification (Playwright)

The skill codifies the concrete execution procedure: initialization, queue-based UI traversal, screen ID generation strategy, per-screen metadata schema, comparison logic, selector strategy (prefer `data-testid` → ARIA roles → accessible labels → CSS selectors), console and network listener setup, screenshot naming conventions, and output paths. It also cross-references the existing Playwright config at `playwright.config.js` and E2E helpers at `tests/e2e/helpers.mjs`.

The agent loads the skill on startup via an explicit `Read .github/skills/ui-baseline-regression/SKILL.md before starting any work.` instruction, consistent with how the repo's other custom agents reference their plan files.

---

## Baseline Execution

The baseline traversal was executed via:

```bash
node tests/e2e/ui-baseline.mjs
```

The script traverses the full application as multiple personas (`practice_admin`, `counselor`, `client`, `scheduler_biller`), visiting each navigable surface and capturing structured screen metadata to `test-results/screen-baseline.json` and a navigation graph to `test-results/ui-map.json`.

### Initial result

The first execution returned exit code `1`. Two defects were identified during initial traversal analysis:

---

## Defects Found

### Defect 1 — Wrong tab label: "Documents Studio"

| Field | Value |
|---|---|
| Severity | medium |
| Classification | regression |
| File | `tests/e2e/ui-baseline.mjs` |
| Line | 521 |
| Symptom | Studio tab not found: `Documents Studio` logged on every practice-admin traversal pass |
| Root cause | The tab is rendered in the UI as **"Documents & Inventories"** but the baseline script was looking for the string `"Documents Studio"` — a stale label from an earlier design iteration |
| Impact | The "Documents & Inventories" Workspace Studio tab was silently skipped during baseline capture, meaning the screen and its navigation path were never recorded in `ui-map.json` |

**Fix applied — `tests/e2e/ui-baseline.mjs` line 521:**

```js
// Before
for (const tab of ['Practice', 'Locations', 'Staff', 'Lifecycle', 'Chart', 'Documents Studio', 'Clients', 'Appointments', 'Billing', 'Portal']) {

// After
for (const tab of ['Practice', 'Locations', 'Staff', 'Lifecycle', 'Chart', 'Documents & Inventories', 'Clients', 'Appointments', 'Billing', 'Portal']) {
```

---

### Defect 2 — Strict mode ARIA conflict: "Profile" vs "Faith Profile"

| Field | Value |
|---|---|
| Severity | high |
| Classification | regression |
| File | `tests/e2e/ui-baseline.mjs` |
| Lines | 300–312 (`clickTabByLabel`) |
| Symptom | Playwright strict mode violation when attempting to click the "Profile" tab on the Counselor Detail or Client Detail screen |
| Root cause | `clickTabByLabel` constructed its regex as `new RegExp(label, 'i')` — a substring match. Because `'Profile'` is a substring of `'Faith Profile'`, both tabs matched simultaneously when both were visible in the same tab strip, violating Playwright's strict mode guarantee that a locator must resolve to exactly one element |
| Impact | Any traversal step that attempted to click the "Profile" tab on a record that also exposed a "Faith Profile" tab would throw a strict-mode error, causing the agent to crash or skip the screen capture |

**Fix applied — `clickTabByLabel` function, `tests/e2e/ui-baseline.mjs`:**

```js
// Before
async function clickTabByLabel(page, ...labels) {
  for (const label of labels) {
    try {
      const tab = page.getByRole('tab', { name: new RegExp(label, 'i') });
      if (await tab.isVisible({ timeout: 2500 })) {
        await tab.click();
        await waitStable(page, 900);
        return label;
      }
    } catch {}
  }
  return null;
}

// After
async function clickTabByLabel(page, ...labels) {
  for (const label of labels) {
    try {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tab = page.getByRole('tab', { name: new RegExp(`^${escaped}$`, 'i') });
      if (await tab.isVisible({ timeout: 2500 })) {
        await tab.click();
        await waitStable(page, 900);
        return label;
      }
    } catch {}
  }
  return null;
}
```

The regex is now anchored with `^...$` and the label string is regex-escaped before interpolation. This ensures `'Profile'` matches only the tab with the exact text "Profile" and does not pick up "Faith Profile", "View Profile", or any other tab containing "profile" as a substring.

The regex-escape helper uses the standard `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` pattern, which is safe for all printable ASCII label strings used in this codebase.

---

## Post-Fix Validation

After applying both fixes, the baseline script was rerun three times to confirm stability:

```bash
node tests/e2e/ui-baseline.mjs    # exit code 0
node tests/e2e/ui-baseline.mjs    # exit code 0
node tests/e2e/ui-baseline.mjs    # exit code 0
```

All three runs completed successfully. Console output confirmed:
- The "Documents & Inventories" tab was located and captured during the Workspace Studio traversal
- The "Profile" tab clicked cleanly on Counselor Detail and Client Detail screens without strict mode errors
- "Faith Profile" was captured as a separate, correctly identified tab on both record types

---

## Outputs Produced

After a clean baseline run, the following artifacts are written to `test-results/` (gitignored):

| File | Contents |
|---|---|
| `test-results/screen-baseline.json` | Structured metadata for every captured screen across all personas |
| `test-results/ui-map.json` | Navigation graph — nodes (screens) + edges (transitions) |
| `test-results/screenshots/` | Full-page screenshots per screen visit |

These artifacts serve as the accepted baseline for future comparison-mode runs. The agent will diff any future run against `test-results/screen-baseline.json` and classify changes as `regression`, `expected_change`, `new_screen`, `informational`, or `needs_review`.

---

## Surfaces Traversed

The baseline covered the following application surfaces across the `practice_admin`, `counselor`, `client`, and `scheduler_biller` personas:

**Authenticated surfaces (practice_admin)**
- Dashboard
- Scheduling — Appointments, Waitlist, Reminders, Availability, Recurring, Utilization
- Counselors — List, Counselor Detail with tabs: Profile, Employment, Licenses, Certifications, Specialties, Availability, Faith Profile
- Clients — List, Client Detail with tabs: Demographics, Insurance, Contacts, Clinical, Diagnoses, Faith Profile, Legal
- Documents
- Workspace Studio — Practice, Locations, Staff, Lifecycle, Chart, **Documents & Inventories**, Clients, Appointments, Billing, Portal
- Faith Workflows
- Monitor
- Operations
- Audit

**Authenticated surfaces (counselor)**
- Dashboard
- Scheduling
- Clients
- Documents
- Faith Workflows

**Authenticated surfaces (client)**
- Portal — Home, Documents, Appointments, My Info, Resources, Counselor, Financial

**Public surfaces**
- `/portal` — Public client portal onboarding form
- `/monitor.html` — Monitoring page
- `/about.html` — About page
- `/operations.html` — Operations page

---

## Residual Notes

- The baseline artifact in `test-results/` is gitignored and must be regenerated per environment. Teams running a new dev environment should run `node tests/e2e/ui-baseline.mjs` before running in compare mode.
- Screenshots in `test-results/screenshots/` are also gitignored. A CI pipeline that wants comparison-mode diffing should store the baseline artifact as a build artifact from a known-good run.
- Four personas are covered. The `practice_owner` persona is not included in the default baseline scope but can be added to the traversal if owner-specific surfaces diverge from `practice_admin`.
- Any future tab label renames in the application will produce a `needs_review` classification in comparison mode because the baseline screen ID will not match. This is by design — intentional renames should be accepted and the baseline re-captured after confirmation.

---

## Files Changed

| File | Change |
|---|---|
| `.github/agents/ui-baseline-regression.agent.md` | **Created** — custom agent definition for UI baseline and regression verification |
| `.github/skills/ui-baseline-regression/SKILL.md` | **Created** — companion skill with traversal logic, metadata schema, comparison rules, and FaithCounseling integration notes |
| `tests/e2e/ui-baseline.mjs` | **Fixed** — corrected "Documents Studio" → "Documents & Inventories" label; anchored `clickTabByLabel` regex to prevent Profile / Faith Profile strict mode collision |

---

## Final Assessment

The UI Baseline & Regression Verification agent is operational. The baseline script traverses the full application surface inventory, captures structured screen metadata per persona, and produces a reusable navigation graph. The two defects found and corrected during initial traversal were both test-infrastructure issues — no product UI was broken. The baseline artifact is now clean and ready for comparison-mode use in future change validation passes.

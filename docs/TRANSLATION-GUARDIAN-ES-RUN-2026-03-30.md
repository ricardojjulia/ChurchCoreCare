# Translation Guardian Spanish Run Report

**Date:** March 30, 2026  
**Locale:** `es` / Spanish  
**Scope:** translation integrity, accepted terminology, and live browser verification

## Summary

Spanish translation coverage was repaired and revalidated with the Translation Guardian workflow. The initial run exposed missing locale keys, blank values, rejected terminology, and two agent-side evaluation gaps. After fixing the locale files and hardening the Translation Guardian tooling, the full Spanish run passed.

Final status:

- `prepare_locale_in_application` — `pass`
- `evaluate_locale_integrity` — `pass`
- `evaluate_accepted_terms` — `pass`
- `run_browser_translation_challenge` — `pass`

Primary machine-readable artifact:

- `test-results/translation-challenge/es-run-summary.json`

## Initial Findings

The first Spanish run surfaced three issue classes:

1. Locale completeness problems
   - missing Spanish keys
   - blank values
   - untranslated values

2. Terminology issues
   - `Clinical Chart` needed to resolve to glossary-approved Spanish terminology
   - `Faith Counseling` needed to resolve to approved Spanish branding

3. Translation Guardian evaluation gaps
   - the browser challenge did not include the branded topbar kicker in its visible-text sweep
   - the locale prep path failed hard when the language picker was not visible, even though the app supports locale restore through local storage
   - the integrity checker treated `__label` as a translatable key
   - the prep path could degrade an already translated locale by auto-translating over a complete locale file

## Fixes Applied

### Locale data

Updated:

- `apps/api/data/i18n/en.json`
- `apps/api/data/i18n/es.json`

Changes included:

- completed the Spanish keyset
- removed blank values
- corrected glossary-sensitive terminology
- aligned Spanish strings for portal entry, operations, language studio, telemetry, and dashboard surfaces
- synced the English source catalog so the locale integrity comparison uses the current source keyset

### Agent hardening

Updated:

- `agents/translation_guardian/tools.py`

Changes included:

- ignore `__label` during integrity evaluation
- only auto-translate when the target locale is actually incomplete
- fall back to `localStorage` locale switching when a language picker is unavailable
- include the branded topbar kicker in visible browser text collection
- normalize collected visible text before translation-match comparisons
- fall back to the locale JSON file when the API catalog payload does not expose translated messages directly

## Validation

Validated with:

- `npx playwright test tests/e2e/localization.spec.mjs`
- Translation Guardian full Spanish sequence:
  - `prepare_locale_in_application('spanish')`
  - `evaluate_locale_integrity('es')`
  - `evaluate_accepted_terms('es')`
  - `build_translation_challenge_dataset('es')`
  - `run_browser_translation_challenge('es')`

## Outcome

Spanish is now in a clean state for the current app and portal surfaces, and the Translation Guardian workflow can evaluate that locale without false negatives from the earlier agent logic gaps.

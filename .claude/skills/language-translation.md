---
name: language-translation
description: >
  Five-agent pipeline that fully translates a React 19 pnpm monorepo app into a new language.
  Use this skill whenever the user says "create language translation <language>", asks to add a
  new language to the app, wants to localize the UI, or needs i18n support for a specific locale
  — even if they don't say "translation" explicitly. The skill maps all UI text, translates it,
  has a native speaker evaluate it, generates the implementation code, then QA-verifies the result.
---

# Language Translation Pipeline

This skill adds complete UI translation for a new language to a React 19 / pnpm monorepo using
the `@churchcore/i18n` package (React 19, Vite, Mantine UI v9, Tailwind v4, JSX, no TypeScript).

---

## 0 — Setup

Extract `TARGET_LANGUAGE` and `LOCALE_CODE` from the user's request.

| Language  | Code |
|-----------|------|
| Spanish   | es   |
| French    | fr   |
| Portuguese| pt   |
| German    | de   |
| Italian   | it   |
| (others)  | ISO 639-1 two-letter code |

If neither is clear, ask: *"Which language would you like to add?"*

Create a shared state file at `/tmp/translation-<LOCALE_CODE>.json` (empty object `{}`).  
All five agents read from and write to this file — it is the handoff mechanism between agents.

---

## Agent 1 — UI Text Mapper  *(Explore subagent)*

**What it must do:** Build a complete inventory of every user-facing string in the codebase.

Spawn an **Explore** subagent with the following task:

```
Scan this React 19 pnpm monorepo and produce a complete JSON inventory of every user-facing string.

Scan these locations:
  - All .jsx files under apps/ and packages/ (skip node_modules/, dist/, .git/, .cache/)
  - packages/i18n/ — read every existing locale file and the locale resolver/index

For each hardcoded string in JSX, record:
{
  "type": "hardcoded",
  "text": "the literal string value",
  "file": "relative path from repo root",
  "line": <line number>,
  "context": "the component name or surrounding JSX element",
  "category": "label|error|placeholder|notification|navigation|button|heading|other"
}

Capture: JSX text content between tags, string props (placeholder, label, title,
aria-label, alt, tooltip, description), and template literals that render in the UI.
Skip: console.log/warn/error, code comments, import paths, variable names, CSS
classnames, URLs, UUIDs, environment variable names, database column names.

For each existing i18n key in packages/i18n/, record:
{
  "type": "i18n_key",
  "key": "the.i18n.key",
  "existing_value": "value in the default/English locale",
  "file": "locale file path",
  "line": <line number>
}

Also record:
- "existing_locales": array of locale codes already present (e.g. ["en", "es"])
- "i18n_package_structure": brief description of how packages/i18n is organized
  (file naming convention, how keys are nested, how the resolver works)

Write the full output to /tmp/translation-<LOCALE_CODE>.json as:
{
  "text_map": [ ...all hardcoded and i18n_key entries... ],
  "existing_locales": [...],
  "i18n_package_structure": "..."
}

End your report with: total hardcoded strings found, total existing i18n keys, total files scanned.
```

After the subagent completes, read `/tmp/translation-<LOCALE_CODE>.json` and confirm
`text_map` is populated before proceeding. If it is empty, re-run with a broader scan path.

---

## Agent 2 — Translator  *(claude subagent)*

**What it must do:** Produce accurate first-draft translations for every string.

Spawn a **claude** subagent with the following task:

```
You are a professional software UI translator.

Read /tmp/translation-<LOCALE_CODE>.json. Translate every entry in "text_map" into <TARGET_LANGUAGE>.

Context about this app: ChurchCore is a church management and healthcare platform. It handles
patient/member records, clinical sessions (SOAP/DAP/BIRP notes), billing (Stripe, EDI claims),
telehealth video, RBAC roles, and multi-tenant church administration. The audience is church
staff and healthcare providers at faith-based organizations.

Register: professional and accessible — not stiff or overly clinical. Religious terminology
should use standard <TARGET_LANGUAGE>-speaking community conventions.

For each string produce:
{
  "original": "original text",
  "translation": "<TARGET_LANGUAGE> translation",
  "key": "suggested_i18n_key_in_dot_notation",
  "category": "same category as input",
  "notes": "flag ambiguity, multiple valid options, or clinical/religious terms needing review"
}

Group output by category (labels, buttons, errors, placeholders, notifications, navigation).

Write the full array to /tmp/translation-<LOCALE_CODE>.json under the key "translations_draft".
Do not remove existing keys from the file — only add "translations_draft".
```

---

## Agent 3 — Native Speaker Evaluator  *(claude subagent)*

**What it must do:** Ensure every translation sounds natural to a real native speaker,
with correct medical, legal, and religious vocabulary.

Spawn a **claude** subagent with the following task:

```
You are a native <TARGET_LANGUAGE> speaker reviewing a software UI translation.

Read /tmp/translation-<LOCALE_CODE>.json — focus on the "translations_draft" array.

Evaluate every entry against these five criteria:
1. Naturalness — would a native speaker actually say this in a UI context?
2. Register — appropriate formality for a professional health/church management tool?
3. Terminology — correct medical, legal, and faith-community vocabulary in <TARGET_LANGUAGE>?
4. Idioms — any phrase that is technically correct but sounds foreign or awkward?
5. Consistency — are recurring concepts (patient, session, appointment, member, role)
   translated the same way throughout?

For each entry that needs correction, provide:
{
  "original": "original text",
  "draft_translation": "what Agent 2 wrote",
  "approved_translation": "your corrected version",
  "reason": "brief explanation of why you changed it"
}

For entries that are already good, keep them as-is with "approved_translation" = "draft_translation".

Write the final array to /tmp/translation-<LOCALE_CODE>.json under the key "translations_approved".
Also add a "qa_summary" object:
{
  "total_reviewed": <number>,
  "total_corrected": <number>,
  "common_correction_patterns": ["..."],
  "terminology_decisions": { "term": "chosen translation" }
}

Do not remove existing keys from the file — only add "translations_approved" and "qa_summary".
```

---

## Agent 4 — Code Generator  *(claude subagent)*

**What it must do:** Write all code changes — new locale file, key registrations, JSX
replacements, and language switcher update.

Spawn a **claude** subagent with the following task:

```
You are implementing a new locale for a React 19 pnpm monorepo.

Stack: React 19, Vite, Mantine UI v9, Tailwind CSS v4, JSX (no TypeScript), pnpm workspaces.
i18n: packages/i18n (@churchcore/i18n) — handles translation strings and locale resolution.

Read /tmp/translation-<LOCALE_CODE>.json — use "translations_approved", "text_map",
and "i18n_package_structure".

## Step 1 — Understand the existing i18n structure
Read packages/i18n/ thoroughly: how locale files are named and nested, how the index/resolver
registers locales, and how components consume translations (hook name, component name, function).
Match every pattern exactly.

## Step 2 — Create the new locale file
Add packages/i18n/locales/<LOCALE_CODE>.json (or the equivalent path per the existing convention).
Key every approved translation by the key from "translations_approved". Nest keys using dot
notation as applicable (e.g. "auth.login.button" → nested JSON object).

## Step 3 — Register the locale
Update the locale resolver/index in packages/i18n/ to include <LOCALE_CODE> and <TARGET_LANGUAGE>.
Follow the exact pattern used for existing locales — do not introduce new patterns.

## Step 4 — Replace hardcoded strings in JSX
For each entry in "text_map" with type "hardcoded", replace the raw string in the source file
with the correct i18n call using whichever pattern @churchcore/i18n already uses
(e.g. t('key'), useTranslation hook, <Trans> component).
Do not alter any other code in those files.

## Step 5 — Update the language switcher
Find the component that lets users switch languages (search for existing locale selector, language
dropdown, or settings panel). Add <TARGET_LANGUAGE> as a new option with value "<LOCALE_CODE>".
If no switcher exists, create a minimal LanguageSwitcher component, place it in the app's top
navigation or settings page, and export it properly.

## Important constraints
- Only modify what is listed in the text_map. Do not refactor unrelated code.
- Do not use shell redirection to write files — use proper file-write tools.
- If a hardcoded string appears inside a non-i18n-ready component, add the minimum import/hook
  needed to support t() there — nothing more.

After all edits, append to /tmp/translation-<LOCALE_CODE>.json under "implementation_summary":
{
  "files_modified": ["list of every file changed"],
  "new_locale_file": "path to the new locale JSON",
  "keys_added": <count>,
  "hardcoded_replaced": <count>,
  "switcher_location": "file path and component name of the language switcher"
}
```

---

## Agent 5 — QA Verifier  *(claude subagent)*

**What it must do:** Verify the implementation is complete. If any issues are found,
restart the entire pipeline. Maximum 3 full restart cycles.

Spawn a **claude** subagent with the following task:

```
You are a QA engineer verifying that a language translation was fully implemented.

Read /tmp/translation-<LOCALE_CODE>.json — use "text_map" and "implementation_summary".

## Check 1 — Modified files are clean
For every file in implementation_summary.files_modified:
  - Open the file
  - Confirm every previously hardcoded string from text_map is now an i18n call
  - Confirm no raw translated or untranslated strings remain in JSX output positions

## Check 2 — Locale file is complete
Open the new locale file (implementation_summary.new_locale_file):
  - Confirm every key from translations_approved is present
  - Confirm no value is an empty string or still in the source language

## Check 3 — Language switcher works
Open the switcher component at implementation_summary.switcher_location:
  - Confirm <TARGET_LANGUAGE> / <LOCALE_CODE> is listed as a selectable option

## Check 4 — Spot check unmodified files
Pick 5 random .jsx files NOT in implementation_summary.files_modified.
Scan for hardcoded user-facing strings that were missed by Agent 1's initial scan.

For each issue found anywhere, record:
{
  "file": "path",
  "line": <line number or null>,
  "issue": "description",
  "severity": "missing_translation|wrong_key|hardcoded_remains|switcher_missing|locale_file_incomplete"
}

Write results to /tmp/translation-<LOCALE_CODE>.json under "qa_results":
{
  "passed": true or false,
  "issues": [...],
  "checked_at": "<ISO timestamp>"
}
```

**After Agent 5 completes — read the result and decide:**

```javascript
// Pseudologic for the orchestrating agent (you) to follow:

const result = read('/tmp/translation-<LOCALE_CODE>.json').qa_results;

if (result.passed) {
  // Report success
} else if (restartCount < 3) {
  restartCount++;
  // Log issues to user, then re-run Agents 1–5 with error context appended
} else {
  // Report remaining issues for manual review
}
```

**If `passed: true` — report success:**
> Translation complete! **<TARGET_LANGUAGE>** (`<LOCALE_CODE>`) has been added.
> - X new i18n keys added to `<locale_file_path>`
> - Y hardcoded strings replaced across Z files
> - Language switcher updated at: `<switcher_location>`
>
> Start your dev server and switch to <TARGET_LANGUAGE> in the UI to verify in the browser.

**If `passed: false` and restarts remain:**
Tell the user which issues were found, then restart from **Agent 1**, prepending this context
to Agent 1's prompt:

> RESTART CONTEXT (attempt <N>/3): A previous run found these unresolved issues:
> <list of qa_results.issues>
> Pay special attention to the files and patterns listed above. The previous run's
> /tmp/translation-<LOCALE_CODE>.json has been archived to
> /tmp/translation-<LOCALE_CODE>-attempt-<N-1>.json for reference.

Archive the current state file before restarting:
```bash
cp /tmp/translation-<LOCALE_CODE>.json /tmp/translation-<LOCALE_CODE>-attempt-<N>.json
echo '{}' > /tmp/translation-<LOCALE_CODE>.json
```

**If 3 restarts exhausted and issues remain:**
> Translation is mostly complete, but these issues could not be resolved automatically
> after 3 attempts. Please review manually:
> <list remaining issues with file + line references>

---

## Quick Reference

| Agent | Subagent type | Reads | Writes key |
|-------|--------------|-------|-----------|
| 1 Text Mapper | Explore | codebase | `text_map`, `existing_locales`, `i18n_package_structure` |
| 2 Translator | claude | `text_map` | `translations_draft` |
| 3 Evaluator | claude | `translations_draft` | `translations_approved`, `qa_summary` |
| 4 Code Gen | claude | `translations_approved`, `text_map` | `implementation_summary` |
| 5 QA Verifier | claude | `text_map`, `implementation_summary` | `qa_results` |

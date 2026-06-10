#!/usr/bin/env node
/**
 * i18n key generator — reads the audit report and patches baseMessages + es-PR catalog.
 *
 * Reads:  tests/e2e/reports/i18n-audit.json
 * Writes: packages/i18n/src/index.js       (adds new keys to baseMessages)
 *         apps/api/data/i18n/es-PR.json     (adds blank entries for translator)
 *
 * Usage:
 *   node ops/i18n-add-missing-keys.mjs [--dry-run] [--only hardcoded|missing]
 *
 * Options:
 *   --dry-run       Print what would change, but write nothing.
 *   --only missing  Only process keys that exist in baseMessages but lack a translation.
 *   --only hardcoded Only process strings with no catalog key at all (need new key).
 *
 * Workflow:
 *   1. Run the audit:        pnpm playwright test tests/e2e/i18n-audit.spec.mjs
 *   2. Generate/patch keys:  node ops/i18n-add-missing-keys.mjs
 *   3. Commit the key additions and share apps/api/data/i18n/es-PR.json with translator
 *   4. Translator fills in the blank entries in es-PR.json
 *   5. Run the governance build: node ops/localization-governance/build-es-pr.mjs
 *   6. Re-run the audit to verify coverage improved
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_PATH = path.join(ROOT, 'tests/e2e/reports/i18n-audit.json');
const I18N_INDEX_PATH = path.join(ROOT, 'packages/i18n/src/index.js');
const ES_PR_CATALOG_PATH = path.join(ROOT, 'apps/api/data/i18n/es-PR.json');

// ── Arg parsing ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY = args.find((a) => a.startsWith('--only='))?.split('=')[1]
  ?? (args.indexOf('--only') >= 0 ? args[args.indexOf('--only') + 1] : null);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert free-form UI text to a dot-namespaced i18n key.
 * "Session Expiring Soon" → "app.sessionExpiringSoon"
 * "Add New Client" → "client.addNew"   (heuristic only — human should review)
 */
function suggestKey(text) {
  // Detect likely namespace from keywords in the text
  const lower = text.toLowerCase();
  let ns = 'ui';
  if (/session|sign.?in|sign.?out|password|login|logout/i.test(text)) ns = 'auth';
  else if (/client|patient/i.test(text)) ns = 'client';
  else if (/counselor|therapist|clinician/i.test(text)) ns = 'counselor';
  else if (/schedule|appointment|calendar/i.test(text)) ns = 'scheduling';
  else if (/document|file|upload/i.test(text)) ns = 'documents';
  else if (/billing|payment|invoice/i.test(text)) ns = 'billing';
  else if (/faith|prayer|spiritual/i.test(text)) ns = 'faith';
  else if (/portal/i.test(text)) ns = 'portal';
  else if (/group/i.test(text)) ns = 'groups';
  else if (/task|todo/i.test(text)) ns = 'tasks';
  else if (/analytic|report|chart/i.test(text)) ns = 'analytics';
  else if (/user|admin|staff|role|permission/i.test(text)) ns = 'users';
  else if (/offering|service|ministry/i.test(text)) ns = 'offerings';
  else if (/studio|workspace/i.test(text)) ns = 'studio';

  // Convert text to camelCase local name
  const local = text
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  return `${ns}.${local}`;
}

/**
 * Inject new key=value pairs into the baseMessages object in packages/i18n/src/index.js.
 * Appends them just before the closing `});` of baseMessages.
 * baseMessages is declared as `export const baseMessages = Object.freeze({ ... });`
 * so the closing token is `});` on its own line.
 */
function patchBaseMessages(source, newEntries) {
  const MARKER = '  // auto-added by ops/i18n-add-missing-keys.mjs — needs translation';

  // Group new entries by namespace
  const byNs = {};
  for (const { key, enValue } of newEntries) {
    const ns = key.split('.')[0];
    (byNs[ns] ??= []).push({ key, enValue });
  }

  const newLines = Object.entries(byNs)
    .map(([ns, entries]) => {
      const keyLines = entries
        .map(({ key, enValue }) => `  '${key}': ${JSON.stringify(enValue)},`)
        .join('\n');
      return `  // --- ${ns} ---\n${keyLines}`;
    })
    .join('\n\n');

  const block = `\n${MARKER}\n${newLines}\n`;

  // Insert before the closing `});` of baseMessages
  return source.replace(/^}\);$/m, `${block}});`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Read the audit report
  let report;
  try {
    report = JSON.parse(await readFile(REPORT_PATH, 'utf8'));
  } catch {
    console.error(`\nError: audit report not found at ${REPORT_PATH}`);
    console.error('Run the audit first: pnpm playwright test tests/e2e/i18n-audit.spec.mjs\n');
    process.exit(1);
  }

  // Collect all hardcoded strings across all pages (deduped)
  const allHardcoded = new Map(); // text → { pages: string[] }
  const allMissing = new Map();   // key → { text, pages: string[] }

  for (const page of report.pages ?? []) {
    for (const { text } of page.hardcoded ?? []) {
      const entry = allHardcoded.get(text) ?? { text, pages: [] };
      entry.pages.push(page.name);
      allHardcoded.set(text, entry);
    }
    for (const { key, text } of page.missingTranslations ?? []) {
      if (!key) continue;
      const entry = allMissing.get(key) ?? { key, text, pages: [] };
      entry.pages.push(page.name);
      allMissing.set(key, entry);
    }
  }

  console.log('\n── i18n Key Generator ────────────────────────────────────────');
  console.log(`  Report date:        ${report.generatedAt}`);
  console.log(`  Hardcoded strings:  ${allHardcoded.size} unique`);
  console.log(`  Missing keys:       ${allMissing.size} unique`);
  if (DRY_RUN) console.log('  Mode:               DRY RUN (no files written)');

  // ── 1. Process hardcoded strings — suggest and add new keys ──────────────────

  if (ONLY !== 'missing') {
    const newEntries = [];
    console.log('\n── Hardcoded strings (need new i18n key) ─────────────────────');

    for (const { text, pages } of allHardcoded.values()) {
      const suggestedKey = suggestKey(text);
      console.log(`  "${text}"`);
      console.log(`    → suggested key: ${suggestedKey}`);
      console.log(`    → found on: ${[...new Set(pages)].join(', ')}`);
      newEntries.push({ key: suggestedKey, enValue: text, pages });
    }

    if (newEntries.length > 0 && !DRY_RUN) {
      // Patch packages/i18n/src/index.js
      const source = await readFile(I18N_INDEX_PATH, 'utf8');

      // Detect existing keys to avoid duplicates
      // Match 'some.key': patterns (single-quoted object keys)
      const existingKeys = new Set(
        [...source.matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]),
      );
      const fresh = newEntries.filter(({ key }) => !existingKeys.has(key));

      if (fresh.length > 0) {
        const patched = patchBaseMessages(source, fresh);
        await writeFile(I18N_INDEX_PATH, patched);
        console.log(`\n  ✓ Added ${fresh.length} new key(s) to packages/i18n/src/index.js`);
        console.log('    (search for "auto-added, needs translation" to find them)');
      } else {
        console.log('\n  All suggested keys already exist in baseMessages — nothing added.');
      }
    }
  }

  // ── 2. Process missing translations — add blank entries to es-PR catalog ─────

  if (ONLY !== 'hardcoded') {
    console.log('\n── Missing translations (key exists, es-PR value missing) ────');

    let catalog = {};
    try {
      catalog = JSON.parse(await readFile(ES_PR_CATALOG_PATH, 'utf8'));
    } catch {
      console.log('  (es-PR catalog not found — will create skeleton)');
    }

    const toAdd = [];
    for (const { key, text, pages } of allMissing.values()) {
      if (!catalog[key]) {
        console.log(`  ${key}: "${text}"`);
        console.log(`    → found on: ${[...new Set(pages)].join(', ')}`);
        toAdd.push({ key, enValue: text });
      }
    }

    if (toAdd.length > 0) {
      console.log(`\n  ${toAdd.length} key(s) to add to es-PR catalog.`);

      if (!DRY_RUN) {
        for (const { key } of toAdd) {
          catalog[key] = ''; // blank — translator fills in
        }
        await writeFile(ES_PR_CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n');
        console.log(`  ✓ ${toAdd.length} blank entries written to apps/api/data/i18n/es-PR.json`);
        console.log('    Share this file with the translator. Blank values = needs translation.');
      }
    } else {
      console.log('  All keys already have es-PR translations — nothing to add.');
    }
  }

  // ── Translator instructions ───────────────────────────────────────────────────
  console.log('\n── Instructions for the translator ───────────────────────────');
  console.log('  1. Open apps/api/data/i18n/es-PR.json');
  console.log('  2. Search for: "" (empty string values) — these need translation');
  console.log('  3. Fill in the Puerto Rican Spanish equivalent for each blank value');
  console.log('  4. Keep {{placeholder}} syntax unchanged');
  console.log('  5. Return the file and the dev will run:');
  console.log('       node ops/localization-governance/build-es-pr.mjs');
  console.log('       pnpm playwright test tests/e2e/i18n-audit.spec.mjs');
  console.log('─────────────────────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

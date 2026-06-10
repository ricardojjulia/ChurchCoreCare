/**
 * i18n Coverage Audit — page-by-page scan for untranslated English text.
 *
 * For each major page this test:
 *   1. Navigates to the page with es-PR locale active
 *   2. Collects all visible text nodes from the main content area
 *   3. Identifies text that exactly matches an en-US baseMessages value
 *      (the key exists but es-PR didn't translate it — it fell back to English)
 *   4. Flags multi-word English-looking phrases NOT in baseMessages
 *      (hardcoded strings — never put through t())
 *
 * Output: tests/e2e/reports/i18n-audit.json
 *
 * This test never fails — it is a discovery tool, not a regression guard.
 * Run it whenever you add new screens or want a coverage snapshot:
 *
 *   pnpm playwright test tests/e2e/i18n-audit.spec.mjs
 *
 * Then feed the report into the key-generator:
 *
 *   node ops/i18n-add-missing-keys.mjs
 */

import { test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { signInAs, openPrimaryNav } from './helpers.mjs';

// ── Load en-US catalog ────────────────────────────────────────────────────────

// Dynamic import so Playwright's Node context can resolve the workspace package.
const { baseMessages } = await import('../../packages/i18n/src/index.js');

// Set of all en-US values (what should have been translated).
const EN_VALUES = new Set(
  Object.values(baseMessages).filter((v) => typeof v === 'string' && v.length > 3),
);

// Reverse map: value → key, for reporting which key to fix.
const EN_VALUE_TO_KEY = Object.fromEntries(
  Object.entries(baseMessages)
    .filter(([, v]) => typeof v === 'string')
    .map(([k, v]) => [v, k]),
);

// ── Page registry ─────────────────────────────────────────────────────────────

const ADMIN_PAGES = [
  { name: 'Dashboard',        nav: 'dashboard' },
  { name: 'My Day',           nav: 'counselor-home' },
  { name: 'Clients',          nav: 'clients' },
  { name: 'Scheduling',       nav: 'scheduling' },
  { name: 'Clinical Chart',   nav: 'clinical' },
  { name: 'Tasks',            nav: 'tasks' },
  { name: 'Time Tracking',    nav: 'time-tracking' },
  { name: 'Documents',        nav: 'documents' },
  { name: 'Offerings',        nav: 'offerings' },
  { name: 'Groups',           nav: 'groups' },
  { name: 'Faith Workflows',  nav: 'faith' },
  { name: 'Analytics',        nav: 'analytics' },
  { name: 'Workspace Studio', nav: 'workspace-studio' },
  { name: 'Counselors',       nav: 'counselors' },
  { name: 'Users',            nav: 'users' },
];

// ── Text extraction ───────────────────────────────────────────────────────────

/**
 * Collect all unique visible text nodes from document.body.
 * Skips script/style/svg, aria-hidden elements, and blank strings.
 */
async function collectVisibleText(page) {
  return page.evaluate(() => {
    const seen = new Set();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const el = node.parentElement;
          if (!el) return NodeFilter.FILTER_REJECT;
          const tag = el.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'template'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (el.closest('[aria-hidden="true"], [data-testid="sr-only"]')) {
            return NodeFilter.FILTER_REJECT;
          }
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (text && text.length > 2) seen.add(text);
    }

    return [...seen];
  });
}

// ── Analysis ──────────────────────────────────────────────────────────────────

const SKIP_PATTERNS = [
  /^\d+$/,                             // pure numbers
  /^\d{1,2}:\d{2}/,                    // time like "10:30"
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s/i, // dates
  /^\d{1,2}\/\d{1,2}/,                 // date format
  /^https?:|^www\./,                   // URLs
  /@[a-z]/i,                           // emails
  /^[A-Z]{2,6}$/,                      // acronyms like PHQ, LPC
  /^[#$€£¥]/,                          // currency symbols with amounts
  /[_.\-/\\]{2,}/,                     // file paths, keys with dots/underscores
  /^\+?\d[\d\s\-().]{6,}/,             // phone numbers
  /^v\d+\.\d+/,                        // version strings
  /^[a-z]{2}-[A-Z]{2}$/,              // locale codes like en-US
];

const MIN_HARDCODED_LENGTH = 8;
const MIN_WORD_COUNT = 2;

function looksLikeUntranslatedUiText(text) {
  if (text.length < MIN_HARDCODED_LENGTH) return false;
  const words = text.trim().split(/\s+/);
  if (words.length < MIN_WORD_COUNT) return false;
  if (!/^[A-Z]/.test(text)) return false; // must start uppercase
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(text)) return false;
  }
  // Must be mostly ASCII letters
  const letters = (text.match(/[a-zA-Z]/g) ?? []).length;
  if (letters / text.length < 0.5) return false;
  // Exclude strings with template placeholder syntax
  if (/\{[a-z]+\}/.test(text)) return false;
  return true;
}

function analyzePageText(textNodes) {
  const missingTranslations = []; // key exists, translation missing
  const hardcoded = [];           // no key at all

  for (const text of textNodes) {
    if (EN_VALUES.has(text)) {
      missingTranslations.push({ text, key: EN_VALUE_TO_KEY[text] ?? null });
    } else if (looksLikeUntranslatedUiText(text)) {
      hardcoded.push({ text });
    }
  }

  return { missingTranslations, hardcoded };
}

// ── Locale helpers ────────────────────────────────────────────────────────────

async function setLocale(page, locale) {
  await page.evaluate((loc) => {
    localStorage.setItem('churchcore.locale', loc);
  }, locale);
  await page.reload();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600); // allow catalog fetch + re-render
}

// ── Report writer ─────────────────────────────────────────────────────────────

const REPORTS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'reports',
);

async function writeReport(report) {
  await mkdir(REPORTS_DIR, { recursive: true });
  const outPath = path.join(REPORTS_DIR, 'i18n-audit.json');
  await writeFile(outPath, JSON.stringify(report, null, 2));
  return outPath;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('i18n audit — page-by-page untranslated text scan', () => {
  test.setTimeout(300_000); // audit can take a while

  test('scan all admin pages for untranslated English text (es-PR)', async ({ page }) => {
    const report = {
      generatedAt: new Date().toISOString(),
      locale: 'es-PR',
      pages: [],
      summary: {
        totalPages: 0,
        totalStringsScanned: 0,
        totalMissingTranslations: 0,
        totalHardcoded: 0,
        coveragePercent: 0,
      },
    };

    // Sign in and set es-PR locale
    await signInAs(page, 'practice_admin');
    await setLocale(page, 'es-PR');

    for (const { name, nav } of ADMIN_PAGES) {
      try {
        await openPrimaryNav(page, nav);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(800); // allow async data fetches

        const textNodes = await collectVisibleText(page);
        const { missingTranslations, hardcoded } = analyzePageText(textNodes);

        const pageResult = {
          name,
          nav,
          url: page.url(),
          stringsScanned: textNodes.length,
          missingTranslations,
          hardcoded,
          issueCount: missingTranslations.length + hardcoded.length,
        };

        report.pages.push(pageResult);

        // Log progress to console during the run
        const status = pageResult.issueCount === 0 ? '✓' : `✗ ${pageResult.issueCount} issues`;
        console.log(`  [${status}] ${name} (${textNodes.length} strings scanned)`);
        if (missingTranslations.length > 0) {
          console.log(`    Missing translations (${missingTranslations.length}):`);
          missingTranslations.slice(0, 5).forEach(({ text, key }) =>
            console.log(`      key="${key}" value="${text}"`),
          );
          if (missingTranslations.length > 5) console.log(`      ... and ${missingTranslations.length - 5} more`);
        }
        if (hardcoded.length > 0) {
          console.log(`    Hardcoded English (${hardcoded.length}):`);
          hardcoded.slice(0, 5).forEach(({ text }) => console.log(`      "${text}"`));
          if (hardcoded.length > 5) console.log(`      ... and ${hardcoded.length - 5} more`);
        }
      } catch (err) {
        report.pages.push({
          name,
          nav,
          url: page.url(),
          error: err.message,
          stringsScanned: 0,
          missingTranslations: [],
          hardcoded: [],
          issueCount: 0,
        });
        console.log(`  [!] ${name} — skipped (${err.message})`);
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    report.summary.totalPages = report.pages.length;
    report.summary.totalStringsScanned = report.pages.reduce((s, p) => s + p.stringsScanned, 0);
    report.summary.totalMissingTranslations = report.pages.reduce((s, p) => s + p.missingTranslations.length, 0);
    report.summary.totalHardcoded = report.pages.reduce((s, p) => s + p.hardcoded.length, 0);
    const totalIssues = report.summary.totalMissingTranslations + report.summary.totalHardcoded;
    const totalStrings = report.summary.totalStringsScanned;
    report.summary.coveragePercent = totalStrings > 0
      ? Math.round(((totalStrings - totalIssues) / totalStrings) * 100)
      : 100;

    const outPath = await writeReport(report);

    console.log('\n── i18n Audit Summary ───────────────────────────────────────');
    console.log(`  Pages scanned:           ${report.summary.totalPages}`);
    console.log(`  Strings scanned:         ${report.summary.totalStringsScanned}`);
    console.log(`  Missing translations:    ${report.summary.totalMissingTranslations}`);
    console.log(`  Hardcoded (no key):      ${report.summary.totalHardcoded}`);
    console.log(`  Coverage:                ${report.summary.coveragePercent}%`);
    console.log(`  Report written to:       ${outPath}`);
    console.log('');
    console.log('  Next step: node ops/i18n-add-missing-keys.mjs');
    console.log('─────────────────────────────────────────────────────────────');
  });

  test('scan client portal for untranslated English text (es-PR)', async ({ page }) => {
    const report = {
      generatedAt: new Date().toISOString(),
      locale: 'es-PR',
      pages: [],
    };

    await signInAs(page, 'client');
    await setLocale(page, 'es-PR');

    // Portal loads automatically after client login
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);

    const textNodes = await collectVisibleText(page);
    const { missingTranslations, hardcoded } = analyzePageText(textNodes);

    const pageResult = {
      name: 'Client Portal',
      url: page.url(),
      stringsScanned: textNodes.length,
      missingTranslations,
      hardcoded,
      issueCount: missingTranslations.length + hardcoded.length,
    };

    report.pages.push(pageResult);

    console.log(`\n── Client Portal Audit ──────────────────────────────────────`);
    console.log(`  Strings scanned:         ${textNodes.length}`);
    console.log(`  Missing translations:    ${missingTranslations.length}`);
    console.log(`  Hardcoded (no key):      ${hardcoded.length}`);

    // Merge into the main report if it exists, otherwise write standalone
    const { readFile } = await import('node:fs/promises');
    const mainReportPath = path.join(REPORTS_DIR, 'i18n-audit.json');
    try {
      const existing = JSON.parse(await readFile(mainReportPath, 'utf8'));
      existing.pages.push(...report.pages);
      existing.summary.totalPages += 1;
      existing.summary.totalStringsScanned += pageResult.stringsScanned;
      existing.summary.totalMissingTranslations += pageResult.missingTranslations.length;
      existing.summary.totalHardcoded += pageResult.hardcoded.length;
      await writeReport(existing);
      console.log(`  Merged into main report: ${mainReportPath}`);
    } catch {
      await mkdir(REPORTS_DIR, { recursive: true });
      await writeFile(
        path.join(REPORTS_DIR, 'i18n-audit-portal.json'),
        JSON.stringify(report, null, 2),
      );
    }
  });
});

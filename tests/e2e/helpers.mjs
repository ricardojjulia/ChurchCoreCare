import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect } from '@playwright/test';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

/**
 * Test credentials used by E2E tests.
 * These accounts must exist in the DB (created by the migration seed).
 * Override via TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD env vars.
 */
const TEST_ACCOUNTS = {
  // Default seeded account (practice_admin)
  Administrator: {
    email:    process.env.TEST_ADMIN_EMAIL    || 'admin@faithcounseling.local',
    password: process.env.TEST_ADMIN_PASSWORD || 'ChangeMe!Dev2024#',
  },
};

/**
 * Sign in via the real login form.
 *
 * Falls back to the legacy role-selector flow when the login form is not
 * present (i.e. when running against an API without a database configured),
 * so existing CI pipelines that don't set up MySQL continue to work.
 */
export async function signInAs(page, role) {
  await page.goto('/');

  // Detect which auth UI is rendered
  const isLoginForm = await page.locator('#loginEmail').isVisible({ timeout: 3000 }).catch(() => false);

  if (isLoginForm) {
    // Real login form
    const account = TEST_ACCOUNTS[role] ?? TEST_ACCOUNTS.Administrator;
    await page.fill('#loginEmail', account.email);
    await page.fill('#loginPassword', account.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('#authGate')).toBeHidden({ timeout: 10000 });
  } else {
    // Legacy role-selector fallback (no DB)
    await expect.poll(async () => page.locator('#roleSelect option').count()).toBeGreaterThan(0);
    await page.selectOption('#roleSelect', role);
    await page.click('#continueButton');
    await expect(page.locator('#authGate')).toBeHidden();
  }

  await expect(page.locator('#userBadge')).toBeVisible({ timeout: 5000 });
}

export async function openPrimaryNav(page, navKey) {
  // Open the nav drawer if the item is not yet in the viewport (collapsed sidebar).
  const target = page.locator(`[data-nav-key="${navKey}"]`);
  const inViewport = await target.isVisible({ timeout: 500 }).catch(() => false)
    && await target.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight;
    }).catch(() => false);
  if (!inViewport) {
    await page.click('[aria-label="Toggle navigation"]');
    await expect(target).toBeVisible();
  }
  await target.click();
}

export function futureDateTimeLocal({ days = 1, hours = 10, minutes = 0 } = {}) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function injectAxe(page) {
  await page.addScriptTag({ content: axeSource });
}

export async function runStructuralAxe(page) {
  return page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: {
        type: 'rule',
        values: [
          'aria-allowed-attr',
          'aria-required-children',
          'aria-required-parent',
          'button-name',
          'form-field-multiple-labels',
          'label',
          'landmark-one-main',
          'page-has-heading-one',
        ],
      },
    });
  });
}

export async function readLaunchMetrics(page) {
  return page.evaluate(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const appAsset = resources.find((entry) => entry.name.includes('/assets/index') || entry.name.includes('/assets/app.js'));

    return {
      domContentLoadedMs: Math.round(navigationEntry?.domContentLoadedEventEnd ?? 0),
      loadMs: Math.round(navigationEntry?.loadEventEnd ?? 0),
      bundleBytes: Math.round(appAsset?.transferSize || appAsset?.encodedBodySize || 0),
      resourceCount: resources.length,
    };
  });
}

export function prettifyRole(role) {
  return role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
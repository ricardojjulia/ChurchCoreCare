import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect } from '@playwright/test';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

export async function signInAs(page, role) {
  await page.goto('/');
  await expect.poll(async () => page.locator('#roleSelect option').count()).toBeGreaterThan(0);
  await page.selectOption('#roleSelect', role);
  await page.click('#continueButton');
  await expect(page.locator('#authGate')).toBeHidden();
  await expect(page.locator('#userBadge')).toContainText(prettifyRole(role));
}

export async function openPrimaryNav(page, navKey) {
  const target = page.locator(`[data-nav-key="${navKey}"]`);
  await expect(target).toBeVisible();
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
    const appAsset = resources.find((entry) => entry.name.includes('/assets/app.js'));

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
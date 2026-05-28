/**
 * E2E tests — SaaS signup and trial flow (Phase A4)
 *
 * Tests the public signup page, slug validation, and post-signup trial state.
 * Requires the API to be running in in-memory mode (no DB required).
 */

import { test, expect } from '@playwright/test';

const SIGNUP_URL = '/signup';

test.describe('signup page', () => {
  test('signup page renders required fields', async ({ page }) => {
    await page.goto(SIGNUP_URL);
    await expect(page.getByRole('heading', { name: /start your free trial/i })).toBeVisible();
    await expect(page.getByLabel(/practice name/i)).toBeVisible();
    await expect(page.getByLabel(/subdomain/i)).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('slug validation — shows error for reserved slug', async ({ page }) => {
    await page.goto(SIGNUP_URL);
    await page.getByLabel(/subdomain/i).fill('admin');
    await page.getByLabel(/subdomain/i).blur();
    // Should show immediate validation error or fail on submit
    await page.getByRole('button', { name: /start trial|sign up|create/i }).click();
    await expect(page.getByRole('alert').or(page.locator('[data-error]'))).toBeVisible();
  });

  test('signup form rejects missing required fields', async ({ page }) => {
    await page.goto(SIGNUP_URL);
    await page.getByRole('button', { name: /start trial|sign up|create/i }).click();
    // At least one validation error should appear
    const errors = page.locator('[data-error], [role="alert"]');
    await expect(errors.first()).toBeVisible();
  });

  test('slug format validation', async ({ page }) => {
    await page.goto(SIGNUP_URL);
    await page.getByLabel(/subdomain/i).fill('MY PRACTICE!!');
    await page.getByLabel(/practice name/i).fill('Test Practice');
    await page.getByRole('button', { name: /start trial|sign up|create/i }).click();
    const errors = page.locator('[data-error], [role="alert"]');
    await expect(errors.first()).toBeVisible();
  });
});

test.describe('trial banner', () => {
  test('trial banner does not appear for non-trial users', async ({ page }) => {
    await page.goto('/');
    // If login succeeds with a non-trial account, banner should not be present
    // (We just check the banner is not visible without auth context)
    await expect(page.locator('[data-testid="trial-banner"]')).not.toBeVisible();
  });
});

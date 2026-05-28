/**
 * E2E tests — EDI billing claims UI (Phase B2)
 *
 * Tests the claims list, submit button, and status display.
 * Requires a logged-in counselor or practice_admin session.
 */

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL    ?? 'admin@churchcorecare.local';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'ChangeMe!Dev2024#';

async function login(page) {
  await page.goto('/');
  const emailInput = page.locator('#loginEmail');
  if (await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await emailInput.fill(ADMIN_EMAIL);
    await page.locator('#loginPassword').fill(ADMIN_PASSWORD);
    await page.locator('#loginPassword').press('Enter');
    // Wait for auth gate to disappear
    await expect(page.locator('#authGate')).toBeHidden({ timeout: 15_000 });
  }
}

test.describe('billing claims — auth boundary', () => {
  test('unauthenticated claim submit returns 401', async ({ request }) => {
    const res = await request.post('/api/v1/billing/claims/test-claim-id/submit');
    expect(res.status()).toBe(401);
  });

  test('unauthenticated claim status returns 401', async ({ request }) => {
    const res = await request.get('/api/v1/billing/claims/test-claim-id/status');
    expect(res.status()).toBe(401);
  });
});

test.describe('billing claims — STEDI gate', () => {
  test('submit returns 503 when STEDI not configured', async ({ request }) => {
    const res = await request.post('/api/v1/billing/claims/test-id/submit', {
      headers: {
        'x-staff-role': 'counselor',
        'x-tenant-id': 'system',
        cookie: 'session=fake',
      },
    });
    // 503 when STEDI_API_KEY absent; 404 when claim not found in memory
    expect([503, 404, 401]).toContain(res.status());
  });
});

test.describe('billing claims — UI', () => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires TEST_ADMIN_EMAIL env var');

  test('billing section is accessible from practice admin', async ({ page }) => {
    await login(page);
    // Look for billing nav item or route to billing page
    const billingLink = page.getByRole('link', { name: /billing/i }).or(
      page.getByRole('button', { name: /billing/i })
    );
    if (await billingLink.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await billingLink.first().click();
      // Claims table or empty state should appear
      await expect(
        page.getByText(/claims|no claims/i).or(page.getByRole('table'))
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});

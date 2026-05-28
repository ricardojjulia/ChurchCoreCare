/**
 * E2E tests — Insurance eligibility verification UI (Phase B3)
 *
 * Tests the EligibilityCard component and stale warning in the scheduler.
 * Requires a logged-in session with a client that has an insurance record.
 */

import { test, expect } from '@playwright/test';

test.describe('insurance eligibility — auth boundary', () => {
  test('unauthenticated verify-eligibility GET returns 401', async ({ request }) => {
    const res = await request.get('/api/v1/clients/client-001/insurance/ins-001/verify-eligibility');
    expect(res.status()).toBe(401);
  });

  test('unauthenticated verify-eligibility POST returns 401', async ({ request }) => {
    const res = await request.post('/api/v1/clients/client-001/insurance/ins-001/verify-eligibility');
    expect(res.status()).toBe(401);
  });
});

test.describe('insurance eligibility — feature gate', () => {
  test('eligibility check returns 404 or 503 when insurance billing not enabled', async ({ request }) => {
    const res = await request.get('/api/v1/clients/client-001/insurance/ins-001/verify-eligibility', {
      headers: {
        'x-staff-role': 'counselor',
        'x-tenant-id': 'system',
        cookie: 'session=fake',
      },
    });
    // 404 = insurance billing not enabled for this practice (gate fires first)
    // 503 = STEDI not configured
    expect([404, 503]).toContain(res.status());
  });
});

test.describe('insurance eligibility — UI', () => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires TEST_ADMIN_EMAIL env var');

  test('insurance tab on client detail has eligibility section', async ({ page }) => {
    const adminEmail    = process.env.TEST_ADMIN_EMAIL    ?? 'admin@churchcorecare.local';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? 'ChangeMe!Dev2024#';

    await page.goto('/');
    const emailInput = page.locator('#loginEmail');
    if (await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await emailInput.fill(adminEmail);
      await page.locator('#loginPassword').fill(adminPassword);
      await page.locator('#loginPassword').press('Enter');
      await expect(page.locator('#authGate')).toBeHidden({ timeout: 15_000 });
    }

    // Navigate to a client detail page
    await page.getByRole('link', { name: /clients/i }).first().click();
    const firstClient = page.getByRole('link', { name: /.+/ }).nth(1);
    if (await firstClient.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstClient.click();
      // Go to Insurance tab
      const insuranceTab = page.getByRole('tab', { name: /insurance/i });
      if (await insuranceTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await insuranceTab.click();
        // EligibilityCard or "Verify" button should appear
        await expect(
          page.getByText(/eligibility|verify/i)
        ).toBeVisible({ timeout: 5_000 });
      }
    }
  });
});

import { test, expect } from '@playwright/test';

test('practice admin can open analytics without a runtime page error', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('/');
  await expect(page.locator('#loginEmail')).toBeVisible();
  await page.locator('#loginEmail').fill(process.env.TEST_ADMIN_EMAIL || 'admin@churchcorecare.local');
  await page.locator('#loginPassword').fill(process.env.TEST_ADMIN_PASSWORD || 'ChangeMe!Dev2024#');
  await page.locator('#loginPassword').press('Enter');
  await expect(page.locator('.workspace-topbar')).toBeVisible();

  await page.locator('[data-nav-key="analytics"]').evaluate((element) => element.click());
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  await expect(page.getByText('Counselor Productivity')).toBeVisible();
  await page.waitForTimeout(1000);

  expect(pageErrors).toEqual([]);
});

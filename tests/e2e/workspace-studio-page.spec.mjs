import { test, expect } from '@playwright/test';

test('practice admin can open Workspace Studio without a runtime page error', async ({ page }) => {
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

  await page.locator('[data-nav-key="workspace-studio"]').evaluate((element) => element.click());
  await expect(page.getByRole('heading', { name: 'Workspace Studio' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Chart' })).toBeVisible();
  await page.getByRole('tab', { name: 'Chart' }).click();
  await expect(page.getByText('Clinical Form & Instrument Catalog')).toBeVisible();

  expect(pageErrors).toEqual([]);
});

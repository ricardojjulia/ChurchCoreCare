import { test, expect } from '@playwright/test';

test('demo feedback modal submits bounded context without trusted fields', async ({ page }) => {
  let submittedPayload = null;
  await page.route('**/api/v1/demo-feedback', async (route) => {
    submittedPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '33333333-3333-4333-8333-333333333333',
        hitCount: 1,
      }),
    });
  });

  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Report demo feedback' }).click();
  await expect(page.getByRole('dialog', { name: 'Demo feedback' })).toBeVisible();

  await page.getByRole('combobox', {
    name: 'What would you like to report?',
  }).click();
  await page.getByRole('option', { name: 'Improvement idea' }).click();
  await page.getByLabel('Notes').fill('Add a more compact dashboard view.');
  await page.getByRole('button', { name: 'Send feedback' }).click();

  await expect(page.getByText('Feedback received')).toBeVisible();
  expect(submittedPayload).toMatchObject({
    route: 'dashboard',
    category: 'IMPROVEMENT',
    note: 'Add a more compact dashboard view.',
    breadcrumbs: ['dashboard'],
  });
  expect(submittedPayload.sessionId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  expect(submittedPayload.sessionDurationSeconds).toBeGreaterThanOrEqual(0);
  expect(submittedPayload).not.toHaveProperty('userEmail');
  expect(submittedPayload).not.toHaveProperty('userRole');
  expect(submittedPayload).not.toHaveProperty('fingerprint');
});

test('monitoring page renders the shared privacy-safe surface registry', async ({ page }) => {
  await page.goto('/monitor.html');
  await expect(page.getByText('Shared Surface Registry')).toBeVisible();
  await expect(page.locator('#surfaceRegistryCount')).toContainText('registered');
  await expect(page.locator('#surfaceRegistryGrid')).toContainText('modal.demo_feedback');
  await expect(page.locator('#surfaceRegistryGrid')).not.toContainText('sessionId');
});

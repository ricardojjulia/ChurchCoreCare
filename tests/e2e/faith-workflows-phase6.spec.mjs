import { test, expect } from '@playwright/test';
import { openPrimaryNav, signInAs } from './helpers.mjs';

test.describe('faith workflows phase 6 regression', () => {
  test('practice admin can open Faith Workflows and view recommendation details', async ({ page }) => {
    await signInAs(page, 'practice_admin');
    await openPrimaryNav(page, 'faith');

    await expect(page.getByTestId('faith-workflows-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Faithful Workflows/i })).toBeVisible();
    await expect(page.getByText(/Final clinical judgment belongs to the counselor|Crisis situations require immediate human intervention/i)).toBeVisible();

    const emmaRow = page.getByTestId('workflow-client-row').filter({ hasText: /Emma/i }).first();
    const firstRow = page.getByTestId('workflow-client-row').first();
    if (await emmaRow.count()) {
      await emmaRow.click();
    } else {
      await firstRow.click();
    }

    await expect(page.getByTestId('workflow-canvas')).toBeVisible();
    await expect.poll(async () => page.getByTestId('workflow-node').count(), { timeout: 15000 }).toBeGreaterThan(0);

    await page.getByTestId('workflow-node').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText(/Why surfaced|Generated draft|Clinical relevance/i);
  });

  test('workflow categories can collapse and expand', async ({ page }) => {
    await signInAs(page, 'practice_admin');
    await openPrimaryNav(page, 'faith');

    const emmaRow = page.getByTestId('workflow-client-row').filter({ hasText: /Emma/i }).first();
    const firstRow = page.getByTestId('workflow-client-row').first();
    if (await emmaRow.count()) {
      await emmaRow.click();
    } else {
      await firstRow.click();
    }

    const safetyItems = page.getByTestId('workflow-category-items-safety');
    const safetyToggle = page.getByTestId('workflow-category-toggle-safety');

    await expect(safetyToggle).toBeVisible();
    await expect(safetyItems).toBeVisible();

    await safetyToggle.click();
    await expect(safetyItems).toHaveCount(0);

    await safetyToggle.click();
    await expect(safetyItems).toBeVisible();
  });
});

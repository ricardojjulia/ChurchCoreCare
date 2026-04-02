import { test, expect } from '@playwright/test';
import { openPrimaryNav, signInAs } from './helpers.mjs';

function buildClientItems(count) {
  return Array.from({ length: count }).map((_, idx) => ({
    id: `load-client-${idx + 1}`,
    firstName: `Load${idx + 1}`,
    lastName: 'Client',
    status: 'active',
    highTouchpoint: idx % 12 === 0,
    createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
  }));
}

test.describe('faith workflows phase 6b regressions', () => {
  test('long-list mode shows progressive loading control and appends rows on demand', async ({ page }) => {
    await page.route('**/api/v1/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: buildClientItems(170) }),
      });
    });

    await signInAs(page, 'practice_admin');
    await openPrimaryNav(page, 'faith');

    await expect(page.getByTestId('faith-workflows-page')).toBeVisible();
    await expect(page.getByTestId('workflow-client-list')).toBeVisible();

    const rows = page.getByTestId('workflow-client-row');
    await expect.poll(async () => rows.count(), { timeout: 15000 }).toBe(100);

    const showMore = page.getByTestId('workflow-show-more-clients');
    await expect(showMore).toBeVisible();
    await showMore.click();

    await expect.poll(async () => rows.count(), { timeout: 10000 }).toBe(150);
    await expect(showMore).toBeVisible();

    await showMore.click();
    await expect.poll(async () => rows.count(), { timeout: 10000 }).toBeGreaterThan(170);
  });

  test('dense canvas auto-collapses lower categories and allows manual expand/collapse', async ({ page }) => {
    await signInAs(page, 'practice_admin');
    await openPrimaryNav(page, 'faith');

    const emmaRow = page.getByTestId('workflow-client-row').filter({ hasText: /Emma/i }).first();
    if (await emmaRow.count()) {
      await emmaRow.click();
    } else {
      await page.getByTestId('workflow-client-row').first().click();
    }

    await expect(page.getByTestId('workflow-canvas')).toBeVisible();

    const collapsedTarget = page.getByTestId('workflow-category-items-spiritual');
    const toggle = page.getByTestId('workflow-category-toggle-spiritual');

    await expect(toggle).toBeVisible();
    await expect(collapsedTarget).toHaveCount(0);

    await toggle.click();
    await expect(collapsedTarget).toBeVisible();

    await toggle.click();
    await expect(collapsedTarget).toHaveCount(0);
  });
});

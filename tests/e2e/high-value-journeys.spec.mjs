import { test, expect } from '@playwright/test';
import { futureDateTimeLocal, openPrimaryNav, signInAs } from './helpers.mjs';

test.describe('high-value UI journeys', () => {
  test('practice admin can create a client, schedule an appointment, and refresh reporting', async ({ page }) => {
    const suffix = String(Date.now()).slice(-6);
    const firstName = `Step${suffix}`;
    const lastName = 'Journey';

    await signInAs(page, 'practice_admin');
    await expect(page.locator('#metricApptValue')).toHaveText('5');
    await expect(page.locator('#metricApptMeta')).toContainText('Appointment type model is in sync');
    await openPrimaryNav(page, 'clients');
    await expect(page.locator('[data-panel="clients"]')).toBeVisible();

    await page.fill('#newClientFirstName', firstName);
    await page.fill('#newClientLastName', lastName);
    await page.fill('#newClientFaithBackground', 'Evangelical');
    await page.click('#createClientButton');

    await expect(page.locator('#newAppointmentClientSelect')).toContainText(`${firstName} ${lastName}`);

    await page.click('#newAppointmentButton');
    await expect(page.locator('[data-panel="appointments"]')).toBeVisible();
    await expect(page.locator('#newAppointmentTypeSelect option')).toHaveCount(5);
    await page.selectOption('#newAppointmentClientSelect', { label: `${firstName} ${lastName}` });
    await page.selectOption('#newAppointmentTypeSelect', 'couples_therapy');
    await page.fill('#newAppointmentStart', futureDateTimeLocal({ days: 1, hours: 10, minutes: 0 }));
    await page.fill('#newAppointmentEnd', futureDateTimeLocal({ days: 1, hours: 11, minutes: 0 }));
    await page.fill('#newAppointmentCounselor', 'Journey Counselor');
    await page.fill('#newAppointmentLocation', 'Journey Room');
    await page.click('#createAppointmentButton');

    await expect(page.locator('#appointmentSelect')).toContainText(`${firstName} ${lastName}`);
    const createdAppointmentId = await page.locator('#appointmentSelect option').evaluateAll(
      (options, expectedName) => options.find((option) => option.textContent?.includes(expectedName))?.getAttribute('value') ?? '',
      `${firstName} ${lastName}`,
    );
    expect(createdAppointmentId).not.toBe('');
    await page.selectOption('#appointmentSelect', createdAppointmentId);
    await expect(page.locator('#appointmentTypeSelect')).toHaveValue('couples_therapy');

    await openPrimaryNav(page, 'reporting');
    await page.click('#refreshReportingOverviewButton');
    await expect(page.locator('#manageStatus')).toContainText('Reporting overview refreshed.');
    await expect(page.locator('#reportingSummary')).toHaveValue(/Sessions in Window:/);
  });

  test('platform admin can submit tenant provisioning from the reporting workspace', async ({ page }) => {
    const suffix = String(Date.now()).slice(-5);

    await signInAs(page, 'platform_admin');
    await expect(page.locator('[data-nav-key="clients"]')).toBeHidden();

    await openPrimaryNav(page, 'reporting');
    await expect(page.locator('[data-tab="reporting"]')).toBeVisible();
    await expect(page.locator('[data-tab="billing"]')).toBeHidden();

    await page.fill('#platformRequestedTenantId', `ui-${suffix}`);
    await page.fill('#platformRequestedPracticeName', `UI Journey ${suffix}`);
    await page.fill('#platformOwnerEmail', `owner+${suffix}@example.com`);
    await page.click('#createTenantProvisioningButton');

    await expect(page.locator('#platformRequestedPracticeName')).toHaveValue('');
    await expect(page.locator('#platformOwnerEmail')).toHaveValue('');
  });

  test('client can use the portal appointment-request workflow and cannot see admin navigation', async ({ page }) => {
    await signInAs(page, 'client');
    await expect(page.locator('[data-nav-key="reporting"]')).toBeHidden();
    await expect(page.locator('[data-nav-key="portal"]')).toBeVisible();

    await openPrimaryNav(page, 'portal');
    await expect(page.locator('[data-panel="portal"]')).toBeVisible();
    await expect.poll(async () => page.locator('#portalOverviewSummary').inputValue()).not.toContain('No portal client selected.');

    await page.fill('#portalRequestStart', futureDateTimeLocal({ days: 2, hours: 14, minutes: 0 }));
    await page.fill('#portalRequestEnd', futureDateTimeLocal({ days: 2, hours: 15, minutes: 0 }));
    await page.fill('#portalRequestNotes', 'Browser automation request');
    await page.click('#createPortalRequestButton');

    await expect(page.locator('#portalRequestNotes')).toHaveValue('');
    await expect(page.locator('#portalOverviewSummary')).toHaveValue(/Appointment Requests:/);
  });
});
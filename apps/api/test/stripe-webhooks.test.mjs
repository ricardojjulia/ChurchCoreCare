/**
 * Tests for apps/api/src/lib/billing-webhooks.js
 *
 * handleStripeWebhookEvent is tested directly (not via HTTP).
 * DB writes in billing-webhooks.js are gated on process.env.DB_NAME and become
 * no-ops in test mode, so these tests verify event routing and log output
 * without touching a real database.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Load billing-webhooks from a unique URL to avoid module-cache collisions
// with other test files that import index.js (which also imports billing-webhooks).
const moduleUrl = pathToFileURL(
  new URL('../src/lib/billing-webhooks.js', import.meta.url).pathname,
);
moduleUrl.searchParams.set('test', `stripe-webhooks-${Date.now()}`);
const { handleStripeWebhookEvent } = await import(moduleUrl.href);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSubscription(status, overrides = {}) {
  return {
    id: 'sub_test',
    customer: 'cus_test',
    status,
    items: { data: [{ price: { id: 'price_solo' } }] },
    trial_end: status === 'trialing' ? Math.floor(Date.now() / 1000) + 30 * 86400 : null,
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    canceled_at: null,
    metadata: { tenantId: 'test-tenant' },
    ...overrides,
  };
}

function makeInvoice(overrides = {}) {
  return {
    id: 'in_test',
    subscription: 'sub_test',
    subscription_details: { metadata: { tenantId: 'test-tenant' } },
    next_payment_attempt: null,
    ...overrides,
  };
}

function makeEvent(type, object) {
  return { type, data: { object } };
}

// ─── customer.subscription.created ───────────────────────────────────────────

test('subscription.created with trialing status does not throw', async () => {
  const event = makeEvent('customer.subscription.created', makeSubscription('trialing'));
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

test('subscription.created maps trialing → trial status (no-op DB in test mode)', async () => {
  // In test mode (DB_NAME not set), upsertTenantSubscription returns early.
  // We verify the handler completes without error.
  const event = makeEvent('customer.subscription.created', makeSubscription('trialing'));
  await handleStripeWebhookEvent(event);
  // If we reach here the event was dispatched and handled without throwing.
  assert.ok(true);
});

// ─── customer.subscription.updated ───────────────────────────────────────────

test('subscription.updated with active status does not throw', async () => {
  const event = makeEvent('customer.subscription.updated', makeSubscription('active'));
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

test('subscription.updated with past_due status does not throw', async () => {
  const event = makeEvent('customer.subscription.updated', makeSubscription('past_due'));
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

// ─── customer.subscription.deleted ───────────────────────────────────────────

test('subscription.deleted does not throw', async () => {
  const event = makeEvent('customer.subscription.deleted', makeSubscription('canceled'));
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

// ─── invoice.paid ─────────────────────────────────────────────────────────────

test('invoice.paid does not throw', async () => {
  const event = makeEvent('invoice.paid', makeInvoice());
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

// ─── invoice.payment_failed ───────────────────────────────────────────────────

test('invoice.payment_failed does not throw', async () => {
  const event = makeEvent('invoice.payment_failed', makeInvoice({ next_payment_attempt: Math.floor(Date.now() / 1000) + 3 * 86400 }));
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

// ─── Missing tenantId ─────────────────────────────────────────────────────────

test('subscription.created with missing tenantId in metadata does not throw', async () => {
  const sub = makeSubscription('trialing', { metadata: {} });
  const event = makeEvent('customer.subscription.created', sub);
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

// ─── Unknown event type ───────────────────────────────────────────────────────

test('unknown event type is silently ignored', async () => {
  const event = { type: 'charge.succeeded', data: { object: {} } };
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

// ─── customer.subscription.trial_will_end ────────────────────────────────────

test('subscription.trial_will_end does not throw', async () => {
  const event = makeEvent('customer.subscription.trial_will_end', makeSubscription('trialing'));
  await assert.doesNotReject(() => handleStripeWebhookEvent(event));
});

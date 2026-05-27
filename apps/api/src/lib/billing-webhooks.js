import pool from '../db/pool.js';
import { logError, logInfo } from './log.js';
import { sendEmail, paymentFailedEmail } from './email.js';

// ─── Subscription status mapping ─────────────────────────────────────────────
// Maps Stripe subscription statuses to our internal subscription_status values.
const STRIPE_STATUS_MAP = {
  trialing: 'trial',
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'past_due',
  incomplete: 'incomplete',
  incomplete_expired: 'canceled',
  paused: 'paused',
};

function mapStripeStatus(stripeStatus) {
  return STRIPE_STATUS_MAP[stripeStatus] ?? 'unknown';
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function upsertTenantSubscription(fields) {
  const {
    tenantId, stripeCustomerId, stripeSubscriptionId,
    stripePriceId, status, trialEndsAt, currentPeriodEnd, canceledAt,
  } = fields;

  if (!process.env.DB_NAME) return;

  await pool.query(
    `INSERT INTO tenant_subscriptions
       (tenant_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
        status, trial_ends_at, current_period_end, canceled_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (tenant_id) DO UPDATE SET
       stripe_customer_id     = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       stripe_price_id        = EXCLUDED.stripe_price_id,
       status                 = EXCLUDED.status,
       trial_ends_at          = EXCLUDED.trial_ends_at,
       current_period_end     = EXCLUDED.current_period_end,
       canceled_at            = EXCLUDED.canceled_at,
       updated_at             = NOW()`,
    [
      tenantId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      status,
      trialEndsAt ? new Date(trialEndsAt * 1000).toISOString() : null,
      currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      canceledAt ? new Date(canceledAt * 1000).toISOString() : null,
    ],
  );
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleSubscriptionCreated(subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) {
    logError({ event: 'stripe.webhook.missing_tenant_id', subscriptionId: subscription.id });
    return;
  }

  await upsertTenantSubscription({
    tenantId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price?.id,
    status: mapStripeStatus(subscription.status),
    trialEndsAt: subscription.trial_end,
    currentPeriodEnd: subscription.current_period_end,
    canceledAt: subscription.canceled_at,
  });

  logInfo({ event: 'stripe.subscription.created', tenantId, subscriptionId: subscription.id });
}

async function handleSubscriptionUpdated(subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) return;

  await upsertTenantSubscription({
    tenantId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price?.id,
    status: mapStripeStatus(subscription.status),
    trialEndsAt: subscription.trial_end,
    currentPeriodEnd: subscription.current_period_end,
    canceledAt: subscription.canceled_at,
  });

  logInfo({ event: 'stripe.subscription.updated', tenantId, subscriptionId: subscription.id, status: subscription.status });
}

async function handleSubscriptionDeleted(subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) return;

  if (!process.env.DB_NAME) return;
  await pool.query(
    `UPDATE tenant_subscriptions SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
     WHERE tenant_id = $1`,
    [tenantId],
  );

  logInfo({ event: 'stripe.subscription.deleted', tenantId, subscriptionId: subscription.id });
}

async function handleInvoicePaid(invoice) {
  const tenantId = invoice.subscription_details?.metadata?.tenantId
    ?? invoice.metadata?.tenantId;
  if (!tenantId || !invoice.subscription) return;

  if (!process.env.DB_NAME) return;
  await pool.query(
    `UPDATE tenant_subscriptions
     SET status = 'active', updated_at = NOW()
     WHERE tenant_id = $1 AND stripe_subscription_id = $2`,
    [tenantId, invoice.subscription],
  );

  logInfo({ event: 'stripe.invoice.paid', tenantId, invoiceId: invoice.id });
}

async function handleInvoicePaymentFailed(invoice) {
  const tenantId = invoice.subscription_details?.metadata?.tenantId
    ?? invoice.metadata?.tenantId;
  if (!tenantId || !invoice.subscription) return;

  if (!process.env.DB_NAME) return;
  await pool.query(
    `UPDATE tenant_subscriptions
     SET status = 'past_due', updated_at = NOW()
     WHERE tenant_id = $1 AND stripe_subscription_id = $2`,
    [tenantId, invoice.subscription],
  );

  // Best-effort payment-failed notification — fetch owner email from provisioning record
  try {
    const provResult = await pool.query(
      `SELECT requested_practice_name, owner_email FROM tenant_provisioning WHERE requested_tenant_id = $1 LIMIT 1`,
      [tenantId],
    );
    const prov = provResult.rows?.[0];
    if (prov?.owner_email) {
      const nextRetry = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null;
      const { subject, text } = paymentFailedEmail(prov.requested_practice_name ?? '', nextRetry);
      await sendEmail({ to: prov.owner_email, subject, text });
    }
  } catch {
    // email failure is non-fatal
  }

  logInfo({ event: 'stripe.invoice.payment_failed', tenantId, invoiceId: invoice.id });
}

async function handleTrialWillEnd(subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) return;
  logInfo({ event: 'stripe.trial.will_end', tenantId, subscriptionId: subscription.id, trialEnd: subscription.trial_end });
  // Future: trigger in-app trial expiry notification via worker
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object);
      break;
    default:
      // Unhandled event types are ignored — Stripe sends many event types
      // and we only care about the ones above.
      break;
  }
}

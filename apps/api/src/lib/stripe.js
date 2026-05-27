import Stripe from 'stripe';

// Lazily initialized — only created when STRIPE_SECRET_KEY is present.
let _stripe = null;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
      appInfo: { name: 'ChurchCore Care', version: '6.1.0' },
    });
  }
  return _stripe;
}

// ─── Plan constants ───────────────────────────────────────────────────────────
// Price IDs are loaded from env so staging and production can point to
// different Stripe prices without code changes.
export const PLANS = {
  solo: {
    name: 'Solo',
    priceId: () => process.env.STRIPE_PRICE_SOLO,
    maxCounselors: 1,
    trialDays: 30,
  },
  group: {
    name: 'Group',
    priceId: () => process.env.STRIPE_PRICE_GROUP,
    maxCounselors: 3,
    trialDays: 30,
  },
  seat: {
    name: 'Additional Seat',
    priceId: () => process.env.STRIPE_PRICE_SEAT,
    maxCounselors: null,
    trialDays: 0,
  },
};

export function getPlanByKey(key) {
  const plan = PLANS[key];
  if (!plan) throw new Error(`Unknown plan key: ${key}`);
  return plan;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function createCustomer({ email, name, tenantId }) {
  const stripe = getStripe();
  return stripe.customers.create({
    email,
    name,
    metadata: { tenantId },
  });
}

export async function getCustomer(customerId) {
  const stripe = getStripe();
  return stripe.customers.retrieve(customerId);
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export async function createSubscription({ customerId, priceId, trialDays = 30, tenantId }) {
  const stripe = getStripe();
  const params = {
    customer: customerId,
    items: [{ price: priceId }],
    metadata: { tenantId },
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
  };

  if (trialDays > 0) {
    params.trial_period_days = trialDays;
  }

  return stripe.subscriptions.create(params);
}

export async function cancelSubscription(subscriptionId, { immediately = false } = {}) {
  const stripe = getStripe();
  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function reactivateSubscription(subscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function getSubscription(subscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

// ─── Billing portal ───────────────────────────────────────────────────────────

export async function createBillingPortalSession({ customerId, returnUrl }) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export async function createCheckoutSession({ customerId, priceId, trialDays = 30, successUrl, cancelUrl, tenantId }) {
  const stripe = getStripe();
  const params = {
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenantId },
    subscription_data: { metadata: { tenantId } },
  };

  if (trialDays > 0) {
    params.subscription_data.trial_period_days = trialDays;
  }

  return stripe.checkout.sessions.create(params);
}

// ─── Webhook signature verification ──────────────────────────────────────────

export function constructWebhookEvent(rawBody, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

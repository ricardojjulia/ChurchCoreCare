# ADR-0003 — Use Stripe for Subscription Billing

**Date:** 2026-05-26  
**Status:** Accepted  
**Deciders:** Engineering

---

## Context

ChurchCore Care needs a recurring billing system to charge practices a monthly subscription fee (Solo $69/mo, Group $99/mo). The system must handle trial periods, payment failures, grace periods, cancellations, and plan upgrades without ChurchCore engineering owning the billing state machine.

Requirements:
- 30-day free trial with no credit card required at signup
- Automatic dunning (retry failed payments, suspend after grace period)
- HIPAA Business Associate Agreement available
- Self-serve billing portal so practices can update cards without contacting support
- Webhook-driven subscription lifecycle events

## Decision

Use **Stripe** as the exclusive payment processor and subscription lifecycle engine.

Stripe products and prices are created in the Stripe dashboard and referenced via `STRIPE_PRICE_SOLO`, `STRIPE_PRICE_GROUP`, `STRIPE_PRICE_SEAT` environment variables so staging and production can point to different price objects without code changes.

All subscription state changes are driven by Stripe webhooks (`customer.subscription.*`, `invoice.*`) — ChurchCore never polls Stripe for subscription status. The local `tenant_subscriptions` table is the projection of Stripe state for fast reads.

A Stripe Billing Portal session is used for self-service card updates and plan changes, eliminating the need to build card capture UI or PCI-DSS scope expansion.

## Consequences

**Positive:**
- Stripe signs a HIPAA BAA, satisfying the BAA requirement for billing data
- Webhook-driven architecture means subscription state is eventually consistent without polling
- Stripe handles PCI-DSS compliance for card storage; ChurchCore stores no card data
- Billing Portal covers self-service card update, plan change, and invoice download for free
- Industry-standard SDK (`stripe` npm package) with strong TypeScript types

**Negative:**
- Vendor lock-in: migrating away from Stripe requires re-implementing the subscription state machine and migrating all customer records
- Stripe fees (~2.9% + $0.30 per transaction) are a cost center that scales with revenue
- Webhook delivery is eventually consistent — a brief lag between Stripe event and local DB update is possible

**Mitigations:**
- Local `tenant_subscriptions` table acts as a read cache; RBAC and subscription gate read from it without hitting Stripe on every request
- Worker dunning job (`subscription-billing.js`) handles suspension after grace period independently of Stripe webhooks, providing a safety net if webhooks are delayed

## Alternatives Considered

| Alternative | Why Not Chosen |
|---|---|
| Self-hosted billing (direct Stripe Charges API) | No subscription lifecycle management; would require building dunning, proration, and upgrade flows |
| Paddle | No HIPAA BAA available |
| Recurly / Chargebee | Higher per-seat cost; added operational complexity without material benefit for current scale |
| No metered billing | Not viable for SaaS; practices need predictable monthly billing |

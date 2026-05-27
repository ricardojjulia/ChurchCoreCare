# ADR-0007 — 30-Day Trial Requires No Credit Card

**Date:** 2026-05-26  
**Status:** Accepted  
**Deciders:** Engineering, Product

---

## Context

ChurchCore Care's target customer is an independent or small-group Christian counselor. The signup flow must balance conversion optimization (lower friction = more signups) against payment fraud risk and billing complexity (credit card required = fewer abandoned trials).

The question is whether to require a credit card at trial signup or allow free trial access without payment details.

## Decision

**No credit card is required at trial signup.** Counselors provide only: practice name, subdomain slug, and owner email/password. A Stripe customer is created at signup but no payment method is attached and no charge is made.

The trial period is 30 days. On day 27, a reminder email is sent. If no payment method is added by day 30, the tenant status transitions to `trial_expired` and login redirects to a conversion page. The counselor can add a payment method at any time during or after the trial to restore access.

Stripe creates a subscription with `trial_period_days: 30` and no initial charge. When the counselor adds a payment method and the trial ends, Stripe begins billing automatically.

## Consequences

**Positive:**
- Lower signup friction increases trial start rate — counselors can evaluate the product without financial commitment
- Faith-based counselors are often solo practitioners with tight margins; requiring a card upfront would deter legitimate prospects
- Stripe's trial subscription model handles the no-charge-until-day-31 billing transition natively

**Negative:**
- Higher risk of disposable signups that consume provisioning resources without intent to pay
- Provisioning worker must handle tenant cleanup for `trial_expired` tenants that never converted
- Stripe customer records accumulate for trials that never convert (manageable at current scale)

**Mitigations:**
- Subdomain slug must be globally unique — slug squatting of common names is blocked by the reserved slug list
- `trial_expired` tenants are not deleted; data is retained per retention policy in case they convert later
- Churned tenants (no conversion after 60 days past expiry) are marked `churned` and can be garbage-collected by the provisioning worker

## Alternatives Considered

| Alternative | Why Not Chosen |
|---|---|
| Credit card required at signup (authorize $0) | Reduces signup rate for price-sensitive solo counselors; creates friction for the target demographic |
| 14-day trial | Too short for counselors to fully evaluate clinical documentation, billing, and portal features |
| Freemium (permanent free tier) | Creates indefinitely free users with no conversion path; not viable for HIPAA-compliant SaaS |
| Credit card required only for group plan | Inconsistent UX; solo counselors (majority of target market) still see friction |

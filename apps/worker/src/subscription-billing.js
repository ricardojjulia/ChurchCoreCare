/**
 * Subscription billing / dunning worker.
 *
 * Enforces the grace period → suspend lifecycle for past_due subscriptions:
 *
 *   past_due  (Stripe webhook sets this)
 *      │  grace window: 3 days
 *      ▼
 *   suspended  (worker sets this after grace_period_ends_at passes)
 *
 * Also cleans up trial_expired tenants that were never converted:
 *   trial_expired + 60 days → churned
 *
 * The Stripe webhook (billing-webhooks.js) handles the happy path
 * (invoice.paid → active). This worker only handles the failure path.
 *
 * Required DB columns on tenant_subscriptions:
 *   grace_period_ends_at TIMESTAMPTZ NULL
 */

const GRACE_PERIOD_DAYS = 3;
const CHURN_DAYS = 60;

export async function processDunning(pool, tenantId) {
  const workerName = 'subscription-billing';

  let rows;
  try {
    const result = await pool.query(
      `SELECT tenant_id, status, grace_period_ends_at, updated_at
       FROM tenant_subscriptions
       WHERE tenant_id = ?
         AND status IN ('past_due', 'trial_expired')`,
      [tenantId],
    );
    rows = result[0];
  } catch (_) {
    return;
  }

  for (const row of rows) {
    const now = new Date();

    if (row.status === 'past_due') {
      // Set grace_period_ends_at if not already set.
      if (!row.grace_period_ends_at) {
        const graceEnd = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
        try {
          await pool.query(
            `UPDATE tenant_subscriptions SET grace_period_ends_at = ? WHERE tenant_id = ? AND status = 'past_due'`,
            [graceEnd.toISOString(), row.tenant_id],
          );
          console.log(`[${workerName}] Grace period set for ${row.tenant_id} until ${graceEnd.toISOString()}`);
        } catch (err) {
          console.error(`[${workerName}] Failed to set grace period for ${row.tenant_id}:`, err.message);
        }
        continue;
      }

      // Suspend if grace period has ended.
      if (new Date(row.grace_period_ends_at) < now) {
        try {
          await pool.query(
            `UPDATE tenant_subscriptions SET status = 'suspended', grace_period_ends_at = NULL WHERE tenant_id = ? AND status = 'past_due'`,
            [row.tenant_id],
          );
          console.log(`[${workerName}] Suspended tenant ${row.tenant_id} after grace period`);
        } catch (err) {
          console.error(`[${workerName}] Failed to suspend ${row.tenant_id}:`, err.message);
        }
      }
    }

    if (row.status === 'trial_expired') {
      const expiredAt = new Date(row.updated_at ?? now);
      const churnAt = new Date(expiredAt.getTime() + CHURN_DAYS * 24 * 60 * 60 * 1000);
      if (churnAt < now) {
        try {
          await pool.query(
            `UPDATE tenant_subscriptions SET status = 'churned' WHERE tenant_id = ? AND status = 'trial_expired'`,
            [row.tenant_id],
          );
          console.log(`[${workerName}] Marked churned for tenant ${row.tenant_id}`);
        } catch (err) {
          console.error(`[${workerName}] Failed churn for ${row.tenant_id}:`, err.message);
        }
      }
    }
  }
}

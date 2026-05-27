/**
 * Trial reminder worker.
 *
 * Polls tenant_subscriptions for trials ending in ≤7 days and sends
 * reminder emails at the 7-day and 1-day marks.
 *
 * Tracks which reminders have been sent by writing a
 * trial_reminder_sent_at column (7day / 1day) — only sends each once.
 *
 * Required env: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
 * DB columns used: tenant_subscriptions (trial_ends_at, trial_reminder_7day_at, trial_reminder_1day_at)
 */

import { sendEmail } from './notify.js';

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://app.churchcorecare.com';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Email template helpers ───────────────────────────────────────────────────

function trialReminder7Day(practiceName) {
  return {
    subject: '3 days left on your ChurchCore Care trial',
    text: `Hello${practiceName ? ` ${practiceName}` : ''},

Your free 30-day trial of ChurchCore Care ends in 3 days.

To keep access to your practice, your counselors, and your client records, add a payment method before your trial expires.

Add a payment method now:
${APP_BASE_URL}/settings/billing

Your data is safe and will be preserved regardless of whether you convert.

If you have questions, reply to this email — we're glad to help.

The ChurchCore Care Team
`,
  };
}

function trialReminder1Day(practiceName) {
  return {
    subject: 'Tomorrow is your last trial day — ChurchCore Care',
    text: `Hello${practiceName ? ` ${practiceName}` : ''},

Your ChurchCore Care free trial ends tomorrow.

Add a payment method today to ensure uninterrupted access to your practice data and workflows:
${APP_BASE_URL}/settings/billing

After your trial ends, your account will be paused — all data is preserved and can be restored at any time by adding a payment method.

The ChurchCore Care Team
`,
  };
}

function trialExpiredEmail(practiceName) {
  return {
    subject: 'Your ChurchCore Care trial has ended',
    text: `Hello${practiceName ? ` ${practiceName}` : ''},

Your free trial of ChurchCore Care has ended.

Your data is safe and preserved. To restore access, add a payment method:
${APP_BASE_URL}/settings/billing

Questions? Reply to this email — we want to help you get back on track.

The ChurchCore Care Team
`,
  };
}

// ─── Core job ─────────────────────────────────────────────────────────────────

export async function processTrialReminders(pool, tenantId) {
  const workerName = 'trial-reminders';

  // Ensure required columns exist (idempotent).
  // In production these are added by migrate.js; here we guard gracefully.
  let rows;
  try {
    const result = await pool.query(
      `SELECT ts.tenant_id, ts.trial_ends_at, ts.status,
              ts.trial_reminder_7day_at, ts.trial_reminder_1day_at,
              tp.owner_email, tp.owner_email_enc,
              tp.requested_practice_name
       FROM tenant_subscriptions ts
       LEFT JOIN tenant_provisioning tp ON tp.requested_tenant_id = ts.tenant_id
       WHERE ts.tenant_id = ?
         AND ts.status = 'trial'
         AND ts.trial_ends_at IS NOT NULL`,
      [tenantId],
    );
    rows = result[0];
  } catch (_) {
    return;
  }

  for (const row of rows) {
    const days = daysUntil(row.trial_ends_at);
    if (days === null) continue;

    const ownerEmail = row.owner_email ?? null;
    if (!ownerEmail) continue;

    const practiceName = row.requested_practice_name ?? '';

    // 7-day reminder (send when 7 or fewer days remain and not yet sent)
    if (days <= 7 && days > 1 && !row.trial_reminder_7day_at) {
      try {
        const { subject, text } = trialReminder7Day(practiceName);
        await sendEmail({ to: ownerEmail, subject, text });
        await pool.query(
          `UPDATE tenant_subscriptions SET trial_reminder_7day_at = NOW() WHERE tenant_id = ?`,
          [row.tenant_id],
        );
        console.log(`[${workerName}] Sent 7-day trial reminder for tenant ${row.tenant_id}`);
      } catch (err) {
        console.error(`[${workerName}] Failed 7-day reminder for ${row.tenant_id}:`, err.message);
      }
    }

    // 1-day reminder (send when ≤1 day remains and not yet sent)
    if (days <= 1 && days >= 0 && !row.trial_reminder_1day_at) {
      try {
        const { subject, text } = trialReminder1Day(practiceName);
        await sendEmail({ to: ownerEmail, subject, text });
        await pool.query(
          `UPDATE tenant_subscriptions SET trial_reminder_1day_at = NOW() WHERE tenant_id = ?`,
          [row.tenant_id],
        );
        console.log(`[${workerName}] Sent 1-day trial reminder for tenant ${row.tenant_id}`);
      } catch (err) {
        console.error(`[${workerName}] Failed 1-day reminder for ${row.tenant_id}:`, err.message);
      }
    }

    // Trial expired — mark and email
    if (days < 0) {
      try {
        await pool.query(
          `UPDATE tenant_subscriptions SET status = 'trial_expired' WHERE tenant_id = ? AND status = 'trial'`,
          [row.tenant_id],
        );
        if (ownerEmail && !row.trial_reminder_1day_at) {
          const { subject, text } = trialExpiredEmail(practiceName);
          await sendEmail({ to: ownerEmail, subject, text });
        }
        console.log(`[${workerName}] Marked trial expired for tenant ${row.tenant_id}`);
      } catch (err) {
        console.error(`[${workerName}] Failed trial expiry for ${row.tenant_id}:`, err.message);
      }
    }
  }
}

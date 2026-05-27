/**
 * Email dispatch for the API process (SendGrid).
 *
 * The worker has its own copy in apps/worker/src/notify.js — this file exists
 * because the API and worker run in separate containers and cannot share
 * runtime modules via filesystem paths.
 *
 * Required env vars: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
 */

const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@churchcorecare.com';
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://app.churchcorecare.com';

/**
 * Send a plain-text email via SendGrid.
 * Returns { sent: boolean, reason?: string } — never throws.
 * Callers must treat email as best-effort and never fail a response on email error.
 */
export async function sendEmail({ to, subject, text }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: 'SENDGRID_API_KEY not configured' };
  }
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: SENDGRID_FROM_EMAIL },
        subject,
        content: [{ type: 'text/plain', value: text }],
      }),
    });
    if (!res.ok) {
      return { sent: false, reason: `SendGrid ${res.status}` };
    }
    return { sent: true };
  } catch {
    return { sent: false, reason: 'network error' };
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function trialWelcomeEmail(practiceName, practiceUrl, trialEndsAt) {
  const endsDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'in 30 days';
  return {
    subject: 'Welcome to ChurchCore Care — your trial is ready',
    text: `Hello${practiceName ? ` ${practiceName}` : ''},

Your 30-day free trial of ChurchCore Care is now active. No credit card required until your trial ends.

Your practice URL: ${practiceUrl}
Trial ends: ${endsDate}

To ensure uninterrupted access, add a payment method before your trial expires:
${APP_BASE_URL}/settings/billing

If you have questions or need help getting started, simply reply to this email.

The ChurchCore Care Team
`,
  };
}

export function paymentFailedEmail(practiceName, retryDate) {
  const retryStr = retryDate
    ? `We'll retry the charge on ${new Date(retryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`
    : 'Please update your payment method as soon as possible to avoid a service interruption.';
  return {
    subject: 'Action required: payment failed for ChurchCore Care',
    text: `Hello${practiceName ? ` ${practiceName}` : ''},

We were unable to process your ChurchCore Care subscription payment.

${retryStr}

To update your payment method and restore full access:
${APP_BASE_URL}/settings/billing

Your data is safe and your practice records are preserved. If you believe this is an error, reply to this email.

The ChurchCore Care Team
`,
  };
}

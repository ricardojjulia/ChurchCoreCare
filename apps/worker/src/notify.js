/**
 * Notification dispatch — email (SendGrid) and SMS (Twilio).
 *
 * Required env vars:
 *   Email:  SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
 *   SMS:    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *
 * Either provider is optional — if unconfigured, dispatch is skipped and the
 * reason is returned so the caller can decide whether to mark as sent or fail.
 */

const SENDGRID_API_KEY    = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@churchcorecare.com';
const TWILIO_SID          = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN        = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM         = process.env.TWILIO_FROM_NUMBER;

/**
 * Send a plain-text email via SendGrid.
 * @returns {{ sent: boolean, reason?: string }}
 */
export async function sendEmail({ to, subject, text }) {
  if (!SENDGRID_API_KEY) {
    return { sent: false, reason: 'SENDGRID_API_KEY not configured' };
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
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
    const body = await res.text().catch(() => '');
    throw new Error(`SendGrid ${res.status}: ${body.slice(0, 200)}`);
  }
  return { sent: true };
}

// ─── Email templates (pure functions — return { subject, text }) ──────────────

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://app.churchcorecare.com';

export function trialWelcomeEmail(practiceName, practiceUrl, trialEndsAt) {
  const endsDate = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'in 30 days';
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
  const retryStr = retryDate ? `We'll retry the charge on ${new Date(retryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.` : 'Please update your payment method as soon as possible to avoid a service interruption.';
  return {
    subject: 'Action required: payment failed for ChurchCore Care',
    text: `Hello${practiceName ? ` ${practiceName}` : ''},

We were unable to process your ChurchCore Care subscription payment.

${retryStr}

To update your payment method and restore full access:
${APP_BASE_URL}/settings/billing

Your data is safe and your practice records are preserved.

If you believe this is an error, please reply to this email and we'll help resolve it.

The ChurchCore Care Team
`,
  };
}

/**
 * Send an SMS via Twilio.
 * @returns {{ sent: boolean, reason?: string }}
 */
export async function sendSms({ to, body }) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    return { sent: false, reason: 'Twilio credentials not configured' };
  }
  const params = new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(`Twilio ${res.status}: ${json.message ?? 'unknown'}`);
  }
  return { sent: true };
}

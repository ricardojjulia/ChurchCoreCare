/**
 * Push notification worker — fires web push reminders 15 minutes before appointments.
 *
 * Requires env:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_CONTACT  (mailto: address — e.g. mailto:admin@churchcorecare.com)
 *
 * Uses the `web-push` package. If not installed, logs a warning and skips.
 * Tracks sent notifications via the `push_notification_log` table (created lazily).
 */

let webPush = null;
let webPushLoaded = false;

async function loadWebPush() {
  if (webPushLoaded) return webPush;
  webPushLoaded = true;
  try {
    const mod = await import('web-push');
    webPush = mod.default ?? mod;
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const contact = process.env.VAPID_CONTACT ?? 'mailto:admin@churchcorecare.com';
    if (publicKey && privateKey) {
      webPush.setVapidDetails(contact, publicKey, privateKey);
    } else {
      console.warn('[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — push disabled');
      webPush = null;
    }
  } catch {
    console.warn('[push] web-push package not installed — push notifications disabled');
    webPush = null;
  }
  return webPush;
}

async function ensureLogTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_notification_log (
      id             CHAR(36)     NOT NULL DEFAULT gen_random_uuid(),
      tenant_id      VARCHAR(64)  NOT NULL,
      appointment_id VARCHAR(64)  NOT NULL,
      sent_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id),
      UNIQUE (tenant_id, appointment_id)
    )
  `);
}

async function getUpcomingAppointments(pool, tenantId) {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 14 * 60 * 1000).toISOString();
  const windowEnd   = new Date(now.getTime() + 16 * 60 * 1000).toISOString();

  const [rows] = await pool.query(
    `SELECT a.id, a.counselor_id, a.starts_at, a.client_name_enc
     FROM appointments a
     WHERE a.tenant_id = ?
       AND a.starts_at >= ?
       AND a.starts_at <= ?
       AND a.status NOT IN ('cancelled', 'no_show', 'completed')`,
    [tenantId, windowStart, windowEnd],
  );
  return rows;
}

async function getSubscriptionsForCounselor(pool, tenantId, counselorId) {
  const [rows] = await pool.query(
    `SELECT ps.endpoint, ps.p256dh, ps.auth
     FROM push_subscriptions ps
     JOIN staff_members sm ON sm.id = ?
     JOIN staff_accounts sa ON sa.staff_id = sm.id AND sa.tenant_id = ?
     WHERE ps.staff_account_id = sa.id
       AND ps.tenant_id = ?`,
    [counselorId, tenantId, tenantId],
  );
  return rows;
}

async function alreadySent(pool, tenantId, appointmentId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM push_notification_log WHERE tenant_id = ? AND appointment_id = ? LIMIT 1`,
    [tenantId, appointmentId],
  );
  return rows.length > 0;
}

async function markSent(pool, tenantId, appointmentId) {
  await pool.query(
    `INSERT INTO push_notification_log (tenant_id, appointment_id)
     VALUES (?, ?)
     ON CONFLICT DO NOTHING`,
    [tenantId, appointmentId],
  );
}

export async function sendAppointmentPushReminders(pool, tenantId) {
  const wp = await loadWebPush();
  if (!wp) return;

  try {
    await ensureLogTable(pool);
  } catch {
    return;
  }

  let appointments;
  try {
    appointments = await getUpcomingAppointments(pool, tenantId);
  } catch {
    return;
  }

  if (appointments.length === 0) return;

  for (const appt of appointments) {
    if (await alreadySent(pool, tenantId, appt.id)) continue;

    let subscriptions;
    try {
      subscriptions = await getSubscriptionsForCounselor(pool, tenantId, appt.counselor_id);
    } catch {
      continue;
    }

    if (subscriptions.length === 0) continue;

    const startsAt = new Date(appt.starts_at);
    const timeStr = startsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const payload = JSON.stringify({
      title: 'Upcoming appointment',
      body: `You have an appointment at ${timeStr}`,
      url: '/',
    });

    let atLeastOneSent = false;
    for (const sub of subscriptions) {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        atLeastOneSent = true;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired — remove it
          await pool.query(
            `DELETE FROM push_subscriptions WHERE endpoint = ? AND tenant_id = ?`,
            [sub.endpoint, tenantId],
          ).catch(() => {});
        }
      }
    }

    if (atLeastOneSent) {
      await markSent(pool, tenantId, appt.id).catch(() => {});
    }
  }
}

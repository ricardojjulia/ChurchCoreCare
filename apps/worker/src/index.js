import http from 'node:http';
import { createServiceTelemetry, getPrometheusExporter, startNodeTelemetry } from '../../../packages/telemetry/src/index.js';

const workerName = 'reminder-worker';
await startNodeTelemetry({ serviceName: workerName });
const telemetry = createServiceTelemetry(workerName);

// ── Prometheus metrics server ─────────────────────────────────────────────────
// The worker has no app HTTP server, so we start a small dedicated server
// solely to serve /metrics for Prometheus scraping.
const metricsPort = Number(process.env.WORKER_METRICS_PORT || 9465);
const prometheusExporter = getPrometheusExporter();
if (prometheusExporter) {
  const metricsServer = http.createServer(async (req, res) => {
    if (req.url === '/metrics' && req.method === 'GET') {
      await prometheusExporter.getMetricsRequestHandler(req, res);
    } else {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not Found');
    }
  });
  metricsServer.listen(metricsPort, () => {
    console.log(`[${workerName}] Metrics server listening on port ${metricsPort} (GET /metrics)`);
  });
}

telemetry.recordMutation('worker.start');

// Log a minimal operational message — never emit raw audit payloads to stdout.
console.log(`${workerName} initialized`);

// ---------------------------------------------------------------------------
// Reminder polling — only runs when DB_NAME is configured
// ---------------------------------------------------------------------------

if (process.env.DB_NAME) {
  const mysql = await import('mysql2/promise');

  const pool = mysql.createPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    connectionLimit: 3,
    waitForConnections: true,
  });

  const POLL_INTERVAL_MS = 60_000;

  async function processDueReminders() {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [rows] = await pool.query(
      `SELECT id, tenant_id, appointment_id, client_id, reminder_type, delivery_channel
       FROM reminders
       WHERE status = 'pending' AND reminder_at <= ?
       LIMIT 100`,
      [now]
    );

    if (rows.length === 0) return;

    console.log(`[${workerName}] Processing ${rows.length} due reminder(s)`);

    for (const row of rows) {
      try {
        // Re-check status inside the loop to guard against concurrent cancellations.
        const [[fresh]] = await pool.query(
          `SELECT status FROM reminders WHERE id = ? AND tenant_id = ?`,
          [row.id, row.tenant_id]
        );
        if (!fresh || fresh.status !== 'pending') {
          // Log without the raw reminder ID to avoid emitting user-linked identifiers.
          console.log(`[${workerName}] Skipping reminder (status=${fresh?.status ?? 'gone'})`);
          continue;
        }

        // In a production system this would dispatch an email/SMS via a
        // notification provider.  For now we log the intent and mark sent.
        // Do NOT log appointment_id or client_id — those are user-linked identifiers.
        console.log(
          `[${workerName}] Sending ${row.delivery_channel} reminder ` +
          `(type=${row.reminder_type})`
        );

        await pool.query(
          `UPDATE reminders SET status = 'sent', sent_at = NOW() WHERE id = ? AND tenant_id = ?`,
          [row.id, row.tenant_id]
        );

        telemetry.recordMutation('reminder.sent');
        // Audit events must be written to the audit table, not to stdout.
        // Telemetry above captures the operational signal.
      } catch (err) {
        console.error(`[${workerName}] Failed to process reminder ${row.id}:`, err.message);
      }
    }
  }

  async function expireStaleReminders() {
    // Reminders still pending > 24 h past their scheduled time are unlikely to
    // be actionable; mark them expired so they do not re-enter the poll window.
    const [result] = await pool.query(
      `UPDATE reminders
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'pending'
         AND reminder_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    if (result.affectedRows > 0) {
      console.log(`[${workerName}] Expired ${result.affectedRows} stale reminder(s)`);
      telemetry.recordMutation('reminder.expired');
    }
  }

  async function poll() {
    const start = performance.now();
    try {
      await Promise.all([processDueReminders(), expireStaleReminders()]);
      telemetry.recordWorkerPoll(performance.now() - start, 'success');
    } catch (err) {
      telemetry.recordWorkerPoll(performance.now() - start, 'error');
      throw err;
    }
  }

  // Run once immediately, then on a fixed interval.
  await poll().catch((err) => console.error(`[${workerName}] Poll error:`, err.message));
  setInterval(() => {
    poll().catch((err) => console.error(`[${workerName}] Poll error:`, err.message));
  }, POLL_INTERVAL_MS);

  console.log(`[${workerName}] Reminder poll started (interval=${POLL_INTERVAL_MS}ms)`);
} else {
  console.log(`[${workerName}] DB_NAME not set — reminder polling disabled`);
}

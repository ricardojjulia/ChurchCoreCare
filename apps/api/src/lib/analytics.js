/**
 * Analytics service — practice-level reporting.
 *
 * All functions require tenantId and enforce it in every query.
 * Aggregate responses never include PHI (no names, IDs, or contact data).
 *
 * DB mode: queries PostgreSQL via the shared pool.
 * In-memory mode: returns empty/zero datasets so the UI renders clean empty states.
 */

import pool from '../db/pool.js';

const DB_MODE = () => Boolean(process.env.DB_NAME);

// ── Session volume ────────────────────────────────────────────────────────────

export async function getSessionVolume({ tenantId, from, to, counselorId = null }) {
  if (!DB_MODE()) {
    return { buckets: [], total: 0 };
  }

  const conditions = [
    'tenant_id = ?',
    "status NOT IN ('cancelled', 'no_show')",
    'starts_at >= ?',
    'starts_at < ?',
  ];
  const args = [tenantId, from, to];
  if (counselorId) { conditions.push('counselor_id = ?'); args.push(counselorId); }

  const [rows] = await pool.query(
    `SELECT DATE(starts_at) AS day, COUNT(*) AS count
     FROM appointments
     WHERE ${conditions.join(' AND ')}
     GROUP BY DATE(starts_at)
     ORDER BY day ASC`,
    args,
  );

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  const buckets = rows.map((r) => ({ date: r.day, count: Number(r.count) }));
  return { buckets, total };
}

// ── Revenue stats ─────────────────────────────────────────────────────────────

export async function getRevenueStats({ tenantId, from, to }) {
  if (!DB_MODE()) {
    return { billed: 0, collected: 0, outstanding: 0 };
  }

  const [rows] = await pool.query(
    `SELECT
       COALESCE(SUM(total), 0)       AS billed,
       COALESCE(SUM(amount_paid), 0) AS collected,
       COALESCE(SUM(balance), 0)     AS outstanding
     FROM invoices
     WHERE tenant_id = ?
       AND COALESCE(issued_at, created_at) >= ?
       AND COALESCE(issued_at, created_at) < ?`,
    [tenantId, from, to],
  );

  const row = rows[0] ?? {};
  return {
    billed:      Number(row.billed      ?? 0),
    collected:   Number(row.collected   ?? 0),
    outstanding: Number(row.outstanding ?? 0),
  };
}

// ── No-show rate ──────────────────────────────────────────────────────────────

export async function getNoShowRate({ tenantId, from, to }) {
  if (!DB_MODE()) {
    return { total: 0, noShows: 0, rate: 0 };
  }

  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(CASE WHEN status = 'no_show' THEN 1 END) AS no_shows
     FROM appointments
     WHERE tenant_id = ?
       AND starts_at >= ?
       AND starts_at < ?`,
    [tenantId, from, to],
  );

  const row = rows[0] ?? {};
  const total   = Number(row.total    ?? 0);
  const noShows = Number(row.no_shows ?? 0);
  return { total, noShows, rate: total > 0 ? Math.round((noShows / total) * 100) : 0 };
}

// ── Outcome trends ────────────────────────────────────────────────────────────

export async function getOutcomeTrends({ tenantId, clientId = null, formKey, from = null, to = null }) {
  if (!DB_MODE()) {
    return { points: [] };
  }

  const conditions = ['tenant_id = ?', 'form_key = ?'];
  const args = [tenantId, formKey];

  if (clientId) { conditions.push('client_id = ?'); args.push(clientId); }
  if (from)     { conditions.push('submitted_at >= ?'); args.push(from); }
  if (to)       { conditions.push('submitted_at < ?'); args.push(to); }

  const [rows] = await pool.query(
    `SELECT DATE(submitted_at) AS day, score_value AS score
     FROM form_submissions
     WHERE ${conditions.join(' AND ')}
       AND score_value IS NOT NULL
     ORDER BY submitted_at ASC`,
    args,
  );

  return {
    points: rows.map((r) => ({ date: r.day, score: Number(r.score) })),
  };
}

// ── Counselor productivity ────────────────────────────────────────────────────

export async function getCounselorProductivity({ tenantId, from, to }) {
  if (!DB_MODE()) {
    return { counselors: [] };
  }

  const [rows] = await pool.query(
    `SELECT
       a.counselor_id                                        AS counselor_id,
       COUNT(*)                                             AS total_sessions,
       COUNT(CASE WHEN a.status = 'no_show' THEN 1 END)    AS no_shows,
       COUNT(CASE WHEN a.status = 'completed' THEN 1 END)  AS completed,
       ROUND(AVG(
         CASE WHEN a.status = 'completed'
           THEN EXTRACT(EPOCH FROM (a.ends_at::TIMESTAMPTZ - a.starts_at::TIMESTAMPTZ)) / 60
         END
       ))                                                   AS avg_duration_minutes
     FROM appointments a
     WHERE a.tenant_id = ?
       AND a.starts_at >= ?
     AND a.starts_at < ?
     GROUP BY a.counselor_id
     ORDER BY total_sessions DESC`,
    [tenantId, from, to],
  );

  return {
    counselors: rows.map((r) => ({
      counselorId:       r.counselor_id,
      totalSessions:     Number(r.total_sessions),
      noShows:           Number(r.no_shows),
      completed:         Number(r.completed),
      avgDurationMinutes: r.avg_duration_minutes ? Number(r.avg_duration_minutes) : null,
      noShowRate:        Number(r.total_sessions) > 0
        ? Math.round((Number(r.no_shows) / Number(r.total_sessions)) * 100)
        : 0,
    })),
  };
}

// ── CSV builders ──────────────────────────────────────────────────────────────

export function buildSessionsCsv(buckets) {
  const lines = ['Date,Sessions'];
  for (const b of buckets) lines.push(`${b.date},${b.count}`);
  return lines.join('\r\n');
}

export function buildRevenueCsv({ billed, collected, outstanding }) {
  return [
    'Category,Amount',
    `Billed,${billed.toFixed(2)}`,
    `Collected,${collected.toFixed(2)}`,
    `Outstanding,${outstanding.toFixed(2)}`,
  ].join('\r\n');
}

// ── Date range helpers ────────────────────────────────────────────────────────

export function parseDateRange(searchParams) {
  const from = searchParams.get('from') ?? null;
  const to   = searchParams.get('to')   ?? null;

  if (from && to) return { from, to };

  const preset = searchParams.get('preset') ?? 'month';
  const now = new Date();

  if (preset === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }
  if (preset === 'quarter') {
    const start = new Date(now);
    start.setDate(now.getDate() - 90);
    return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }
  if (preset === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: now.toISOString().slice(0, 10) };
  }
  // default: month
  const start = new Date(now);
  start.setDate(now.getDate() - 30);
  return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

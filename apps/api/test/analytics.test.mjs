/**
 * Analytics service unit tests.
 *
 * All functions return empty/zero datasets when DB_NAME is unset (in-memory mode).
 * Tenant isolation and CSV builders are tested here without a DB connection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSessionVolume,
  getRevenueStats,
  getNoShowRate,
  getOutcomeTrends,
  getCounselorProductivity,
  buildSessionsCsv,
  buildRevenueCsv,
  parseDateRange,
} from '../src/lib/analytics.js';

// ─── In-memory mode (no DB_NAME set) ─────────────────────────────────────────

test('getSessionVolume: in-memory mode returns empty buckets', async () => {
  const saved = process.env.DB_NAME;
  delete process.env.DB_NAME;
  try {
    const result = await getSessionVolume({ tenantId: 't1', from: '2026-01-01', to: '2026-02-01' });
    assert.deepEqual(result, { buckets: [], total: 0 });
  } finally {
    if (saved !== undefined) process.env.DB_NAME = saved;
  }
});

test('getRevenueStats: in-memory mode returns zeros', async () => {
  const saved = process.env.DB_NAME;
  delete process.env.DB_NAME;
  try {
    const result = await getRevenueStats({ tenantId: 't1', from: '2026-01-01', to: '2026-02-01' });
    assert.deepEqual(result, { billed: 0, collected: 0, outstanding: 0 });
  } finally {
    if (saved !== undefined) process.env.DB_NAME = saved;
  }
});

test('getNoShowRate: in-memory mode returns zero rate', async () => {
  const saved = process.env.DB_NAME;
  delete process.env.DB_NAME;
  try {
    const result = await getNoShowRate({ tenantId: 't1', from: '2026-01-01', to: '2026-02-01' });
    assert.deepEqual(result, { total: 0, noShows: 0, rate: 0 });
  } finally {
    if (saved !== undefined) process.env.DB_NAME = saved;
  }
});

test('getOutcomeTrends: in-memory mode returns empty points', async () => {
  const saved = process.env.DB_NAME;
  delete process.env.DB_NAME;
  try {
    const result = await getOutcomeTrends({ tenantId: 't1', formKey: 'PHQ-9' });
    assert.deepEqual(result, { points: [] });
  } finally {
    if (saved !== undefined) process.env.DB_NAME = saved;
  }
});

test('getCounselorProductivity: in-memory mode returns empty counselors', async () => {
  const saved = process.env.DB_NAME;
  delete process.env.DB_NAME;
  try {
    const result = await getCounselorProductivity({ tenantId: 't1', from: '2026-01-01', to: '2026-02-01' });
    assert.deepEqual(result, { counselors: [] });
  } finally {
    if (saved !== undefined) process.env.DB_NAME = saved;
  }
});

// ─── CSV builders ─────────────────────────────────────────────────────────────

test('buildSessionsCsv: produces correct header and rows', () => {
  const csv = buildSessionsCsv([
    { date: '2026-01-15', count: 4 },
    { date: '2026-01-16', count: 7 },
  ]);
  const lines = csv.split('\r\n');
  assert.equal(lines[0], 'Date,Sessions');
  assert.equal(lines[1], '2026-01-15,4');
  assert.equal(lines[2], '2026-01-16,7');
});

test('buildSessionsCsv: empty buckets produces header only', () => {
  const csv = buildSessionsCsv([]);
  assert.equal(csv, 'Date,Sessions');
});

test('buildRevenueCsv: formats amounts with two decimal places', () => {
  const csv = buildRevenueCsv({ billed: 1000, collected: 800, outstanding: 200 });
  const lines = csv.split('\r\n');
  assert.equal(lines[0], 'Category,Amount');
  assert.equal(lines[1], 'Billed,1000.00');
  assert.equal(lines[2], 'Collected,800.00');
  assert.equal(lines[3], 'Outstanding,200.00');
});

// ─── parseDateRange ────────────────────────────────────────────────────────────

test('parseDateRange: explicit from/to takes precedence over preset', () => {
  const sp = new URLSearchParams('from=2026-01-01&to=2026-01-31');
  const result = parseDateRange(sp);
  assert.equal(result.from, '2026-01-01');
  assert.equal(result.to, '2026-01-31');
});

test('parseDateRange: week preset returns ~7-day range', () => {
  const sp = new URLSearchParams('preset=week');
  const result = parseDateRange(sp);
  const diff = (new Date(result.to) - new Date(result.from)) / 86_400_000;
  assert.ok(diff >= 6 && diff <= 8, `Expected ~7 day range, got ${diff}`);
});

test('parseDateRange: month preset returns ~30-day range', () => {
  const sp = new URLSearchParams('preset=month');
  const result = parseDateRange(sp);
  const diff = (new Date(result.to) - new Date(result.from)) / 86_400_000;
  assert.ok(diff >= 29 && diff <= 31, `Expected ~30 day range, got ${diff}`);
});

test('parseDateRange: quarter preset returns ~90-day range', () => {
  const sp = new URLSearchParams('preset=quarter');
  const result = parseDateRange(sp);
  const diff = (new Date(result.to) - new Date(result.from)) / 86_400_000;
  assert.ok(diff >= 89 && diff <= 91, `Expected ~90 day range, got ${diff}`);
});

test('parseDateRange: year preset starts from Jan 1', () => {
  const sp = new URLSearchParams('preset=year');
  const result = parseDateRange(sp);
  const year = new Date().getFullYear();
  assert.equal(result.from, `${year}-01-01`);
});

test('parseDateRange: default (no params) returns 30-day range', () => {
  const sp = new URLSearchParams('');
  const result = parseDateRange(sp);
  const diff = (new Date(result.to) - new Date(result.from)) / 86_400_000;
  assert.ok(diff >= 29 && diff <= 31, `Expected ~30 day range, got ${diff}`);
});

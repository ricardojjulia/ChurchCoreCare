import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── in-memory stubs (no DB_NAME set in test env) ──────────────────────────

describe('groups queries (in-memory mode)', () => {
  it('listGroups returns empty array when DB not configured', async () => {
    const { listGroups } = await import('../src/db/queries/groups.js');
    const result = await listGroups('tenant-1');
    assert.deepEqual(result, []);
  });

  it('getGroupById returns null when DB not configured', async () => {
    const { getGroupById } = await import('../src/db/queries/groups.js');
    const result = await getGroupById('grp-1', 'tenant-1');
    assert.equal(result, null);
  });

  it('listGroupSessions returns empty array when DB not configured', async () => {
    const { listGroupSessions } = await import('../src/db/queries/groups.js');
    const result = await listGroupSessions('grp-1', 'tenant-1');
    assert.deepEqual(result, []);
  });

  it('getGroupSessionNotes returns empty note structure when DB not configured', async () => {
    const { getGroupSessionNotes } = await import('../src/db/queries/groups.js');
    const result = await getGroupSessionNotes('sess-1', 'tenant-1');
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'sharedNote'));
    assert.ok(Array.isArray(result.memberNotes));
    assert.equal(result.sharedNote, null);
    assert.deepEqual(result.memberNotes, []);
  });

  it('listRelationalUnits returns empty array when DB not configured', async () => {
    const { listRelationalUnits } = await import('../src/db/queries/groups.js');
    const result = await listRelationalUnits('tenant-1');
    assert.deepEqual(result, []);
  });

  it('getClientRelationalUnits returns empty array when DB not configured', async () => {
    const { getClientRelationalUnits } = await import('../src/db/queries/groups.js');
    const result = await getClientRelationalUnits('client-1', 'tenant-1');
    assert.deepEqual(result, []);
  });
});

// ── expandRrule (inline re-implementation for pure unit testing) ───────────

describe('expandRrule', () => {
  it('returns single date when no rrule given', () => {
    const dtstart = '2026-01-06T10:00:00';
    const result = makeExpandRrule()(dtstart, '');
    assert.deepEqual(result, [new Date(dtstart)]);
  });

  it('expands FREQ=WEEKLY with COUNT', () => {
    const dtstart = '2026-01-06T10:00:00';
    const dates = makeExpandRrule()(dtstart, 'FREQ=WEEKLY;COUNT=3');
    assert.equal(dates.length, 3);
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
    assert.equal(dates[1] - dates[0], MS_WEEK);
    assert.equal(dates[2] - dates[1], MS_WEEK);
  });

  it('respects INTERVAL', () => {
    const dtstart = '2026-01-06T10:00:00';
    const dates = makeExpandRrule()(dtstart, 'FREQ=WEEKLY;INTERVAL=2;COUNT=2');
    assert.equal(dates.length, 2);
    const MS_2WEEKS = 14 * 24 * 60 * 60 * 1000;
    assert.equal(dates[1] - dates[0], MS_2WEEKS);
  });

  it('respects UNTIL cutoff', () => {
    const dtstart = '2026-01-06T10:00:00';
    const until = '20260120T100000Z';
    const dates = makeExpandRrule()(dtstart, `FREQ=WEEKLY;UNTIL=${until}`);
    assert.ok(dates.length <= 3);
    const cutoff = new Date('2026-01-20T10:00:00Z');
    assert.ok(dates.every((d) => d <= cutoff));
  });

  it('caps at maxCount (default 52)', () => {
    const dtstart = '2026-01-06T10:00:00';
    const dates = makeExpandRrule()(dtstart, 'FREQ=WEEKLY');
    assert.equal(dates.length, 52);
  });

  it('filters by BYDAY — Tuesday', () => {
    // 2026-01-06 is a Tuesday
    const dtstart = '2026-01-06T10:00:00';
    const dates = makeExpandRrule()(dtstart, 'FREQ=WEEKLY;BYDAY=TU;COUNT=4');
    assert.equal(dates.length, 4);
    assert.ok(dates.every((d) => d.getDay() === 2));
  });
});

// ── Inline re-implementation of expandRrule for pure unit testing ─────────

function makeExpandRrule() {
  const DAY_MAP = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

  return function expandRrule(dtstart, rruleStr, maxCount = 52) {
    const start = new Date(dtstart);
    if (!rruleStr || !rruleStr.trim()) return [start];

    const parts = Object.fromEntries(
      rruleStr.split(';').map((p) => {
        const [k, v] = p.split('=');
        return [k.trim().toUpperCase(), v?.trim() ?? ''];
      })
    );

    if ((parts.FREQ ?? '').toUpperCase() !== 'WEEKLY') return [start];

    const interval = Math.max(1, parseInt(parts.INTERVAL ?? '1', 10));
    const count = parts.COUNT ? Math.min(parseInt(parts.COUNT, 10), maxCount) : maxCount;
    const until = parts.UNTIL ? new Date(
      parts.UNTIL.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, '$1-$2-$3T$4:$5:$6Z')
    ) : null;
    const byDay = parts.BYDAY
      ? new Set(parts.BYDAY.split(',').map((d) => DAY_MAP[d.trim().toUpperCase()]).filter((n) => n !== undefined))
      : null;

    const results = [];
    let current = new Date(start);
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

    while (results.length < count) {
      if (until && current > until) break;
      if (!byDay || byDay.has(current.getDay())) {
        results.push(new Date(current));
      }
      current = new Date(current.getTime() + interval * MS_WEEK);
    }

    return results;
  };
}

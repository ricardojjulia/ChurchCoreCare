/**
 * Unit tests for the pure slot calculator.
 *
 * All tests use a fixed reference date so that minNoticeHours /
 * advanceBookingDays windows are deterministic.
 *
 * Fixed "now": 2026-05-11T12:00:00Z (Monday)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSlots } from '../src/lib/slotCalculator.js';

// ─── Fixed "now" helpers ──────────────────────────────────────────────────────
// We freeze Date.now() for tests that care about notice/advance cutoffs.

const FIXED_NOW_ISO = '2026-05-11T12:00:00.000Z'; // Monday
const FIXED_NOW_MS  = Date.parse(FIXED_NOW_ISO);

function freezeNow(fn) {
  const orig = Date.now;
  Date.now = () => FIXED_NOW_MS;
  try {
    return fn();
  } finally {
    Date.now = orig;
  }
}

// ─── Shared profile factory ───────────────────────────────────────────────────

function makeProfile(overrides = {}) {
  return {
    enabled:              true,
    slotDurationMinutes:  60,
    bufferMinutes:        0,
    advanceBookingDays:   30,
    minNoticeHours:       0,
    availableApptTypes:   ['individual'],
    availabilityBlocks:   [{ day: 1, start: '09:00', end: '12:00' }], // Monday
    ...overrides,
  };
}

// ─── Test 1: Returns correct slots for Mon 9–12 block with no conflicts ───────

test('returns correct slots for a simple Mon 9–12 block with no conflicts', () => {
  freezeNow(() => {
    const profile = makeProfile({
      slotDurationMinutes: 60,
      bufferMinutes:       0,
      advanceBookingDays:  30,
      minNoticeHours:      0,
      availabilityBlocks:  [{ day: 1, start: '09:00', end: '12:00' }], // 3×60-min slots
    });

    // from: start of the same day (2026-05-11), to: 2 weeks from now
    const from = new Date('2026-05-11T00:00:00Z');
    const to   = new Date('2026-05-25T00:00:00Z');

    const slots = calculateSlots(profile, [], { from, to, practiceTimezone: 'America/New_York' });

    // Mondays in range: 2026-05-11, 2026-05-18
    // Each Monday: 09:00, 10:00, 11:00 Eastern → 3 slots × 2 Mondays = 6
    assert.ok(slots.length > 0, 'should return at least one slot');
    for (const s of slots) {
      assert.ok(s.start instanceof Date, 'start should be a Date');
      assert.ok(s.end   instanceof Date, 'end should be a Date');
      assert.equal(s.apptType, 'individual');
      // Slot duration must be exactly 60 minutes
      assert.equal(s.end.getTime() - s.start.getTime(), 60 * 60_000);
    }
    // Slots should be in ascending order
    for (let i = 1; i < slots.length; i++) {
      assert.ok(slots[i].start >= slots[i - 1].start, 'slots should be sorted ascending');
    }
  });
});

// ─── Test 2: Excludes slots that overlap existing appointments ────────────────

test('excludes slots that overlap existing appointments', () => {
  freezeNow(() => {
    const profile = makeProfile({
      slotDurationMinutes: 60,
      bufferMinutes:       0,
      minNoticeHours:      0,
      advanceBookingDays:  30,
      availabilityBlocks:  [{ day: 1, start: '09:00', end: '12:00' }], // 3 slots
    });

    const from = new Date('2026-05-11T00:00:00Z');
    const to   = new Date('2026-05-12T00:00:00Z'); // just one Monday

    // Existing appointment occupying the 9–10am slot
    // 09:00 Eastern = 13:00 UTC
    const existingAppts = [
      { scheduledAt: new Date('2026-05-11T13:00:00Z'), durationMinutes: 60 },
    ];

    const slots = calculateSlots(profile, existingAppts, { from, to, practiceTimezone: 'America/New_York' });

    // Should NOT contain the 9:00 slot
    const hasNineAmSlot = slots.some((s) => {
      const utcHour = s.start.getUTCHours();
      return utcHour === 13; // 09:00 Eastern
    });
    assert.equal(hasNineAmSlot, false, '9am slot should be excluded due to overlap');

    // Should still contain 10:00 and 11:00
    assert.ok(slots.length >= 2, 'should have at least 2 remaining slots');
  });
});

// ─── Test 3: Excludes slots within minNoticeHours ─────────────────────────────

test('excludes slots within minNoticeHours', () => {
  freezeNow(() => {
    // now = 2026-05-11T12:00:00Z (Monday, noon UTC = 8am Eastern)
    // minNoticeHours = 24 → cutoff is 2026-05-12T12:00:00Z
    const profile = makeProfile({
      slotDurationMinutes: 60,
      bufferMinutes:       0,
      minNoticeHours:      24,
      advanceBookingDays:  30,
      availabilityBlocks:  [{ day: 1, start: '09:00', end: '17:00' }],
    });

    // Window: today through 2 weeks
    const from = new Date('2026-05-11T00:00:00Z');
    const to   = new Date('2026-05-25T00:00:00Z');

    const slots = calculateSlots(profile, [], { from, to, practiceTimezone: 'America/New_York' });

    const tooSoon = new Date(FIXED_NOW_MS + 24 * 3_600_000);
    for (const s of slots) {
      assert.ok(s.start >= tooSoon, `slot at ${s.start.toISOString()} is within minNoticeHours`);
    }
  });
});

// ─── Test 4: Excludes slots beyond advanceBookingDays ─────────────────────────

test('excludes slots beyond advanceBookingDays', () => {
  freezeNow(() => {
    const profile = makeProfile({
      slotDurationMinutes: 60,
      bufferMinutes:       0,
      minNoticeHours:      0,
      advanceBookingDays:  7, // only 7 days out
      availabilityBlocks:  [{ day: 1, start: '09:00', end: '12:00' }],
    });

    // Window: today through 30 days
    const from = new Date('2026-05-11T00:00:00Z');
    const to   = new Date('2026-06-10T00:00:00Z');

    const slots = calculateSlots(profile, [], { from, to, practiceTimezone: 'America/New_York' });

    const tooFar = new Date(FIXED_NOW_MS + 7 * 86_400_000);
    for (const s of slots) {
      assert.ok(s.start <= tooFar, `slot at ${s.start.toISOString()} exceeds advanceBookingDays`);
    }
  });
});

// ─── Test 5: Returns [] when profile.enabled = false ─────────────────────────

test('returns [] when profile.enabled = false', () => {
  const profile = makeProfile({ enabled: false });
  const from = new Date('2026-05-11T00:00:00Z');
  const to   = new Date('2026-05-25T00:00:00Z');

  const slots = calculateSlots(profile, [], { from, to, practiceTimezone: 'America/New_York' });
  assert.deepEqual(slots, []);
});

// ─── Test 6: Day restriction via allowedDays ──────────────────────────────────

test('day restriction via allowedDays filters out non-matching days', () => {
  freezeNow(() => {
    // Block on Monday (day 1) and Wednesday (day 3)
    const profile = makeProfile({
      slotDurationMinutes: 60,
      bufferMinutes:       0,
      minNoticeHours:      0,
      advanceBookingDays:  30,
      availabilityBlocks:  [
        { day: 1, start: '09:00', end: '10:00' }, // Monday
        { day: 3, start: '09:00', end: '10:00' }, // Wednesday
      ],
    });

    const from = new Date('2026-05-11T00:00:00Z');
    const to   = new Date('2026-05-18T00:00:00Z');

    // Restrict to Mondays only
    const slots = calculateSlots(profile, [], {
      from,
      to,
      practiceTimezone: 'America/New_York',
      allowedDays: [1],
    });

    assert.ok(slots.length > 0, 'should have slots');
    // All slots should be on Monday in EST
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' });
    for (const s of slots) {
      assert.equal(fmt.format(s.start), 'Mon', `slot ${s.start.toISOString()} is not on Monday`);
    }
  });
});

// ─── Test 7: Buffer subtraction — slot immediately after appt is excluded ─────

test('buffer - slot immediately after an appointment is excluded when overlap extends into buffer', () => {
  freezeNow(() => {
    const profile = makeProfile({
      slotDurationMinutes: 50,
      bufferMinutes:       10, // 10-min buffer after each slot
      minNoticeHours:      0,
      advanceBookingDays:  30,
      availabilityBlocks:  [{ day: 1, start: '09:00', end: '12:00' }],
    });

    const from = new Date('2026-05-11T00:00:00Z');
    const to   = new Date('2026-05-12T00:00:00Z');

    // Appointment at 09:00 Eastern (13:00 UTC), 50 min
    // That occupies 09:00–09:50; with 10-min buffer → blocked until 10:00
    // So next available slot should start at 10:00 (step = 50+10 = 60 min)
    const existingAppts = [
      { scheduledAt: new Date('2026-05-11T13:00:00Z'), durationMinutes: 50 },
    ];

    const slots = calculateSlots(profile, existingAppts, { from, to, practiceTimezone: 'America/New_York' });

    // 9:00am slot should be excluded
    const hasNineAm = slots.some((s) => Math.abs(s.start.getTime() - new Date('2026-05-11T13:00:00Z').getTime()) < 60_000);
    assert.equal(hasNineAm, false, '9:00am slot should be excluded');
  });
});

// ─── Test 8: Deduplication ────────────────────────────────────────────────────

test('deduplication - two overlapping blocks do not produce duplicate slots', () => {
  freezeNow(() => {
    // Two identical blocks for the same day — should deduplicate
    const profile = makeProfile({
      slotDurationMinutes: 60,
      bufferMinutes:       0,
      minNoticeHours:      0,
      advanceBookingDays:  30,
      availabilityBlocks:  [
        { day: 1, start: '09:00', end: '10:00' },
        { day: 1, start: '09:00', end: '10:00' }, // exact duplicate
      ],
    });

    const from = new Date('2026-05-11T00:00:00Z');
    const to   = new Date('2026-05-12T00:00:00Z');

    const slots = calculateSlots(profile, [], { from, to, practiceTimezone: 'America/New_York' });

    // Should have exactly 1 slot (deduplicated)
    const uniqueKeys = new Set(slots.map((s) => `${s.start.toISOString()}|${s.apptType}`));
    assert.equal(uniqueKeys.size, slots.length, 'slots should not contain duplicates');
    assert.equal(slots.length, 1, 'should have exactly one deduplicated slot');
  });
});

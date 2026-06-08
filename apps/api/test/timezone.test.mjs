import test from 'node:test';
import assert from 'node:assert/strict';

import { atTimeOnCurrentDayInTimezone } from '../src/timezone.js';

test('demo times use the practice day when UTC has crossed midnight first', () => {
  const now = new Date('2026-06-08T00:44:00.000Z');

  assert.equal(
    atTimeOnCurrentDayInTimezone(13, 0, 'America/Chicago', now),
    '2026-06-07T18:00:00.000Z',
  );
});

test('demo times honor daylight-saving offsets for the selected day', () => {
  assert.equal(
    atTimeOnCurrentDayInTimezone(
      9,
      30,
      'America/New_York',
      new Date('2026-01-15T18:00:00.000Z'),
    ),
    '2026-01-15T14:30:00.000Z',
  );
  assert.equal(
    atTimeOnCurrentDayInTimezone(
      9,
      30,
      'America/New_York',
      new Date('2026-07-15T18:00:00.000Z'),
    ),
    '2026-07-15T13:30:00.000Z',
  );
});

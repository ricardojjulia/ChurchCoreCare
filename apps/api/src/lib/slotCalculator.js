/**
 * Pure slot calculator for client self-scheduling.
 *
 * No DB calls — all inputs are plain objects/dates.
 *
 * Timezone math uses the built-in Intl.DateTimeFormat API.
 * No external dependencies are used or required.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a "HH:MM" time string into { hours, minutes }.
 */
function parseHHMM(str) {
  const [h, m] = String(str).split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

/**
 * Convert a UTC Date + local time "HH:MM" to a UTC Date using Intl.
 *
 * We reconstruct the local wall-clock datetime for the given date in
 * `timezone`, then compute the UTC equivalent.  This is done by:
 *   1. Extract the local date components using Intl.DateTimeFormat.
 *   2. Combine with the supplied HH:MM to get a local ISO string.
 *   3. Convert that local datetime to UTC by doing a binary-search offset
 *      estimation (to handle DST transitions correctly).
 */
function localTimeToUtc(localDate, hhMM, timezone) {
  const { hours, minutes } = parseHHMM(hhMM);

  // Get the y/m/d parts of `localDate` as seen in `timezone`.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  });
  // en-CA gives "YYYY-MM-DD" format.
  const localDateStr = fmt.format(localDate);
  const [yyyy, mm, dd] = localDateStr.split('-').map(Number);

  // We want to find UTC time T such that T displayed in `timezone` shows
  // yyyy-mm-dd HH:MM:00.
  // We'll estimate by creating a Date object assuming UTC offset = 0,
  // then iteratively correct.
  const targetLocalMs = Date.UTC(yyyy, mm - 1, dd, hours, minutes, 0, 0);
  // Estimate the UTC offset at the target moment by using Intl.
  // We ask: what does `targetLocalMs` look like in `timezone`?
  const estimate = new Date(targetLocalMs);
  const offsetMs = computeOffsetMs(estimate, timezone);
  return new Date(targetLocalMs - offsetMs);
}

/**
 * Return the UTC offset (ms) of a given instant in `timezone`.
 * offset = localTime - utcTime  (positive = east of UTC)
 *
 * Strategy: format the UTC instant as local components, reconstruct as UTC
 * epoch, then diff.
 */
function computeOffsetMs(utcDate, timezone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone:  timezone,
    year:      'numeric',
    month:     '2-digit',
    day:       '2-digit',
    hour:      '2-digit',
    minute:    '2-digit',
    second:    '2-digit',
    hour12:    false,
  });
  const parts = fmt.formatToParts(utcDate);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  let hour = get('hour');
  // formatToParts hour12:false returns 24 for midnight in some locales
  if (hour === 24) hour = 0;
  const localAsUtcMs = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return localAsUtcMs - utcDate.getTime();
}

/**
 * Get the day-of-week (0=Sun … 6=Sat) of a UTC Date as seen in `timezone`.
 */
function dayOfWeekInTimezone(utcDate, timezone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday:  'short',
  });
  const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return SHORT_DAYS.indexOf(fmt.format(utcDate));
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Calculate available booking slots.
 *
 * @param {object}   profile
 * @param {boolean}  profile.enabled
 * @param {number}   profile.slotDurationMinutes
 * @param {number}   profile.bufferMinutes
 * @param {number}   profile.advanceBookingDays
 * @param {number}   profile.minNoticeHours
 * @param {string[]} profile.availableApptTypes
 * @param {{ day: number, start: string, end: string }[]} profile.availabilityBlocks
 *
 * @param {{ scheduledAt: Date, durationMinutes: number }[]} existingAppointments
 *
 * @param {object}       opts
 * @param {Date}         opts.from             - start of window (UTC)
 * @param {Date}         opts.to               - end of window (UTC)
 * @param {string}       opts.practiceTimezone - IANA timezone
 * @param {string|null}  [opts.apptType]       - filter to one type (null = all)
 * @param {number[]|null} [opts.allowedDays]   - day-of-week filter (0–6), null = no restriction
 *
 * @returns {{ start: Date, end: Date, apptType: string }[]}
 */
export function calculateSlots(profile, existingAppointments, {
  from,
  to,
  practiceTimezone,
  apptType = null,
  allowedDays = null,
}) {
  if (!profile.enabled) return [];

  const {
    slotDurationMinutes,
    bufferMinutes,
    advanceBookingDays,
    minNoticeHours,
    availableApptTypes,
    availabilityBlocks,
  } = profile;

  const now = Date.now();
  const tooSoonCutoff = new Date(now + minNoticeHours * 3_600_000);
  const tooFarCutoff  = new Date(now + advanceBookingDays * 86_400_000);

  // Which appt types to include
  const typesToEmit = apptType
    ? (availableApptTypes.includes(apptType) ? [apptType] : [])
    : availableApptTypes;

  if (typesToEmit.length === 0) return [];

  const stepMs    = (slotDurationMinutes + bufferMinutes) * 60_000;
  const slotMs    = slotDurationMinutes * 60_000;
  const bufferMs  = bufferMinutes * 60_000;

  // Build a canonical key for deduplication: ISO start + type
  const seen = new Set();
  const results = [];

  // Walk dates from `from` to `to` (one calendar day at a time in the local tz)
  // We iterate by UTC day boundaries but check local DOW.
  const DAY_MS = 86_400_000;
  let cursor = new Date(from.getTime());
  // Normalise cursor to start-of-day in UTC for the loop
  cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));

  while (cursor <= to) {
    const localDow = dayOfWeekInTimezone(cursor, practiceTimezone);

    for (const block of availabilityBlocks) {
      if (block.day !== localDow) continue;
      if (allowedDays !== null && !allowedDays.includes(block.day)) continue;

      // Parse block times
      const { hours: startH, minutes: startM } = parseHHMM(block.start);
      const { hours: endH,   minutes: endM   } = parseHHMM(block.end);
      const blockStartMin = startH * 60 + startM;
      const blockEndMin   = endH   * 60 + endM;

      // Generate slot starts (stepping by slotDurationMinutes + bufferMinutes)
      let slotStartMin = blockStartMin;
      while (slotStartMin + slotDurationMinutes <= blockEndMin) {
        const slotStartUtc = localTimeToUtc(cursor, `${String(Math.floor(slotStartMin / 60)).padStart(2, '0')}:${String(slotStartMin % 60).padStart(2, '0')}`, practiceTimezone);
        const slotEndUtc   = new Date(slotStartUtc.getTime() + slotMs);

        // Apply window bounds
        if (slotStartUtc < from || slotStartUtc >= to) {
          slotStartMin += slotDurationMinutes + bufferMinutes;
          continue;
        }

        // Exclude if too soon
        if (slotStartUtc < tooSoonCutoff) {
          slotStartMin += slotDurationMinutes + bufferMinutes;
          continue;
        }

        // Exclude if too far out
        if (slotStartUtc > tooFarCutoff) {
          slotStartMin += slotDurationMinutes + bufferMinutes;
          continue;
        }

        // Overlap check against existing appointments
        // A slot conflicts if existingAppt overlaps [slotStart, slotEnd + buffer)
        const slotBlockEnd = new Date(slotEndUtc.getTime() + bufferMs);
        let conflicts = false;
        for (const appt of existingAppointments) {
          const apptStart = appt.scheduledAt instanceof Date ? appt.scheduledAt : new Date(appt.scheduledAt);
          const apptEnd   = new Date(apptStart.getTime() + appt.durationMinutes * 60_000);
          // Overlap: apptStart < slotBlockEnd && apptEnd > slotStart
          if (apptStart < slotBlockEnd && apptEnd > slotStartUtc) {
            conflicts = true;
            break;
          }
        }

        if (!conflicts) {
          for (const type of typesToEmit) {
            const key = `${slotStartUtc.toISOString()}|${type}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ start: slotStartUtc, end: slotEndUtc, apptType: type });
            }
          }
        }

        slotStartMin += slotDurationMinutes + bufferMinutes;
      }
    }

    cursor = new Date(cursor.getTime() + DAY_MS);
  }

  // Sort ascending by start time
  results.sort((a, b) => a.start - b.start);
  return results;
}

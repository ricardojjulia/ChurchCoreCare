/**
 * Onboarding wizard service.
 *
 * All functions take `pool` as the first argument and enforce `tenantId`
 * isolation on every read and write.  PHI fields (first/last name, bio, email)
 * are encrypted before persistence.
 *
 * No PHI is ever logged.
 */

import crypto from 'node:crypto';

// ─── Default vocabulary presets (mirrored from denominationVocab.js) ─────────
// This copy lives on the server so the API never imports frontend files.
const DEFAULT_VOCAB = {
  broadly_christian: {
    prayerTerms: ['prayer'],
    scriptureTerms: ['Scripture'],
    communityTerms: ['congregation'],
    spiritualLeaderTitle: 'Pastor',
    practiceType: 'broadly_christian',
  },
  evangelical_baptist: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Scripture', 'the Word'],
    communityTerms: ['congregation'],
    spiritualLeaderTitle: 'Pastor',
    practiceType: 'evangelical',
  },
  methodist: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Scripture', 'the Word'],
    communityTerms: ['congregation', 'parish'],
    spiritualLeaderTitle: 'Pastor',
    practiceType: 'methodist',
  },
  presbyterian_reformed: {
    prayerTerms: ['prayer'],
    scriptureTerms: ['Scripture', 'the Word of God'],
    communityTerms: ['congregation', 'parish'],
    spiritualLeaderTitle: 'Elder',
    practiceType: 'reformed',
  },
  lutheran: {
    prayerTerms: ['prayer'],
    scriptureTerms: ['Scripture', 'the Word'],
    communityTerms: ['congregation', 'parish'],
    spiritualLeaderTitle: 'Pastor',
    practiceType: 'lutheran',
  },
  anglican_episcopal: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Scripture', 'Holy Scripture'],
    communityTerms: ['congregation', 'parish'],
    spiritualLeaderTitle: 'Rector',
    practiceType: 'anglican',
  },
  pentecostal_charismatic: {
    prayerTerms: ['prayer', 'intercession', 'supplication'],
    scriptureTerms: ['Scripture', 'the Word'],
    communityTerms: ['congregation'],
    spiritualLeaderTitle: 'Pastor',
    practiceType: 'pentecostal',
  },
  nondenominational: {
    prayerTerms: ['prayer'],
    scriptureTerms: ['Scripture', 'the Word'],
    communityTerms: ['congregation'],
    spiritualLeaderTitle: 'Pastor',
    practiceType: 'nondenominational',
  },
  catholic_roman: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Scripture', 'Sacred Scripture'],
    communityTerms: ['parish', 'congregation'],
    spiritualLeaderTitle: 'Priest',
    practiceType: 'catholic',
  },
  catholic_eastern: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Scripture', 'Sacred Scripture'],
    communityTerms: ['parish', 'congregation'],
    spiritualLeaderTitle: 'Priest',
    practiceType: 'catholic_eastern',
  },
  orthodox_eastern: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Holy Scripture', 'Scripture'],
    communityTerms: ['parish', 'congregation'],
    spiritualLeaderTitle: 'Priest',
    practiceType: 'orthodox',
  },
  orthodox_oriental: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Holy Scripture', 'Scripture'],
    communityTerms: ['parish', 'congregation'],
    spiritualLeaderTitle: 'Priest',
    practiceType: 'orthodox_oriental',
  },
  black_church: {
    prayerTerms: ['prayer', 'intercession'],
    scriptureTerms: ['Scripture', 'the Word'],
    communityTerms: ['congregation', 'church family'],
    spiritualLeaderTitle: 'Pastor',
    practiceType: 'black_church',
  },
  mennonite_anabaptist: {
    prayerTerms: ['prayer', 'supplication'],
    scriptureTerms: ['Scripture', 'the Word'],
    communityTerms: ['congregation', 'community'],
    spiritualLeaderTitle: 'Elder',
    practiceType: 'anabaptist',
  },
  messianic_jewish: {
    prayerTerms: ['prayer', 'tefillah'],
    scriptureTerms: ['Scripture', 'Torah', 'Tanakh'],
    communityTerms: ['congregation', 'synagogue'],
    spiritualLeaderTitle: 'Rabbi',
    practiceType: 'messianic_jewish',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a local date string (YYYY-MM-DD) + HH:MM time string to a UTC Date
 * using the Intl API (same pattern as slotCalculator.js).
 */
function localDateTimeToUtc(dateStr, timeStr, timezone) {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const [hh, min] = timeStr.split(':').map(Number);

  // We want to find UTC time T such that T displayed in `timezone` shows
  // yyyy-mm-dd HH:MM:00.
  const targetLocalMs = Date.UTC(yyyy, mm - 1, dd, hh, min, 0, 0);
  const estimate = new Date(targetLocalMs);
  const offsetMs = computeOffsetMs(estimate, timezone);
  return new Date(targetLocalMs - offsetMs);
}

function computeOffsetMs(utcDate, timezone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   false,
  });
  const parts = fmt.formatToParts(utcDate);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  let hour = get('hour');
  if (hour === 24) hour = 0;
  const localAsUtcMs = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return localAsUtcMs - utcDate.getTime();
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Returns the onboarding state for the given tenant.
 *
 * @param {object} pool
 * @param {string} tenantId
 * @returns {Promise<{ onboardingCompleted: boolean, stepsCompleted: object }>}
 */
export async function getOnboardingStatus(pool, tenantId) {
  const [rows] = await pool.query(
    'SELECT onboarding_completed, onboarding_steps_completed FROM tenants WHERE id = ? LIMIT 1',
    [tenantId],
  );
  const row = rows[0];
  if (!row) {
    return { onboardingCompleted: false, stepsCompleted: {} };
  }
  const stepsCompleted =
    typeof row.onboarding_steps_completed === 'string'
      ? JSON.parse(row.onboarding_steps_completed)
      : (row.onboarding_steps_completed ?? {});
  return {
    onboardingCompleted: Boolean(row.onboarding_completed),
    stepsCompleted,
  };
}

/**
 * Marks a single step complete in the JSONB steps map.
 *
 * @param {object} pool
 * @param {string} tenantId
 * @param {'step1'|'step2'|'step3'|'step4'} step
 */
export async function markStepComplete(pool, tenantId, step) {
  await pool.query(
    `UPDATE tenants
        SET onboarding_steps_completed = jsonb_set(onboarding_steps_completed, ?::text[], 'true'::jsonb, true)
      WHERE id = ?`,
    [`{${step}}`, tenantId],
  );
}

/**
 * Marks the tenant's onboarding as fully complete.
 *
 * @param {object} pool
 * @param {string} tenantId
 */
export async function completeOnboarding(pool, tenantId) {
  await pool.query(
    'UPDATE tenants SET onboarding_completed = TRUE WHERE id = ?',
    [tenantId],
  );
}

/**
 * Updates the practice name and timezone for the tenant.
 *
 * @param {object} pool
 * @param {string} tenantId
 * @param {string} practiceName
 * @param {string} timezone
 */
export async function savePracticeName(pool, tenantId, practiceName, timezone) {
  await pool.query(
    'UPDATE practices SET name = ?, timezone = ? WHERE tenant_id = ?',
    [practiceName, timezone, tenantId],
  );
}

/**
 * Updates staff member name/license/bio and upserts the practice faith profile.
 *
 * @param {object} pool
 * @param {string} tenantId
 * @param {string} staffId
 * @param {{ firstName: string, lastName: string, licenseType: string, faithTradition: string, bio?: string }} data
 * @param {Function} encrypt  - encrypt(plaintext) from lib/encrypt.js
 * @param {Function} genVocabPreset  - optional fn(tradition) → vocab object; defaults to DEFAULT_VOCAB lookup
 */
export async function saveCounselorProfile(pool, tenantId, staffId, data, encrypt, genVocabPreset) {
  const { firstName, lastName, licenseType, faithTradition, bio } = data;

  await pool.query(
    `UPDATE staff_members
        SET first_name_enc = ?, last_name_enc = ?, license_type = ?, bio_enc = ?, updated_at = NOW()
      WHERE id = ? AND tenant_id = ?`,
    [
      encrypt(firstName),
      encrypt(lastName),
      licenseType,
      bio ? encrypt(bio) : null,
      staffId,
      tenantId,
    ],
  );

  const vocabPreset = genVocabPreset
    ? genVocabPreset(faithTradition)
    : (DEFAULT_VOCAB[faithTradition] ?? DEFAULT_VOCAB.broadly_christian);

  const profileId = crypto.randomUUID();

  await pool.query(
    `INSERT INTO practice_faith_profiles
       (id, tenant_id, tradition, vocabulary_preset, default_integration_level, updated_at, updated_by)
     VALUES (?, ?, ?, ?, 'preferred', NOW(), ?)
     ON CONFLICT (tenant_id) DO UPDATE
       SET tradition = ?, vocabulary_preset = ?, updated_at = NOW(), updated_by = ?`,
    [
      profileId,
      tenantId,
      faithTradition,
      JSON.stringify(vocabPreset),
      staffId,
      faithTradition,
      JSON.stringify(vocabPreset),
      staffId,
    ],
  );
}

/**
 * Inserts a first client record for the tenant.
 *
 * @param {object} pool
 * @param {string} tenantId
 * @param {{ firstName: string, lastName: string, email?: string, pronouns?: string }} data
 * @param {Function} encrypt
 * @returns {Promise<string>} clientId
 */
export async function createFirstClient(pool, tenantId, data, encrypt) {
  const { firstName, lastName, email, pronouns } = data;
  const clientId = crypto.randomUUID();

  await pool.query(
    `INSERT INTO clients
       (id, tenant_id, first_name_enc, last_name_enc, email_enc, pronouns, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`,
    [
      clientId,
      tenantId,
      encrypt(firstName),
      encrypt(lastName),
      email ? encrypt(email) : null,
      pronouns ?? null,
    ],
  );

  return clientId;
}

/**
 * Creates the first appointment for the tenant.
 *
 * @param {object} pool
 * @param {string} tenantId
 * @param {string} staffId
 * @param {{ clientId: string, date: string, time: string, apptType: string, durationMinutes: number }} data
 * @param {string} [practiceTimezoneOverride]  optional; if omitted, fetched from DB
 * @returns {Promise<string>} appointmentId
 */
export async function createFirstAppointment(pool, tenantId, staffId, data, practiceTimezoneOverride) {
  const { clientId, date, time, apptType, durationMinutes } = data;

  let timezone = practiceTimezoneOverride;
  if (!timezone) {
    const [tzRows] = await pool.query(
      'SELECT timezone FROM practices WHERE tenant_id = ? LIMIT 1',
      [tenantId],
    );
    timezone = tzRows[0]?.timezone ?? 'America/New_York';
  }

  const scheduledAt = localDateTimeToUtc(date, time, timezone);
  const endsAt = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);
  const appointmentId = crypto.randomUUID();

  await pool.query(
    `INSERT INTO appointments
       (id, tenant_id, client_id, counselor_id, appointment_type, status,
        starts_at, ends_at, duration_minutes, timezone)
     VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?)`,
    [
      appointmentId,
      tenantId,
      clientId,
      staffId,
      apptType,
      scheduledAt,
      endsAt,
      durationMinutes,
      timezone,
    ],
  );

  return appointmentId;
}

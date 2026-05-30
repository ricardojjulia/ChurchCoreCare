/**
 * Denomination vocabulary presets for the FaithWorkflows engine.
 *
 * These presets drive cosmetic vocabulary substitution in counselor-facing
 * template outputs. Clinical rules, scoring, and safety logic are never
 * affected by these values.
 *
 * Counselors review and edit all template output before clinical use.
 */

export const DENOMINATION_OPTIONS = [
  { value: 'broadly_christian',       label: 'Broadly Christian / Non-specific' },
  { value: 'evangelical_baptist',     label: 'Evangelical / Baptist' },
  { value: 'methodist',               label: 'Methodist' },
  { value: 'presbyterian_reformed',   label: 'Presbyterian / Reformed' },
  { value: 'lutheran',                label: 'Lutheran' },
  { value: 'anglican_episcopal',      label: 'Anglican / Episcopal' },
  { value: 'pentecostal_charismatic', label: 'Pentecostal / Charismatic' },
  { value: 'nondenominational',       label: 'Non-denominational' },
  { value: 'catholic_roman',          label: 'Catholic (Roman)' },
  { value: 'catholic_eastern',        label: 'Catholic (Eastern)' },
  { value: 'orthodox_eastern',        label: 'Orthodox (Eastern)' },
  { value: 'orthodox_oriental',       label: 'Orthodox (Oriental)' },
  { value: 'black_church',            label: 'Black Church (AME / COGIC)' },
  { value: 'mennonite_anabaptist',    label: 'Mennonite / Anabaptist' },
  { value: 'messianic_jewish',        label: 'Messianic Jewish' },
];

/**
 * Default vocabulary presets keyed by tradition value.
 * Every entry must include all five keys: prayerTerms, scriptureTerms,
 * communityTerms, spiritualLeaderTitle, practiceType.
 */
export const DEFAULT_VOCAB = {
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

/**
 * Resolve the vocabulary context to use for template substitution.
 *
 * Precedence (highest to lowest):
 *   1. Client vocabulary preset (only when client has opted into faith integration)
 *   2. Staff / counselor vocabulary preset
 *   3. Practice-level vocabulary preset
 *   4. null — no substitution applied
 *
 * @param {Object|null} clientFaithProfile
 * @param {Object|null} staffFaithProfile
 * @param {Object|null} practiceFaithProfile
 * @returns {Object|null}
 */
export function resolveVocabContext(clientFaithProfile, staffFaithProfile, practiceFaithProfile) {
  // Client must have opted in first — if not, return null (no vocab substitution)
  if (!clientFaithProfile?.integratesFaith) return null;

  // Precedence: client vocab → staff vocab → practice vocab → null
  if (clientFaithProfile?.vocabularyPreset && Object.keys(clientFaithProfile.vocabularyPreset).length > 0)
    return clientFaithProfile.vocabularyPreset;
  if (staffFaithProfile?.vocabularyPreset && Object.keys(staffFaithProfile.vocabularyPreset).length > 0)
    return staffFaithProfile.vocabularyPreset;
  if (practiceFaithProfile?.vocabularyPreset && Object.keys(practiceFaithProfile.vocabularyPreset).length > 0)
    return practiceFaithProfile.vocabularyPreset;

  return null;
}

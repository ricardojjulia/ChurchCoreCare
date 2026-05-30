/**
 * Static content templates for Faithful Workflows action outputs.
 *
 * These render deterministic, counselor-reviewable drafts from rule data.
 * No LLM is called here — all output is template-interpolated from structured
 * recommendation data already visible in the UI.
 *
 * All rendered strings must be treated as drafts requiring counselor review
 * before clinical use.
 */

export const AI_DISCLAIMER = '⚠ Template-generated draft — review and edit before clinical use';

// ─── Session agenda ──────────────────────────────────────────────────────────

/**
 * Build a plain-text session agenda from a client's pending recommendations.
 * @param {string} clientName
 * @param {import('./types.js').Recommendation[]} recommendations  — all recs, sorted
 * @returns {string}
 */
export function renderSessionAgenda(clientName, recommendations) {
  const pending = recommendations.filter((r) => r.status === 'pending' || r.status === 'deferred');
  if (!pending.length) {
    return `Session Agenda — ${clientName}\n\nNo open workflow items. Review treatment plan and client goals at start of session.\n\n${AI_DISCLAIMER}`;
  }

  const lines = [`Session Agenda — ${clientName}`, ''];

  const byCategory = {};
  for (const rec of pending) {
    if (!byCategory[rec.category]) byCategory[rec.category] = [];
    byCategory[rec.category].push(rec);
  }

  const CATEGORY_LABELS = {
    safety:            'Safety / Escalation',
    clinical_caution:  'Clinical Cautions',
    session_focus:     'Session Focus',
    homework:          'Homework Review',
    relationship:      'Relationship / Family',
    spiritual:         'Spiritual Care (Optional)',
    coordination:      'Coordination',
    monitoring:        'Monitoring',
  };

  for (const [cat, recs] of Object.entries(byCategory)) {
    lines.push(`## ${CATEGORY_LABELS[cat] ?? cat}`);
    for (const rec of recs) {
      lines.push(`- ${rec.title}`);
      if (rec.summary) lines.push(`  ${rec.summary}`);
    }
    lines.push('');
  }

  lines.push(AI_DISCLAIMER);
  return lines.join('\n');
}

// ─── Note prep ───────────────────────────────────────────────────────────────

/**
 * Render a progress note preparation prompt from a single recommendation.
 * Uses the recommendation's docNote field if present, otherwise builds from evidence.
 * @param {import('./types.js').Recommendation} rec
 * @returns {string}
 */
export function renderNotePrep(rec) {
  const lines = [
    `Progress Note Prep — ${rec.title}`,
    '',
    'Documentation considerations:',
  ];

  if (rec.docNote) {
    lines.push(rec.docNote);
  } else {
    lines.push(`Document clinical response to: ${rec.summary}`);
  }

  if (rec.evidence?.length) {
    lines.push('');
    lines.push('Supporting evidence:');
    for (const e of rec.evidence) {
      lines.push(`  • ${e}`);
    }
  }

  if (rec.cautions?.length) {
    lines.push('');
    lines.push('Cautions:');
    for (const c of rec.cautions) {
      lines.push(`  ⚠ ${c}`);
    }
  }

  lines.push('');
  lines.push(AI_DISCLAIMER);
  return lines.join('\n');
}

// ─── Bible verse suggestions ─────────────────────────────────────────────────

const VERSE_MAP = {
  safety: [
    { ref: 'Psalm 34:18', text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.' },
    { ref: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God.' },
    { ref: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
  ],
  clinical_caution: [
    { ref: 'Jeremiah 29:11', text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."' },
    { ref: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him.' },
    { ref: 'Philippians 4:6–7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.' },
  ],
  session_focus: [
    { ref: 'Proverbs 3:5–6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
    { ref: 'Lamentations 3:22–23', text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning.' },
  ],
  homework: [
    { ref: 'Psalm 119:11', text: 'I have hidden your word in my heart that I might not sin against you.' },
    { ref: 'Joshua 1:8', text: 'Keep this Book of the Law always on your lips; meditate on it day and night.' },
  ],
  relationship: [
    { ref: 'Colossians 3:13', text: 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.' },
    { ref: 'Ephesians 4:32', text: 'Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.' },
  ],
  spiritual: [
    { ref: 'John 14:27', text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.' },
    { ref: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.' },
    { ref: '2 Corinthians 12:9', text: '"My grace is sufficient for you, for my power is made perfect in weakness."' },
  ],
  coordination: [
    { ref: 'Proverbs 15:22', text: 'Plans fail for lack of counsel, but with many advisers they succeed.' },
  ],
  monitoring: [
    { ref: 'Philippians 1:6', text: 'Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.' },
    { ref: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
  ],
};

/**
 * Return verse suggestions for a recommendation's category.
 * @param {import('./types.js').Recommendation} rec
 * @param {Object|null} practiceVocab — optional vocabulary preset for substitution
 * @returns {string}
 */
export function renderVerseSuggestions(rec, practiceVocab = null) {
  const verses = VERSE_MAP[rec.category] ?? VERSE_MAP.spiritual;
  const scriptureLabel = practiceVocab?.scriptureTerms?.[0] ?? 'Scripture';
  const lines = [
    `${scriptureLabel} Suggestions — ${rec.title}`,
    '',
    `These verses may offer comfort or reflection relevant to this care area.`,
    'Share only with clients who have opted into faith integration.',
    '',
  ];
  for (const v of verses) {
    lines.push(`${v.ref}`);
    // Apply vocabulary substitution in body text only
    const bodyText = practiceVocab
      ? v.text.replace(/\bScripture\b/g, scriptureLabel)
      : v.text;
    lines.push(`"${bodyText}"`);
    lines.push('');
  }
  lines.push(AI_DISCLAIMER);
  return lines.join('\n');
}

// ─── Prayer prompt ───────────────────────────────────────────────────────────

/**
 * Render a brief, non-prescriptive prayer prompt for a spiritual care recommendation.
 * @param {import('./types.js').Recommendation} rec
 * @param {Object|null} practiceVocab — optional vocabulary preset for substitution
 * @returns {string}
 */
export function renderPrayerPrompt(rec, practiceVocab = null) {
  const prayerTerm = practiceVocab?.prayerTerms?.[0] ?? 'prayer';
  const useCustomTerm = prayerTerm !== 'prayer';
  return [
    `${useCustomTerm ? prayerTerm.charAt(0).toUpperCase() + prayerTerm.slice(1) : 'Prayer'} Prompt — ${rec.title}`,
    '',
    `If the client has invited ${prayerTerm} into session, consider a brief closing ${prayerTerm}`,
    'acknowledging the area of care being addressed.',
    '',
    `Suggested focus: ${rec.summary}`,
    '',
    `Note: ${useCustomTerm ? prayerTerm.charAt(0).toUpperCase() + prayerTerm.slice(1) : 'Prayer'} is always led by the client's invitation and comfort. Never assume.`,
    '',
    AI_DISCLAIMER,
  ].join('\n');
}

// ─── CBT / grounding exercise ────────────────────────────────────────────────

/**
 * Render a brief CBT or grounding exercise prompt.
 * @param {import('./types.js').Recommendation} rec
 * @returns {string}
 */
export function renderCbtExercise(rec) {
  const isAnxiety = rec.evidence?.some((e) => /GAD|anxiety/i.test(e));
  const exerciseType = isAnxiety ? '5-4-3-2-1 Grounding' : 'Thought Record';

  const lines = [
    `${exerciseType} Exercise — ${rec.title}`,
    '',
  ];

  if (exerciseType === '5-4-3-2-1 Grounding') {
    lines.push(
      'Guide the client through the 5-4-3-2-1 grounding technique:',
      '  5 — Name 5 things you can see',
      '  4 — Name 4 things you can touch',
      '  3 — Name 3 things you can hear',
      '  2 — Name 2 things you can smell',
      '  1 — Name 1 thing you can taste',
      '',
      'Encourage slow, deliberate breathing throughout.',
    );
  } else {
    lines.push(
      'Guide the client through a brief thought record:',
      '  Situation: What happened?',
      '  Automatic thought: What went through your mind?',
      '  Emotion: What did you feel, and how intense (0–100)?',
      '  Evidence for the thought:',
      '  Evidence against the thought:',
      '  Balanced thought: A more balanced way to see the situation.',
      '  Outcome: How do you feel now (0–100)?',
    );
  }

  lines.push('', AI_DISCLAIMER);
  return lines.join('\n');
}

// ─── Journal prompt ──────────────────────────────────────────────────────────

/**
 * Render a between-session journaling prompt.
 * @param {import('./types.js').Recommendation} rec
 * @param {Object|null} practiceVocab — optional vocabulary preset for substitution
 * @returns {string}
 */
export function renderJournalPrompt(rec, practiceVocab = null) {
  const hasFaith = rec.faithNote != null;
  const scriptureLabel = practiceVocab?.scriptureTerms?.[0] ?? 'Scripture';
  const lines = [
    `Journaling Prompt — ${rec.title}`,
    '',
    'Between-session journaling prompt for the client:',
    '',
    `Reflect on: ${rec.summary}`,
    '',
    'Suggested questions:',
    '  • What patterns have you noticed this week related to this area?',
    '  • What is one small step you could take toward your goal?',
    '  • What thoughts or feelings came up that surprised you?',
  ];

  if (hasFaith) {
    lines.push(
      '',
      'Faith reflection (optional, only if client has invited this):',
      '  • Where did you sense God\'s presence or absence this week?',
      `  • Is there a ${scriptureLabel} passage that has been on your mind?`,
    );
  }

  lines.push('', AI_DISCLAIMER);
  return lines.join('\n');
}

// ─── Follow-up message draft ─────────────────────────────────────────────────

/**
 * Render a brief follow-up message draft for coordination or monitoring items.
 * @param {string} clientFirstName
 * @param {import('./types.js').Recommendation} rec
 * @returns {string}
 */
export function renderFollowupMessage(clientFirstName, rec) {
  return [
    `Follow-up Message Draft — ${rec.title}`,
    '',
    `Hi ${clientFirstName || 'there'},`,
    '',
    `I wanted to follow up regarding ${rec.summary.toLowerCase().replace(/\.$/, '')}.`,
    'Please reach out if you have any questions or would like to discuss further.',
    '',
    '[Counselor name]',
    '',
    'Note: Review and personalise before sending. Do not send PHI through unsecured channels.',
    '',
    AI_DISCLAIMER,
  ].join('\n');
}

// ─── Care summary (print/export) ─────────────────────────────────────────────

/**
 * Render a print-ready HTML care summary for a client.
 * Designed for browser print-to-PDF; no external assets required.
 *
 * @param {{ client: Object, diagnoses?: Object[], assessments?: Object[], faithProfile?: Object|null, treatmentPlan?: Object|null }} data
 * @param {import('./types.js').Recommendation[]} recommendations
 * @returns {string} complete HTML document
 */
export function renderCareSummaryHtml(data, recommendations) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = (iso) => { try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return String(iso ?? '—'); } };

  const client = data.client ?? {};
  const clientName = esc(`${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || 'Unknown Client');
  const generatedAt = fmt(new Date().toISOString());

  const diagRows = (data.diagnoses ?? []).map((dx) =>
    `<tr><td>${esc(dx.code ?? '')}</td><td>${esc(dx.description ?? '')}</td><td>${dx.primary ? 'Primary' : 'Secondary'}</td></tr>`
  ).join('') || '<tr><td colspan="3">No active diagnoses on file</td></tr>';

  const ASSESSMENT_LABELS = { 'PHQ-9': 'Depression (PHQ-9)', 'GAD-7': 'Anxiety (GAD-7)', 'PCL-5': 'Trauma (PCL-5)' };
  const SCORE_BANDS = {
    'PHQ-9': [{ max: 4, label: 'Minimal', cls: 'green' }, { max: 9, label: 'Mild', cls: 'yellow' }, { max: 14, label: 'Moderate', cls: 'orange' }, { max: 19, label: 'Mod-Severe', cls: 'orange' }, { max: 27, label: 'Severe', cls: 'red' }],
    'GAD-7': [{ max: 4, label: 'Minimal', cls: 'green' }, { max: 9, label: 'Mild', cls: 'yellow' }, { max: 14, label: 'Moderate', cls: 'orange' }, { max: 21, label: 'Severe', cls: 'red' }],
    'PCL-5': [{ max: 30, label: 'Below threshold', cls: 'green' }, { max: 50, label: 'Probable PTSD', cls: 'orange' }, { max: 80, label: 'Severe', cls: 'red' }],
  };
  const scoreBand = (name, score) => {
    const bands = SCORE_BANDS[name] ?? [];
    for (const b of bands) { if (score <= b.max) return b; }
    return { label: 'N/A', cls: 'gray' };
  };

  const seen = new Set();
  const scoreRows = (data.assessments ?? [])
    .filter((a) => a.score != null && (a.scoredAt || a.completedAt) && ['PHQ-9', 'GAD-7', 'PCL-5'].some((n) => (a.inventoryName ?? '').includes(n)))
    .sort((a, b) => new Date(b.scoredAt ?? b.completedAt) - new Date(a.scoredAt ?? a.completedAt))
    .filter((a) => { const key = a.inventoryName; if (seen.has(key)) return false; seen.add(key); return true; })
    .map((a) => {
      const b = scoreBand(a.inventoryName, a.score);
      return `<tr><td>${esc(ASSESSMENT_LABELS[a.inventoryName] ?? a.inventoryName)}</td><td><strong>${esc(a.score)}</strong></td><td class="band-${esc(b.cls)}">${esc(b.label)}</td><td>${fmt(a.scoredAt ?? a.completedAt)}</td></tr>`;
    }).join('') || '<tr><td colspan="4">No scored assessments on file</td></tr>';

  const goalRows = (data.treatmentPlan?.goals ?? []).map((g) =>
    `<tr><td>${esc(g.description ?? '')}</td><td class="status-${esc(g.status ?? 'unknown')}">${esc(g.status ?? '—')}</td><td>${fmt(g.targetDate)}</td></tr>`
  ).join('') || '<tr><td colspan="3">No treatment goals</td></tr>';

  const CATEGORY_LABEL = { safety: 'Safety / Escalation', clinical_caution: 'Clinical Cautions', session_focus: 'Session Focus', homework: 'Homework', relationship: 'Relationship', spiritual: 'Spiritual Care', coordination: 'Coordination', monitoring: 'Monitoring' };
  const recRows = recommendations.filter((r) => r.status !== 'hidden').map((r) =>
    `<tr><td class="rec-cat">${esc(CATEGORY_LABEL[r.category] ?? r.category)}</td><td><strong>${esc(r.title)}</strong><br><small>${esc(r.summary)}</small></td><td class="rec-status-${esc(r.status ?? 'pending')}">${esc(r.status ?? 'pending')}</td><td>${r.priority}</td></tr>`
  ).join('') || '<tr><td colspan="4">No workflow recommendations</td></tr>';

  const faithSection = data.faithProfile ? `
    <section>
      <h2>Faith Profile</h2>
      <p><strong>Tradition:</strong> ${esc(data.faithProfile.tradition ?? '—')}</p>
      <p><strong>Faith integration:</strong> ${data.faithProfile.integratesFaith ? 'Yes — client has opted in' : 'No — client has not opted in'}</p>
      ${data.faithProfile.notes ? `<p><strong>Notes:</strong> ${esc(data.faithProfile.notes)}</p>` : ''}
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Care Summary — ${clientName}</title>
<style>
  body { font-family: Georgia, serif; font-size: 11pt; margin: 1.5in 1in; color: #1a1a1a; }
  h1 { font-size: 16pt; border-bottom: 2px solid #333; padding-bottom: 4px; }
  h2 { font-size: 12pt; margin-top: 1.2em; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 0.5em 0 1em; font-size: 10pt; }
  th { background: #f0f0f0; text-align: left; padding: 4px 8px; border: 1px solid #ccc; }
  td { padding: 3px 8px; border: 1px solid #ddd; vertical-align: top; }
  .band-green { color: #1a7a2a; font-weight: bold; }
  .band-yellow { color: #7a6000; font-weight: bold; }
  .band-orange { color: #a04000; font-weight: bold; }
  .band-red { color: #a00000; font-weight: bold; }
  .status-completed { color: #1a7a2a; }
  .status-in_progress { color: #a04000; }
  .rec-cat { font-size: 9pt; white-space: nowrap; }
  .rec-status-complete { color: #1a7a2a; }
  .rec-status-pending { color: #333; }
  .rec-status-deferred { color: #7a6000; }
  .disclaimer { font-size: 8pt; color: #888; border-top: 1px solid #ccc; margin-top: 2em; padding-top: 0.5em; }
  @media print { body { margin: 0.75in 0.75in; } }
</style>
</head>
<body>
<h1>Client Care Summary — ${clientName}</h1>
<p style="color:#666;font-size:10pt">Generated: ${generatedAt} &nbsp;|&nbsp; ChurchCore Care</p>

<section>
  <h2>Active Diagnoses</h2>
  <table><thead><tr><th>Code</th><th>Description</th><th>Type</th></tr></thead><tbody>${diagRows}</tbody></table>
</section>

<section>
  <h2>Latest Assessment Scores</h2>
  <table><thead><tr><th>Assessment</th><th>Score</th><th>Range</th><th>Scored</th></tr></thead><tbody>${scoreRows}</tbody></table>
</section>

<section>
  <h2>Treatment Plan Goals</h2>
  <table><thead><tr><th>Goal</th><th>Status</th><th>Target Date</th></tr></thead><tbody>${goalRows}</tbody></table>
</section>
${faithSection}
<section>
  <h2>Workflow Recommendations</h2>
  <table><thead><tr><th>Category</th><th>Recommendation</th><th>Status</th><th>Priority</th></tr></thead><tbody>${recRows}</tbody></table>
</section>

<p class="disclaimer">This document was generated from ChurchCore Care workflow data. All clinical decisions remain the sole responsibility of the licensed counselor. ${AI_DISCLAIMER}</p>
</body>
</html>`;
}

// ─── Dispatch helper ─────────────────────────────────────────────────────────

/**
 * Dispatch to the right template renderer for a given action key.
 * @param {string} actionKey
 * @param {import('./types.js').Recommendation} rec
 * @param {{ clientName?: string, clientFirstName?: string, allRecommendations?: import('./types.js').Recommendation[], practiceVocab?: Object|null }} ctx
 * @returns {string|null}
 */
export function renderActionContent(actionKey, rec, ctx = {}) {
  const practiceVocab = ctx.practiceVocab ?? null;
  switch (actionKey) {
    case 'generate_session_agenda':
      return renderSessionAgenda(ctx.clientName ?? 'Client', ctx.allRecommendations ?? [rec]);
    case 'generate_note_prep':
      return renderNotePrep(rec);
    case 'suggest_verses':
      return renderVerseSuggestions(rec, practiceVocab);
    case 'create_prayer_prompt':
      return renderPrayerPrompt(rec, practiceVocab);
    case 'create_cbt_exercise':
      return renderCbtExercise(rec);
    case 'create_journal_prompt':
      return renderJournalPrompt(rec, practiceVocab);
    case 'draft_followup_message':
      return renderFollowupMessage(ctx.clientFirstName ?? '', rec);
    default:
      return null;
  }
}

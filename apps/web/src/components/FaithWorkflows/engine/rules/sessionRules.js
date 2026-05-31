/**
 * Session Focus Rules
 *
 * - Overdue treatment goal (target date passed, not completed)
 * - Pending/incomplete homework assignment
 * - Pending unscored assessment
 * - Session frequency declining (spacing widening = disengagement signal)
 */

import { daysSince } from '../utils.js';

/**
 * Rule: One or more treatment goals with passed target dates
 */
export function ruleOverdueGoals(data, clientId) {
  const goals = data.treatmentPlan?.goals ?? [];
  const overdue = goals.filter((g) => {
    if (!g.targetDate) return false;
    if (g.status === 'completed') return false;
    return new Date(g.targetDate) < new Date();
  });
  if (overdue.length === 0) return null;

  const names = overdue.map((g) => `"${g.description}"`).join(', ');
  return {
    id: `rule_session_goal_overdue:${clientId}`,
    ruleId: 'rule_session_goal_overdue',
    category: 'session_focus',
    title: `${overdue.length} Overdue Treatment Goal${overdue.length > 1 ? 's' : ''}`,
    summary: `${overdue.length} treatment goal${overdue.length > 1 ? 's have' : ' has'} passed target date without completion: ${names}.`,
    rationale: `Goals that have passed their target dates without completion suggest a need to review progress, revise timelines, or adjust interventions. This is a natural agenda item for an upcoming session — either to celebrate near-completion or to recalibrate.`,
    evidence: overdue.map((g) => `"${g.description}" — target: ${g.targetDate ? new Date(g.targetDate).toLocaleDateString() : 'unknown'}`),
    priority: 5,
    confidence: 0.90,
    cautions: [],
    actions: ['generate_session_agenda', 'create_treatment_plan_update', 'generate_note_prep'],
    faithNote: null,
    status: 'pending',
    orderedAfter: null,
    docNote: 'Document goal review and any revisions to target dates or intervention plans.',
  };
}

/**
 * Rule: Pending homework that has not been submitted
 */
export function rulePendingHomework(data, clientId) {
  const pending = (data.homeworkPending ?? []).filter((hw) => !hw.submittedAt);
  if (pending.length === 0) return null;

  const names = pending.map((hw) => `"${hw.title}"`).join(', ');
  const oldest = pending.reduce((a, b) => new Date(a.assignedAt) < new Date(b.assignedAt) ? a : b);
  const daysOld = daysSince(oldest.assignedAt);

  return {
    id: `rule_session_homework_incomplete:${clientId}`,
    ruleId: 'rule_session_homework_incomplete',
    category: 'session_focus',
    title: `${pending.length} Incomplete Homework Assignment${pending.length > 1 ? 's' : ''}`,
    summary: `Client has ${pending.length} unsubmitted homework assignment${pending.length > 1 ? 's' : ''}: ${names}. Oldest assigned ${daysOld} days ago.`,
    rationale: `Between-session homework is a key component of evidence-based therapies like CBT. Unsubmitted assignments may indicate barriers to engagement, difficulty with the task, or avoidance. Address in session to explore what got in the way and adjust if needed.`,
    evidence: [
      `Pending assignments: ${names}`,
      `Oldest unsubmitted: ${daysOld} days`,
    ],
    priority: 5,
    confidence: 1.0,
    cautions: [],
    actions: ['generate_session_agenda', 'create_cbt_exercise'],
    faithNote: null,
    status: 'pending',
    orderedAfter: null,
    docNote: 'Document homework review, any barriers identified, and revised or new assignments.',
  };
}

/**
 * Rule: Session frequency declining — appointment spacing has widened significantly,
 * suggesting the client may be disengaging from treatment.
 *
 * Fires when: ≥3 completed appointments AND the last inter-session gap is
 * more than 1.5× the first gap AND the last gap exceeds 21 days.
 */
export function ruleSessionFrequencyDecline(data, clientId) {
  const completed = (data.appointments ?? [])
    .filter((a) => a.status === 'completed' && (a.startsAt || a.scheduledAt))
    .sort((a, b) => new Date(a.startsAt ?? a.scheduledAt) - new Date(b.startsAt ?? b.scheduledAt));

  if (completed.length < 3) return null;

  const gaps = [];
  for (let i = 1; i < completed.length; i++) {
    const prev = new Date(completed[i - 1].startsAt ?? completed[i - 1].scheduledAt);
    const curr = new Date(completed[i].startsAt ?? completed[i].scheduledAt);
    gaps.push(Math.round((curr - prev) / (1000 * 60 * 60 * 24)));
  }

  const firstGap = gaps[0];
  const lastGap = gaps[gaps.length - 1];

  if (lastGap < firstGap * 1.5 || lastGap < 21) return null;

  const drift = lastGap - firstGap;

  return {
    id: `rule_session_frequency_decline:${clientId}`,
    ruleId: 'rule_session_frequency_decline',
    category: 'session_focus',
    title: 'Session Frequency Declining',
    summary: `Appointment spacing has widened from ${firstGap} to ${lastGap} days (+${drift} days). This pattern may signal disengagement or practical barriers to attendance.`,
    rationale: `A widening gap between sessions can indicate the client is beginning to disengage from treatment — whether due to avoidance, life logistics, improved symptoms, or ambivalence about continuing. Early detection allows the counselor to explore the meaning of the spacing change collaboratively before full dropout occurs. This is distinct from a planned step-down in frequency, which would be documented in the treatment plan.`,
    evidence: [
      `Session gap widened: ${firstGap} days → ${lastGap} days`,
      `Drift over last ${completed.length} sessions: +${drift} days`,
    ],
    priority: 5,
    confidence: 0.80,
    cautions: [
      'Confirm this is not a counselor-initiated step-down before flagging as disengagement.',
      'Scheduled longer intervals (e.g., bi-weekly to monthly) are expected during maintenance phase.',
    ],
    actions: ['generate_session_agenda', 'draft_followup_message'],
    faithNote: null,
    status: 'pending',
    orderedAfter: null,
    docNote: 'Document discussion of session frequency and any agreed changes to the schedule.',
  };
}

/**
 * Rule: Assigned assessment not yet completed
 */
export function rulePendingAssessment(data, clientId) {
  const pending = (data.assessments ?? []).filter(
    (a) => a.status === 'assigned' && !a.completedAt && !a.scoredAt,
  );
  if (pending.length === 0) return null;

  const names = pending.map((a) => a.inventoryName ?? a.title ?? a.id).join(', ');
  return {
    id: `rule_session_assessment_pending:${clientId}`,
    ruleId: 'rule_session_assessment_pending',
    category: 'session_focus',
    title: `${pending.length} Pending Assessment${pending.length > 1 ? 's' : ''}`,
    summary: `${pending.length} assigned assessment${pending.length > 1 ? 's have' : ' has'} not been completed: ${names}.`,
    rationale: `Pending assessments delay important clinical data needed for treatment planning and outcome monitoring. Consider completing these at the start of the next session or requesting pre-session completion.`,
    evidence: [
      `Pending: ${names}`,
    ],
    priority: 4,
    confidence: 1.0,
    cautions: [],
    actions: ['generate_session_agenda', 'add_reminder_task'],
    faithNote: null,
    status: 'pending',
    orderedAfter: null,
    docNote: 'Document that assessments were completed or reschedule with reason.',
  };
}

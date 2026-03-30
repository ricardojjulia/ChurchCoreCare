export const IndividualTreatmentPlan = {
  id: 'individual_treatment_plan',
  title: 'Individual Treatment Plan',
  description:
    'Organizes presenting problems, measurable goals, interventions, review cadence, and faith-integration preferences into a structured treatment plan.',
  icon: '📝',
  color: 'green',
  estimatedMinutes: 15,
  sections: [
    {
      id: 'plan_context',
      title: 'Plan Context',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'planDate', label: 'Plan date', type: 'date', required: true, half: true },
        { id: 'primaryConcern', label: 'Primary concern or diagnosis focus', type: 'textarea', required: true, minRows: 3 },
        { id: 'strengths', label: 'Client strengths and resources', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'goals_objectives',
      title: 'Goals and Objectives',
      fields: [
        { id: 'longTermGoal', label: 'Long-term treatment goal', type: 'textarea', required: true, minRows: 3 },
        { id: 'objective1', label: 'Objective 1', type: 'textarea', minRows: 2 },
        { id: 'objective2', label: 'Objective 2', type: 'textarea', minRows: 2 },
        { id: 'objective3', label: 'Objective 3', type: 'textarea', minRows: 2 },
      ],
    },
    {
      id: 'interventions_review',
      title: 'Interventions and Review',
      fields: [
        { id: 'interventions', label: 'Planned interventions', type: 'checkboxes', options: ['CBT', 'Trauma-informed therapy', 'Psychoeducation', 'Behavioral activation', 'Emotion regulation skills', 'Faith-integrated reflection', 'Couples or family work', 'Case management referrals'] },
        { id: 'sessionFrequency', label: 'Planned session frequency', type: 'select', options: ['Weekly', 'Biweekly', 'Monthly', 'As needed'] },
        { id: 'reviewCadence', label: 'Treatment plan review cadence', type: 'select', options: ['30 days', '60 days', '90 days', 'Every quarter'] },
        { id: 'faithIntegration', label: 'Faith integration preference within treatment', type: 'radio', options: ['Requested', 'Optional', 'Not requested'] },
      ],
    },
  ],
};

export const SMARTGoalsWorksheet = {
  id: 'smart_goals_worksheet',
  title: 'SMART Goals Worksheet',
  description:
    'Guides the client and counselor in turning broad hopes into specific, measurable, achievable, relevant, and time-bound goals.',
  icon: '🎯',
  color: 'lime',
  estimatedMinutes: 12,
  sections: [
    {
      id: 'goal_focus',
      title: 'Goal Focus',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'worksheetDate', label: 'Worksheet date', type: 'date', required: true, half: true },
        { id: 'goalArea', label: 'Area of life or treatment this goal supports', type: 'select', options: ['Mood', 'Anxiety', 'Trauma recovery', 'Relationships', 'Parenting', 'Spiritual growth', 'Stress management', 'Health habits', 'Other'] },
        { id: 'goalStatement', label: 'Draft goal statement', type: 'textarea', required: true, minRows: 3 },
      ],
    },
    {
      id: 'smart',
      title: 'SMART Breakdown',
      fields: [
        { id: 'specific', label: 'Specific: What exactly do I want to do or change?', type: 'textarea', required: true, minRows: 2 },
        { id: 'measurable', label: 'Measurable: How will progress be tracked?', type: 'textarea', required: true, minRows: 2 },
        { id: 'achievable', label: 'Achievable: Why is this realistic right now?', type: 'textarea', required: true, minRows: 2 },
        { id: 'relevant', label: 'Relevant: Why does this matter to my life, values, or treatment?', type: 'textarea', required: true, minRows: 2 },
        { id: 'timeBound', label: 'Time-bound: What timeline will I use?', type: 'textarea', required: true, minRows: 2 },
      ],
    },
    {
      id: 'barriers_supports',
      title: 'Barriers and Supports',
      fields: [
        { id: 'obstacles', label: 'Likely obstacles', type: 'textarea', minRows: 2 },
        { id: 'supports', label: 'Supports, habits, or people that can help', type: 'textarea', minRows: 2 },
        { id: 'faithMotivation', label: 'Values, faith themes, or scriptures that reinforce this goal', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

export const RelapsePreventionPlan = {
  id: 'relapse_prevention_plan',
  title: 'Relapse Prevention Plan',
  description:
    'Maps risk situations, early warning signs, coping actions, accountability supports, and emergency steps to reduce relapse risk.',
  icon: '🧭',
  color: 'blue',
  estimatedMinutes: 14,
  sections: [
    {
      id: 'risk_landscape',
      title: 'Risk Landscape',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'planDate', label: 'Plan date', type: 'date', required: true, half: true },
        { id: 'relapseDefinition', label: 'What would relapse, setback, or loss of stability look like for you?', type: 'textarea', required: true, minRows: 3 },
        { id: 'highRiskSituations', label: 'High-risk situations or triggers', type: 'textarea', required: true, minRows: 3 },
      ],
    },
    {
      id: 'warning_response',
      title: 'Warning Signs and Response',
      fields: [
        { id: 'warningSigns', label: 'Early warning signs', type: 'textarea', required: true, minRows: 3 },
        { id: 'firstSteps', label: 'First steps to take when warning signs appear', type: 'textarea', required: true, minRows: 3 },
        { id: 'helpfulRoutines', label: 'Routines that help restore stability', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'supports_commitment',
      title: 'Supports and Commitment',
      fields: [
        { id: 'supportNetwork', label: 'People or professionals to contact', type: 'textarea', required: true, minRows: 3 },
        { id: 'environmentChanges', label: 'Environmental safeguards or boundaries', type: 'textarea', minRows: 2 },
        { id: 'faithReminders', label: 'Faith reminders, values, or scriptures that help me persist', type: 'textarea', minRows: 2 },
        { id: 'emergencyAction', label: 'Emergency action if safety drops sharply', type: 'textarea', required: true, minRows: 3 },
      ],
    },
  ],
};

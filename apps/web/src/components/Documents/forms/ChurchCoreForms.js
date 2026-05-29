export const FaithHistoryQuestionnaire = {
  id: 'faith_history_questionnaire',
  title: 'Faith History Questionnaire',
  description:
    'Explores spiritual background, wounds, supports, current practices, and how faith may or may not fit into counseling.',
  icon: '✝️',
  color: 'violet',
  estimatedMinutes: 12,
  sections: [
    {
      id: 'background',
      title: 'Spiritual Background',
      fields: [
        { id: 'faithTradition', label: 'Faith tradition or background', type: 'text', required: true },
        { id: 'spiritualUpbringing', label: 'Describe your spiritual or church upbringing', type: 'textarea', minRows: 3 },
        { id: 'currentConnection', label: 'Current connection to a faith community', type: 'select', options: ['Active and connected', 'Occasionally connected', 'Disconnected right now', 'No current community'] },
        { id: 'importantPractices', label: 'Practices that have been meaningful', type: 'checkboxes', options: ['Prayer', 'Scripture reading', 'Worship', 'Church community', 'Silence and solitude', 'Service', 'Journaling', 'None currently'] },
      ],
    },
    {
      id: 'meaning_wounds',
      title: 'Meaning, Comfort, and Wounds',
      fields: [
        { id: 'comfortSources', label: 'How has faith or spirituality been a source of comfort or strength?', type: 'textarea', minRows: 3 },
        { id: 'spiritualWounds', label: 'Any spiritual wounds, disappointments, or confusion that still affect you?', type: 'textarea', minRows: 3 },
        { id: 'questionsForCare', label: 'What would you want your counselor to understand about your faith story?', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'integration',
      title: 'Counseling Integration',
      fields: [
        { id: 'integrationPreference', label: 'How would you like faith integrated into counseling?', type: 'select', options: ['Actively include prayer and scripture', 'Include faith themes when relevant', 'Minimal integration', 'Not at this time', 'Unsure'] },
        { id: 'spiritualGoals', label: 'Any spiritual hopes or goals for counseling?', type: 'textarea', minRows: 3 },
        { id: 'hopeStatement', label: 'What gives you hope right now?', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

export const ValuesAndBiblicalIdentityWorksheet = {
  id: 'values_and_biblical_identity_worksheet',
  title: 'Values and Biblical Identity Worksheet',
  description:
    'A faith-integrated reflection tool for clarifying personal values, identity statements, and daily choices aligned with truth and discipleship.',
  icon: '🌿',
  color: 'lime',
  estimatedMinutes: 10,
  sections: [
    {
      id: 'values_core',
      title: 'Core Values',
      fields: [
        { id: 'topValues', label: 'Values that matter most to me', type: 'textarea', required: true, minRows: 3 },
        { id: 'valueConflicts', label: 'Where my current habits, fears, or pressures pull me away from those values', type: 'textarea', minRows: 3 },
        { id: 'identityStruggle', label: 'Messages or labels I struggle to believe about myself', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'truth_identity',
      title: 'Identity and Truth',
      fields: [
        { id: 'identityInChrist', label: 'Truths about my identity I want to remember', type: 'textarea', minRows: 3, placeholder: 'Beloved, forgiven, growing, called, not alone, etc.' },
        { id: 'scriptureAnchor', label: 'Scripture or faith statements that reinforce these truths', type: 'textarea', minRows: 2 },
        { id: 'renewedMind', label: 'What changes when I live from truth instead of fear or shame?', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'practice',
      title: 'Practice',
      fields: [
        { id: 'alignedAction', label: 'One action this week that aligns with my values and identity', type: 'textarea', required: true, minRows: 2 },
        { id: 'supportReminder', label: 'A reminder, prayer, or accountability support that will help me follow through', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

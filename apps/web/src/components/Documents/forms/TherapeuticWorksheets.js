export const CBTThoughtRecord = {
  id: 'cbt_thought_record',
  title: 'CBT Thought Record',
  description:
    'A structured CBT worksheet for capturing situations, automatic thoughts, emotions, evidence, and a more balanced response.',
  icon: '🧠',
  color: 'violet',
  estimatedMinutes: 10,
  sections: [
    {
      id: 'situation',
      title: 'Situation',
      fields: [
        { id: 'entryDate', label: 'Entry date', type: 'date', required: true, half: true },
        { id: 'situation', label: 'What happened?', type: 'textarea', required: true, minRows: 3 },
        { id: 'automaticThoughts', label: 'Automatic thoughts', type: 'textarea', required: true, minRows: 3 },
      ],
    },
    {
      id: 'emotion_evidence',
      title: 'Emotion and Evidence',
      fields: [
        { id: 'emotionIntensity', label: 'Emotion intensity before reframing', type: 'scale', min: 0, max: 10, minLabel: 'Low', maxLabel: 'High' },
        { id: 'evidenceFor', label: 'Evidence supporting the automatic thought', type: 'textarea', minRows: 3 },
        { id: 'evidenceAgainst', label: 'Evidence that does not support it', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'balanced_response',
      title: 'Balanced Response',
      fields: [
        { id: 'balancedThought', label: 'More balanced or truthful thought', type: 'textarea', required: true, minRows: 3 },
        { id: 'emotionAfter', label: 'Emotion intensity after reframing', type: 'scale', min: 0, max: 10, minLabel: 'Low', maxLabel: 'High' },
        { id: 'faithReflection', label: 'Optional faith reflection or truth statement', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

export const CognitiveDistortionsWorksheet = {
  id: 'cognitive_distortions_worksheet',
  title: 'Cognitive Distortions Worksheet',
  description:
    'Helps identify common cognitive distortions, name their impact, and practice alternative perspectives.',
  icon: '🪞',
  color: 'grape',
  estimatedMinutes: 8,
  sections: [
    {
      id: 'distortion_identification',
      title: 'Distortion Identification',
      fields: [
        { id: 'triggerSituation', label: 'Triggering situation', type: 'textarea', required: true, minRows: 3 },
        { id: 'distortions', label: 'Distortions that fit best', type: 'checkboxes', options: ['All-or-nothing thinking', 'Catastrophizing', 'Mind reading', 'Fortune telling', 'Should statements', 'Labeling', 'Emotional reasoning', 'Personalization', 'Discounting the positive'] },
        { id: 'impact', label: 'How this thinking pattern affects mood or behavior', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'reframe',
      title: 'Reframe',
      fields: [
        { id: 'alternativeView', label: 'Alternative or more grounded perspective', type: 'textarea', required: true, minRows: 3 },
        { id: 'nextAction', label: 'One healthier action to take next', type: 'textarea', minRows: 2 },
        { id: 'truthReminder', label: 'Optional truth reminder, value, or scripture', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

export const BehavioralActivationSchedule = {
  id: 'behavioral_activation_schedule',
  title: 'Behavioral Activation Schedule',
  description:
    'Supports mood recovery by planning meaningful, life-giving, and manageable activities across the week.',
  icon: '📅',
  color: 'indigo',
  estimatedMinutes: 10,
  sections: [
    {
      id: 'activation_targets',
      title: 'Activation Targets',
      fields: [
        { id: 'weekOf', label: 'Week of', type: 'date', half: true },
        { id: 'energyLevel', label: 'Current energy or motivation level', type: 'scale', min: 0, max: 10, minLabel: 'Low', maxLabel: 'High' },
        { id: 'valuesAreas', label: 'Life areas to support this week', type: 'checkboxes', options: ['Rest and sleep', 'Movement', 'Nutrition', 'Relationships', 'Work or school', 'Spiritual life', 'Pleasure', 'Mastery or accomplishment'] },
      ],
    },
    {
      id: 'schedule',
      title: 'Planned Activities',
      fields: [
        { id: 'mondayPlan', label: 'Monday plan', type: 'textarea', minRows: 2 },
        { id: 'midweekPlan', label: 'Midweek plan', type: 'textarea', minRows: 2 },
        { id: 'weekendPlan', label: 'Weekend plan', type: 'textarea', minRows: 2 },
        { id: 'barriers', label: 'Barriers that might interfere', type: 'textarea', minRows: 2 },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      fields: [
        { id: 'supports', label: 'Support or accountability that would help', type: 'textarea', minRows: 2 },
        { id: 'joyMetric', label: 'How nourishing do these plans feel?', type: 'scale', min: 0, max: 10, minLabel: 'Not much', maxLabel: 'Very much' },
        { id: 'faithPractice', label: 'Optional spiritual practice to pair with this week', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

export const CopingSkillsPlan = {
  id: 'coping_skills_plan',
  title: 'Coping Skills Plan',
  description:
    'Builds a personal coping toolkit across immediate regulation, daily maintenance, relational support, and faith-based grounding.',
  icon: '🧰',
  color: 'teal',
  estimatedMinutes: 9,
  sections: [
    {
      id: 'current_needs',
      title: 'Current Needs',
      fields: [
        { id: 'mainStressors', label: 'Current stressors or symptoms I need to cope with', type: 'textarea', required: true, minRows: 3 },
        { id: 'warningSignals', label: 'How I know I am getting overwhelmed', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'toolkit',
      title: 'Coping Toolkit',
      fields: [
        { id: 'quickSkills', label: 'Quick coping skills for the moment', type: 'checkboxes', options: ['Breathing exercises', 'Grounding', 'Prayer', 'Scripture meditation', 'Walk or movement', 'Journaling', 'Music', 'Call a safe person', 'Take a break from screens'] },
        { id: 'dailySupports', label: 'Daily habits that support stability', type: 'textarea', minRows: 3 },
        { id: 'relationalSupports', label: 'People or communities I can lean on', type: 'textarea', minRows: 2 },
      ],
    },
    {
      id: 'practice_commitment',
      title: 'Practice Commitment',
      fields: [
        { id: 'bestFitSkills', label: 'The 3 skills I want to practice most', type: 'textarea', required: true, minRows: 3 },
        { id: 'practiceCue', label: 'When or how I will remember to use them', type: 'textarea', minRows: 2 },
        { id: 'followUpNotes', label: 'What I want to review with my counselor', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

export const GroundingTechniquesWorksheet = {
  id: 'grounding_techniques_worksheet',
  title: 'Grounding Techniques Worksheet',
  description:
    'Organizes sensory, cognitive, movement, and faith-based grounding tools to reduce overwhelm and support present-moment orientation.',
  icon: '🌍',
  color: 'green',
  estimatedMinutes: 8,
  sections: [
    {
      id: 'grounding_menu',
      title: 'Grounding Menu',
      fields: [
        { id: 'topSymptoms', label: 'When I need grounding, I usually feel', type: 'checkboxes', options: ['Panicky', 'Numb or disconnected', 'Flooded by memories', 'Frozen', 'Overstimulated', 'Angry or activated'] },
        { id: 'sensoryTools', label: 'Sensory grounding tools that help', type: 'textarea', minRows: 3 },
        { id: 'movementTools', label: 'Movement or body-based grounding', type: 'textarea', minRows: 3 },
        { id: 'mentalTools', label: 'Mental or verbal grounding cues', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'grounding_plan',
      title: 'Grounding Plan',
      fields: [
        { id: 'portableTools', label: 'Portable grounding items or reminders', type: 'textarea', minRows: 2 },
        { id: 'faithGrounding', label: 'Prayer, scripture, or faith reminders that ground me', type: 'textarea', minRows: 2 },
        { id: 'bestSequence', label: 'My best grounding sequence when I start to spiral', type: 'textarea', required: true, minRows: 3 },
      ],
    },
  ],
};

export const MindfulnessPracticeLog = {
  id: 'mindfulness_practice_log',
  title: 'Mindfulness Practice Log',
  description:
    'Tracks mindfulness practice, what the client noticed, and which rhythms support calm, awareness, and intentional living.',
  icon: '🕊️',
  color: 'blue',
  estimatedMinutes: 7,
  sections: [
    {
      id: 'practice_entry',
      title: 'Practice Entry',
      fields: [
        { id: 'practiceDate', label: 'Practice date', type: 'date', required: true, half: true },
        { id: 'practiceLength', label: 'Approximate practice length (minutes)', type: 'number', min: 0, max: 180, half: true },
        { id: 'practiceType', label: 'Practice type', type: 'select', options: ['Breath awareness', 'Body scan', 'Guided meditation', 'Prayerful reflection', 'Mindful walking', 'Mindful eating', 'Other'] },
        { id: 'environment', label: 'Practice environment', type: 'text' },
      ],
    },
    {
      id: 'observations',
      title: 'Observations',
      fields: [
        { id: 'noticed', label: 'What did I notice in my thoughts, emotions, or body?', type: 'textarea', minRows: 3 },
        { id: 'difficulty', label: 'What felt difficult?', type: 'textarea', minRows: 2 },
        { id: 'helpful', label: 'What felt helpful or grounding?', type: 'textarea', minRows: 2 },
        { id: 'nextIntention', label: 'How I want to practice next time', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

export const BiopsychosocialAssessment = {
  id: 'biopsychosocial_assessment',
  title: 'Biopsychosocial Assessment',
  description:
    'A structured clinical intake covering presenting concerns, history, strengths, supports, and risk considerations across biological, psychological, social, and spiritual domains.',
  icon: '🧠',
  color: 'grape',
  estimatedMinutes: 20,
  sections: [
    {
      id: 'identifying_data',
      title: 'Identifying Data',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'assessmentDate', label: 'Assessment date', type: 'date', required: true, half: true },
        { id: 'referredBy', label: 'Referral source', type: 'text', half: true },
        { id: 'sessionContext', label: 'Service context', type: 'select', half: true, options: ['In-person intake', 'Telehealth intake', 'Transfer of care', 'Assessment-only consultation'] },
      ],
    },
    {
      id: 'presenting_concerns',
      title: 'Presenting Concerns',
      fields: [
        { id: 'presentingProblem', label: 'Primary presenting problem', type: 'textarea', required: true, minRows: 3 },
        { id: 'onset', label: 'When did the current concerns begin?', type: 'select', options: ['Past week', 'Past month', 'Past 6 months', 'Past year', 'More than a year ago', 'Lifelong or recurring'] },
        { id: 'functionalImpact', label: 'How are these concerns affecting daily life, work, relationships, or health?', type: 'textarea', minRows: 3 },
        { id: 'clientGoals', label: 'Client stated goals for treatment', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'history',
      title: 'Psychological and Medical History',
      fields: [
        { id: 'mentalHealthHistory', label: 'Prior mental health treatment or diagnoses', type: 'textarea', minRows: 3 },
        { id: 'medicalHistory', label: 'Relevant medical history, medications, or physical health concerns', type: 'textarea', minRows: 3 },
        { id: 'substanceUseHistory', label: 'Substance use history', type: 'textarea', minRows: 3 },
        { id: 'traumaHistory', label: 'Known trauma, abuse, or significant adverse experiences', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'social_context',
      title: 'Social and Family Context',
      fields: [
        { id: 'familyContext', label: 'Family composition and significant relationships', type: 'textarea', minRows: 3 },
        { id: 'housingEmployment', label: 'Housing, employment, school, or financial context', type: 'textarea', minRows: 3 },
        { id: 'supports', label: 'Current support system', type: 'textarea', minRows: 2 },
        { id: 'strengths', label: 'Client strengths, protective factors, and resilience markers', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'spiritual_risk',
      title: 'Spiritual Context and Risk',
      fields: [
        { id: 'faithBackground', label: 'Faith or spiritual background', type: 'textarea', minRows: 2 },
        { id: 'faithIntegrationPreference', label: 'Interest in faith-integrated counseling', type: 'radio', options: ['Yes', 'No', 'Unsure'] },
        { id: 'riskConcerns', label: 'Current safety or risk concerns', type: 'checkboxes', options: ['No current acute risk reported', 'Suicidal ideation', 'Self-harm history', 'Homicidal ideation', 'Domestic violence concern', 'Substance-related safety concern'] },
        { id: 'clinicalSummary', label: 'Clinical formulation and next-step recommendations', type: 'textarea', minRows: 4 },
      ],
    },
  ],
};

export const MentalStatusExam = {
  id: 'mental_status_exam',
  title: 'Mental Status Exam',
  description:
    'A structured MSE template for documenting appearance, behavior, cognition, mood, thought process, risk, and clinical impressions.',
  icon: '🩺',
  color: 'teal',
  estimatedMinutes: 12,
  sections: [
    {
      id: 'general_observation',
      title: 'General Observation',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'examDate', label: 'Exam date', type: 'date', required: true, half: true },
        { id: 'appearance', label: 'Appearance', type: 'select', options: ['Well-groomed', 'Disheveled', 'Casual', 'Appropriate for weather', 'Other'] },
        { id: 'behavior', label: 'Behavior and psychomotor activity', type: 'textarea', minRows: 2 },
      ],
    },
    {
      id: 'speech_mood',
      title: 'Speech, Mood, and Affect',
      fields: [
        { id: 'speech', label: 'Speech', type: 'checkboxes', options: ['Normal rate and tone', 'Pressured', 'Slow', 'Soft', 'Loud', 'Tangential'] },
        { id: 'mood', label: 'Reported mood', type: 'text' },
        { id: 'affect', label: 'Observed affect', type: 'select', options: ['Full range', 'Restricted', 'Flat', 'Labile', 'Congruent', 'Incongruent'] },
        { id: 'rapport', label: 'Rapport and engagement', type: 'textarea', minRows: 2 },
      ],
    },
    {
      id: 'thought_cognition',
      title: 'Thought Process and Cognition',
      fields: [
        { id: 'thoughtProcess', label: 'Thought process', type: 'checkboxes', options: ['Linear', 'Goal-directed', 'Circumstantial', 'Tangential', 'Loose associations', 'Flight of ideas'] },
        { id: 'thoughtContent', label: 'Thought content', type: 'textarea', minRows: 3, placeholder: 'Delusions, obsessions, preoccupations, ruminations, themes.' },
        { id: 'orientation', label: 'Orientation', type: 'checkboxes', options: ['Person', 'Place', 'Time', 'Situation'] },
        { id: 'cognition', label: 'Attention, concentration, memory, and cognition notes', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'insight_risk',
      title: 'Insight, Judgment, and Risk',
      fields: [
        { id: 'insight', label: 'Insight', type: 'select', options: ['Good', 'Fair', 'Limited', 'Poor'] },
        { id: 'judgment', label: 'Judgment', type: 'select', options: ['Good', 'Fair', 'Limited', 'Poor'] },
        { id: 'riskLevel', label: 'Immediate safety concerns', type: 'select', options: ['None observed', 'Low concern', 'Moderate concern', 'High concern'] },
        { id: 'summary', label: 'MSE summary and clinical impression', type: 'textarea', minRows: 4 },
      ],
    },
  ],
};

export const SafetyPlanTemplate = {
  id: 'safety_plan_template',
  title: 'Safety Plan Template',
  description:
    'A collaborative safety planning tool for identifying warning signs, coping strategies, supports, crisis contacts, and reasons for living.',
  icon: '🛡️',
  color: 'red',
  estimatedMinutes: 15,
  sections: [
    {
      id: 'warning_signs',
      title: 'Warning Signs',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'planDate', label: 'Plan date', type: 'date', required: true, half: true },
        { id: 'warningSigns', label: 'Thoughts, moods, situations, or behaviors that signal a crisis may be developing', type: 'textarea', required: true, minRows: 4 },
        { id: 'internalCues', label: 'What does the crisis feel like in your body or mind?', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'coping',
      title: 'Internal Coping Strategies',
      fields: [
        { id: 'copingStrategies', label: 'Things I can do on my own before reaching out to others', type: 'textarea', required: true, minRows: 4 },
        { id: 'faithAnchors', label: 'Faith anchors, scriptures, prayers, or reminders that help me stay grounded', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'social_support',
      title: 'Social Support and Professional Help',
      fields: [
        { id: 'supportPeople', label: 'People I can contact for support', type: 'textarea', required: true, minRows: 3 },
        { id: 'professionalContacts', label: 'Counselor, physician, crisis line, or emergency services contacts', type: 'textarea', required: true, minRows: 3 },
        { id: 'safePlaces', label: 'Safe places or environments where I can go', type: 'textarea', minRows: 2 },
      ],
    },
    {
      id: 'means_safety',
      title: 'Means Safety and Commitment',
      fields: [
        { id: 'meansRestriction', label: 'Steps to make the environment safer', type: 'textarea', required: true, minRows: 3 },
        { id: 'reasonsForLiving', label: 'Reasons for living and staying safe', type: 'textarea', required: true, minRows: 3 },
        { id: 'planReviewed', label: 'I reviewed this plan and know how to access emergency help if needed.', type: 'radio', required: true, options: ['Yes', 'No'] },
      ],
    },
  ],
};

export const MoodDisorderQuestionnaire = {
  id: 'mood_disorder_questionnaire',
  title: 'Mood Disorder Questionnaire',
  description:
    'A bipolar-spectrum screening tool based on the MDQ structure, covering elevated mood symptoms, clustering, impairment, and treatment history.',
  icon: '📈',
  color: 'yellow',
  estimatedMinutes: 8,
  sections: [
    {
      id: 'mdq_symptoms',
      title: 'Possible Elevated Mood Symptoms',
      fields: [
        { id: 'periodsElevatedMood', label: 'Has there ever been a period when you felt so good, hyper, or irritable that others noticed a clear change?', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'mdqSymptoms', label: 'During that time, which experiences fit?', type: 'checkboxes', options: ['Needed much less sleep', 'Talked much more than usual', 'Thoughts raced', 'Was more social or outgoing', 'Felt unusually confident', 'Spent money more impulsively', 'Took more risks', 'Was more goal-driven or productive', 'Felt more irritable or argumentative', 'Had trouble slowing down'] },
        { id: 'samePeriod', label: 'Did several of these happen during the same period of time?', type: 'radio', options: ['Yes', 'No', 'Unsure'] },
        { id: 'impairment', label: 'How much difficulty did these experiences cause?', type: 'select', options: ['No problem', 'Minor problem', 'Moderate problem', 'Serious problem'] },
      ],
    },
    {
      id: 'history',
      title: 'History and Follow-up',
      fields: [
        { id: 'familyHistory', label: 'Any family history of bipolar disorder, severe mood swings, or hospitalization for mood concerns?', type: 'textarea', minRows: 3 },
        { id: 'priorDiagnosis', label: 'Prior bipolar or mood-related diagnosis', type: 'radio', options: ['Yes', 'No', 'Unsure'] },
        { id: 'currentConcerns', label: 'Current concerns related to mood highs, crashes, impulsivity, or sleep changes', type: 'textarea', minRows: 3 },
      ],
    },
  ],
};

export const EatingDisorderScreening = {
  id: 'eating_disorder_screening',
  title: 'Eating Disorder Screening',
  description:
    'Screens for eating, body-image, and compensatory behaviors using a brief clinically practical structure inspired by common ED screeners.',
  icon: '🍽️',
  color: 'pink',
  estimatedMinutes: 10,
  sections: [
    {
      id: 'core_screen',
      title: 'Core Screening Questions',
      fields: [
        { id: 'fearWeightGain', label: 'Do you worry a great deal about gaining weight or losing control over eating?', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'bingeEpisodes', label: 'Have you had episodes of eating unusually large amounts of food with a sense of loss of control?', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'purgingBehaviors', label: 'Have you used vomiting, laxatives, fasting, or excessive exercise to compensate for eating?', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'bodyImageImpact', label: 'How much do body shape or weight affect how you feel about yourself?', type: 'scale', min: 0, max: 10, minLabel: 'Not at all', maxLabel: 'Very strongly' },
      ],
    },
    {
      id: 'patterns',
      title: 'Patterns and Health Impact',
      fields: [
        { id: 'restrictionPatterns', label: 'Describe any food restriction, rigid rules, or skipped meals', type: 'textarea', minRows: 3 },
        { id: 'exercisePattern', label: 'Describe current exercise habits and whether exercise ever feels compulsive', type: 'textarea', minRows: 3 },
        { id: 'medicalConcerns', label: 'Any dizziness, fainting, menstrual changes, GI issues, or other health concerns related to eating?', type: 'textarea', minRows: 3 },
        { id: 'supportNeeded', label: 'What support would help you feel safer around food, body image, and nourishment?', type: 'textarea', minRows: 3 },
      ],
    },
  ],
};

export const AngerAssessmentScale = {
  id: 'anger_assessment_scale',
  title: 'Anger Assessment Scale',
  description:
    'Assesses anger triggers, patterns of escalation, expression style, relationship impact, and current coping resources.',
  icon: '🔥',
  color: 'orange',
  estimatedMinutes: 10,
  sections: [
    {
      id: 'anger_pattern',
      title: 'Anger Pattern',
      fields: [
        { id: 'angerFrequency', label: 'How often do you feel angry or irritable in a typical week?', type: 'select', options: ['Rarely', '1-2 times', '3-4 times', 'Most days', 'Daily or nearly daily'] },
        { id: 'angerIntensity', label: 'When anger is triggered, how intense does it usually feel?', type: 'scale', min: 0, max: 10, minLabel: 'Mild', maxLabel: 'Extreme' },
        { id: 'commonTriggers', label: 'Common triggers', type: 'textarea', minRows: 3 },
        { id: 'angerBuildUp', label: 'How do you notice anger building in your body or thoughts?', type: 'textarea', minRows: 3 },
      ],
    },
    {
      id: 'expression',
      title: 'Expression and Impact',
      fields: [
        { id: 'expressionStyle', label: 'How is anger usually expressed?', type: 'checkboxes', options: ['Keep it in', 'Withdraw', 'Raise voice', 'Argue', 'Cry', 'Use sarcasm', 'Break things', 'Physical aggression', 'Prayer or reflection', 'Exercise or movement'] },
        { id: 'impactAreas', label: 'Areas most affected by anger', type: 'checkboxes', options: ['Marriage or relationships', 'Parenting', 'Work or school', 'Sleep', 'Faith life', 'Physical health', 'Self-image'] },
        { id: 'repairAttempts', label: 'How do you usually repair after conflict?', type: 'textarea', minRows: 2 },
      ],
    },
    {
      id: 'safety_coping',
      title: 'Safety and Coping',
      fields: [
        { id: 'safetyConcern', label: 'Has anger ever led to fear of hurting yourself, someone else, or damaging property?', type: 'radio', options: ['Yes', 'No'] },
        { id: 'helpfulCoping', label: 'What helps anger decrease or settle?', type: 'textarea', minRows: 3 },
        { id: 'faithReflection', label: 'How does your faith, values, or conscience shape the way you want to handle anger?', type: 'textarea', minRows: 3 },
      ],
    },
  ],
};

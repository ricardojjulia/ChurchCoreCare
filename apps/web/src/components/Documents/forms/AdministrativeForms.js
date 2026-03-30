export const InformedConsentForm = {
  id: 'informed_consent_form',
  title: 'Informed Consent Form',
  description:
    'Documents counseling expectations, confidentiality limits, risks and benefits, and the client acknowledgement needed before care begins.',
  icon: '🧾',
  color: 'blue',
  estimatedMinutes: 10,
  sections: [
    {
      id: 'client_information',
      title: 'Client Information',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'dateSigned', label: 'Date reviewed', type: 'date', required: true, half: true },
        { id: 'therapistName', label: 'Counselor or practice representative', type: 'text', half: true },
        { id: 'serviceType', label: 'Primary service type', type: 'select', half: true, options: ['Individual counseling', 'Couples counseling', 'Family counseling', 'Group counseling', 'Assessment only'] },
      ],
    },
    {
      id: 'care_expectations',
      title: 'Counseling Relationship and Expectations',
      fields: [
        { id: 'servicesReviewed', label: 'I understand the purpose and process of counseling services.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'voluntaryParticipation', label: 'I understand participation is voluntary and I may discuss concerns with my counselor.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'benefitsRisks', label: 'I understand there may be both benefits and risks in treatment, including emotional discomfort while working through difficult issues.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'questionsAsked', label: 'Questions or concerns discussed before signing', type: 'textarea', minRows: 3, placeholder: 'Optional notes about questions reviewed with the client.' },
      ],
    },
    {
      id: 'privacy_limits',
      title: 'Confidentiality and Communication',
      fields: [
        { id: 'confidentialityReviewed', label: 'I understand counseling records are confidential except for legal, safety, or operational exceptions explained by the practice.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'emergencyLimitsReviewed', label: 'I understand confidentiality may be broken when there is risk of harm, abuse reporting requirements, court order, or other lawful exceptions.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'communicationMethods', label: 'Approved communication methods', type: 'checkboxes', options: ['Portal messaging', 'Email', 'Phone', 'SMS reminders'] },
        { id: 'faithPreference', label: 'Would you like faith-integrated care included when clinically appropriate?', type: 'radio', options: ['Yes', 'No', 'Discuss later'] },
      ],
    },
    {
      id: 'acknowledgement',
      title: 'Acknowledgement',
      fields: [
        { id: 'clientAcknowledgement', label: 'I have read or reviewed this informed consent form and agree to begin services.', type: 'radio', required: true, options: ['I agree', 'I do not agree'] },
        { id: 'clientSignatureName', label: 'Client signature name', type: 'text', required: true, half: true },
        { id: 'guardianSignatureName', label: 'Parent/guardian signature name if applicable', type: 'text', half: true },
        { id: 'signatureNotes', label: 'Additional signature or review notes', type: 'textarea', minRows: 2 },
      ],
    },
  ],
};

export const TelehealthConsentForm = {
  id: 'telehealth_consent_form',
  title: 'Telehealth Consent Form',
  description:
    'Reviews the unique risks, benefits, privacy expectations, and emergency planning requirements for virtual counseling sessions.',
  icon: '💻',
  color: 'cyan',
  estimatedMinutes: 8,
  sections: [
    {
      id: 'session_context',
      title: 'Telehealth Session Context',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'reviewDate', label: 'Date reviewed', type: 'date', required: true, half: true },
        { id: 'clientLocation', label: 'Typical session location', type: 'text', placeholder: 'City and state where sessions are usually attended' },
        { id: 'emergencyContact', label: 'Emergency contact name and phone', type: 'textarea', required: true, minRows: 2 },
      ],
    },
    {
      id: 'technology',
      title: 'Technology and Privacy',
      fields: [
        { id: 'privateSpace', label: 'I will make reasonable efforts to join sessions from a private and secure location.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'deviceSafety', label: 'I understand I should use a secure device and avoid public Wi-Fi when possible.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'recordingConsent', label: 'I understand sessions may not be recorded unless both parties agree in advance.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'technologyRisks', label: 'I understand technology problems, privacy interruptions, or connection failures can affect telehealth services.', type: 'radio', required: true, options: ['Yes', 'No'] },
      ],
    },
    {
      id: 'safety',
      title: 'Emergency Planning',
      fields: [
        { id: 'localEmergencyResources', label: 'Local emergency resources reviewed', type: 'textarea', minRows: 2, placeholder: 'Hospital, crisis line, or emergency contacts near the client.' },
        { id: 'crisisPlan', label: 'If a crisis occurs during telehealth, I understand the practice may contact emergency supports or authorities based on safety needs.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'backupPlan', label: 'Preferred backup plan if technology fails', type: 'checkboxes', options: ['Phone call', 'Portal message', 'Reschedule session', 'SMS follow-up'] },
      ],
    },
    {
      id: 'telehealth_ack',
      title: 'Acknowledgement',
      fields: [
        { id: 'consentChoice', label: 'I consent to receive telehealth counseling services.', type: 'radio', required: true, options: ['I consent', 'I do not consent'] },
        { id: 'signatureName', label: 'Client signature name', type: 'text', required: true, half: true },
        { id: 'guardianSignatureName', label: 'Parent/guardian signature name if applicable', type: 'text', half: true },
      ],
    },
  ],
};

export const ReleaseOfInformationAuthorization = {
  id: 'release_of_information_authorization',
  title: 'Release of Information Authorization',
  description:
    'Captures permission to disclose or receive information, including the purpose, parties involved, and scope of the authorization.',
  icon: '📤',
  color: 'indigo',
  estimatedMinutes: 9,
  sections: [
    {
      id: 'client_authorization',
      title: 'Client and Request Details',
      fields: [
        { id: 'clientName', label: 'Client full name', type: 'text', required: true, half: true },
        { id: 'dob', label: 'Date of birth', type: 'date', required: true, half: true },
        { id: 'requestedBy', label: 'Who is requesting this authorization?', type: 'select', options: ['Client', 'Parent/guardian', 'Practice staff', 'Outside provider'], required: true, half: true },
        { id: 'authorizationDate', label: 'Authorization date', type: 'date', required: true, half: true },
      ],
    },
    {
      id: 'parties',
      title: 'Release Parties',
      fields: [
        { id: 'releaseFrom', label: 'Information may be released from', type: 'textarea', required: true, minRows: 2, placeholder: 'Practice name, counselor, or outside provider.' },
        { id: 'releaseTo', label: 'Information may be released to', type: 'textarea', required: true, minRows: 2, placeholder: 'Name, organization, phone, fax, or secure email.' },
        { id: 'purpose', label: 'Purpose of the release', type: 'select', required: true, options: ['Care coordination', 'Insurance or billing', 'School accommodation', 'Legal request', 'Client request', 'Other'] },
        { id: 'purposeOther', label: 'If other, describe the purpose', type: 'text', showIf: { field: 'purpose', value: 'Other' } },
      ],
    },
    {
      id: 'scope',
      title: 'Information Covered',
      fields: [
        { id: 'informationTypes', label: 'Information authorized for release', type: 'checkboxes', required: true, options: ['Demographic information', 'Attendance or scheduling history', 'Treatment summary', 'Diagnosis', 'Progress notes', 'Billing records', 'Testing or assessment results', 'Faith-integrated care preferences'] },
        { id: 'sensitiveExclusions', label: 'Any limits or exclusions on what may be shared', type: 'textarea', minRows: 3, placeholder: 'Optional restrictions or excluded date ranges.' },
        { id: 'expirationRule', label: 'This authorization expires', type: 'select', required: true, options: ['On a specific date', 'At discharge', 'After one-time use', 'When revoked in writing'] },
        { id: 'expirationDate', label: 'Expiration date', type: 'date', showIf: { field: 'expirationRule', value: 'On a specific date' } },
      ],
    },
    {
      id: 'roi_acknowledgement',
      title: 'Acknowledgement',
      fields: [
        { id: 'revocationReviewed', label: 'I understand I may revoke this authorization in writing unless action has already been taken in reliance on it.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'redisclosureReviewed', label: 'I understand information released to outside parties may no longer be protected by HIPAA in some circumstances.', type: 'radio', required: true, options: ['Yes', 'No'] },
        { id: 'signatureName', label: 'Signature name', type: 'text', required: true, half: true },
        { id: 'relationshipToClient', label: 'Relationship to client if not self', type: 'text', half: true },
      ],
    },
  ],
};

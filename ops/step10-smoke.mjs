const base = 'http://localhost:3104';

const adminHeaders = {
  'x-staff-role': 'practice_admin',
  'x-tenant-id': 'system',
  'x-actor-id': 'step10-admin',
  'x-request-id': `step10-${Date.now()}`,
  'content-type': 'application/json',
};

const clientHeaders = {
  'x-staff-role': 'client',
  'x-tenant-id': 'system',
  'x-actor-id': 'step10-client',
  'x-client-id': 'c-001',
  'x-request-id': `step10c-${Date.now()}`,
  'content-type': 'application/json',
};

async function req(url, { method = 'GET', headers = adminHeaders, body } = {}) {
  const response = await fetch(base + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

async function main() {
  let result = await req('/v1/faith/overview?practiceId=p-001');
  console.log('overview-admin', result.status, result.payload.summary?.noteTemplates, result.payload.summary?.resources);

  result = await req('/v1/faith/note-templates', {
    method: 'POST',
    body: {
      name: 'Discipleship Reflection Note',
      focusArea: 'identity',
      integrationLevel: 'balanced',
      sections: ['Clinical summary', 'Spiritual themes', 'Practice plan'],
    },
  });
  console.log('note-template', result.status, result.payload.item?.id || result.payload.error);

  result = await req('/v1/faith/treatment-goals', {
    method: 'POST',
    body: {
      title: 'Rebuild trust and hope',
      integrationLevel: 'explicit',
      scriptures: ['Isaiah 41:10'],
      milestones: ['Two scripture reflections weekly'],
    },
  });
  console.log('goal-template', result.status, result.payload.item?.id || result.payload.error);

  result = await req('/v1/faith/consent-variants', {
    method: 'POST',
    body: {
      title: 'Prayer Participation Consent',
      body: 'Prayer can be incorporated when explicitly requested by the client.',
      audience: 'client',
      integrationLevel: 'light',
    },
  });
  console.log('consent-variant', result.status, result.payload.item?.id || result.payload.error);

  result = await req('/v1/faith/resources', {
    method: 'POST',
    body: {
      title: 'Hope and Resilience Devotional',
      resourceType: 'devotional',
      scriptureReference: 'Romans 5:3-5',
      content: 'Read and journal one sentence of hope each morning.',
    },
  });
  console.log('resource', result.status, result.payload.item?.id || result.payload.error);

  result = await req('/v1/faith/inventories', {
    method: 'POST',
    body: {
      name: 'Weekly Formation Pulse',
      cadence: 'weekly',
      prompts: ['Prayer rhythm', 'Community support'],
    },
  });
  console.log('inventory', result.status, result.payload.item?.id || result.payload.error);

  result = await req('/v1/faith/referral-coordination', {
    method: 'POST',
    body: {
      clientId: 'c-001',
      churchName: 'City Hope Church',
      status: 'active',
      contactName: 'Pastor Rivera',
      contactMethod: 'pastor.rivera@example.test',
      consentToCoordinate: true,
      notes: 'Biweekly check-in with signed consent on file.',
    },
  });
  console.log('coordination', result.status, result.payload.item?.id || result.payload.error);

  result = await req('/v1/faith/language-preferences', {
    method: 'POST',
    body: {
      practiceId: 'p-001',
      integrationLevel: 'balanced',
      preferredTerminology: 'Pastoral, compassionate, clinically precise',
      explicitFaithLanguage: true,
      includePrayerLanguage: true,
      includeScriptureReferences: true,
    },
  });
  console.log('language-pref', result.status, result.payload.item?.id || result.payload.error);

  result = await req('/v1/faith/overview?practiceId=p-001');
  console.log('overview-after', result.status, result.payload.summary?.noteTemplates, result.payload.summary?.referralCoordinations);

  result = await req('/v1/faith/overview?practiceId=p-001', { headers: clientHeaders });
  console.log('client-guard', result.status, result.payload.error || 'ok');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

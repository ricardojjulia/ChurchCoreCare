const base = 'http://localhost:3104';

const adminHeaders = {
  'x-staff-role': 'practice_admin',
  'x-tenant-id': 'system',
  'x-actor-id': 'step9-admin',
  'x-request-id': `step9-${Date.now()}`,
  'content-type': 'application/json',
};

const clientHeaders = {
  'x-staff-role': 'client',
  'x-tenant-id': 'system',
  'x-actor-id': 'step9-client',
  'x-client-id': 'c-001',
  'x-request-id': `step9c-${Date.now()}`,
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
  let result = await req('/v1/portal/overview?clientId=c-001');
  const docId = result.payload.documents?.[0]?.id;
  const threadId = result.payload.messageThreads?.[0]?.id;
  console.log('overview-admin', result.status, Boolean(result.payload.client?.id), Boolean(docId));

  result = await req('/v1/portal/messages?clientId=c-001', {
    method: 'POST',
    headers: clientHeaders,
    body: {
      threadId,
      body: 'Client follow-up via secure portal',
    },
  });
  console.log('message-client', result.status, result.payload.message?.id || result.payload.error);

  result = await req('/v1/portal/appointment-requests?clientId=c-001', {
    method: 'POST',
    headers: clientHeaders,
    body: {
      preferredStartAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      preferredEndAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      mode: 'remote',
      notes: 'Evenings preferred',
      status: 'requested',
    },
  });
  console.log('request-client', result.status, result.payload.item?.id || result.payload.error);

  if (docId) {
    result = await req('/v1/portal/documents?clientId=c-001', {
      method: 'PATCH',
      headers: clientHeaders,
      body: {
        assignmentId: docId,
        status: 'signed',
      },
    });
    console.log('document-client', result.status, result.payload.item?.status || result.payload.error);
  }

  result = await req('/v1/portal/resources?clientId=c-001', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      title: 'Session Reflection',
      resourceType: 'education',
      content: 'Read Psalm 23 and journal one paragraph.',
    },
  });
  console.log('resource-admin', result.status, result.payload.item?.id || result.payload.error);

  result = await req('/v1/portal/overview?clientId=c-002', {
    headers: clientHeaders,
  });
  console.log('scope-guard', result.status, result.payload.error || 'ok');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

const base = process.env.API_BASE_URL || 'http://localhost:3001';

const headersByRole = {
  practiceAdmin: {
    'x-staff-role': 'practice_admin',
    'x-tenant-id': 'system',
    'x-actor-id': 'security-practice-admin',
    'content-type': 'application/json',
  },
  platformAdmin: {
    'x-staff-role': 'platform_admin',
    'x-tenant-id': 'system',
    'x-actor-id': 'security-platform-admin',
    'content-type': 'application/json',
  },
  schedulerBiller: {
    'x-staff-role': 'scheduler_biller',
    'x-tenant-id': 'system',
    'x-actor-id': 'security-scheduler',
    'content-type': 'application/json',
  },
  client: {
    'x-staff-role': 'client',
    'x-tenant-id': 'system',
    'x-client-id': 'c-001',
    'x-actor-id': 'security-client',
    'content-type': 'application/json',
  },
  otherTenant: {
    'x-staff-role': 'practice_admin',
    'x-tenant-id': 'tenant-other',
    'x-actor-id': 'security-other-tenant',
    'content-type': 'application/json',
  },
};

function requestId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function req(path, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...headers,
      'x-request-id': headers['x-request-id'] || requestId('security'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

async function main() {
  let result = await req('/v1/clients');
  assert(result.status === 401, 'Unauthenticated clients collection should return 401');
  console.log('unauthenticated-clients', result.status, result.payload.error);

  result = await req('/v1/clients', { headers: headersByRole.client });
  assert(result.status === 403, 'Client role must not read client management endpoints');
  console.log('client-clients-guard', result.status, result.payload.error);

  result = await req('/v1/billing/invoices', { headers: headersByRole.client });
  assert(result.status === 403, 'Client role must not read billing endpoints');
  console.log('client-billing-guard', result.status, result.payload.error);

  result = await req('/v1/document-templates', { headers: headersByRole.client });
  assert(result.status === 403, 'Client role must not read document template endpoints');
  console.log('client-documents-guard', result.status, result.payload.error);

  result = await req('/v1/portal/overview?clientId=c-001', { headers: headersByRole.client });
  assert(result.status === 200, 'Client must access own portal overview');
  console.log('client-own-portal', result.status, result.payload.client?.id);

  result = await req('/v1/portal/overview?clientId=c-002', { headers: headersByRole.client });
  assert(result.status === 403, 'Client must not access another client portal overview');
  console.log('client-cross-portal-guard', result.status, result.payload.error);

  result = await req('/v1/portal/resources?clientId=c-001', {
    method: 'POST',
    headers: headersByRole.client,
    body: {
      title: 'Unauthorized portal resource',
      content: 'Should be blocked',
      resourceType: 'education',
    },
  });
  assert(result.status === 403, 'Client must not publish portal resources');
  console.log('client-portal-resource-guard', result.status, result.payload.error);

  result = await req('/v1/clients/c-001/lifecycle', { headers: headersByRole.otherTenant });
  assert(result.status === 403, 'Other tenant must not access lifecycle data');
  console.log('tenant-lifecycle-guard', result.status, result.payload.error);

  result = await req('/v1/portal/overview?clientId=c-001', { headers: headersByRole.otherTenant });
  assert(result.status === 403, 'Other tenant must not access portal overview');
  console.log('tenant-portal-guard', result.status, result.payload.error);

  result = await req('/v1/clients/c-001/lifecycle', { headers: headersByRole.platformAdmin });
  assert(result.status === 200, 'Platform admin must be able to cross-tenant support lifecycle reads');
  console.log('platform-cross-tenant-read', result.status, result.payload.item?.clientId);

  result = await req('/v1/platform/tenant-provisioning', {
    method: 'POST',
    headers: headersByRole.practiceAdmin,
    body: {
      requestedTenantId: 'blocked-rbac',
      requestedPracticeName: 'Blocked Practice',
      ownerEmail: 'blocked@example.com',
      status: 'queued',
    },
  });
  assert(result.status === 403, 'Practice admin must not create tenant provisioning requests');
  console.log('practice-admin-platform-guard', result.status, result.payload.error);

  result = await req('/v1/platform/impersonation-sessions', {
    method: 'POST',
    headers: headersByRole.practiceAdmin,
    body: {
      targetTenantId: 'system',
      targetRole: 'practice_admin',
      reason: 'Regression validation should block this',
    },
  });
  assert(result.status === 403, 'Practice admin must not start impersonation sessions');
  console.log('practice-admin-impersonation-guard', result.status, result.payload.error);

  result = await req('/v1/clients', {
    method: 'POST',
    headers: headersByRole.schedulerBiller,
    body: {
      firstName: 'Blocked',
      lastName: 'SchedulerWrite',
      status: 'active',
    },
  });
  assert(result.status === 403, 'Scheduler/biller must not create client records');
  console.log('scheduler-write-guard', result.status, result.payload.error);

  console.log('security-regression', 'passed');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
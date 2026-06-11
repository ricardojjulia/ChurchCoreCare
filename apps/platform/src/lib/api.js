const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { status: res.status });
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email, password) =>
    request('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () =>
    request('/v1/auth/logout', { method: 'POST' }),

  me: () =>
    request('/v1/auth/me'),

  platformOverview: () =>
    request('/v1/platform/overview'),

  listProvisioningRequests: () =>
    request('/v1/platform/tenant-provisioning'),

  updateProvisioningRequest: (id, status) =>
    request('/v1/platform/tenant-provisioning', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    }),

  listImpersonationSessions: () =>
    request('/v1/platform/impersonation-sessions'),

  startImpersonationSession: (targetTenantId, targetRole, reason) =>
    request('/v1/platform/impersonation-sessions', {
      method: 'POST',
      body: JSON.stringify({ targetTenantId, targetRole, reason }),
    }),

  endImpersonationSession: (id) =>
    request(`/v1/platform/impersonation-sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ended' }),
    }),

  listDataExports: () =>
    request('/v1/platform/data-exports'),

  requestDataExport: (exportType, format) =>
    request('/v1/platform/data-exports', {
      method: 'POST',
      body: JSON.stringify({ exportType, format, status: 'queued' }),
    }),

  getRetentionPolicy: () =>
    request('/v1/platform/retention-policies'),

  upsertRetentionPolicy: (policy) =>
    request('/v1/platform/retention-policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    }),

  listDemoFeedback: (filters = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return request(`/v1/platform/demo-feedback${query ? `?${query}` : ''}`);
  },

  updateDemoFeedback: (id, patch) =>
    request(`/v1/platform/demo-feedback/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
};

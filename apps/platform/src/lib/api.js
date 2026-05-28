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
};

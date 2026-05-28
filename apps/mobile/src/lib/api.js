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

  // Schedule
  getAppointments: ({ date, counselorId } = {}) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (counselorId) params.set('counselorId', counselorId);
    const qs = params.toString();
    return request(`/v1/appointments${qs ? `?${qs}` : ''}`);
  },

  // Clients
  searchClients: (query) => {
    const params = new URLSearchParams({ q: query });
    return request(`/v1/clients?${params}`);
  },

  getClient: (clientId) =>
    request(`/v1/clients/${clientId}`),

  // Progress notes
  createProgressNote: (clientId, payload) =>
    request(`/v1/clients/${clientId}/progress-notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Push notifications
  subscribePush: (subscription) =>
    request('/v1/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    }),

  unsubscribePush: (endpoint) =>
    request('/v1/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    }),
};

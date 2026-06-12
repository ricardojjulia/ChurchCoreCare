const STORAGE_KEY = 'churchcore.demoFeedback.session';

export function canonicalDemoRoute(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  const route = raw.split(/[?#]/, 1)[0].trim().toLowerCase();
  return (route || '/').slice(0, 500);
}

function safeRead(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
    if (
      parsed
      && typeof parsed.sessionId === 'string'
      && Number.isFinite(parsed.startedAt)
      && Array.isArray(parsed.breadcrumbs)
    ) {
      return parsed;
    }
  } catch {}
  return null;
}

function safeWrite(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function createDemoSessionController({
  enabled,
  storage = globalThis.sessionStorage,
  uuid = () => globalThis.crypto.randomUUID(),
  now = () => Date.now(),
} = {}) {
  if (!enabled) {
    return {
      enabled: false,
      recordRoute() {},
      snapshot() {
        return {
          enabled: false,
          sessionId: null,
          breadcrumbs: [],
          sessionDurationSeconds: 0,
        };
      },
    };
  }

  const existing = storage ? safeRead(storage) : null;
  const state = existing ?? {
    sessionId: uuid(),
    startedAt: now(),
    breadcrumbs: [],
  };
  if (!existing && storage) safeWrite(storage, state);

  return {
    enabled: true,
    recordRoute(value) {
      const route = canonicalDemoRoute(value);
      if (state.breadcrumbs.at(-1) === route) return;
      state.breadcrumbs = [...state.breadcrumbs, route].slice(-5);
      if (storage) safeWrite(storage, state);
    },
    snapshot() {
      return {
        enabled: true,
        sessionId: state.sessionId,
        breadcrumbs: [...state.breadcrumbs],
        sessionDurationSeconds: Math.max(0, Math.floor((now() - state.startedAt) / 1000)),
      };
    },
  };
}

export function buildDemoFeedbackPayload({
  session,
  route,
  category,
  errorMessage = null,
  note = null,
  demoVersion = '',
}) {
  return {
    sessionId: session.sessionId,
    route: canonicalDemoRoute(route),
    category,
    errorMessage: typeof errorMessage === 'string' ? errorMessage.slice(0, 4_000) : null,
    note: typeof note === 'string' ? note.slice(0, 2_000) : null,
    breadcrumbs: Array.isArray(session.breadcrumbs) ? session.breadcrumbs.slice(-5) : [],
    demoVersion: String(demoVersion || '').slice(0, 100),
    sessionDurationSeconds: Math.max(0, Math.min(2_592_000, Math.floor(session.sessionDurationSeconds || 0))),
  };
}

export async function submitDemoFeedback(payload, {
  fetchImpl = globalThis.fetch,
  swallowErrors = false,
  csrfToken = '',
} = {}) {
  try {
    const response = await fetchImpl('/api/v1/demo-feedback', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Unable to submit demo feedback');
    }
    return response.json();
  } catch (error) {
    if (swallowErrors) return null;
    throw error;
  }
}

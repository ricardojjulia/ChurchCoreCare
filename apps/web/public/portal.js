const SURFACE_ID = 'portal';
const SURFACE_KIND = 'view';
const REQUEST_INTENTS = {
  care_request: {
    heading: 'I am looking for care',
    intro: 'Share your needs and the practice will guide intake, fit, and next steps.',
  },
  scheduling_request: {
    heading: 'I want help getting scheduled',
    intro: 'Share your availability and preferences so the practice can follow up with scheduling options.',
  },
  account_signup: {
    heading: 'I want to create a portal account',
    intro: 'Start an account request so the practice can review access and assign onboarding materials.',
  },
};
const DEFAULT_CONFIG = {
  practiceName: 'FaithCounseling',
  logoUrl: '',
  brandColor: '#1f7a8c',
  accentColor: '#f0f7f8',
  welcomeHeadline: 'FaithCounseling Client Portal',
  welcomeMessage: 'Current clients can sign in to their account. New or possible clients can request care, request scheduling, or start an account request for intake onboarding.',
  helpMessage: 'If your account is locked or not yet invited, contact your counselor.',
  supportEmail: '',
  registrationMode: 'review_required',
  allowCreateAccount: true,
  allowCareRequests: true,
  allowSchedulingRequests: true,
};

let portalConfig = { ...DEFAULT_CONFIG };
let currentIntent = 'care_request';
const loadStartedAt = performance.now();

function getCookie(name) {
  const pairs = document.cookie.split(';').map((part) => part.trim());
  for (const pair of pairs) {
    if (!pair.startsWith(`${name}=`)) continue;
    return decodeURIComponent(pair.slice(name.length + 1));
  }
  return '';
}

function setStatus(message, type = '') {
  const el = document.getElementById('portalRequestStatus');
  if (!el) return;
  el.textContent = message;
  el.className = `portal-status ${type}`.trim();
}

async function postJson(path, body, { includeCsrf = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeCsrf) {
    headers['x-csrf-token'] = getCookie('csrf_token');
  }
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers,
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function sanitizeTelemetryValue(value, fallback = 'unknown') {
  if (typeof value !== 'string') return fallback;
  const candidate = value.trim().toLowerCase().slice(0, 80);
  return candidate || fallback;
}

function trackEvent(type, action, result = 'success', extra = {}) {
  postJson('/api/v1/telemetry/events', {
    events: [{
      type: sanitizeTelemetryValue(type),
      surfaceId: SURFACE_ID,
      surfaceKind: SURFACE_KIND,
      workflow: sanitizeTelemetryValue(extra.workflow || 'portal_public'),
      action: sanitizeTelemetryValue(action),
      result: sanitizeTelemetryValue(result),
      role: 'anonymous',
      statusClass: sanitizeTelemetryValue(extra.statusClass || 'success'),
      emptyState: sanitizeTelemetryValue(extra.emptyState || 'none', 'none'),
      validationState: sanitizeTelemetryValue(extra.validationState || 'none', 'none'),
      durationMs: Number.isFinite(extra.durationMs) ? Math.max(0, extra.durationMs) : 0,
      at: new Date().toISOString(),
    }],
  }).catch(() => {});
}

function trackSurfaceView() {
  trackEvent('screen_view', 'view');
}

function trackSurfaceLoad(result = 'success', extra = {}) {
  trackEvent('screen_load', 'load', result, {
    durationMs: Math.round((performance.now() - loadStartedAt) * 100) / 100,
    ...extra,
  });
}

function trackUiError(action) {
  trackEvent('ui_error', action, 'error', { statusClass: 'client' });
}

function collectServices(formEl) {
  return [...formEl.querySelectorAll('.portal-services input[type="checkbox"]')]
    .filter((el) => el.checked)
    .map((el) => el.value);
}

function updateContactPreferenceOptions(options = []) {
  const select = document.getElementById('preferredContactMethod');
  if (!select) return;
  const allowed = new Set(options);
  [...select.options].forEach((option) => {
    if (!option.value) return;
    option.hidden = !allowed.has(option.value);
  });
  if (select.value && !allowed.has(select.value)) {
    select.value = '';
  }
}

function selectIntent(intent) {
  if (!REQUEST_INTENTS[intent]) return;
  currentIntent = intent;
  const input = document.getElementById('requestIntent');
  if (input) input.value = intent;
  const meta = REQUEST_INTENTS[intent];
  const heading = document.getElementById('portalRequestHeading');
  const intro = document.getElementById('portalRequestIntro');
  if (heading) heading.textContent = meta.heading;
  if (intro) intro.textContent = meta.intro;
  document.querySelectorAll('.portal-intent-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.intent === intent);
  });
}

function getAllowedIntents(config) {
  const intents = [];
  if (config.allowCareRequests !== false) intents.push('care_request');
  if (config.allowSchedulingRequests !== false) intents.push('scheduling_request');
  if (config.allowCreateAccount !== false) intents.push('account_signup');
  return intents;
}

function applyTheme(config) {
  document.documentElement.style.setProperty('--portal-brand', config.brandColor || DEFAULT_CONFIG.brandColor);
  document.documentElement.style.setProperty('--portal-accent', config.accentColor || DEFAULT_CONFIG.accentColor);
}

function applyPortalConfig(config) {
  portalConfig = { ...DEFAULT_CONFIG, ...(config || {}) };
  applyTheme(portalConfig);

  const logo = document.getElementById('portalLogo');
  const headline = document.getElementById('portalHeadline');
  const welcome = document.getElementById('portalWelcome');
  const help = document.getElementById('portalHelpMessage');
  const existingCopy = document.getElementById('portalExistingCopy');

  if (logo) {
    if (portalConfig.logoUrl) {
      logo.src = portalConfig.logoUrl;
      logo.style.display = 'block';
    } else {
      logo.removeAttribute('src');
      logo.style.display = 'none';
    }
  }
  if (headline) headline.textContent = portalConfig.welcomeHeadline || DEFAULT_CONFIG.welcomeHeadline;
  if (welcome) welcome.textContent = portalConfig.welcomeMessage || DEFAULT_CONFIG.welcomeMessage;
  if (help) {
    const support = portalConfig.supportEmail ? ` Contact: ${portalConfig.supportEmail}.` : '';
    help.textContent = `${portalConfig.helpMessage || DEFAULT_CONFIG.helpMessage}${support}`;
  }
  if (existingCopy) {
    existingCopy.textContent = `Use your ${portalConfig.practiceName || DEFAULT_CONFIG.practiceName} portal credentials to access appointments, forms, and secure messages.`;
  }

  const allowedIntents = getAllowedIntents(portalConfig);
  document.querySelectorAll('.portal-intent-btn').forEach((button) => {
    const visible = allowedIntents.includes(button.dataset.intent);
    button.hidden = !visible;
  });
  updateContactPreferenceOptions(portalConfig.contactPreferenceOptions || []);

  const nextIntent = allowedIntents.includes(currentIntent)
    ? currentIntent
    : (allowedIntents[0] || 'care_request');
  selectIntent(nextIntent);
}

async function loadPortalConfig() {
  try {
    const response = await fetch('/api/v1/portal/public-config', {
      method: 'GET',
      credentials: 'include',
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error || 'Unable to load portal settings');
    }
    applyPortalConfig(body?.item || DEFAULT_CONFIG);
    trackSurfaceLoad('success');
  } catch {
    applyPortalConfig(DEFAULT_CONFIG);
    trackSurfaceLoad('failure', { statusClass: 'client_error' });
  }
}

function installIntentHandlers() {
  document.querySelectorAll('.portal-intent-btn').forEach((button) => {
    button.addEventListener('click', () => {
      selectIntent(button.dataset.intent);
      trackEvent('interaction', `intent.${button.dataset.intent}`, 'success');
    });
  });
}

async function submitRequest(payload) {
  return postJson('/api/v1/portal/public-requests', payload, { includeCsrf: true });
}

function installFormHandler() {
  const form = document.getElementById('portalRequestForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const startedAt = performance.now();
    const firstName = String(document.getElementById('firstName')?.value || '').trim();
    const lastName = String(document.getElementById('lastName')?.value || '').trim();
    const email = String(document.getElementById('email')?.value || '').trim();
    const phone = String(document.getElementById('phone')?.value || '').trim();
    const preferredContactMethod = String(document.getElementById('preferredContactMethod')?.value || '').trim();
    const preferredContactWindow = String(document.getElementById('preferredContactWindow')?.value || '').trim();
    const notes = String(document.getElementById('notes')?.value || '').trim();
    const requestIntent = String(document.getElementById('requestIntent')?.value || currentIntent).trim() || currentIntent;
    const requestedServices = [...new Set([requestIntent, ...collectServices(form)])];

    if (!firstName || !lastName || !email) {
      setStatus('First name, last name, and email are required.', 'error');
      trackEvent('validation_error', 'portal_request.required', 'failure', { validationState: 'required' });
      return;
    }

    setStatus('Submitting request...');

    try {
      await submitRequest({
        firstName,
        lastName,
        email,
        phone,
        requestType: requestIntent,
        preferredContactMethod,
        preferredContactWindow,
        requestedServices,
        notes,
      });
      form.reset();
      selectIntent(requestIntent);
      setStatus('Request submitted successfully. Our team will contact you soon.', 'success');
      trackEvent('interaction', 'portal_request.submit', 'success', {
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      });
      trackEvent('action', `intent.${requestIntent}.submit`, 'success');
    } catch (error) {
      setStatus(error?.message || 'Unable to submit request at this time.', 'error');
      trackEvent('interaction', 'portal_request.submit', 'failure', {
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        statusClass: error?.status >= 500 ? 'server_error' : 'client_error',
      });
      trackEvent('action', `intent.${requestIntent}.submit`, 'failure', {
        statusClass: error?.status >= 500 ? 'server_error' : 'client_error',
      });
    }
  });
}

window.addEventListener('error', () => trackUiError('window.error'));
window.addEventListener('unhandledrejection', () => trackUiError('window.unhandledrejection'));
window.addEventListener('pagehide', () => {
  trackEvent('screen_active', 'active', 'success', {
    durationMs: Math.round(performance.now() * 100) / 100,
  });
});

trackSurfaceView();
installIntentHandlers();
installFormHandler();
loadPortalConfig();

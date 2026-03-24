const elements = {
  refreshButton: document.getElementById('refreshButton'),
  overallStatus: document.getElementById('overallStatus'),
  webHealth: document.getElementById('webHealth'),
  apiHealth: document.getElementById('apiHealth'),
  webUpdated: document.getElementById('webUpdated'),
  apiUpdated: document.getElementById('apiUpdated'),
  webRequests: document.getElementById('webRequests'),
  webErrors: document.getElementById('webErrors'),
  webDuration: document.getElementById('webDuration'),
  webRoute: document.getElementById('webRoute'),
  apiRequests: document.getElementById('apiRequests'),
  apiErrors: document.getElementById('apiErrors'),
  apiDuration: document.getElementById('apiDuration'),
  apiOtel: document.getElementById('apiOtel'),
  apiClientErrors: document.getElementById('apiClientErrors'),
  apiServerErrors: document.getElementById('apiServerErrors'),
  apiErrorCodes: document.getElementById('apiErrorCodes'),
  vitalsStatus: document.getElementById('vitalsStatus'),
};

const FALLBACK = '--';

function formatValue(value) {
  if (value === null || value === undefined || value === '') return FALLBACK;
  return String(value);
}

function formatRoute(value) {
  if (value === null || value === undefined || value === '') return 'No traffic yet';
  return String(value);
}

function toLocalDateTime(value) {
  if (!value) return FALLBACK;
  const dt = new Date(value);
  if (Number.isNaN(dt.valueOf())) return FALLBACK;
  return dt.toLocaleString();
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function recordVitals() {
  const memoryMb = Math.round((performance?.memory?.usedJSHeapSize || 0) / (1024 * 1024));
  const payload = {
    name: 'monitor.heartbeat.memory_mb',
    value: Number.isFinite(memoryMb) ? memoryMb : 0,
    rating: 'good',
    page: 'monitor',
    timestamp: new Date().toISOString(),
    navigationType: performance.getEntriesByType('navigation')[0]?.type || 'navigate',
  };

  await fetch('/api/v1/telemetry/vitals', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-staff-role': 'practice_admin',
      'x-tenant-id': 'system',
      'x-actor-id': 'monitor-page',
      'x-request-id': `monitor-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });

  elements.vitalsStatus.textContent = `Vitals recorded at ${new Date().toLocaleTimeString()}.`;
}

function readSummaryValue(summary, keys) {
  if (!summary || typeof summary !== 'object') return FALLBACK;
  for (const key of keys) {
    if (summary[key] !== undefined && summary[key] !== null) {
      return summary[key];
    }
  }
  return FALLBACK;
}

function applyHealthyState(isHealthy) {
  elements.overallStatus.dataset.state = isHealthy ? 'ok' : 'error';
  elements.overallStatus.textContent = isHealthy ? 'Healthy' : 'Degraded';
}

function sumStatusRange(statusCounts, min, max) {
  if (!statusCounts || typeof statusCounts !== 'object') return 0;
  let total = 0;
  for (const [statusCode, count] of Object.entries(statusCounts)) {
    const code = Number(statusCode);
    if (!Number.isFinite(code) || code < min || code > max) continue;
    total += Number(count) || 0;
  }
  return total;
}

function formatStatusCounts(statusCounts) {
  if (!statusCounts || typeof statusCounts !== 'object') return FALLBACK;
  const entries = Object.entries(statusCounts)
    .filter(([, count]) => Number(count) > 0)
    .sort(([leftCode], [rightCode]) => Number(leftCode) - Number(rightCode));

  if (!entries.length) return FALLBACK;
  return entries.map(([code, count]) => `${code}: ${count}`).join(' · ');
}

async function refreshMonitoring() {
  try {
    elements.overallStatus.textContent = 'Refreshing…';

    const [webSummary, apiHealth, apiSummary] = await Promise.all([
      fetchJson('/telemetry/summary'),
      fetchJson('/api/health'),
      fetchJson('/api/v1/telemetry/summary'),
    ]);

    const webService = formatValue(webSummary.service);
    const apiService = formatValue(apiHealth.service || apiSummary.service);

    elements.webHealth.textContent = webService;
    elements.apiHealth.textContent = apiService;
    elements.webUpdated.textContent = toLocalDateTime(new Date().toISOString());
    elements.apiUpdated.textContent = toLocalDateTime(apiHealth.timestamp);

    const webTelemetry = webSummary.summary || {};
    elements.webRequests.textContent = formatValue(readSummaryValue(webTelemetry, ['requests', 'requestCount', 'totalRequests']));
    elements.webErrors.textContent = formatValue(readSummaryValue(webTelemetry, ['errors', 'errorCount', 'totalErrors']));
    elements.webDuration.textContent = formatValue(readSummaryValue(webTelemetry, ['avgDurationMs', 'averageDurationMs', 'avgMs']));
    elements.webRoute.textContent = formatRoute(readSummaryValue(webTelemetry, ['lastRoute', 'route']));

    const apiTelemetry = apiSummary.summary || {};
    elements.apiRequests.textContent = formatValue(readSummaryValue(apiTelemetry, ['requests', 'requestCount', 'totalRequests']));
    elements.apiErrors.textContent = formatValue(readSummaryValue(apiTelemetry, ['errors', 'errorCount', 'totalErrors']));
    elements.apiDuration.textContent = formatValue(readSummaryValue(apiTelemetry, ['avgDurationMs', 'averageDurationMs', 'avgMs']));
    elements.apiOtel.textContent = apiSummary.exportedViaOtel ? 'Yes' : 'No';
    elements.apiClientErrors.textContent = formatValue(sumStatusRange(apiTelemetry.errorStatusCounts, 400, 499));
    elements.apiServerErrors.textContent = formatValue(sumStatusRange(apiTelemetry.errorStatusCounts, 500, 599));
    elements.apiErrorCodes.textContent = formatStatusCounts(apiTelemetry.errorStatusCounts);

    applyHealthyState(true);
    await recordVitals();
  } catch (error) {
    applyHealthyState(false);
    elements.vitalsStatus.textContent = `Monitoring refresh failed: ${error.message}`;
  }
}

elements.refreshButton?.addEventListener('click', () => {
  void refreshMonitoring();
});

void refreshMonitoring();

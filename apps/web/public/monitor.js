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
  vitalsStatus: document.getElementById('vitalsStatus'),
};

const FALLBACK = '--';

function formatValue(value) {
  if (value === null || value === undefined || value === '') return FALLBACK;
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
  const payload = {
    page: 'monitor',
    timestamp: new Date().toISOString(),
    memoryMb: Math.round((performance?.memory?.usedJSHeapSize || 0) / (1024 * 1024)),
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
    elements.webRoute.textContent = formatValue(readSummaryValue(webTelemetry, ['lastRoute', 'route']));

    const apiTelemetry = apiSummary.summary || {};
    elements.apiRequests.textContent = formatValue(readSummaryValue(apiTelemetry, ['requests', 'requestCount', 'totalRequests']));
    elements.apiErrors.textContent = formatValue(readSummaryValue(apiTelemetry, ['errors', 'errorCount', 'totalErrors']));
    elements.apiDuration.textContent = formatValue(readSummaryValue(apiTelemetry, ['avgDurationMs', 'averageDurationMs', 'avgMs']));
    elements.apiOtel.textContent = apiSummary.exportedViaOtel ? 'Yes' : 'No';

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

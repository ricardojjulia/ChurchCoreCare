import { metrics, trace } from '@opentelemetry/api';
import autoInstrumentationsPkg from '@opentelemetry/auto-instrumentations-node';
import metricExporterPkg from '@opentelemetry/exporter-metrics-otlp-http';
import traceExporterPkg from '@opentelemetry/exporter-trace-otlp-http';
import resourcesPkg from '@opentelemetry/resources';
import sdkMetricsPkg from '@opentelemetry/sdk-metrics';
import sdkNodePkg from '@opentelemetry/sdk-node';
import semanticConventions from '@opentelemetry/semantic-conventions';

const { getNodeAutoInstrumentations } = autoInstrumentationsPkg;
const { OTLPMetricExporter } = metricExporterPkg;
const { OTLPTraceExporter } = traceExporterPkg;
const { resourceFromAttributes } = resourcesPkg;
const { PeriodicExportingMetricReader } = sdkMetricsPkg;
const { NodeSDK } = sdkNodePkg;
const { ATTR_DEPLOYMENT_ENVIRONMENT_NAME, ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = semanticConventions;

export async function startNodeTelemetry({ serviceName, serviceVersion = '0.1.0' }) {
  if (process.env.OTEL_SDK_DISABLED === 'true') {
    return null;
  }

  const traceExporter = buildTraceExporter();
  const metricReader = buildMetricReader();
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV ?? 'development',
    }),
    traceExporter,
    metricReader,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();
  return sdk;
}

export function createServiceTelemetry(serviceName) {
  const meter = metrics.getMeter(serviceName);
  const tracer = trace.getTracer(serviceName);
  const requestDuration = meter.createHistogram('faith.http.server.duration', {
    description: 'HTTP request duration in milliseconds',
    unit: 'ms',
  });
  const activeRequestsCounter = meter.createUpDownCounter('faith.http.server.active_requests', {
    description: 'Number of active HTTP requests',
  });
  const mutationCounter = meter.createCounter('faith.app.mutations', {
    description: 'Application mutation operations',
  });
  const browserVitalHistogram = meter.createHistogram('faith.web.vital.value', {
    description: 'Browser vitals sent from the client application',
  });
  const proxyDuration = meter.createHistogram('faith.web.proxy.duration', {
    description: 'Web proxy upstream duration in milliseconds',
    unit: 'ms',
  });

  const state = {
    activeRequests: 0,
    requestSamples: [],
    vitalSamples: [],
    proxySamples: [],
    mutationCount: 0,
    lastMutationAt: null,
  };

  return {
    tracer,
    beginRequest(attributes) {
      const start = performance.now();
      activeRequestsCounter.add(1, attributes);
      state.activeRequests += 1;
      const span = tracer.startSpan(`http ${attributes.method} ${attributes.route}`);

      return {
        span,
        end(statusCode, extraAttributes = {}) {
          const duration = performance.now() - start;
          requestDuration.record(duration, {
            ...attributes,
            ...extraAttributes,
            statusCode,
          });
          activeRequestsCounter.add(-1, attributes);
          state.activeRequests = Math.max(0, state.activeRequests - 1);
          state.requestSamples.push({
            duration,
            at: Date.now(),
            statusCode,
            route: attributes.route,
            method: attributes.method,
          });
          trimSamples(state.requestSamples);
          span.setAttribute('http.response.status_code', statusCode);
          span.end();
        },
      };
    },
    recordMutation(name, result = 'success') {
      mutationCounter.add(1, { name, result });
      state.mutationCount += 1;
      state.lastMutationAt = new Date().toISOString();
    },
    recordBrowserVital(vital) {
      browserVitalHistogram.record(vital.value, {
        name: vital.name,
        rating: vital.rating,
      });
      state.vitalSamples.push({
        ...vital,
        at: Date.now(),
      });
      trimSamples(state.vitalSamples);
    },
    recordProxy(duration, route) {
      proxyDuration.record(duration, { route });
      state.proxySamples.push({ duration, route, at: Date.now() });
      trimSamples(state.proxySamples);
    },
    getSummary() {
      return {
        activeRequests: state.activeRequests,
        requestLatencyMs: summarizeDurations(state.requestSamples),
        proxyLatencyMs: summarizeDurations(state.proxySamples),
        mutationCount: state.mutationCount,
        lastMutationAt: state.lastMutationAt,
        browserVitals: summarizeVitals(state.vitalSamples),
        process: {
          uptimeSeconds: Math.round(process.uptime()),
          rssMb: toMegabytes(process.memoryUsage().rss),
          heapUsedMb: toMegabytes(process.memoryUsage().heapUsed),
          heapTotalMb: toMegabytes(process.memoryUsage().heapTotal),
        },
      };
    },
  };
}

function buildTraceExporter() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return undefined;
  return new OTLPTraceExporter({ url: endpoint });
}

function buildMetricReader() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return undefined;

  return new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: endpoint }),
    exportIntervalMillis: 10_000,
  });
}

function trimSamples(samples) {
  while (samples.length > 50) {
    samples.shift();
  }
}

function summarizeDurations(samples) {
  if (!samples.length) {
    return { avg: 0, p95: 0, max: 0, count: 0 };
  }

  const durations = samples.map((sample) => sample.duration).sort((left, right) => left - right);
  return {
    avg: round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
    p95: round(durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]),
    max: round(durations[durations.length - 1]),
    count: durations.length,
  };
}

function summarizeVitals(samples) {
  return samples.reduce((summary, sample) => {
    const existing = summary[sample.name] ?? { value: sample.value, rating: sample.rating, count: 0 };
    summary[sample.name] = {
      value: round(sample.value),
      rating: sample.rating,
      count: existing.count + 1,
    };
    return summary;
  }, {});
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function toMegabytes(value) {
  return round(value / 1024 / 1024);
}
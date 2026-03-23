import { context, trace } from '@opentelemetry/api';
import { ZoneContextManager } from '@opentelemetry/context-zone-peer-dep';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

export function createBrowserTelemetry(options = {}) {
  const provider = new WebTracerProvider();
  const zoneIsAvailable = typeof globalThis !== 'undefined' && typeof globalThis.Zone !== 'undefined';

  provider.register(zoneIsAvailable
    ? {
        contextManager: new ZoneContextManager(),
      }
    : undefined);

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: /.*/,
      }),
    ],
  });

  const tracer = trace.getTracer(options.serviceName ?? 'faith-web-ui');

  return {
    tracer,
    trackVitals(report) {
      const sender = (metric) => {
        report(createVitalPayload(metric));
      };

      onCLS(sender);
      onFCP(sender);
      onINP(sender);
      onLCP(sender);
      onTTFB(sender);
    },
    withSpan(name, fn) {
      const span = tracer.startSpan(name);
      return context.with(trace.setSpan(context.active(), span), async () => {
        try {
          return await fn(span);
        } finally {
          span.end();
        }
      });
    },
  };
}

export function createVitalPayload(metric) {
  return {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  };
}
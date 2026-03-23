import { createAuditEvent } from '../../../packages/domain/src/index.js';
import { createServiceTelemetry, startNodeTelemetry } from '../../../packages/telemetry/src/index.js';

const workerName = 'reminder-worker';
await startNodeTelemetry({ serviceName: workerName });
const telemetry = createServiceTelemetry(workerName);

const startupEvent = createAuditEvent({
  tenantId: 'system',
  action: 'worker.start',
  targetType: 'worker',
  targetId: workerName,
  occurredAt: new Date().toISOString(),
});

telemetry.recordMutation('worker.start');

console.log(`${workerName} initialized`);
console.log(JSON.stringify(startupEvent, null, 2));

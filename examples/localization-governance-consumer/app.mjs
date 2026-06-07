import assert from 'node:assert/strict';

import { createGovernanceService } from '@localization-governance/core';
import { createFilesystemStorage } from '@localization-governance/storage-filesystem';
import { createPostgresStorage } from '@localization-governance/storage-postgres';

const storage = await createFilesystemStorage({ directory: './data' });
let sequence = 0;
const service = createGovernanceService({
  storage,
  idGenerator: (prefix) => `${prefix}-${++sequence}`,
});
const actor = { id: 'sample-admin', role: 'administrator' };

await service.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor });
await service.createCatalogVersion({
  locale: 'en-US',
  messages: { hello: 'Hello {name}' },
  actor,
  source: true,
});
await service.createLocale({ code: 'es-MX', sourceLocale: 'en-US', actor });
const version = await service.createCatalogVersion({
  locale: 'es-MX',
  messages: { hello: 'Hola {name}' },
  actor,
});
await service.validateVersion({ versionId: version.id, actor });
await service.requestReview({ versionId: version.id, actor });
await service.submitReview({
  versionId: version.id,
  reviewer: { id: 'sample-linguist', role: 'linguistic' },
  decision: 'approved',
});
await service.approveVersion({ versionId: version.id, actor });
await service.activateVersion({ versionId: version.id, actor });

const reopened = await createFilesystemStorage({ directory: './data' });
const persisted = await reopened.getLocale('es-MX');
assert.equal(persisted.activeVersionId, version.id);

const portablePostgres = createPostgresStorage({
  client: { async query() { return { rows: [] }; } },
  tenantId: 'sample-tenant',
});
assert.equal(portablePostgres.tenantId, 'sample-tenant');

console.log(JSON.stringify({
  passed: true,
  activeVersionId: version.id,
  portablePostgres: true,
}));

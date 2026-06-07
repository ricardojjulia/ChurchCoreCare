# @localization-governance/storage-postgres

Tenant-bound PostgreSQL persistence for `@localization-governance/core`.

```js
const storage = createPostgresStorage({ client, tenantId });
```

The supplied client must expose `query()`. It may also expose
`transaction(callback)`, `connect()`, or `getConnection()` for transactional
activation and rollback.

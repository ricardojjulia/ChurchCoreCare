# Tenant Query Safety Checklist

This checklist is the baseline gate for tenant-isolated data access in DB mode.

## Required Query Rules

1. Every tenant-scoped table read includes `tenant_id = ?`.
2. Every tenant-scoped table write includes `tenant_id` in `INSERT` and `WHERE` clauses for updates/deletes.
3. API handlers must resolve `tenantId` from `callerTenant(request, session)` in DB mode.
4. Client-bound operations must verify `(id, tenant_id)` together.
5. Portal operations must verify assignment/account ownership by tenant and client.
6. Time values persisted to SQL `TIMESTAMP` columns must be normalized to SQL format (`YYYY-MM-DD HH:MM:SS`).
7. Responses must preserve API contract shape even when schema field names differ.

## CI Gate Design

Add a lightweight static guard in CI:

- Fail if `SELECT`/`UPDATE`/`DELETE` against tenant tables in `apps/api/src/db/queries` omit `tenant_id` filters.
- Fail if portal/billing/clinical handler DB branches validate IDs only against in-memory arrays.

Suggested guard commands:

```bash
# 1) Flag risky DB queries lacking tenant filters (manual review required)
grep -RIn "SELECT \* FROM\|UPDATE \|DELETE FROM" apps/api/src/db/queries

# 2) Flag non-DB client/template/definition lookups in DB branches
grep -RIn "process\.env\.DB_NAME" apps/api/src/index.js

# 3) Verify critical smokes
node ops/step11-smoke.mjs
node ops/step12-validate.mjs
node ops/security-regression.mjs
```

## Required Runtime Validation

1. `ops/step11-smoke.mjs` passes.
2. `ops/step12-validate.mjs` passes.
3. `ops/security-regression.mjs` passes.
4. CORS preflight for local web origin returns `204` with allow-origin header.

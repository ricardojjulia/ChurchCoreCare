# ADR-0005 — Separate Platform Database from Tenant Databases

**Date:** 2026-05-26  
**Status:** Accepted  
**Deciders:** Engineering

---

## Context

ChurchCore Care is a multi-tenant SaaS platform where each practice is an isolated tenant. The platform layer (tenant registry, subscription state, provisioning queue) must be managed separately from tenant-scoped clinical data (PHI).

The question is whether to store platform-level tables (`tenant_slugs`, `tenant_subscriptions`, `tenant_provisioning`) in the same PostgreSQL database as tenant data, or in a dedicated platform database.

## Decision

Platform-level tables are stored in a **dedicated platform database** (`DB_NAME` environment variable points to this database). Each tenant's clinical data lives in its own database, accessed through a `TENANT_DB_MAP` or tenant-scoped connection pool.

The provisioning worker connects to the platform DB only. Tenant-scoped API requests use the tenant's own pool. Neither can directly query the other's schema.

## Consequences

**Positive:**
- PHI (in tenant DBs) is physically separated from platform metadata (subscriptions, slugs) — satisfies HIPAA principle of minimum necessary access
- Platform DB can be backed up and restored independently of tenant PHI
- Tenant DB deletion for data retention does not require platform metadata cleanup as a prerequisite
- Smaller blast radius: a misconfigured tenant query cannot accidentally read another tenant's slug or subscription record

**Negative:**
- Joins across platform and tenant data are impossible at the DB layer; must be done in application code
- Two connection pools required in services that need both (currently: provisioning worker only)
- Migration scripts must be aware of which schema they're targeting

**Mitigations:**
- `apps/api/src/db/pool.js` provides the tenant pool; platform queries use a direct `pg.Pool` with `DB_NAME`
- Column migrations (`applyColumnMigrations`) run against the platform DB at startup, covering both `tenant_slugs`/`tenant_subscriptions` and shared tables

## Alternatives Considered

| Alternative | Why Not Chosen |
|---|---|
| Single shared database for all tenants | Tenant isolation requires row-level security across every query; error-prone and violates HIPAA separation |
| Platform tables in each tenant DB | Duplicates subscription state across N tenants; inconsistency risk |
| Platform tables in tenant 'system' DB | Mixes PHI-adjacent tables with platform metadata; harder to audit access |

# Runbook — Manual Tenant Provisioning

**Last updated:** May 27, 2026  
**Audience:** Ricardo Julia (platform operator)  
**Scope:** Recover a failed or stuck provisioning request; provision a tenant when the worker is unavailable

---

## When to use this runbook

- A provisioning request is stuck in `in_progress` for > 15 minutes
- A provisioning request shows `failed` status
- The provisioning worker is down and you need to unblock a new signup immediately
- A counselor reports their practice subdomain is not working after signup

---

## Prerequisites

```bash
# 1. GCP Cloud SQL Auth Proxy — forwards Cloud SQL to localhost:5432
cloud_sql_proxy churchcore-care-prod:us-central1:churchcore-pilot &

# 2. psql connected to the platform DB
psql "host=127.0.0.1 port=5432 dbname=churchcore_platform user=churchcore_app sslmode=disable"
```

---

## Step 1 — Find the stuck request

```sql
-- All non-completed requests, newest first
SELECT
  id,
  requested_tenant_id,
  requested_practice_name,
  status,
  requested_at,
  completed_at
FROM tenant_provisioning
WHERE status != 'completed'
ORDER BY requested_at DESC;
```

---

## Step 2 — Reset a crashed in_progress request

If the worker crashed mid-provision, the request stays `in_progress` forever. Reset it to `queued` so the worker picks it up next cycle:

```sql
UPDATE tenant_provisioning
SET status = 'queued'
WHERE id = '<REQUEST_ID>'
  AND status = 'in_progress';
```

Then restart the worker (see [gcp-incident-response.md](./gcp-incident-response.md#3-p0--worker-stopped-processing)).

---

## Step 3 — Full manual provisioning (worker unavailable)

If the worker cannot be restarted, provision manually using the `ops/` scripts.

### 3a. Register the tenant slug in the platform DB

```sql
INSERT INTO tenant_slugs (slug, tenant_id, is_active, created_at)
VALUES ('<slug>', '<slug>', TRUE, NOW())
ON CONFLICT (slug) DO NOTHING;
```

### 3b. Create the trial subscription record

```sql
INSERT INTO tenant_subscriptions
  (tenant_id, status, trial_ends_at, created_at, updated_at)
VALUES
  ('<slug>', 'trial', NOW() + INTERVAL '30 days', NOW(), NOW())
ON CONFLICT (tenant_id) DO NOTHING;
```

### 3c. Bootstrap the tenant database

The tenant DB name is `churchcore_<slug>`. If it doesn't exist yet, create it:

```bash
# Create the tenant database on the Cloud SQL instance
gcloud sql databases create churchcore_<slug> \
  --instance=churchcore-pilot \
  --project=churchcore-care-prod
```

Then bootstrap the schema using the provisioning helper:

```bash
# Set tenant DB env vars and run the bootstrap script
DB_NAME=churchcore_<slug> \
DB_HOST=127.0.0.1 \
DB_PORT=5432 \
DB_USER=churchcore_app \
DB_PASSWORD=<PASSWORD_FROM_SECRET_MANAGER> \
node -e "
import { bootstrapTenantSchema } from './apps/api/src/lib/tenant-setup.js';
await bootstrapTenantSchema({
  tenantId: '<slug>',
  practiceName: '<Practice Name>',
  ownerEmailEnc: '<encrypted_email>',
  ownerEmailHash: '<hash>',
  ownerPasswordHash: '<argon2_hash>',
});
console.log('Done');
"
```

**Note:** The `ownerEmailEnc`, `ownerEmailHash`, and `ownerPasswordHash` values must come from the provisioning request. If the request was created via the signup flow, these are populated. If provisioning manually for a new tenant, generate them first:

```bash
# Generate argon2 hash for a temporary password
node -e "
import argon2 from 'argon2';
const hash = await argon2.hash('TemporaryPassword123!');
console.log(hash);
"
```

### 3d. Mark the provisioning request completed

```sql
UPDATE tenant_provisioning
SET status = 'completed', completed_at = NOW()
WHERE id = '<REQUEST_ID>';
```

### 3e. Verify the tenant can log in

```bash
# Check the tenant is accessible via health endpoint
curl https://<slug>.churchcorecare.com/api/health/live
# Expected: {"status":"ok"}

# Or if using single-host routing:
curl https://app.churchcorecare.com/api/health/live \
  -H "x-tenant-id: <slug>"
```

---

## Step 4 — Handle a failed provisioning with partial state

If provisioning partially completed (e.g., slug was registered but tenant DB bootstrap failed), clean up before retrying:

```sql
-- Check what was created
SELECT * FROM tenant_slugs WHERE tenant_id = '<slug>';
SELECT * FROM tenant_subscriptions WHERE tenant_id = '<slug>';

-- If you need to remove partial state and start fresh:
DELETE FROM tenant_slugs WHERE tenant_id = '<slug>';
DELETE FROM tenant_subscriptions WHERE tenant_id = '<slug>';

-- Reset the request to queued
UPDATE tenant_provisioning
SET status = 'queued', completed_at = NULL
WHERE id = '<REQUEST_ID>';
```

Then drop the partially-created tenant DB if it exists:

```bash
gcloud sql databases delete churchcore_<slug> \
  --instance=churchcore-pilot \
  --project=churchcore-care-prod
```

---

## Step 5 — Notify the counselor

After successful manual provisioning, send the counselor their practice URL manually:

- Practice URL: `https://<slug>.churchcorecare.com`
- Temporary password (if you set one in step 3c): send securely, prompt to change on first login
- Or direct them to the password reset flow: `https://<slug>.churchcorecare.com/reset-password`

---

## Common errors and resolutions

| Error | Cause | Resolution |
|---|---|---|
| `Tenant ID already registered` | Slug collision — slug was registered before bootstrap completed | Clear `tenant_slugs` entry and retry |
| `connection refused` to tenant DB | Tenant DB doesn't exist yet | Run `gcloud sql databases create` (step 3c) |
| `permission denied for table staff_accounts` | DB user lacks table permissions | Grant: `GRANT ALL ON ALL TABLES IN SCHEMA public TO churchcore_app;` |
| Provisioning stuck > 30 min | Worker crashed while holding DB transaction | Reset to `queued` (step 2) |
| `trial_ends_at` is null | Subscription record created without trial date | `UPDATE tenant_subscriptions SET trial_ends_at = created_at + INTERVAL '30 days' WHERE tenant_id = '<slug>';` |

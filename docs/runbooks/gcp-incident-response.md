# Runbook — GCP Incident Response

**Last updated:** May 27, 2026  
**Audience:** Ricardo Julia (on-call operator)  
**Scope:** API down, worker down, DB unreachable, data breach response

---

## Table of Contents

1. [Quick Reference — Service URLs](#1-quick-reference--service-urls)
2. [P0 — API completely down](#2-p0--api-completely-down)
3. [P0 — Worker stopped processing](#3-p0--worker-stopped-processing)
4. [P1 — Database unreachable](#4-p1--database-unreachable)
5. [P1 — Stripe webhooks failing](#5-p1--stripe-webhooks-failing)
6. [P2 — Elevated error rate](#6-p2--elevated-error-rate)
7. [P2 — Tenant provisioning stuck](#7-p2--tenant-provisioning-stuck)
8. [S — Security incident / suspected breach](#8-s--security-incident--suspected-breach)
9. [Rollback procedure](#9-rollback-procedure)
10. [Post-incident checklist](#10-post-incident-checklist)

---

## 1. Quick Reference — Service URLs

| Service | URL |
|---|---|
| Practice app | `https://app.churchcorecare.com` |
| Platform admin | `https://tenantadmin.churchcorecare.com` |
| API health | `https://app.churchcorecare.com/api/health/live` |
| Cloud Run console | `https://console.cloud.google.com/run?project=churchcore-care-prod` |
| Cloud SQL console | `https://console.cloud.google.com/sql?project=churchcore-care-prod` |
| GCP Logs | `https://console.cloud.google.com/logs?project=churchcore-care-prod` |
| Stripe Dashboard | `https://dashboard.stripe.com` |

```bash
# Quick health check from terminal
curl https://app.churchcorecare.com/api/health/live
curl https://app.churchcorecare.com/api/health/ready
```

---

## 2. P0 — API completely down

**Symptom:** `/api/health/live` returns non-200 or times out. All practice logins fail.

### Step 1 — Check Cloud Run status

```bash
gcloud run services describe churchcore-care-api \
  --region=us-central1 \
  --format='value(status.conditions)'
```

### Step 2 — Check recent logs for crash cause

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="churchcore-care-api" AND severity>=ERROR' \
  --project=churchcore-care-prod \
  --limit=50 \
  --format=json | jq '.[].jsonPayload'
```

### Step 3 — Traffic-split rollback to previous revision

```bash
# List revisions
gcloud run revisions list --service=churchcore-care-api --region=us-central1

# Route 100% to last known-good revision
gcloud run services update-traffic churchcore-care-api \
  --region=us-central1 \
  --to-revisions=<PREV_REVISION>=100
```

### Step 4 — Verify recovery

```bash
bash ops/smoke-test.sh
```

---

## 3. P0 — Worker stopped processing

**Symptom:** Provisioning requests stuck in `queued` for > 5 minutes. Trial reminder emails not sending.

### Diagnose

```bash
# Check worker service health
gcloud run services describe churchcore-care-worker \
  --region=us-central1 \
  --format='value(status.conditions)'

# Check worker logs
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="churchcore-care-worker" AND severity>=WARNING' \
  --project=churchcore-care-prod \
  --limit=30 \
  --format=json | jq '.[].jsonPayload.message'
```

### Restart worker

```bash
# Cloud Run Jobs don't restart automatically — redeploy to force new instance
gcloud run deploy churchcore-care-worker \
  --image=us-central1-docker.pkg.dev/churchcore-care-prod/churchcore/worker:latest \
  --region=us-central1 \
  --quiet
```

### Check stuck provisioning requests

```bash
# Connect to platform DB via Cloud SQL Auth Proxy
cloud_sql_proxy churchcore-care-prod:us-central1:churchcore-pilot &
psql "host=127.0.0.1 port=5432 dbname=churchcore_platform user=churchcore_app sslmode=disable"

-- Check stuck requests
SELECT id, requested_tenant_id, status, requested_at
FROM tenant_provisioning
WHERE status IN ('queued', 'in_progress')
ORDER BY requested_at ASC;

-- Manually reset in_progress → queued if worker crashed mid-provision
UPDATE tenant_provisioning
SET status = 'queued'
WHERE status = 'in_progress'
  AND requested_at < NOW() - INTERVAL '30 minutes';
```

---

## 4. P1 — Database unreachable

**Symptom:** API returns 500 or 503. Logs show `connection refused` or `ECONNREFUSED`.

### Check Cloud SQL instance

```bash
gcloud sql instances describe churchcore-pilot \
  --project=churchcore-care-prod \
  --format='value(state)'

# Should return: RUNNABLE
# If not, check the console for maintenance windows or failover
```

### Force Cloud SQL restart (last resort)

```bash
gcloud sql instances restart churchcore-pilot \
  --project=churchcore-care-prod
# Warning: causes ~60s downtime. Confirm with ops lead first.
```

### Check connection pool exhaustion in API logs

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="churchcore-care-api" AND jsonPayload.message=~"pool"' \
  --project=churchcore-care-prod \
  --limit=20
```

---

## 5. P1 — Stripe webhooks failing

**Symptom:** Subscriptions not updating after payment. `invoice.paid` events not reflected in tenant status.

### Check webhook delivery in Stripe

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click the `churchcorecare.com/api/webhooks/stripe` endpoint
3. Review recent delivery attempts for failures

### Replay failed events

```bash
# From Stripe CLI — replay the last 10 failed events
stripe events resend --webhook-id=<webhook_id> --limit=10
```

### Verify webhook secret is current

```bash
# Check the secret stored in GCP Secret Manager matches Stripe dashboard
gcloud secrets versions access latest \
  --secret=prod-stripe-webhook-secret \
  --project=churchcore-care-prod | head -c 40
```

---

## 6. P2 — Elevated error rate

**Symptom:** More than 1% of API requests returning 500. Clients reporting errors.

### Find the failing route

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="churchcore-care-api" AND jsonPayload.statusCode>=500' \
  --project=churchcore-care-prod \
  --limit=50 \
  --format=json | jq '.[].jsonPayload | {route: .route, error: .error, statusCode: .statusCode}'
```

### Check for recent deploy correlation

```bash
# List Cloud Run revisions with deploy times
gcloud run revisions list \
  --service=churchcore-care-api \
  --region=us-central1 \
  --format='table(name,creationTimestamp,status.conditions[0].status)'
```

If error rate correlates with a deploy → **rollback** (see section 9).

---

## 7. P2 — Tenant provisioning stuck

**Symptom:** New signup notification received but practice subdomain not accessible after 5 minutes.

```bash
# Check status of specific request
psql "host=127.0.0.1 port=5432 dbname=churchcore_platform user=churchcore_app sslmode=disable" \
  -c "SELECT id, requested_tenant_id, status, requested_at, completed_at FROM tenant_provisioning WHERE requested_tenant_id='<slug>' ORDER BY requested_at DESC LIMIT 1;"
```

### Manual provisioning (if worker fails)

See [tenant-provisioning-manual.md](./tenant-provisioning-manual.md) for step-by-step recovery.

---

## 8. S — Security incident / suspected breach

**Symptoms:** Unusual access patterns, PHI data in logs, unauthorized API calls.

### Immediate containment

1. **Rotate all secrets immediately:**

```bash
# Rotate DB encryption key (PHI at rest)
openssl rand -base64 32 | \
  gcloud secrets versions add prod-db-encryption-key \
    --data-file=- \
    --project=churchcore-care-prod

# Rotate session secret (invalidates all active sessions)
openssl rand -base64 48 | \
  gcloud secrets versions add prod-session-secret \
    --data-file=- \
    --project=churchcore-care-prod

# Redeploy immediately to pick up new secrets
bash ops/deploy-api.sh
bash ops/deploy-worker.sh
```

2. **Block all API traffic if breach is confirmed:**

```bash
# Set Cloud Run to zero instances (effectively takes down the API)
gcloud run services update churchcore-care-api \
  --region=us-central1 \
  --max-instances=0
```

3. **Preserve logs** — do NOT delete or modify any log entries. Export immediately:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"' \
  --project=churchcore-care-prod \
  --since=24h \
  --format=json > /tmp/incident-$(date +%Y%m%d-%H%M%S).json
```

4. **Notify affected parties** per HIPAA Breach Notification Rule:
   - If PHI was accessed without authorization → HIPAA breach notification required within 60 days
   - Document the incident, scope, and containment steps

---

## 9. Rollback procedure

```bash
# 1. Find the last known-good revision
gcloud run revisions list \
  --service=churchcore-care-api \
  --region=us-central1 \
  --sort-by=~creationTimestamp \
  --limit=5

# 2. Route 100% traffic to previous revision
gcloud run services update-traffic churchcore-care-api \
  --region=us-central1 \
  --to-revisions=<GOOD_REVISION>=100

# 3. Repeat for worker
gcloud run services update-traffic churchcore-care-worker \
  --region=us-central1 \
  --to-revisions=<GOOD_WORKER_REVISION>=100

# 4. Verify
bash ops/smoke-test.sh
```

**Note:** DB schema migrations are not automatically rolled back. If the new revision applied a migration that broke something, consult `apps/api/src/db/migrate.js` for the specific changes and assess whether a manual column drop or rename is safe.

---

## 10. Post-incident checklist

- [ ] Root cause identified and documented
- [ ] Timeline reconstructed from logs
- [ ] Affected tenants identified
- [ ] HIPAA breach assessment completed (breach or not-a-breach determination)
- [ ] Affected users notified (if applicable)
- [ ] Preventive measures implemented (code fix, rate limit, access control)
- [ ] `docs/incidents/YYYY-MM-DD-<slug>.md` incident report written
- [ ] Deploy pipeline updated if a CI/CD gap caused the issue
- [ ] Runbook updated with lessons learned

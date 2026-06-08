# GCP Deployment — ChurchCore Care

> **Historical alternate deployment:** ChurchCore Care's canonical hosted
> runtime is Vercel plus online Supabase. This GCP/Cloud Run path is retained
> for manual compatibility work only and is not triggered by pushes to
> `main`.

**Last updated:** May 26, 2026
**Audience:** Ricardo Julia (platform operator)
**Scope:** Single-tenant pilot deploy → first customer → path to multi-tenant

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step-by-Step: First Deploy](#3-step-by-step-first-deploy)
4. [Component Reference](#4-component-reference)
5. [Secret Reference](#5-secret-reference)
6. [GitHub Actions CI/CD](#6-github-actions-cicd)
7. [Firebase Hosting Setup](#7-firebase-hosting-setup)
8. [Custom Domain & TLS](#8-custom-domain--tls)
9. [First Customer Provisioning](#9-first-customer-provisioning)
10. [Monitoring & Logs](#10-monitoring--logs)
11. [Scaling to Multi-Tenant](#11-scaling-to-multi-tenant)
12. [Rollback Procedure](#12-rollback-procedure)
13. [Cost Estimate](#13-cost-estimate)

---

## 1. Architecture Overview

```
Browser
  │
  │  https://app.churchcorecare.com
  ▼
Firebase Hosting (apps/web SPA)
  │
  │  /api/** rewrites to Cloud Run
  ▼
Cloud Run — churchcore-care-api        Cloud Run — churchcore-care-worker
  │  (public, port 3001)                 │  (internal only, no public URL)
  │                                      │
  └──────────────────┬───────────────────┘
                     │
              Cloud SQL Proxy (Unix socket)
                     │
              Cloud SQL PostgreSQL 16
              (churchcore-pilot instance)
                     │
              Single database: churchcore_pilot
                     │
              (pilot = one practice, one DB)
```

**What is NOT in this pilot setup** (multi-tenant only, add later):
- Cloud Load Balancer + Cloud Armor WAF
- Wildcard DNS `*.churchcorecare.com` routing
- `TENANT_DB_MAP` / per-tenant database separation
- Platform Admin SPA

---

## 2. Prerequisites

### Tools (install once)

```bash
# Google Cloud SDK
brew install --cask google-cloud-sdk

# Firebase CLI
npm install -g firebase-tools

# Docker Desktop (for local builds)
# https://www.docker.com/products/docker-desktop/

# Verify
gcloud version
firebase --version
docker --version
```

### Accounts needed before starting

| Account | URL | Purpose |
|---|---|---|
| Google Cloud | console.cloud.google.com | All infrastructure |
| Firebase | firebase.google.com | Web SPA hosting (same GCP project) |
| Stripe | dashboard.stripe.com | SaaS subscription billing |
| SendGrid | sendgrid.com | Transactional email (reminders, alerts) |
| Twilio | twilio.com | SMS appointment reminders |
| JaaS (8x8) | jaas.8x8.vc | Telehealth video sessions |
| Anthropic | console.anthropic.com | AI session note drafting |

### Admin tasks (do before running any scripts)

1. **Sign GCP HIPAA BAA**
   - Go to: `console.cloud.google.com` → IAM & Admin → Settings → HIPAA
   - Or direct link: `admin.google.com` → Account → Legal → HIPAA
   - **This is required before any PHI touches Cloud SQL.**
   - Takes 1-2 business days to process.

2. **Create Stripe products**
   - Log in to [Stripe Dashboard](https://dashboard.stripe.com)
   - Go to Products → Add product
   - Create these three:

   | Product name | Price | Billing | Env var |
   |---|---|---|---|
   | ChurchCore Care — Solo | $69.00 | Monthly recurring | `STRIPE_PRICE_SOLO` |
   | ChurchCore Care — Group | $99.00 | Monthly recurring | `STRIPE_PRICE_GROUP` |
   | Additional Counselor Seat | $39.00 | Monthly recurring | `STRIPE_PRICE_SEAT` |

   - Copy each **price ID** (starts with `price_`) to your `.env.prod` file.

3. **Create Stripe webhook** (after first deploy)
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://app.churchcorecare.com/api/webhooks/stripe`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`
   - Copy the **signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.

---

## 3. Step-by-Step: First Deploy

### Step 1 — Create GCP project

```bash
# Log in
gcloud auth login

# Create project (pick a unique ID)
gcloud projects create churchcore-care-prod \
  --name="ChurchCore Care Production"

# Link billing account
gcloud billing projects link churchcore-care-prod \
  --billing-account=YOUR_BILLING_ACCOUNT_ID

# Find your billing account ID:
gcloud billing accounts list
```

### Step 2 — Bootstrap GCP resources

```bash
export GCP_PROJECT=churchcore-care-prod
export GCP_REGION=us-central1
export GITHUB_ORG=ricardojjulia
export GITHUB_REPO=ChurchCoreCare

bash ops/gcp-setup.sh
```

This script creates (all idempotent — safe to re-run):
- Enables all required APIs
- Artifact Registry repository for Docker images
- Service accounts for API, Worker, and GitHub Actions deploy
- Workload Identity Federation (GitHub Actions authenticates without static keys)
- Cloud SQL PostgreSQL 16 instance (`churchcore-pilot`)
- Secret Manager placeholder secrets

**Save the outputs** — you'll need the Workload Identity Provider URL and Cloud SQL connection name.

### Step 3 — Prepare production secrets

```bash
# Copy the template
cp .env.example .env.prod

# Edit .env.prod — fill in ALL values marked below
nano .env.prod   # or use your preferred editor
```

Required values in `.env.prod`:

```bash
# Database (output from gcp-setup.sh)
DB_PASSWORD=<from gcp-setup.sh output>

# Encryption — generate fresh keys for production
DB_ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # fill after Step 5
STRIPE_PRICE_SOLO=price_...
STRIPE_PRICE_GROUP=price_...
STRIPE_PRICE_SEAT=price_...

# AI notes
ANTHROPIC_API_KEY=sk-ant-...

# Email (SendGrid)
SENDGRID_API_KEY=SG....

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Telehealth (JaaS — optional, skip if not using telehealth)
JITSI_APP_ID=...
JITSI_API_KEY_ID=...
JITSI_PRIVATE_KEY_BASE64=...
```

Push secrets to Secret Manager:

```bash
export GCP_PROJECT=churchcore-care-prod
bash ops/secrets-setup.sh
```

### Step 4 — Deploy the API

```bash
export GCP_PROJECT=churchcore-care-prod
export GCP_REGION=us-central1
export CLOUDSQL_INSTANCE=churchcore-care-prod:us-central1:churchcore-pilot

# First deploy: skip migrations (DB is empty, migrations run on startup)
SKIP_MIGRATE=1 bash ops/deploy-api.sh
```

Copy the Cloud Run URL from the output — you'll need it for Firebase.

### Step 5 — Deploy the Worker

```bash
export GCP_PROJECT=churchcore-care-prod
export GCP_REGION=us-central1
export TWILIO_FROM_NUMBER=+15551234567   # your Twilio phone number

bash ops/deploy-worker.sh
```

### Step 6 — Run database migrations

The API runs migrations on startup. After the first deploy completes, check:

```bash
gcloud run services logs tail churchcore-care-api \
  --region=us-central1 \
  --project=churchcore-care-prod
```

Look for: `Migrations applied` or `No pending migrations`.

### Step 7 — Set up Firebase Hosting

```bash
# Log in to Firebase
firebase login

# Add your GCP project as the Firebase project
firebase use --add
# When prompted: select your GCP project ID (churchcore-care-prod)
# Alias: production

# Update firebase.json with your Cloud Run service ID
# Edit firebase.json → "serviceId": "churchcore-care-api"

# Build the web app
pnpm --filter web build

# Deploy
firebase deploy --only hosting
```

### Step 8 — Run smoke tests

```bash
# Use the Firebase Hosting URL (or Cloud Run URL directly)
export API_URL=https://churchcore-care-prod.web.app

bash ops/smoke-test.sh
```

All checks should pass. If the health check fails, see [Monitoring & Logs](#10-monitoring--logs).

### Step 9 — Configure Stripe webhook

Now that the API is live:
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `$API_URL/api/webhooks/stripe`
3. Select the 6 events listed in [Prerequisites](#admin-tasks-do-before-running-any-scripts)
4. Copy the signing secret
5. Update the secret: `bash ops/secrets-setup.sh --only prod-stripe-webhook-secret`
6. Redeploy the API: `bash ops/deploy-api.sh`

### Step 10 — Custom domain (optional for pilot)

See [Custom Domain & TLS](#8-custom-domain--tls) for `app.churchcorecare.com` setup.

---

## 4. Component Reference

### Cloud Run — churchcore-care-api

| Property | Value |
|---|---|
| Image | `us-central1-docker.pkg.dev/PROJECT/churchcore/api:TAG` |
| Port | 3001 |
| Min instances | 1 (always warm — no cold starts) |
| Max instances | 5 |
| CPU | 1 vCPU |
| Memory | 512 Mi |
| Timeout | 60s |
| Auth | `--allow-unauthenticated` (public web API) |
| Cloud SQL | Via Unix socket (`/cloudsql/PROJECT:REGION:INSTANCE`) |

**Health endpoints:**
- `GET /health/live` — liveness probe (always returns 200 if process is up)
- `GET /health/ready` — readiness probe (checks DB connection)

### Cloud Run — churchcore-care-worker

| Property | Value |
|---|---|
| Image | `us-central1-docker.pkg.dev/PROJECT/churchcore/worker:TAG` |
| Min instances | 1 (always on — long-running polling loop) |
| Max instances | 1 (single instance, not load-balanced) |
| Memory | 256 Mi |
| Timeout | 3600s |
| CPU throttling | OFF (`--no-cpu-throttling`) — needed for polling loops |
| Auth | `--no-allow-unauthenticated` (internal only) |

The worker runs two polling loops:
- Appointment reminders: every 60 seconds
- Tenant provisioning: every 15 seconds

### Cloud SQL — churchcore-pilot

| Property | Value |
|---|---|
| Engine | PostgreSQL 16 |
| Tier | `db-f1-micro` (1 shared vCPU, 614 MB RAM) — upgrade for > 5 users |
| Storage | 10 GB SSD, auto-increase enabled |
| Backup | Daily at 04:00 UTC, 7-day retention |
| Connection | Unix socket via Cloud Run proxy (no public IP needed) |

To upgrade tier when you have more clients:
```bash
gcloud sql instances patch churchcore-pilot \
  --tier=db-g1-small \
  --project=churchcore-care-prod
```

### Artifact Registry

- Repository: `us-central1-docker.pkg.dev/PROJECT/churchcore`
- Images: `api:SHA`, `api:latest`, `worker:SHA`, `worker:latest`

### Secret Manager secrets

See [Secret Reference](#5-secret-reference) for the full list.

---

## 5. Secret Reference

All secrets are stored in GCP Secret Manager. Cloud Run reads them at startup.

| Secret name | Contains | Required |
|---|---|---|
| `prod-db-password` | PostgreSQL password for `churchcore_app` | ✅ |
| `prod-db-encryption-key` | AES-256 key for PHI encryption (32-byte hex) | ✅ |
| `prod-session-secret` | HTTP session signing secret | ✅ |
| `prod-stripe-secret-key` | Stripe API secret key (`sk_live_...`) | ✅ |
| `prod-stripe-webhook-secret` | Stripe webhook signing secret (`whsec_...`) | ✅ |
| `prod-stripe-price-solo` | Stripe price ID for Solo plan | ✅ |
| `prod-stripe-price-group` | Stripe price ID for Group plan | ✅ |
| `prod-stripe-price-seat` | Stripe price ID for Additional Seat | ✅ |
| `prod-anthropic-api-key` | Anthropic API key for AI note drafting | ✅ |
| `prod-sendgrid-api-key` | SendGrid API key for email delivery | ✅ |
| `prod-twilio-account-sid` | Twilio account SID for SMS | optional |
| `prod-twilio-auth-token` | Twilio auth token for SMS | optional |
| `prod-jitsi-app-id` | JaaS app ID for telehealth | optional |
| `prod-jitsi-api-key-id` | JaaS API key ID | optional |
| `prod-jitsi-private-key` | JaaS private key (base64) | optional |

**Critical security notes:**
- `prod-db-encryption-key` encrypts all PHI in the database. **If this key is lost, PHI is unrecoverable.** Back it up offline immediately after creating it.
- Never rotate `prod-db-encryption-key` without first decrypting and re-encrypting all PHI in the database.
- These secrets are never written to `.env` files in the repo. `.env.prod` exists only locally, never committed.

To rotate a secret:
```bash
# Example: rotate session secret
NEW_SECRET=$(openssl rand -base64 32)
echo -n "$NEW_SECRET" | gcloud secrets versions add prod-session-secret \
  --data-file=- \
  --project=churchcore-care-prod
# Then redeploy the API to pick up the new version
bash ops/deploy-api.sh
```

---

## 6. GitHub Actions CI/CD

The workflow at `.github/workflows/deploy.yml` runs only when manually
dispatched from GitHub Actions. Choose `staging` or `production` explicitly.
Normal pushes and merges to `main` deploy through Vercel instead.

```
manual workflow dispatch
    │
    ├── pnpm lint
    ├── pnpm test (95 tests)
    ├── tenant policy guard
    │
    ├── Build + push API image to Artifact Registry
    ├── Build + push Worker image to Artifact Registry
    ├── Build web dist (vite build)
    │
    ├── Deploy API → staging Cloud Run
    ├── Deploy Worker → staging Cloud Run
    ├── Deploy web → Firebase Hosting (staging channel)
    ├── Smoke test staging
    │
    └── If production was selected:
        Deploy API → production Cloud Run
        Deploy Worker → production Cloud Run
        Deploy web → Firebase Hosting (live channel)
        Smoke test production
```

### GitHub secrets to configure

Go to: `github.com/ricardojjulia/ChurchCoreCare` → Settings → Secrets → Actions

| Secret | Where to get it |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Output of `ops/gcp-setup.sh` |
| `GCP_SERVICE_ACCOUNT` | `churchcore-deploy@PROJECT.iam.gserviceaccount.com` |
| `GCP_PROJECT` | Your GCP project ID |
| `GCP_REGION` | `us-central1` |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | Firebase service account JSON (see below) |
| `FIREBASE_SERVICE_ACCOUNT_STAGING` | Same or separate staging account |
| `TWILIO_FROM_NUMBER` | Your Twilio phone number |
| `PROD_TENANT_DB_MAP` | For multi-tenant (leave empty for pilot) |
| `PROD_DB_ENCRYPTION_KEY` | Same as Secret Manager `prod-db-encryption-key` |

**Getting Firebase service account JSON:**
```bash
# In Firebase Console → Project Settings → Service Accounts
# → Generate new private key → download JSON
# Paste the entire JSON (one line) as the secret value
```

### Firebase `.firebaserc` setup

Create this file at the repo root (not committed — add to `.gitignore`):

```json
{
  "projects": {
    "production": "churchcore-care-prod",
    "staging": "churchcore-care-staging"
  }
}
```

---

## 7. Firebase Hosting Setup

Firebase Hosting serves the React SPA and proxies `/api/**` to Cloud Run.

### Initial Firebase setup

```bash
firebase login
firebase use --add
# Select: churchcore-care-prod
# Alias: production
```

The existing `firebase.json` at the repo root configures:
- Public directory: `apps/web/public` (Vite build output)
- SPA fallback: all routes → `index.html`
- API proxy: `/api/**` → Cloud Run `churchcore-care-api`
- Asset caching: 1 year for `/assets/**`

**Update the Cloud Run service ID in `firebase.json`:**

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "churchcore-care-api",
          "region": "us-central1"
        }
      }
    ]
  }
}
```

### Manual web deploy

```bash
pnpm --filter web build
firebase deploy --only hosting --project=production
```

### Custom domain

```bash
# In Firebase Console → Hosting → Add custom domain
# Add: app.churchcorecare.com
# Firebase provides TXT records and A records for DNS
```

---

## 8. Custom Domain & TLS

For the pilot, Firebase Hosting provides free managed TLS for `app.churchcorecare.com`.

### DNS setup (Namecheap / Cloudflare / Route 53)

Firebase will give you two A records and one TXT record during domain verification. Example:

```
Type   Name                     Value
TXT    app.churchcorecare.com   firebase-domain-verify=...
A      app.churchcorecare.com   151.101.1.195
A      app.churchcorecare.com   151.101.65.195
```

TLS certificate is provisioned automatically by Firebase (Let's Encrypt) within 24 hours.

### Stripe webhook URL after custom domain

After setting up `app.churchcorecare.com`, update the Stripe webhook endpoint:
```
https://app.churchcorecare.com/api/webhooks/stripe
```

---

## 9. First Customer Provisioning

For the pilot, provision the first practice manually (no self-serve signup yet).

### Option A — Manual provisioning (recommended for first customer)

```bash
# 1. Connect to Cloud SQL via Cloud SQL Auth Proxy locally
gcloud auth application-default login
cloud_sql_proxy churchcore-care-prod:us-central1:churchcore-pilot &

# 2. Run migrations (if not already done by API startup)
DB_HOST=127.0.0.1 DB_PORT=5432 DB_NAME=churchcore_pilot \
  DB_USER=churchcore_app DB_PASSWORD=<from secrets> \
  node apps/api/src/db/migrate.js

# 3. Create the first practice's staff account
# Connect to DB and INSERT directly, or use an admin API endpoint

# 4. Create their Stripe subscription manually
# Stripe Dashboard → Customers → Add customer
# → Add subscription → Solo plan → 30-day trial

# 5. Update the DB with the Stripe subscription details
psql "host=127.0.0.1 dbname=churchcore_pilot user=churchcore_app" <<SQL
INSERT INTO tenant_subscriptions (
  id, tenant_id, stripe_customer_id, stripe_subscription_id,
  stripe_price_id, status, trial_ends_at, created_at, updated_at
) VALUES (
  'sub-001', 'system',
  'cus_STRIPE_CUSTOMER_ID',
  'sub_STRIPE_SUBSCRIPTION_ID',
  'price_SOLO_PRICE_ID',
  'trial',
  NOW() + INTERVAL '30 days',
  NOW(), NOW()
) ON CONFLICT (tenant_id) DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  status = EXCLUDED.status,
  trial_ends_at = EXCLUDED.trial_ends_at;
SQL
```

### Option B — Platform admin API

Once the API is deployed, platform admins can use:
```bash
curl -X POST https://app.churchcorecare.com/api/v1/platform/tenants \
  -H "Content-Type: application/json" \
  -H "x-session-token: <admin-session>" \
  -d '{"tenantId":"gracecounseling","practiceType":"solo"}'
```

---

## 10. Monitoring & Logs

### View API logs

```bash
# Live log stream
gcloud run services logs tail churchcore-care-api \
  --region=us-central1 \
  --project=churchcore-care-prod

# Last 50 errors
gcloud logging read \
  'resource.type="cloud_run_revision" AND severity>=ERROR' \
  --project=churchcore-care-prod \
  --limit=50 \
  --format='table(timestamp,textPayload)'
```

### View Worker logs

```bash
gcloud run services logs tail churchcore-care-worker \
  --region=us-central1 \
  --project=churchcore-care-prod
```

### Cloud SQL queries

```bash
# Connect via Auth Proxy
gcloud auth application-default login
cloud_sql_proxy churchcore-care-prod:us-central1:churchcore-pilot

# In another terminal
psql "host=127.0.0.1 port=5432 dbname=churchcore_pilot user=churchcore_app"
```

### Set up alerts

In Cloud Console → Monitoring → Alerting → Create policy:

| Alert | Condition | Notify |
|---|---|---|
| API error rate | HTTP 5xx > 5% over 5 min | Email |
| API latency | p99 > 3s over 10 min | Email |
| Worker stopped | Cloud Run revision count = 0 | Email |
| DB connections | > 80% of max | Email |

---

## 11. Scaling to Multi-Tenant

When you onboard a second practice, switch from single-tenant to multi-tenant mode:

### 1. Create tenant DB

```bash
# Create a new DB for the new practice
gcloud sql databases create gracecounseling \
  --instance=churchcore-pilot \
  --project=churchcore-care-prod

# Run migrations on the new DB
TENANT_DB=gracecounseling bash ops/migrate-all-tenants.mjs
```

### 2. Update TENANT_DB_MAP secret

```bash
# The map format: { "tenantId": { "database": "db_name" } }
TENANT_DB_MAP='{"system":{"database":"churchcore_pilot"},"gracecounseling":{"database":"gracecounseling"}}'

echo -n "$TENANT_DB_MAP" | gcloud secrets versions add prod-tenant-db-map \
  --data-file=- \
  --project=churchcore-care-prod
```

### 3. Switch API to multi-tenant mode

Update `deploy-api.sh` env vars:
```bash
ENABLE_TENANT_HOST_ROUTING=true
TENANT_STRICT_HOST_ROUTING=true
# Remove: DB_NAME=churchcore_pilot
# Add: DB_NAME is now per-tenant via TENANT_DB_MAP
```

Then deploy: `bash ops/deploy-api.sh`

### 4. Add wildcard DNS + Load Balancer

This requires Cloud Load Balancer + Cloud Armor WAF + wildcard TLS cert — covered in a future runbook.

---

## 12. Rollback Procedure

### Roll back to previous image

```bash
# List recent revisions
gcloud run revisions list \
  --service=churchcore-care-api \
  --region=us-central1 \
  --project=churchcore-care-prod \
  --limit=5

# Route 100% traffic to previous revision
gcloud run services update-traffic churchcore-care-api \
  --region=us-central1 \
  --to-revisions=churchcore-care-api-00042-abc=100 \
  --project=churchcore-care-prod
```

### Roll back DB migrations

Migrations use `addColumnIfMissing` — they are additive only and never destructive. Rolling back code does not require rolling back the DB. If a migration caused a problem, fix it forward in a new migration.

### Roll back worker

```bash
SKIP_BUILD=1 IMAGE_TAG=<previous-sha> bash ops/deploy-worker.sh
```

---

## 13. Cost Estimate (pilot — first customer)

| Resource | Config | Monthly cost |
|---|---|---|
| Cloud Run — API | 1 min instance, ~5K req/day | ~$15 |
| Cloud Run — Worker | 1 always-on instance | ~$10 |
| Cloud SQL | db-f1-micro, 10 GB SSD | ~$10 |
| Artifact Registry | <5 GB images | <$1 |
| Secret Manager | <10K access/mo | <$1 |
| Firebase Hosting | <1 GB/mo transfer | Free |
| **Total** | | **~$36/month** |

Upgrade triggers:
- `db-f1-micro` → `db-g1-small` ($25/mo) when you have > 5-10 concurrent users
- Cloud Run max instances > 5 when traffic exceeds ~100 req/min sustained

---

## Checklist — Before going live

- [ ] GCP HIPAA BAA signed and confirmed
- [ ] `DB_ENCRYPTION_KEY` backed up offline (printed + secure location)
- [ ] `SESSION_SECRET` backed up offline
- [ ] Stripe products and prices created; price IDs in secrets
- [ ] Stripe webhook configured and secret loaded
- [ ] `ops/gcp-setup.sh` completed successfully
- [ ] `ops/secrets-setup.sh` completed with no skipped secrets
- [ ] `ops/deploy-api.sh` completed; health check passes
- [ ] `ops/deploy-worker.sh` completed; worker logs show polling
- [ ] Firebase Hosting deployed; web app loads at Cloud Run URL
- [ ] `ops/smoke-test.sh` all checks pass
- [ ] Custom domain `app.churchcorecare.com` configured (optional for pilot)
- [ ] Stripe webhook URL updated to production URL
- [ ] First practice manually provisioned and staff account created
- [ ] GitHub Actions secrets configured (for CI/CD on next push)

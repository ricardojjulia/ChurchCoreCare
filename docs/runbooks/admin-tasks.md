# Admin Tasks — ChurchCore Care Production Launch

**Last updated:** May 27, 2026
**Audience:** Ricardo Julia (platform operator)
**Scope:** All manual, human-action tasks required before and after first production deploy

This document covers the tasks that cannot be automated: legal agreements, dashboard clicks, account creation, and key decisions. For the technical deployment steps (scripts, Docker, Cloud Run), see [gcp-deployment.md](./gcp-deployment.md).

---

## Table of Contents

1. [Ordering Constraints](#1-ordering-constraints)
2. [Task A — Sign GCP HIPAA BAA](#2-task-a--sign-gcp-hipaa-baa)
3. [Task B — Create GCP Project and Billing Account](#3-task-b--create-gcp-project-and-billing-account)
4. [Task C — Create Third-Party Service Accounts](#4-task-c--create-third-party-service-accounts)
5. [Task D — Create Stripe Products and Prices](#5-task-d--create-stripe-products-and-prices)
6. [Task E — Generate and Store Production Keys](#6-task-e--generate-and-store-production-keys)
7. [Task F — Run GCP Bootstrap Script](#7-task-f--run-gcp-bootstrap-script)
8. [Task G — First Deploy](#8-task-g--first-deploy)
9. [Task H — Configure Stripe Webhook (post-deploy)](#9-task-h--configure-stripe-webhook-post-deploy)
10. [Task I — Firebase Hosting Setup](#10-task-i--firebase-hosting-setup)
11. [Task J — Custom Domain (optional for pilot)](#11-task-j--custom-domain-optional-for-pilot)
12. [Task K — First Customer Provisioning](#12-task-k--first-customer-provisioning)
13. [Task L — Configure GitHub Actions Secrets](#13-task-l--configure-github-actions-secrets)
14. [Master Checklist](#14-master-checklist)

---

## 1. Ordering Constraints

Some tasks have hard dependencies. Breaking this order causes data loss, failed deploys, or HIPAA violations.

```
Task A — HIPAA BAA           ← Must be signed BEFORE any PHI touches Cloud SQL
    │
Task B — GCP Project         ← Must exist before Task F
    │
Task C — Service Accounts    ← Must exist before Task E (need API keys)
    │
Task D — Stripe Products     ← Must exist before Task F (price IDs go into secrets)
    │
Task E — Generate Keys       ← DB_ENCRYPTION_KEY must be backed up offline before Task F
    │
Task F — GCP Bootstrap       ← Creates infra; outputs Cloud SQL connection name
    │
Task G — First Deploy        ← Needs: F complete, all secrets loaded
    │
Task H — Stripe Webhook      ← Needs: G complete (endpoint must be live)
    │
Task I — Firebase Hosting    ← Needs: G complete (Cloud Run URL needed)
    │
Task J — Custom Domain       ← Needs: I complete
Task K — First Customer      ← Needs: G complete
Task L — GitHub Secrets      ← Can be done any time after F and G
```

---

## 2. Task A — Sign GCP HIPAA BAA

**Blocker**: No PHI (client names, clinical notes, session data) may enter Cloud SQL until this is done.

### What it is
Google's Business Associate Agreement (BAA) extends HIPAA coverage to GCP services. Without it, storing PHI in Cloud SQL is a HIPAA violation.

### How to sign

1. Go to [Google Cloud Console](https://console.cloud.google.com) → select your project
2. Navigate to: **IAM & Admin → Settings**
3. Look for the **HIPAA** section or search for "HIPAA" in the search bar
4. Click **Review and Accept the BAA**
5. Review the agreement — note which GCP services are covered
6. Accept on behalf of your organization

**Alternative path**: If you manage Google Workspace:
- Go to `admin.google.com` → Account → Legal → HIPAA Business Associate Agreement

### What's covered
The BAA covers Cloud SQL, Secret Manager, Cloud Run, Cloud Logging, and Artifact Registry when used for PHI. Firebase Hosting (serving static files) is outside scope.

### Timing
- Acceptance is usually immediate in the console
- Allow 1-2 business days if Google's compliance review is triggered
- Check status: Cloud Console → IAM & Admin → Settings → HIPAA

### Verification
```bash
# There is no CLI command to verify BAA status.
# Verify manually in the Cloud Console before proceeding to Task G.
```

---

## 3. Task B — Create GCP Project and Billing Account

### Create the project

```bash
gcloud auth login

gcloud projects create churchcore-care-prod \
  --name="ChurchCore Care Production"
```

If `churchcore-care-prod` is taken (project IDs are globally unique):
```bash
# Use a variation, e.g.:
gcloud projects create churchcorecare-prod-1 --name="ChurchCore Care Production"
```

### Link a billing account

```bash
# List available billing accounts
gcloud billing accounts list

# Link (replace BILLING_ACCOUNT_ID with the ID from above, format: XXXXXX-XXXXXX-XXXXXX)
gcloud billing projects link churchcore-care-prod \
  --billing-account=BILLING_ACCOUNT_ID
```

If you don't have a billing account yet:
1. [Google Cloud Console](https://console.cloud.google.com) → Billing → Manage billing accounts → Create account
2. Add a credit card (required even for free-tier resources)
3. Then run the `billing projects link` command above

### Record the project ID

The project ID (e.g., `churchcore-care-prod`) is used in every subsequent command. Set it as an env var in your shell profile for convenience:

```bash
export GCP_PROJECT=churchcore-care-prod
export GCP_REGION=us-central1
```

---

## 4. Task C — Create Third-Party Service Accounts

Open each service URL below and create an account / generate credentials. You'll fill these into `.env.prod` in Task E.

### Required (deploy will fail without these)

| Service | Sign-up URL | What you need |
|---|---|---|
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) | Secret key (`sk_live_...`), webhook secret (`whsec_...`) |
| SendGrid | [app.sendgrid.com](https://app.sendgrid.com) | API key (`SG....`) |

**Stripe setup notes:**
- Switch to **Live mode** (top-left toggle) before creating live keys
- Go to: Developers → API keys → Create secret key
- Copy the secret key immediately — it is shown only once

**SendGrid setup notes:**
- Go to: Settings → API Keys → Create API key
- Permission: "Mail Send" (restricted key is fine)
- Set up domain authentication for your sending domain to avoid spam filters

### Optional (can deploy without, but features will be disabled)

| Service | Sign-up URL | What you need | Feature gated |
|---|---|---|---|
| Twilio | [console.twilio.com](https://console.twilio.com) | Account SID + Auth Token + phone number | SMS appointment reminders |
| JaaS (8x8) | [jaas.8x8.vc](https://jaas.8x8.vc) | App ID, API key ID, RSA private key | Telehealth video sessions |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) | API key (`sk-ant-...`) | AI session note drafting |

**JaaS setup notes:**
- Sign up for a free JaaS account
- Go to: Credentials → Add key → download the RSA private key (`.pem` file)
- Convert the key for env var: `base64 -w 0 your-key.pem > key.b64` (copy the content to `JITSI_PRIVATE_KEY_BASE64`)
- App ID format: `vpaas-magic-cookie-<hex>`

**Twilio setup notes:**
- After creating the account, go to: Messaging → Phone numbers → Buy a number
- Pick a US toll-free number (~$1/month) for SMS reminders
- Note the full E.164 number (e.g., `+15551234567`) — used as `TWILIO_FROM_NUMBER` in deploy scripts

---

## 5. Task D — Create Stripe Products and Prices

This must be done before Task E (price IDs go into secrets) and Task F (secrets are loaded into GCP).

### Step 1 — Create products

In [Stripe Dashboard](https://dashboard.stripe.com) (Live mode) → Products → Add product:

**Product 1: Solo Plan**
- Name: `ChurchCore Care — Solo`
- Description: `1 counselor seat · 30-day free trial`
- Price:
  - Amount: `$69.00`
  - Billing: Recurring → Monthly
  - Trial period: `30 days`
- Save → copy the **Price ID** (`price_...`)

**Product 2: Group Plan**
- Name: `ChurchCore Care — Group`
- Description: `Up to 3 counselor seats · 30-day free trial`
- Price:
  - Amount: `$99.00`
  - Billing: Recurring → Monthly
  - Trial period: `30 days`
- Save → copy the **Price ID**

**Product 3: Additional Counselor Seat**
- Name: `Additional Counselor Seat`
- Description: `Per-seat add-on for Group plan`
- Price:
  - Amount: `$39.00`
  - Billing: Recurring → Monthly
- Save → copy the **Price ID**

### Step 2 — Record price IDs

You'll use these in Task E:

```
STRIPE_PRICE_SOLO=price_...
STRIPE_PRICE_GROUP=price_...
STRIPE_PRICE_SEAT=price_...
```

### Step 3 — Enable Customer Portal (required for trial → paid conversion)

Stripe Dashboard → Settings → Billing → Customer portal:
- Enable "Allow customers to update their payment method"
- Enable "Allow customers to update subscriptions"
- Enable "Allow customers to cancel subscriptions"
- Set cancellation policy as desired (immediate or at period end)
- Save

The billing portal URL is returned by `POST /v1/billing/subscription/activate` and is what customers use to add their credit card when the trial ends.

---

## 6. Task E — Generate and Store Production Keys

### Step 1 — Generate encryption keys

Run these commands locally. **Do not let these values touch version control.**

```bash
# AES-256-GCM key for PHI field encryption — 64 hex chars (32 bytes)
DB_ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "DB_ENCRYPTION_KEY=$DB_ENCRYPTION_KEY"

# HTTP session signing secret
SESSION_SECRET=$(openssl rand -base64 32)
echo "SESSION_SECRET=$SESSION_SECRET"
```

### Step 2 — Back up keys offline BEFORE continuing

**This is not optional.** The `DB_ENCRYPTION_KEY` encrypts all PHI in the database. If it is lost:
- All client names, clinical notes, assessment data, and session records become unreadable
- There is no recovery path

Backup procedure:
1. Print both keys (DB_ENCRYPTION_KEY and SESSION_SECRET) to paper
2. Store the paper copy in a physically secure location (safe, lockbox, etc.)
3. Consider a second backup in a password manager (1Password, Bitwarden) with vault-level encryption

### Step 3 — Create `.env.prod`

```bash
cp .env.example .env.prod
```

Open `.env.prod` and fill in all values. The file is gitignored and must never be committed. Fields to fill:

```bash
# Required — core infrastructure
NODE_ENV=production
PORT=3001
DB_HOST=/cloudsql/churchcore-care-prod:us-central1:churchcore-pilot
DB_PORT=5432
DB_NAME=churchcore_pilot
DB_USER=churchcore_app
DB_PASSWORD=<from ops/gcp-setup.sh output>
DB_ENCRYPTION_KEY=<generated above>
SESSION_SECRET=<generated above>
APP_BASE_URL=https://app.churchcorecare.com

# Required — Stripe billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # leave blank until Task H; fill after webhook is created
STRIPE_PRICE_SOLO=price_...
STRIPE_PRICE_GROUP=price_...
STRIPE_PRICE_SEAT=price_...

# Required — Email
SENDGRID_API_KEY=SG....

# Optional — AI notes (leave blank to disable feature)
ANTHROPIC_API_KEY=sk-ant-...
AI_NOTES_ENABLED=true

# Optional — SMS reminders (leave blank to disable)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Optional — Telehealth (leave blank to disable)
JITSI_APP_ID=vpaas-magic-cookie-...
JITSI_API_KEY_ID=...
JITSI_PRIVATE_KEY_BASE64=...

# Multi-tenant routing (leave false for pilot)
ENABLE_TENANT_HOST_ROUTING=false
TENANT_STRICT_HOST_ROUTING=false
```

**DB_HOST note**: Cloud Run connects to Cloud SQL via Unix socket. The path format is `/cloudsql/PROJECT:REGION:INSTANCE`. Replace with your actual Cloud SQL connection name (output of `ops/gcp-setup.sh`).

---

## 7. Task F — Run GCP Bootstrap Script

With the GCP project created and billing linked (Task B), run the bootstrap script:

```bash
export GCP_PROJECT=churchcore-care-prod
export GCP_REGION=us-central1
export GITHUB_ORG=ricardojjulia
export GITHUB_REPO=ChurchCoreCare

bash ops/gcp-setup.sh
```

This script is idempotent — safe to re-run if interrupted.

**What it creates:**
- Enables all required GCP APIs (Cloud Run, Cloud SQL, Secret Manager, etc.)
- Artifact Registry repository for Docker images
- Service accounts for API, Worker, and GitHub Actions deploy
- Workload Identity Federation for GitHub Actions (no static keys)
- Cloud SQL PostgreSQL 16 instance (`churchcore-pilot`)
- Secret Manager placeholder secrets

**Save the script output** — it prints:
```
Cloud SQL connection name: churchcore-care-prod:us-central1:churchcore-pilot
DB password (save this in secrets-setup.sh): <GENERATED PASSWORD>
GCP_WORKLOAD_IDENTITY_PROVIDER = projects/.../workloadIdentityPools/github-actions-pool/providers/github-provider
GCP_SERVICE_ACCOUNT = churchcore-deploy@churchcore-care-prod.iam.gserviceaccount.com
```

Update `.env.prod` with the DB password from this output, then load all secrets:

```bash
export GCP_PROJECT=churchcore-care-prod
bash ops/secrets-setup.sh
```

Verify that no secrets were skipped (all required fields were filled):
```bash
gcloud secrets versions list prod-db-encryption-key --project=$GCP_PROJECT
gcloud secrets versions list prod-stripe-secret-key --project=$GCP_PROJECT
```

---

## 8. Task G — First Deploy

With all secrets loaded, deploy both services:

```bash
export GCP_PROJECT=churchcore-care-prod
export GCP_REGION=us-central1
export CLOUDSQL_INSTANCE=churchcore-care-prod:us-central1:churchcore-pilot

# Deploy API (runs DB migrations automatically)
SKIP_MIGRATE=1 bash ops/deploy-api.sh

# Deploy Worker
bash ops/deploy-worker.sh
```

After both deploys succeed, verify health:

```bash
# Get the Cloud Run URL
gcloud run services describe churchcore-care-api \
  --region=us-central1 \
  --project=$GCP_PROJECT \
  --format='value(status.url)'

# Run smoke tests
export API_URL=<URL from above>
bash ops/smoke-test.sh
```

All smoke test checks should pass. If the `/health/ready` check fails, the API cannot reach Cloud SQL — see Monitoring & Logs in [gcp-deployment.md](./gcp-deployment.md#10-monitoring--logs).

---

## 9. Task H — Configure Stripe Webhook (post-deploy)

The webhook endpoint must exist (live API URL) before this can be configured.

### Step 1 — Create the webhook in Stripe Dashboard

1. [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks → Add endpoint
2. **Endpoint URL**: `https://app.churchcorecare.com/api/webhooks/stripe`
   - If Firebase / custom domain is not set up yet, use the Cloud Run URL: `https://<CLOUD_RUN_URL>/api/webhooks/stripe`
3. **Events to listen for** (select all six):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Click **Add endpoint**
5. Reveal the **Signing secret** (`whsec_...`) — copy it immediately

### Step 2 — Load the webhook secret

```bash
# Fill STRIPE_WEBHOOK_SECRET in .env.prod, then push that single secret
export GCP_PROJECT=churchcore-care-prod
bash ops/secrets-setup.sh --only prod-stripe-webhook-secret
```

### Step 3 — Redeploy the API

The API must reload its environment to pick up the new secret:

```bash
SKIP_BUILD=1 bash ops/deploy-api.sh
```

### Step 4 — Verify webhook delivery

In Stripe Dashboard → Webhooks → select your endpoint → view recent deliveries. Send a test event:

```bash
stripe trigger customer.subscription.created
```

Check API logs for incoming webhook processing:

```bash
gcloud run services logs tail churchcore-care-api \
  --region=us-central1 --project=$GCP_PROJECT | grep webhook
```

---

## 10. Task I — Firebase Hosting Setup

Firebase Hosting serves the web SPA and proxies `/api/**` to Cloud Run.

### Step 1 — Connect Firebase project

```bash
firebase login

# Link GCP project as the Firebase project
firebase use --add
# Select project: churchcore-care-prod
# Alias: production
```

### Step 2 — Configure `.firebaserc`

This file is gitignored (it contains your project ID):

```bash
cp .firebaserc.example .firebaserc
```

Edit `.firebaserc`:
```json
{
  "projects": {
    "default": "churchcore-care-prod",
    "production": "churchcore-care-prod"
  }
}
```

### Step 3 — Verify `firebase.json`

The `firebase.json` at the repo root should have `"serviceId": "churchcore-care-api"`. Verify this matches the Cloud Run service name from `ops/deploy-api.sh`:

```bash
grep serviceId firebase.json
# Should output: "serviceId": "churchcore-care-api"
```

### Step 4 — Build and deploy the web app

```bash
pnpm --filter web build
firebase deploy --only hosting --project=production
```

Firebase prints the hosting URL (e.g., `https://churchcore-care-prod.web.app`). Visit it to confirm the app loads and `/signup` renders the signup page.

### Step 5 — Run smoke tests against Firebase URL

```bash
export API_URL=https://churchcore-care-prod.web.app
bash ops/smoke-test.sh
```

---

## 11. Task J — Custom Domain (optional for pilot)

Custom domain (`app.churchcorecare.com`) is optional for the initial pilot but required before marketing the product publicly.

### Step 1 — Add domain in Firebase Console

1. [Firebase Console](https://console.firebase.google.com) → Hosting → Add custom domain
2. Enter: `app.churchcorecare.com`
3. Firebase provides DNS records for verification

### Step 2 — Add DNS records

In your DNS provider (Namecheap, Cloudflare, Route 53, etc.), add the records Firebase gives you. Typical set:

```
Type   Name                       Value
TXT    app.churchcorecare.com     firebase-domain-verify=<token>
A      app.churchcorecare.com     <IP-1>
A      app.churchcorecare.com     <IP-2>
```

DNS propagation: 15 minutes to 24 hours depending on provider.

### Step 3 — Wait for TLS certificate

Firebase provisions a Let's Encrypt certificate automatically within 24 hours of DNS verification. Status: Firebase Console → Hosting → Custom domains.

### Step 4 — Update Stripe webhook URL

Once `app.churchcorecare.com` is live, update the Stripe webhook endpoint URL from the Cloud Run URL to the custom domain:

Stripe Dashboard → Webhooks → select endpoint → Update details → change URL to:
```
https://app.churchcorecare.com/api/webhooks/stripe
```

### Step 5 — Run final smoke tests

```bash
export API_URL=https://app.churchcorecare.com
bash ops/smoke-test.sh
```

---

## 12. Task K — First Customer Provisioning

For the initial pilot, provision the first practice manually. The self-serve signup page at `/signup` handles subsequent customers automatically.

### Option A — Self-serve signup (recommended after pilot)

Direct the customer to:
```
https://app.churchcorecare.com/signup
```

They fill out the form (practice name, slug, plan, email, password). The API creates the Stripe trial subscription automatically and returns their practice URL.

### Option B — Manual provisioning (for first pilot customer)

If you want to provision manually (e.g., to onboard someone before the signup page is polished):

```bash
# 1. Connect to Cloud SQL via Auth Proxy
gcloud auth application-default login
cloud_sql_proxy churchcore-care-prod:us-central1:churchcore-pilot &

# 2. Connect to DB
psql "host=127.0.0.1 port=5432 dbname=churchcore_pilot user=churchcore_app password=<DB_PASSWORD>"

# 3. Create a staff account (run inside psql)
-- Use argon2-hashed password — do NOT insert a plaintext password
-- Hash the password using the API's /v1/auth/... flow instead of direct insert
-- Or provision by calling POST /v1/platform/signup via curl:
```

```bash
# Manual API-based signup (easiest):
curl -X POST https://app.churchcorecare.com/api/v1/platform/signup \
  -H "Content-Type: application/json" \
  -d '{
    "practiceName": "Grace Counseling Center",
    "slug": "gracecounseling",
    "ownerEmail": "pastor@gracecenter.org",
    "password": "SecureInitialPassword1!",
    "planKey": "solo"
  }'
```

The API creates the Stripe customer and trial subscription, registers the slug, and returns the practice URL. Share the practice URL and credentials with the customer.

### What happens on first login

1. Customer navigates to `https://app.churchcorecare.com` (or their practice URL)
2. Logs in with email + password from signup
3. They are in a 30-day free trial — no credit card required
4. When the trial approaches expiration, the worker sends reminder emails (7-day and 1-day)
5. Customer clicks "Activate Subscription" in Settings → Billing → redirected to Stripe Billing Portal to add payment method

---

## 13. Task L — Configure GitHub Actions Secrets

Required for CI/CD to deploy automatically on `git push main`.

Go to: [github.com/ricardojjulia/ChurchCoreCare](https://github.com/ricardojjulia/ChurchCoreCare) → Settings → Secrets and variables → Actions → New repository secret

| Secret name | Value | Where to get |
|---|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/.../providers/github-provider` | Output of `ops/gcp-setup.sh` |
| `GCP_SERVICE_ACCOUNT` | `churchcore-deploy@PROJECT.iam.gserviceaccount.com` | Output of `ops/gcp-setup.sh` |
| `GCP_PROJECT` | `churchcore-care-prod` | Your GCP project ID |
| `GCP_REGION` | `us-central1` | Deployment region |
| `FIREBASE_PROJECT_ID` | `churchcore-care-prod` | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | Service account JSON (one line) | Firebase Console → Project Settings → Service Accounts → Generate new key |
| `TWILIO_FROM_NUMBER` | `+15551234567` | Twilio console → Phone numbers |
| `PROD_DB_ENCRYPTION_KEY` | 64-char hex string | Same as `prod-db-encryption-key` in Secret Manager |

**Getting the Firebase service account JSON:**
1. [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts
2. Click "Generate new private key" → download `.json` file
3. Minify to one line: `cat key.json | jq -c . | pbcopy`
4. Paste as the secret value

After adding all secrets, push a commit to `main` and verify the Actions workflow completes successfully.

---

## 14. Master Checklist

Use this before declaring the platform ready for customers.

### Pre-deploy (must be complete before Task G)

- [ ] **Task A** — GCP HIPAA BAA signed and confirmed in Cloud Console
- [ ] **Task B** — GCP project created; billing account linked
- [ ] **Task C** — Stripe account created (Live mode); SendGrid account created
- [ ] **Task D** — All three Stripe products and prices created; price IDs recorded
- [ ] **Task D** — Stripe Customer Portal enabled
- [ ] **Task E** — `DB_ENCRYPTION_KEY` generated with `openssl rand -hex 32`
- [ ] **Task E** — `DB_ENCRYPTION_KEY` and `SESSION_SECRET` backed up offline (paper + password manager)
- [ ] **Task E** — `.env.prod` fully filled (no `changeme` or empty required fields)
- [ ] **Task F** — `ops/gcp-setup.sh` completed successfully
- [ ] **Task F** — `ops/secrets-setup.sh` completed with no skipped required secrets
- [ ] Verify: `gcloud secrets versions list prod-db-encryption-key` shows version 1

### Deploy

- [ ] **Task G** — `ops/deploy-api.sh` completed; health check `GET /health/ready` returns 200
- [ ] **Task G** — `ops/deploy-worker.sh` completed; worker logs show polling loop active
- [ ] **Task G** — `ops/smoke-test.sh` all checks pass

### Post-deploy

- [ ] **Task H** — Stripe webhook endpoint created at `/api/webhooks/stripe`
- [ ] **Task H** — All six webhook events selected
- [ ] **Task H** — `STRIPE_WEBHOOK_SECRET` loaded into Secret Manager; API redeployed
- [ ] **Task H** — Test webhook delivery verified in Stripe Dashboard
- [ ] **Task I** — Firebase Hosting deployed; web app loads
- [ ] **Task I** — Signup page accessible at `https://<project>.web.app/signup`
- [ ] **Task I** — Smoke tests pass against Firebase URL
- [ ] **Task J** — (optional pilot) Custom domain `app.churchcorecare.com` configured
- [ ] **Task J** — (optional) TLS certificate active; smoke tests pass on custom domain
- [ ] **Task K** — First customer provisioned; they can log in
- [ ] **Task L** — GitHub Actions secrets configured; CI/CD workflow passes on push to main

### Security verification (do before first real client data)

- [ ] HIPAA BAA status confirmed in Cloud Console (not just submitted)
- [ ] `DB_ENCRYPTION_KEY` is not the `changeme-...` placeholder value
- [ ] `.env.prod` is not committed to git (`git status` shows no `.env.prod`)
- [ ] Stripe is in **Live mode** (not Test mode) for production keys
- [ ] `NODE_ENV=production` is set in Cloud Run (confirmed in deploy logs)
- [ ] `DB_SSL=true` is set in `.env.prod` (Cloud SQL proxy handles TLS; set for consistency)

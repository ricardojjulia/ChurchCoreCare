#!/usr/bin/env bash
# ops/gcp-setup.sh — idempotent GCP project bootstrap for ChurchCore Care
#
# Run once per environment to create all required GCP resources.
# Safe to re-run: every command is idempotent.
#
# Prerequisites:
#   gcloud CLI installed and authenticated (gcloud auth login)
#   jq installed (brew install jq)
#
# Usage:
#   export GCP_PROJECT=churchcore-care-prod
#   export GCP_REGION=us-central1
#   bash ops/gcp-setup.sh

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
: "${GCP_PROJECT:?Set GCP_PROJECT (e.g. churchcore-care-prod)}"
: "${GCP_REGION:=us-central1}"

REGISTRY_REPO="churchcore"
CLOUDSQL_INSTANCE="churchcore-pilot"
CLOUDSQL_DB="churchcore_pilot"
CLOUDSQL_USER="churchcore_app"
GITHUB_ORG="${GITHUB_ORG:-ricardojjulia}"
GITHUB_REPO="${GITHUB_REPO:-ChurchCoreCare}"

log() { echo "▶ $*"; }

# ── 1. Set project ────────────────────────────────────────────────────────────
log "Setting active project to $GCP_PROJECT"
gcloud config set project "$GCP_PROJECT"

# ── 2. Enable required APIs ───────────────────────────────────────────────────
log "Enabling APIs (this can take 1-2 minutes on first run)..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  firebase.googleapis.com \
  --quiet

log "APIs enabled."

# ── 3. Artifact Registry ──────────────────────────────────────────────────────
log "Creating Artifact Registry repository: $REGISTRY_REPO"
gcloud artifacts repositories create "$REGISTRY_REPO" \
  --repository-format=docker \
  --location="$GCP_REGION" \
  --description="ChurchCore Care Docker images" \
  --quiet 2>/dev/null || log "  (already exists, skipping)"

# ── 4. Service accounts ───────────────────────────────────────────────────────
log "Creating service accounts..."

create_sa() {
  local name="$1" display="$2"
  gcloud iam service-accounts create "$name" \
    --display-name="$display" \
    --quiet 2>/dev/null || true
  echo "${name}@${GCP_PROJECT}.iam.gserviceaccount.com"
}

SA_API=$(create_sa "churchcore-api" "ChurchCore Care API (Cloud Run)")
SA_WORKER=$(create_sa "churchcore-worker" "ChurchCore Care Worker (Cloud Run)")
SA_DEPLOY=$(create_sa "churchcore-deploy" "ChurchCore Care GitHub Deploy")

log "  API SA:    $SA_API"
log "  Worker SA: $SA_WORKER"
log "  Deploy SA: $SA_DEPLOY"

# ── 5. IAM bindings ───────────────────────────────────────────────────────────
log "Granting IAM roles..."

bind() {
  gcloud projects add-iam-policy-binding "$GCP_PROJECT" \
    --member="serviceAccount:$1" --role="$2" --quiet 2>/dev/null || true
}

# API service account
bind "$SA_API" "roles/cloudsql.client"
bind "$SA_API" "roles/secretmanager.secretAccessor"
bind "$SA_API" "roles/run.invoker"

# Worker service account
bind "$SA_WORKER" "roles/cloudsql.client"
bind "$SA_WORKER" "roles/secretmanager.secretAccessor"

# Deploy service account (used by GitHub Actions)
bind "$SA_DEPLOY" "roles/run.developer"
bind "$SA_DEPLOY" "roles/artifactregistry.writer"
bind "$SA_DEPLOY" "roles/iam.serviceAccountUser"
bind "$SA_DEPLOY" "roles/secretmanager.viewer"
bind "$SA_DEPLOY" "roles/firebase.developAdmin"

log "IAM roles granted."

# ── 6. Workload Identity Federation (GitHub Actions — no static keys) ─────────
log "Setting up Workload Identity Federation for GitHub Actions..."

POOL_ID="github-actions-pool"
PROVIDER_ID="github-provider"

# Create pool
gcloud iam workload-identity-pools create "$POOL_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --quiet 2>/dev/null || log "  (pool already exists)"

POOL_RESOURCE="projects/$(gcloud projects describe "$GCP_PROJECT" --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_ID}"

# Create OIDC provider
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
  --workload-identity-pool="$POOL_ID" \
  --location="global" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
  --attribute-condition="assertion.repository=='${GITHUB_ORG}/${GITHUB_REPO}'" \
  --quiet 2>/dev/null || log "  (provider already exists)"

# Bind deploy SA to pool (allow GitHub Actions from this repo to impersonate it)
gcloud iam service-accounts add-iam-policy-binding "$SA_DEPLOY" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_RESOURCE}/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}" \
  --quiet 2>/dev/null || true

PROVIDER_RESOURCE="${POOL_RESOURCE}/providers/${PROVIDER_ID}"
log "Workload Identity Provider: $PROVIDER_RESOURCE"
log ""
log "  Add these as GitHub secrets:"
log "  GCP_WORKLOAD_IDENTITY_PROVIDER = $PROVIDER_RESOURCE"
log "  GCP_SERVICE_ACCOUNT            = $SA_DEPLOY"
log "  GCP_PROJECT                    = $GCP_PROJECT"
log "  GCP_REGION                     = $GCP_REGION"

# ── 7. Cloud SQL — PostgreSQL ─────────────────────────────────────────────────
log "Creating Cloud SQL PostgreSQL instance: $CLOUDSQL_INSTANCE"
log "  (First-time creation takes 3-5 minutes...)"

gcloud sql instances create "$CLOUDSQL_INSTANCE" \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region="$GCP_REGION" \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup \
  --backup-start-time=04:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=5 \
  --deletion-protection \
  --quiet 2>/dev/null || log "  (instance already exists)"

log "Creating database: $CLOUDSQL_DB"
gcloud sql databases create "$CLOUDSQL_DB" \
  --instance="$CLOUDSQL_INSTANCE" \
  --quiet 2>/dev/null || log "  (database already exists)"

log "Creating DB user: $CLOUDSQL_USER"
DB_PASSWORD=$(openssl rand -hex 24)
gcloud sql users create "$CLOUDSQL_USER" \
  --instance="$CLOUDSQL_INSTANCE" \
  --password="$DB_PASSWORD" \
  --quiet 2>/dev/null || log "  (user already exists — password NOT rotated)"

CLOUDSQL_CONNECTION_NAME="${GCP_PROJECT}:${GCP_REGION}:${CLOUDSQL_INSTANCE}"
log ""
log "  Cloud SQL connection name: $CLOUDSQL_CONNECTION_NAME"
log "  DB password (save this in secrets-setup.sh): $DB_PASSWORD"

# ── 8. Secret Manager placeholders ────────────────────────────────────────────
log "Creating Secret Manager secret placeholders..."

create_secret() {
  gcloud secrets create "$1" \
    --replication-policy=automatic \
    --quiet 2>/dev/null || true
}

for secret in \
  prod-db-password \
  prod-db-encryption-key \
  prod-session-secret \
  prod-stripe-secret-key \
  prod-stripe-webhook-secret \
  prod-stripe-price-solo \
  prod-stripe-price-group \
  prod-stripe-price-seat \
  prod-anthropic-api-key \
  prod-sendgrid-api-key \
  prod-twilio-account-sid \
  prod-twilio-auth-token \
  prod-jitsi-app-id \
  prod-jitsi-api-key-id \
  prod-jitsi-private-key; do
  create_secret "$secret"
done

log "Secrets created (empty — run ops/secrets-setup.sh to populate)."

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  GCP Setup Complete"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Project:              $GCP_PROJECT"
echo "  Region:               $GCP_REGION"
echo "  Registry:             ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${REGISTRY_REPO}"
echo "  Cloud SQL:            $CLOUDSQL_CONNECTION_NAME"
echo "  Database:             $CLOUDSQL_DB"
echo ""
echo "  Next steps:"
echo "  1. Run: bash ops/secrets-setup.sh"
echo "  2. Run: bash ops/deploy-api.sh"
echo "  3. Run: bash ops/deploy-worker.sh"
echo "  4. Run: bash ops/smoke-test.sh"
echo ""

#!/usr/bin/env bash
# ops/deploy-api.sh — build and deploy apps/api to Cloud Run
#
# Usage:
#   export GCP_PROJECT=churchcore-care-prod
#   export GCP_REGION=us-central1
#   bash ops/deploy-api.sh
#
# Optional env vars:
#   IMAGE_TAG     — git SHA or tag to deploy (default: current HEAD SHA)
#   SERVICE_NAME  — Cloud Run service name (default: churchcore-care-api)
#   SKIP_BUILD    — set to 1 to skip docker build/push (deploy existing tag)

set -euo pipefail

: "${GCP_PROJECT:?Set GCP_PROJECT}"
: "${GCP_REGION:=us-central1}"

SERVICE_NAME="${SERVICE_NAME:-churchcore-care-api}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"
REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/churchcore"
IMAGE="${REGISTRY}/api:${IMAGE_TAG}"
CLOUDSQL_INSTANCE="${CLOUDSQL_INSTANCE:-${GCP_PROJECT}:${GCP_REGION}:churchcore-pilot}"
MIN_INSTANCES="${MIN_INSTANCES:-1}"
MAX_INSTANCES="${MAX_INSTANCES:-5}"

log() { echo "▶ $*"; }

# ── Build & push Docker image ─────────────────────────────────────────────────
if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  log "Authenticating Docker to Artifact Registry..."
  gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

  log "Building API image: $IMAGE"
  docker build \
    --file apps/api/Dockerfile \
    --tag "$IMAGE" \
    --tag "${REGISTRY}/api:latest" \
    --platform linux/amd64 \
    .

  log "Pushing image..."
  docker push "$IMAGE"
  docker push "${REGISTRY}/api:latest"
  log "Image pushed: $IMAGE"
fi

# ── Run DB migrations before deploy ──────────────────────────────────────────
log "Running database migrations..."
# Migrations run via the local node (requires DB_HOST accessible from this machine,
# or run inside Cloud Shell/Cloud Build). Skip with SKIP_MIGRATE=1 if needed.
if [[ "${SKIP_MIGRATE:-0}" != "1" ]]; then
  NODE_ENV=production node apps/api/src/db/migrate.js
  log "Migrations complete."
else
  log "SKIP_MIGRATE=1 — skipping migrations."
fi

# ── Deploy to Cloud Run ───────────────────────────────────────────────────────
log "Deploying $SERVICE_NAME to Cloud Run ($GCP_REGION)..."

gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$GCP_REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --service-account="churchcore-api@${GCP_PROJECT}.iam.gserviceaccount.com" \
  --add-cloudsql-instances="$CLOUDSQL_INSTANCE" \
  --set-secrets="\
DB_ENCRYPTION_KEY=prod-db-encryption-key:latest,\
SESSION_SECRET=prod-session-secret:latest,\
STRIPE_SECRET_KEY=prod-stripe-secret-key:latest,\
STRIPE_WEBHOOK_SECRET=prod-stripe-webhook-secret:latest,\
STRIPE_PRICE_SOLO=prod-stripe-price-solo:latest,\
STRIPE_PRICE_GROUP=prod-stripe-price-group:latest,\
STRIPE_PRICE_SEAT=prod-stripe-price-seat:latest,\
ANTHROPIC_API_KEY=prod-anthropic-api-key:latest,\
SENDGRID_API_KEY=prod-sendgrid-api-key:latest,\
TWILIO_ACCOUNT_SID=prod-twilio-account-sid:latest,\
TWILIO_AUTH_TOKEN=prod-twilio-auth-token:latest,\
JITSI_APP_ID=prod-jitsi-app-id:latest,\
JITSI_API_KEY_ID=prod-jitsi-api-key-id:latest,\
JITSI_PRIVATE_KEY_BASE64=prod-jitsi-private-key:latest" \
  --set-env-vars="\
NODE_ENV=production,\
PORT=3001,\
DB_HOST=/cloudsql/${CLOUDSQL_INSTANCE},\
DB_PORT=5432,\
DB_NAME=churchcore_pilot,\
DB_USER=churchcore_app,\
DB_SSL=false,\
AI_NOTES_ENABLED=true,\
JITSI_DOMAIN=8x8.vc,\
VITE_JITSI_DOMAIN=8x8.vc,\
SENDGRID_FROM_EMAIL=noreply@churchcorecare.com,\
APP_BASE_URL=https://app.churchcorecare.com,\
ALLOWED_ORIGINS=https://app.churchcorecare.com,\
ENABLE_TENANT_HOST_ROUTING=false,\
SEED_DEV_PORTAL_DATA=false" \
  --min-instances="$MIN_INSTANCES" \
  --max-instances="$MAX_INSTANCES" \
  --cpu=1 \
  --memory=512Mi \
  --timeout=60 \
  --concurrency=80 \
  --quiet

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --format='value(status.url)')

log "API deployed: $SERVICE_URL"
log "Health check: $SERVICE_URL/health/live"

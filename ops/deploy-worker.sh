#!/usr/bin/env bash
# ops/deploy-worker.sh — build and deploy apps/worker to Cloud Run
#
# The worker runs as a long-lived background service (always-on, 1 instance).
# It is NOT publicly accessible — no-allow-unauthenticated.
#
# Usage:
#   export GCP_PROJECT=churchcore-care-prod
#   export GCP_REGION=us-central1
#   bash ops/deploy-worker.sh

set -euo pipefail

: "${GCP_PROJECT:?Set GCP_PROJECT}"
: "${GCP_REGION:=us-central1}"

SERVICE_NAME="${SERVICE_NAME:-churchcore-care-worker}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"
REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/churchcore"
IMAGE="${REGISTRY}/worker:${IMAGE_TAG}"
CLOUDSQL_INSTANCE="${CLOUDSQL_INSTANCE:-${GCP_PROJECT}:${GCP_REGION}:churchcore-pilot}"
TWILIO_FROM_NUMBER="${TWILIO_FROM_NUMBER:-}"

log() { echo "▶ $*"; }

# ── Build & push Docker image ─────────────────────────────────────────────────
if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  log "Authenticating Docker to Artifact Registry..."
  gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

  log "Building Worker image: $IMAGE"
  docker build \
    --file apps/worker/Dockerfile \
    --tag "$IMAGE" \
    --tag "${REGISTRY}/worker:latest" \
    --platform linux/amd64 \
    .

  log "Pushing image..."
  docker push "$IMAGE"
  docker push "${REGISTRY}/worker:latest"
  log "Image pushed: $IMAGE"
fi

# ── Deploy to Cloud Run ───────────────────────────────────────────────────────
log "Deploying $SERVICE_NAME to Cloud Run ($GCP_REGION)..."

TWILIO_FROM_ENV=""
if [[ -n "$TWILIO_FROM_NUMBER" ]]; then
  TWILIO_FROM_ENV=",TWILIO_FROM_NUMBER=${TWILIO_FROM_NUMBER}"
fi

gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$GCP_REGION" \
  --platform=managed \
  --no-allow-unauthenticated \
  --service-account="churchcore-worker@${GCP_PROJECT}.iam.gserviceaccount.com" \
  --add-cloudsql-instances="$CLOUDSQL_INSTANCE" \
  --set-secrets="\
DB_ENCRYPTION_KEY=prod-db-encryption-key:latest,\
SENDGRID_API_KEY=prod-sendgrid-api-key:latest,\
TWILIO_ACCOUNT_SID=prod-twilio-account-sid:latest,\
TWILIO_AUTH_TOKEN=prod-twilio-auth-token:latest" \
  --set-env-vars="\
NODE_ENV=production,\
DB_HOST=/cloudsql/${CLOUDSQL_INSTANCE},\
DB_PORT=5432,\
DB_NAME=churchcore_pilot,\
DB_USER=churchcore_app,\
DB_SSL=false,\
SENDGRID_FROM_EMAIL=noreply@churchcorecare.com${TWILIO_FROM_ENV}" \
  --min-instances=1 \
  --max-instances=1 \
  --cpu=1 \
  --memory=256Mi \
  --timeout=3600 \
  --no-cpu-throttling \
  --quiet

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --format='value(status.url)')

log "Worker deployed (internal only): $SERVICE_URL"
log ""
log "Note: The worker polls for reminders every 60s and provisions tenants every 15s."
log "      Verify it is running: gcloud run services describe $SERVICE_NAME --region=$GCP_REGION"

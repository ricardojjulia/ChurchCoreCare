#!/usr/bin/env bash
# ops/secrets-setup.sh — load production secrets into GCP Secret Manager
#
# Reads values from a .env.prod file (never committed) and pushes each
# secret into Secret Manager as a new version.
#
# Usage:
#   cp .env.example .env.prod
#   # Fill in all values in .env.prod
#   export GCP_PROJECT=churchcore-care-prod
#   bash ops/secrets-setup.sh
#
# To update a single secret:
#   bash ops/secrets-setup.sh --only prod-stripe-secret-key

set -euo pipefail

: "${GCP_PROJECT:?Set GCP_PROJECT}"

ENV_FILE="${ENV_FILE:-.env.prod}"
ONLY="${2:-}"

log() { echo "▶ $*"; }
warn() { echo "⚠ $*" >&2; }

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found."
  echo "  cp .env.example $ENV_FILE"
  echo "  # Fill in all production values"
  exit 1
fi

# ── Load env file ──────────────────────────────────────────────────────────────
declare -A ENV_VALS
while IFS= read -r line; do
  [[ "$line" =~ ^#.*$ ]] && continue
  [[ -z "$line" ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  ENV_VALS["$key"]="$val"
done < "$ENV_FILE"

# ── Secret map: env var → Secret Manager secret name ──────────────────────────
declare -A SECRET_MAP=(
  ["DB_PASSWORD"]="prod-db-password"
  ["DB_ENCRYPTION_KEY"]="prod-db-encryption-key"
  ["SESSION_SECRET"]="prod-session-secret"
  ["STRIPE_SECRET_KEY"]="prod-stripe-secret-key"
  ["STRIPE_WEBHOOK_SECRET"]="prod-stripe-webhook-secret"
  ["STRIPE_PRICE_SOLO"]="prod-stripe-price-solo"
  ["STRIPE_PRICE_GROUP"]="prod-stripe-price-group"
  ["STRIPE_PRICE_SEAT"]="prod-stripe-price-seat"
  ["ANTHROPIC_API_KEY"]="prod-anthropic-api-key"
  ["SENDGRID_API_KEY"]="prod-sendgrid-api-key"
  ["TWILIO_ACCOUNT_SID"]="prod-twilio-account-sid"
  ["TWILIO_AUTH_TOKEN"]="prod-twilio-auth-token"
  ["JITSI_APP_ID"]="prod-jitsi-app-id"
  ["JITSI_API_KEY_ID"]="prod-jitsi-api-key-id"
  ["JITSI_PRIVATE_KEY_BASE64"]="prod-jitsi-private-key"
)

push_secret() {
  local env_key="$1"
  local secret_name="$2"
  local value="${ENV_VALS[$env_key]:-}"

  if [[ -z "$value" ]]; then
    warn "  SKIP $secret_name — $env_key is empty in $ENV_FILE"
    return
  fi

  log "  Pushing $secret_name"
  echo -n "$value" | gcloud secrets versions add "$secret_name" \
    --data-file=- \
    --project="$GCP_PROJECT" \
    --quiet
}

echo ""
log "Loading secrets into GCP Secret Manager (project: $GCP_PROJECT)"
echo ""

if [[ -n "$ONLY" ]]; then
  # Find the env key for this secret name and push just that one
  for env_key in "${!SECRET_MAP[@]}"; do
    if [[ "${SECRET_MAP[$env_key]}" == "$ONLY" ]]; then
      push_secret "$env_key" "$ONLY"
      exit 0
    fi
  done
  echo "ERROR: unknown secret name '$ONLY'"
  exit 1
fi

for env_key in "${!SECRET_MAP[@]}"; do
  push_secret "$env_key" "${SECRET_MAP[$env_key]}"
done

echo ""
log "Done. Verify with:"
echo "  gcloud secrets versions list prod-db-encryption-key --project=$GCP_PROJECT"
echo ""

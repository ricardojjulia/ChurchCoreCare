#!/usr/bin/env bash
# ops/smoke-test.sh — post-deploy health and sanity checks
#
# Usage:
#   export API_URL=https://churchcore-care-api-xxxx-uc.a.run.app
#   bash ops/smoke-test.sh
#
# Or after Firebase deploy:
#   export API_URL=https://app.churchcorecare.com
#   bash ops/smoke-test.sh

set -euo pipefail

: "${API_URL:?Set API_URL (Cloud Run URL or custom domain)}"

PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local actual

  actual=$(curl --silent --max-time 10 --fail "$url" 2>/dev/null || echo "CURL_FAILED")

  if echo "$actual" | grep -q "$expected"; then
    echo "  ✓ $label"
    (( PASS++ )) || true
  else
    echo "  ✗ $label"
    echo "    URL:      $url"
    echo "    Expected: $expected"
    echo "    Got:      ${actual:0:200}"
    (( FAIL++ )) || true
  fi
}

check_status() {
  local label="$1"
  local url="$2"
  local expected_status="$3"
  local actual_status

  actual_status=$(curl --silent --max-time 10 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [[ "$actual_status" == "$expected_status" ]]; then
    echo "  ✓ $label (HTTP $actual_status)"
    (( PASS++ )) || true
  else
    echo "  ✗ $label"
    echo "    URL:      $url"
    echo "    Expected: HTTP $expected_status"
    echo "    Got:      HTTP $actual_status"
    (( FAIL++ )) || true
  fi
}

echo ""
echo "ChurchCore Care — Smoke Tests"
echo "Target: $API_URL"
echo ""

# ── Liveness + readiness ──────────────────────────────────────────────────────
echo "── Health endpoints ──"
check "liveness" "$API_URL/health/live" '"status":"ok"'
check "readiness" "$API_URL/health/ready" '"status"'

# ── Auth boundary ─────────────────────────────────────────────────────────────
echo ""
echo "── Auth boundaries ──"
check_status "unauthenticated /v1/clients returns 401" "$API_URL/v1/clients" "401"
check_status "unauthenticated /v1/billing/subscription returns 401" "$API_URL/v1/billing/subscription" "401"

# ── Webhook endpoint reachable (not authenticated, but should not 404) ────────
echo ""
echo "── Webhook endpoints ──"
# POST without sig should return 400, not 404 — confirms route is registered
actual_webhook=$(curl --silent --max-time 10 -o /dev/null -w "%{http_code}" -X POST "$API_URL/webhooks/stripe" 2>/dev/null || echo "000")
if [[ "$actual_webhook" == "400" || "$actual_webhook" == "401" ]]; then
  echo "  ✓ /webhooks/stripe is registered (HTTP $actual_webhook)"
  (( PASS++ )) || true
else
  echo "  ✗ /webhooks/stripe unexpected status: HTTP $actual_webhook"
  (( FAIL++ )) || true
fi

# ── Insurance billing gate (should be 404 for most practices) ─────────────────
echo ""
echo "── Feature gates ──"
check_status "insurance billing gated by default (expect 401 or 404)" "$API_URL/v1/billing/claims" "401"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
if [[ $FAIL -eq 0 ]]; then
  echo "  ✓ All $PASS checks passed"
  echo "═══════════════════════════════════════════"
  exit 0
else
  echo "  ✗ $FAIL check(s) failed / $PASS passed"
  echo "═══════════════════════════════════════════"
  exit 1
fi

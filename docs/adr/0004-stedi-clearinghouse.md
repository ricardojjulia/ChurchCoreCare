# ADR-0004 — Use Stedi for EDI Clearinghouse

**Date:** 2026-05-26  
**Status:** Accepted  
**Deciders:** Engineering

---

## Context

ChurchCore Care needs to submit insurance claims electronically (EDI 837P) and receive electronic remittance advice (EDI 835 ERA) to close the billing loop for practices that accept insurance. Real-time insurance eligibility verification (EDI 270/271) is also required before scheduling appointments.

Requirements:
- 837P claim submission to major payers
- Real-time 270/271 eligibility verification (2–5 second response time)
- 835 ERA receipt and parsing
- REST API (not FTP/SFTP batch) to fit the existing Node.js architecture
- Transparent, usage-based pricing

## Decision

Use **Stedi** as the EDI clearinghouse for all 837P claim submission, 270/271 eligibility, and 835 ERA processing.

Stedi exposes all EDI transactions through a unified HTTPS REST API authenticated by a single `STEDI_API_KEY`. The three integration surfaces are:

| Surface | Endpoint | Use |
|---|---|---|
| Eligibility | `POST /eligibility` | Real-time 270/271 before appointments |
| Claim submission | `POST /claim-submission` | 837P submit |
| Claim status | `GET /claim-status/:id` | Poll submission status |

An EDI status poller worker (`apps/worker/src/edi-status-poller.js`) queries Stedi every 60 seconds for submitted claims and transitions them to `accepted` or `rejected` in the local `claims` table.

## Consequences

**Positive:**
- API-first design fits the existing Node.js ESM fetch-based architecture with no SDK dependency
- Single API key reduces secrets surface compared to payer-specific credentials
- Stedi handles payer enrollment, claim format validation, and 835 parsing
- Transparent per-transaction pricing scales to zero when not in use

**Negative:**
- Payer coverage depends on Stedi's network — niche payers may not be reachable
- Stedi is a startup-scale vendor; availability SLA must be monitored
- Claim status polling adds background worker load; push notifications are not yet available

**Mitigations:**
- All Stedi calls are wrapped in try/catch → 503 responses; no raw errors reach clients
- `STEDI_API_KEY` absence gates the feature entirely so the app functions without EDI configured
- The status poller uses `LIMIT 50` per run to bound DB and network load

## Alternatives Considered

| Alternative | Why Not Chosen |
|---|---|
| Office Ally | FTP-based batch; incompatible with real-time eligibility requirement |
| Change Healthcare (Optum) | Per-payer enrollment complexity; no unified REST API |
| Availity | Primarily portal-based; REST API requires payer-specific setup |
| Direct payer EDI | Requires separate enrollment with each payer; infeasible at current scale |

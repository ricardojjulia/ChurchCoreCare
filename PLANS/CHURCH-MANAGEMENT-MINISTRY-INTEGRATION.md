# Church Management Ministry Integration Readiness Plan

**Prepared:** April 9, 2026
**Status:** Proposed future-state plan
**Scope:** Faith Counseling as an external ministry and care platform for future Church Management integration

## Purpose

This plan defines how a future Church Management product should be designed so it can integrate cleanly with Faith Counseling later without forcing the integration now.

The intent is to keep both systems aligned at the architecture, privacy, security, AI, and monitoring levels before direct implementation work begins.

It is written to be usable in two ways:

- as a Faith Counseling-side boundary and planning document under `PLANS/`
- as a source document for an upstream Church Management product section such as `Future Ministry Integration Readiness`

This document is a future-planning artifact. It does not replace the canonical security or monitoring standards already defined in:

- `PLANS/FULL-SECURITY-AND-AUDITING.md`
- `PLANS/FULL-SURFACE-MONITORING.md`

If a future implementation changes the security/auditing or monitoring standard, update those canonical plans first.

## Planning Objective

Build the Church Management platform so it can later integrate with Faith Counseling as a separate ministry system with minimal rework, clear system boundaries, and safe information-sharing rules.

## ChurchForge-Aligned Section

The following is the normalized architectural position this repository expects from any upstream Church Management system, including ChurchForge.

### Core Principle

ChurchForge and Faith Counseling are separate systems with separate responsibilities.

- ChurchForge manages members, households, ministries, events, volunteers, communication, giving, and church operations.
- Faith Counseling manages protected counseling workflows, client records, scheduling, charting, documentation, and care operations.

Future integration must support ministry coordination without collapsing those two domains into one shared data model.

### Required integration rules

- No direct database access between systems.
- All integration must occur through versioned APIs, webhooks, or approved adapters.
- Any member-to-client linkage must be explicit, consent-aware, tenant-scoped, and revocable.
- Church users must see only minimum-necessary, ministry-safe coordination data by default.
- Clinical notes, diagnoses, treatment plans, and other protected counseling details must never flow into ChurchForge by default.
- All integration actions must be role-gated, auditable, and privacy-safe.
- Telemetry must remain aggregate-only and must never contain PHI, counseling free text, or high-cardinality identifiers.
- AI features must treat counseling data as restricted context, not default context.

### Development readiness requirement

Current ChurchForge development should preserve future integration readiness by:

- isolating referral and care-coordination logic behind service boundaries
- keeping external links optional rather than required for core workflows
- using stable internal IDs with separate external-reference mapping
- avoiding schema assumptions that merge church records and counseling records
- designing permissions, audit, and monitoring with future cross-system workflows in mind

## Core Product Position

Faith Counseling and the Church Management platform must be treated as connected but separate systems.

- Church Management owns member, household, ministry, discipleship, event, communication, volunteer, and giving workflows.
- Faith Counseling owns counseling-practice workflows, protected client records, scheduling, charting, documentation, and care operations.
- Future integration should support ministry coordination without collapsing those two domains into one shared data model.

## Integration Goals

The future integration should make it possible to support:

- ministry referral handoff from church staff into counseling intake or care-request workflows
- optional linkage between a church member record and a Faith Counseling client record
- non-clinical status visibility back into Church Management when explicitly allowed
- secure follow-up coordination between ministry staff and counseling staff
- aggregate reporting on ministry referral flow, care-request throughput, and operational outcomes

## Non-Goals

The future integration must not assume:

- direct database access between the two systems
- automatic syncing of full counseling records into Church Management
- broad church-staff access to counseling notes, diagnoses, treatment plans, or other sensitive care data
- default AI access to raw counseling content
- a single shared identity or record model without consent, role, and tenant checks

## Architectural Direction

The Church Management platform should be built with an explicit integration boundary instead of implicit internal coupling.

### Required design posture

- Use APIs, webhooks, or event-driven adapters for system-to-system communication.
- Keep external-system mappings separate from core member and ministry tables.
- Treat integration as configuration-driven and tenant-aware.
- Allow the Church Management platform to operate fully even when Faith Counseling is disconnected.
- Design for partial integration, not all-or-nothing dependency.

### Recommended technical shape

- integration service boundary or adapter layer
- versioned API contracts
- webhook or event support for future status sync
- external record link table or mapping store
- per-tenant integration configuration
- connection health and retry handling
- bounded sync scopes with explicit allowlists

## Domain Model Readiness

The Church Management system should preserve clean domain concepts that can map to Faith Counseling later without distorting either product.

### Church-side concepts to keep distinct

- member or person
- household or family
- ministry staff user
- pastoral care referral
- care request
- consent record
- follow-up task
- external ministry link
- ministry-safe care status

### Faith Counseling concepts to treat as external

- client record
- counselor assignment
- appointment
- clinical note
- treatment plan
- diagnosis
- legal or consent artifact tied to counseling care

The Church Management data model should never assume a member record is automatically the same thing as a counseling client record.

## Data Sharing Principles

All future sharing between the systems must follow minimum-necessary design.

### Allowed future exchange patterns

- referral metadata
- intake handoff status
- appointment summary metadata when explicitly approved
- ministry-safe status updates such as `referred`, `intake_requested`, `connected`, `awaiting_response`, or `closed`
- aggregate counts and operational summaries

### Disallowed default exchange patterns

- counseling note text
- diagnosis text
- prayer request free text unless separately governed and explicitly approved
- treatment-plan details
- document bodies
- raw audit rows
- unrestricted person-level data replication

## Consent And Access Model

Any future integration must be consent-aware and role-gated from day one.

### Required controls

- explicit consent before linking or sharing sensitive cross-system information where applicable
- least-privilege access for church staff, ministry leaders, counseling staff, and administrators
- tenant-scoped integration configuration and enforcement
- object-level authorization on linked records
- revocation path for consent, access, and external linkage
- re-auth or step-up confirmation for higher-risk exports or sharing actions

### Access principle

Church staff should see only ministry-safe coordination data unless a stronger policy and explicit authorization path exists.

## Security And Audit Requirements

Future implementation must align with the canonical Faith Counseling security and audit baseline.

### Non-negotiable requirements

- audit every integration-sensitive read, write, sync, denial, and failure path
- use canonical audit result semantics: `success`, `failure`, `denied`, `error`
- keep audit and telemetry as separate systems
- preserve tenant isolation across all integration actions
- avoid free text and unbounded metadata in audit helper fields when bounded enums or allowlisted values will do
- never expose secrets, tokens, sessions, or credentials in logs or telemetry

### Minimum auditable actions

- integration connection created or updated
- referral sent to Faith Counseling
- referral status received from Faith Counseling
- member-to-client link created, viewed, or revoked
- consent granted, denied, revoked, or expired
- export attempt started, denied, failed, or completed
- sync failure caused by auth, dependency, scope, or validation issues

## Monitoring And Telemetry Requirements

Any future integration surface must align with the full-surface monitoring standard.

### Minimum monitoring expectations

- integration settings page instrumentation
- referral workflow instrumentation
- consent workflow instrumentation
- linked-record status views instrumentation
- connection health monitoring
- sync latency and sync outcome metrics
- denied and failure count metrics
- export availability and export outcome metrics

### Telemetry boundary

Telemetry must remain aggregate-only and privacy-safe.

Never emit:

- PHI
- names
- emails
- member IDs
- client IDs
- referral free text
- counseling content
- raw audit payloads
- any other high-cardinality identifiers

Use OTEL semantic conventions first and `faith.ui.*` only where app-specific coverage is still needed.

## AI Guardrails

If AI is used in the Church Management system, it must treat Faith Counseling as a protected external ministry system rather than an unrestricted knowledge source.

### Required AI rules

- never assume access to counseling records by default
- never infer counseling facts that were not explicitly supplied
- never present speculative care or clinical conclusions as fact
- keep referral suggestions, status summaries, and care-routing recommendations human-reviewed
- do not use raw counseling notes as generalized training or prompt context without an explicit approved workflow
- keep AI outputs bounded to ministry coordination unless a stronger authorized workflow exists

### Safe AI use cases for future consideration

- referral drafting assistance from structured ministry intake fields
- ministry-safe follow-up task suggestions
- aggregate referral trend summaries
- connection failure summaries for administrators

## User Experience Expectations

If the integration is implemented later, the user experience should make the system boundary explicit.

### UX requirements

- visible integration settings and connection status
- clear labels when data originates from Faith Counseling
- explicit consent and access-state indicators
- graceful degraded states when Faith Counseling is unavailable
- clear distinction between ministry coordination data and protected counseling data
- no UI that implies church staff are browsing counseling charts directly

## Implementation Readiness Guidance

The Church Management platform does not need the full integration now. It does need to avoid architecture choices that make the integration expensive later.

### Build now with future integration in mind

- isolate referral and care-coordination logic behind service boundaries
- keep external links optional, not required for core workflows
- use stable internal IDs plus separate external-reference mapping
- avoid schema assumptions that merge church records and counseling records
- define roles and permissions with future cross-system actions in mind
- keep monitoring and audit hooks available for future integration surfaces

### Do not build now unless intentionally scheduled

- direct two-way sync of full records
- clinical data mirroring into Church Management
- AI features that depend on unrestricted counseling content
- tight runtime coupling that makes either platform unavailable when the other is down

## Acceptance Criteria For Future Integration Work

When actual integration work begins, the design should be considered aligned with this plan only if:

1. Faith Counseling remains a separate protected ministry system.
2. Data sharing is minimum-necessary and consent-aware.
3. Church staff see ministry-safe coordination data by default, not clinical record detail.
4. Integration workflows are tenant-scoped, role-gated, auditable, and observable.
5. Telemetry remains privacy-safe and separate from the audit ledger.
6. AI features respect system boundaries and do not treat counseling data as open context.
7. Either system can degrade gracefully when the other is unavailable.

## Recommended Next Step

If this future integration becomes active roadmap work, create a follow-on implementation plan that defines:

- API contract candidates
- webhook/event contract candidates
- consent workflow details
- record-linking model
- ministry-safe status vocabulary
- UI surface inventory and monitoring coverage
- audit taxonomy for cross-system workflows

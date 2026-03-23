# ADR 0001: Start With a Modular Monolith

## Status

Accepted

## Context

The product must ship a broad workflow surface early: identity, intake, clinical charting, documents, scheduling, billing foundations, and portal access. Splitting into microservices immediately would add operational and compliance overhead before the domain boundaries are proven.

## Decision

Start with a modular monolith that preserves explicit module boundaries in code, APIs, background processing, and data ownership conventions.

## Consequences

### Positive

- faster delivery for the first release
- simpler tenant isolation and audit enforcement
- fewer deployment and support failure modes
- easier cross-module transactional workflows during early product discovery

### Negative

- stronger discipline is required to keep modules decoupled
- some later extractions may require interface hardening

## Guardrails

- no direct cross-module database access without an explicit domain service boundary
- shared types belong in a controlled domain package, not ad hoc imports
- audit and authorization checks are mandatory at module boundaries

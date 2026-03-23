# ADR 0002: Use a Web-First Product Architecture

## Status

Accepted

## Context

Counseling practice staff primarily work from desktops and laptops while managing schedules, documents, and charts. Clients also need mobile-friendly access, but the initial platform risk is in secure workflows and role enforcement rather than native mobile features.

## Decision

Use a responsive web-first architecture as the primary product surface for staff and client workflows.

## Consequences

### Positive

- single delivery surface for early product validation
- simpler permission and auditing implementation
- lower operational cost than parallel mobile development
- easier rollout of charting and document workflows

### Negative

- some client portal interactions may need later native optimizations
- offline mobile use is deferred

## Follow-up

- keep APIs clean enough to support native clients later
- design mobile-responsive portal flows from the start

# Monitoring And Governance Foundation

**Last updated:** April 6, 2026  
**Scope:** planning baselines, OTEL health coverage, frontend telemetry foundation, Jaeger distributed tracing, Prometheus metrics scraping, monitoring UI, audit-governance alignment

---

## Summary

This document covers the full monitoring foundation for Faith Counseling — from the original telemetry baseline through the Jaeger + Prometheus observability stack added in v5.7.0.

The delivered scope combines:

- canonical monitoring instructions in `AGENTS.md`
- canonical monitoring plan in `PLANS/FULL-SURFACE-MONITORING.md`
- canonical security and auditing plan in `PLANS/FULL-SECURITY-AND-AUDITING.md`
- Jaeger + Prometheus observability stack plan in `PLANS/JAEGER-PROMETHEUS-OBSERVABILITY.md`
- explicit API liveness/readiness health metrics and summary visibility
- structured frontend telemetry ingestion and aggregation
- Prometheus-format `/metrics` endpoints on all three services
- Jaeger distributed trace export via OTLP HTTP
- monitoring page observability stack status panel with live probe

---

## Planning And Governance

The repository has three durable plan baselines and one durable instruction layer:

- `PLANS/FULL-SURFACE-MONITORING.md`
  - defines the monitoring standard for every visible surface
  - defines `faith.ui.*` metric families and OTEL hybrid naming rules
  - defines privacy limits, low-cardinality labels, and per-surface expectations
- `PLANS/FULL-SECURITY-AND-AUDITING.md`
  - defines audit event semantics, investigation requirements, and audit-vs-telemetry separation
  - defines privileged audit access rules and telemetry privacy boundaries
- `PLANS/JAEGER-PROMETHEUS-OBSERVABILITY.md`
  - architecture decisions for Jaeger 2.17 + Prometheus
  - full metric inventory (existing and new)
  - configuration reference and Docker setup
- `AGENTS.md`
  - requires future sessions to read the canonical plan files before making related changes
  - enforces the monitoring baseline and the security/audit baseline

---

## API And Telemetry Changes

### Health endpoints

- `GET /health`
- `GET /health/live`
- `GET /health/ready`

### Frontend telemetry ingestion

- `POST /v1/telemetry/events` — structured frontend telemetry batches
- `POST /v1/telemetry/vitals` — browser vital metrics (CLS, FCP, INP, LCP, TTFB)

### Summary endpoint

`GET /v1/telemetry/summary` includes:

- `summary.overall`, `summary.frontend`, `summary.surfaces`, `summary.health`, `summary.process`
- `exportedViaOtel` — true if any OTLP endpoint is configured

### Prometheus metrics endpoint

`GET /metrics` — served on all three processes (no auth; protect at network level in production):

- `apps/api` → port 3001 `/metrics`
- `apps/web` → port 3002 `/metrics`
- `apps/worker` → port 9465 `/metrics` (dedicated metrics HTTP server)

### Observability stack health probe

`GET /v1/monitoring/observability-stack` (requires practice admin):

- server-side probes Jaeger, Prometheus, and worker metrics
- returns `{ jaeger, prometheus, workerMetrics }` up/status objects
- used by the monitoring page to avoid cross-origin CSP restrictions

### Database monitoring

`GET /v1/monitoring/db` — MySQL GLOBAL STATUS and pool stats (requires practice admin)

---

## OTEL Metrics Inventory

### Health and service metrics

| Metric | Type | Description |
| --- | --- | --- |
| `faith.service.health_status` | observable gauge | 0=unhealthy, 1=degraded, 2=healthy |
| `faith.service.dependency.health_status` | observable gauge | per-dependency health |
| `faith.service.healthcheck.duration` | histogram | healthcheck execution time (ms) |
| `faith.service.healthcheck.total` | counter | healthcheck executions |

### HTTP metrics

| Metric | Type | Description |
| --- | --- | --- |
| `faith.http.server.duration` | histogram | request duration (ms); labels: method, route, statusCode, tenantId |
| `faith.http.server.active_requests` | updown counter | in-flight requests |
| `faith.web.proxy.duration` | histogram | web→API proxy duration (ms) |

### Application metrics

| Metric | Type | Description |
| --- | --- | --- |
| `faith.app.mutations` | counter | write operations; labels: name, result |
| `faith.web.vital.value` | histogram | browser vitals (CLS, FCP, INP, LCP, TTFB) |
| `faith.auth.login.total` | counter | auth login outcomes; labels: result, role/reason |

### Database pool metrics (new in v5.7.0)

| Metric | Type | Description |
| --- | --- | --- |
| `faith.db.pool.connections_active` | observable gauge | MySQL pool in-use connections |
| `faith.db.pool.connections_idle` | observable gauge | MySQL pool idle connections |
| `faith.db.pool.connections_waiting` | observable gauge | requests waiting for a pool connection |

### Worker metrics (new in v5.7.0)

| Metric | Type | Description |
| --- | --- | --- |
| `faith.worker.poll.duration` | histogram | reminder polling cycle duration (ms) |
| `faith.worker.poll.total` | counter | polling cycles; labels: result (success/error) |

### UI surface metrics

| Metric | Type | Description |
| --- | --- | --- |
| `faith.ui.screen.view` | counter | surface view events |
| `faith.ui.screen.load.duration` | histogram | surface load time (ms) |
| `faith.ui.screen.active.duration` | histogram | time surface was visible (ms) |
| `faith.ui.interaction.duration` | histogram | interaction duration (ms) |
| `faith.ui.action.total` | counter | action outcomes; labels: result |
| `faith.ui.validation.error.total` | counter | form validation errors |
| `faith.ui.empty_state.view.total` | counter | empty/placeholder state views |
| `faith.ui.error.total` | counter | UI error events |
| `faith.ui.fetch.duration` | histogram | frontend fetch duration (ms) |
| `faith.ui.fetch.error.total` | counter | frontend fetch failures |

---

## Tracing Coverage (Jaeger)

Auto-instrumented via `@opentelemetry/auto-instrumentations-node`:

- HTTP server — all inbound requests with route, method, status
- HTTP client — all outbound fetch/http calls (web proxy → API)
- mysql2 — every database query with SQL statement type, table, duration
- DNS, TLS, Node.js runtime internals

Manual spans:

- `http <METHOD> <route>` per request via `beginRequest()`, with `http.response.status_code` on close

Trace context propagation:

- W3C `traceparent` / `tracestate` forwarded by the web proxy to the API — browser → web → API spans link in a single trace tree in Jaeger

---

## Observability Stack

### Architecture

```
faith-api  ──OTLP HTTP:4318──► Jaeger (traces)
faith-web  ──OTLP HTTP:4318──► Jaeger (traces)
worker     ──OTLP HTTP:4318──► Jaeger (traces)

Prometheus ──scrape /metrics──► faith-api :3001
Prometheus ──scrape /metrics──► faith-web :3002
Prometheus ──scrape /metrics──► worker    :9465
```

### Docker profile

```bash
docker compose --profile observability up -d   # Start Jaeger + Prometheus
docker compose --profile observability down    # Stop
```

### Key ports

| Service | Port | URL |
| --- | --- | --- |
| Jaeger UI | 16686 | http://localhost:16686 |
| Jaeger OTLP HTTP | 4318 | http://localhost:4318 |
| Jaeger OTLP gRPC | 4317 | localhost:4317 |
| Prometheus | 9090 | http://localhost:9090 |
| API metrics | 3001 | http://localhost:3001/metrics |
| Web metrics | 3002 | http://localhost:3002/metrics |
| Worker metrics | 9465 | http://localhost:9465/metrics |

### Required env vars

```bash
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
WORKER_METRICS_PORT=9465
```

---

## Frontend Instrumentation Foundation

### Shared surface model

74 canonical surface IDs covering:

- top-level React views
- client detail tabs
- counselor detail tabs
- scheduling subviews and tabs
- Workspace Studio tabs
- standalone pages (monitor, about, operations)
- key modal workflows

### Frontend helpers

- React/browser telemetry helper (`apps/web/src/lib/frontendTelemetry.js`)
- `useSurfaceTelemetry` hook
- standalone-page telemetry helper for `monitor`, `operations`, `about`
- `window.faithTelemetry` global API for non-React pages
- shared request instrumentation through the web API client layer

### Current instrumentation coverage

- app shell and top-level view switching
- client detail tabs
- counselor detail tabs
- scheduling tabs and subviews
- Workspace Studio tabs
- monitor page
- operations page
- about page
- shared API fetch path
- global runtime error and unhandled promise rejection capture

---

## Monitoring Page

The monitoring page (`/monitor`) shows:

- KPI row: active requests, error rate, uptime, memory, P95 latency
- Request sparkline and status donut chart
- Latency histogram (request and proxy)
- Browser vitals (CLS, FCP, INP, LCP, TTFB)
- UI surface summary (actions, errors, validation, empty states)
- Health probe panel (service and per-dependency status)
- Error drill-down with recent error table
- Database metrics panel
- **Observability stack status panel** — Jaeger + Prometheus live probe with enable/disable instructions (v5.7.0)
- OpenTelemetry configuration panel

---

## Privacy And Compliance Boundary

The implementation explicitly keeps telemetry and auditing separate:

- no raw audit rows in OTEL or frontend telemetry
- no PHI, names, emails, free text, or high-cardinality labels in telemetry
- audit intelligence surfaces are monitored through aggregate operational signals only
- `/metrics` endpoints expose no session, identity, or clinical data

---

## Remaining Follow-On Work

- additional modal workflows instrumentation
- more explicit validation/failure instrumentation for form-heavy flows
- broader empty-state and abandonment tracking
- audit-intelligence-specific surface instrumentation
- Grafana dashboard configuration on top of Prometheus for long-term retention and alerting
- production-grade Jaeger backend (Elasticsearch or Badger persistent storage)

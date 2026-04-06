# Jaeger + Prometheus Observability

**Status:** Implemented — April 5, 2026

---

## Problem Statement

FaithCounseling already has a solid OpenTelemetry foundation: traces and metrics are produced via OTEL SDK across all three services (`faith-api`, `faith-web`, `reminder-worker`). However, the data only leaves the process when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured — with no collector in the local dev stack, traces were never visualized and metrics were never scraped.

This plan closes that gap by wiring up:

- **Jaeger 2.17** — distributed trace visualization and service dependency analysis
- **Prometheus** — time-series metrics scraping with pull-based collection from each service's `/metrics` endpoint

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│  Browser (React / static pages)                        │
│  → W3C traceparent header → web server                 │
│  → POST /api/v1/telemetry/events (frontend events)     │
└──────────────────────────┬─────────────────────────────┘
                           │ trace context propagated
┌──────────────────────────▼─────────────────────────────┐
│  faith-web (Node.js, port 3002)                        │
│  → Traces: OTLP HTTP → Jaeger :4318                    │
│  → Metrics: GET /metrics → Prometheus scrapes          │
└──────────────────────────┬─────────────────────────────┘
                           │ trace context propagated
┌──────────────────────────▼─────────────────────────────┐
│  faith-api (Node.js, port 3001)                        │
│  → Traces: OTLP HTTP → Jaeger :4318                    │
│  → Metrics: GET /metrics → Prometheus scrapes          │
│  → mysql2 auto-instrumented (DB spans)                 │
└──────────────────────────┬─────────────────────────────┘
                           │ DB spans
┌──────────────────────────▼─────────────────────────────┐
│  MySQL (port 3306)                                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  reminder-worker (background process)                  │
│  → Traces: OTLP HTTP → Jaeger :4318                    │
│  → Metrics: GET /metrics → Prometheus scrapes :9464    │
└──────────────────────────┬─────────────────────────────┘
                           │

┌──────────────────────────▼─────────────────────────────┐
│  Jaeger all-in-one (port 16686 UI, 4317 gRPC, 4318 HTTP)│
│  Stores traces in memory (dev) or Badger/ES (prod)     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  Prometheus (port 9090)                                │
│  Scrapes /metrics from api :3001, web :3002, worker :9464│
└────────────────────────────────────────────────────────┘
```

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Trace backend | Jaeger 2.17 all-in-one | Native OTLP support (gRPC :4317, HTTP :4318), in-memory dev storage, Jaeger UI on :16686 |
| Metrics backend | Prometheus pull model | Standard for Node.js stacks; pull model lets Prometheus control timing |
| Prometheus exporter | `@opentelemetry/exporter-prometheus` | Reuses existing OTEL meter definitions—no duplicate metric registration |
| Metrics serving | `/metrics` route on existing HTTP servers | No extra ports for API and web; worker gets its own small metrics server on `:9464` |
| OTEL Collector | Not used in dev | Unnecessary complexity when Jaeger directly accepts OTLP and Prometheus scrapes directly |
| Docker profile | `observability` | Optional—doesn't interfere with the base `pnpm start` workflow |
| Trace context forwarding | W3C `traceparent` / `tracestate` headers | Standard propagation across web proxy → API boundary |

---

## Metric Inventory

### Existing (carried through unchanged)

| Metric | Type | Labels |
|---|---|---|
| `faith.http.server.duration` | histogram | method, route, statusCode, tenantId |
| `faith.http.server.active_requests` | updown counter | method, route |
| `faith.app.mutations` | counter | name, result |
| `faith.web.vital.value` | histogram | name, rating, tenantId |
| `faith.web.proxy.duration` | histogram | route |
| `faith.service.healthcheck.duration` | histogram | name |
| `faith.service.healthcheck.total` | counter | name, status |
| `faith.ui.screen.view` | counter | surface_id, surface_kind, role |
| `faith.ui.screen.load.duration` | histogram | surface_id, surface_kind |
| `faith.ui.screen.active.duration` | histogram | surface_id, surface_kind |
| `faith.ui.interaction.duration` | histogram | surface_id, surface_kind, action |
| `faith.ui.action.total` | counter | surface_id, action, result |
| `faith.ui.validation.error.total` | counter | surface_id, workflow |
| `faith.ui.empty_state.view.total` | counter | surface_id |
| `faith.ui.error.total` | counter | surface_id |
| `faith.ui.fetch.duration` | histogram | surface_id, action |
| `faith.ui.fetch.error.total` | counter | surface_id, action |
| `faith.service.health_status` | observable gauge | (none) |
| `faith.service.dependency.health_status` | observable gauge | dependency |

### New (added by this plan)

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `faith.db.pool.connections_active` | observable gauge | (none) | MySQL pool active connections |
| `faith.db.pool.connections_idle` | observable gauge | (none) | MySQL pool idle connections |
| `faith.db.pool.connections_waiting` | observable gauge | (none) | Requests waiting for a connection |
| `faith.auth.login.total` | counter | result (success/failure), reason | Auth login outcomes |
| `faith.worker.poll.duration` | histogram (ms) | result (success/error) | Reminder polling cycle time |
| `faith.worker.poll.total` | counter | result (success/error) | Reminder polling cycle count |

---

## Trace Coverage

Auto-instrumented via `@opentelemetry/auto-instrumentations-node`:

- **HTTP server** — all inbound requests with route, method, status
- **HTTP client** — all outbound fetch/http calls (web proxy → API)
- **mysql2** — every database query with SQL statement type, table, duration
- **DNS** — hostname resolution
- **Node.js runtime** — event loop, GC (via metrics)

Manual spans:

- `http <METHOD> <route>` — created in `beginRequest()` per every request, with `http.response.status_code` attribute added on close

Trace context propagation:

- W3C `traceparent` / `tracestate` forwarded by the web proxy to the API so browser→web→API spans are linked in a single trace tree

---

## Configuration Reference

### Environment Variables

```bash
# Traces → Jaeger
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces

# Metrics → leave blank (Prometheus scrapes /metrics directly; OTLP metric export optional)
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=

# (existing combined endpoint still works if set)
OTEL_EXPORTER_OTLP_ENDPOINT=

# Worker metrics HTTP server port (Prometheus scrapes this)
WORKER_METRICS_PORT=9464

# Disable telemetry SDK entirely (e.g. in CI)
# OTEL_SDK_DISABLED=true
```

### Docker Compose

Start the observability stack alongside the app:

```bash
docker compose --profile observability up -d
```

This starts:

- **Jaeger UI:** http://localhost:16686
- **Jaeger OTLP HTTP:** http://localhost:4318
- **Prometheus:** http://localhost:9090

Stop:

```bash
docker compose --profile observability down
```

### Prometheus Scrape Config

`ops/observability/prometheus.yml` — scrapes all three services:

- `faith-api` → `host.docker.internal:3001/metrics`
- `faith-web` → `host.docker.internal:3002/metrics`
- `faith-worker` → `host.docker.internal:9464/metrics`

---

## Service Metrics Endpoints

| Service | Port | Path | Auth Required |
|---|---|---|---|
| faith-api | 3001 | `/metrics` | No (Prometheus needs unauthenticated access) |
| faith-web | 3002 | `/metrics` | No |
| reminder-worker | 9464 | `/metrics` | No |

> **Production note:** In production, place these endpoints behind a firewall or IP allowlist so only the Prometheus scraper can reach them. Do not expose them on the public internet.

---

## Jaeger Integration Notes

- Jaeger 2.17 accepts OTLP/HTTP on port 4318 and OTLP/gRPC on port 4317
- Uses in-memory storage by default (traces lost on container restart; fine for dev)
- Set `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces` to activate
- The `faith-api` service name in Jaeger will show `faith-api` with mysql2 child spans
- The `faith-web` service will show proxy spans linking to API traces via `traceparent`
- The `reminder-worker` will show poll cycle spans

---

## Files Changed

| File | Change |
|---|---|
| `packages/telemetry/package.json` | Added `@opentelemetry/exporter-prometheus` |
| `packages/telemetry/src/node.js` | PrometheusExporter as additional MetricReader; new db pool, auth, worker metrics; `getPrometheusExporter()` export |
| `packages/telemetry/src/index.js` | Re-export `getPrometheusExporter` |
| `apps/api/src/index.js` | `/metrics` route; route resolver entry |
| `apps/web/server.js` | `/metrics` route; W3C trace context header forwarding |
| `apps/worker/src/index.js` | Poll timing with `recordWorkerPoll()`; standalone metrics HTTP server |
| `docker-compose.yml` | Jaeger and Prometheus services under `observability` profile |
| `ops/observability/prometheus.yml` | New file — Prometheus scrape config |
| `.env.example` | `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `WORKER_METRICS_PORT` |

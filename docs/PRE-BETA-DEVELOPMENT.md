# Pre-Beta Development

## Purpose

This document tracks product, UX, frontend, telemetry, and operational changes made during the pre-beta phase.
It is intended to complement the step-based change log with a more current working record of in-flight improvements and validation notes.

## Current Pre-Beta Focus

- Stabilize the React-based dashboard experience.
- Improve live operational visibility through monitoring and telemetry.
- Reduce confusion caused by stale built assets during local development.
- Make the primary workspace more useful by surfacing live client data.

## Recent Changes

### Dashboard and Navigation

- Reworked the dashboard experience around the current React web app shell.
- Replaced the earlier title usage with `Practice HUB` in the top bar.
- Removed the client search input from the top bar to reduce clutter.
- Retained the hamburger-driven navigation pattern introduced during the layout cleanup work.

### Workspace Layout

- Added a dedicated `Clients` panel on the main dashboard.
- Positioned the `Clients` panel beside `Workspace Studio` by reducing the studio panel span.
- Wired the `Clients` panel to live API data from `GET /api/v1/clients`.
- Added clear loading, empty, and error states for the client list.

### Monitoring and Telemetry

- Expanded the monitoring page to show:
  - client-side API errors by 4xx range
  - server-side API errors by 5xx range
  - summarized API error status codes
- Improved monitor rendering so missing route activity displays as `No traffic yet` instead of a blank value.
- Adjusted the browser heartbeat payload to report `monitor.heartbeat.memory_mb`.
- Expanded service telemetry summaries to include:
  - `requestCount`
  - `errorCount`
  - `statusCounts`
  - `errorStatusCounts`
  - `recentErrors`
  - `avgDurationMs`
  - `lastRoute`
  - `lastRequestAt`

### Build and Serving Fixes

- Corrected the Vite entry configuration so the React source is actually used as the build input.
- Added a root web entry file for Vite at `apps/web/index.html`.
- Rebuilt the public bundle so the served application matches the current React source.
- Updated the web server cache policy so compiled `assets/` files are served with `no-cache` during local work, reducing stale bundle issues.

### Local Operations

- Verified a clean port-based local shutdown path for services on `3001`, `3002`, and `3003`.
- Restarted the local stack cleanly through `node ops/start-all.mjs`.
- Verified successful local health responses from:
  - `http://127.0.0.1:3001/health`
  - `http://127.0.0.1:3002/index.html`

## Files Involved

- `apps/web/src/App.jsx`
- `apps/web/src/components/TopBar.jsx`
- `apps/web/src/components/WorkspaceGrid.jsx`
- `apps/web/index.html`
- `apps/web/vite.config.js`
- `apps/web/server.js`
- `apps/web/public/monitor.html`
- `apps/web/public/monitor.js`
- `packages/telemetry/src/node.js`

## Validation Notes

- The `Clients` panel now depends on the web app being built from the corrected Vite entry configuration.
- Monitoring summaries currently show expected auth-related 4xx noise when protected API routes are called without the required headers.
- Recent checks showed healthy API behavior with no 5xx failures and low average request duration.

## Known Follow-Ups

- Resolve the remaining Vite warning about build output and public directory overlap.
- Decide whether expected authorization failures should be filtered or labeled differently in the monitoring view.
- Continue documenting each pre-beta UI, API, and operational change in this file as work progresses.

## Useful Commands

- Start the local stack:
  - `node ops/start-all.mjs`
- Kill local services on the common ports used in this repo:
  - `for p in 3001 3002 3003; do pids=(${(f)"$(lsof -ti tcp:$p)"}); (( ${#pids} )) && kill -9 -- $pids; done`
- Run Playwright high-value journeys:
  - `npx playwright test tests/e2e/high-value-journeys.spec.mjs`
- Run Playwright launch-readiness checks:
  - `npx playwright test tests/e2e/launch-readiness.spec.mjs`

## Update Guidance

When adding to this document, prefer short entries that capture:

- what changed
- why it changed
- which files were involved
- how the change was validated
- any remaining follow-up or risk

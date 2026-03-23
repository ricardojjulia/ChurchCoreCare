# Web App

Lightweight modern UI shell for Faith Counseling operations.

## Goals

- modern, clean visual hierarchy
- powerful at-a-glance operations dashboard
- light runtime footprint without framework overhead
- responsive behavior across desktop and mobile

## Run Locally

From the repository root:

- `pnpm start:web`

Or from this folder:

- `node server.js`

Default URL: `http://localhost:3000`

## Current UI Scope

- sidebar navigation shell
- global search across today's schedule
- key metric cards
- operations panels for schedule, priority queue, and compliance watch
- care flow progress indicators
- same-origin `/api/*` proxy for live dashboard hydration from the API service

## Next UI Implementation Slices

- authenticated route shell and session handling
- role-aware navigation and feature visibility
- live API-backed dashboards and queue widgets
- accessibility pass for keyboard and screen reader flows

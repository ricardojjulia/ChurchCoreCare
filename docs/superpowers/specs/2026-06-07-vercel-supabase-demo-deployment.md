# Vercel And Supabase Demo Deployment

**Date:** 2026-06-07
**Status:** Approved

## Objective

Deploy ChurchCore Care as a production-shaped demonstration environment using:

- Vercel project `churchcore-care`
- Vercel team `ChurchCore`
- GitHub repository `ricardojjulia/ChurchCoreCare`
- Production branch `main`
- Supabase project `churchcore-care-demo`
- Supabase project reference `ujtwcrulqawzvggehxjf`

The environment contains synthetic demonstration data only. It is not approved
for real PHI.

## Runtime Architecture

Vercel serves the Vite build and a Node.js Function under `/api/*`. The
function adapts Vercel requests to the existing ChurchCore API router by
removing the public `/api` prefix and preserving the current tenant-routing,
RBAC, audit, and request-correlation behavior.

The existing local `pnpm start` workflow remains unchanged.

Supabase PostgreSQL is accessed through an SSL-enabled pooled connection.
Database migrations and synthetic data seeding run explicitly from deployment
tooling and never during an API request.

Supabase is the sole application database. Standard local development starts
the API and web processes locally but connects them to the configured online
Supabase project. Runtime configuration rejects local and loopback database
hosts and does not start a Docker database.

Persistent worker processes are disabled in this slice. Worker behavior must be
adapted to scheduled or event-driven execution before it is enabled on Vercel.

## Deployment Behavior

- GitHub is linked directly to the Vercel project.
- Pull requests create preview deployments without production database
  credentials.
- Merges to `main` create production deployments.
- Production environment variables are stored in Vercel, not committed files.
- Database credentials and encryption keys are treated as secrets.
- Synthetic data is encrypted with the deployment's own encryption key.
- Schema and seed commands are idempotent and explicit.

## Demo Guardrails

- `DEMO_ENVIRONMENT=true` is required for synthetic seeding.
- `VITE_DEMO_ENVIRONMENT=true` displays a visible synthetic-data banner.
- Deployment documentation states that real PHI is prohibited.
- Production database seeding refuses to run unless the demo guard is enabled.
- No local client or tenant data is copied to Supabase.

## Verification

The delivered deployment must verify:

- Vercel build succeeds from the monorepo root.
- `/api/health` returns a healthy response.
- Staff demo login succeeds.
- Authenticated client listing and operations summary succeed.
- Database monitoring remains locally implemented and accessible to admins.
- Localization runtime reads from the governed database catalog.
- Supabase contains only the synthetic `system` tenant dataset.
- Repository lint, tests, security regression, and tenant policy checks pass.

## Security Boundary

This deployment preserves production-oriented encryption, sessions, RBAC,
tenant predicates, canonical audit results, and bounded operational logging.
It does not represent HIPAA readiness and must not receive real PHI until
contractual, infrastructure, recovery, access-control, and compliance
requirements are separately validated.

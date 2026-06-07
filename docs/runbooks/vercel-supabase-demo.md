# Vercel And Supabase Demo Runbook

## Environment

- Vercel team/project: `churchcore/churchcore-care`
- GitHub repository: `ricardojjulia/ChurchCoreCare`
- Production branch: `main`
- Supabase project: `churchcore-care-demo`
- Supabase project reference: `ujtwcrulqawzvggehxjf`
- Data classification: synthetic demonstration data only; real PHI prohibited

Supabase is the sole application database. Localhost, loopback, Unix-socket,
and implicit database configurations are rejected by runtime policy. Disposable
PostgreSQL services are allowed only in CI with
`CHURCHCORE_ALLOW_TEST_DATABASE=true`.

## Required Configuration

Store these values in protected local `.env` files and Vercel Production
environment variables:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=false` for the current Supabase session pooler
- `DB_ENCRYPTION_KEY`, `DB_ENCRYPTION_HMAC_KEY`, `SESSION_SECRET`
- `DEMO_ENVIRONMENT=true`, `VITE_DEMO_ENVIRONMENT=true`
- `SEED_DEV_PORTAL_DATA=false`
- `ENABLE_TENANT_HOST_ROUTING=false`, `TENANT_STRICT_HOST_ROUTING=false`
- `TENANT_ALLOWED_SLUGS=system`, `PUBLIC_PORTAL_TENANT_ID=system`

Do not configure database credentials for Vercel Preview deployments. Preview
functions must fail closed rather than access the Production database.

## Database Deployment

```bash
supabase link --project-ref ujtwcrulqawzvggehxjf
supabase db push --linked --include-all
pnpm deploy:supabase
pnpm deploy:verify
```

`deploy:supabase` requires `DEMO_ENVIRONMENT=true` and runs the initial schema,
incremental migrations, synthetic dataset refresh, localization import, and
bounded verification. It never copies local client data.

## Application Deployment

The Vercel project is connected to GitHub. Merges to `main` produce Production
deployments. Pull requests produce Preview deployments without database access.

Verify after deployment:

```bash
curl -fsS https://churchcore-care.vercel.app/api/health
```

Also verify the visible demo warning, staff login, client list, operations
summary, monitoring surface, and governed locale behavior.

## Recovery

- Application rollback: use Vercel deployment rollback or promote the prior
  known-good Production deployment.
- Database rollback: restore from Supabase backups/PITR when enabled. Do not
  run destructive SQL manually.
- Synthetic data reset: rerun `pnpm deploy:supabase` from an approved checkout
  with the protected Production environment.

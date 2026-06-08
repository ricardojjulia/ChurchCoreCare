# ChurchCore Care SaaS Runtime

## Status

ChurchCore Care is now a SaaS-only application runtime.

- Application hosting: Vercel project `churchcore-care`
- Application database: online Supabase project `churchcore-care-demo`
- Local application runtime database: not supported
- Demo classification: synthetic demonstration data only; do not enter real PHI

This runbook is the repo-level operating guide for bringing up the app, checking
out code, running tests, and verifying the Vercel + Supabase deployment.

## Official Workspace Path

Use this checkout for current SaaS work:

```bash
cd /Users/rjulia/ChurchCoreCare
```

The older `/Users/rjulia/ChurchCore Care` checkout may contain unrelated
in-progress feature work. Do not use that path for the SaaS runtime baseline
unless you intentionally switch to that feature branch.

## Runtime Policy

Supabase is the only application database.

Required behavior:

- `pnpm start` must use the configured online Supabase pooler.
- `DB_HOST` must not be localhost, loopback, or a Unix socket.
- `DB_SSL=true` is required outside explicit disposable CI fixtures.
- Vercel must use the Supabase transaction pooler on port `6543`.
- Vercel serverless functions must use `DB_POOL_MAX=1`.
- Local database fixtures are allowed only for automated tests with
  `CHURCHCORE_ALLOW_TEST_DATABASE=true`.

Do not start Docker, MySQL, or a local PostgreSQL service for normal ChurchCore
Care application runtime.

## Required Local Files

The protected `.env` file must be present locally and must not be committed.
It should use the same shape as `.env.example`:

```env
DB_HOST=aws-1-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.<project-ref>
DB_PASSWORD=<protected>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MAX=1
DEMO_ENVIRONMENT=true
VITE_DEMO_ENVIRONMENT=true
SEED_DEV_PORTAL_DATA=false
TENANT_ALLOWED_SLUGS=system
PUBLIC_PORTAL_TENANT_ID=system
```

Secrets must stay in `.env` or Vercel environment variables. Never paste them
into docs, commits, issue comments, logs, screenshots, or monitoring output.

## Normal Local Startup

```bash
cd /Users/rjulia/ChurchCoreCare
pnpm install --frozen-lockfile
git config core.hooksPath .githooks
pnpm start
```

Expected local endpoints:

- Web: `http://127.0.0.1:3002/index.html`
- API: `http://127.0.0.1:3001`
- Monitor: `http://127.0.0.1:3002/monitor.html`
- API docs: `http://127.0.0.1:3002/api/docs`

`pnpm start` performs the full preflight: environment loading, Supabase listener
check, migrations, web build, API startup, web startup, and worker startup.

## Verification Commands

Run these from `/Users/rjulia/ChurchCoreCare` after startup or before a PR:

```bash
node --test apps/api/test/database-config.test.mjs ops/deployment/test/startup-policy.test.mjs apps/api/test/vercel-adapter.test.mjs
pnpm lint
pnpm test
pnpm policy:tenant
pnpm deploy:verify
pnpm test:smoke
```

For browser coverage against the local app:

```bash
UI_SCAN_BASE_URL=http://127.0.0.1:3002 node tests/e2e/ui-error-scan.mjs
```

Browser and smoke checks create sessions. Restore the synthetic dataset
invariants afterward:

```bash
pnpm demo:finalize
pnpm deploy:verify
```

## Demo Accounts

The canonical synthetic demo accounts are:

- Staff admin: `admin@churchcorecare.local`
- Portal client: `elena.martinez@example.test`

Passwords are documented only in `.env`-driven test scripts and synthetic demo
fixtures. These accounts are for demo verification only.

## Production Verification

After merging to `main`, verify Vercel production:

```bash
curl -fsS https://churchcore-care.vercel.app/api/health
seq 1 30 | xargs -P 15 -I{} curl -sS -o /dev/null -w '%{http_code}\n' https://churchcore-care.vercel.app/api/health | sort | uniq -c
```

Expected result:

- `/api/health` returns HTTP 200.
- `demoEnvironment` is `true`.
- Concurrent health checks return only HTTP 200.

Also verify the React app, `/monitor.html`, and standalone pages show the fixed
synthetic-data warning:

```text
Synthetic demonstration data only. Do not enter real PHI.
```

## Git Workflow

Always work from a feature branch and open a pull request into `main`.

```bash
git switch -c <feature-branch>
git status --short --branch
pnpm lint
pnpm test
git commit -S
git push -u origin <feature-branch>
```

Never push directly to `main`. Keep commits signed and focused.

## Recovery Checklist

If local work becomes hard to start or checkout:

1. Confirm the current path is `/Users/rjulia/ChurchCoreCare`.
2. Run `git status --short --branch`.
3. Confirm `.env` exists and is mode `600`.
4. Confirm `DB_HOST` is the Supabase pooler and `DB_PORT=6543`.
5. Run `pnpm install --frozen-lockfile`.
6. Run `pnpm start`.
7. Check `http://127.0.0.1:3001/health/ready`.

If a different worktree has uncommitted changes, do not reset or delete it.
Create a new worktree from `origin/main` and copy only protected operational
state such as `.env` and `.vercel/project.json`.

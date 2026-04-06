# Security Checks

This directory contains nightly automated security reports for the Faith Counseling platform.

## Report Structure

Each nightly run produces three files:

| File | Description |
|------|-------------|
| `summary-YYYY-MM-DD.md` | Human-readable Markdown summary of all findings |
| `appsec-YYYY-MM-DDTHH-MM-SS.json` | Full AppSec scan JSON report |
| `db-security-YYYY-MM-DDTHH-MM-SS.json` | Full DB Security scan JSON report |

Reports are retained for **30 days** and then pruned automatically.

## Scan Coverage

### AppSec Scan (`ops/appsec-scan.mjs`)

| Check | What It Covers |
|-------|---------------|
| Dependency vulnerabilities | `pnpm audit` — known CVEs in dependencies |
| Hardcoded secrets | Passwords, API keys, tokens, private keys in source |
| Dangerous code patterns | `eval()`, `innerHTML`, SQL concatenation, path traversal, weak crypto |
| Security headers | `x-content-type-options`, `x-frame-options`, HSTS, CSP, referrer-policy |
| Auth & session config | Argon2id verification, `httpOnly`/`secure`/`SameSite` cookie flags |
| Input validation | User-input handling in API route handlers |
| Logging PHI/PII exposure | PHI identifiers in `console.log` / logger calls |
| CORS configuration | Origin allowlist enforcement |
| Dependency version pinning | Unpinned or wildcard version ranges |

### DB Security Scan (`ops/db-security-scan.mjs`)

| Check | What It Covers |
|-------|---------------|
| PHI/PII field compliance | All sensitive schema columns must use `_enc` suffix (AES-256-GCM) |
| Encryption convention | TEXT/MEDIUMTEXT columns reviewed for free-text PHI risk |
| Tenant isolation | All client/staff tables must carry `tenant_id` |
| Audit table structure | `audit_events` must have required columns; no PHI allowed |
| Session table security | Token storage must be hashed; expiry must be enforced |
| Query parameterization | All SQL queries reviewed for string concatenation injection risk |
| Encryption key config | AES-256-GCM, random IV, GCM auth tag, env-sourced key |
| DB connection security | SSL config, timeout, no hardcoded credentials |
| Sensitive columns | Password hash algorithm, token hashing, secret storage |
| Portal public security | Public intake cannot self-select tenant_id |

## Severity Levels

| Level | Action Required |
|-------|----------------|
| 🚨 CRITICAL | Immediate remediation required — blocks CI |
| 🔴 HIGH | Fix within 24 hours |
| 🟠 MEDIUM | Fix within 1 week |
| 🟡 LOW | Fix in next maintenance window |
| ✅ INFO | Confirmation — no action needed |

## Running Manually

```bash
# Full nightly run (AppSec + DB Security + report generation)
node ops/nightly-security-runner.mjs

# Dry run (see what would be written without writing files)
node ops/nightly-security-runner.mjs --dry-run

# Individual scans
node ops/appsec-scan.mjs
node ops/db-security-scan.mjs

# With output to specific file
node ops/appsec-scan.mjs --output /tmp/appsec-report.json
node ops/db-security-scan.mjs --output /tmp/db-report.json
```

## GitHub Actions Schedule

The nightly workflow runs at **23:00 UTC** daily via `.github/workflows/nightly-security-check.yml`.

It can also be triggered manually from the Actions tab with an optional dry-run flag.

After each run, a PR is opened against `main` with the new reports for review.

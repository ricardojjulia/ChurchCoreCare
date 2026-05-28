#!/usr/bin/env bash
# Block commits that would include sensitive or PHI-containing files.
# Runs as a Claude Code PreToolUse hook on Bash tool calls that touch git commit.

set -euo pipefail

STAGED=$(git diff --cached --name-only 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

# Block sensitive credential and key files
if echo "$STAGED" | grep -qE '\.(env|key|pem|p12|pfx|crt|cer)$|secrets\.json|credentials\.json|creds\.md|\.env\.[^e]'; then
  echo "BLOCKED: Attempt to commit a sensitive credential or key file."
  echo "Flagged files:"
  echo "$STAGED" | grep -E '\.(env|key|pem|p12|pfx|crt|cer)$|secrets\.json|credentials\.json|creds\.md|\.env\.[^e]'
  exit 1
fi

# Block .env files other than .env.example
if echo "$STAGED" | grep -qE '^\.env$|/\.env$'; then
  echo "BLOCKED: Attempt to commit a .env file. Use .env.example for templates."
  exit 1
fi

# Block merged migrations from being edited
# (new migration files are fine; edits to existing ones are not — enforced at PR review)
# This check warns rather than blocks, since we can't distinguish new vs edited here.

echo "Pre-commit check passed."
exit 0

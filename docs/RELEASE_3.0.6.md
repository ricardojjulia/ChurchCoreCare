# Release 3.0.6 — Lint Cleanup, Docs Refresh, and Build Sync

**Release Date:** March 28, 2026  
**Status:** Production Ready  
**Type:** Maintenance Release

## Summary

v3.0.6 consolidates the recent Workspace Studio repair cycle into the public release record, aligns root and package version metadata, and refreshes tracked web build output so committed artifacts match the current application source.

## Included in This Release

- Root `README.md` updated to reflect the `v3.0.6` release line.
- `docs/FUNCTIONAL-TESTING.md` added and normalized as the detailed functional testing and repair report.
- `docs/change-log.md` updated with a `v3.0.6` maintenance entry.
- Workspace package versions bumped from `3.0.5` to `3.0.6`.
- Tracked Vite assets refreshed to match the latest web build output.
- Stale tracked hashed bundles removed from `apps/web/public/assets`.
- Transient Playwright run folders ignored while keeping `test-results/.last-run.json` tracked.

## Versioned Components

- `package.json`
- `apps/api/package.json`
- `apps/web/package.json`
- `apps/worker/package.json`
- `packages/domain/package.json`
- `packages/i18n/package.json`
- `packages/telemetry/package.json`

## Validation

### Commands

- `pnpm lint`
- `pnpm --filter @faith/web build`

### Results

- Repo-visible documentation edits are editor-clean.
- Web build output is synchronized with the committed source.
- The tracked Playwright run marker file remains present.

## Compatibility

- No breaking changes.
- No API contract changes.
- No new database migration requirements.

## References

- `README.md`
- `docs/change-log.md`
- `docs/FUNCTIONAL-TESTING.md`
- `docs/v3.0.6-RELEASE-SUMMARY.md`

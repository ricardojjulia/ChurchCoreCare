# Release 1.0.0 — Client Management Module

**Release Date:** March 24, 2026  
**Status:** Production-Ready  
**Type:** Major Release

## Summary

v1.0.0 is the first production-ready release for client management in Faith Counseling. This release delivers complete client CRUD support, role-aware UI workflows, audit logging, and OpenAPI coverage.

## Included in This Release

- Client CRUD flows are available from API and web UI.
- Tenant scoping and RBAC enforcement are active for client operations.
- Audit events are emitted for create, read, update, and archive actions.
- OpenAPI documentation is updated for `/v1/clients/{id}`.

## API Coverage

### Endpoints

- `GET /v1/clients`
- `POST /v1/clients`
- `GET /v1/clients/{id}`
- `PATCH /v1/clients/{id}`
- `DELETE /v1/clients/{id}` (soft-delete/archive)

### Notes

- `DELETE` archives by setting status to `inactive`.
- `PATCH` supports partial updates, including status changes.
- Cross-tenant data access is blocked.

## UI Coverage

### Components

- `apps/web/src/components/ClientForm.jsx`
- `apps/web/src/components/ClientModal.jsx`
- `apps/web/src/components/WorkspaceGrid.jsx` (enhanced)
- `apps/web/src/App.jsx` (refresh integration)

### User Workflows

- Create a client from the Clients panel.
- Edit a client via modal form.
- Archive a client via delete action and confirmation.
- See immediate list refresh after create/edit/archive.

## Documentation Updated

- `docs/api/openapi.yaml`
- `docs/change-log.md`
- `README.md`
- `docs/v1.0.0-RELEASE-SUMMARY.md`

## Compatibility

- No breaking API changes.
- Existing workflows remain compatible.
- New behavior is additive to previous release line.

## Known Notes

- Web build may still emit the Vite warning about `outDir` and `publicDir` sharing the same directory in local builds.
- Soft-delete behavior is intentional to preserve data integrity.

## Quick Validation Checklist

- Create client succeeds and appears in list.
- Edit client persists and refreshes in UI.
- Archive client sets status to `inactive`.
- API docs expose all client endpoints.

## References

- `docs/change-log.md`
- `docs/PRE-BETA-DEVELOPMENT.md`
- `docs/api/openapi.yaml`

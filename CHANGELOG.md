# Changelog

All notable changes to Multi Sale Organizer are tracked here.

This project follows Semantic Versioning for the application version. Supabase database changes are tracked separately by timestamped migration files under `supabase/migrations`.

## [0.1.0] - 2026-05-21

### Added

- Multi-module ERP webapp baseline with Orders, POS, Inventory, Data Hub, Finance, Accounting, Documents, Performance, Workflow, Sales Agent and Settings modules.
- Public order, order tracking and Help Center routes.
- Data Hub foundation for raw events, data sources, entity resolution and data quality issues.
- Marketplace/platform synchronization scaffolding and webhook ingest functions.
- OpenRouter AI provider configuration with Lovable fallback.
- Customer stress scenario tests for demanding customer flows.
- Release/version management baseline with `VERSION`, changelog and release documentation.

### Fixed

- Platform sync refresh now invalidates channel and Data Hub queries after successful order sync.
- Imported orders now use valid order `source_type` values.
- Data quality issue inserts now match the current database schema.
- Existing platform orders update totals and shipping fees during re-sync.

### Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`


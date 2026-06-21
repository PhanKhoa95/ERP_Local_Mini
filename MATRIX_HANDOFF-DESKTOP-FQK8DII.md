# MATRIX Handoff

## Current State

This workspace is a Vite React TypeScript ERP Mini webapp backed by Supabase. The local development server is expected at:

```txt
http://127.0.0.1:8080/
```

For local UI testing, the demo shortcut account is:

```txt
username: admin
password: admin
```

The demo shortcut is local-only. Real authentication still uses Supabase Auth and email confirmation.

## Recent Structural Additions

- Order management has normalized control fields for source, customer, payment, warehouse, shipping zone, priority and lifecycle timestamps.
- Tracking routes are public and available at `/tracking` and `/order-tracking`.
- Data Hub foundation has been added with `data_sources`, `raw_events`, `entity_resolution_links` and `data_quality_issues`.
- Data Hub screen is available at `/data-hub` for manager-level users.
- Raw order events are recorded from manual/POS order creation, public storefront checkout and platform sync.
- Centralized validation in `src/lib/validation.ts` for consistent order payload checks across UI and backend hooks.
- CSV/Excel import flow added via `ImportOrdersDialog` component on the `/orders` page.
- Data Hub now includes connector health cards, failed-event counts, retry-all, per-connector retry and per-event retry controls.
- MATRIX launch/commercial/operations readiness docs were added for public web SaaS subscription preparation.
- MATRIX webapp structure placeholders were restored at `docs/.gitkeep`, `public/.gitkeep`, `src/.gitkeep` and `tests/.gitkeep`.
- AI functions now prefer OpenRouter when `OPENROUTER_API_KEY` is configured, with Lovable fallback preserved.
- `run.bat` now creates/checks local AI provider keys in `.env` before starting Vite.
- Customer stress scenarios for demanding buyers are documented and covered by a Vitest suite.

## Important Database Work

**Status**: Verified Pending (Programmatically audited on 2026-05-23). The remote Supabase instance `raomfcglvrhtfvkuyyou` does not currently contain the required tables (e.g. `raw_events`) or columns (e.g. `orders.source_type`).

Before running the application against the remote database, these local migrations must be pushed:

```txt
supabase/migrations/20260519093000_add_order_control_fields.sql
supabase/migrations/20260519102000_add_data_hub_foundation.sql
supabase/migrations/20260519173000_fix_performance_onboarding_rls.sql
supabase/migrations/20260519174000_harden_public_rls.sql
supabase/migrations/20260520065000_fix_all_insert_rls_violations.sql
supabase/migrations/20260521101500_repair_performance_onboarding_rls.sql
supabase/migrations/20260521103000_add_product_images_storage_policies.sql
```

Run these commands to apply the migrations to the remote project:

```sh
# 1. Link your local environment to the remote project (requires database password)
npx supabase link --project-ref raomfcglvrhtfvkuyyou

# 2. Push all local migrations to the remote database
npx supabase db push
```

You can run our verification script to check the remote schema status at any time:
```sh
node scratch/verify-supabase.js
```

## Verification Baseline

Use this command before handoff:

```sh
npm run test:local
```

Known current lint state: ESLint passes with warnings in pre-existing files, mostly React hook dependency and fast-refresh warnings.

## Completed Tasks

1. ~~Add quality issue creation rules for missing phone, missing address, unmapped SKU and duplicate external order ID.~~ Done: centralized validation in `src/lib/validation.ts`, deduplication via `platform_order_id` in `useOrders.ts`.
2. ~~Add import connectors for CSV/Excel.~~ Done: `ImportOrdersDialog` with auto column mapping, preview and batch import.
3. ~~Fix RLS policy for `performance_onboarding` INSERT violation.~~ Done: split `FOR ALL` into separate SELECT/INSERT/UPDATE/DELETE policies in migration `20260519173000`.
4. ~~Harden RLS policies for public storefront order lookup.~~ Done: migration `20260519174000` with explicit anon policies for tracking, storefront and Data Hub protection.
5. ~~Add webhook capture for social inbox/marketplace payloads.~~ Done: `supabase/functions/webhook-ingest/index.ts` with quality scoring and deduplication.
6. ~~Add identity resolution between raw customers, partners and order contacts.~~ Done: `src/lib/identityResolution.ts`, `src/hooks/useIdentityResolution.ts` with phone/name matching and auto-linking.
7. ~~Add SKU-to-product_id resolution in CSV import flow.~~ Done: `src/lib/skuResolution.ts` integrated into `ImportOrdersDialog`.
8. ~~Add smoke tests for critical business flows.~~ Done: 4 new test files with 40 test cases covering validation, Data Hub, identity resolution and SKU resolution.
9. ~~Create deployment runbook.~~ Done: `docs/DEPLOYMENT_RUNBOOK.md`.
10. ~~Restore missing MATRIX webapp structure placeholders.~~ Done: `.gitkeep` files added for required structure validation.
11. ~~Add OpenRouter AI provider configuration.~~ Done: Edge Function fallback routing, Settings AI form, `.env.example`, `run.bat` and docs updated.
12. ~~Add demanding customer stress tests.~~ Done: `src/hooks/__tests__/customerStressScenarios.test.ts` and `docs/CUSTOMER_STRESS_SCENARIOS.md`.
13. ~~Add connector health and retry dashboard tab in Data Hub.~~ Done: `/data-hub` connection dashboard supports failed-event counts, retry-all, per-connector retry and per-event retry.
14. ~~Create launch/commercial/operations readiness gates.~~ Done: `docs/LAUNCH_READINESS.md`, `docs/COMMERCIAL_READINESS.md`, `docs/OPERATIONS_RUNBOOK.md` and `docs/CODEX_REMINDERS.md`.
15. ~~Resolve package-lock.json version mismatch and release:check failure.~~ Done: Updated root package name and version to match package.json.
16. ~~Audit Edge Function secrets and service role usage.~~ Done: Audited all 40 functions and confirmed zero real secrets violations (only mock test tokens). See `docs/EDGE_FUNCTIONS_AUDIT.md`.
17. ~~Add analytics materialized views over normalized Data Hub snapshots.~~ Done: Added migration `20260525164000_add_data_hub_materialized_views.sql` with `analytics_data_hub_snapshots_secured` RLS wrapper view.
18. ~~Turn the customer stress scenario checklist into browser-driven E2E tests.~~ Done: Configured Playwright and automated the checklist under `tests/e2e/customerStressScenarios.spec.ts` (all 4 tests passing).

## Next Coding / Operational Tasks

1. Apply Supabase migrations to remote DB (`npx supabase db push`) and confirm `/orders`, `/pos`, `/order`, `/tracking` and `/data-hub` against the real project.
2. Seed Data Hub default sources from `/data-hub` using the source initialization action on the live environment.
3. Deploy `webhook-ingest` and `sync-platform-orders` Edge Functions and test with real external payloads.
4. Validate Data Hub retry actions against real failed connector events and confirm manager/admin RLS behavior.
5. Set production AI secrets with `npx supabase secrets set OPENROUTER_API_KEY=<key> OPENROUTER_MODEL=google/gemini-2.5-flash`.

## Do Not Revert

Do not revert local user-generated screenshots, local dev logs, `.env`, or unrelated working files unless the user explicitly asks. This directory is not currently a git repository.

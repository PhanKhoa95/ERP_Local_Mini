# MATRIX Handoff

Last refreshed: 2026-06-17 (Asia/Saigon)

## Current State

This workspace is a Vite React TypeScript ERP Mini webapp backed by Supabase.

Local development is expected at:

```txt
http://127.0.0.1:8080/
```

For local UI testing, the demo shortcut account is:

```txt
username: admin
password: admin
```

The demo shortcut is local-only and enabled for local Vite development. Real authentication still uses Supabase Auth and email confirmation.

## Workspace Notes

- This directory is not currently a git repository, so use local file inspection and validation commands instead of git diff/status for handoff verification.
- App version is `0.1.0`; `VERSION`, `package.json` and `package-lock.json` are aligned.
- `node_modules` and `dist` are present locally. Exclude them when searching unless they are explicitly needed.
- `.env` and `.env.example` exist. Do not expose or copy secrets from `.env`.

## Recent Structural Additions

- **Casso.vn bank transfer reconciliation**: Auto-reconciliation integrated into the Finance section `/finance`. Features a webhook simulator, automated regex-based order number extraction (supports `POS-ORD-XXXX` and `ORD-WS-XXXX`), and automatic double-entry hạch toán kế toán (Nợ TK 112 / Có TK 131) in Sổ cái.
- **Deep Role-Based Access Control**: Strict access verification and routing protection. Admins see 100% of sidebar menus; Managers cannot see `/performance/setup` and are blocked/redirected if accessing directly; Staff have limited views (only Dashboard, POS, Orders, Documents) and are blocked/redirected from `/accounting` and `/performance/setup`.
- **E2E Playwright test coverage**: 
  - `tests/e2e/casso_test.spec.ts` verifying the bank transfer webhook matching flow.
  - `tests/e2e/role_verification/role_verification.spec.ts` verifying sidebar visibility and URL security redirects.
- Order management has normalized control fields for source, customer, payment, warehouse, shipping zone, priority and lifecycle timestamps.
- Tracking routes are public and available at `/tracking` and `/order-tracking`.
- Data Hub foundation has been added with `data_sources`, `raw_events`, `entity_resolution_links` and `data_quality_issues`.
- Data Hub screen is available at `/data-hub` for manager-level users.
- Raw order events are recorded from manual/POS order creation, public storefront checkout, platform sync, webhook ingest and CSV/Excel import.
- Centralized validation in `src/lib/validation.ts` keeps order payload checks consistent across UI and backend hooks.
- CSV/Excel import flow is available through `src/components/orders/ImportOrdersDialog.tsx` on the `/orders` page.
- Data Hub includes connector health cards, failed-event counts, retry-all, per-connector retry and per-event retry controls.
- Analytics hooks now read channel attribution, customer lifetime value and cohort views from `src/hooks/useAnalytics.ts`.
- BigData/Data Hub analytics migrations exist locally, including scheduled data quality checks, PII minimization, analytics views and the secured Data Hub snapshot materialized view.
- MATRIX launch/commercial/operations readiness docs exist for public web SaaS subscription preparation.
- AI functions prefer OpenRouter when `OPENROUTER_API_KEY` is configured, with Lovable fallback preserved.
- `run.bat` creates/checks local AI provider keys in `.env` before starting Vite.
- Customer stress scenarios for demanding buyers are documented and covered by Vitest.
- Release/versioning checks are available through `scripts/validate-versioning.mjs`.
- Edge Function secret/service-role audit is available through `scripts/audit-edge-functions.mjs`.

## Important Database Work

**Status**: Remote Supabase status needs re-verification. The last documented remote audit on 2026-05-23 reported that project `raomfcglvrhtfvkuyyou` did not contain required newer tables/columns such as `raw_events` and `orders.source_type`. This handoff refresh did not run a remote schema audit, so do not treat that old remote result as current proof.

Before running current local UI flows against the remote database, verify and push the local migrations below if they are still pending:

```txt
supabase/migrations/20260519093000_add_order_control_fields.sql
supabase/migrations/20260519102000_add_data_hub_foundation.sql
supabase/migrations/20260519173000_fix_performance_onboarding_rls.sql
supabase/migrations/20260519174000_harden_public_rls.sql
supabase/migrations/20260520065000_fix_all_insert_rls_violations.sql
supabase/migrations/20260521101500_repair_performance_onboarding_rls.sql
supabase/migrations/20260521103000_add_product_images_storage_policies.sql
supabase/migrations/20260522000000_add_bigdata_analytics_and_governance.sql
supabase/migrations/20260525164000_add_data_hub_materialized_views.sql
```

Remote migration workflow:

```sh
npx supabase link --project-ref raomfcglvrhtfvkuyyou
npx supabase migration list
npx supabase db push
```

After pushing, validate these routes against the real project data:

```txt
/orders
/pos
/order
/tracking
/order-tracking
/data-hub
```

## Verification Baseline

Run the full local gate before handoff:

```sh
npm run test:local
```

Latest local verification in this workspace:

```txt
2026-06-17: npm run typecheck passed.
2026-06-17: npm run lint passed with 0 errors, 14 warnings.
2026-06-17: npx playwright test tests/e2e/casso_test.spec.ts passed.
2026-06-17: npx playwright test tests/e2e/role_verification/role_verification.spec.ts passed.
```

`npm run test:local` covers TypeScript, ESLint, Vitest and production build.

Known current lint state: ESLint exits successfully with 14 warnings in pre-existing files:

```txt
src/components/performance/AttendanceTab.tsx
src/components/performance/EmployeeDetailDialog.tsx
src/components/performance/reports/DailyReportForm.tsx
src/components/performance/reports/WeeklyReportForm.tsx
src/components/settings/SystemHealthTab.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/form.tsx
src/components/ui/navigation-menu.tsx
src/components/ui/sidebar.tsx
src/components/ui/sonner.tsx
src/components/ui/toggle.tsx
src/contexts/AuthContext.tsx
```

Use this command when Edge Function secret/service-role evidence needs to be refreshed:

```sh
node scripts/audit-edge-functions.mjs
```

Note: that script rewrites `docs/EDGE_FUNCTIONS_AUDIT.md`.

## Completed Tasks

1. ~~Add quality issue creation rules for missing phone, missing address, unmapped SKU and duplicate external order ID.~~ Done: centralized validation in `src/lib/validation.ts`, deduplication via `platform_order_id` in `src/hooks/useOrders.ts`.
2. ~~Add import connectors for CSV/Excel.~~ Done: `ImportOrdersDialog` with auto column mapping, preview and batch import.
3. ~~Fix RLS policy for `performance_onboarding` INSERT violation.~~ Done: split `FOR ALL` into separate SELECT/INSERT/UPDATE/DELETE policies in migration `20260519173000`.
4. ~~Harden RLS policies for public storefront order lookup.~~ Done: migration `20260519174000` with explicit anon policies for tracking, storefront and Data Hub protection.
5. ~~Add webhook capture for social inbox/marketplace payloads.~~ Done: `supabase/functions/webhook-ingest/index.ts` with quality scoring and deduplication.
6. ~~Add identity resolution between raw customers, partners and order contacts.~~ Done: `src/lib/identityResolution.ts`, `src/hooks/useIdentityResolution.ts` with phone/name matching and auto-linking.
7. ~~Add SKU-to-product_id resolution in CSV import flow.~~ Done: `src/lib/skuResolution.ts` integrated into `ImportOrdersDialog`.
8. ~~Add smoke tests for critical business flows.~~ Done: tests cover validation, Data Hub, identity resolution, SKU resolution and adjacent business logic.
9. ~~Create deployment runbook.~~ Done: `docs/DEPLOYMENT_RUNBOOK.md`.
10. ~~Restore missing MATRIX webapp structure placeholders.~~ Done: `.gitkeep` placeholders exist for required structure validation.
11. ~~Add OpenRouter AI provider configuration.~~ Done: Edge Function fallback routing, Settings AI form, `.env.example`, `run.bat` and docs updated.
12. ~~Add demanding customer stress tests.~~ Done: `src/hooks/__tests__/customerStressScenarios.test.ts` and `docs/CUSTOMER_STRESS_SCENARIOS.md`.
13. ~~Add connector health and retry dashboard tab in Data Hub.~~ Done: `/data-hub` connection dashboard supports failed-event counts, retry-all, per-connector retry and per-event retry.
14. ~~Create launch/commercial/operations readiness gates.~~ Done: `docs/LAUNCH_READINESS.md`, `docs/COMMERCIAL_READINESS.md`, `docs/OPERATIONS_RUNBOOK.md` and `docs/CODEX_REMINDERS.md`.
15. ~~Resolve package-lock.json version mismatch and release:check failure.~~ Done: root package name/version match `package.json` and `VERSION`.
16. ~~Audit Edge Function secrets and service role usage.~~ Done: audit tooling and report exist at `scripts/audit-edge-functions.mjs` and `docs/EDGE_FUNCTIONS_AUDIT.md`.
17. ~~Add analytics materialized views over normalized Data Hub snapshots.~~ Done: migration `20260525164000_add_data_hub_materialized_views.sql` adds `analytics_data_hub_snapshots`, secured wrapper view and refresh function.
18. ~~Add BigData analytics and governance database layer.~~ Done: migration `20260522000000_add_bigdata_analytics_and_governance.sql` adds attribution/CLV/cohort views, scheduled data quality checks and PII minimization function.
19. ~~Integrate Casso bank transfer reconciliation and webhook simulation.~~ Done: auto bank reconciliation on `/finance` matching order codes (regex `/[A-Z0-9]*-?ORD-[A-Z0-9-]+/i`), updating debt and orders, and generating auto journal entries (Nợ TK 112 / Có TK 131).
20. ~~Verify deep multi-role access control rules.~~ Done: E2E Playwright verification script tests Admin, Manager and Staff sidebar and route permission blocks.

## Next Coding / Operational Tasks

1. Re-verify remote Supabase migration state with `npx supabase migration list`, then run `npx supabase db push` if the listed critical migrations are pending.
2. Confirm current Supabase types in `src/integrations/supabase/types.ts` match the remote schema after migrations are pushed.
3. Smoke-test `/orders`, `/pos`, `/order`, `/tracking`, `/order-tracking` and `/data-hub` against the real Supabase project.
4. Seed Data Hub default sources from `/data-hub` using the source initialization action on the live environment.
5. Deploy or redeploy `webhook-ingest` and `sync-platform-orders`, then test with real external payloads.
6. Validate Data Hub retry actions against real failed connector events and confirm manager/admin RLS behavior.
7. Set production AI secrets with `npx supabase secrets set OPENROUTER_API_KEY=<key> OPENROUTER_MODEL=google/gemini-2.5-flash OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`.
8. Run `node scripts/audit-edge-functions.mjs` after any Edge Function changes and review the regenerated report.

## Do Not Revert

Do not revert local user-generated screenshots, local dev logs, `.env`, `dist`, `node_modules`, or unrelated working files unless the user explicitly asks. This directory is not currently a git repository.

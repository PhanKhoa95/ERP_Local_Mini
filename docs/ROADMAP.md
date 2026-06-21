# Roadmap

## Phase 1: Local Demo Stability (Complete)

- [x] Keep `admin/admin` local demo login working for UI review.
- [x] Keep public tracking accessible without auth.
- [x] Keep `npm run test:local` passing.
- [x] Document all setup and verification steps.

## Phase 2: Order Control Completion (Complete)

- [x] Add order-control migration.
- [x] Confirm manual/POS/public/platform orders write normalized fields.
- [x] Add UI checks for missing customer phone, address, warehouse and payment information.
- [x] Add export/report columns for new order-control fields.

## Phase 3: Data Hub Foundation (Complete)

- [x] Add Data Hub migration.
- [x] Seed default sources from `/data-hub`.
- [x] Record raw events from all order sources.
- [x] Add data quality issue creation for incomplete payloads.
- [x] Add dedupe rules for platform order IDs and customer identifiers.

## Phase 4: Multi-Channel Expansion (Mostly Complete)

- [x] Add import flow for CSV/Excel.
- [x] Add webhook capture for social inbox, marketplace and partner APIs.
- [x] Add identity resolution between raw customers, partners and order contacts.
- [x] Add SKU-to-product_id resolution in CSV import flow.
- [x] Add connector health and retry dashboard.

## Phase 5: BigData and Analytics (Complete)

- [x] Add analytics materialized views or warehouse export jobs.
- [x] Add cohort, channel attribution and customer lifetime value dashboards.
- [x] Add governance for retention, consent and PII minimization.
- [x] Add scheduled data quality checks.

## Phase 6: Production Hardening (Mostly Complete)

- [x] Tighten RLS on public access policies.
- [x] Fix RLS INSERT violation on `performance_onboarding`.
- [x] Add smoke tests for validation, Data Hub, identity resolution and SKU resolution.
- [x] Add deployment runbook and rollback notes.
- [x] Add launch, commercial and operations readiness gates.
- [x] Audit Edge Function secrets and service role usage.

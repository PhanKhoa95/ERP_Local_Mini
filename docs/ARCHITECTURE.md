# Architecture

## Overview

ERP Mini is a Vite React TypeScript application using Supabase for authentication, relational data, storage-adjacent features and Edge Functions. The UI is built with shadcn/ui, Tailwind CSS and React Query.

## Runtime Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| App shell and routing | `src/App.tsx`, `src/routes.tsx`, `src/components/layout` | Auth gate, public routes, protected routes, layout and navigation |
| Pages | `src/pages` | Route-level product workflows |
| Feature components | `src/components/<domain>` | Dialogs, panels, workflow-specific UI |
| Data hooks | `src/hooks` | React Query reads, mutations and cache invalidation |
| Shared helpers | `src/lib` | Formatting, export, local auth, query invalidation, validation, identity resolution, SKU resolution and cross-module helpers |
| Supabase schema | `supabase/migrations` | Database schema, RLS, functions and indexes |
| Supabase functions | `supabase/functions` | Server-side integrations, AI helpers, webhook ingest and platform sync |

## Main User Flows

- Authenticated ERP: `/`, `/orders`, `/pos`, `/inventory`, `/partners`, `/bookings`, `/finance`, `/reports`, `/settings`, `/data-hub`.
- Public storefront: `/order`, `/public-order`.
- Public tracking: `/tracking`, `/order-tracking`.
- Platform callback/sync: `/platform-callback` and `supabase/functions/sync-platform-orders`.

## Data Model Direction

Operational entities stay normalized:

- `orders`, `order_items`, `partners`, `products`, `warehouses`, `shipping_zones`, `sales_channels`.

Data ingestion uses a separate Data Hub:

- `data_sources`: configured source/channel inventory.
- `raw_events`: raw incoming payloads and normalized snapshots.
- `entity_resolution_links`: links between raw events and resolved business entities.
- `data_quality_issues`: missing/invalid/duplicate data findings.

This separation keeps the ERP screens stable while still allowing multi-channel collection for analytics and BigData.

## Identity Resolution

Identity resolution connects raw Data Hub events to known business entities (partners and orders) using:

- **Phone matching**: Normalized Vietnamese phone numbers (`+84`, `84`, `0` prefixes handled).
- **Name matching**: Diacritics-stripped fuzzy comparison.
- **Auto-linking**: Perfect single-phone matches are auto-linked with 100% confidence.
- **Manual review**: Multiple candidates or low-confidence matches require manual confirmation.

Code lives in `src/lib/identityResolution.ts` with a React hook at `src/hooks/useIdentityResolution.ts`.

## SKU Resolution

SKU resolution maps product SKU strings from CSV/Excel imports to actual `product_id` values:

- **Exact SKU match**: 100% confidence.
- **Case-insensitive match**: 90% confidence.
- **Name partial match**: 50% confidence (fallback).

Code lives in `src/lib/skuResolution.ts` and is integrated into `ImportOrdersDialog`.

## Webhook Ingest

The `webhook-ingest` Edge Function captures payloads from social inbox, marketplace and partner APIs:

- Accepts `?source=shopee|lazada|tiktok|zalo|messenger|api` and `&company_id=<uuid>`.
- Records into `raw_events` with quality scoring and deduplication.
- Auto-creates `data_quality_issues` for missing critical fields.
- Returns 200 for duplicates (idempotent).

## Public vs Authenticated Boundary

Public routes must never assume a logged-in company member. Public checkout and tracking must use narrowly scoped policies and minimal returned fields. Authenticated ERP routes use `ProtectedRoute` and company context from `AuthContext`.

## Verification Boundary

Before handoff, use:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

For full local validation:

```sh
npm run test:local
```

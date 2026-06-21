# Data Hub and BigData Foundation

## Purpose

Data Hub is the ingestion layer for multi-channel data. It stores raw payloads before they become operational records like orders, partners or inventory transactions.

## Tables

| Table | Purpose |
| --- | --- |
| `data_sources` | Registry of POS, public store, manual, marketplace, API, webhook and import sources |
| `raw_events` | Raw event payloads and normalized snapshots |
| `entity_resolution_links` | Links between raw events and resolved entities |
| `data_quality_issues` | Missing, invalid, duplicate or rejected data findings |

## Current Captured Events

- Manual order creation through `useOrders`.
- POS order creation through `useOrders`.
- Public storefront checkout through `PublicOrder`.
- Marketplace sync through `sync-platform-orders`.
- Webhook ingest from social inbox, marketplace and partner APIs through `webhook-ingest`.
- CSV/Excel file import through `ImportOrdersDialog`.

## Source Types

Current allowed source types:

- `manual`
- `pos`
- `public_store`
- `marketplace`
- `social`
- `website`
- `crm`
- `webhook`
- `api`
- `file_import`
- `other`

## Operational Flow

1. A channel creates or syncs data.
2. The operational record is written, for example `orders`.
3. A best-effort raw event is inserted into `raw_events`.
4. The Data Hub page shows source health, event quality, normalized status and quality issues.
5. Operators can retry failed connector events from the Data Hub connection dashboard.
6. Future pipelines can dedupe, resolve identity and export to analytics storage.

## Migration Required

Data Hub requires:

```txt
supabase/migrations/20260519102000_add_data_hub_foundation.sql
```

Push with:

```sh
npx supabase link --project-ref raomfcglvrhtfvkuyyou
npx supabase db push
```

## Next Improvements

- ✅ Auto-create `data_quality_issues` when required fields are missing.
- ✅ Add CSV/Excel importer into `raw_events`.
- ✅ Add webhook endpoint for external channels.
- ✅ Add duplicate detection by `dedupe_key`, phone and platform order ID.
- ✅ Add identity resolution between raw customers, partners and orders.
- ✅ Add SKU-to-product_id resolution in import flow.
- [x] Add connector health and retry dashboard.
- ✅ Add analytics views over normalized snapshots.
- ✅ Add scheduled data quality checks.

## Connector Health and Retry

The `/data-hub` screen includes a connection dashboard for commercial operations:

- connector status cards with last ingestion time, recent event count and failed event count
- connector alert cards for sources with `last_error`, `error` status or failed events
- retry-all action for failed `raw_events`
- per-connector retry action when failed events belong to a known `data_source_id`
- per-event retry action for the newest failed events

Retry moves failed events back to `ingestion_status = received`, `validation_status = queued`, clears `error_message`, and reactivates the related `data_sources` row when possible.

## Identity Resolution

The identity resolution module (`src/lib/identityResolution.ts`) connects raw events to known entities:

| Match Type | Priority | Confidence |
| --- | --- | --- |
| Exact phone | 1 | 100% |
| Exact email | 2 | 100% |
| Name fuzzy | 3 | 60-90% |

Auto-linking happens when a single phone match exists with 100% confidence. Otherwise, candidates are presented for manual review.

## SKU Resolution

The SKU resolution module (`src/lib/skuResolution.ts`) maps import SKU strings to `product_id`:

| Strategy | Confidence |
| --- | --- |
| Exact SKU match | 100% |
| Case-insensitive SKU | 90% |
| Name partial match | 50% |

## Webhook Ingest

External channels send payloads to:

```txt
POST /functions/v1/webhook-ingest?source=<channel>&company_id=<uuid>
```

The function:
1. Records into `raw_events` with quality scoring.
2. Deduplicates on `dedupe_key` (returns 200 for duplicates).
3. Creates `data_quality_issues` for missing critical fields.
4. Supports: Shopee, Lazada, TikTok, Zalo, Messenger, Facebook, Instagram, API, webhook, website.

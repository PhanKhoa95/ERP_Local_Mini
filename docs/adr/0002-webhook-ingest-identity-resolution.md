# ADR-0002: Multi-Channel Webhook Ingest and Identity Resolution

## Status

Accepted

## Date

2026-05-19

## Context

The ERP Mini Data Hub captures raw data from multiple channels (manual, POS, public store, marketplace sync). To complete the multi-channel expansion (MATRIX ROADMAP Phase 4), we need:

1. A standard endpoint for external systems to push data into the Data Hub.
2. A mechanism to link raw events to known business entities (partners, orders).
3. A way to resolve product SKUs from file imports to actual product records.

## Decision

### Webhook Ingest

Created `supabase/functions/webhook-ingest/index.ts` as a new Edge Function that:

- Accepts POST requests with `?source=<channel>&company_id=<uuid>`.
- Records payloads into `raw_events` with automatic quality scoring.
- Deduplicates on `dedupe_key` (idempotent).
- Creates `data_quality_issues` for missing critical fields.

This keeps the webhook handling server-side and isolated from the frontend.

### Identity Resolution

Created `src/lib/identityResolution.ts` with:

- Phone-based matching (highest priority, 100% confidence).
- Name-based fuzzy matching (60-90% confidence).
- Auto-linking for single perfect phone matches.
- Manual review flow for ambiguous or multiple candidates.

This lives in the frontend lib layer because resolution needs to be triggered from the Data Hub UI and during import flows.

### SKU Resolution

Created `src/lib/skuResolution.ts` with:

- Exact SKU match (100% confidence).
- Case-insensitive SKU match (90% confidence).
- Name partial match (50% confidence, fallback).

Integrated into `ImportOrdersDialog` for auto-resolution during CSV/Excel import.

## Consequences

- External channels (Shopee, Lazada, Zalo, etc.) can now push data via a single endpoint.
- Raw events are automatically scored for quality.
- Identity resolution is opt-in and non-destructive (never modifies source entities).
- SKU resolution reduces manual product mapping during imports.
- All new logic is covered by unit tests (4 new test files, 40 new test cases).

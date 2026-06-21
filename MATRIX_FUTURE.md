# MATRIX Future Standard

## Horizon

12-month structure direction for ERP Mini as a multi-channel operations system that can grow into analytics and BigData workflows.

## Target Shape

The app should stay as a modular webapp with clear module boundaries:

- User-facing screens in `src/pages`.
- Reusable UI and feature components in `src/components`.
- Data access and mutations in `src/hooks`.
- Cross-cutting helpers in `src/lib`.
- Supabase schema history in `supabase/migrations`.
- Supabase Edge Functions in `supabase/functions`.
- Long-lived project decisions and operating procedures in `docs`.

## Growth Principles

- Keep raw ingestion separate from normalized operational tables.
- Do not overload `orders` and `partners` with every channel-specific payload.
- Prefer additive migrations over destructive schema changes.
- Keep public storefront and tracking flows explicitly separated from authenticated ERP flows.
- Treat generated Supabase types as a contract; update them whenever migrations add fields.
- Use `raw_events` for auditability before transforming data into operational entities.

## Documentation Contract

Every major feature should have one of:

- Architecture note in `docs/ARCHITECTURE.md` if it changes system boundaries.
- Module ownership update in `docs/MODULE_MAP.md`.
- Operational runbook update in `docs/SUPABASE_OPERATIONS.md`.
- ADR in `docs/adr/` if the decision affects future development.

## Data Quality & Validation

1. **Validation**: All incoming orders (manual or via API) must contain a minimum set of fields to be considered valid for operation. These are verified using `src/lib/validation.ts`:
   - `channel_id`, `customer_phone`, `shipping_address` or `customer_address`, `warehouse_id`, `payment_method`, and at least 1 product.
2. **Deduplication**: Platform orders are deduplicated on `platform_order_id` and `company_id`. A duplicate entry will log a `high` severity data quality issue and halt insertion.
3. **Data Quality Issues**: Incomplete normalized payloads (e.g., missing critical fields from a webhook payload) will trigger `medium` severity data quality issue logs to allow manual correction in the Data Hub.

## Near-Term Priorities

1. Apply pending Supabase migrations.
2. Confirm Data Hub works with live order traffic.
3. Add end-to-end smoke tests for critical business flows.
4. Create importer pipeline for files, APIs and webhooks.

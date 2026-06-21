# Supabase Operations

## Environment

The frontend expects these environment variables:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Create `.env` from `.env.example` and fill the values.

## Project Ref

Current known Supabase project ref:

```txt
raomfcglvrhtfvkuyyou
```

## Push Migrations

Link once:

```sh
npx supabase link --project-ref raomfcglvrhtfvkuyyou
```

Push pending migrations:

```sh
npx supabase db push
```

## Pending Critical Migrations

These are required for the latest local UI and data flows:

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

## Edge Functions

Edge Functions live in `supabase/functions`. The most relevant integration function for order ingestion is:

```txt
supabase/functions/sync-platform-orders/index.ts
```

It syncs marketplace orders and records raw events into Data Hub when the migration exists.

## AI Provider Secrets

AI Edge Functions prefer OpenRouter when these secrets are available:

```sh
npx supabase secrets set OPENROUTER_API_KEY=<your-openrouter-key>
npx supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-flash
npx supabase secrets set OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

If `OPENROUTER_API_KEY` is empty, the existing Lovable gateway fallback still uses `LOVABLE_API_KEY`.

### Webhook Ingest

The webhook ingest function captures social inbox, marketplace and partner API payloads:

```txt
supabase/functions/webhook-ingest/index.ts
```

Usage:

```txt
POST /functions/v1/webhook-ingest?source=shopee&company_id=<uuid>
Content-Type: application/json
{...payload from external channel...}
```

Supported source values: `shopee`, `lazada`, `tiktok`, `zalo`, `messenger`, `facebook`, `instagram`, `api`, `webhook`, `website`.

## RLS Notes

The app uses company-scoped access via `company_members`, `is_company_member` and `is_company_admin` policies in many newer tables. Public storefront/tracking policies should be reviewed before production because early migrations include permissive public order read/create policies.

## Type Updates

When adding migration fields, update:

```txt
src/integrations/supabase/types.ts
```

If Supabase CLI type generation is available in the environment, prefer generating types from the linked project. Manual updates should stay tightly scoped to new tables/columns.

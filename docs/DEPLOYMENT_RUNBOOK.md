# Deployment Runbook

## Pre-Deployment Checklist

Before deploying to production, verify:

```sh
npm run test:local
```

This runs typecheck -> lint -> test -> build in sequence. All steps must pass.

## Environment Setup

### Required Environment Variables

```txt
VITE_SUPABASE_URL=https://raomfcglvrhtfvkuyyou.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

Create `.env` from `.env.example` and fill the values.

### Edge Function Secrets

The following Supabase secrets must be set for Edge Functions:

```txt
SUPABASE_URL               (auto-injected)
SUPABASE_SERVICE_ROLE_KEY  (auto-injected)
OPENROUTER_API_KEY         (preferred AI provider)
OPENROUTER_MODEL           (example: google/gemini-2.5-flash)
OPENROUTER_BASE_URL        (default: https://openrouter.ai/api/v1)
LOVABLE_API_KEY            (fallback AI provider)
OPENAI_API_KEY             (only for functions that explicitly need OpenAI)
```

## Database Migrations

### Link Project

```sh
npx supabase link --project-ref raomfcglvrhtfvkuyyou
```

### Push Pending Migrations

```sh
npx supabase db push
```

### Critical Migration Order

Migrations must be applied in timestamp order:

1. `20260519093000_add_order_control_fields.sql` - Order lifecycle timestamps and normalized fields.
2. `20260519102000_add_data_hub_foundation.sql` - Data Hub tables and RLS.
3. `20260519173000_fix_performance_onboarding_rls.sql` - Split RLS policies.
4. `20260519174000_harden_public_rls.sql` - Public access hardening.
5. `20260520065000_fix_all_insert_rls_violations.sql` - Broad insert-policy repair for UI write flows.
6. `20260521101500_repair_performance_onboarding_rls.sql` - Follow-up repair for real Supabase users.
7. `20260521103000_add_product_images_storage_policies.sql` - Product image bucket and Storage RLS policies.

## Frontend Deployment

### Build

```sh
npm run build
```

Output is in `dist/`. Deploy via static hosting such as Lovable, Netlify or Vercel.

### Verify Build

```sh
npm run preview
```

Open `http://localhost:4173/` and verify:

- [ ] Auth page loads and login works.
- [ ] Dashboard renders with stats.
- [ ] POS page creates orders.
- [ ] Public order page is accessible without auth.
- [ ] Order tracking works with order number and phone.
- [ ] Data Hub page shows sources and events.

## Edge Function Deployment

### Deploy All Functions

```sh
npx supabase functions deploy
```

### Deploy Specific Functions

```sh
npx supabase functions deploy webhook-ingest
npx supabase functions deploy sync-platform-orders
```

### Configure AI Secrets

```sh
npx supabase secrets set OPENROUTER_API_KEY=<your-openrouter-key>
npx supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-flash
npx supabase secrets set OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

If OpenRouter is not configured, AI functions fall back to `LOVABLE_API_KEY` where the fallback key is present.

### Verify Webhook Ingest

```sh
curl -X POST "https://raomfcglvrhtfvkuyyou.supabase.co/functions/v1/webhook-ingest?source=test&company_id=<uuid>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{"event_type":"test","customer_name":"Test"}'
```

Expected response:

```json
{"success":true,"message":"Event ingested","dedupe_key":"...","quality_score":17}
```

## Rollback Procedures

### Frontend Rollback

Re-deploy the previous `dist/` build. The frontend is a static SPA with no server state.

### Database Rollback

**CAUTION**: Supabase migrations are forward-only. To rollback:

1. Identify the migration to revert.
2. Create a new migration that undoes the changes, for example `DROP TABLE IF EXISTS` or `DROP POLICY IF EXISTS`.
3. Push the reversal migration.

Never edit or delete existing migration files after they have been applied.

### Edge Function Rollback

Re-deploy the previous version of the function:

```sh
git checkout <previous-commit> -- supabase/functions/<function-name>
npx supabase functions deploy <function-name>
```

## Monitoring

### Key Health Checks

1. **Supabase Dashboard**: Check API usage, error rates and database connections.
2. **Data Hub**: Monitor `/data-hub` for source health, open quality issues and raw event ingestion rate.
3. **Edge Function Logs**: Check Supabase Dashboard -> Edge Functions -> Logs.

### Alerts to Watch

- RLS policy violations in Supabase logs.
- High error rate in webhook-ingest function.
- Stale data sources with no events for more than 24 hours.
- Growing `data_quality_issues` backlog.

## Post-Deployment Verification

After deployment, verify these critical flows:

1. **Auth**: Login with email -> Dashboard loads.
2. **POS Checkout**: Create order -> Stock deducted -> Raw event recorded.
3. **Public Storefront**: `/order` -> Place order without login.
4. **Order Tracking**: `/tracking` -> Search by order number and phone.
5. **Data Hub**: `/data-hub` -> Sources visible -> Events listed -> Quality issues shown.
6. **CSV Import**: `/orders` -> Import -> SKU resolution -> Orders created.
7. **Webhook**: POST to webhook-ingest -> Raw event appears in Data Hub.

# Edge Functions Audit Report

## Summary
- **Total Files Audited**: 40
- **Hardcoded Secret Violations**: 1

## Environment Variables Used
Each variable must be securely set using `supabase secrets set` in production.
- `LOVABLE_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_MODEL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

## Service Role Key Usage (`SUPABASE_SERVICE_ROLE_KEY`)
The following files access the service role client. Ensure these files only perform actions authorized for administrative use and validate inputs properly to avoid privilege escalation:
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-anomaly-detection/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-anonymize-feedback/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-auto-replenishment/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-cashflow-forecast/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-erp-assistant/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-finance-anomaly/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-risk-detection/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-screen-cv/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-skill-gap-analysis/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/ai-task-dispatcher/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/api-gateway/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/auto-posting/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/calculate-kpi-score/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/chat-with-docs/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/check-document-expiry/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/data-integrity-check/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/generate-embedding/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/integration-sync/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/manage-bookings/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/manage-contracts/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/partner-webhook/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/process-document/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/sales-agent/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/semantic-search/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/send-notification/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/shipping-carrier-proxy/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/sync-platform-orders/index.ts)
- [index.ts](file:///C:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/supabase/functions/webhook-ingest/index.ts)

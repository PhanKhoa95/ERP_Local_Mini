# Edge Functions Audit Report

## Summary
- **Total Files Audited**: 40
- **Hardcoded Secret Violations**: 0
- **Missing Authentication Gates**: 0
- **Gateway-only Endpoints Requiring Authorization Review**: 22

## Potential Hardcoded Secrets
- None detected.

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
- [ai-anomaly-detection/index.ts](../supabase/functions/ai-anomaly-detection/index.ts)
- [ai-anonymize-feedback/index.ts](../supabase/functions/ai-anonymize-feedback/index.ts)
- [ai-auto-replenishment/index.ts](../supabase/functions/ai-auto-replenishment/index.ts)
- [ai-cashflow-forecast/index.ts](../supabase/functions/ai-cashflow-forecast/index.ts)
- [ai-erp-assistant/index.ts](../supabase/functions/ai-erp-assistant/index.ts)
- [ai-finance-anomaly/index.ts](../supabase/functions/ai-finance-anomaly/index.ts)
- [ai-risk-detection/index.ts](../supabase/functions/ai-risk-detection/index.ts)
- [ai-screen-cv/index.ts](../supabase/functions/ai-screen-cv/index.ts)
- [ai-skill-gap-analysis/index.ts](../supabase/functions/ai-skill-gap-analysis/index.ts)
- [ai-task-dispatcher/index.ts](../supabase/functions/ai-task-dispatcher/index.ts)
- [api-gateway/index.ts](../supabase/functions/api-gateway/index.ts)
- [auto-posting/index.ts](../supabase/functions/auto-posting/index.ts)
- [calculate-kpi-score/index.ts](../supabase/functions/calculate-kpi-score/index.ts)
- [chat-with-docs/index.ts](../supabase/functions/chat-with-docs/index.ts)
- [check-document-expiry/index.ts](../supabase/functions/check-document-expiry/index.ts)
- [data-integrity-check/index.ts](../supabase/functions/data-integrity-check/index.ts)
- [generate-embedding/index.ts](../supabase/functions/generate-embedding/index.ts)
- [integration-sync/index.ts](../supabase/functions/integration-sync/index.ts)
- [manage-bookings/index.ts](../supabase/functions/manage-bookings/index.ts)
- [manage-contracts/index.ts](../supabase/functions/manage-contracts/index.ts)
- [partner-webhook/index.ts](../supabase/functions/partner-webhook/index.ts)
- [process-document/index.ts](../supabase/functions/process-document/index.ts)
- [sales-agent/index.ts](../supabase/functions/sales-agent/index.ts)
- [semantic-search/index.ts](../supabase/functions/semantic-search/index.ts)
- [send-notification/index.ts](../supabase/functions/send-notification/index.ts)
- [shipping-carrier-proxy/index.ts](../supabase/functions/shipping-carrier-proxy/index.ts)
- [sync-platform-orders/index.ts](../supabase/functions/sync-platform-orders/index.ts)
- [webhook-ingest/index.ts](../supabase/functions/webhook-ingest/index.ts)

## Authentication Gate Review
Functions configured with `verify_jwt = false` must explicitly validate the caller with `auth.getUser` before privileged work.
- No missing authentication gates detected.

## Gateway-only Authorization Review
`verify_jwt = true` validates a signed project JWT, but it does not by itself prove that the caller is an authenticated user because the public anon key is also a project JWT. These endpoints rely on the gateway only and still need caller-role and operation-level authorization review:
- `supabase/functions/ai-anonymize-feedback/index.ts`
- `supabase/functions/ai-risk-detection/index.ts`
- `supabase/functions/ai-skill-gap-analysis/index.ts`
- `supabase/functions/ai-strategic-report/index.ts`
- `supabase/functions/ai-task-dispatcher/index.ts`
- `supabase/functions/api-gateway/index.ts`
- `supabase/functions/calculate-kpi-score/index.ts`
- `supabase/functions/chat-with-docs/index.ts`
- `supabase/functions/check-document-expiry/index.ts`
- `supabase/functions/generate-embedding/index.ts`
- `supabase/functions/integration-sync/index.ts`
- `supabase/functions/manage-bookings/index.ts`
- `supabase/functions/manage-contracts/index.ts`
- `supabase/functions/parse-voice-report/index.ts`
- `supabase/functions/parse-work-report-chat/index.ts`
- `supabase/functions/partner-webhook/index.ts`
- `supabase/functions/process-document/index.ts`
- `supabase/functions/sales-agent/index.ts`
- `supabase/functions/semantic-search/index.ts`
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/universal-adapter/index.ts`
- `supabase/functions/webhook-ingest/index.ts`

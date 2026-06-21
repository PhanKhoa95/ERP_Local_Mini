-- Migration: Add analytics materialized views over normalized Data Hub snapshots with RLS security wrapper and refresh function.

-- 1. Create the Materialized View for raw events snapshots
CREATE MATERIALIZED VIEW public.analytics_data_hub_snapshots AS
SELECT
  re.id AS event_id,
  re.company_id,
  re.data_source_id,
  ds.name AS source_name,
  re.source_type,
  re.event_type,
  re.quality_score,
  re.occurred_at,
  re.received_at,
  re.validation_status,
  re.ingestion_status,
  (re.normalized_payload->>'order_number') AS order_number,
  (re.normalized_payload->>'customer_name') AS customer_name,
  (re.normalized_payload->>'customer_phone') AS customer_phone,
  (re.normalized_payload->>'customer_address') AS customer_address,
  COALESCE((re.normalized_payload->>'total')::numeric, 0) AS total_amount,
  COALESCE((re.normalized_payload->>'discount_amount')::numeric, 0) AS discount_amount,
  (re.normalized_payload->>'payment_method') AS payment_method,
  COALESCE(jsonb_array_length(re.normalized_payload->'items'), 0) AS items_count
FROM public.raw_events re
LEFT JOIN public.data_sources ds ON re.data_source_id = ds.id
WHERE re.validation_status = 'normalized' OR re.ingestion_status = 'processed';

-- 2. Create Unique Index to enable CONCURRENT refreshes
CREATE UNIQUE INDEX idx_analytics_dh_snapshots_event_id ON public.analytics_data_hub_snapshots (event_id);
CREATE INDEX idx_analytics_dh_snapshots_company_id ON public.analytics_data_hub_snapshots (company_id);

-- 3. Create a Secured View that enforces Row Level Security (RLS)
-- Since RLS policies cannot be applied directly to Materialized Views in PostgreSQL,
-- this view serves as a security gateway checking company membership.
CREATE OR REPLACE VIEW public.analytics_data_hub_snapshots_secured AS
SELECT * 
FROM public.analytics_data_hub_snapshots
WHERE public.is_company_member(auth.uid(), company_id);

-- 4. Create Security Definer function to refresh the materialized view
-- This allows database triggers, edge functions, or client actions to refresh the view safely.
CREATE OR REPLACE FUNCTION public.refresh_data_hub_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_data_hub_snapshots;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant appropriate permissions
GRANT SELECT ON public.analytics_data_hub_snapshots_secured TO authenticated;
GRANT SELECT ON public.analytics_data_hub_snapshots_secured TO service_role;

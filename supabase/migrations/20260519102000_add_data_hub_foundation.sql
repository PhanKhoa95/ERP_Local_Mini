-- Data Hub foundation for multi-channel raw collection, normalization and quality control.

CREATE TABLE IF NOT EXISTS public.data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.sales_channels(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'active',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_ingested_at timestamptz,
  last_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT data_sources_source_type_check CHECK (
    source_type IN (
      'manual',
      'pos',
      'public_store',
      'marketplace',
      'social',
      'website',
      'crm',
      'webhook',
      'api',
      'file_import',
      'other'
    )
  ),
  CONSTRAINT data_sources_status_check CHECK (status IN ('active', 'paused', 'error', 'archived')),
  CONSTRAINT data_sources_company_code_unique UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.raw_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  data_source_id uuid REFERENCES public.data_sources(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'other',
  source_code text,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  external_id text,
  dedupe_key text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  quality_score numeric(5,2) NOT NULL DEFAULT 0,
  validation_status text NOT NULL DEFAULT 'queued',
  ingestion_status text NOT NULL DEFAULT 'received',
  error_message text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT raw_events_source_type_check CHECK (
    source_type IN (
      'manual',
      'pos',
      'public_store',
      'marketplace',
      'social',
      'website',
      'crm',
      'webhook',
      'api',
      'file_import',
      'other'
    )
  ),
  CONSTRAINT raw_events_validation_status_check CHECK (
    validation_status IN ('queued', 'normalized', 'linked', 'rejected', 'duplicate')
  ),
  CONSTRAINT raw_events_ingestion_status_check CHECK (
    ingestion_status IN ('received', 'processed', 'failed', 'ignored')
  ),
  CONSTRAINT raw_events_quality_score_check CHECK (quality_score >= 0 AND quality_score <= 100)
);

CREATE TABLE IF NOT EXISTS public.entity_resolution_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  raw_event_id uuid REFERENCES public.raw_events(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  matched_table text NOT NULL,
  confidence numeric(5,2) NOT NULL DEFAULT 0,
  match_strategy text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entity_resolution_confidence_check CHECK (confidence >= 0 AND confidence <= 100)
);

CREATE TABLE IF NOT EXISTS public.data_quality_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  raw_event_id uuid REFERENCES public.raw_events(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'medium',
  issue_type text NOT NULL,
  field_name text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT data_quality_issues_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT data_quality_issues_status_check CHECK (status IN ('open', 'resolved', 'ignored'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_events_company_dedupe
  ON public.raw_events(company_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_data_sources_company_status ON public.data_sources(company_id, status);
CREATE INDEX IF NOT EXISTS idx_data_sources_channel_id ON public.data_sources(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_raw_events_company_received ON public.raw_events(company_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_events_company_source ON public.raw_events(company_id, source_type, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_events_entity ON public.raw_events(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_raw_events_external ON public.raw_events(company_id, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_quality_company_status ON public.data_quality_issues(company_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_resolution_links_company_entity ON public.entity_resolution_links(company_id, entity_type, entity_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_data_sources_updated_at') THEN
    CREATE TRIGGER update_data_sources_updated_at
      BEFORE UPDATE ON public.data_sources
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_raw_events_updated_at') THEN
    CREATE TRIGGER update_raw_events_updated_at
      BEFORE UPDATE ON public.raw_events
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_resolution_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_issues ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'data_sources' AND policyname = 'Company members can view data sources'
  ) THEN
    CREATE POLICY "Company members can view data sources"
      ON public.data_sources FOR SELECT
      USING (public.is_company_member(auth.uid(), company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'data_sources' AND policyname = 'Company admins can manage data sources'
  ) THEN
    CREATE POLICY "Company admins can manage data sources"
      ON public.data_sources FOR ALL
      USING (public.is_company_admin(auth.uid(), company_id))
      WITH CHECK (public.is_company_admin(auth.uid(), company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'raw_events' AND policyname = 'Company members can view raw events'
  ) THEN
    CREATE POLICY "Company members can view raw events"
      ON public.raw_events FOR SELECT
      USING (public.is_company_member(auth.uid(), company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'raw_events' AND policyname = 'Company members can insert raw events'
  ) THEN
    CREATE POLICY "Company members can insert raw events"
      ON public.raw_events FOR INSERT TO authenticated
      WITH CHECK (public.is_company_member(auth.uid(), company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'raw_events' AND policyname = 'Company admins can update raw events'
  ) THEN
    CREATE POLICY "Company admins can update raw events"
      ON public.raw_events FOR UPDATE
      USING (public.is_company_admin(auth.uid(), company_id))
      WITH CHECK (public.is_company_admin(auth.uid(), company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'raw_events' AND policyname = 'Public storefront can insert raw events'
  ) THEN
    CREATE POLICY "Public storefront can insert raw events"
      ON public.raw_events FOR INSERT
      WITH CHECK (source_type = 'public_store' AND event_type = 'order.created');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'entity_resolution_links' AND policyname = 'Company members can view resolution links'
  ) THEN
    CREATE POLICY "Company members can view resolution links"
      ON public.entity_resolution_links FOR SELECT
      USING (public.is_company_member(auth.uid(), company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'entity_resolution_links' AND policyname = 'Company admins can manage resolution links'
  ) THEN
    CREATE POLICY "Company admins can manage resolution links"
      ON public.entity_resolution_links FOR ALL
      USING (public.is_company_admin(auth.uid(), company_id))
      WITH CHECK (public.is_company_admin(auth.uid(), company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'data_quality_issues' AND policyname = 'Company members can view data quality issues'
  ) THEN
    CREATE POLICY "Company members can view data quality issues"
      ON public.data_quality_issues FOR SELECT
      USING (public.is_company_member(auth.uid(), company_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'data_quality_issues' AND policyname = 'Company admins can manage data quality issues'
  ) THEN
    CREATE POLICY "Company admins can manage data quality issues"
      ON public.data_quality_issues FOR ALL
      USING (public.is_company_admin(auth.uid(), company_id))
      WITH CHECK (public.is_company_admin(auth.uid(), company_id));
  END IF;
END $$;

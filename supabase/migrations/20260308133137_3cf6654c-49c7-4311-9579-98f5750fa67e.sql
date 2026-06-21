
-- Extend sales_channels with platform sync fields
ALTER TABLE public.sales_channels
  ADD COLUMN IF NOT EXISTS platform_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS api_credentials jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Extend orders with platform fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS platform_order_id text,
  ADD COLUMN IF NOT EXISTS platform_status text,
  ADD COLUMN IF NOT EXISTS platform_data jsonb DEFAULT '{}';

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  channel_id uuid REFERENCES public.sales_channels(id) ON DELETE CASCADE NOT NULL,
  sync_type text NOT NULL DEFAULT 'orders',
  status text NOT NULL DEFAULT 'running',
  records_synced integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- RLS for sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs for their company"
  ON public.sync_logs FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert sync logs for their company"
  ON public.sync_logs FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update sync logs for their company"
  ON public.sync_logs FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

-- Index for platform_order_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_platform_order_id ON public.orders(platform_order_id) WHERE platform_order_id IS NOT NULL;

-- Index for sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_channel_id ON public.sync_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_company_id ON public.sync_logs(company_id);

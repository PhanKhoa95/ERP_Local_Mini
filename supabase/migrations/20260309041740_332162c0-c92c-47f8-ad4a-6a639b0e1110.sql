CREATE TABLE public.api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes JSONB DEFAULT '[]'::jsonb,
    allowed_ips TEXT[] DEFAULT '{}'::text[],
    allowed_domains TEXT[] DEFAULT '{}'::text[],
    partner_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.integration_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    partner_type TEXT NOT NULL,
    partner_name TEXT NOT NULL,
    client_id TEXT,
    client_secret_hash TEXT,
    webhook_url TEXT,
    data_mapping JSONB DEFAULT '{}'::jsonb,
    sync_frequency TEXT,
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.data_mappings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    from_system TEXT NOT NULL,
    to_system TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    field_mappings JSONB DEFAULT '{}'::jsonb,
    transformation_rules JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.integration_queue (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    partner_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES public.api_keys(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_body JSONB,
    response_body JSONB,
    status_code INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    vneid_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integration_configs_updated_at BEFORE UPDATE ON public.integration_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_mappings_updated_at BEFORE UPDATE ON public.data_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integration_queue_updated_at BEFORE UPDATE ON public.integration_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
CREATE POLICY "Company users can view api keys" ON public.api_keys FOR SELECT USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company admins can insert api keys" ON public.api_keys FOR INSERT WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "Company admins can update api keys" ON public.api_keys FOR UPDATE USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "Company admins can delete api keys" ON public.api_keys FOR DELETE USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company users can view configs" ON public.integration_configs FOR SELECT USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company admins can manage configs" ON public.integration_configs FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company users can view mappings" ON public.data_mappings FOR SELECT USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company admins can manage mappings" ON public.data_mappings FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company users can view queue" ON public.integration_queue FOR SELECT USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company admins can manage queue" ON public.integration_queue FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company users can view webhook logs" ON public.webhook_logs FOR SELECT USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company admins can manage webhook logs" ON public.webhook_logs FOR ALL USING (public.is_company_admin(auth.uid(), company_id));
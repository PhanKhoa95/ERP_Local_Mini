-- 1. Create crm_pos_chat_settings table
CREATE TABLE IF NOT EXISTS public.crm_pos_chat_settings (
    company_id UUID PRIMARY KEY, -- One setting row per company
    is_pos_sync_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    is_chat_sync_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    auto_create_lead_on VARCHAR(50) DEFAULT 'has_phone' NOT NULL, -- 'first_msg', 'has_phone', 'both'
    phone_update_rule VARCHAR(50) DEFAULT 'keep_latest' NOT NULL, -- 'keep_first', 'keep_latest'
    sync_tags_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    sync_agents_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.crm_pos_chat_settings ENABLE ROW LEVEL SECURITY;

-- 2. Create crm_lead_forms table
CREATE TABLE IF NOT EXISTS public.crm_lead_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- references companies(id)
    form_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) DEFAULT 'facebook' NOT NULL, -- 'facebook', 'tiktok'
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    field_mappings JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.crm_lead_forms ENABLE ROW LEVEL SECURITY;

-- 3. Create crm_automation_rules table
CREATE TABLE IF NOT EXISTS public.crm_automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- references companies(id)
    rule_name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(100) DEFAULT 'on_create' NOT NULL, -- 'on_create', 'on_update'
    conditions JSONB DEFAULT '{}'::jsonb NOT NULL,
    actions JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.crm_automation_rules ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
CREATE POLICY "Allow public select of crm_pos_chat_settings" ON public.crm_pos_chat_settings
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert of crm_pos_chat_settings" ON public.crm_pos_chat_settings
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of crm_pos_chat_settings" ON public.crm_pos_chat_settings
    FOR UPDATE USING (true);

CREATE POLICY "Allow public select of crm_lead_forms" ON public.crm_lead_forms
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert of crm_lead_forms" ON public.crm_lead_forms
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of crm_lead_forms" ON public.crm_lead_forms
    FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of crm_lead_forms" ON public.crm_lead_forms
    FOR DELETE USING (true);

CREATE POLICY "Allow public select of crm_automation_rules" ON public.crm_automation_rules
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert of crm_automation_rules" ON public.crm_automation_rules
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of crm_automation_rules" ON public.crm_automation_rules
    FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of crm_automation_rules" ON public.crm_automation_rules
    FOR DELETE USING (true);

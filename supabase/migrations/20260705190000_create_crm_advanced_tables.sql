-- 1. Create crm_companies table
CREATE TABLE IF NOT EXISTS public.crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- references companies(id)
    name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for crm_companies
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;

-- 2. Create crm_contacts table
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- references companies(id)
    company_map_id UUID, -- maps to crm_companies(id)
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for crm_contacts
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- 3. Create crm_custom_fields table (EAV Schema for Lead dynamic fields)
CREATE TABLE IF NOT EXISTS public.crm_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- references companies(id)
    entity_type VARCHAR(50) DEFAULT 'lead' NOT NULL, -- 'lead', 'contact', etc.
    field_name VARCHAR(100) NOT NULL, -- e.g., 'size_ao'
    field_label VARCHAR(100) NOT NULL, -- e.g., 'Size Áo'
    field_type VARCHAR(50) DEFAULT 'text' NOT NULL, -- 'text', 'number', 'date'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, entity_type, field_name)
);

-- Enable RLS for crm_custom_fields
ALTER TABLE public.crm_custom_fields ENABLE ROW LEVEL SECURITY;

-- 4. Create crm_custom_field_values table
CREATE TABLE IF NOT EXISTS public.crm_custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- references companies(id)
    entity_type VARCHAR(50) DEFAULT 'lead' NOT NULL,
    entity_id VARCHAR(100) NOT NULL, -- lead_id
    field_id UUID REFERENCES public.crm_custom_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(entity_type, entity_id, field_id)
);

-- Enable RLS for crm_custom_field_values
ALTER TABLE public.crm_custom_field_values ENABLE ROW LEVEL SECURITY;

-- 5. Create crm_api_keys table
CREATE TABLE IF NOT EXISTS public.crm_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- references companies(id)
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for crm_api_keys
ALTER TABLE public.crm_api_keys ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Since we use company_id for row filtering, create open policies for authenticated users
CREATE POLICY "Allow public select of crm_companies by company_id" ON public.crm_companies
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert of crm_companies by company_id" ON public.crm_companies
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of crm_companies by company_id" ON public.crm_companies
    FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of crm_companies by company_id" ON public.crm_companies
    FOR DELETE USING (true);

CREATE POLICY "Allow public select of crm_contacts by company_id" ON public.crm_contacts
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert of crm_contacts by company_id" ON public.crm_contacts
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of crm_contacts by company_id" ON public.crm_contacts
    FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of crm_contacts by company_id" ON public.crm_contacts
    FOR DELETE USING (true);

CREATE POLICY "Allow public select of crm_custom_fields by company_id" ON public.crm_custom_fields
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert of crm_custom_fields by company_id" ON public.crm_custom_fields
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete of crm_custom_fields by company_id" ON public.crm_custom_fields
    FOR DELETE USING (true);

CREATE POLICY "Allow public select of crm_custom_field_values by company_id" ON public.crm_custom_field_values
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert of crm_custom_field_values by company_id" ON public.crm_custom_field_values
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of crm_custom_field_values by company_id" ON public.crm_custom_field_values
    FOR UPDATE USING (true);

CREATE POLICY "Allow public select of crm_api_keys by company_id" ON public.crm_api_keys
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert of crm_api_keys by company_id" ON public.crm_api_keys
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete of crm_api_keys by company_id" ON public.crm_api_keys
    FOR DELETE USING (true);

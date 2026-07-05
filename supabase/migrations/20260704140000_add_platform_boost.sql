-- Create platform_category_mappings table
CREATE TABLE IF NOT EXISTS public.platform_category_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    pos_category TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_category TEXT NOT NULL,
    size_chart_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create platform_push_logs table
CREATE TABLE IF NOT EXISTS public.platform_push_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    error_msg TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.platform_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_push_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all actions for authenticated users on platform_category_mappings"
ON public.platform_category_mappings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all actions for authenticated users on platform_push_logs"
ON public.platform_push_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

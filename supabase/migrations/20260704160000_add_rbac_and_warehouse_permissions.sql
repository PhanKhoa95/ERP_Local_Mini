-- Create warehouse_permissions table
CREATE TABLE IF NOT EXISTS public.warehouse_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT chk_user_or_role CHECK (
        (user_id IS NOT NULL AND role_id IS NULL) OR
        (user_id IS NULL AND role_id IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE public.warehouse_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all actions for authenticated users on warehouse_permissions"
ON public.warehouse_permissions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add allow_ordering to warehouses table
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS allow_ordering BOOLEAN NOT NULL DEFAULT true;


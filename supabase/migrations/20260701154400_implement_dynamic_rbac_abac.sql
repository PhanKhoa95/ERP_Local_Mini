-- Migration to implement Dynamic RBAC/ABAC role system
-- Create custom_roles table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Drop policies if already existing
DROP POLICY IF EXISTS "Members can view custom roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Admins can manage custom roles" ON public.custom_roles;

-- Create RLS Policies
CREATE POLICY "Members can view custom roles" ON public.custom_roles
  FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage custom roles" ON public.custom_roles
  FOR ALL TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Trigger for update timestamp
DROP TRIGGER IF EXISTS update_custom_roles_updated_at ON public.custom_roles;
CREATE TRIGGER update_custom_roles_updated_at BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alter company_members to add region
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS region TEXT;


-- Permission policies table
CREATE TABLE public.permission_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  policy_type TEXT NOT NULL DEFAULT 'sensitive_action',
  conditions JSONB DEFAULT '{}',
  allowed_actions TEXT[] DEFAULT '{}',
  requires_vneid BOOLEAN DEFAULT false,
  requires_step_up BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.permission_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view permission policies" ON public.permission_policies
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage permission policies" ON public.permission_policies
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager())
  WITH CHECK (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- Sensitive action logs
CREATE TABLE public.sensitive_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  vneid_verified BOOLEAN DEFAULT false,
  step_up_method TEXT,
  approved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sensitive_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own sensitive logs" ON public.sensitive_action_logs
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Members can insert sensitive logs" ON public.sensitive_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id() AND user_id = auth.uid());

-- Agent permissions table
CREATE TABLE public.agent_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  allowed_tables TEXT[] DEFAULT '{}',
  allowed_actions TEXT[] DEFAULT '{}',
  max_amount_limit NUMERIC DEFAULT 0,
  requires_human_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view agent permissions" ON public.agent_permissions
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage agent permissions" ON public.agent_permissions
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager())
  WITH CHECK (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- Add permissions column to project_members
ALTER TABLE public.project_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Security definer function to check sensitive action permissions
CREATE OR REPLACE FUNCTION public.check_sensitive_action(_user_id UUID, _action_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _role TEXT;
  _vneid_verified BOOLEAN := false;
  _requires_step_up BOOLEAN := false;
  _allowed BOOLEAN := false;
BEGIN
  SELECT cm.company_id, cm.role INTO _company_id, _role
  FROM public.company_members cm WHERE cm.user_id = _user_id LIMIT 1;

  IF _company_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_company');
  END IF;

  -- Check VNeID status
  SELECT true INTO _vneid_verified
  FROM public.vneid_verifications v
  WHERE v.user_id = _user_id AND v.status = 'verified'
  LIMIT 1;

  -- Check permission policies
  SELECT pp.requires_step_up INTO _requires_step_up
  FROM public.permission_policies pp
  WHERE pp.company_id = _company_id
    AND pp.is_active = true
    AND _action_type = ANY(pp.allowed_actions)
  LIMIT 1;

  -- Admin always allowed (with step-up if required)
  IF _role = 'admin' THEN
    _allowed := true;
  ELSIF _role = 'manager' AND _action_type NOT IN ('config_change', 'share_transfer') THEN
    _allowed := true;
  END IF;

  RETURN jsonb_build_object(
    'allowed', _allowed,
    'requires_step_up', COALESCE(_requires_step_up, _action_type IN ('token_issue', 'share_transfer', 'config_change')),
    'vneid_verified', COALESCE(_vneid_verified, false),
    'role', _role
  );
END;
$$;

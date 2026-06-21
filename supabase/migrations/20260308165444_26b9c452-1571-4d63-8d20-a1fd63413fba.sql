
-- 1. Employee transfers/promotions history
CREATE TABLE public.employee_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  transfer_type TEXT NOT NULL DEFAULT 'transfer', -- transfer | promotion
  from_position_id UUID REFERENCES public.perf_positions(id),
  to_position_id UUID REFERENCES public.perf_positions(id),
  from_org_unit_id UUID REFERENCES public.perf_org_units(id),
  to_org_unit_id UUID REFERENCES public.perf_org_units(id),
  from_title TEXT,
  to_title TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  approved_by UUID,
  approval_request_id UUID REFERENCES public.approval_requests(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view transfers" ON public.employee_transfers
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Managers can insert transfers" ON public.employee_transfers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_perf_admin_or_manager());

CREATE POLICY "Managers can update transfers" ON public.employee_transfers
  FOR UPDATE TO authenticated
  USING (public.is_perf_admin_or_manager());

-- 2. Onboarding checklists
CREATE TABLE public.onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view checklists" ON public.onboarding_checklists
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Authenticated can insert checklists" ON public.onboarding_checklists
  FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Authenticated can update checklists" ON public.onboarding_checklists
  FOR UPDATE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

-- 3. Trigger: Training completion → XP
CREATE OR REPLACE FUNCTION public.training_completion_xp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_duration_hours NUMERIC;
  v_xp_reward INTEGER;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT COALESCE(tp.duration_hours, 1) INTO v_duration_hours
    FROM public.training_programs tp
    WHERE tp.id = NEW.program_id;
    
    v_xp_reward := GREATEST(10, (v_duration_hours * 10)::INTEGER);
    
    UPDATE public.perf_employees
    SET total_xp = total_xp + v_xp_reward, updated_at = now()
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_training_completion_xp
  AFTER UPDATE ON public.training_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.training_completion_xp();

-- 4. Trigger: Auto-enroll mandatory training for new employees
CREATE OR REPLACE FUNCTION public.auto_enroll_mandatory_training()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.training_enrollments (program_id, employee_id)
  SELECT tp.id, NEW.id
  FROM public.training_programs tp
  WHERE tp.company_id = NEW.company_id
    AND tp.is_mandatory = true
    AND tp.is_active = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_enroll_mandatory
  AFTER INSERT ON public.perf_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_mandatory_training();

-- 5. Trigger: Apply approved transfer
CREATE OR REPLACE FUNCTION public.apply_approved_transfer()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.perf_employees SET
      position_id = COALESCE(NEW.to_position_id, position_id),
      org_unit_id = COALESCE(NEW.to_org_unit_id, org_unit_id),
      title = COALESCE(NEW.to_title, title),
      updated_at = now()
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_apply_approved_transfer
  AFTER UPDATE ON public.employee_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_approved_transfer();

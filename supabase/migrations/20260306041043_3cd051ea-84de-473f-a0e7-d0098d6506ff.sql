
-- 1. Add evaluation_mode, qualitative_criteria, report_routing to perf_org_units
ALTER TABLE public.perf_org_units 
  ADD COLUMN IF NOT EXISTS evaluation_mode text NOT NULL DEFAULT 'kbif_standard',
  ADD COLUMN IF NOT EXISTS qualitative_criteria jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS report_routing jsonb DEFAULT '{}'::jsonb;

-- 2. Add evaluation_type and rubric to kpi_metrics
ALTER TABLE public.kpi_metrics
  ADD COLUMN IF NOT EXISTS evaluation_type text NOT NULL DEFAULT 'quantitative',
  ADD COLUMN IF NOT EXISTS rubric jsonb DEFAULT NULL;

-- 3. Create policy_recommendations table
CREATE TABLE IF NOT EXISTS public.policy_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.perf_employees(id) ON DELETE SET NULL,
  org_unit_id uuid REFERENCES public.perf_org_units(id) ON DELETE SET NULL,
  season_id uuid REFERENCES public.kpi_seasons(id) ON DELETE SET NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  supporting_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS: company members can view
CREATE POLICY "Company members can view policy recommendations"
  ON public.policy_recommendations
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

-- RLS: admin/manager can insert
CREATE POLICY "Admins and managers can create policy recommendations"
  ON public.policy_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- RLS: admin/manager can update
CREATE POLICY "Admins and managers can update policy recommendations"
  ON public.policy_recommendations
  FOR UPDATE
  TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- RLS: admin can delete
CREATE POLICY "Admins can delete policy recommendations"
  ON public.policy_recommendations
  FOR DELETE
  TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- Trigger for updated_at
CREATE TRIGGER update_policy_recommendations_updated_at
  BEFORE UPDATE ON public.policy_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

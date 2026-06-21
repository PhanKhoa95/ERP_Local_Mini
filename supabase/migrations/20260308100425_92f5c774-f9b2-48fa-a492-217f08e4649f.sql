
CREATE TABLE public.strategic_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  employee_id uuid REFERENCES public.perf_employees(id),
  season_id uuid REFERENCES public.kpi_seasons(id),
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  executive_summary jsonb DEFAULT '{}'::jsonb,
  key_results jsonb DEFAULT '[]'::jsonb,
  highlight text,
  barriers jsonb DEFAULT '[]'::jsonb,
  next_steps jsonb DEFAULT '[]'::jsonb,
  requests jsonb DEFAULT '[]'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own strategic reports"
  ON public.strategic_reports FOR ALL TO authenticated
  USING (employee_id IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid()))
  WITH CHECK (employee_id IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid()));

CREATE POLICY "Managers can view team strategic reports"
  ON public.strategic_reports FOR SELECT TO authenticated
  USING (company_id = get_user_company_id() AND is_perf_admin_or_manager());

CREATE POLICY "Managers can review strategic reports"
  ON public.strategic_reports FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id() AND is_perf_admin_or_manager());

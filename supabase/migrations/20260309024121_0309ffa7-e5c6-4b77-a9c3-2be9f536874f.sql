
-- 1. Job Postings
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  salary_range TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view job postings" ON public.job_postings
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admin/Manager can manage job postings" ON public.job_postings
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager())
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager());

-- 2. Job Applications
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  candidate_phone TEXT,
  cv_url TEXT,
  ai_score NUMERIC,
  ai_analysis JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  interview_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view applications" ON public.job_applications
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admin/Manager can manage applications" ON public.job_applications
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager())
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager());

-- 3. Attendance Records
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  work_hours NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'office',
  location_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own attendance" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (
    public.is_company_member(auth.uid(), company_id) AND (
      employee_id IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid())
      OR public.is_perf_admin_or_manager()
    )
  );

CREATE POLICY "Employees can check in/out" ON public.attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_company_member(auth.uid(), company_id) AND
    employee_id IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Employees can update own attendance" ON public.attendance_records
  FOR UPDATE TO authenticated
  USING (
    public.is_company_member(auth.uid(), company_id) AND
    employee_id IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin/Manager can manage attendance" ON public.attendance_records
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager())
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager());

-- 4. Payroll Runs
CREATE TABLE public.payroll_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_net_salary NUMERIC DEFAULT 0,
  total_employees INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, period_month, period_year)
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Manager can manage payroll" ON public.payroll_runs
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager())
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager());

-- 5. Payroll Items
CREATE TABLE public.payroll_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  worked_days NUMERIC NOT NULL DEFAULT 0,
  standard_days NUMERIC NOT NULL DEFAULT 22,
  overtime_hours NUMERIC DEFAULT 0,
  overtime_pay NUMERIC DEFAULT 0,
  kpi_bonus NUMERIC DEFAULT 0,
  other_bonuses NUMERIC DEFAULT 0,
  insurance_deduction NUMERIC DEFAULT 0,
  tax_deduction NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employee view own payslip" ON public.payroll_items
  FOR SELECT TO authenticated
  USING (
    employee_id IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid())
    OR public.is_perf_admin_or_manager()
  );

CREATE POLICY "Admin/Manager can manage payroll items" ON public.payroll_items
  FOR ALL TO authenticated
  USING (public.is_perf_admin_or_manager())
  WITH CHECK (public.is_perf_admin_or_manager());

-- 6. Compliance Alerts
CREATE TABLE public.compliance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  employee_id UUID REFERENCES public.perf_employees(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_type TEXT,
  reference_id UUID,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view compliance alerts" ON public.compliance_alerts
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admin/Manager can manage compliance alerts" ON public.compliance_alerts
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager())
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager());

-- Indexes
CREATE INDEX idx_job_postings_company ON public.job_postings(company_id);
CREATE INDEX idx_job_applications_posting ON public.job_applications(posting_id);
CREATE INDEX idx_attendance_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX idx_payroll_runs_company_period ON public.payroll_runs(company_id, period_year, period_month);
CREATE INDEX idx_compliance_alerts_company ON public.compliance_alerts(company_id, status);

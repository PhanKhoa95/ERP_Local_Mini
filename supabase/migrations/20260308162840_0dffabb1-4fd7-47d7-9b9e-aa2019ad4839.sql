
-- Training Programs
CREATE TABLE public.training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'technical',
  duration_hours NUMERIC DEFAULT 0,
  instructor TEXT,
  materials_url TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  target_positions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Training Enrollments
CREATE TABLE public.training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score NUMERIC,
  certificate_url TEXT,
  notes TEXT,
  UNIQUE(program_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS for training_programs
CREATE POLICY "Members can view training programs"
  ON public.training_programs FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins/managers can manage training programs"
  ON public.training_programs FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager())
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager());

-- RLS for training_enrollments (via join to program → company)
CREATE POLICY "Members can view own enrollments"
  ON public.training_enrollments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.training_programs tp
      WHERE tp.id = program_id AND public.is_company_member(auth.uid(), tp.company_id)
    )
  );

CREATE POLICY "Admins/managers can manage enrollments"
  ON public.training_enrollments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.training_programs tp
      WHERE tp.id = program_id AND public.is_company_member(auth.uid(), tp.company_id)
    ) AND public.is_perf_admin_or_manager()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_programs tp
      WHERE tp.id = program_id AND public.is_company_member(auth.uid(), tp.company_id)
    ) AND public.is_perf_admin_or_manager()
  );

-- Employees can update their own enrollment status
CREATE POLICY "Employees can update own enrollments"
  ON public.training_enrollments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perf_employees pe
      WHERE pe.id = employee_id AND pe.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.perf_employees pe
      WHERE pe.id = employee_id AND pe.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

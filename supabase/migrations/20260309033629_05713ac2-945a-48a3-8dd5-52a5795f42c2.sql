
-- Table: directives (Chỉ thị từ lãnh đạo)
CREATE TABLE public.directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  issued_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  kpi_targets JSONB DEFAULT '{}',
  deadline TIMESTAMPTZ,
  assigned_manager_id UUID REFERENCES public.perf_employees(id) ON DELETE SET NULL,
  escalation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add directive_id to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS directive_id UUID REFERENCES public.directives(id) ON DELETE SET NULL;

-- RLS for directives
ALTER TABLE public.directives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view directives in their company"
  ON public.directives FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

CREATE POLICY "Admin/Manager can create directives"
  ON public.directives FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin/Manager can update directives"
  ON public.directives FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Update trigger
CREATE TRIGGER update_directives_updated_at
  BEFORE UPDATE ON public.directives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

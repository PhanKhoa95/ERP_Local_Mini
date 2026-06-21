
-- Workflows table
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL DEFAULT 'order_created',
  flow_data jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflows in their company"
  ON public.workflows FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Users can insert workflows in their company"
  ON public.workflows FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Users can update workflows in their company"
  ON public.workflows FOR UPDATE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Users can delete workflows in their company"
  ON public.workflows FOR DELETE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Workflow logs table
CREATE TABLE public.workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  trigger_data jsonb,
  execution_log jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow logs via workflow company"
  ON public.workflow_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workflows w
    WHERE w.id = workflow_id
    AND public.is_company_member(auth.uid(), w.company_id)
  ));

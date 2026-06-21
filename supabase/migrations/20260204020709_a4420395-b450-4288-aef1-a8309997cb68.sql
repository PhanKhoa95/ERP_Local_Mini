-- Create work_report_drafts table for auto-saving draft tasks
CREATE TABLE IF NOT EXISTS public.work_report_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks JSONB NOT NULL DEFAULT '[]',
  -- tasks structure: [{ id, project_id, project_code, project_name, task, type, source, created_at }]
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_date)
);

-- Enable RLS
ALTER TABLE public.work_report_drafts ENABLE ROW LEVEL SECURITY;

-- Users can view their own drafts
CREATE POLICY "Users can view own drafts"
  ON public.work_report_drafts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own drafts
CREATE POLICY "Users can create own drafts"
  ON public.work_report_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts"
  ON public.work_report_drafts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own drafts
CREATE POLICY "Users can delete own drafts"
  ON public.work_report_drafts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_work_report_drafts_updated_at
  BEFORE UPDATE ON public.work_report_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
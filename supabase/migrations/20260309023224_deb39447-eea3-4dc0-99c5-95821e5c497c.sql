
-- Add new columns to documents table for smart document management
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extracted_metadata jsonb,
  ADD COLUMN IF NOT EXISTS expiry_date timestamptz;

-- Index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON public.documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category) WHERE category IS NOT NULL;

-- Index for project linking
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id) WHERE project_id IS NOT NULL;

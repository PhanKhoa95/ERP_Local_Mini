-- Create document history table
CREATE TABLE public.document_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view document history
CREATE POLICY "Members can view document history"
ON public.document_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.id = document_history.document_id 
    AND is_company_member(auth.uid(), d.company_id)
  )
);

-- Create trigger to log document changes
CREATE OR REPLACE FUNCTION public.log_document_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.document_history (document_id, action, new_data, changed_by)
    VALUES (NEW.id, 'created', row_to_json(NEW), NEW.uploaded_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.document_history (document_id, action, old_data, new_data, changed_by)
    VALUES (NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.document_history (document_id, action, old_data, changed_by)
    VALUES (OLD.id, 'deleted', row_to_json(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER document_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.log_document_changes();
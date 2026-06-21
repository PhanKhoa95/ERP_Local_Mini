-- Create company-documents bucket for RAG document storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-documents', 
  'company-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for company-documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-documents');

CREATE POLICY "Users can view documents from their company"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company-documents');

CREATE POLICY "Users can delete their uploaded documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-documents');

-- Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company-documents bucket
CREATE POLICY "Members can view company documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'company-documents' 
    AND public.is_company_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Members can upload company documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-documents'
    AND public.is_company_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Admins can delete company documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-documents'
    AND public.is_company_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export interface DocumentMetadata {
  invoice_number?: string;
  document_date?: string;
  total_amount?: number;
  currency?: string;
  vendor_name?: string;
  customer_name?: string;
  summary?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface Document {
  id: string;
  company_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  status: string;
  error_message: string | null;
  chunk_count: number;
  uploaded_by: string | null;
  created_at: string;
  category: string | null;
  project_id: string | null;
  extracted_metadata: DocumentMetadata | null;
  expiry_date: string | null;
}

export function useDocuments(companyId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Document[];
    },
    enabled: !!companyId,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ file, companyId, projectId }: { file: File; companyId: string; projectId?: string }) => {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      const filePath = `${companyId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("documents")
        .insert({
          company_id: companyId,
          name: file.name,
          file_path: filePath,
          file_type: fileExt,
          file_size: file.size,
          uploaded_by: user?.id,
          ...(projectId ? { project_id: projectId } : {}),
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.functions.invoke("process-document", {
        body: { documentId: data.id },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Đang xử lý tài liệu..." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (doc: Document) => {
      await supabase.storage.from("company-documents").remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Đã xóa tài liệu" });
    },
  });

  // Query for expiring documents
  const { data: expiringDocuments = [] } = useQuery({
    queryKey: ["documents-expiring", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "completed")
        .not("expiry_date", "is", null)
        .lte("expiry_date", in30Days)
        .gte("expiry_date", new Date().toISOString())
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data as unknown as Document[];
    },
    enabled: !!companyId,
  });

  return { documents, isLoading, uploadDocument, deleteDocument, expiringDocuments };
}

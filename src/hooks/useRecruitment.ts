import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

export function useRecruitment() {
  const { companyId } = useCompanyContext();
  const qc = useQueryClient();

  const { data: postings = [], isLoading: postingsLoading } = useQuery({
    queryKey: ["job-postings", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["job-applications", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, job_postings(title)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const createPosting = useMutation({
    mutationFn: async (form: { title: string; department?: string; description?: string; requirements?: any; salary_range?: string; location?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("job_postings").insert({
        ...form,
        company_id: companyId!,
        created_by: user?.id,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-postings"] }); toast.success("Đã tạo tin tuyển dụng"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePosting = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("job_postings").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-postings"] }); toast.success("Đã cập nhật"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createApplication = useMutation({
    mutationFn: async (form: { posting_id: string; candidate_name: string; candidate_email?: string; candidate_phone?: string; cv_url?: string; notes?: string }) => {
      const { error } = await supabase.from("job_applications").insert({
        ...form,
        company_id: companyId!,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-applications"] }); toast.success("Đã thêm ứng viên"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateApplication = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("job_applications").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job-applications"] }); toast.success("Đã cập nhật"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { postings, postingsLoading, applications, applicationsLoading, createPosting, updatePosting, createApplication, updateApplication };
}

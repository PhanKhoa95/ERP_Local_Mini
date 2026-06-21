import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";

export function useProjectShares(projectId?: string) {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ["project-shares", companyId, projectId],
    queryFn: async () => {
      let q = supabase.from("project_shares").select("*").eq("company_id", companyId!);
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const createShare = useMutation({
    mutationFn: async (input: { project_id: string; holder_user_id: string; share_count: number; share_type: string }) => {
      const { error } = await supabase.from("project_shares").insert({ ...input, company_id: companyId! });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-shares"] });
      toast({ title: "Đã phát hành cổ phiếu" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const totalShares = shares.reduce((s, r) => s + Number(r.share_count || 0), 0);

  return { shares, isLoading, createShare, totalShares };
}

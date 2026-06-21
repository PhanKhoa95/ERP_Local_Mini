import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";

export function useIntegrationSync() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["integration-queue", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_queue" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const triggerSync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("integration-sync", {
        body: { company_id: companyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integration-queue"] });
      toast({ title: "Đã đồng bộ", description: `Xử lý thành công ${data.processed} yêu cầu` });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return { queue, isLoading, triggerSync };
}

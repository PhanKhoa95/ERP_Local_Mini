import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";

export interface CreateConfigParams {
  partner_name: string;
  partner_type: string;
  client_id?: string;
  client_secret_hash?: string;
  webhook_url?: string;
  sync_frequency?: string;
}

export function useIntegrationConfigs() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["integration-configs", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_configs" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createConfig = useMutation({
    mutationFn: async (params: CreateConfigParams) => {
      const { data, error } = await supabase.from("integration_configs" as any).insert({
        company_id: companyId,
        partner_name: params.partner_name,
        partner_type: params.partner_type,
        client_id: params.client_id || null,
        client_secret_hash: params.client_secret_hash || null,
        webhook_url: params.webhook_url || null,
        sync_frequency: params.sync_frequency || 'manual',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-configs"] });
      toast({ title: "Đã kết nối đối tác thành công" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const disconnectConfig = useMutation({
    mutationFn: async (configId: string) => {
      const { error } = await supabase
        .from("integration_configs" as any)
        .update({ is_active: false })
        .eq("id", configId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-configs"] });
      toast({ title: "Đã ngắt kết nối đối tác" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return { configs, isLoading, createConfig, disconnectConfig };
}

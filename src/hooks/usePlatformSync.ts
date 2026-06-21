import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export function usePlatformSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["sync_logs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const localLogs = localStorage.getItem("erp-mini-local-demo-sync-logs");
        return localLogs ? JSON.parse(localLogs) : [];
      }
      const { data, error } = await supabase
        .from("sync_logs")
        .select("*, sales_channels(name, code, platform_type, color)")
        .eq("company_id", companyId)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const syncOrders = useMutation({
    mutationFn: async ({ channelId, syncParams }: { channelId: string; syncParams?: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke("sync-platform-orders", {
        body: { action: "sync_orders", channel_id: channelId, sync_params: syncParams },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["sync_logs"] });
      queryClient.invalidateQueries({ queryKey: ["sales_channels"] });
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      toast({
        title: "Đồng bộ hoàn tất",
        description: `Đã đồng bộ ${data?.synced || 0} đơn hàng${data?.failed ? `, ${data.failed} lỗi` : ""}`,
      });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi đồng bộ", description: error.message });
    },
  });

  const getAuthUrl = useMutation({
    mutationFn: async ({ channelId, redirectUri }: { channelId: string; redirectUri: string }) => {
      const { data, error } = await supabase.functions.invoke("sync-platform-orders", {
        body: { action: "get_auth_url", channel_id: channelId, redirect_uri: redirectUri },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.url as string;
    },
  });

  const exchangeToken = useMutation({
    mutationFn: async ({ channelId, code, redirectUri }: { channelId: string; code: string; redirectUri: string }) => {
      const { data, error } = await supabase.functions.invoke("sync-platform-orders", {
        body: { action: "exchange_token", channel_id: channelId, code, redirect_uri: redirectUri },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_channels"] });
      toast({ title: "Kết nối sàn thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi kết nối", description: error.message });
    },
  });

  const refreshToken = useMutation({
    mutationFn: async (channelId: string) => {
      const { data, error } = await supabase.functions.invoke("sync-platform-orders", {
        body: { action: "refresh_token", channel_id: channelId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });

  return {
    syncLogs,
    logsLoading,
    syncOrders,
    getAuthUrl,
    exchangeToken,
    refreshToken,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

type SalesChannel = Tables<"sales_channels">;
type SalesChannelInsert = TablesInsert<"sales_channels">;
type SalesChannelUpdate = TablesUpdate<"sales_channels">;

const CHANNELS_KEY = "erp-mini-local-demo-sales-channels";

function getLocalChannels(companyId: string): SalesChannel[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHANNELS_KEY);
  if (!raw) {
    const defaultChannels = [
      {
        id: "channel-retail",
        name: "Cửa hàng bán lẻ (POS)",
        code: "RETAIL",
        is_active: true,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: "Kênh bán lẻ trực tiếp tại cửa hàng",
      },
      {
        id: "channel-zalo",
        name: "Zalo Chat / Zalo OA",
        code: "ZALO",
        is_active: true,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: "Kênh chốt đơn chính qua chat và Zalo Official Account",
      },
      {
        id: "channel-facebook",
        name: "Facebook Page / Messenger",
        code: "FACEBOOK",
        is_active: true,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: "Kênh thu hút khách hàng và quảng cáo địa phương",
      },
      {
        id: "channel-shopee",
        name: "Shopee Shop",
        code: "SHOPEE",
        is_active: true,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: "Kênh thương mại điện tử Shopee (giá riêng)",
      },
      {
        id: "channel-b2b",
        name: "Khách hàng doanh nghiệp (B2B)",
        code: "B2B",
        is_active: true,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: "Hợp đồng và dự án doanh nghiệp lớn",
      },
    ] as any as SalesChannel[];
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(defaultChannels));
    return defaultChannels;

  }
  try {
    return JSON.parse(raw) as SalesChannel[];
  } catch {
    return [];
  }
}

function saveLocalChannels(channels: SalesChannel[]) {
  localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
}

export function useSalesChannels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: channels = [], isLoading, error } = useQuery({
    queryKey: ["sales_channels", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalChannels(companyId);
      }
      const { data, error } = await supabase
        .from("sales_channels")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return data as SalesChannel[];
    },
    enabled: !!companyId,
  });

  const createChannel = useMutation({
    mutationFn: async (channel: SalesChannelInsert) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalChannels(companyId || "");
        const newChannel = {
          id: `channel-${Date.now()}`,
          name: channel.name,
          code: channel.code,
          is_active: channel.is_active ?? true,
          company_id: companyId || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          description: channel.description ?? null,
        } as any as SalesChannel;
        saveLocalChannels([...local, newChannel]);
        return newChannel;
      }

      const { data, error } = await supabase
        .from("sales_channels")
        .insert({ ...channel, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_channels"] });
      toast({ title: "Thêm kênh bán hàng thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateChannel = useMutation({
    mutationFn: async ({ id, ...updates }: SalesChannelUpdate & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalChannels(companyId || "");
        const idx = local.findIndex((c) => c.id === id);
        if (idx >= 0) {
          local[idx] = {
            ...local[idx],
            ...updates,
            updated_at: new Date().toISOString(),
          };
          saveLocalChannels(local);
          return local[idx];
        }
        throw new Error("Không tìm thấy kênh bán hàng local");
      }

      const { data, error } = await supabase
        .from("sales_channels")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_channels"] });
      toast({ title: "Cập nhật kênh thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalChannels(companyId || "");
        saveLocalChannels(local.filter((c) => c.id !== id));
        return;
      }

      const { error } = await supabase.from("sales_channels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_channels"] });
      toast({ title: "Xóa kênh thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return {
    channels,
    isLoading,
    error,
    createChannel,
    updateChannel,
    deleteChannel,
  };
}

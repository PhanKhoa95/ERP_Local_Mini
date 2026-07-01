import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface BankInfo {
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch: string;
}

export interface ShopInfo {
  name: string;
  phone: string;
  address: string;
}

export function useShopSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: bankInfo, isLoading: bankLoading } = useQuery({
    queryKey: ["shop_settings", "bank_info", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("shop_settings") as any)
        .select("value")
        .eq("company_id", companyId!)
        .eq("key", "bank_info")
        .maybeSingle();
      if (error) throw error;
      return data?.value as BankInfo | undefined;
    },
  });

  const { data: shopInfo, isLoading: shopLoading } = useQuery({
    queryKey: ["shop_settings", "shop_info", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("shop_settings") as any)
        .select("value")
        .eq("company_id", companyId!)
        .eq("key", "shop_info")
        .maybeSingle();
      if (error) throw error;
      return data?.value as ShopInfo | undefined;
    },
  });

  const upsertSetting = async (key: string, value: any) => {
    if (!companyId) throw new Error("No company");
    const { data: existing } = await (supabase
      .from("shop_settings") as any)
      .select("id")
      .eq("company_id", companyId)
      .eq("key", key)
      .maybeSingle();
    if (existing) {
      const { error } = await (supabase
        .from("shop_settings") as any)
        .update({ value })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase
        .from("shop_settings") as any)
        .insert({ company_id: companyId, key, value });
      if (error) throw error;
    }
  };

  const updateBankInfo = useMutation({
    mutationFn: async (info: BankInfo) => upsertSetting("bank_info", info),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop_settings", "bank_info"] });
      toast({ title: "Cập nhật thông tin ngân hàng thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateShopInfo = useMutation({
    mutationFn: async (info: ShopInfo) => upsertSetting("shop_info", info),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop_settings", "shop_info"] });
      toast({ title: "Cập nhật thông tin cửa hàng thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => upsertSetting(key, value),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shop_settings", variables.key] });
      toast({ title: "Cập nhật cấu hình thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return {
    bankInfo: bankInfo || { bank_name: "", account_number: "", account_holder: "", branch: "" },
    shopInfo: shopInfo || { name: "Cửa hàng", phone: "", address: "" },
    isLoading: bankLoading || shopLoading,
    updateBankInfo,
    updateShopInfo,
    updateSetting,
  };
}

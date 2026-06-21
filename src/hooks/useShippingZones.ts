import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface ShippingZone {
  id: string;
  name: string;
  provinces: string[];
  base_fee: number;
  free_shipping_threshold?: number;
  is_active: boolean;
  created_at: string;
}

export function useShippingZones() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { companyId } = useCompanyContext();

  const { data: shippingZones = [], isLoading } = useQuery({
    queryKey: ["shipping-zones", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("shipping_zones") as any)
        .select("*")
        .eq("company_id", companyId!)
        .order("name");
      if (error) throw error;
      return (data || []) as ShippingZone[];
    },
  });

  const createZone = useMutation({
    mutationFn: async (zone: Omit<ShippingZone, "id" | "created_at">) => {
      if (!companyId) throw new Error("No company");
      const { data, error } = await supabase.from("shipping_zones").insert({ ...zone, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
      toast({ title: "Tạo vùng vận chuyển thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateZone = useMutation({
    mutationFn: async ({ id, ...zone }: Partial<ShippingZone> & { id: string }) => {
      const { data, error } = await supabase.from("shipping_zones").update(zone).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
      toast({ title: "Cập nhật vùng vận chuyển thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
      toast({ title: "Xóa vùng vận chuyển thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const calculateShippingFee = (province: string, orderTotal: number): number => {
    const zone = shippingZones.find(z => z.is_active && z.provinces.includes(province));
    if (!zone) return 30000;
    if (zone.free_shipping_threshold && orderTotal >= zone.free_shipping_threshold) return 0;
    return zone.base_fee;
  };

  return {
    shippingZones,
    isLoading,
    createZone,
    updateZone,
    deleteZone,
    calculateShippingFee,
  };
}

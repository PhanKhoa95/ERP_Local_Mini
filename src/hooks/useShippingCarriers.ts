import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export function useShippingCarriers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ["shipping_carriers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("shipping_carriers")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createCarrier = useMutation({
    mutationFn: async (carrier: { name: string; code: string; api_token?: string; shop_id?: string; config?: any }) => {
      const { data, error } = await supabase
        .from("shipping_carriers")
        .insert({ ...carrier, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_carriers"] });
      toast({ title: "Thêm hãng vận chuyển thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateCarrier = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; api_token?: string; shop_id?: string; is_active?: boolean; config?: any }) => {
      const { data, error } = await supabase
        .from("shipping_carriers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_carriers"] });
      toast({ title: "Cập nhật thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const deleteCarrier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_carriers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_carriers"] });
      toast({ title: "Xóa thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const callCarrierProxy = async (carrierId: string, action: string, params: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Chưa đăng nhập");

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/shipping-carrier-proxy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, carrier_id: carrierId, params }),
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  };

  const testConnection = useMutation({
    mutationFn: async (carrierId: string) => {
      return callCarrierProxy(carrierId, "test_connection", {});
    },
    onSuccess: () => toast({ title: "Kết nối thành công!" }),
    onError: (e: Error) => toast({ variant: "destructive", title: "Kết nối thất bại", description: e.message }),
  });

  return {
    carriers,
    isLoading,
    createCarrier,
    updateCarrier,
    deleteCarrier,
    testConnection,
    callCarrierProxy,
  };
}

export function useShipments(orderId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["shipments", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("shipments")
        .select("*, shipping_carriers(*)")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const createShipment = useMutation({
    mutationFn: async (shipment: { order_id: string; carrier_id: string; tracking_code?: string; cod_amount?: number; weight_grams?: number }) => {
      const { data, error } = await supabase
        .from("shipments")
        .insert(shipment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast({ title: "Tạo vận đơn thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { shipments, isLoading, createShipment };
}

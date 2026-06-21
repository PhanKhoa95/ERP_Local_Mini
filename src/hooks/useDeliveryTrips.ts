import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface DeliveryTrip {
  id: string;
  company_id: string;
  driver_id: string;
  vehicle_info: string | null;
  status: "planned" | "loading" | "en_route" | "completed" | "cancelled";
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  drivers?: {
    id: string;
    name: string;
    phone: string | null;
  };
  shipments?: Array<{
    id: string;
    tracking_code: string | null;
    cod_amount: number | null;
    delivery_order: number | null;
    orders?: {
      order_number: string;
      customer_name: string | null;
      customer_phone: string | null;
      customer_address: string | null;
    };
  }>;
}

export function useDeliveryTrips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["delivery_trips", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("delivery_trips" as any)
        .select(`
          *,
          drivers:driver_id(*),
          shipments:shipments(
            id,
            tracking_code,
            cod_amount,
            delivery_order,
            orders:order_id(
              order_number,
              customer_name,
              customer_phone,
              customer_address
            )
          )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DeliveryTrip[];
    },
    enabled: !!companyId,
  });

  const createTrip = useMutation({
    mutationFn: async (trip: Omit<DeliveryTrip, "id" | "company_id" | "created_at" | "updated_at" | "drivers" | "shipments">) => {
      const { data, error } = await supabase
        .from("delivery_trips" as any)
        .insert({ ...trip, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_trips", companyId] });
      toast({ title: "Tạo chuyến xe thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateTrip = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryTrip> & { id: string }) => {
      const { data, error } = await supabase
        .from("delivery_trips" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_trips", companyId] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast({ title: "Cập nhật chuyến xe thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const deleteTrip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_trips" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_trips", companyId] });
      toast({ title: "Xóa chuyến xe thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  // Assign shipments to a trip
  const assignShipments = useMutation({
    mutationFn: async ({ tripId, shipmentIds }: { tripId: string; shipmentIds: string[] }) => {
      // Set trip_id on shipments
      for (let i = 0; i < shipmentIds.length; i++) {
        const { error } = await supabase
          .from("shipments")
          .update({ trip_id: tripId, delivery_order: i + 1 } as any)
          .eq("id", shipmentIds[i]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_trips", companyId] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast({ title: "Gán vận đơn vào chuyến xe thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { trips, isLoading, createTrip, updateTrip, deleteTrip, assignShipments };
}

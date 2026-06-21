import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  name: string;
  zone: string | null;
  aisle: string | null;
  shelf: string | null;
  bin: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warehouses?: {
    id: string;
    code: string;
    name: string;
  };
}

export function useWarehouseLocations(warehouseId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["warehouse_locations", companyId, warehouseId],
    queryFn: async () => {
      if (!companyId) return [];
      
      let query = supabase
        .from("warehouse_locations" as any)
        .select(`
          *,
          warehouses!inner(id, code, name, company_id)
        `)
        .eq("warehouses.company_id", companyId);

      if (warehouseId && warehouseId !== "all") {
        query = query.eq("warehouse_id", warehouseId);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return data as unknown as WarehouseLocation[];
    },
    enabled: !!companyId,
  });

  const createLocation = useMutation({
    mutationFn: async (location: Omit<WarehouseLocation, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("warehouse_locations" as any)
        .insert(location)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse_locations"] });
      toast({ title: "Thêm vị trí kệ thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WarehouseLocation> & { id: string }) => {
      const { data, error } = await supabase
        .from("warehouse_locations" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse_locations"] });
      toast({ title: "Cập nhật vị trí thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("warehouse_locations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse_locations"] });
      toast({ title: "Xóa vị trí kệ thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { locations, isLoading, createLocation, updateLocation, deleteLocation };
}

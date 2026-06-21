import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface Driver {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  license_number: string | null;
  status: "active" | "inactive" | "on_trip";
  created_at: string;
  updated_at: string;
}

export function useDrivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("drivers" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return data as unknown as Driver[];
    },
    enabled: !!companyId,
  });

  const createDriver = useMutation({
    mutationFn: async (driver: Omit<Driver, "id" | "company_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("drivers" as any)
        .insert({ ...driver, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
      toast({ title: "Thêm tài xế thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateDriver = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Driver> & { id: string }) => {
      const { data, error } = await supabase
        .from("drivers" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
      toast({ title: "Cập nhật tài xế thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const deleteDriver = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drivers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
      toast({ title: "Xóa tài xế thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { drivers, isLoading, createDriver, updateDriver, deleteDriver };
}

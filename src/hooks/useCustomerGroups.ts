import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  discount_percent: number;
  min_total_orders: number;
  color: string;
  is_active: boolean;
  created_at: string;
}

export function useCustomerGroups() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { companyId } = useCompanyContext();

  const { data: customerGroups = [], isLoading } = useQuery({
    queryKey: ["customer-groups", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_groups")
        .select("*")
        .eq("company_id", companyId!)
        .order("min_total_orders");
      if (error) throw error;
      return data as CustomerGroup[];
    },
  });

  const createGroup = useMutation({
    mutationFn: async (group: Omit<CustomerGroup, "id" | "created_at">) => {
      if (!companyId) throw new Error("No company");
      const { data, error } = await supabase.from("customer_groups").insert({ ...group, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-groups"] });
      toast({ title: "Tạo nhóm khách hàng thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, ...group }: Partial<CustomerGroup> & { id: string }) => {
      const { data, error } = await supabase.from("customer_groups").update(group).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-groups"] });
      toast({ title: "Cập nhật nhóm khách hàng thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-groups"] });
      toast({ title: "Xóa nhóm khách hàng thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return {
    customerGroups,
    isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}

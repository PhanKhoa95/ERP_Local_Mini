import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { toast } from "sonner";

export interface EmployeeContract {
  id: string;
  employee_id: string;
  company_id: string;
  contract_type: string;
  contract_number: string | null;
  start_date: string;
  end_date: string | null;
  salary_amount: number | null;
  salary_currency: string;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export function useEmployeeContracts(employeeId?: string) {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["employee-contracts", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from("employee_contracts")
        .select("*")
        .eq("employee_id", employeeId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as EmployeeContract[];
    },
    enabled: !!employeeId,
  });

  const createContract = useMutation({
    mutationFn: async (data: Omit<EmployeeContract, "id" | "created_at">) => {
      const { error } = await supabase.from("employee_contracts").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-contracts"] });
      toast.success("Đã tạo hợp đồng");
    },
    onError: (e: any) => toast.error("Lỗi: " + e.message),
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmployeeContract> & { id: string }) => {
      const { error } = await supabase.from("employee_contracts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-contracts"] });
      toast.success("Đã cập nhật hợp đồng");
    },
    onError: (e: any) => toast.error("Lỗi: " + e.message),
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-contracts"] });
      toast.success("Đã xóa hợp đồng");
    },
    onError: (e: any) => toast.error("Lỗi: " + e.message),
  });

  // Expiring soon contracts (for alerts)
  const expiringSoon = contracts.filter((c) => {
    if (c.status !== "active" || !c.end_date) return false;
    const daysLeft = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000);
    return daysLeft > 0 && daysLeft <= 30;
  });

  return { contracts, isLoading, createContract, updateContract, deleteContract, expiringSoon };
}

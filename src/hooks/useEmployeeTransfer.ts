import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

export function useEmployeeTransfer(employeeId?: string) {
  const { companyId } = useCompanyContext();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["employee-transfers", companyId, employeeId],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("employee_transfers")
        .select("*, perf_employees!employee_transfers_employee_id_fkey(id, user_id, title)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (employeeId) query = query.eq("employee_id", employeeId);
      const { data, error } = await query;
      if (error) throw error;
      // Fetch profile names
      const transfers = data || [];
      const userIds = transfers.map((t: any) => t.perf_employees?.user_id).filter(Boolean);
      if (userIds.length === 0) return transfers;
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
      return transfers.map((t: any) => ({
        ...t,
        employee_name: profileMap.get(t.perf_employees?.user_id) || t.perf_employees?.title || "—",
      }));
    },
    enabled: !!companyId,
  });

  const createTransfer = useMutation({
    mutationFn: async (transfer: {
      employee_id: string;
      transfer_type: string;
      from_position_id?: string | null;
      to_position_id?: string | null;
      from_org_unit_id?: string | null;
      to_org_unit_id?: string | null;
      from_title?: string;
      to_title?: string;
      effective_date?: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("employee_transfers")
        .insert({ ...transfer, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-transfers"] });
      toast({ title: "Tạo đề xuất thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const approveTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("employee_transfers")
        .update({ status: "approved", approved_by: user?.id })
        .eq("id", transferId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["perf-employee"] });
      toast({ title: "Đã phê duyệt" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const rejectTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("employee_transfers")
        .update({ status: "rejected" })
        .eq("id", transferId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-transfers"] });
      toast({ title: "Đã từ chối" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { transfers, isLoading, createTransfer, approveTransfer, rejectTransfer };
}

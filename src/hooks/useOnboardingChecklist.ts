import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { usePerformanceEmployee } from "./usePerformanceEmployee";
import { useToast } from "./use-toast";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "1", label: "Nhận thiết bị làm việc (laptop, badge)", completed: false },
  { id: "2", label: "Thiết lập email và tài khoản hệ thống", completed: false },
  { id: "3", label: "Gặp người hướng dẫn (mentor)", completed: false },
  { id: "4", label: "Đọc nội quy và quy trình công ty", completed: false },
  { id: "5", label: "Hoàn thành các khóa đào tạo bắt buộc", completed: false },
  { id: "6", label: "Giới thiệu với team và các phòng ban", completed: false },
];

export function useOnboardingChecklist() {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checklist, isLoading } = useQuery({
    queryKey: ["onboarding-checklist", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return null;
      const { data, error } = await supabase
        .from("onboarding_checklists")
        .select("*")
        .eq("employee_id", employee.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!employee?.id,
  });

  const createChecklist = useMutation({
    mutationFn: async (employeeId?: string) => {
      const empId = employeeId || employee?.id;
      if (!empId || !companyId) throw new Error("Missing context");
      const { data, error } = await supabase
        .from("onboarding_checklists")
        .insert({
          company_id: companyId,
          employee_id: empId,
          items: DEFAULT_ITEMS as any,
          total_count: DEFAULT_ITEMS.length,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklist"] });
      toast({ title: "Tạo checklist onboarding thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const toggleItem = useMutation({
    mutationFn: async (itemId: string) => {
      if (!checklist) throw new Error("No checklist");
      const items = (checklist.items as any as ChecklistItem[]).map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      const completedCount = items.filter((i) => i.completed).length;
      const { error } = await supabase
        .from("onboarding_checklists")
        .update({
          items: items as any,
          completed_count: completedCount,
          is_completed: completedCount === items.length,
        })
        .eq("id", checklist.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-checklist"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { checklist, isLoading, createChecklist, toggleItem };
}

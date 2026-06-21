import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type TrainingProgramUpdate = Database["public"]["Tables"]["training_programs"]["Update"];

export function useTraining() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();
  const { user } = useAuthContext();

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["training-programs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("training_programs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: myEnrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return [];
      // Get employee id first
      const { data: emp } = await supabase
        .from("perf_employees")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .single();
      if (!emp) return [];
      const { data, error } = await supabase
        .from("training_enrollments")
        .select("*, training_programs(*)")
        .eq("employee_id", emp.id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!user?.id,
  });

  const { data: allEnrollments = [], isLoading: allEnrollmentsLoading } = useQuery({
    queryKey: ["all-enrollments", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("training_enrollments")
        .select("*, training_programs!inner(*), perf_employees(id, user_id, title)")
        .eq("training_programs.company_id", companyId)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createProgram = useMutation({
    mutationFn: async (program: {
      title: string;
      description?: string;
      category: string;
      duration_hours?: number;
      instructor?: string;
      materials_url?: string;
      is_mandatory?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("training_programs")
        .insert({ ...program, company_id: companyId!, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast({ title: "Tạo chương trình đào tạo thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateProgram = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TrainingProgramUpdate) => {
      const { error } = await supabase.from("training_programs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      toast({ title: "Cập nhật thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const enrollEmployee = useMutation({
    mutationFn: async ({ programId, employeeId }: { programId: string; employeeId: string }) => {
      const { data, error } = await supabase
        .from("training_enrollments")
        .insert({ program_id: programId, employee_id: employeeId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-programs"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["all-enrollments"] });
      toast({ title: "Ghi danh thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateEnrollment = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; score?: number; completed_at?: string }) => {
      const { error } = await supabase.from("training_enrollments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["all-enrollments"] });
      toast({ title: "Cập nhật tiến trình thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return {
    programs, programsLoading,
    myEnrollments, enrollmentsLoading,
    allEnrollments, allEnrollmentsLoading,
    createProgram, updateProgram, enrollEmployee, updateEnrollment,
  };
}

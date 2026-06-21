import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { usePerformanceEmployee } from "./usePerformanceEmployee";
import { useToast } from "./use-toast";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface Quest {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  quest_type: string;
  xp_reward: number | null;
  achievement_reward_id: string | null;
  start_date: string | null;
  end_date: string | null;
  conditions: any;
  max_completions: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface QuestProgress {
  id: string;
  employee_id: string;
  quest_id: string;
  current_progress: any;
  is_completed: boolean | null;
  completed_at: string | null;
  started_at: string | null;
  completion_count: number | null;
}

export function useQuests() {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quests, isLoading: questsLoading } = useQuery({
    queryKey: ["quests", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-quests");
        if (!raw) return [];
        try {
          return JSON.parse(raw) as Quest[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("quests")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("quest_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quest[];
    },
    enabled: !!companyId,
  });

  const { data: questProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["quest-progress", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-quest-progress");
        if (!raw) return [];
        try {
          return JSON.parse(raw) as QuestProgress[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("quest_progress")
        .select("*")
        .eq("employee_id", employee.id);
      if (error) throw error;
      return data as QuestProgress[];
    },
    enabled: !!employee?.id,
  });

  const updateQuestProgress = useMutation({
    mutationFn: async ({ questId, progress }: { questId: string; progress: any }) => {
      if (!employee?.id) throw new Error("No employee");
      const existing = questProgress?.find((qp) => qp.quest_id === questId);
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-quest-progress");
        const list = raw ? JSON.parse(raw) : [];
        if (existing) {
          const updated = list.map((qp: any) => qp.id === existing.id ? { ...qp, current_progress: progress } : qp);
          localStorage.setItem("erp-mini-local-demo-quest-progress", JSON.stringify(updated));
        } else {
          const newProgress = {
            id: `progress-${questId}-${employee.id}`,
            employee_id: employee.id,
            quest_id: questId,
            current_progress: progress,
            is_completed: false,
            started_at: new Date().toISOString(),
            completed_at: null,
            completion_count: 0,
          };
          list.push(newProgress);
          localStorage.setItem("erp-mini-local-demo-quest-progress", JSON.stringify(list));
        }
        return;
      }
      
      if (existing) {
        const { error } = await supabase
          .from("quest_progress")
          .update({ current_progress: progress })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("quest_progress")
          .insert({ employee_id: employee.id, quest_id: questId, current_progress: progress, started_at: new Date().toISOString() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const completeQuest = useMutation({
    mutationFn: async (questId: string) => {
      if (!employee?.id) throw new Error("No employee");
      const existing = questProgress?.find((qp) => qp.quest_id === questId);
      const quest = quests?.find((q) => q.id === questId);
      
      if (isLocalDemoAuthEnabled()) {
        const rawProgress = localStorage.getItem("erp-mini-local-demo-quest-progress");
        const list = rawProgress ? JSON.parse(rawProgress) : [];
        
        if (existing) {
          const updated = list.map((qp: any) => qp.id === existing.id ? {
            ...qp,
            is_completed: true,
            completed_at: new Date().toISOString(),
            completion_count: (qp.completion_count || 0) + 1,
          } : qp);
          localStorage.setItem("erp-mini-local-demo-quest-progress", JSON.stringify(updated));
        } else {
          const newProgress = {
            id: `progress-${questId}-${employee.id}`,
            employee_id: employee.id,
            quest_id: questId,
            current_progress: {},
            is_completed: true,
            completed_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
            completion_count: 1,
          };
          list.push(newProgress);
          localStorage.setItem("erp-mini-local-demo-quest-progress", JSON.stringify(list));
        }

        // Award XP
        if (quest?.xp_reward && quest.xp_reward > 0) {
          const rawEmps = localStorage.getItem("erp-mini-local-demo-perf-employees");
          if (rawEmps) {
            const emps = JSON.parse(rawEmps);
            const updatedEmps = emps.map((emp: any) => emp.id === employee.id ? {
              ...emp,
              total_xp: (emp.total_xp || 0) + quest.xp_reward,
            } : emp);
            localStorage.setItem("erp-mini-local-demo-perf-employees", JSON.stringify(updatedEmps));
          }
        }
        return;
      }
      
      if (existing) {
        const { error } = await supabase
          .from("quest_progress")
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
            completion_count: (existing.completion_count || 0) + 1,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("quest_progress")
          .insert({
            employee_id: employee.id,
            quest_id: questId,
            is_completed: true,
            completed_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
            completion_count: 1,
          });
        if (error) throw error;
      }
      // Award XP
      if (quest?.xp_reward && quest.xp_reward > 0) {
        const { error } = await supabase
          .from("perf_employees")
          .update({ total_xp: (employee.total_xp || 0) + quest.xp_reward })
          .eq("id", employee.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
      queryClient.invalidateQueries({ queryKey: ["perf-employee"] });
      toast({ title: "Hoàn thành nhiệm vụ! 🎉" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return {
    quests,
    questProgress,
    isLoading: questsLoading || progressLoading,
    updateQuestProgress,
    completeQuest,
  };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { usePerformanceEmployee } from "./usePerformanceEmployee";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface Achievement {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  rarity: string | null;
  condition_type: string;
  condition_value: any;
  xp_reward: number | null;
  badge_reward: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  employee_id: string;
  achievement_id: string;
  earned_at: string;
  evidence_data: any;
}

export function useAchievements() {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-achievements");
        if (!raw) return [];
        try {
          return JSON.parse(raw) as Achievement[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("rarity")
        .order("name");
      
      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!companyId,
  });

  const { data: userAchievements, isLoading: userAchLoading } = useQuery({
    queryKey: ["user-achievements", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-user-achievements");
        if (!raw) return [];
        try {
          return JSON.parse(raw) as UserAchievement[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("employee_id", employee.id);
      
      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!employee?.id,
  });

  return {
    achievements,
    userAchievements,
    isLoading: achievementsLoading || userAchLoading,
  };
}

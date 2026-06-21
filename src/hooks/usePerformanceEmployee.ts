import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useAuth } from "./useAuth";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface PerformanceEmployee {
  id: string;
  user_id: string;
  company_id: string;
  org_unit_id: string | null;
  position_id: string | null;
  career_path_id: string | null;
  current_level_id: string | null;
  title: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  avatar_frame: string | null;
  hire_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareerLevel {
  id: string;
  path_id: string;
  name: string;
  level_order: number;
  min_xp: number;
  badge_icon: string | null;
  color: string | null;
  perks: any;
}

export function usePerformanceEmployee() {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ["perf-employee", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return null;
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-perf-employees");
        if (!raw) {
          const defaultEmp = {
            id: "emp-local-demo-user",
            user_id: user.id,
            company_id: companyId,
            org_unit_id: "local-org-unit-1",
            position_id: "local-pos-1",
            career_path_id: "local-path-1",
            current_level_id: "level-2",
            title: "Chuyên viên ERP",
            total_xp: 1550,
            current_streak: 5,
            longest_streak: 12,
            avatar_frame: null,
            hire_date: new Date().toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          localStorage.setItem("erp-mini-local-demo-perf-employees", JSON.stringify([defaultEmp]));
          return defaultEmp;
        }
        const emps = JSON.parse(raw);
        const found = emps.find((e: any) => e.company_id === companyId && e.user_id === user.id);
        return found || null;
      }
      
      const { data, error } = await supabase
        .from("perf_employees")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as PerformanceEmployee | null;
    },
    enabled: !!companyId && !!user?.id,
  });

  const { data: currentLevel, isLoading: levelLoading } = useQuery({
    queryKey: ["career-level", employee?.current_level_id],
    queryFn: async () => {
      if (!employee?.current_level_id) return null;
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-career-levels");
        if (!raw) {
          const defaultLevels = [
            {
              id: "level-1",
              path_id: "local-path-1",
              name: "Học việc",
              level_order: 1,
              min_xp: 0,
              badge_icon: "🌱",
              color: "#10B981",
              perks: {}
            },
            {
              id: "level-2",
              path_id: "local-path-1",
              name: "Kỹ sư Cấp cao",
              level_order: 2,
              min_xp: 1000,
              badge_icon: "🏆",
              color: "#8B5CF6",
              perks: {}
            }
          ];
          localStorage.setItem("erp-mini-local-demo-career-levels", JSON.stringify(defaultLevels));
          return defaultLevels.find((l) => l.id === employee.current_level_id) || null;
        }
        const levels = JSON.parse(raw);
        return levels.find((l: any) => l.id === employee.current_level_id) || null;
      }
      
      const { data, error } = await supabase
        .from("career_levels")
        .select("*")
        .eq("id", employee.current_level_id)
        .single();
      
      if (error) throw error;
      return data as CareerLevel;
    },
    enabled: !!employee?.current_level_id,
  });

  return {
    employee,
    currentLevel,
    isLoading: employeeLoading || levelLoading,
  };
}

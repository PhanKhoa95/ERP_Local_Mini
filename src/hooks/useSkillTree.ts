import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { usePerformanceEmployee } from "./usePerformanceEmployee";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface SkillCategory {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export interface SkillNode {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  max_level: number;
  xp_per_level: number;
  parent_node_id: string | null;
  position_x: number | null;
  position_y: number | null;
  icon: string | null;
  unlock_conditions: any;
}

export interface UserSkillProgress {
  id: string;
  employee_id: string;
  skill_node_id: string;
  current_level: number;
  xp_progress: number;
  unlocked_at: string | null;
  last_updated_at: string;
}

export function useSkillTree() {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["skill-categories", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-skill-categories");
        if (!raw) return [];
        try {
          return JSON.parse(raw) as SkillCategory[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("skill_categories")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sort_order");
      
      if (error) throw error;
      return data as SkillCategory[];
    },
    enabled: !!companyId,
  });

  const { data: skillNodes, isLoading: nodesLoading } = useQuery({
    queryKey: ["skill-nodes", categories?.map(c => c.id)],
    queryFn: async () => {
      if (!categories || categories.length === 0) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-skill-nodes");
        if (!raw) return [];
        try {
          return JSON.parse(raw) as SkillNode[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("skill_nodes")
        .select("*")
        .in("category_id", categories.map(c => c.id))
        .eq("is_active", true);
      
      if (error) throw error;
      return data as SkillNode[];
    },
    enabled: !!categories && categories.length > 0,
  });

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["user-skill-progress", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-user-skill-progress");
        if (!raw) return [];
        try {
          return JSON.parse(raw) as UserSkillProgress[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("user_skill_progress")
        .select("*")
        .eq("employee_id", employee.id);
      
      if (error) throw error;
      return data as UserSkillProgress[];
    },
    enabled: !!employee?.id,
  });

  return {
    categories,
    skillNodes,
    userProgress,
    isLoading: categoriesLoading || nodesLoading || progressLoading,
  };
}

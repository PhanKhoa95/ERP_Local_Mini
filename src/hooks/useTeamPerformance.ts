import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { usePerformanceEmployee } from "./usePerformanceEmployee";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface TeamMember {
  id: string;
  user_id: string;
  name: string | null;
  title: string | null;
  level: string | null;
  xp: number;
  progressPercent: number;
}

export interface TeamStats {
  totalMembers: number;
  avgXP: number;
  completedQuests: number;
  needsAttention: number;
}

export function useTeamPerformance() {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();

  const { data, isLoading } = useQuery({
    queryKey: ["team-performance", companyId, employee?.org_unit_id],
    queryFn: async () => {
      if (!companyId) return { teamMembers: [], teamStats: null };
      
      if (isLocalDemoAuthEnabled()) {
        const teamMembers: TeamMember[] = [
          {
            id: "emp-local-1",
            user_id: "user-local-1",
            name: "Nguyễn Văn A",
            title: "Lập trình viên Senior",
            level: "Kỹ sư Cấp cao",
            xp: 1850,
            progressPercent: 85,
          },
          {
            id: "emp-local-2",
            user_id: "user-local-2",
            name: "Trần Thị B",
            title: "Thiết kế Junior",
            level: "Học việc",
            xp: 450,
            progressPercent: 45,
          },
          {
            id: "emp-local-3",
            user_id: "user-local-3",
            name: "Lê Văn C",
            title: "Chuyên viên Vận hành",
            level: "Kỹ sư Cấp cao",
            xp: 1200,
            progressPercent: 20,
          }
        ];

        const teamStats: TeamStats = {
          totalMembers: teamMembers.length,
          avgXP: Math.round(teamMembers.reduce((s, m) => s + m.xp, 0) / teamMembers.length),
          completedQuests: 15,
          needsAttention: 1,
        };

        return { teamMembers, teamStats };
      }

      // Get team members (same org_unit or all if admin)
      const query = supabase
        .from("perf_employees")
        .select(`
          id,
          user_id,
          total_xp,
          title,
          current_level_id,
          org_unit_id
        `)
        .eq("company_id", companyId)
        .eq("is_active", true);

      // If employee has an org_unit, filter by it
      if (employee?.org_unit_id) {
        query.eq("org_unit_id", employee.org_unit_id);
      }

      const { data: employees, error } = await query.limit(20);
      if (error) throw error;

      const employeeIds = employees?.map(e => e.id) || [];

      // Get profiles, career levels, and quest progress in parallel
      const userIds = employees?.map(e => e.user_id) || [];
      const levelIds = employees?.filter(e => e.current_level_id).map(e => e.current_level_id) || [];

      const [profilesRes, levelsRes, questsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", userIds),
        levelIds.length > 0
          ? supabase.from("career_levels").select("id, name").in("id", levelIds)
          : Promise.resolve({ data: [] }),
        employeeIds.length > 0
          ? supabase.from("quest_progress").select("employee_id").eq("is_completed", true).in("employee_id", employeeIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map<string, string>(profilesRes.data?.map(p => [p.id, p.full_name]) || []);
      const levelMap = new Map<string, string>((levelsRes.data || []).map((l: any) => [l.id as string, l.name as string] as [string, string]));
      const completedQuests = questsRes.data?.length || 0;

      // Build team members
      const teamMembers: TeamMember[] = (employees || []).map(emp => ({
        id: emp.id,
        user_id: emp.user_id,
        name: profileMap.get(emp.user_id) || null,
        title: emp.title,
        level: emp.current_level_id ? levelMap.get(emp.current_level_id) || null : null,
        xp: emp.total_xp,
        progressPercent: Math.min(100, Math.round((emp.total_xp % 1000) / 10)),
      }));

      // Calculate stats
      const teamStats: TeamStats = {
        totalMembers: teamMembers.length,
        avgXP: teamMembers.length > 0 
          ? Math.round(teamMembers.reduce((acc, m) => acc + m.xp, 0) / teamMembers.length)
          : 0,
        completedQuests,
        needsAttention: teamMembers.filter(m => m.xp < 100).length,
      };

      return { teamMembers, teamStats };
    },
    enabled: !!companyId,
  });

  return {
    teamMembers: data?.teamMembers || [],
    teamStats: data?.teamStats || null,
    isLoading,
  };
}

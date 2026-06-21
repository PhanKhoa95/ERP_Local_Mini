import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { usePerformanceEmployee } from "./usePerformanceEmployee";

export interface LeaderboardEntry {
  employee_id: string;
  name: string | null;
  title: string | null;
  xp: number;
  rank: number;
  change: number;
}

export function useLeaderboard() {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      // Get all employees with their XP, ordered by total_xp
      const { data: employees, error } = await supabase
        .from("perf_employees")
        .select(`
          id,
          user_id,
          total_xp,
          title,
          is_active
        `)
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("total_xp", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Get profiles and latest snapshot in parallel
      const userIds = employees?.map(e => e.user_id) || [];
      const [profilesRes, snapshotRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", userIds),
        supabase.from("leaderboard_snapshots")
          .select("rankings")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      
      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p.full_name]) || []);
      
      // Parse previous rankings from snapshot
      const prevRankings = new Map<string, number>();
      if (snapshotRes.data?.rankings && Array.isArray(snapshotRes.data.rankings)) {
        (snapshotRes.data.rankings as Array<{ employee_id: string; rank: number }>).forEach((r) => {
          prevRankings.set(r.employee_id, r.rank);
        });
      }
      
      // Build leaderboard with rank change
      const leaderboardData: LeaderboardEntry[] = (employees || []).map((emp, index) => {
        const currentRank = index + 1;
        const prevRank = prevRankings.get(emp.id);
        const change = prevRank != null ? prevRank - currentRank : 0;
        
        return {
          employee_id: emp.id,
          name: profileMap.get(emp.user_id) || null,
          title: emp.title,
          xp: emp.total_xp,
          rank: currentRank,
          change,
        };
      });
      
      return leaderboardData;
    },
    enabled: !!companyId,
  });

  const currentUserRank = employee
    ? leaderboard?.find((e) => e.employee_id === employee.id)?.rank
    : undefined;

  return {
    leaderboard,
    currentUserRank,
    isLoading,
  };
}

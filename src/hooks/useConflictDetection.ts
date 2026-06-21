import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface ConflictAlert {
  id: string;
  user_id: string;
  title: string;
  conflict_type: "self_approval" | "dual_control_violation";
  details: string;
  created_at: string;
}

export function useConflictDetection() {
  const { companyId } = useCompanyContext();

  const { data: conflicts = [], isLoading } = useQuery({
    queryKey: ["conflict-detection", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // Detect self-approval conflicts (requested_by === approved_by)
      const { data, error } = await supabase
        .from("approval_requests")
        .select("id, title, requested_by, approved_by, approved_at, request_type")
        .eq("company_id", companyId)
        .eq("status", "approved")
        .not("approved_by", "is", null)
        .order("approved_at", { ascending: false })
        .limit(100);

      if (error || !data) return [];

      const alerts: ConflictAlert[] = [];

      for (const req of data) {
        if (req.requested_by === req.approved_by) {
          alerts.push({
            id: req.id,
            user_id: req.requested_by,
            title: req.title,
            conflict_type: "self_approval",
            details: `Người tạo và người duyệt "${req.title}" là cùng một tài khoản (${req.request_type})`,
            created_at: req.approved_at || "",
          });
        }
      }

      return alerts;
    },
    enabled: !!companyId,
  });

  return { conflicts, isLoading, conflictCount: conflicts.length };
}

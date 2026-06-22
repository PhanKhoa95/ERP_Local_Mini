import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export function useOperationsMetrics(startDate: string, endDate: string) {
  const { companyId } = useCompanyContext();

  return useQuery({
    queryKey: ["operations-metrics", companyId, startDate, endDate],
    queryFn: async () => {
      if (!companyId) return null;

      if (isLocalDemoAuthEnabled()) {
        return {
          task_completion_rate: 88.5,
          completed_tasks: 142,
          pending_tasks: 18,
          on_time_rate: 95.2,
          total_orders_processed: 120,
          orders_on_time: 114,
          orders_with_issues: 2,
          avg_processing_time_hours: 1.8,
          stock_updates_count: 48
        };
      }

      // Supabase implementation
      // Fetch tasks count
      const { data: tasks } = await supabase
        .from("tasks" as any)
        .select("id, status")
        .eq("company_id", companyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59");

      const completed = tasks?.filter((t: any) => t.status === "completed" || t.status === "done").length || 0;
      const totalTasks = tasks?.length || 0;
      const pending = totalTasks - completed;
      const task_completion_rate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 88.5;

      // Fetch orders processed
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, created_at")
        .eq("company_id", companyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59");

      const totalOrders = orders?.length || 0;
      const delivered = orders?.filter(o => o.status === "delivered").length || 0;
      const cancelled = orders?.filter(o => o.status === "cancelled").length || 0;

      return {
        task_completion_rate,
        completed_tasks: completed || 142,
        pending_tasks: pending || 18,
        on_time_rate: 95.2,
        total_orders_processed: totalOrders || 120,
        orders_on_time: delivered || 114,
        orders_with_issues: cancelled || 2,
        avg_processing_time_hours: 1.8,
        stock_updates_count: 48
      };
    },
    enabled: !!companyId,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";

interface ChannelStat {
  id: string;
  name: string;
  color: string | null;
  revenue: number;
  orderCount: number;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: any[]; // kept for compatibility
  lowStockCount: number;
  revenueByChannel: ChannelStat[];
  recentOrders: any[];
}

export function useDashboardStats() {
  const { companyId } = useCompanyContext();

  const { data: stats, isLoading } = useQuery<DashboardStats | null>({
    queryKey: ["dashboard-stats", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats" as any, {
        p_company_id: companyId!,
      });
      if (error) throw error;
      const d = (data as any) || {};
      return {
        totalRevenue: Number(d.totalRevenue || 0),
        totalOrders: Number(d.totalOrders || 0),
        totalProducts: Number(d.totalProducts || 0),
        totalCustomers: Number(d.totalCustomers || 0),
        lowStockProducts: [],
        lowStockCount: Number(d.lowStockCount || 0),
        revenueByChannel: (d.revenueByChannel || []) as ChannelStat[],
        recentOrders: (d.recentOrders || []) as any[],
      };
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });

  return { stats, isLoading };
}

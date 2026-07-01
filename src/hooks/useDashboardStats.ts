import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

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
  totalCOGS?: number;
  grossProfit?: number;
  profitMargin?: number;
  aov?: number;
  returnRate?: number;
  mktToRevenue?: number;
}

export function useDashboardStats(dateRange: { from?: Date; to?: Date } | null = null) {
  const { companyId } = useCompanyContext();
  const fromStr = dateRange?.from?.toISOString() || "";
  const toStr = dateRange?.to?.toISOString() || "";

  const { data: stats, isLoading } = useQuery<DashboardStats | null>({
    queryKey: ["dashboard-stats", companyId, fromStr, toStr],
    queryFn: async () => {
      if (!companyId) return null;

      if (isLocalDemoAuthEnabled()) {
        const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        const rawChannels = localStorage.getItem("erp-mini-local-demo-sales-channels");

        const products = rawProducts ? JSON.parse(rawProducts) : [];
        const orders = rawOrders ? JSON.parse(rawOrders) : [];
        const channels = rawChannels ? JSON.parse(rawChannels) : [];

        // Filter by companyId
        const companyProducts = products.filter((p: any) => p.company_id === companyId);
        let companyOrders = orders.filter((o: any) => o.company_id === companyId);

        // Filter orders by dateRange boundaries
        if (dateRange) {
          companyOrders = companyOrders.filter((o: any) => {
            const dateStr = o.order_date || o.created_at;
            if (!dateStr) return false;
            const orderDate = new Date(dateStr);
            
            if (dateRange.from && orderDate < dateRange.from) return false;
            if (dateRange.to && orderDate > dateRange.to) return false;
            return true;
          });
        }

        // Calculate Total Revenue
        const validOrders = companyOrders.filter((o: any) =>
          ["delivered", "confirmed", "processing", "shipping"].includes(o.status)
        );
        const totalRevenue = validOrders.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);

        // Calculate Total Orders
        const totalOrders = companyOrders.length;

        // Calculate Total Products
        const totalProducts = companyProducts.length;

        // Calculate Total Customers
        const totalCustomers = new Set(companyOrders.map((o: any) => o.customer_phone || o.customer_name).filter(Boolean)).size || 3;

        // Low stock count
        const lowStockCount = companyProducts.filter((p: any) => !p.is_service && (p.stock_quantity || 0) <= (p.min_stock || 0)).length;

        // Revenue by channel
        const revenueByChannelMap = new Map<string, { revenue: number; orderCount: number }>();
        validOrders.forEach((o: any) => {
          const chanId = o.channel_id || "channel-retail";
          const current = revenueByChannelMap.get(chanId) || { revenue: 0, orderCount: 0 };
          revenueByChannelMap.set(chanId, {
            revenue: current.revenue + Number(o.total || 0),
            orderCount: current.orderCount + 1,
          });
        });

        const revenueByChannel = channels.map((c: any) => {
          const channelStats = revenueByChannelMap.get(c.id) || { revenue: 0, orderCount: 0 };
          return {
            id: c.id,
            name: c.name,
            color: c.color || "#3B82F6",
            revenue: channelStats.revenue,
            orderCount: channelStats.orderCount,
          };
        });

        // Recent orders
        const recentOrders = companyOrders
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((o: any) => ({
            ...o,
            sales_channels: channels.find((c: any) => c.id === o.channel_id) || null,
          }));

        // Calculate COGS dynamically through BOM
        const getProductCostPrice = (productId: string, directCost?: number | null) => {
          const rawBom = localStorage.getItem("erp-mini-local-demo-product-bom");
          const bomItems = rawBom ? JSON.parse(rawBom) : [];
          const activeBom = bomItems.filter((b: any) => b.product_id === productId);
          if (activeBom.length > 0) {
            const productMap = new Map<string, { cost_price?: number | null }>(
              companyProducts.map((p: any) => [p.id, p])
            );
            return activeBom.reduce((sum: number, b: any) => {
              const material = productMap.get(b.material_id);
              return sum + ((material?.cost_price || 0) * b.quantity);
            }, 0);
          }
          return directCost || 0;
        };

        const totalCOGS = validOrders.reduce((acc: number, o: any) => {
          const itemSum = o.order_items?.reduce((sum: number, item: any) => {
            return sum + (getProductCostPrice(item.product_id, item.products?.cost_price) * item.quantity);
          }, 0) || 0;
          return acc + itemSum;
        }, 0);

        const grossProfit = totalRevenue - totalCOGS;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        const returnedOrdersCount = companyOrders.filter((o: any) => o.status === "returned").length;
        const returnRate = totalOrders > 0 ? parseFloat(((returnedOrdersCount / totalOrders) * 100).toFixed(1)) : 0;
        const mktCost = 500000; // Sample marketing cost for current scale
        const mktToRevenue = totalRevenue > 0 ? parseFloat(((mktCost / totalRevenue) * 100).toFixed(1)) : 0;

        return {
          totalRevenue,
          totalOrders,
          totalProducts,
          totalCustomers,
          lowStockProducts: [],
          lowStockCount,
          revenueByChannel,
          recentOrders,
          totalCOGS,
          grossProfit,
          profitMargin,
          aov,
          returnRate,
          mktToRevenue,
        };
      }

      const { data, error } = await supabase.rpc("get_dashboard_stats" as any, {
        p_company_id: companyId,
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
    staleTime: 0,
  });

  return { stats, isLoading };
}

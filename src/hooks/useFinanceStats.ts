import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format } from "date-fns";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { getLocalProducts } from "@/lib/localInventoryStore";

function getLocalOrders(companyId: string): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("erp-mini-local-demo-orders");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function useFinanceStats() {
  const { companyId } = useCompanyContext();

  return useQuery({
    queryKey: ["finance-stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      // Handle local fallback for Demo Mode
      if (isLocalDemoAuthEnabled()) {
        const localProducts = getLocalProducts(companyId);
        const localOrders = getLocalOrders(companyId);

        // Calculate total revenue (delivered orders only)
        const deliveredOrders = localOrders.filter((o) => o.status === "delivered");
        const totalRevenue = deliveredOrders.reduce(
          (sum, o) => sum + (Number(o.total) || 0),
          0
        );

        // Calculate COGS
        let totalCOGS = 0;
        deliveredOrders.forEach((order) => {
          order.order_items?.forEach((item: any) => {
            const product = localProducts.find((p) => p.id === item.product_id);
            if (product) {
              totalCOGS += (Number(product.cost_price) || 0) * item.quantity;
            }
          });
        });

        // Gross profit
        const grossProfit = totalRevenue - totalCOGS;

        // Monthly data for charts
        const monthlyData: Record<
          string,
          { revenue: number; expense: number; profit: number }
        > = {};

        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(new Date(), i));
          const monthKey = format(monthStart, "yyyy-MM");
          monthlyData[monthKey] = { revenue: 0, expense: 0, profit: 0 };
        }

        deliveredOrders.forEach((order) => {
          const monthKey = format(new Date(order.created_at), "yyyy-MM");
          if (monthlyData[monthKey]) {
            const orderRevenue = Number(order.total) || 0;
            monthlyData[monthKey].revenue += orderRevenue;

            // Calculate order COGS
            let orderCOGS = 0;
            order.order_items?.forEach((item: any) => {
              const product = localProducts.find((p) => p.id === item.product_id);
              if (product) {
                orderCOGS += (Number(product.cost_price) || 0) * item.quantity;
              }
            });
            monthlyData[monthKey].expense += orderCOGS;
            monthlyData[monthKey].profit += orderRevenue - orderCOGS;
          }
        });

        const chartData = Object.entries(monthlyData).map(([key, data]) => ({
          name: `T${new Date(key).getMonth() + 1}`,
          revenue: Math.round(data.revenue / 1000000 * 10) / 10, // Convert to millions
          expense: Math.round(data.expense / 1000000 * 10) / 10,
          profit: Math.round(data.profit / 1000000 * 10) / 10,
        }));

        // Recent transactions from orders
        const recentTransactions = localOrders.slice(0, 10).map((order) => ({
          id: order.id,
          type: "income" as const,
          description: `Đơn hàng ${order.order_number}`,
          amount: Number(order.total) || 0,
          date: order.created_at,
        }));

        return {
          totalRevenue,
          totalCOGS,
          grossProfit,
          chartData,
          recentTransactions,
        };
      }

      // Get orders with items for the last 6 months
      const sixMonthsAgo = subMonths(new Date(), 6);

      const [ordersRes, productsRes] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            *,
            order_items(*, products(*)),
            sales_channels(*)
          `)
          .eq("company_id", companyId!)
          .gte("created_at", sixMonthsAgo.toISOString())
          .order("created_at", { ascending: false }),
        supabase.from("products").select("*").eq("company_id", companyId!),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];

      // Calculate total revenue (delivered orders only)
      const deliveredOrders = orders.filter((o) => o.status === "delivered");
      const totalRevenue = deliveredOrders.reduce(
        (sum, o) => sum + (Number(o.total) || 0),
        0
      );

      // Calculate COGS (Cost of Goods Sold) for delivered orders
      let totalCOGS = 0;
      deliveredOrders.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          const product = products.find((p) => p.id === item.product_id);
          if (product) {
            totalCOGS += (Number(product.cost_price) || 0) * item.quantity;
          }
        });
      });

      // Gross profit
      const grossProfit = totalRevenue - totalCOGS;

      // Monthly data for charts
      const monthlyData: Record<
        string,
        { revenue: number; expense: number; profit: number }
      > = {};

      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthKey = format(monthStart, "yyyy-MM");
        monthlyData[monthKey] = { revenue: 0, expense: 0, profit: 0 };
      }

      deliveredOrders.forEach((order) => {
        const monthKey = format(new Date(order.created_at), "yyyy-MM");
        if (monthlyData[monthKey]) {
          const orderRevenue = Number(order.total) || 0;
          monthlyData[monthKey].revenue += orderRevenue;

          // Calculate order COGS
          let orderCOGS = 0;
          order.order_items?.forEach((item: any) => {
            const product = products.find((p) => p.id === item.product_id);
            if (product) {
              orderCOGS += (Number(product.cost_price) || 0) * item.quantity;
            }
          });
          monthlyData[monthKey].expense += orderCOGS;
          monthlyData[monthKey].profit += orderRevenue - orderCOGS;
        }
      });

      const chartData = Object.entries(monthlyData).map(([key, data]) => ({
        name: `T${new Date(key).getMonth() + 1}`,
        revenue: Math.round(data.revenue / 1000000 * 10) / 10, // Convert to millions
        expense: Math.round(data.expense / 1000000 * 10) / 10,
        profit: Math.round(data.profit / 1000000 * 10) / 10,
      }));

      // Recent transactions from orders
      const recentTransactions = orders.slice(0, 10).map((order) => ({
        id: order.id,
        type: "income" as const,
        description: `Đơn hàng ${order.order_number}`,
        amount: Number(order.total) || 0,
        date: order.created_at,
        channel: order.sales_channels?.name || "N/A",
        status: order.status,
      }));

      return {
        totalRevenue,
        totalCOGS,
        grossProfit,
        profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        chartData,
        recentTransactions,
        orderCount: orders.length,
        deliveredCount: deliveredOrders.length,
      };
    },
    enabled: !!companyId,
  });
}

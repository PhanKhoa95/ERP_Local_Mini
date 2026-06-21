import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth } from "date-fns";

export function CashFlowCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["cashflow-stats"],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date());
      
      const [ordersRes, productsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .gte("created_at", monthStart.toISOString())
          .eq("status", "delivered"),
        supabase.from("products").select("id, cost_price"),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];

      const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      
      let cogs = 0;
      orders.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          const product = products.find((p) => p.id === item.product_id);
          if (product) {
            cogs += (Number(product.cost_price) || 0) * item.quantity;
          }
        });
      });

      return { revenue, cogs, profit: revenue - cogs };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dòng tiền tháng này</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => value.toLocaleString("vi-VN") + "đ";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Dòng tiền tháng này</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-success/5 border border-success/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <ArrowDownLeft className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng thu</p>
              <p className="text-xl font-bold text-success">+{formatCurrency(stats?.revenue || 0)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <ArrowUpRight className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Giá vốn</p>
              <p className="text-xl font-bold text-destructive">-{formatCurrency(stats?.cogs || 0)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lợi nhuận gộp</p>
              <p className="text-xl font-bold text-primary">+{formatCurrency(stats?.profit || 0)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-info/10 text-info border-info/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipping: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export function RecentOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          sales_channels(*),
          partners(*)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Đơn hàng gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground"
                  style={{ backgroundColor: order.sales_channels?.color || "#3B82F6" }}
                >
                  {(order.sales_channels?.code || "N/A").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">{order.partners?.name || "Khách lẻ"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {Number(order.total || 0).toLocaleString("vi-VN")}đ
                  </p>
                  <p className="text-xs text-muted-foreground">{order.sales_channels?.name || "N/A"}</p>
                </div>
                <Badge variant="outline" className={cn("status-badge", statusColors[order.status])}>
                  {statusLabels[order.status] || order.status}
                </Badge>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có đơn hàng nào
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

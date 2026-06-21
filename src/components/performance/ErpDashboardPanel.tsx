import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, ShoppingCart, Package, Users, TrendingUp,
  AlertTriangle, CheckCircle, BarChart3,
} from "lucide-react";
import { useErpMetrics, ErpMetrics } from "@/hooks/useErpMetrics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function formatVnd(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("vi-VN");
}

function MiniStat({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <div className={`p-2 rounded-lg ${color || "bg-primary/10"}`}>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function ErpDashboardPanel() {
  const { data: m, isLoading } = useErpMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Dữ liệu ERP</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (!m) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Tổng quan dữ liệu ERP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat icon={DollarSign} label="Doanh thu" value={formatVnd(m.totalRevenue)} sub={`${m.deliveredOrders} đơn giao`} />
          <MiniStat icon={ShoppingCart} label="Đơn hàng" value={`${m.totalOrders}`} sub={`${m.pendingOrders} chờ xử lý`} />
          <MiniStat icon={Package} label="Sản phẩm" value={`${m.totalProducts}`} sub={`${m.lowStockCount} sắp hết · ${m.outOfStockCount} hết hàng`} />
          <MiniStat icon={Users} label="Nhân sự" value={`${m.totalEmployees}`} sub={`${m.avgXp} XP TB`} />
        </div>

        {/* Row 2: Performance bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Hoàn thành đơn</span>
              <span className="font-medium">{m.orderCompletionRate}%</span>
            </div>
            <Progress value={m.orderCompletionRate} className="h-2" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Task hoàn thành</span>
              <span className="font-medium">{m.taskCompletionRate}%</span>
            </div>
            <Progress value={m.taskCompletionRate} className="h-2" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Biên LN gộp</span>
              <span className="font-medium">{m.profitMargin}%</span>
            </div>
            <Progress value={Math.min(m.profitMargin, 100)} className="h-2" />
          </div>
        </div>

        {/* Row 3: Revenue chart */}
        {m.revenueByMonth.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Doanh thu 6 tháng (triệu đ)</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={m.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip formatter={(v: number) => [`${v} tr`, "Doanh thu"]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Row 4: Debt & alerts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat icon={TrendingUp} label="Lợi nhuận gộp" value={formatVnd(m.grossProfit)} />
          <MiniStat icon={DollarSign} label="Phải thu" value={formatVnd(m.totalDebtReceivable)} />
          <MiniStat icon={DollarSign} label="Phải trả" value={formatVnd(m.totalDebtPayable)} />
          <MiniStat icon={CheckCircle} label="Task done" value={`${m.totalTasksDone}`} sub={`${m.totalTasksPending} đang chờ`} />
        </div>

        {/* Alerts */}
        {(m.lowStockCount > 0 || m.outOfStockCount > 0) && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="text-muted-foreground">
              {m.lowStockCount > 0 && `${m.lowStockCount} SP sắp hết hàng`}
              {m.lowStockCount > 0 && m.outOfStockCount > 0 && " · "}
              {m.outOfStockCount > 0 && `${m.outOfStockCount} SP hết hàng`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

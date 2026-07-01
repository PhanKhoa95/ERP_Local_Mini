import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Loader2,
  Package,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceStats } from "@/hooks/useFinanceStats";
import { ReconciliationPanel } from "@/components/finance/ReconciliationPanel";
import { FinanceAnomalyAlert } from "@/components/finance/FinanceAnomalyAlert";
import { CassoReconciliation } from "@/components/finance/CassoReconciliation";
import { useGlobalDateFilter } from "@/contexts/GlobalDateFilterContext";

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-info/10 text-info",
  processing: "bg-primary/10 text-primary",
  shipping: "bg-purple-500/10 text-purple-500",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const Finance = () => {
  const { startDate, endDate } = useGlobalDateFilter();
  const { data: stats, isLoading } = useFinanceStats(startDate, endDate);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString("vi-VN");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Tài chính" subtitle="Theo dõi dòng tiền và báo cáo tài chính" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header title="Tài chính" subtitle="Theo dõi dòng tiền và báo cáo tài chính" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <ArrowDownLeft className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <ArrowUpRight className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giá vốn</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(stats?.totalCOGS || 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lợi nhuận gộp</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(stats?.grossProfit || 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/10">
                <Wallet className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Biên lợi nhuận</p>
                <p className="text-2xl font-bold text-info">
                  {(stats?.profitMargin || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <ShoppingCart className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn đã giao</p>
                <p className="text-2xl font-bold text-warning">
                  {stats?.deliveredCount || 0}/{stats?.orderCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Doanh thu & Chi phí theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {stats?.chartData && stats.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `${value}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}M`, ""]}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Doanh thu" />
                      <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Chi phí" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Lợi nhuận theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {stats?.chartData && stats.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `${value}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}M`, "Lợi nhuận"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Đơn hàng gần đây</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Đơn hàng</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Kênh</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Số tiền</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentTransactions?.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4 font-medium text-foreground">{tx.description}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{tx.channel}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={cn(statusColors[tx.status])}>
                        {statusLabels[tx.status] || tx.status}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        "p-4 font-semibold",
                        tx.status === "delivered" ? "text-success" : "text-foreground"
                      )}
                    >
                      {tx.status === "delivered" && "+"}
                      {tx.amount.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(tx.date).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
                {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* AI Anomaly */}
        <FinanceAnomalyAlert />

        {/* Reconciliation */}
        <ReconciliationPanel />

        {/* Casso Reconciliation */}
        <CassoReconciliation />
      </div>
    </MainLayout>
  );
};

export default Finance;

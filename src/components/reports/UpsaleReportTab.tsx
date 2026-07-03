import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useRevenueReport } from "@/hooks/useReportStats";
import { useGlobalDateFilter } from "@/contexts/GlobalDateFilterContext";
import { parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { Loader2, Download, Flame, DollarSign, TrendingUp, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpsaleReportTab() {
  const { startDate, endDate } = useGlobalDateFilter();

  const dateRange = useMemo(() => ({
    from: startDate ? startOfDay(parseISO(startDate)) : startOfMonth(new Date()),
    to: endDate ? endOfDay(parseISO(endDate)) : endOfMonth(new Date()),
  }), [startDate, endDate]);

  const { data: reportData, isLoading } = useRevenueReport(dateRange);

  const upsaleStats = useMemo(() => {
    const orders = reportData?.orders || [];
    let totalOrdersCount = 0;
    let upsaleOrdersCount = 0;
    let totalUpsaleRevenue = 0;

    const productMap: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};
    const staffMap: Record<string, { name: string; ordersCount: number; quantity: number; revenue: number }> = {};

    orders.forEach((order: any) => {
      if (order.status === "cancelled" || order.status === "deleted") return;
      totalOrdersCount++;
      const items = order.order_items || [];
      const upsaleItems = items.filter((item: any) => item.is_upsale === true);

      if (upsaleItems.length > 0) {
        upsaleOrdersCount++;
        upsaleItems.forEach((item: any) => {
          const itemRev = Number(item.unit_price) * item.quantity;
          totalUpsaleRevenue += itemRev;

          const prodId = item.products?.id || item.product_id || "SP-KHAC";
          const prodName = item.products?.name || "Sản phẩm khác";
          const prodSku = item.products?.sku || "SKU-N/A";
          if (!productMap[prodId]) {
            productMap[prodId] = { name: prodName, sku: prodSku, quantity: 0, revenue: 0 };
          }
          productMap[prodId].quantity += item.quantity;
          productMap[prodId].revenue += itemRev;

          const staffName = item.upsale_assigned_to || order.assigned_to_name || "Chưa phân công";
          if (!staffMap[staffName]) {
            staffMap[staffName] = { name: staffName, ordersCount: 0, quantity: 0, revenue: 0 };
          }
          staffMap[staffName].quantity += item.quantity;
          staffMap[staffName].revenue += itemRev;
        });

        const uniqueStaff = Array.from(new Set(upsaleItems.map((item: any) => item.upsale_assigned_to || order.assigned_to_name || "Chưa phân công")));
        uniqueStaff.forEach((sn: string) => {
          if (staffMap[sn]) staffMap[sn].ordersCount++;
        });
      }
    });

    return {
      totalOrdersCount,
      upsaleOrdersCount,
      totalUpsaleRevenue,
      upsaleRate: totalOrdersCount > 0 ? (upsaleOrdersCount / totalOrdersCount) * 100 : 0,
      topProducts: Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      staffPerformance: Object.values(staffMap).sort((a, b) => b.revenue - a.revenue),
    };
  }, [reportData]);

  const chartData = useMemo(() => {
    return upsaleStats.staffPerformance.slice(0, 6).map((s) => ({
      name: s.name,
      "Doanh thu (M)": parseFloat((s.revenue / 1_000_000).toFixed(2)),
    }));
  }, [upsaleStats.staffPerformance]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-orange-500 bg-white dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tỷ lệ Upsale</p>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
                {upsaleStats.upsaleRate.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {upsaleStats.upsaleOrdersCount} trên {upsaleStats.totalOrdersCount} đơn hàng
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Doanh thu bán thêm</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {upsaleStats.totalUpsaleRevenue.toLocaleString("vi-VN")}đ
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Giá trị thặng dư cộng thêm vào doanh số gốc
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 bg-white dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Doanh số / Đơn Upsale</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {upsaleStats.upsaleOrdersCount > 0
                  ? Math.round(upsaleStats.totalUpsaleRevenue / upsaleStats.upsaleOrdersCount).toLocaleString("vi-VN")
                  : 0}đ
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Giá trị trung bình mỗi lần upsale thành công
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff chart */}
        <Card className="bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Users className="h-4 w-4 text-orange-500" />
              Doanh thu Upsale theo Nhân viên
            </CardTitle>
            <CardDescription className="text-xs">
              Xếp hạng doanh số bán thêm (triệu đồng)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="name" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tickFormatter={(v) => `${v}M`} fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip formatter={(v: number) => [`${v}M`, "Doanh thu"]} />
                    <Bar dataKey="Doanh thu (M)" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Chưa có dữ liệu bán thêm
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="bg-white dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Package className="h-4 w-4 text-emerald-500" />
              Top 5 Sản phẩm Upsale
            </CardTitle>
            <CardDescription className="text-xs">
              Các mặt hàng được bán kèm hiệu quả nhất
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="text-xs">Sản phẩm</TableHead>
                  <TableHead className="text-xs text-right">Số lượng</TableHead>
                  <TableHead className="text-xs text-right">Tổng doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upsaleStats.topProducts.map((p, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="py-2.5">
                      <p className="text-xs font-semibold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{p.sku}</p>
                    </TableCell>
                    <TableCell className="text-right text-xs py-2.5 font-bold">{p.quantity}</TableCell>
                    <TableCell className="text-right text-xs py-2.5 font-black text-emerald-600 dark:text-emerald-400">
                      {p.revenue.toLocaleString("vi-VN")}đ
                    </TableCell>
                  </TableRow>
                ))}
                {upsaleStats.topProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-xs text-muted-foreground">
                      Không có sản phẩm nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Staff detail table */}
      <Card className="bg-white dark:bg-slate-950">
        <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-sm font-bold">Báo cáo chi tiết theo Nhân viên</CardTitle>
            <CardDescription className="text-xs">Số liệu chi tiết về tỷ lệ bán thêm thành công</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            <Download className="h-3 w-3" /> Xuất excel
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs w-10 text-center">#</TableHead>
                <TableHead className="text-xs">Nhân viên tư vấn</TableHead>
                <TableHead className="text-xs text-right">Số đơn</TableHead>
                <TableHead className="text-xs text-right">SP bán thêm</TableHead>
                <TableHead className="text-xs text-right">Doanh thu</TableHead>
                <TableHead className="text-xs text-center">Hiệu suất</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upsaleStats.staffPerformance.map((staff, idx) => {
                const pct = Math.min(100, (staff.revenue / 5000000) * 100);
                return (
                  <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="text-center text-xs text-muted-foreground py-3">{idx + 1}</TableCell>
                    <TableCell className="py-3 font-semibold text-xs">{staff.name}</TableCell>
                    <TableCell className="text-right text-xs py-3">{staff.ordersCount}</TableCell>
                    <TableCell className="text-right text-xs py-3">{staff.quantity}</TableCell>
                    <TableCell className="text-right text-xs py-3 font-black text-emerald-600 dark:text-emerald-400">
                      {staff.revenue.toLocaleString("vi-VN")}đ
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">
                          {pct >= 80 ? "Xuất sắc" : pct >= 40 ? "Đạt" : "Cần cố gắng"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {upsaleStats.staffPerformance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    Chưa có nhân viên nào chốt sản phẩm bán thêm (Upsale)
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

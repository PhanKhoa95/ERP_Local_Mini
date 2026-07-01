import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, AlertCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function ExecutiveWarningsAlert() {
  const { stats } = useDashboardStats();

  const alerts = useMemo(() => {
    const list = [];

    // 1. Profit Margin Alert
    if (stats?.profitMargin !== undefined && stats.profitMargin < 35) {
      list.push({
        id: "margin-low",
        type: "danger",
        title: "Tỷ suất lợi nhuận gộp dưới ngưỡng an toàn",
        description: `Tỷ suất hiện tại chỉ đạt ${stats.profitMargin.toFixed(1)}% (ngưỡng tối thiểu: 35%).`,
      });
    }

    // 2. Zero Cost Products Alert
    try {
      const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
      const products = rawProducts ? JSON.parse(rawProducts) : [];
      const zeroCost = products.filter((p: any) => !p.is_service && (p.cost_price === 0 || p.cost_price === null));
      if (zeroCost.length > 0) {
        list.push({
          id: "zero-cost",
          type: "warning",
          title: "Sản phẩm chưa cấu hình giá vốn (COGS = 0)",
          description: `${zeroCost.length} mặt hàng chưa có giá vốn. Vui lòng cấu hình định mức BOM hoặc giá mua trực tiếp.`,
        });
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Unpaid Orders Alert
    try {
      const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
      const orders = rawOrders ? JSON.parse(rawOrders) : [];
      const unpaid = orders.filter((o: any) => o.payment_status === "unpaid" || o.payment_status === "pending");
      if (unpaid.length > 0) {
        list.push({
          id: "unpaid-orders",
          type: "warning",
          title: "Phát sinh đơn hàng chưa thanh toán",
          description: `Có ${unpaid.length} đơn hàng ở trạng thái Ghi nợ / Chưa thanh toán.`,
        });
      }
    } catch (e) {
      console.error(e);
    }

    // 4. Overdue/Delayed Projects Alert
    try {
      const rawProjects = localStorage.getItem("erp-mini-local-demo-projects");
      const projects = rawProjects ? JSON.parse(rawProjects) : [];
      const overdue = projects.filter((p: any) => p.status !== "completed" && p.end_date && new Date(p.end_date) < new Date());
      const delayed = projects.filter((p: any) => p.delay_reason);

      if (overdue.length > 0) {
        list.push({
          id: "projects-overdue",
          type: "danger",
          title: "Dự án quá hạn hoàn thành",
          description: `Có ${overdue.length} dự án đã qua ngày kết thúc kế hoạch nhưng chưa chuyển trạng thái hoàn thành.`,
        });
      }

      if (delayed.length > 0) {
        delayed.forEach((p: any) => {
          list.push({
            id: `proj-delay-${p.id}`,
            type: "warning",
            title: `Dự án chậm tiến độ: ${p.name}`,
            description: `Điểm nghẽn: ${p.delay_reason}`,
          });
        });
      }
    } catch (e) {
      console.error(e);
    }

    // 5. Low Stock Alert
    if (stats?.lowStockCount && stats.lowStockCount > 0) {
      list.push({
        id: "low-stock",
        type: "warning",
        title: "Tồn kho nguyên vật liệu dưới mức tối thiểu",
        description: `Có ${stats.lowStockCount} vật tư/thành phẩm cần nhập kho gấp để tránh dừng sản xuất.`,
      });
    }

    return list;
  }, [stats]);

  if (alerts.length === 0) {
    return (
      <Card className="border border-green-200 bg-green-50/50 shadow-xs">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 text-green-700">
            <ShieldAlert className="h-5 w-5 stroke-[2] shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Hệ thống an toàn</h3>
              <p className="text-xs text-green-600/90 mt-0.5">Không phát hiện rủi ro hoặc cảnh báo tài chính vượt ngưỡng.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-red-200/80 shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700">
          <ShieldAlert className="h-5 w-5 text-red-600 stroke-[2] animate-pulse" />
          Cảnh báo Quản trị & Rủi ro Vận hành
        </CardTitle>
        <Badge variant="destructive" className="px-1.5 py-0.2 text-[10px]">
          {alerts.length} rủi ro
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[300px] overflow-y-auto px-4 pb-4 space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border text-xs leading-relaxed ${
                alert.type === "danger"
                  ? "bg-red-50 border-red-100 text-red-800"
                  : "bg-yellow-50/70 border-yellow-100/90 text-yellow-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {alert.type === "danger" ? (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-foreground">{alert.title}</div>
                  <div className="text-muted-foreground mt-0.5 text-[11px] leading-tight">{alert.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

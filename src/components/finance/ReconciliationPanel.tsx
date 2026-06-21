import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { Scale, Loader2, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

interface ReconciliationItem {
  order_number: string;
  order_id: string;
  order_total: number;
  paid_amount: number;
  difference: number;
  status: "matched" | "underpaid" | "overpaid" | "unpaid";
  partner_name: string;
}

export function ReconciliationPanel() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runReconciliation = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      let ordersList: any[] = [];
      const paymentMap = new Map<string, number>();

      if (isLocalDemoAuthEnabled()) {
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        const allOrders = rawOrders ? JSON.parse(rawOrders) : [];
        
        ordersList = allOrders
          .filter((o: any) => ["delivered", "confirmed", "shipping"].includes(o.status))
          .map((o: any) => {
            const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
            const partnersList = rawPartners ? JSON.parse(rawPartners) : [];
            const partner = partnersList.find((p: any) => p.id === o.partner_id);
            return {
              ...o,
              partners: partner ? { name: partner.name } : null
            };
          });

        const rawTransactions = localStorage.getItem("erp-mini-local-demo-payment-transactions");
        const txList = rawTransactions ? JSON.parse(rawTransactions) : [];
        for (const t of txList) {
          if (!t.order_id) continue;
          const current = paymentMap.get(t.order_id) || 0;
          if (t.transaction_type === "payment_in") {
            paymentMap.set(t.order_id, current + (t.amount || 0));
          }
        }
      } else {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, order_number, total, paid_amount, partners(name)")
          .eq("company_id", companyId)
          .in("status", ["delivered", "confirmed", "shipping"])
          .order("created_at", { ascending: false })
          .limit(100);

        if (!orders) { setItems([]); return; }
        ordersList = orders;

        const orderIds = ordersList.map((o: any) => o.id);
        const { data: payments } = await supabase
          .from("payment_transactions")
          .select("order_id, amount, transaction_type")
          .in("order_id", orderIds.length > 0 ? orderIds : ["__none__"]);

        for (const p of payments || []) {
          if (!p.order_id) continue;
          const current = paymentMap.get(p.order_id) || 0;
          if (p.transaction_type === "payment_in") {
            paymentMap.set(p.order_id, current + (p.amount || 0));
          }
        }
      }

      const results: ReconciliationItem[] = ordersList.map((order: any) => {
        const total = order.total || 0;
        const paid = paymentMap.get(order.id) ?? (order.paid_amount || 0);
        const diff = paid - total;
        let status: ReconciliationItem["status"] = "matched";
        if (paid === 0 && total > 0) status = "unpaid";
        else if (diff < -1) status = "underpaid";
        else if (diff > 1) status = "overpaid";

        return {
          order_number: order.order_number,
          order_id: order.id,
          order_total: total,
          paid_amount: paid,
          difference: diff,
          status,
          partner_name: order.partners?.name || "N/A",
        };
      });

      // Sort: issues first
      results.sort((a, b) => {
        const order = { unpaid: 0, underpaid: 1, overpaid: 2, matched: 3 };
        return order[a.status] - order[b.status];
      });

      setItems(results);
      setHasRun(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể đối soát." });
    } finally {
      setIsLoading(false);
    }
  };

  const statusIcons = {
    matched: <CheckCircle2 className="h-4 w-4 text-success" />,
    underpaid: <AlertTriangle className="h-4 w-4 text-warning" />,
    overpaid: <AlertTriangle className="h-4 w-4 text-info" />,
    unpaid: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const statusLabels = {
    matched: "Khớp",
    underpaid: "Thiếu",
    overpaid: "Thừa",
    unpaid: "Chưa TT",
  };

  const statusColors = {
    matched: "bg-success/10 text-success",
    underpaid: "bg-warning/10 text-warning",
    overpaid: "bg-info/10 text-info",
    unpaid: "bg-destructive/10 text-destructive",
  };

  const issues = items.filter(i => i.status !== "matched");
  const formatCurrency = (v: number) => v.toLocaleString("vi-VN");

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Đối soát Thanh toán
        </CardTitle>
        <Button variant="outline" size="sm" onClick={runReconciliation} disabled={isLoading} className="gap-1">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Đối soát
        </Button>
      </CardHeader>
      <CardContent>
        {!hasRun && !isLoading && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Nhấn "Đối soát" để kiểm tra thanh toán vs đơn hàng
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {hasRun && !isLoading && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-success/10 text-success gap-1">
                ✓ {items.filter(i => i.status === "matched").length} khớp
              </Badge>
              {issues.length > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive gap-1">
                  ⚠ {issues.length} cần xử lý
                </Badge>
              )}
            </div>

            {/* Issues list */}
            {issues.length === 0 ? (
              <p className="text-sm text-success text-center py-4">✅ Tất cả đơn hàng đã khớp thanh toán!</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {issues.slice(0, 15).map((item) => (
                  <div key={item.order_id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {statusIcons[item.status]}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.order_number}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.partner_name}</p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <Badge variant="outline" className={cn("text-xs mb-1", statusColors[item.status])}>
                        {statusLabels[item.status]}
                      </Badge>
                      <p className="text-xs">
                        <span className="text-muted-foreground">{formatCurrency(item.paid_amount)}đ</span>
                        {" / "}
                        <span className="font-medium">{formatCurrency(item.order_total)}đ</span>
                      </p>
                      {item.difference !== 0 && (
                        <p className={cn("text-xs font-semibold", item.difference < 0 ? "text-destructive" : "text-info")}>
                          {item.difference > 0 ? "+" : ""}{formatCurrency(item.difference)}đ
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

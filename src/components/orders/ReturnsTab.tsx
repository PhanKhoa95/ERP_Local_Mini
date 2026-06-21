import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Loader2 } from "lucide-react";
import { useOrderReturns } from "@/hooks/useOrderReturns";

const statusLabels: Record<string, string> = {
  requested: "Yêu cầu",
  approved: "Đã duyệt",
  receiving: "Đang nhận",
  received: "Đã nhận",
  refunded: "Đã hoàn tiền",
  rejected: "Từ chối",
};

const statusColors: Record<string, string> = {
  requested: "bg-warning/10 text-warning",
  approved: "bg-info/10 text-info",
  receiving: "bg-primary/10 text-primary",
  received: "bg-success/10 text-success",
  refunded: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const platformLabels: Record<string, string> = {
  manual: "Thủ công",
  shopee: "Shopee",
  lazada: "Lazada",
  tiktok: "TikTok",
};

export function ReturnsTab() {
  const { returns, isLoading, updateReturnStatus } = useOrderReturns();
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const filtered = returns.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (platformFilter !== "all" && r.platform_source !== platformFilter) return false;
    return true;
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Quản lý trả hàng ({returns.length})
          </CardTitle>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Nguồn" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(platformLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có đơn trả hàng nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ret: any) => (
              <div key={ret.id} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">
                      Đơn #{ret.orders?.order_number || "N/A"}
                    </span>
                    <Badge variant="outline">
                      {platformLabels[ret.platform_source] || ret.platform_source}
                    </Badge>
                    <Badge className={statusColors[ret.status]}>
                      {statusLabels[ret.status] || ret.status}
                    </Badge>
                  </div>
                  <span className="font-semibold text-primary">
                    {Number(ret.refund_amount || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {ret.reason && (
                  <p className="text-sm text-muted-foreground mb-2">Lý do: {ret.reason}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(ret.created_at).toLocaleString("vi-VN")}
                    {ret.orders?.partners?.name && ` • ${ret.orders.partners.name}`}
                  </span>
                  {ret.status === "requested" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReturnStatus.mutate({ id: ret.id, status: "rejected" })}
                      >
                        Từ chối
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateReturnStatus.mutate({ id: ret.id, status: "approved" })}
                      >
                        Duyệt
                      </Button>
                    </div>
                  )}
                  {ret.status === "approved" && (
                    <Button
                      size="sm"
                      onClick={() => updateReturnStatus.mutate({ id: ret.id, status: "received" })}
                    >
                      Đã nhận hàng
                    </Button>
                  )}
                  {ret.status === "received" && (
                    <Button
                      size="sm"
                      onClick={() => updateReturnStatus.mutate({ id: ret.id, status: "refunded" })}
                    >
                      Hoàn tiền
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

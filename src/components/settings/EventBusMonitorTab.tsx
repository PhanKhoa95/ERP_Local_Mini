import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Users,
} from "lucide-react";
import { erpEventBus, type EventBusLogEntry } from "@/lib/erpEventBus";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const PAGE_SIZE = 15;

const statusConfig = {
  success: { label: "Thành công", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  partial: { label: "Một phần lỗi", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  error: { label: "Lỗi", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

const eventConfig: Record<string, { label: string; color: string }> = {
  ORDER_CREATED: { label: "Tạo đơn hàng", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  PAYMENT_RECORDED: { label: "Ghi thanh toán", color: "bg-green-500/20 text-green-700 dark:text-green-300" },
  CONTRACT_SIGNED: { label: "Ký hợp đồng", color: "bg-purple-500/20 text-purple-700 dark:text-purple-300" },
};

export function EventBusMonitorTab() {
  const [logs, setLogs] = useState<EventBusLogEntry[]>([]);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [subscriberInfo, setSubscriberInfo] = useState<Record<string, string[]>>({});

  const refreshLogs = () => {
    setLogs(erpEventBus.getPersistedLogs());
    setSubscriberInfo(erpEventBus.getSubscriberInfo());
  };

  useEffect(() => {
    refreshLogs();
    // Auto-refresh every 3s
    const interval = setInterval(refreshLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = logs.filter((log) => {
    if (eventFilter !== "all" && log.event !== eventFilter) return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === "success").length,
    partial: logs.filter(l => l.status === "partial").length,
    error: logs.filter(l => l.status === "error").length,
  };

  const handleClearLogs = () => {
    erpEventBus.clearLogs();
    refreshLogs();
    setPage(0);
  };

  const totalSubscribers = Object.values(subscriberInfo).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 bg-secondary/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Tổng sự kiện</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Thành công</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{stats.success}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Một phần lỗi</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.partial}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Lỗi</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{stats.error}</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Subscribers đang đăng ký ({totalSubscribers})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            {Object.entries(subscriberInfo).map(([event, subs]) => (
              <div key={event} className="text-xs">
                <Badge variant="outline" className={eventConfig[event]?.color || ""}>
                  {eventConfig[event]?.label || event}
                </Badge>
                <span className="ml-1 text-muted-foreground">
                  → {subs.join(", ")}
                </span>
              </div>
            ))}
            {totalSubscribers === 0 && (
              <p className="text-xs text-muted-foreground">Chưa có subscriber nào đăng ký</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nhật ký Event Bus</CardTitle>
              <CardDescription>Theo dõi sự kiện đồng bộ liên phân hệ</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshLogs}>
                <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearLogs} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Xóa log
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={eventFilter} onValueChange={(v) => { setEventFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Loại sự kiện" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sự kiện</SelectItem>
                <SelectItem value="ORDER_CREATED">Tạo đơn hàng</SelectItem>
                <SelectItem value="PAYMENT_RECORDED">Thanh toán</SelectItem>
                <SelectItem value="CONTRACT_SIGNED">Hợp đồng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
                <SelectItem value="partial">Một phần lỗi</SelectItem>
                <SelectItem value="error">Lỗi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {paginated.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Chưa có sự kiện nào</p>
                <p className="text-xs mt-1">Thử tạo đơn hàng hoặc ghi nhận thanh toán</p>
              </div>
            ) : (
              paginated.map((log) => {
                const sc = statusConfig[log.status];
                const StatusIcon = sc.icon;
                const ec = eventConfig[log.event];
                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`h-10 w-10 rounded-lg ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`h-5 w-5 ${sc.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={ec?.color || ""}>{ec?.label || log.event}</Badge>
                        <Badge variant="outline" className={sc.color}>
                          {sc.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.duration_ms}ms
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mb-1 truncate">
                        {log.payload_summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                        </span>
                        <span>
                          Subscribers: {log.subscribers_ok}/{log.subscribers_total} OK
                        </span>
                        {log.subscribers_failed > 0 && (
                          <span className="text-red-500">
                            {log.subscribers_failed} lỗi
                          </span>
                        )}
                      </div>
                      {log.errors.length > 0 && (
                        <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                          <p className="text-xs font-medium text-red-600 mb-1">Chi tiết lỗi:</p>
                          {log.errors.map((err, i) => (
                            <p key={i} className="text-xs text-red-500 font-mono break-all">
                              {err}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {filtered.length} kết quả · Trang {page + 1}/{totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

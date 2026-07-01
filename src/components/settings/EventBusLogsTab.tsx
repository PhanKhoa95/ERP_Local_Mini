import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Trash2, Code, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { erpEventBus } from "@/lib/erpEventBus";
import { format } from "date-fns";

interface EventLog {
  id: string;
  timestamp: string;
  event: string;
  payload: any;
  status: "success" | "error";
  subscribersCount: number;
}

export function EventBusLogsTab() {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    // Read from window object initially
    const fetchLogs = () => {
      const windowLogs = (window as any).__erpEventBusLogs || [];
      setLogs([...windowLogs]);
    };

    fetchLogs();

    // Poll logs every 1 second to keep it reactive in real-time
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = () => {
    if (typeof window !== "undefined") {
      (window as any).__erpEventBusLogs = [];
      setLogs([]);
    }
  };

  const handleTestEvent = () => {
    // Publish a dummy test event to show reactivity
    erpEventBus.publish("PAYMENT_RECORDED", {
      transaction: {
        id: `tx-test-${Date.now()}`,
        amount: 50000,
        transaction_type: "payment_in",
        payment_method: "cash",
        company_id: "local-demo-company",
        notes: "Giao dịch kiểm thử Event Bus thời gian thực ⚡"
      }
    } as any);
  };

  const getEventBadgeColor = (event: string) => {
    switch (event) {
      case "ORDER_CREATED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "PAYMENT_RECORDED":
        return "bg-sky-500/10 text-sky-500 border-sky-500/20";
      case "CONTRACT_SIGNED":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning animate-pulse" />
            Nhật ký Event Bus (Local)
          </CardTitle>
          <CardDescription>
            Theo dõi các sự kiện đồng bộ dữ liệu thời gian thực được phát ra bởi hệ thống ERP Local
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleTestEvent} className="h-9 gap-1 text-xs">
            <Play className="h-3 w-3" />
            Gửi Sự Kiện Test
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearLogs} 
            disabled={logs.length === 0}
            className="h-9 gap-1 text-xs"
          >
            <Trash2 className="h-3 w-3" />
            Xóa Nhật Ký
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/80 rounded-xl bg-secondary/5">
            <Zap className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Chưa có sự kiện nào được ghi nhận</p>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs text-center">
              Các sự kiện khi tạo đơn hàng POS mới, thanh toán, hoặc ký hợp đồng sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="border border-border/60 rounded-xl bg-secondary/10 overflow-hidden hover:border-border transition-colors"
              >
                {/* Log Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {format(new Date(log.timestamp), "HH:mm:ss dd/MM/yyyy")}
                    </span>
                    <Badge variant="outline" className={getEventBadgeColor(log.event)}>
                      {log.event}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({log.subscribersCount} bộ lắng nghe)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {log.status === "success" ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 py-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Thành công
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 py-0.5">
                        <AlertCircle className="h-3 w-3" />
                        Lỗi
                      </Badge>
                    )}
                    <Code className="h-4 w-4 text-muted-foreground/80" />
                  </div>
                </div>

                {/* Log Payload Expanded Area */}
                {expandedLog === log.id && (
                  <div className="border-t border-border/60 bg-background/50 p-4 font-mono text-xs overflow-auto max-h-96">
                    <pre className="text-foreground/90 whitespace-pre-wrap">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

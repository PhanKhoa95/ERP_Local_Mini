import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye, Bot, Clock } from "lucide-react";
import { AgentLogViewer } from "./AgentLogViewer";

interface WorkflowLog {
  id: string;
  workflow_id: string;
  trigger_data: any;
  execution_log: any;
  status: string;
  started_at: string;
  finished_at: string | null;
  node_executions?: any;
  waiting_for_approval?: boolean;
}

interface WorkflowLogsPanelProps {
  logs: WorkflowLog[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  waiting: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const statusLabels: Record<string, string> = {
  success: "Thành công",
  failed: "Lỗi",
  running: "Đang chạy",
  waiting: "Chờ duyệt",
};

export function WorkflowLogsPanel({ logs, isLoading }: WorkflowLogsPanelProps) {
  const [selectedExecs, setSelectedExecs] = useState<any[] | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Đang tải...</div>;
  if (logs.length === 0) return <div className="text-sm text-muted-foreground p-4 text-center">Chưa có lịch sử chạy</div>;

  return (
    <>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{format(new Date(log.started_at), "dd/MM/yyyy HH:mm:ss")}</span>
              <div className="flex items-center gap-2">
                {log.waiting_for_approval && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 dark:bg-yellow-900/20">
                    <Clock className="h-3 w-3 mr-1" /> Chờ phê duyệt
                  </Badge>
                )}
                <Badge variant="outline" className={statusColors[log.status] || ""}>
                  {statusLabels[log.status] || log.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {log.node_executions && log.node_executions.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {log.node_executions.length} nodes thực thi
                  </span>
                )}
                {log.node_executions?.some((n: any) => n.ai_reasoning) && (
                  <Badge variant="secondary" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" /> AI
                  </Badge>
                )}
              </div>

              {log.node_executions && log.node_executions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedExecs(log.node_executions || [])}
                >
                  <Eye className="h-3 w-3 mr-1" /> Chi tiết
                </Button>
              )}
            </div>

            {log.finished_at && (
              <div className="text-xs text-muted-foreground">
                Hoàn thành: {format(new Date(log.finished_at), "HH:mm:ss")}
              </div>
            )}
          </div>
        ))}
      </div>

      <AgentLogViewer
        executions={selectedExecs || []}
        open={!!selectedExecs}
        onOpenChange={(open) => { if (!open) setSelectedExecs(null); }}
      />
    </>
  );
}

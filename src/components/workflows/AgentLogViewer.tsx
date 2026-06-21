import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Eye } from "lucide-react";

interface NodeExecution {
  node_id: string;
  node_type: string;
  status: string;
  input: any;
  output: any;
  ai_reasoning?: string;
  duration_ms: number;
}

interface AgentLogViewerProps {
  executions: NodeExecution[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  success: { icon: CheckCircle, color: "text-green-500", label: "Thành công" },
  failed: { icon: XCircle, color: "text-red-500", label: "Lỗi" },
  waiting: { icon: Clock, color: "text-yellow-500", label: "Đang chờ" },
  skipped: { icon: AlertTriangle, color: "text-muted-foreground", label: "Bỏ qua" },
};

export function AgentLogViewer({ executions, open, onOpenChange }: AgentLogViewerProps) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Chi tiết thực thi Workflow
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2 pr-4">
            {executions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu thực thi</p>
            )}

            {executions.map((exec, i) => {
              const config = statusConfig[exec.status] || statusConfig.success;
              const StatusIcon = config.icon;
              const isExpanded = expandedNode === exec.node_id;

              return (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setExpandedNode(isExpanded ? null : exec.node_id)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
                      <StatusIcon className={`h-4 w-4 shrink-0 ${config.color}`} />
                      <span className="text-sm font-medium truncate">
                        {exec.node_id}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {exec.node_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{exec.duration_ms}ms</span>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-3 py-3 space-y-3 bg-muted/20">
                      {exec.ai_reasoning && (
                        <div>
                          <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                            <Bot className="h-3 w-3" /> AI Reasoning
                          </p>
                          <pre className="text-xs bg-background border rounded p-2 whitespace-pre-wrap max-h-40 overflow-auto">
                            {typeof exec.ai_reasoning === "string" 
                              ? exec.ai_reasoning 
                              : JSON.stringify(exec.ai_reasoning, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                          <pre className="text-xs bg-background border rounded p-2 whitespace-pre-wrap max-h-32 overflow-auto">
                            {JSON.stringify(exec.input, null, 2)?.substring(0, 500)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                          <pre className="text-xs bg-background border rounded p-2 whitespace-pre-wrap max-h-32 overflow-auto">
                            {JSON.stringify(exec.output, null, 2)?.substring(0, 500)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

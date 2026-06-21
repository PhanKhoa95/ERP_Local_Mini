import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock, AlertTriangle, CheckCircle2, FileText, Send, GitBranch, Loader2,
  ChevronDown, ChevronUp, User, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectiveTask } from "@/hooks/useDirectiveDashboard";

interface DirectiveProgressCardProps {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  escalationCount: number;
  assignedManagerName?: string | null;
  tasks?: DirectiveTask[];
  onDispatch?: (id: string) => void;
  onBreakdownWbs?: (id: string) => void;
  isDispatching?: boolean;
  isBreakingDown?: boolean;
}

const statusMap: Record<string, { label: string; className: string; icon: any }> = {
  draft: { label: "Nháp", className: "bg-muted text-muted-foreground", icon: FileText },
  dispatched: { label: "Đã phân phối", className: "bg-primary/10 text-primary", icon: Send },
  in_progress: { label: "Đang thực hiện", className: "bg-accent text-accent-foreground", icon: Clock },
  completed: { label: "Hoàn thành", className: "bg-success/10 text-success", icon: CheckCircle2 },
};

const taskStatusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  accepted: "bg-primary/10 text-primary",
  in_progress: "bg-accent text-accent-foreground",
  done: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export function DirectiveProgressCard({
  id, title, status, deadline, totalTasks, completedTasks, overdueTasks, escalationCount,
  assignedManagerName, tasks = [],
  onDispatch, onBreakdownWbs, isDispatching, isBreakingDown,
}: DirectiveProgressCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusMap[status] || statusMap.draft;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const showDispatch = status === "draft" && onDispatch;
  const showWbs = (status === "draft" || status === "dispatched") && onBreakdownWbs;
  const hasTasks = tasks.length > 0;

  return (
    <div className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold truncate flex-1">{title}</h4>
        <Badge variant="outline" className={cn("text-xs shrink-0", cfg.className)}>
          {cfg.label}
        </Badge>
      </div>

      {/* Manager assignment */}
      {assignedManagerName && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>Quản lý: <span className="font-medium text-foreground">{assignedManagerName}</span></span>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedTasks}/{totalTasks} việc</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        {deadline && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(deadline).toLocaleDateString("vi-VN")}
          </span>
        )}
        {overdueTasks > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {overdueTasks} quá hạn
          </span>
        )}
        {escalationCount > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            Nhắc {escalationCount}x
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {showDispatch && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => onDispatch(id)}
            disabled={isDispatching}
          >
            {isDispatching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Phân phối
          </Button>
        )}
        {showWbs && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={() => onBreakdownWbs(id)}
            disabled={isBreakingDown}
          >
            {isBreakingDown ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitBranch className="h-3 w-3" />}
            Chia WBS
          </Button>
        )}
        {hasTasks && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 ml-auto"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Thu gọn" : `Xem ${tasks.length} task`}
          </Button>
        )}
      </div>

      {/* Expandable task list */}
      {expanded && hasTasks && (
        <div className="space-y-1.5 pt-2 border-t">
          {tasks.map((t) => {
            const isOverdue = t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < new Date();
            return (
              <div
                key={t.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg text-xs",
                  isOverdue ? "bg-destructive/5 border border-destructive/20" : "bg-muted/40"
                )}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium truncate">{t.title}</span>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", taskStatusColors[t.status] || "")}>
                      {t.status === "done" ? "Xong" : t.status === "in_progress" ? "Đang làm" : t.status === "pending" ? "Chờ" : t.status === "accepted" ? "Đã nhận" : t.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                    {t.assignee_name ? (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {t.assignee_name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive">
                        <User className="h-3 w-3" />
                        Chưa giao
                      </span>
                    )}
                    {t.assignee_org_unit && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {t.assignee_org_unit}
                      </span>
                    )}
                    {t.due_date && (
                      <span className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
                        <Clock className="h-3 w-3" />
                        {new Date(t.due_date).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                    {t.priority !== "normal" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {t.priority === "urgent" ? "🔴 Gấp" : t.priority === "high" ? "🟠 Cao" : t.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

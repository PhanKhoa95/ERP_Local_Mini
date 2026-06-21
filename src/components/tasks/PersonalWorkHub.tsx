import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { useWorkReportDraft } from "@/hooks/useWorkReportDraft";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";
import { 
  CheckCircle2, Clock, PlayCircle, FileText, 
  Plus, ArrowRight, Flame, ListTodo
} from "lucide-react";
import { Link } from "react-router-dom";
import { isPast } from "date-fns";

export function PersonalWorkHub() {
  const { employee } = usePerformanceEmployee();
  const { myTasks } = useTasks();
  const { stats } = useWorkReportDraft();

  const allTasks = myTasks || [];
  const pendingCount = allTasks.filter(t => t.status === "pending" || t.status === "accepted").length;
  const inProgressCount = allTasks.filter(t => t.status === "in_progress").length;
  const todayDone = allTasks.filter(t => {
    if (t.status !== "done" || !t.completed_at) return false;
    return t.completed_at.split("T")[0] === new Date().toISOString().split("T")[0];
  }).length;
  const overdueCount = allTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done").length;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary" />
            Công việc hôm nay
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/work-report" className="gap-1 text-muted-foreground hover:text-foreground">
              Báo cáo <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-muted-foreground">{pendingCount}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> Chờ
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-warning">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <PlayCircle className="h-3 w-3" /> Đang làm
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-success">{todayDone}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Xong
            </div>
          </div>
          <div>
            <div className={`text-lg font-bold ${overdueCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>{overdueCount}</div>
            <div className="text-xs text-muted-foreground">Quá hạn</div>
          </div>
        </div>

        {/* Draft report status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm">Draft báo cáo</span>
          </div>
          <Badge variant={stats.total > 0 ? "default" : "secondary"}>
            {stats.total} việc
          </Badge>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
            <Link to="/performance/kpi">
              <Plus className="h-3.5 w-3.5" /> Tasks
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
            <Link to="/work-report">
              <FileText className="h-3.5 w-3.5" /> Báo cáo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

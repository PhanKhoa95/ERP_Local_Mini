import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Circle,
  AlertTriangle,
  TrendingUp,
  Package,
  DollarSign,
  Target,
  Calendar
} from "lucide-react";
import { useWorkReports, WorkReport } from "@/hooks/useWorkReports";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface WeeklyReportFormProps {
  report: WorkReport;
}

interface TaskItem {
  id: string;
  text: string;
  completed?: boolean;
  priority?: "high" | "medium" | "low";
}

interface WeeklyGoal {
  id: string;
  goal: string;
  achieved: boolean;
  progress: number;
}

export function WeeklyReportForm({ report }: WeeklyReportFormProps) {
  const { updateReport, submitReport, calculateAutoMetrics } = useWorkReports();
  const [summary, setSummary] = useState(report.summary || "");
  const [completedTasks, setCompletedTasks] = useState<TaskItem[]>(
    report.completed_tasks?.length ? report.completed_tasks : []
  );
  const [pendingTasks, setPendingTasks] = useState<TaskItem[]>(
    report.pending_tasks?.length ? report.pending_tasks : []
  );
  const [blockers, setBlockers] = useState<TaskItem[]>(
    report.blockers?.length ? report.blockers : []
  );
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [newTask, setNewTask] = useState({ completed: "", pending: "", blocker: "", goal: "" });
  const [autoMetrics, setAutoMetrics] = useState<any>(report.auto_metrics || {});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (report.period_start && report.period_end) {
      const loadMetrics = async () => {
        const metrics = await calculateAutoMetrics(report.period_start!, report.period_end!);
        setAutoMetrics(metrics);
      };
      loadMetrics();
    }
  }, [report.period_start, report.period_end]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateReport.mutateAsync({
        id: report.id,
        summary,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        blockers,
        auto_metrics: { ...autoMetrics, weekly_goals: weeklyGoals },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    await handleSave();
    await submitReport.mutateAsync(report.id);
  };

  const addTask = (type: "completed" | "pending" | "blocker") => {
    const text = newTask[type];
    if (!text.trim()) return;
    
    const item: TaskItem = { id: crypto.randomUUID(), text: text.trim() };
    
    if (type === "completed") {
      setCompletedTasks([...completedTasks, { ...item, completed: true }]);
    } else if (type === "pending") {
      setPendingTasks([...pendingTasks, item]);
    } else {
      setBlockers([...blockers, item]);
    }
    
    setNewTask({ ...newTask, [type]: "" });
  };

  const addGoal = () => {
    if (!newTask.goal.trim()) return;
    setWeeklyGoals([...weeklyGoals, {
      id: crypto.randomUUID(),
      goal: newTask.goal.trim(),
      achieved: false,
      progress: 0,
    }]);
    setNewTask({ ...newTask, goal: "" });
  };

  const updateGoalProgress = (id: string, progress: number) => {
    setWeeklyGoals(weeklyGoals.map(g => 
      g.id === id ? { ...g, progress, achieved: progress >= 100 } : g
    ));
  };

  const removeTask = (type: "completed" | "pending" | "blocker", id: string) => {
    if (type === "completed") {
      setCompletedTasks(completedTasks.filter(t => t.id !== id));
    } else if (type === "pending") {
      setPendingTasks(pendingTasks.filter(t => t.id !== id));
    } else {
      setBlockers(blockers.filter(t => t.id !== id));
    }
  };

  const isEditable = report.status === "draft" || report.status === "rejected";

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Báo cáo tuần
              </CardTitle>
              <CardDescription>
                {report.period_start && report.period_end && (
                  <>
                    {format(parseISO(report.period_start), "dd/MM", { locale: vi })} - {format(parseISO(report.period_end), "dd/MM/yyyy", { locale: vi })}
                  </>
                )}
              </CardDescription>
            </div>
            <Badge variant={report.status === "approved" ? "default" : "secondary"}>
              {report.status === "draft" && "Bản nháp"}
              {report.status === "submitted" && "Đã gửi"}
              {report.status === "approved" && "Đã duyệt"}
              {report.status === "rejected" && "Từ chối"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Auto Metrics */}
      {Object.keys(autoMetrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Số liệu tuần (tự động)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tổng đơn</p>
                  <p className="font-semibold">{autoMetrics.total_orders || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Hoàn thành</p>
                  <p className="font-semibold">{autoMetrics.completed_orders || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Doanh thu</p>
                  <p className="font-semibold">
                    {(autoMetrics.total_revenue || 0).toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tỷ lệ chốt</p>
                  <p className="font-semibold">{autoMetrics.conversion_rate || 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Mục tiêu tuần ({weeklyGoals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {weeklyGoals.map((goal) => (
            <div key={goal.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className={goal.achieved ? "line-through text-muted-foreground" : ""}>
                  {goal.goal}
                </span>
                {goal.achieved && (
                  <Badge className="bg-green-100 text-green-700">Hoàn thành</Badge>
                )}
              </div>
              {isEditable && (
                <div className="flex items-center gap-3">
                  <Progress value={goal.progress} className="flex-1 h-2" />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={goal.progress}
                    onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
          ))}
          
          {isEditable && (
            <div className="flex gap-2">
              <Input
                placeholder="Thêm mục tiêu tuần..."
                value={newTask.goal}
                onChange={(e) => setNewTask({ ...newTask, goal: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
              />
              <Button onClick={addGoal} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tổng kết tuần</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Mô tả tổng quan công việc trong tuần, thành tựu nổi bật, bài học rút ra..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={!isEditable}
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Công việc hoàn thành ({completedTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="flex-1">{task.text}</span>
              {isEditable && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => removeTask("completed", task.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          
          {isEditable && (
            <div className="flex gap-2">
              <Input
                placeholder="Thêm công việc đã hoàn thành..."
                value={newTask.completed}
                onChange={(e) => setNewTask({ ...newTask, completed: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addTask("completed")}
              />
              <Button onClick={() => addTask("completed")} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Circle className="h-4 w-4 text-blue-500" />
            Công việc chuyển tuần sau ({pendingTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
              <Circle className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="flex-1">{task.text}</span>
              {isEditable && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => removeTask("pending", task.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          
          {isEditable && (
            <div className="flex gap-2">
              <Input
                placeholder="Công việc cần làm tuần sau..."
                value={newTask.pending}
                onChange={(e) => setNewTask({ ...newTask, pending: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addTask("pending")}
              />
              <Button onClick={() => addTask("pending")} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blockers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Vấn đề / Cần hỗ trợ ({blockers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {blockers.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
              <span className="flex-1">{task.text}</span>
              {isEditable && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => removeTask("blocker", task.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          
          {isEditable && (
            <div className="flex gap-2">
              <Input
                placeholder="Thêm vấn đề cần hỗ trợ..."
                value={newTask.blocker}
                onChange={(e) => setNewTask({ ...newTask, blocker: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addTask("blocker")}
              />
              <Button onClick={() => addTask("blocker")} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {isEditable && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Đang lưu..." : "Lưu nháp"}
          </Button>
          <Button onClick={handleSubmit} disabled={submitReport.isPending}>
            <Send className="h-4 w-4 mr-2" />
            Gửi báo cáo
          </Button>
        </div>
      )}

      {/* Review Comment */}
      {report.review_comment && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base">Nhận xét từ quản lý</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{report.review_comment}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

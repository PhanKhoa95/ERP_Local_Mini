import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
  Percent,
  AlertCircle,
  Box,
  Download,
  Sparkles,
  Loader2
} from "lucide-react";
import { useWorkReports, WorkReport } from "@/hooks/useWorkReports";
import { useOperationsMetrics } from "@/hooks/useOperationsMetrics";
import { useReportClassifier } from "@/hooks/useReportClassifier";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { WbsCheckPanel } from "./WbsCheckPanel";

interface DailyReportFormProps {
  report: WorkReport;
}

interface TaskItem {
  id: string;
  text: string;
  completed?: boolean;
}

export function DailyReportForm({ report }: DailyReportFormProps) {
  const { updateReport, submitReport, calculateAutoMetrics } = useWorkReports();
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();
  const { result: wbsResult, classify, acceptSuggestion, clearResult, isClassifying } = useReportClassifier();
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
  const [newTask, setNewTask] = useState({ completed: "", pending: "", blocker: "" });
  const [autoMetrics, setAutoMetrics] = useState<any>(report.auto_metrics || {});
  const [metricsTab, setMetricsTab] = useState<"sales" | "operations">("sales");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch operations metrics
  const { data: opsMetrics } = useOperationsMetrics(report.report_date, report.report_date);

  useEffect(() => {
    const loadMetrics = async () => {
      const salesMetrics = await calculateAutoMetrics(report.report_date, report.report_date);
      setAutoMetrics((prev: any) => ({ ...prev, sales: salesMetrics }));
    };
    loadMetrics();
  }, [report.report_date]);

  useEffect(() => {
    if (opsMetrics) {
      setAutoMetrics((prev: any) => ({ ...prev, operations: opsMetrics }));
    }
  }, [opsMetrics]);

  // Auto-import completed tasks from tasks table
  const handleImportTasks = async () => {
    if (!employee?.id) { toast.error("Không tìm thấy thông tin nhân viên"); return; }
    const reportDate = report.report_date;
    const startOfDay = `${reportDate}T00:00:00`;
    const endOfDay = `${reportDate}T23:59:59`;
    
    const { data: doneTasks, error } = await supabase
      .from("tasks")
      .select("id, title")
      .or(`assigned_to.eq.${employee.user_id},created_by.eq.${employee.user_id}`)
      .eq("status", "done")
      .gte("updated_at", startOfDay)
      .lte("updated_at", endOfDay);

    if (error) { toast.error("Lỗi tải tasks"); return; }
    if (!doneTasks?.length) { toast.info("Không có task nào hoàn thành trong ngày này"); return; }

    const existingTexts = new Set(completedTasks.map(t => t.text));
    const newItems = doneTasks
      .filter(t => !existingTexts.has(t.title))
      .map(t => ({ id: crypto.randomUUID(), text: t.title, completed: true }));

    if (newItems.length === 0) { toast.info("Tất cả tasks đã có trong báo cáo"); return; }
    setCompletedTasks(prev => [...prev, ...newItems]);
    toast.success(`Đã thêm ${newItems.length} task từ hệ thống`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateReport.mutateAsync({
        id: report.id,
        summary,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        blockers,
        auto_metrics: autoMetrics,
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
              <CardTitle>
                Báo cáo ngày {format(new Date(report.report_date), "dd/MM/yyyy", { locale: vi })}
              </CardTitle>
              <CardDescription>
                {format(new Date(report.report_date), "EEEE", { locale: vi })}
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

      {/* Auto Metrics from Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Số liệu tự động (từ hệ thống)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={metricsTab} onValueChange={(v) => setMetricsTab(v as "sales" | "operations")}>
            <TabsList className="mb-4">
              <TabsTrigger value="sales">
                <DollarSign className="h-4 w-4 mr-1" />
                Kinh doanh
              </TabsTrigger>
              <TabsTrigger value="operations">
                <Box className="h-4 w-4 mr-1" />
                Vận hành
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn hàng</p>
                    <p className="font-semibold">{autoMetrics.sales?.total_orders || autoMetrics.total_orders || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hoàn thành</p>
                    <p className="font-semibold">{autoMetrics.sales?.completed_orders || autoMetrics.completed_orders || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Doanh thu</p>
                    <p className="font-semibold">
                      {(autoMetrics.sales?.total_revenue || autoMetrics.total_revenue || 0).toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Percent className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tỷ lệ chốt</p>
                    <p className="font-semibold">{autoMetrics.sales?.conversion_rate || autoMetrics.conversion_rate || 0}%</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="operations">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn xử lý</p>
                    <p className="font-semibold">{autoMetrics.operations?.total_orders_processed || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Đúng hạn</p>
                    <p className="font-semibold">{autoMetrics.operations?.on_time_rate || 0}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Chất lượng</p>
                    <p className="font-semibold">{autoMetrics.operations?.quality_rate || 0}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tồn kho thấp</p>
                    <p className="font-semibold">{autoMetrics.operations?.low_stock_items || 0}</p>
                  </div>
                </div>
              </div>

              {/* Additional Operations Metrics */}
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Cập nhật kho</p>
                  <p className="font-semibold text-lg">{autoMetrics.operations?.stock_updates_count || 0}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Hết hàng</p>
                  <p className="font-semibold text-lg text-red-600">{autoMetrics.operations?.out_of_stock_items || 0}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</p>
                  <p className="font-semibold text-lg">{autoMetrics.operations?.task_completion_rate || 0}%</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tổng quan công việc</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Mô tả tổng quan công việc trong ngày..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={!isEditable}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Công việc đã hoàn thành ({completedTasks.length})
            </CardTitle>
            {isEditable && (
              <Button variant="outline" size="sm" onClick={handleImportTasks} className="gap-1">
                <Download className="h-3.5 w-3.5" />
                Nhập từ Tasks
              </Button>
            )}
          </div>
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
            Công việc đang thực hiện ({pendingTasks.length})
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
                placeholder="Thêm công việc đang thực hiện..."
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
            Vấn đề / Blockers ({blockers.length})
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
                placeholder="Thêm vấn đề / blocker..."
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

      {/* WBS Check Result */}
      {wbsResult && (
        <WbsCheckPanel
          result={wbsResult}
          onAcceptSuggestion={(item, directiveId) => acceptSuggestion.mutate({ reportItem: item, directiveId })}
          isAccepting={acceptSuggestion.isPending}
        />
      )}

      {/* Actions */}
      {isEditable && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => classify.mutate(completedTasks)}
            disabled={isClassifying || completedTasks.length === 0}
            className="gap-1"
          >
            {isClassifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Kiểm tra WBS
          </Button>
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

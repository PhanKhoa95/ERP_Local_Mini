import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceReportRecorder } from "@/components/performance/VoiceReportRecorder";
import { WorkReportChatbot } from "@/components/performance/WorkReportChatbot";
import { QuickTaskForm } from "@/components/performance/QuickTaskForm";
import { DraftTaskList } from "@/components/performance/DraftTaskList";
import { useWorkReports } from "@/hooks/useWorkReports";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";
import { useProjects } from "@/hooks/useProjects";
import { useWorkReportDraft, DraftTask } from "@/hooks/useWorkReportDraft";
import { useTasks } from "@/hooks/useTasks";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Mic, MessageSquare, FileEdit, 
  Send, Loader2, User, Download, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export default function WorkReport() {
  const [activeTab, setActiveTab] = useState("voice");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();
  const { projects } = useProjects();
  const { todayCompletedTasks } = useTasks();
  const { 
    tasks, tasksByProject, stats, 
    isLoading: isDraftLoading, isSaving,
    addTasks, removeTask, updateTask,
    clearDraft, saveNow, importCompletedTasks,
  } = useWorkReportDraft();
  const { createReport, todayReport, updateReport, submitReport } = useWorkReports();

  const projectList = projects?.map(p => ({ id: p.id, code: p.code, name: p.name })) || [];

  // Count importable tasks (not already in draft)
  const existingTaskIds = new Set(tasks.filter(t => t.task_id).map(t => t.task_id));
  const importableCount = todayCompletedTasks?.filter(t => !existingTaskIds.has(t.id)).length || 0;

  const handleImportTasks = () => {
    if (!todayCompletedTasks || todayCompletedTasks.length === 0) return;
    const count = importCompletedTasks(todayCompletedTasks.map(t => ({
      id: t.id,
      title: t.title,
      completion_notes: t.completion_notes,
      project: t.project,
      project_id: t.project_id,
    })));
    if (count > 0) toast.success(`Đã nhập ${count} công việc từ Tasks`);
    else toast.info("Tất cả công việc đã được nhập trước đó");
  };

  const handleTasksParsed = (parsedTasks: { 
    task: string; type: "completed" | "pending" | "blocker";
    project_code?: string; project_name?: string;
  }[], source: "voice" | "chat" = "voice") => {
    const tasksToAdd = parsedTasks.map(t => ({
      task: t.task, type: t.type,
      project_code: t.project_code, project_name: t.project_name,
      project_id: projectList.find(p => p.code === t.project_code)?.id,
      source: source as "voice" | "chat" | "form",
    }));
    addTasks(tasksToAdd);
  };

  const handleChatTasksParsed = (parsedTasks: { 
    task: string; type: "completed" | "pending" | "blocker";
    project_code?: string; project_name?: string;
  }[]) => handleTasksParsed(parsedTasks, "chat");

  const handleFormTasksChange = (formTasks: { 
    id: string; text: string; type: "completed" | "pending" | "blocker"; project?: string;
  }[]) => {
    const newTasks = formTasks.map(t => {
      const project = projectList.find(p => p.code === t.project);
      return {
        task: t.text, type: t.type,
        project_id: project?.id, project_code: t.project, project_name: project?.name,
        source: "form" as const,
      };
    });
    clearDraft().then(() => { if (newTasks.length > 0) addTasks(newTasks); });
  };

  const handleSubmitReport = async () => {
    if (tasks.length === 0) { toast.error("Chưa có công việc nào để báo cáo"); return; }
    setIsSubmitting(true);
    try {
      const completed = tasks.filter(t => t.type === "completed").map(t => ({ 
        task: t.task, project: t.project_code, project_name: t.project_name 
      }));
      const pending = tasks.filter(t => t.type !== "completed").map(t => ({ 
        task: t.task, project: t.project_code, project_name: t.project_name, isBlocker: t.type === "blocker" 
      }));

      if (todayReport) {
        await updateReport.mutateAsync({
          id: todayReport.id, completed_tasks: completed, pending_tasks: pending,
          status: "submitted", submitted_at: new Date().toISOString(),
        });
      } else {
        const created = await createReport.mutateAsync({ report_type: "daily", completed_tasks: completed, pending_tasks: pending });
        if (created?.id) await submitReport.mutateAsync(created.id);
      }
      await clearDraft();
      toast.success("Đã gửi báo cáo thành công!");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error("Lỗi gửi báo cáo: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formTasks = tasks.map((t) => ({ id: t.id, text: t.task, type: t.type, project: t.project_code }));

  if (!employee) {
    return (
      <MainLayout>
        <div className="container max-w-5xl mx-auto py-6 px-4">
          <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Chưa có hồ sơ nhân viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bạn cần được thêm vào hệ thống nhân sự trước khi có thể gửi báo cáo công việc. 
                  Vui lòng liên hệ quản trị viên (Admin).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-5xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Báo cáo Công việc</h1>
            <p className="text-muted-foreground">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}</p>
          </div>
          <div className="flex items-center gap-3">
            {employee && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{employee.title || "Nhân viên"}</span>
              </div>
            )}
            {todayReport && (
              <Badge variant={todayReport.status === "submitted" ? "default" : "secondary"}>
                {todayReport.status === "submitted" ? "Đã gửi" : "Bản nháp"}
              </Badge>
            )}
          </div>
        </div>

        {/* Import from Tasks */}
        {importableCount > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Có {importableCount} công việc đã hoàn thành hôm nay</p>
                  <p className="text-xs text-muted-foreground">Nhập tự động từ danh sách Tasks vào báo cáo</p>
                </div>
              </div>
              <Button size="sm" onClick={handleImportTasks} className="gap-2">
                <Download className="h-4 w-4" /> Nhập từ Tasks
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="voice" className="gap-2">
                  <Mic className="h-4 w-4" /><span className="hidden sm:inline">Giọng nói</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">Chat AI</span>
                </TabsTrigger>
                <TabsTrigger value="form" className="gap-2">
                  <FileEdit className="h-4 w-4" /><span className="hidden sm:inline">Form</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="voice" className="mt-4">
                <VoiceReportRecorder projects={projectList} onTasksParsed={handleTasksParsed} />
                <p className="text-xs text-muted-foreground text-center mt-3">Sử dụng Chrome hoặc Edge để có trải nghiệm tốt nhất</p>
              </TabsContent>
              <TabsContent value="chat" className="mt-4">
                <WorkReportChatbot onTasksParsed={handleChatTasksParsed} />
              </TabsContent>
              <TabsContent value="form" className="mt-4">
                <QuickTaskForm tasks={formTasks} projects={projectList} onTasksChange={handleFormTasksChange} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Draft báo cáo</span>
                  <Badge variant="outline">{stats.total} việc</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isDraftLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <DraftTaskList
                    tasksByProject={tasksByProject}
                    stats={stats}
                    projects={projectList}
                    isSaving={isSaving}
                    onRemoveTask={removeTask}
                    onUpdateTask={updateTask}
                    onSaveNow={saveNow}
                  />
                )}
                <Button className="w-full gap-2" size="lg" onClick={handleSubmitReport} disabled={stats.total === 0 || isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Gửi báo cáo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

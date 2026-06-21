import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTasks, Task } from "@/hooks/useTasks";
import { useEmployeeProjects } from "@/hooks/useProjects";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";
import { 
  CheckCircle2, Clock, PlayCircle, AlertTriangle, 
  Package, MessageSquare, User, Calendar, Flag,
  Plus, ChevronDown, Briefcase, FolderOpen
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { vi } from "date-fns/locale";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { CreateSelfTaskDialog } from "./CreateSelfTaskDialog";

const priorityConfig = {
  low: { label: "Thấp", color: "bg-muted text-muted-foreground", icon: Flag },
  normal: { label: "Bình thường", color: "bg-primary/10 text-primary", icon: Flag },
  high: { label: "Cao", color: "bg-warning/10 text-warning", icon: Flag },
  urgent: { label: "Khẩn cấp", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

const sourceConfig: Record<string, { label: string; icon: any; color: string }> = {
  directive: { label: "Chỉ đạo", icon: User, color: "text-primary" },
  order: { label: "Đơn hàng", icon: Package, color: "text-info" },
  manual: { label: "Thủ công", icon: MessageSquare, color: "text-muted-foreground" },
  project: { label: "Dự án", icon: Calendar, color: "text-success" },
  self: { label: "Cá nhân", icon: Briefcase, color: "text-warning" },
};

const statusConfig = {
  pending: { label: "Chờ nhận", color: "bg-muted", icon: Clock },
  accepted: { label: "Đã nhận", color: "bg-primary/20", icon: CheckCircle2 },
  in_progress: { label: "Đang làm", color: "bg-warning/20", icon: PlayCircle },
  done: { label: "Hoàn thành", color: "bg-success/10", icon: CheckCircle2 },
  cancelled: { label: "Hủy", color: "bg-destructive/20", icon: AlertTriangle },
};

export function MyTasksTab() {
  const [activeStatus, setActiveStatus] = useState("pending");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");

  const { employee } = usePerformanceEmployee();
  const { myTasks, myTasksLoading, taskStats, acceptTask, startTask, completeTask } = useTasks({ 
    status: activeStatus === "all" ? undefined : activeStatus,
    projectId: filterProject !== "all" ? filterProject : undefined,
    sourceType: filterSource !== "all" ? filterSource : undefined,
  });
  const { projects } = useEmployeeProjects(employee?.id);

  const allTasks = myTasks || [];

  // Group tasks by project
  const tasksByProject = allTasks.reduce((acc, task) => {
    const key = task.project?.code || "_none";
    if (!acc[key]) acc[key] = { name: task.project?.name || "Không thuộc dự án", tasks: [] };
    acc[key].tasks.push(task);
    return acc;
  }, {} as Record<string, { name: string; tasks: Task[] }>);

  const projectList = projects?.filter(p => p.status === "active").map(p => ({ id: p.id, code: p.code, name: p.name })) || [];

  const handleQuickAction = async (task: Task) => {
    if (task.status === "pending") await acceptTask.mutateAsync(task.id);
    else if (task.status === "accepted") await startTask.mutateAsync(task.id);
    else if (task.status === "in_progress") setSelectedTask(task);
  };

  const renderTaskCard = (task: Task) => {
    const priority = priorityConfig[task.priority];
    const source = sourceConfig[task.source_type] || sourceConfig.manual;
    const status = statusConfig[task.status];
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";
    const SourceIcon = source.icon;

    return (
      <Card 
        key={task.id} 
        className={`cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? "border-destructive" : ""}`}
        onClick={() => setSelectedTask(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <SourceIcon className={`h-4 w-4 shrink-0 ${source.color}`} />
                <span className="text-xs text-muted-foreground">{source.label}</span>
                {task.project && (
                  <Badge variant="outline" className="text-xs">{task.project.code}</Badge>
                )}
              </div>
              <h4 className="font-medium truncate">{task.title}</h4>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs">
                {task.due_date && (
                  <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    <Clock className="h-3 w-3" />
                    {isOverdue ? "Quá hạn " : ""}
                    {formatDistanceToNow(new Date(task.due_date), { addSuffix: true, locale: vi })}
                  </span>
                )}
                <Badge className={priority.color} variant="secondary">{priority.label}</Badge>
              </div>
              {task.progress > 0 && task.status !== "done" && (
                <div className="mt-3">
                  <Progress value={task.progress} className="h-1.5" />
                  <span className="text-xs text-muted-foreground">{task.progress}%</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={status.color}>{status.label}</Badge>
              {task.status !== "done" && task.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant={task.status === "pending" ? "default" : "outline"}
                  onClick={(e) => { e.stopPropagation(); handleQuickAction(task); }}
                  disabled={acceptTask.isPending || startTask.isPending}
                >
                  {task.status === "pending" && "Nhận việc"}
                  {task.status === "accepted" && "Bắt đầu"}
                  {task.status === "in_progress" && "Hoàn thành"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const hasProjectGroups = Object.keys(tasksByProject).length > 1;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Chờ nhận", value: taskStats.pending, color: "text-primary" },
          { label: "Đang làm", value: taskStats.inProgress, color: "text-warning" },
          { label: "Hoàn thành", value: taskStats.done, color: "text-success" },
          { label: "Quá hạn", value: taskStats.overdue, color: taskStats.overdue > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Create button */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo việc cá nhân
        </Button>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[180px]">
            <FolderOpen className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Dự án" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dự án</SelectItem>
            {projectList.map(p => (
              <SelectItem key={p.id} value={p.id}>[{p.code}] {p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Nguồn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nguồn</SelectItem>
            {Object.entries(sourceConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Chờ nhận</TabsTrigger>
          <TabsTrigger value="accepted">Đã nhận</TabsTrigger>
          <TabsTrigger value="in_progress">Đang làm</TabsTrigger>
          <TabsTrigger value="done">Hoàn thành</TabsTrigger>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
        </TabsList>

        <TabsContent value={activeStatus} className="mt-4">
          {myTasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allTasks.length > 0 ? (
            hasProjectGroups ? (
              <div className="space-y-4">
                {Object.entries(tasksByProject).map(([key, group]) => (
                  <Collapsible key={key} defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-muted/50">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{key === "_none" ? "Không thuộc dự án" : `[${key}] ${group.name}`}</span>
                      <Badge variant="secondary" className="ml-auto">{group.tasks.length}</Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-2 pl-2">
                      {group.tasks.map(renderTaskCard)}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="space-y-3">{allTasks.map(renderTaskCard)}</div>
            )
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-3 rounded-full bg-muted mb-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Chưa có công việc nào</h3>
                <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                  Tạo việc cá nhân hoặc chờ quản lý giao task cho bạn
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Tạo việc đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onComplete={(notes) => {
            completeTask.mutate({ taskId: selectedTask.id, notes });
            setSelectedTask(null);
          }}
        />
      )}
      <CreateSelfTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projects={projectList}
      />
    </div>
  );
}

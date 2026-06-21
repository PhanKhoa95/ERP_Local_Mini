import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface TaskItem {
  id: string;
  text: string;
  type: "completed" | "pending" | "blocker";
  project?: string;
}

interface QuickTaskFormProps {
  onTasksChange: (tasks: TaskItem[]) => void;
  tasks: TaskItem[];
  projects?: { id: string; code: string; name: string }[];
}

export function QuickTaskForm({ onTasksChange, tasks, projects }: QuickTaskFormProps) {
  const [newTask, setNewTask] = useState("");
  const [taskType, setTaskType] = useState<"completed" | "pending" | "blocker">("completed");
  const [selectedProject, setSelectedProject] = useState<string>("");

  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task: TaskItem = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      type: taskType,
      project: selectedProject || undefined,
    };
    
    onTasksChange([...tasks, task]);
    setNewTask("");
  };

  const removeTask = (id: string) => {
    onTasksChange(tasks.filter(t => t.id !== id));
  };

  const updateTaskProject = (id: string, projectCode: string) => {
    onTasksChange(tasks.map(t => 
      t.id === id ? { ...t, project: projectCode === "none" ? undefined : projectCode } : t
    ));
  };

  const completedTasks = tasks.filter(t => t.type === "completed");
  const pendingTasks = tasks.filter(t => t.type === "pending");
  const blockerTasks = tasks.filter(t => t.type === "blocker");

  const getProjectName = (code?: string) => {
    if (!code) return null;
    return projects?.find(p => p.code === code)?.name || code;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Nhập công việc thủ công</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick type selector */}
        <div className="flex gap-2 flex-wrap">
          <Badge 
            variant={taskType === "completed" ? "default" : "outline"}
            className="cursor-pointer gap-1"
            onClick={() => setTaskType("completed")}
          >
            <CheckCircle2 className="h-3 w-3" />
            Hoàn thành
          </Badge>
          <Badge 
            variant={taskType === "pending" ? "default" : "outline"}
            className="cursor-pointer gap-1"
            onClick={() => setTaskType("pending")}
          >
            <Clock className="h-3 w-3" />
            Đang làm
          </Badge>
          <Badge 
            variant={taskType === "blocker" ? "default" : "outline"}
            className="cursor-pointer gap-1"
            onClick={() => setTaskType("blocker")}
          >
            <AlertTriangle className="h-3 w-3" />
            Blocker
          </Badge>
        </div>

        {/* Project selector */}
        {projects && projects.length > 0 && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn dự án (tuỳ chọn)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Không có dự án cụ thể</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.code}>
                  [{p.code}] {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Add task input */}
        <div className="flex gap-2">
          <Input
            placeholder={`Nhập công việc ${taskType === "completed" ? "đã hoàn thành" : taskType === "pending" ? "đang làm" : "bị block"}...`}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button onClick={addTask} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Tasks preview */}
        {tasks.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            {completedTasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Hoàn thành ({completedTasks.length})
                </p>
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm p-1.5 bg-green-500/10 rounded">
                    <span className="flex-1">
                      {task.text}
                      {task.project && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {task.project}
                        </Badge>
                      )}
                    </span>
                    {projects && projects.length > 0 && (
                      <Select 
                        value={task.project || "none"} 
                        onValueChange={(v) => updateTaskProject(task.id, v)}
                      >
                        <SelectTrigger className="w-24 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Chung</SelectItem>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.code}>{p.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeTask(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {pendingTasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  Đang làm ({pendingTasks.length})
                </p>
                {pendingTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm p-1.5 bg-yellow-500/10 rounded">
                    <span className="flex-1">
                      {task.text}
                      {task.project && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {task.project}
                        </Badge>
                      )}
                    </span>
                    {projects && projects.length > 0 && (
                      <Select 
                        value={task.project || "none"} 
                        onValueChange={(v) => updateTaskProject(task.id, v)}
                      >
                        <SelectTrigger className="w-24 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Chung</SelectItem>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.code}>{p.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeTask(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {blockerTasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  Blocker ({blockerTasks.length})
                </p>
                {blockerTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm p-1.5 bg-destructive/10 rounded">
                    <span className="flex-1">
                      {task.text}
                      {task.project && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {task.project}
                        </Badge>
                      )}
                    </span>
                    {projects && projects.length > 0 && (
                      <Select 
                        value={task.project || "none"} 
                        onValueChange={(v) => updateTaskProject(task.id, v)}
                      >
                        <SelectTrigger className="w-24 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Chung</SelectItem>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.code}>{p.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeTask(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

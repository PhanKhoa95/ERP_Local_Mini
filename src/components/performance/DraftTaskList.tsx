import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, Clock, AlertTriangle, Trash2, 
  FolderOpen, ChevronDown, ChevronUp, Save, Loader2
} from "lucide-react";
import { DraftTask } from "@/hooks/useWorkReportDraft";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProjectGroup {
  project_id?: string;
  project_code?: string;
  project_name: string;
  tasks: DraftTask[];
}

interface DraftTaskListProps {
  tasksByProject: Record<string, ProjectGroup>;
  stats: {
    total: number;
    completed: number;
    pending: number;
    blocker: number;
  };
  projects?: { id: string; code: string; name: string }[];
  isSaving: boolean;
  onRemoveTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<DraftTask>) => void;
  onSaveNow: () => void;
}

const TaskIcon = ({ type }: { type: DraftTask["type"] }) => {
  switch (type) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "blocker":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
  }
};

const SourceBadge = ({ source }: { source: DraftTask["source"] }) => {
  const labels: Record<string, string> = {
    voice: "🎤",
    chat: "💬",
    form: "📝",
  };
  return (
    <span className="text-xs opacity-60" title={`Từ ${source}`}>
      {labels[source] || "📝"}
    </span>
  );
};

export function DraftTaskList({
  tasksByProject,
  stats,
  projects,
  isSaving,
  onRemoveTask,
  onUpdateTask,
  onSaveNow,
}: DraftTaskListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  const projectGroups = Object.entries(tasksByProject);
  const hasNoTasks = stats.total === 0;

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const changeTaskProject = (taskId: string, projectCode: string) => {
    if (projectCode === "general") {
      onUpdateTask(taskId, { 
        project_id: undefined, 
        project_code: undefined, 
        project_name: undefined 
      });
    } else {
      const project = projects?.find(p => p.code === projectCode);
      if (project) {
        onUpdateTask(taskId, {
          project_id: project.id,
          project_code: project.code,
          project_name: project.name,
        });
      }
    }
  };

  const changeTaskType = (taskId: string, type: DraftTask["type"]) => {
    onUpdateTask(taskId, { type });
  };

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          {stats.completed} xong
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3 text-yellow-600" />
          {stats.pending} đang làm
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          {stats.blocker} block
        </Badge>
      </div>

      {/* Tasks grouped by project */}
      <ScrollArea className="h-[350px] pr-2">
        {hasNoTasks ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Chưa có công việc nào</p>
            <p className="text-xs mt-1">Dùng giọng nói, chat hoặc form để thêm</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectGroups.map(([key, group]) => {
              const isExpanded = expandedGroups[key] !== false; // Default expanded
              
              return (
                <Collapsible 
                  key={key} 
                  open={isExpanded}
                  onOpenChange={() => toggleGroup(key)}
                >
                  <div className="rounded-lg border bg-card">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">
                            {group.project_code ? `[${group.project_code}] ` : ""}
                            {group.project_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {group.tasks.length}
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-2">
                        {group.tasks.map((task) => (
                          <div 
                            key={task.id}
                            className="flex items-start gap-2 p-2 rounded-md bg-muted/30 group"
                          >
                            {/* Type selector */}
                            <Select 
                              value={task.type} 
                              onValueChange={(v) => changeTaskType(task.id, v as DraftTask["type"])}
                            >
                              <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent">
                                <TaskIcon type={task.type} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="completed">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    Hoàn thành
                                  </div>
                                </SelectItem>
                                <SelectItem value="pending">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                    Đang làm
                                  </div>
                                </SelectItem>
                                <SelectItem value="blocker">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    Blocker
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm break-words">{task.task}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <SourceBadge source={task.source} />
                                {/* Project selector */}
                                {projects && projects.length > 0 && (
                                  <Select
                                    value={task.project_code || "general"}
                                    onValueChange={(v) => changeTaskProject(task.id, v)}
                                  >
                                    <SelectTrigger className="h-5 text-xs w-auto min-w-[80px] border-dashed">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="general">Chung</SelectItem>
                                      {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.code}>
                                          [{p.code}] {p.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={() => onRemoveTask(task.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Auto-save indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save className="h-3 w-3" />
              <span>Auto-saved</span>
            </>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 text-xs"
          onClick={onSaveNow}
          disabled={isSaving}
        >
          Lưu ngay
        </Button>
      </div>
    </div>
  );
}

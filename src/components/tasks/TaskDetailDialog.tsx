import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Task, useTasks } from "@/hooks/useTasks";
import { useWorkReportDraft } from "@/hooks/useWorkReportDraft";
import { format, isPast } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Clock, Calendar, User, Package, MessageSquare, 
  Flag, CheckCircle2, PlayCircle,
  ExternalLink, Briefcase, FileText
} from "lucide-react";

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (notes?: string) => void;
}

const priorityConfig = {
  low: { label: "Thấp", color: "bg-muted" },
  normal: { label: "Bình thường", color: "bg-primary/10 text-primary" },
  high: { label: "Cao", color: "bg-warning/10 text-warning" },
  urgent: { label: "Khẩn cấp", color: "bg-destructive/10 text-destructive" },
};

const sourceLabels: Record<string, string> = {
  directive: "Chỉ đạo trực tiếp",
  order: "Từ đơn hàng ERP",
  manual: "Gán thủ công",
  project: "Công việc dự án",
  self: "Tự tạo",
};

export function TaskDetailDialog({ task, open, onOpenChange, onComplete }: TaskDetailDialogProps) {
  const [progress, setProgress] = useState(task.progress);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [addToReport, setAddToReport] = useState(true);
  const { updateTask, acceptTask, startTask } = useTasks();
  const { addTasks } = useWorkReportDraft();

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";
  const priority = priorityConfig[task.priority];

  const handleUpdateProgress = async () => {
    await updateTask.mutateAsync({ id: task.id, progress });
  };

  const handleComplete = () => {
    // Add to report draft if checked
    if (addToReport) {
      addTasks([{
        task_id: task.id,
        task: completionNotes ? `${task.title} — ${completionNotes}` : task.title,
        type: "completed",
        source: "task",
        project_id: task.project_id || undefined,
        project_code: task.project?.code,
        project_name: task.project?.name,
      }]);
    }
    if (onComplete) onComplete(completionNotes);
  };

  const handleAction = async () => {
    if (task.status === "pending") await acceptTask.mutateAsync(task.id);
    else if (task.status === "accepted") await startTask.mutateAsync(task.id);
    else if (task.status === "in_progress") setIsCompleting(true);
  };

  const SourceIcon = task.source_type === "order" ? Package : task.source_type === "self" ? Briefcase : task.source_type === "directive" ? User : MessageSquare;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex-1">{task.title}</span>
            <Badge className={priority.color}>{priority.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SourceIcon className="h-4 w-4" />
            <span>{sourceLabels[task.source_type] || task.source_type}</span>
            {task.project && (
              <>
                <span>•</span>
                <Badge variant="outline">[{task.project.code}] {task.project.name}</Badge>
              </>
            )}
          </div>

          {task.description && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {task.due_date && (
            <div className={`flex items-center gap-2 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Hạn: {format(new Date(task.due_date), "dd/MM/yyyy HH:mm", { locale: vi })}
                {isOverdue && " (Quá hạn!)"}
              </span>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Tạo: {format(new Date(task.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
            </div>
            {task.started_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <PlayCircle className="h-4 w-4" />
                <span>Bắt đầu: {format(new Date(task.started_at), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
              </div>
            )}
            {task.completed_at && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Hoàn thành: {format(new Date(task.completed_at), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
              </div>
            )}
          </div>

          {task.status === "in_progress" && !isCompleting && (
            <div className="space-y-2">
              <Label>Tiến độ: {progress}%</Label>
              <div className="flex items-center gap-4">
                <Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} max={100} step={10} className="flex-1" />
                <Button size="sm" variant="outline" onClick={handleUpdateProgress} disabled={progress === task.progress}>Lưu</Button>
              </div>
            </div>
          )}

          {isCompleting && (
            <div className="space-y-3 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800">
              <Label>Ghi chú hoàn thành</Label>
              <Textarea
                placeholder="Mô tả kết quả công việc..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Checkbox id="addToReport" checked={addToReport} onCheckedChange={(c) => setAddToReport(!!c)} />
                <label htmlFor="addToReport" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <FileText className="h-3.5 w-3.5" />
                  Thêm vào báo cáo hôm nay
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleComplete} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Xác nhận hoàn thành
                </Button>
                <Button variant="outline" onClick={() => setIsCompleting(false)}>Hủy</Button>
              </div>
            </div>
          )}

          {task.source_type === "order" && task.source_id && (
            <Button variant="outline" className="w-full" asChild>
              <a href={`/orders?id=${task.source_id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />Xem đơn hàng
              </a>
            </Button>
          )}

          {task.status === "done" && task.quality_score && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <span className="text-sm">Đánh giá chất lượng:</span>
              <Badge className="bg-green-600">{task.quality_score}/5</Badge>
            </div>
          )}
        </div>

        <DialogFooter>
          {task.status !== "done" && task.status !== "cancelled" && !isCompleting && (
            <Button onClick={handleAction}>
              {task.status === "pending" && "Nhận việc"}
              {task.status === "accepted" && "Bắt đầu làm"}
              {task.status === "in_progress" && "Hoàn thành"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

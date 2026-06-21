import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeamPerformance } from "@/hooks/useTeamPerformance";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultSourceType?: "directive" | "order" | "manual" | "project";
  defaultSourceId?: string;
  defaultDirectiveId?: string;
}

export function AssignTaskDialog({ 
  open, 
  onOpenChange, 
  defaultProjectId,
  defaultSourceType = "manual",
  defaultSourceId,
  defaultDirectiveId,
}: AssignTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [dueDate, setDueDate] = useState<Date>();

  const { createTask } = useTasks();
  const { projects } = useProjects();
  const { teamMembers } = useTeamPerformance();

  const handleSubmit = async () => {
    if (!title || !assigneeId) return;

    await createTask.mutateAsync({
      title,
      description,
      assigned_to: assigneeId,
      project_id: projectId || null,
      priority,
      source_type: defaultSourceType,
      source_id: defaultSourceId,
      due_date: dueDate?.toISOString(),
    });

    // Reset form
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setProjectId("");
    setPriority("normal");
    setDueDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gán công việc mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề *</Label>
            <Input
              placeholder="Nhập tiêu đề công việc..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Mô tả chi tiết công việc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Gán cho *</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhân viên..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.title || "Nhân viên"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dự án</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không có</SelectItem>
                  {projects?.filter(p => p.status === "active").map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      [{project.code}] {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Độ ưu tiên</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Hạn hoàn thành</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!title || !assigneeId || createTask.isPending}
          >
            {createTask.isPending ? "Đang gán..." : "Gán việc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

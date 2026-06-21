import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTasks } from "@/hooks/useTasks";
import { Loader2 } from "lucide-react";

interface CreateSelfTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects?: Array<{ id: string; code: string; name: string }>;
}

export function CreateSelfTaskDialog({ open, onOpenChange, projects }: CreateSelfTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [projectId, setProjectId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const { createSelfTask } = useTasks();

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await createSelfTask.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      project_id: projectId || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
    setTitle(""); setDescription(""); setPriority("normal"); setProjectId(""); setDueDate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo công việc cá nhân</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tiêu đề *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên công việc..." />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Chi tiết..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ưu tiên</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hạn chót</Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          {projects && projects.length > 0 && (
            <div>
              <Label>Dự án</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Không thuộc dự án" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không thuộc dự án</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>[{p.code}] {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createSelfTask.isPending}>
            {createSelfTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tạo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

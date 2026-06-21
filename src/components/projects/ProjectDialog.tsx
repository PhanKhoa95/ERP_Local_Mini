import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects, Project } from "@/hooks/useProjects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

export function ProjectDialog({ open, onOpenChange, project }: Props) {
  const { createProject, updateProject } = useProjects();
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "planning" as Project["status"],
    priority: "normal" as Project["priority"],
    start_date: "",
    end_date: "",
    budget: "",
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        code: project.code,
        description: project.description || "",
        status: project.status,
        priority: project.priority,
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        budget: project.budget?.toString() || "",
      });
    } else {
      setForm({ name: "", code: "", description: "", status: "planning", priority: "normal", start_date: "", end_date: "", budget: "" });
    }
  }, [project, open]);

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      budget: form.budget ? parseFloat(form.budget) : null,
    };

    if (project) {
      updateProject.mutate({ id: project.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createProject.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Sửa dự án" : "Tạo dự án mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên dự án *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mã dự án *</Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Lên kế hoạch</SelectItem>
                  <SelectItem value="active">Đang chạy</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="on_hold">Tạm dừng</SelectItem>
                  <SelectItem value="cancelled">Hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ưu tiên</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="critical">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày bắt đầu</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ngân sách</Label>
            <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="VNĐ" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.code || createProject.isPending || updateProject.isPending}>
            {project ? "Cập nhật" : "Tạo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

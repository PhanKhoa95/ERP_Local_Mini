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
    actual_cost: "",
    progress: "0",
    owner_name: "",
    milestones: "",
    deliverables: "",
    cost_documents: "",
    delay_reason: "",
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
        actual_cost: project.actual_cost?.toString() || "",
        progress: project.progress?.toString() || "0",
        owner_name: project.owner_name || "",
        milestones: project.milestones || "",
        deliverables: project.deliverables || "",
        cost_documents: project.cost_documents || "",
        delay_reason: project.delay_reason || "",
      });
    } else {
      setForm({
        name: "",
        code: "",
        description: "",
        status: "planning",
        priority: "normal",
        start_date: "",
        end_date: "",
        budget: "",
        actual_cost: "",
        progress: "0",
        owner_name: "",
        milestones: "",
        deliverables: "",
        cost_documents: "",
        delay_reason: "",
      });
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
      actual_cost: form.actual_cost ? parseFloat(form.actual_cost) : 0,
      progress: parseInt(form.progress) || 0,
      owner_name: form.owner_name || null,
      milestones: form.milestones || null,
      deliverables: form.deliverables || null,
      cost_documents: form.cost_documents || null,
      delay_reason: form.delay_reason || null,
    };

    if (project) {
      updateProject.mutate({ id: project.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createProject.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Sửa dự án" : "Tạo dự án mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pr-1">
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
          
          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label>Tiến độ (%)</Label>
              <Input type="number" min="0" max="100" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Người phụ trách</Label>
              <Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Tên người phụ trách" />
            </div>
            <div className="space-y-2">
              <Label>Kết quả đầu ra (Deliverables)</Label>
              <Input value={form.deliverables} onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))} placeholder="Sản phẩm bàn giao..." />
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
              <Label>Ngân sách kế hoạch</Label>
              <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="VNĐ" />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Thực chi hiện tại</Label>
              <Input type="number" value={form.actual_cost} onChange={e => setForm(f => ({ ...f, actual_cost: e.target.value }))} placeholder="VNĐ" />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Mã chứng từ chi phí</Label>
              <Input value={form.cost_documents} onChange={e => setForm(f => ({ ...f, cost_documents: e.target.value }))} placeholder="Ví dụ: HD-001" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mốc công việc chính (Milestones)</Label>
            <Input value={form.milestones} onChange={e => setForm(f => ({ ...f, milestones: e.target.value }))} placeholder="Các mốc cách nhau bằng dấu phẩy..." />
          </div>

          {form.status !== "completed" && (
            <div className="space-y-2">
              <Label className="text-yellow-600">Lý do chậm trễ (nếu có)</Label>
              <Textarea value={form.delay_reason} onChange={e => setForm(f => ({ ...f, delay_reason: e.target.value }))} rows={2} placeholder="Nêu lý do chậm tiến độ hoặc điểm nghẽn..." />
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.code || createProject.isPending || updateProject.isPending}>
            {project ? "Cập nhật" : "Tạo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, CheckSquare, Calendar, ClipboardList } from "lucide-react";

interface TasksTabProps {
  tasks: any[];
  createTask: any;
  toggleTaskStatus: any;
}

export function TasksTab({ tasks, createTask, toggleTaskStatus }: TasksTabProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [formData, setFormData] = useState({
    title: "",
    due_date: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    await createTask.mutateAsync({
      title: formData.title,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      status: "pending",
      notes: formData.notes || null
    });
    setFormData({ title: "", due_date: "", notes: "" });
    setOpen(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <CheckSquare className="h-4.5 w-4.5 text-indigo-500" /> Checklist Nhiệm vụ & Công việc hàng ngày
          </h2>
          <p className="text-[11px] text-muted-foreground">Theo dõi danh sách các đầu việc liên hệ, hỗ trợ khách hàng cần hoàn tất đúng hạn</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
          <Plus className="h-3.5 w-3.5" /> Thêm đầu việc mới
        </Button>
      </div>

      {/* Filter and Content Grid */}
      <Card className="border border-border/80 shadow-md">
        <CardContent className="p-4 space-y-4">
          {/* Tabs Filter */}
          <div className="flex border-b pb-2 gap-2 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`pb-1 px-2 font-semibold ${filter === "all" ? "text-indigo-650 border-b-2 border-indigo-650 font-bold" : "text-muted-foreground"}`}
            >
              Tất cả ({tasks.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`pb-1 px-2 font-semibold ${filter === "pending" ? "text-indigo-650 border-b-2 border-indigo-650 font-bold" : "text-muted-foreground"}`}
            >
              Chưa hoàn thành ({tasks.filter((t) => t.status === "pending").length})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`pb-1 px-2 font-semibold ${filter === "completed" ? "text-indigo-650 border-b-2 border-indigo-650 font-bold" : "text-muted-foreground"}`}
            >
              Đã hoàn thành ({tasks.filter((t) => t.status === "completed").length})
            </button>
          </div>

          {/* Checklist List */}
          <div className="space-y-2.5">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-secondary/10 transition-colors shadow-sm gap-4"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.status === "completed"}
                    onCheckedChange={(checked) =>
                      toggleTaskStatus.mutateAsync({
                        id: task.id,
                        status: checked ? "completed" : "pending"
                      })
                    }
                    className="h-4.5 w-4.5 border-border rounded"
                  />
                  <div className="space-y-0.5">
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`text-xs font-bold text-foreground cursor-pointer ${task.status === "completed" ? "line-through text-muted-foreground font-semibold" : ""}`}
                    >
                      {task.title}
                    </label>
                    {task.notes && (
                      <p className="text-[10px] text-muted-foreground">{task.notes}</p>
                    )}
                  </div>
                </div>

                {task.due_date && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold border-none px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                  >
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Hạn: {new Date(task.due_date).toLocaleDateString("vi-VN")}</span>
                  </Badge>
                )}
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-10 text-xs italic text-muted-foreground">
                Không có nhiệm vụ nào trong bộ lọc.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <ClipboardList className="h-4.5 w-4.5 text-indigo-500" /> Thêm Nhiệm vụ chăm sóc mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thêm công việc vào kịch bản để tránh bị trễ hạn tư vấn khách hàng.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="taskTitle" className="font-semibold">Nội dung công việc *</Label>
              <Input
                id="taskTitle"
                className="h-8"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ví dụ: Gọi điện cho anh A để lấy file thiết kế nháp..."
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="taskDueDate" className="font-semibold">Thời hạn hoàn thành (Due Date)</Label>
              <Input
                id="taskDueDate"
                type="date"
                className="h-8"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="taskNotes" className="font-semibold">Ghi chú bổ sung</Label>
              <Input
                id="taskNotes"
                className="h-8 text-xs"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ví dụ: Ưu tiên làm trước buổi chiều..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">
                Thêm Nhiệm vụ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

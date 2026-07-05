import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, CheckSquare, Calendar, ClipboardList, PhoneCall, PhoneOff, User, Tag } from "lucide-react";

interface TasksTabProps {
  tasks: any[];
  createTask: any;
  toggleTaskStatus: any;
}

const categoryLabels: Record<string, string> = {
  call: "Hẹn gọi điện 📞",
  consult: "Tư vấn báo giá",
  support: "Bảo hành hỗ trợ",
  other: "Công việc khác"
};

const priorityLabels: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao"
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  medium: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  high: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900"
};

export function TasksTab({ tasks, createTask, toggleTaskStatus }: TasksTabProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [formData, setFormData] = useState({
    title: "",
    due_date: "",
    notes: "",
    category: "consult",
    priority: "medium"
  });

  // Call simulation overlay state
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Timer loop for call simulation
  useEffect(() => {
    let timer: any;
    if (activeCall) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    // Encode category and priority into notes to preserve E2E local storage schema compatibility
    const metaNotes = `[Category:${formData.category}][Priority:${formData.priority}] ${formData.notes || ''}`;

    await createTask.mutateAsync({
      title: formData.title,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      status: "pending",
      notes: metaNotes
    });

    setFormData({ title: "", due_date: "", notes: "", category: "consult", priority: "medium" });
    setOpen(false);
  };

  const handleStartCall = (task: any) => {
    setActiveCall(task);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    alert("Cuộc gọi kết thúc! Lịch sử cuộc gọi đã được ghi nhận tự động vào CRM.");
  };

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
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
            {filteredTasks.map((task) => {
              // Parse meta values
              const isCall = task.notes?.includes("[Category:call]") || task.title.includes("giao dịch");
              const priorityMatch = task.notes?.match(/\[Priority:(\w+)\]/)?.[1] || "medium";
              const rawNotes = task.notes?.replace(/\[Category:\w+\]/, "").replace(/\[Priority:\w+\]/, "").trim();

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-secondary/10 transition-colors shadow-sm gap-4 flex-wrap md:flex-nowrap"
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          htmlFor={`task-${task.id}`}
                          className={`text-xs font-bold text-foreground cursor-pointer ${task.status === "completed" ? "line-through text-muted-foreground font-semibold" : ""}`}
                        >
                          {task.title}
                        </label>
                        
                        {/* Display parsed category badge */}
                        {isCall ? (
                          <Badge variant="outline" className="text-[8px] bg-emerald-50 text-emerald-600 border-none font-bold">Cuộc gọi 📞</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8px] bg-indigo-50 text-indigo-600 border-none font-bold">Tư vấn</Badge>
                        )}

                        <Badge variant="outline" className={`text-[8px] font-extrabold uppercase border px-1 ${priorityColors[priorityMatch]}`}>
                          {priorityLabels[priorityMatch]}
                        </Badge>
                      </div>

                      {rawNotes && (
                        <p className="text-[10px] text-muted-foreground">{rawNotes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {isCall && task.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleStartCall(task)}
                        className="h-6 text-[9px] font-bold bg-emerald-650 hover:bg-emerald-750 text-white flex items-center gap-1 shadow-sm"
                      >
                        <PhoneCall className="h-2.5 w-2.5" /> Bắt đầu cuộc gọi
                      </Button>
                    )}

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
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <div className="text-center py-10 text-xs italic text-muted-foreground">
                Không có nhiệm vụ nào trong bộ lọc.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulated Phone Call Glassmorphism Modal */}
      {activeCall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="w-[320px] bg-slate-950 border-8 border-slate-900 rounded-[32px] overflow-hidden text-center text-slate-100 shadow-2xl relative">
            <div className="p-8 space-y-6 flex flex-col justify-between h-[360px]">
              <div className="space-y-2">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse">
                  <PhoneCall className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-sm text-white">Đang thực hiện cuộc gọi...</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{activeCall.title}</p>
              </div>

              <div className="text-3xl font-mono font-bold tracking-tight text-emerald-400">
                {formatDuration(callDuration)}
              </div>

              <div className="space-y-2">
                <p className="text-[9px] text-slate-500 italic">Đang ghi âm và đồng bộ log hội thoại tự động lên CRM.</p>
                <Button
                  onClick={handleEndCall}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 rounded-xl gap-2 shadow-lg"
                >
                  <PhoneOff className="h-4 w-4" /> Gác máy / Kết thúc cuộc gọi
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold">Phân loại danh mục</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Chọn loại..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    <SelectItem value="call">Hẹn gọi điện 📞</SelectItem>
                    <SelectItem value="consult">Tư vấn báo giá</SelectItem>
                    <SelectItem value="support">Bảo hành hỗ trợ</SelectItem>
                    <SelectItem value="other">Công việc khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Độ ưu tiên</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Độ ưu tiên..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

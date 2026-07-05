import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Kanban, ArrowRight, DollarSign, Calendar, TrendingUp, AlertTriangle } from "lucide-react";

interface DealsKanbanProps {
  deals: any[];
  createDeal: any;
  updateDealStage: any;
}

const STAGES = [
  { id: "new", label: "Mới tiếp nhận", color: "bg-blue-500" },
  { id: "consulting", label: "Đang tư vấn", color: "bg-indigo-500" },
  { id: "quote", label: "Đã báo giá", color: "bg-amber-500" },
  { id: "negotiating", label: "Thương lượng", color: "bg-purple-500" },
  { id: "won", label: "Thành công 🎉", color: "bg-green-500" },
  { id: "lost", label: "Thất bại ❌", color: "bg-rose-500" }
];

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  medium: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  high: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900"
};

export function DealsKanban({ deals, createDeal, updateDealStage }: DealsKanbanProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    stage: "new",
    priority: "medium",
    close_date: ""
  });

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("text/plain", dealId);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drop
  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;
    await updateDealStage.mutateAsync({ id: dealId, stage: targetStage });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    await createDeal.mutateAsync({
      title: formData.title,
      amount: Number(formData.amount) || 0,
      stage: formData.stage,
      priority: formData.priority,
      close_date: formData.close_date || null,
      lead_id: null
    });
    setFormData({ title: "", amount: "", stage: "new", priority: "medium", close_date: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Kanban className="h-4.5 w-4.5 text-indigo-500" /> Bảng Kanban Phễu Cơ hội bán hàng (Deals)
          </h2>
          <p className="text-[11px] text-muted-foreground">Kéo thả các thẻ cơ hội giữa các giai đoạn để cập nhật tiến độ chốt đơn</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
          <Plus className="h-3.5 w-3.5" /> Thêm cơ hội mới
        </Button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
        {STAGES.map((col) => {
          const colDeals = deals.filter((d) => d.stage === col.id);
          const colSum = colDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col min-w-[200px] bg-slate-50/50 dark:bg-slate-900/10 border rounded-xl p-3 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <span className="font-extrabold text-[11px] text-foreground">{col.label}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] font-bold rounded-full px-1.5 py-0">
                  {colDeals.length}
                </Badge>
              </div>

              {/* Column Total Value */}
              <div className="text-[10px] text-muted-foreground font-mono font-semibold mb-3 flex items-center justify-between">
                <span>TỔNG TRỊ GIÁ:</span>
                <span className="text-primary font-bold">{colSum.toLocaleString("vi-VN")}đ</span>
              </div>

              {/* Deal Cards Container */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[420px] pr-0.5">
                {colDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    className="p-3 bg-card border border-border/70 hover:border-primary/50 dark:hover:border-primary/55 rounded-xl cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-all space-y-2 relative"
                  >
                    <div className="font-bold text-xs text-foreground line-clamp-1">{deal.title}</div>
                    
                    <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      <span>{Number(deal.amount || 0).toLocaleString("vi-VN")}đ</span>
                      <Badge variant="outline" className={`text-[8px] font-extrabold uppercase border px-1 ${priorityColors[deal.priority]}`}>
                        {deal.priority === "high" ? "Gấp" : deal.priority === "medium" ? "Trung bình" : "Thấp"}
                      </Badge>
                    </div>

                    {deal.close_date && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground pt-1 border-t border-dashed">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>Kỳ vọng: {new Date(deal.close_date).toLocaleDateString("vi-VN")}</span>
                      </div>
                    )}
                  </div>
                ))}
                {colDeals.length === 0 && (
                  <div className="border border-dashed border-border/60 py-8 text-center text-[10px] text-muted-foreground italic rounded-lg">
                    Thả thẻ vào đây
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Kanban className="h-4.5 w-4.5 text-indigo-500" /> Tạo cơ hội bán hàng mới (Deal)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập cơ hội bán hàng/giá trị hợp đồng để đưa vào phễu theo dõi chăm sóc.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="dealTitle" className="font-semibold">Tên cơ hội / Hợp đồng *</Label>
              <Input
                id="dealTitle"
                className="h-8"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ví dụ: Thiết kế & in 1000 decal decal nhựa"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dealAmount" className="font-semibold">Giá trị dự kiến (đ) *</Label>
                <Input
                  id="dealAmount"
                  type="number"
                  className="h-8"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="2500000"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dealCloseDate" className="font-semibold">Kỳ vọng ngày chốt</Label>
                <Input
                  id="dealCloseDate"
                  type="date"
                  className="h-8"
                  value={formData.close_date}
                  onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold">Độ ưu tiên</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Ưu tiên..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Cao (Khẩn cấp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Giai đoạn ban đầu</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(val) => setFormData({ ...formData, stage: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Giai đoạn..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    {STAGES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">
                Tạo Deal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

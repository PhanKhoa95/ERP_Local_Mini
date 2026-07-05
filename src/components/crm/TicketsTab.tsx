import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, AlertTriangle, User, Phone, CheckCircle, RefreshCw, XCircle } from "lucide-react";

interface TicketsTabProps {
  tickets: any[];
  createTicket: any;
  updateTicketStatus: any;
}

const statusLabels: Record<string, string> = {
  open: "Mới tiếp nhận",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý xong",
  closed: "Đã đóng"
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  resolved: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  closed: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  medium: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  high: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900"
};

export function TicketsTab({ tickets, createTicket, updateTicketStatus }: TicketsTabProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    title: "",
    description: "",
    priority: "medium"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.title) return;
    await createTicket.mutateAsync({
      customer_name: formData.customer_name,
      phone: formData.phone || null,
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      status: "open",
      assigned_to: null
    });
    setFormData({ customer_name: "", phone: "", title: "", description: "", priority: "medium" });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-500" /> Tiếp nhận sự cố & Yêu cầu Bảo hành (Tickets)
          </h2>
          <p className="text-[11px] text-muted-foreground">Theo dõi phản hồi lỗi chất lượng sản phẩm, dịch vụ và tiến độ đền bù hỗ trợ</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
          <Plus className="h-3.5 w-3.5" /> Tạo Ticket mới
        </Button>
      </div>

      {/* Tickets List Grid */}
      <div className="space-y-3">
        {tickets.map((tkt) => (
          <Card key={tkt.id} className="border border-border/80 shadow-sm hover:shadow transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">{tkt.title}</div>
                  <div className="flex gap-3 text-[10px] text-muted-foreground items-center">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-indigo-500" /> {tkt.customer_name}
                    </div>
                    {tkt.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-emerald-500" /> {tkt.phone}
                      </div>
                    )}
                    <span className="text-[9px] font-semibold text-muted-foreground font-mono">
                      Khởi tạo: {new Date(tkt.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className={`text-[8px] font-extrabold uppercase border px-1 ${priorityColors[tkt.priority]}`}>
                    {tkt.priority === "high" ? "Khẩn cấp" : tkt.priority === "medium" ? "Trung bình" : "Thấp"}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] font-bold border-none px-2 py-0.5 rounded-full ${statusColors[tkt.status]}`}>
                    {statusLabels[tkt.status] || tkt.status}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {tkt.description && (
                <p className="text-xs text-foreground bg-slate-50 dark:bg-slate-900/40 border p-3 rounded-xl italic">
                  "{tkt.description}"
                </p>
              )}

              {/* Actions Footer */}
              <div className="flex gap-2 justify-end border-t pt-3">
                {tkt.status === "open" && (
                  <Button
                    size="sm"
                    onClick={() => updateTicketStatus.mutateAsync({ id: tkt.id, status: "in_progress" })}
                    className="h-7 text-[10px] font-bold bg-amber-500 hover:bg-amber-650 text-white flex items-center gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Tiến hành xử lý
                  </Button>
                )}
                {tkt.status === "in_progress" && (
                  <Button
                    size="sm"
                    onClick={() => updateTicketStatus.mutateAsync({ id: tkt.id, status: "resolved" })}
                    className="h-7 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Xác nhận đã xử lý xong
                  </Button>
                )}
                {tkt.status === "resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTicketStatus.mutateAsync({ id: tkt.id, status: "closed" })}
                    className="h-7 text-[10px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Đóng ticket
                  </Button>
                )}
                {tkt.status === "closed" && (
                  <span className="text-[10px] italic text-muted-foreground">✓ Ticket đã kết thúc giao dịch và đóng lại</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {tickets.length === 0 && (
          <div className="border border-dashed border-border/80 py-16 text-center text-xs text-muted-foreground italic rounded-xl">
            Chưa ghi nhận sự cố hay khiếu nại nào từ khách hàng.
          </div>
        )}
      </div>

      {/* Add Ticket Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500" /> Tiếp nhận sự cố / Khiếu nại mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ghi nhận phản ánh từ khách hàng và phân loại mức độ khẩn cấp để kịp thời xử lý.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="tktTitle" className="font-semibold">Tiêu đề sự cố / Lỗi sản phẩm *</Label>
              <Input
                id="tktTitle"
                className="h-8"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ví dụ: Thiếu 20 sticker nhãn mác"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tktCustName" className="font-semibold">Tên khách hàng phản ánh *</Label>
                <Input
                  id="tktCustName"
                  className="h-8"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Ví dụ: Chị Lan"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tktPhone" className="font-semibold">Số điện thoại liên hệ</Label>
                <Input
                  id="tktPhone"
                  className="h-8"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0934..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Mức độ khẩn cấp</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Độ ưu tiên..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  <SelectItem value="low">Thấp (Tư vấn thêm)</SelectItem>
                  <SelectItem value="medium">Trung bình (Sai sót nhẹ)</SelectItem>
                  <SelectItem value="high">Gấp (Lỗi in ấn / đền bù gấp)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tktDesc" className="font-semibold">Chi tiết phản ánh lỗi</Label>
              <Textarea
                id="tktDesc"
                className="min-h-[90px] text-xs"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ví dụ: Khách báo khi nhận thùng hàng thấy rách băng keo và thiếu 20 sticker, yêu cầu in bù..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">
                Tạo Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

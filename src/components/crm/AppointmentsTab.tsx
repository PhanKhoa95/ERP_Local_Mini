import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Calendar, Clock, User, Phone, CheckCircle, XCircle } from "lucide-react";

interface AppointmentsTabProps {
  appointments: any[];
  createAppointment: any;
  updateAppointmentStatus: any;
}

const statusLabels: Record<string, string> = {
  scheduled: "Chờ gặp",
  completed: "Đã xong ✓",
  cancelled: "Đã hủy ✗"
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900"
};

export function AppointmentsTab({ appointments, createAppointment, updateAppointmentStatus }: AppointmentsTabProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    appointment_time: "",
    purpose: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.appointment_time) return;
    await createAppointment.mutateAsync({
      customer_name: formData.customer_name,
      phone: formData.phone || null,
      appointment_time: new Date(formData.appointment_time).toISOString(),
      status: "scheduled",
      purpose: formData.purpose || null
    });
    setFormData({ customer_name: "", phone: "", appointment_time: "", purpose: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Calendar className="h-4.5 w-4.5 text-indigo-500" /> Quản lý Lịch hẹn & Chăm sóc khách hàng
          </h2>
          <p className="text-[11px] text-muted-foreground">Theo dõi và lên lịch các cuộc gặp trực tiếp, gọi điện thoại tư vấn</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
          <Plus className="h-3.5 w-3.5" /> Tạo lịch hẹn mới
        </Button>
      </div>

      {/* Appointments List Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.map((apt) => (
          <Card key={apt.id} className="border border-border/80 hover:border-indigo-500/40 shadow-sm hover:shadow transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <User className="h-3.5 w-3.5 text-indigo-500" /> {apt.customer_name}
                  </div>
                  {apt.phone && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {apt.phone}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={`text-[9px] font-bold border-none px-2 py-0.5 rounded-full ${statusColors[apt.status]}`}>
                  {statusLabels[apt.status] || apt.status}
                </Badge>
              </div>

              {/* Time block */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground bg-slate-50 dark:bg-slate-900/40 border p-2.5 rounded-lg">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-semibold">{new Date(apt.appointment_time).toLocaleDateString("vi-VN")}</span>
                </div>
                <div className="flex items-center gap-1 border-l pl-3">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-semibold">{new Date(apt.appointment_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              {/* Purpose */}
              {apt.purpose && (
                <p className="text-xs text-foreground bg-slate-50/50 dark:bg-slate-900/20 p-2.5 rounded-xl italic">
                  "{apt.purpose}"
                </p>
              )}

              {/* Actions */}
              {apt.status === "scheduled" && (
                <div className="flex gap-2 justify-end border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateAppointmentStatus.mutateAsync({ id: apt.id, status: "cancelled" })}
                    className="h-7 text-[10px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Hủy lịch
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateAppointmentStatus.mutateAsync({ id: apt.id, status: "completed" })}
                    className="h-7 text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Hoàn thành
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {appointments.length === 0 && (
          <div className="md:col-span-2 border border-dashed border-border/80 py-16 text-center text-xs text-muted-foreground italic rounded-xl">
            Chưa ghi nhận lịch hẹn gặp/tư vấn nào.
          </div>
        )}
      </div>

      {/* Add Appointment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-indigo-500" /> Tạo lịch hẹn mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lên lịch cuộc hẹn gọi điện, demo, hoặc gặp trực tiếp để chăm sóc khách hàng.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="aptCustName" className="font-semibold">Tên khách hàng *</Label>
              <Input
                id="aptCustName"
                className="h-8"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Ví dụ: Anh Nguyễn Văn A"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="aptPhone" className="font-semibold">Số điện thoại</Label>
                <Input
                  id="aptPhone"
                  className="h-8"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="aptTime" className="font-semibold">Thời gian hẹn *</Label>
                <Input
                  id="aptTime"
                  type="datetime-local"
                  className="h-8"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="aptPurpose" className="font-semibold">Nội dung cuộc gặp / mục đích</Label>
              <Textarea
                id="aptPurpose"
                className="min-h-[80px] text-xs"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Ví dụ: Gọi điện lúc 14h để khảo sát xem khách có cần hỗ trợ in thử mẫu sticker hay không..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">
                Tạo lịch hẹn
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

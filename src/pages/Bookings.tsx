import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookings, Booking } from "@/hooks/useBookings";
import { BookingDialog } from "@/components/bookings/BookingDialog";
import { BookingCalendar } from "@/components/bookings/BookingCalendar";
import { CheckInDialog } from "@/components/bookings/CheckInDialog";
import { Plus, Calendar, List, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

const statusMap: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Chờ xác nhận", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", icon: CheckCircle, color: "bg-blue-100 text-blue-800" },
  checked_in: { label: "Check-in", icon: CheckCircle, color: "bg-purple-100 text-purple-800" },
  completed: { label: "Hoàn thành", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy", icon: XCircle, color: "bg-red-100 text-red-800" },
  no_show: { label: "Vắng mặt", icon: XCircle, color: "bg-muted text-muted-foreground" },
};

export default function Bookings() {
  const { bookings, isLoading } = useBookings();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    today: bookings.filter(b => {
      const d = new Date(b.start_time);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Đặt lịch đa năng</h1>
            <p className="text-muted-foreground">Quản lý lịch hẹn theo ngành với Voucher & Token tự động</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Đặt lịch mới
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Tổng đặt lịch</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Chờ xác nhận</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.today}</p>
            <p className="text-xs text-muted-foreground">Hôm nay</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-1"><Calendar className="h-4 w-4" /> Lịch</TabsTrigger>
            <TabsTrigger value="list" className="gap-1"><List className="h-4 w-4" /> Danh sách</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card><CardContent className="p-4">
              <BookingCalendar bookings={bookings} onSelect={setSelectedBooking} />
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="list">
            <Card><CardContent className="p-0">
              <div className="divide-y">
                {bookings.map(b => {
                  const s = statusMap[b.status];
                  return (
                    <button key={b.id} onClick={() => setSelectedBooking(b)} className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{b.resource_name}</p>
                        <p className="text-sm text-muted-foreground">{b.customer_name} • {format(new Date(b.start_time), "HH:mm dd/MM/yyyy")}</p>
                      </div>
                      <Badge className={s?.color || ""}>{s?.label || b.status}</Badge>
                    </button>
                  );
                })}
                {bookings.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">{isLoading ? "Đang tải..." : "Chưa có đặt lịch nào"}</p>
                )}
              </div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      <BookingDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CheckInDialog open={!!selectedBooking} onOpenChange={o => !o && setSelectedBooking(null)} booking={selectedBooking} />
    </MainLayout>
  );
}

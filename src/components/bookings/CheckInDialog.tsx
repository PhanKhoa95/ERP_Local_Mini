import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking, useBookings } from "@/hooks/useBookings";
import { CheckCircle, Gift, Coins, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

export function CheckInDialog({ open, onOpenChange, booking }: Props) {
  const { updateBookingStatus } = useBookings();

  if (!booking) return null;

  const handleAction = (status: string) => {
    updateBookingStatus.mutate({ id: booking.id, status }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết đặt lịch</DialogTitle>
          <DialogDescription>{booking.resource_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Khách:</span>
              <p className="font-medium">{booking.customer_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">SĐT:</span>
              <p className="font-medium">{booking.customer_phone || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Bắt đầu:</span>
              <p className="font-medium">{format(new Date(booking.start_time), "HH:mm dd/MM/yyyy")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Kết thúc:</span>
              <p className="font-medium">{format(new Date(booking.end_time), "HH:mm dd/MM/yyyy")}</p>
            </div>
          </div>

          {(booking.voucher_on_complete || booking.token_reward_on_complete > 0) && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">Phần thưởng khi hoàn thành:</p>
              {booking.voucher_on_complete && (
                <div className="flex items-center gap-1 text-sm">
                  <Gift className="h-3.5 w-3.5 text-pink-500" />
                  <span>Voucher giảm {booking.voucher_discount}%</span>
                </div>
              )}
              {booking.token_reward_on_complete > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                  <span>+{booking.token_reward_on_complete} Token</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {booking.status === "pending" && (
            <Button onClick={() => handleAction("confirmed")} variant="outline" className="gap-1">Xác nhận</Button>
          )}
          {(booking.status === "pending" || booking.status === "confirmed") && (
            <Button onClick={() => handleAction("checked_in")} variant="outline" className="gap-1">
              <CheckCircle className="h-4 w-4" /> Check-in
            </Button>
          )}
          {booking.status === "checked_in" && (
            <Button onClick={() => handleAction("completed")} className="gap-1" disabled={updateBookingStatus.isPending}>
              {updateBookingStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Hoàn thành (+ Phần thưởng)
            </Button>
          )}
          {booking.status !== "completed" && booking.status !== "cancelled" && (
            <Button onClick={() => handleAction("cancelled")} variant="destructive" size="sm">Hủy lịch</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

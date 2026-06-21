import { Booking } from "@/hooks/useBookings";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  bookings: Booking[];
  onSelect?: (booking: Booking) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-300",
  confirmed: "bg-blue-500/20 text-blue-700 border-blue-300",
  checked_in: "bg-purple-500/20 text-purple-700 border-purple-300",
  completed: "bg-green-500/20 text-green-700 border-green-300",
  cancelled: "bg-muted text-muted-foreground",
};

export function BookingCalendar({ bookings, onSelect }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am - 18pm

  const getBookingsForSlot = (day: Date, hour: number) => {
    return bookings.filter(b => {
      const start = parseISO(b.start_time);
      return isSameDay(start, day) && start.getHours() === hour && b.status !== "cancelled";
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(d => addDays(d, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm">
          {format(weekStart, "dd/MM", { locale: vi })} - {format(addDays(weekStart, 6), "dd/MM/yyyy", { locale: vi })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(d => addDays(d, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 min-w-[700px]">
          {/* Header */}
          <div className="p-2 text-xs font-medium text-muted-foreground border-b">Giờ</div>
          {days.map(d => (
            <div key={d.toISOString()} className={`p-2 text-xs font-medium text-center border-b ${isSameDay(d, new Date()) ? "bg-primary/10 text-primary" : ""}`}>
              {format(d, "EEE dd/MM", { locale: vi })}
            </div>
          ))}

          {/* Cells */}
          {hours.map(h => (
            <>
              <div key={`h-${h}`} className="p-1 text-xs text-muted-foreground border-r border-b flex items-start pt-2">{h}:00</div>
              {days.map(d => {
                const slotBookings = getBookingsForSlot(d, h);
                return (
                  <div key={`${d.toISOString()}-${h}`} className="p-0.5 border-b border-r min-h-[48px]">
                    {slotBookings.map(b => (
                      <button key={b.id} onClick={() => onSelect?.(b)} className={`w-full text-left text-[10px] p-1 rounded border mb-0.5 truncate ${statusColors[b.status] || ""}`}>
                        {b.resource_name} - {b.customer_name}
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

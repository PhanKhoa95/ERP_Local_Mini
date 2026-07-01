import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { invalidateBookingRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface Booking {
  id: string;
  company_id: string;
  booking_type: string;
  resource_type: string;
  resource_name: string;
  resource_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  industry: string;
  vneid_hash?: string;
  voucher_on_complete: boolean;
  voucher_discount: number;
  token_reward_on_complete: number;
  offline_queued: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const INDUSTRY_RESOURCES: Record<string, { types: string[]; labels: Record<string, string> }> = {
  real_estate: { types: ["property", "room", "agent"], labels: { property: "Bất động sản", room: "Phòng tư vấn", agent: "Tư vấn viên" } },
  manufacturing: { types: ["machine", "vehicle", "worker"], labels: { machine: "Máy móc", vehicle: "Phương tiện", worker: "Nhân công" } },
  services: { types: ["room", "consultant", "equipment"], labels: { room: "Phòng", consultant: "Tư vấn viên", equipment: "Thiết bị" } },
  retail: { types: ["room", "consultant"], labels: { room: "Phòng", consultant: "Nhân viên" } },
  tech: { types: ["room", "consultant", "equipment"], labels: { room: "Phòng họp", consultant: "Kỹ sư", equipment: "Thiết bị" } },
  healthcare: { types: ["doctor", "room", "equipment"], labels: { doctor: "Bác sĩ", room: "Phòng khám", equipment: "Thiết bị y tế" } },
  construction: { types: ["machine", "vehicle", "worker"], labels: { machine: "Máy công trình", vehicle: "Xe vận chuyển", worker: "Nhân công" } },
};

const LOCAL_BOOKINGS_KEY = "erp-mini-local-demo-bookings";

export function getIndustryResources(industry: string) {
  return INDUSTRY_RESOURCES[industry] || INDUSTRY_RESOURCES.services;
}

function getLocalBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalBookings(bookings: Booking[]) {
  localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(bookings));
}

export function useBookings() {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", companyId],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalBookings().filter(b => b.company_id === companyId);
      }
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("company_id", companyId!)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!companyId,
  });

  const createBooking = useMutation({
    mutationFn: async (booking: Partial<Booking>) => {
      if (isLocalDemoAuthEnabled()) {
        const list = getLocalBookings();
        // Conflict check
        const conflicts = list.filter(b => 
          b.company_id === companyId &&
          b.resource_name === booking.resource_name &&
          b.status !== "cancelled" &&
          (
            (booking.start_time! >= b.start_time && booking.start_time! < b.end_time) ||
            (booking.end_time! > b.start_time && booking.end_time! <= b.end_time) ||
            (booking.start_time! <= b.start_time && booking.end_time! >= b.end_time)
          )
        );
        if (conflicts.length > 0) {
          throw new Error(`Trùng lịch với: ${conflicts.map((c: any) => c.customer_name).join(", ")}`);
        }

        const newBooking: Booking = {
          id: `bk-${Date.now()}`,
          company_id: companyId!,
          booking_type: booking.booking_type || "consultation",
          resource_type: booking.resource_type || "consultant",
          resource_name: booking.resource_name || "",
          resource_id: booking.resource_id,
          customer_name: booking.customer_name || "",
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email,
          start_time: booking.start_time!,
          end_time: booking.end_time!,
          status: booking.status || "confirmed",
          notes: booking.notes,
          industry: booking.industry || "services",
          vneid_hash: booking.vneid_hash,
          voucher_on_complete: booking.voucher_on_complete ?? false,
          voucher_discount: booking.voucher_discount ?? 0,
          token_reward_on_complete: booking.token_reward_on_complete ?? 0,
          offline_queued: booking.offline_queued ?? false,
          created_by: user?.id || "current-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        list.unshift(newBooking);
        saveLocalBookings(list);
        return newBooking;
      }

      // Check conflict first via edge function
      const { data: conflictData } = await supabase.functions.invoke("manage-bookings", {
        body: {
          action: "check_conflict",
          company_id: companyId,
          resource_name: booking.resource_name,
          start_time: booking.start_time,
          end_time: booking.end_time,
        },
      });

      if (conflictData?.has_conflict) {
        throw new Error(`Trùng lịch với: ${conflictData.conflicts.map((c: any) => c.customer_name).join(", ")}`);
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert({ ...booking, company_id: companyId!, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateBookingRelated(qc);
      toast({ title: "Đặt lịch thành công" });
    },
    onError: (e: any) => toast({ title: "Lỗi đặt lịch", description: e.message, variant: "destructive" }),
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const list = getLocalBookings();
        const idx = list.findIndex(b => b.id === id);
        if (idx === -1) throw new Error("Không tìm thấy lịch đặt");
        
        list[idx].status = status;
        list[idx].updated_at = new Date().toISOString();
        saveLocalBookings(list);
        
        let voucher = null;
        let token_issued = 0;
        
        if (status === "completed" && list[idx].voucher_on_complete) {
          voucher = { code: `VC-${Math.floor(1000 + Math.random() * 9000)}` };
          token_issued = list[idx].token_reward_on_complete || 10;
        }
        
        return { ...list[idx], voucher, token_issued };
      }

      if (status === "completed") {
        const { data, error } = await supabase.functions.invoke("manage-bookings", {
          body: { action: "complete_booking", booking_id: id },
        });
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("bookings")
        .update({ status } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidateBookingRelated(qc);
      const msgs: string[] = ["Cập nhật thành công"];
      if (data?.voucher) msgs.push(`Voucher: ${data.voucher.code}`);
      if (data?.token_issued) msgs.push(`+${data.token_issued} Token`);
      toast({ title: msgs.join(" | ") });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return { bookings, isLoading, createBooking, updateBookingStatus };
}

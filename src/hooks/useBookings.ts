import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { invalidateBookingRelated } from "@/lib/queryInvalidation";

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

export function getIndustryResources(industry: string) {
  return INDUSTRY_RESOURCES[industry] || INDUSTRY_RESOURCES.services;
}

export function useBookings() {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", companyId],
    queryFn: async () => {
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
      // Check conflict first
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

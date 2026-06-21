import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export function useVouchers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { companyId } = useCompanyContext();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["vouchers", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vouchers") as any)
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Voucher[];
    },
  });

  const createVoucher = useMutation({
    mutationFn: async (voucher: Omit<Voucher, "id" | "used_count" | "created_at">) => {
      if (!companyId) throw new Error("No company");
      const { data, error } = await supabase.from("vouchers").insert({ ...voucher, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({ title: "Tạo mã giảm giá thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateVoucher = useMutation({
    mutationFn: async ({ id, ...voucher }: Partial<Voucher> & { id: string }) => {
      const { data, error } = await supabase.from("vouchers").update(voucher).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({ title: "Cập nhật mã giảm giá thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteVoucher = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vouchers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({ title: "Xóa mã giảm giá thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const validateVoucher = async (code: string, orderTotal: number): Promise<{ valid: boolean; voucher?: Voucher; discount?: number; message?: string }> => {
    if (!companyId) return { valid: false, message: "Không xác định được công ty" };
    const { data, error } = await (supabase
      .from("vouchers") as any)
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single();

    if (error || !data) return { valid: false, message: "Mã giảm giá không tồn tại" };

    const voucher = data as Voucher;
    const now = new Date();

    if (voucher.start_date && new Date(voucher.start_date) > now) {
      return { valid: false, message: "Mã giảm giá chưa có hiệu lực" };
    }

    if (voucher.end_date && new Date(voucher.end_date) < now) {
      return { valid: false, message: "Mã giảm giá đã hết hạn" };
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return { valid: false, message: "Mã giảm giá đã hết lượt sử dụng" };
    }

    if (voucher.min_order_value && orderTotal < voucher.min_order_value) {
      return { valid: false, message: `Đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString()}đ` };
    }

    let discount = voucher.discount_type === "percentage"
      ? orderTotal * (voucher.discount_value / 100)
      : voucher.discount_value;

    if (voucher.max_discount && discount > voucher.max_discount) {
      discount = voucher.max_discount;
    }

    return { valid: true, voucher, discount };
  };

  const applyVoucher = async (voucherId: string) => {
    const { data } = await supabase.from("vouchers").select("used_count").eq("id", voucherId).single();
    if (data) {
      await supabase.from("vouchers").update({ used_count: (data.used_count || 0) + 1 }).eq("id", voucherId);
    }
  };

  return {
    vouchers,
    isLoading,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    validateVoucher,
    applyVoucher,
  };
}

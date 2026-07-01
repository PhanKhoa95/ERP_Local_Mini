import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

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
  // Extended fields stored in JSON description
  is_auto_apply?: boolean;
  target_customer_group?: "all" | "loyalty" | "wholesale";
  promo_type?: "order_discount" | "free_shipping" | "buy_x_get_y";
  target_product_id?: string;
}

const LOCAL_KEY = "erp-mini-local-vouchers";

// Helper to parse extended properties from voucher description
export function parseVoucherMetadata(voucher: any): Voucher {
  let is_auto_apply = false;
  let target_customer_group: "all" | "loyalty" | "wholesale" = "all";
  let promo_type: "order_discount" | "free_shipping" | "buy_x_get_y" = "order_discount";
  let target_product_id = "";
  let cleanDescription = voucher.description || "";

  if (voucher.description && voucher.description.trim().startsWith("{")) {
    try {
      const meta = JSON.parse(voucher.description);
      is_auto_apply = meta.is_auto_apply ?? false;
      target_customer_group = meta.target_customer_group ?? "all";
      promo_type = meta.promo_type ?? "order_discount";
      target_product_id = meta.target_product_id ?? "";
      cleanDescription = meta.description ?? "";
    } catch (e) {
      // Ignored
    }
  }

  return {
    ...voucher,
    is_auto_apply,
    target_customer_group,
    promo_type,
    target_product_id,
    description: cleanDescription,
  };
}

// Helper to serialize metadata for Supabase save
export function serializeVoucherMetadata(voucher: Omit<Voucher, "id" | "used_count" | "created_at">): any {
  const meta = {
    is_auto_apply: voucher.is_auto_apply ?? false,
    target_customer_group: voucher.target_customer_group ?? "all",
    promo_type: voucher.promo_type ?? "order_discount",
    target_product_id: voucher.target_product_id ?? "",
    description: voucher.description ?? "",
  };
  return {
    ...voucher,
    description: JSON.stringify(meta),
  };
}

function getLocalVouchers(): Voucher[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    const seed = [
      {
        id: "v-seed-1",
        code: "SIEUDEAL",
        name: "Siêu ưu đãi 10%",
        description: JSON.stringify({
          description: "Giảm 10% cho tất cả các đơn hàng",
          is_auto_apply: false,
          target_customer_group: "all",
          promo_type: "order_discount",
          target_product_id: ""
        }),
        discount_type: "percentage" as const,
        discount_value: 10,
        min_order_value: 0,
        max_discount: 100000,
        usage_limit: 100,
        used_count: 5,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: "v-seed-2",
        code: "AUTO10",
        name: "Tự động giảm 10% đơn từ 200k",
        description: JSON.stringify({
          description: "Tự động áp dụng giảm 10% khi mua hóa đơn trên 200k tại POS",
          is_auto_apply: true,
          target_customer_group: "all",
          promo_type: "order_discount",
          target_product_id: ""
        }),
        discount_type: "percentage" as const,
        discount_value: 10,
        min_order_value: 200000,
        max_discount: 50000,
        usage_limit: 500,
        used_count: 12,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: "v-seed-3",
        code: "FREESHIP",
        name: "Tự động giảm 30k ship đơn từ 500k",
        description: JSON.stringify({
          description: "Tự động giảm phí vận chuyển cho đơn hàng lớn",
          is_auto_apply: true,
          target_customer_group: "all",
          promo_type: "free_shipping",
          target_product_id: ""
        }),
        discount_type: "fixed" as const,
        discount_value: 30000,
        min_order_value: 500000,
        max_discount: 30000,
        usage_limit: 1000,
        used_count: 34,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(seed));
    return seed.map(parseVoucherMetadata);
  }
  try {
    const list = JSON.parse(raw);
    return list.map(parseVoucherMetadata);
  } catch {
    return [];
  }
}

function saveLocalVouchers(list: Voucher[]) {
  const serialized = list.map(item => {
    // Re-serialize description metadata
    const meta = {
      is_auto_apply: item.is_auto_apply ?? false,
      target_customer_group: item.target_customer_group ?? "all",
      promo_type: item.promo_type ?? "order_discount",
      target_product_id: item.target_product_id ?? "",
      description: item.description ?? "",
    };
    return {
      ...item,
      description: JSON.stringify(meta)
    };
  });
  localStorage.setItem(LOCAL_KEY, JSON.stringify(serialized));
}

export function useVouchers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { companyId } = useCompanyContext();

  const isDemo = isLocalDemoAuthEnabled();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["vouchers", companyId, isDemo],
    queryFn: async () => {
      if (isDemo) {
        return getLocalVouchers();
      }
      if (!companyId) return [];
      const { data, error } = await (supabase
        .from("vouchers") as any)
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(parseVoucherMetadata);
    },
  });

  const createVoucher = useMutation({
    mutationFn: async (voucher: Omit<Voucher, "id" | "used_count" | "created_at">) => {
      if (isDemo) {
        const list = getLocalVouchers();
        const newVoucher: Voucher = {
          ...voucher,
          id: "v-local-" + Math.random().toString(36).substr(2, 9),
          used_count: 0,
          created_at: new Date().toISOString()
        };
        list.unshift(newVoucher);
        saveLocalVouchers(list);
        return newVoucher;
      }
      if (!companyId) throw new Error("No company");
      const serialized = serializeVoucherMetadata(voucher);
      const { data, error } = await supabase.from("vouchers").insert({ ...serialized, company_id: companyId }).select().single();
      if (error) throw error;
      return parseVoucherMetadata(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({ title: "Tạo chương trình khuyến mãi thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateVoucher = useMutation({
    mutationFn: async ({ id, ...voucher }: Partial<Voucher> & { id: string }) => {
      if (isDemo) {
        const list = getLocalVouchers();
        const updatedList = list.map(item => {
          if (item.id === id) {
            return { ...item, ...voucher } as Voucher;
          }
          return item;
        });
        saveLocalVouchers(updatedList);
        return updatedList.find(i => i.id === id);
      }
      // Re-serialize metadata if fields exist in patch
      const patch: any = { ...voucher };
      if (voucher.description !== undefined || voucher.is_auto_apply !== undefined || voucher.promo_type !== undefined || voucher.target_customer_group !== undefined || voucher.target_product_id !== undefined) {
        const meta = {
          is_auto_apply: voucher.is_auto_apply ?? false,
          target_customer_group: voucher.target_customer_group ?? "all",
          promo_type: voucher.promo_type ?? "order_discount",
          target_product_id: voucher.target_product_id ?? "",
          description: voucher.description ?? "",
        };
        patch.description = JSON.stringify(meta);
      }
      const { data, error } = await supabase.from("vouchers").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return parseVoucherMetadata(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({ title: "Cập nhật chương trình khuyến mãi thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteVoucher = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        const list = getLocalVouchers();
        const filtered = list.filter(item => item.id !== id);
        saveLocalVouchers(filtered);
        return;
      }
      const { error } = await supabase.from("vouchers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({ title: "Xóa chương trình khuyến mãi thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const validateVoucher = async (code: string, orderTotal: number): Promise<{ valid: boolean; voucher?: Voucher; discount?: number; message?: string }> => {
    let voucher: Voucher | undefined;

    if (isDemo) {
      const list = getLocalVouchers();
      voucher = list.find(v => v.code === code.toUpperCase() && v.is_active);
    } else {
      if (!companyId) return { valid: false, message: "Không xác định được công ty" };
      const { data, error } = await (supabase
        .from("vouchers") as any)
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("company_id", companyId)
        .eq("is_active", true)
        .single();
      if (!error && data) {
        voucher = parseVoucherMetadata(data);
      }
    }

    if (!voucher) return { valid: false, message: "Mã giảm giá không tồn tại hoặc đã bị khóa" };

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
    if (isDemo) {
      const list = getLocalVouchers();
      const updated = list.map(item => {
        if (item.id === voucherId) {
          return { ...item, used_count: (item.used_count || 0) + 1 };
        }
        return item;
      });
      saveLocalVouchers(updated);
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      return;
    }
    const { data } = await supabase.from("vouchers").select("used_count").eq("id", voucherId).single();
    if (data) {
      await supabase.from("vouchers").update({ used_count: (data.used_count || 0) + 1 }).eq("id", voucherId);
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
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

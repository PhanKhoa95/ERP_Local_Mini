import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

export interface PaymentConfig {
  id: string;
  company_id?: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  branch: string | null;
  qr_type: "static" | "dynamic";
  attach_qr_to_message: boolean;
  allowed_staff_ids: string[];
  created_at?: string;
  updated_at?: string;
}

const LOCAL_PAYMENT_KEY = "erp-mini-local-demo-payment-settings";

const DEFAULT_CONFIG: PaymentConfig = {
  id: "default-pay-config",
  bank_name: "MB Bank",
  account_number: "0901122334",
  account_holder: "CTY TNHH PANCAKE POS",
  branch: "Chi nhánh Hà Nội",
  qr_type: "static",
  attach_qr_to_message: true,
  allowed_staff_ids: [],
};

export function getLocalPaymentConfig(): PaymentConfig {
  const raw = localStorage.getItem(LOCAL_PAYMENT_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_PAYMENT_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
  return JSON.parse(raw);
}

export function saveLocalPaymentConfig(config: PaymentConfig) {
  localStorage.setItem(LOCAL_PAYMENT_KEY, JSON.stringify(config));
}

export function usePaymentSettings() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: config = DEFAULT_CONFIG, isLoading } = useQuery({
    queryKey: ["payment-settings", companyId],
    queryFn: async (): Promise<PaymentConfig> => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalPaymentConfig();
      }

      if (!companyId) return DEFAULT_CONFIG;

      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching payment settings:", error);
        throw error;
      }

      if (!data) {
        // Automatically create default settings if none exists in Supabase
        const { data: inserted, error: insertError } = await supabase
          .from("payment_settings")
          .insert({
            company_id: companyId,
            bank_name: "MB Bank",
            account_number: "0901122334",
            account_holder: "CTY TNHH PANCAKE POS",
            branch: "Chi nhánh Hà Nội",
            qr_type: "static",
            attach_qr_to_message: true,
            allowed_staff_ids: [],
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return inserted as unknown as PaymentConfig;
      }

      return data as unknown as PaymentConfig;
    },
  });

  const updatePaymentSettings = useMutation({
    mutationFn: async (updated: Partial<Omit<PaymentConfig, "id" | "company_id" | "created_at" | "updated_at">>) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalPaymentConfig();
        const merged = { ...local, ...updated, updated_at: new Date().toISOString() };
        saveLocalPaymentConfig(merged);
        return merged;
      }

      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      const { data, error } = await supabase
        .from("payment_settings")
        .update({
          ...updated,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings", companyId] });
      toast.success("Cấu hình thanh toán đã được cập nhật thành công!");
    },
    onError: (err) => {
      console.error("Error updating payment settings:", err);
      toast.error("Không thể lưu cấu hình. Vui lòng thử lại!");
    }
  });

  const authorizeStaff = useMutation({
    mutationFn: async (staffId: string) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalPaymentConfig();
        if (local.allowed_staff_ids.includes(staffId)) return local;
        const updated = {
          ...local,
          allowed_staff_ids: [...local.allowed_staff_ids, staffId],
          updated_at: new Date().toISOString(),
        };
        saveLocalPaymentConfig(updated);
        return updated;
      }

      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      const currentStaff = config.allowed_staff_ids || [];
      if (currentStaff.includes(staffId)) return config;

      const { data, error } = await supabase
        .from("payment_settings")
        .update({
          allowed_staff_ids: [...currentStaff, staffId],
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings", companyId] });
      toast.success("Đã cấp quyền xem lịch sử giao dịch cho nhân viên!");
    },
    onError: (err) => {
      console.error("Error authorizing staff:", err);
      toast.error("Không thể cấp quyền. Vui lòng thử lại!");
    }
  });

  const revokeStaff = useMutation({
    mutationFn: async (staffId: string) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalPaymentConfig();
        const updated = {
          ...local,
          allowed_staff_ids: local.allowed_staff_ids.filter(id => id !== staffId),
          updated_at: new Date().toISOString(),
        };
        saveLocalPaymentConfig(updated);
        return updated;
      }

      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      const currentStaff = config.allowed_staff_ids || [];
      const { data, error } = await supabase
        .from("payment_settings")
        .update({
          allowed_staff_ids: currentStaff.filter(id => id !== staffId),
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings", companyId] });
      toast.success("Đã thu hồi quyền xem lịch sử giao dịch của nhân viên!");
    },
    onError: (err) => {
      console.error("Error revoking staff:", err);
      toast.error("Không thể thu hồi quyền. Vui lòng thử lại!");
    }
  });

  return {
    config,
    isLoading,
    updatePaymentSettings,
    authorizeStaff,
    revokeStaff,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { invalidatePartnerRelated } from "@/lib/queryInvalidation";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

type Partner = Tables<"partners">;
type PartnerInsert = TablesInsert<"partners">;
type PartnerUpdate = TablesUpdate<"partners">;

const PARTNERS_KEY = "erp-mini-local-demo-partners";

function getLocalPartners(companyId: string): Partner[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PARTNERS_KEY);
  if (!raw) {
    const defaultPartners: Partner[] = [
      {
        id: "partner-customer-1",
        name: "Nguyễn Văn A",
        phone: "0901234567",
        email: "nguyenvana@gmail.com",
        address: "Biên Hòa, Đồng Nai",
        partner_type: "customer",
        code: "KH001",
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tax_id: null,
        notes: "Khách VIP",
        is_active: true,
        debt_amount: 0,
        group_id: null,
        loyalty_points: 0,
        total_spent: 0,
      },
      {
        id: "partner-supplier-1",
        name: "Công ty Cổ phần May Mặc",
        phone: "0283800000",
        email: "contact@maymac.vn",
        address: "Tân Bình, TP.HCM",
        partner_type: "supplier",
        code: "NCC001",
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tax_id: "0102030405",
        notes: "Nhà cung cấp vải",
        is_active: true,
        debt_amount: 0,
        group_id: null,
        loyalty_points: 0,
        total_spent: 0,
      }
    ];
    localStorage.setItem(PARTNERS_KEY, JSON.stringify(defaultPartners));
    return defaultPartners;
  }
  try {
    return JSON.parse(raw) as Partner[];
  } catch {
    return [];
  }
}

function saveLocalPartners(partners: Partner[]) {
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners));
}

export function usePartners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: partners = [], isLoading, error } = useQuery({
    queryKey: ["partners", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalPartners(companyId);
      }
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Partner[];
    },
    enabled: !!companyId,
  });

  const customers = partners.filter(p => p.partner_type === "customer" || p.partner_type === "both");
  const suppliers = partners.filter(p => p.partner_type === "supplier" || p.partner_type === "both");

  const createPartner = useMutation({
    mutationFn: async (partner: PartnerInsert) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalPartners(companyId || "");
        const newPartner: Partner = {
          id: `partner-${Date.now()}`,
          name: partner.name,
          phone: partner.phone ?? null,
          email: partner.email ?? null,
          address: partner.address ?? null,
          partner_type: partner.partner_type ?? "customer",
          code: partner.code || `KH-${Date.now().toString().slice(-4)}`,
          company_id: companyId || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tax_id: partner.tax_id ?? null,
          notes: partner.notes ?? null,
          is_active: partner.is_active ?? true,
          debt_amount: 0,
          group_id: null,
          loyalty_points: 0,
          total_spent: 0,
        };
        saveLocalPartners([newPartner, ...local]);
        return newPartner;
      }

      const { data, error } = await supabase
        .from("partners")
        .insert({ ...partner, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidatePartnerRelated(queryClient);
      toast({ title: "Thêm đối tác thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updatePartner = useMutation({
    mutationFn: async ({ id, ...updates }: PartnerUpdate & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalPartners(companyId || "");
        const idx = local.findIndex(p => p.id === id);
        if (idx >= 0) {
          local[idx] = {
            ...local[idx],
            ...updates,
            updated_at: new Date().toISOString(),
          } as Partner;
          saveLocalPartners(local);
          return local[idx];
        }
        throw new Error("Không tìm thấy đối tác local");
      }

      const { data, error } = await supabase
        .from("partners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidatePartnerRelated(queryClient);
      toast({ title: "Cập nhật đối tác thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deletePartner = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalPartners(companyId || "");
        saveLocalPartners(local.filter(p => p.id !== id));
        return;
      }

      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePartnerRelated(queryClient);
      toast({ title: "Xóa đối tác thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return {
    partners,
    customers,
    suppliers,
    isLoading,
    error,
    createPartner,
    updatePartner,
    deletePartner,
  };
}

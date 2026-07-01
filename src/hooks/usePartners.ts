import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { invalidatePartnerRelated } from "@/lib/queryInvalidation";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { logLocalAction } from "@/lib/localInventoryStore";

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
        id: "partner-retail",
        name: "Chuỗi Trà Sữa X (Khách hàng dự án)",
        phone: "0901234567",
        email: "contact@trasuax.vn",
        address: "Quận 1, TP.HCM",
        partner_type: "customer",
        code: "KH-TRASUAX",
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tax_id: "0314982341",
        notes: "Khách hàng dịch vụ in ấn decal trọn gói theo hợp đồng HD-2026-NIN-001",
        is_active: true,
        debt_amount: 5000000, // Remaining milestone balance of 5,000,000đ
        group_id: null,
        loyalty_points: 150,
        total_spent: 15000000,
      },
      {
        id: "partner-supplier-a",
        name: "NCC Thiết bị In ấn Hải Âu",
        phone: "0283800001",
        email: "sales@haiau-printer.vn",
        address: "Quận 10, TP.HCM",
        partner_type: "supplier",
        code: "NCC-EQ",
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tax_id: "0102030405",
        notes: "Nhà cung ứng máy in màu Epson L8050 và máy cán màng",
        is_active: true,
        debt_amount: 0,
        group_id: null,
        loyalty_points: 0,
        total_spent: 9500000,
      },
      {
        id: "partner-supplier-b",
        name: "NCC Vật tư In ấn Trường Thịnh",
        phone: "0283800002",
        email: "vat-tu@truongthinh-ink.vn",
        address: "Bình Tân, TP.HCM",
        partner_type: "supplier",
        code: "NCC-MAT",
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tax_id: "0102030406",
        notes: "Nhà cung cấp giấy decal A4 và mực in chai Epson chính hãng",
        is_active: true,
        debt_amount: 0,
        group_id: null,
        loyalty_points: 0,
        total_spent: 10000000,
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
        logLocalAction("Tạo đối tác mới", "partners", newPartner.id, null, { name: newPartner.name, type: newPartner.partner_type, code: newPartner.code });
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
          logLocalAction("Cập nhật đối tác", "partners", id, null, updates);
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
        logLocalAction("Xóa đối tác", "partners", id, null, null);
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

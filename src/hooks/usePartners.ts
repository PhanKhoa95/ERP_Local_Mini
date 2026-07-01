import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { logLocalAction } from "@/utils/offlineLogs";
import type { Database } from "@/integrations/supabase/types";

export interface Partner {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  partner_type: "customer" | "supplier" | "both";
  company_id: string | null;
  created_at: string;
  updated_at: string;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean | null;
  debt_amount: number | null;
  group_id: string | null;
  loyalty_points: number | null;
  total_spent: number | null;
  // Extended fields stored inside notes column
  branch_id?: string;
  warehouse_id?: string;
  promo_segment?: "all" | "loyalty" | "wholesale";
}

// Helpers to serialize and deserialize partner metadata in notes field
export function parsePartnerMetadata(partner: any): Partner {
  let branch_id = "";
  let warehouse_id = "";
  let promo_segment: "all" | "loyalty" | "wholesale" = "all";
  let cleanNotes = partner.notes || "";

  if (partner.notes && partner.notes.trim().startsWith("{")) {
    try {
      const meta = JSON.parse(partner.notes);
      branch_id = meta.branch_id ?? "";
      warehouse_id = meta.warehouse_id ?? "";
      promo_segment = meta.promo_segment ?? "all";
      cleanNotes = meta.notes ?? "";
    } catch (e) {
      // Ignored
    }
  }

  return {
    ...partner,
    branch_id,
    warehouse_id,
    promo_segment,
    notes: cleanNotes,
  };
}

export function serializePartnerMetadata(partner: any, existingNotes?: string | null): any {
  let existingMeta: any = {};
  if (existingNotes && existingNotes.trim().startsWith("{")) {
    try {
      existingMeta = JSON.parse(existingNotes);
    } catch (e) {}
  }

  const meta = {
    branch_id: partner.branch_id !== undefined ? partner.branch_id : (existingMeta.branch_id ?? ""),
    warehouse_id: partner.warehouse_id !== undefined ? partner.warehouse_id : (existingMeta.warehouse_id ?? ""),
    promo_segment: partner.promo_segment !== undefined ? partner.promo_segment : (existingMeta.promo_segment ?? "all"),
    notes: partner.notes !== undefined ? partner.notes : (existingMeta.notes ?? ""),
  };

  const { branch_id, warehouse_id, promo_segment, ...rest } = partner;
  return {
    ...rest,
    notes: JSON.stringify(meta),
  };
}

const PARTNERS_KEY = "erp-mini-local-demo-partners";

const DEFAULT_PARTNERS: any[] = [
  {
    id: "p-seed-1",
    name: "Cửa hàng Thời trang BlueSky",
    phone: "0901234567",
    email: "contact@bluesky.vn",
    address: "123 Lê Lợi, Quận 1, TP. HCM",
    partner_type: "customer",
    code: "KH-BLUESKY",
    company_id: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tax_id: "0102030405",
    notes: JSON.stringify({
      notes: "Khách hàng mua sỉ thân thiết",
      branch_id: "Chi nhánh miền Nam",
      warehouse_id: "",
      promo_segment: "wholesale"
    }),
    is_active: true,
    debt_amount: 15000000,
    group_id: null,
    loyalty_points: 450,
    total_spent: 85000000,
  },
  {
    id: "p-seed-2",
    name: "Công ty Cổ phần Techcom",
    phone: "0243987654",
    email: "info@techcom.vn",
    address: "45 Lý Thường Kiệt, Quận Hoàn Kiếm, Hà Nội",
    partner_type: "customer",
    code: "KH-TECHCOM",
    company_id: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tax_id: "0109998887",
    notes: JSON.stringify({
      notes: "Thành viên loyalty VIP",
      branch_id: "Chi nhánh miền Bắc",
      warehouse_id: "",
      promo_segment: "loyalty"
    }),
    is_active: true,
    debt_amount: 0,
    group_id: null,
    loyalty_points: 1200,
    total_spent: 124000000,
  },
  {
    id: "p-seed-3",
    name: "Tổng kho Phụ kiện Phương Nam",
    phone: "0988776655",
    email: "kho@phuongnam.vn",
    address: "789 Nguyễn Văn Linh, Quận 7, TP. HCM",
    partner_type: "supplier",
    code: "NCC-PHUONGNAM",
    company_id: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tax_id: "0103332221",
    notes: JSON.stringify({
      notes: "Nhà cung cấp phụ kiện chính",
      branch_id: "Chi nhánh miền Nam",
      warehouse_id: "wh-seed-1",
      promo_segment: "all"
    }),
    is_active: true,
    debt_amount: -25000000,
    group_id: null,
    loyalty_points: 0,
    total_spent: 340000000,
  }
];

function getLocalPartners(companyId: string): Partner[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PARTNERS_KEY);
  if (!raw) {
    const list = DEFAULT_PARTNERS.map(p => ({ ...p, company_id: companyId }));
    localStorage.setItem(PARTNERS_KEY, JSON.stringify(list));
    return list.map(parsePartnerMetadata);
  }
  try {
    const list = JSON.parse(raw);
    return list.map(parsePartnerMetadata);
  } catch {
    return [];
  }
}

function saveLocalPartners(partners: Partner[]) {
  const serialized = partners.map(p => {
    const meta = {
      branch_id: p.branch_id ?? "",
      warehouse_id: p.warehouse_id ?? "",
      promo_segment: p.promo_segment ?? "all",
      notes: p.notes ?? "",
    };
    return {
      ...p,
      notes: JSON.stringify(meta),
    };
  });
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(serialized));
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
      return (data || []).map(parsePartnerMetadata);
    },
    enabled: !!companyId,
  });

  const customers = partners.filter(p => p.partner_type === "customer" || p.partner_type === "both");
  const suppliers = partners.filter(p => p.partner_type === "supplier" || p.partner_type === "both");

  const createPartner = useMutation({
    mutationFn: async (partner: any) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalPartners(companyId || "");
        const newPartner: Partner = {
          ...partner,
          id: `partner-${Date.now()}`,
          company_id: companyId || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          debt_amount: 0,
          loyalty_points: 0,
          total_spent: 0,
        };
        local.unshift(newPartner);
        saveLocalPartners(local);
        logLocalAction("Tạo đối tác", "partners", newPartner.id, newPartner, null);
        return newPartner;
      }

      const serialized = serializePartnerMetadata(partner);
      const { data, error } = await supabase
        .from("partners")
        .insert({ ...serialized, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return parsePartnerMetadata(data);
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
    mutationFn: async ({ id, ...updates }: any & { id: string }) => {
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

      // Fetch existing notes to merge description JSON metadata
      const { data: existing } = await supabase.from("partners").select("notes").eq("id", id).single();
      const serialized = serializePartnerMetadata(updates, existing?.notes);

      const { data, error } = await supabase
        .from("partners")
        .update(serialized)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return parsePartnerMetadata(data);
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
        const filtered = local.filter(p => p.id !== id);
        saveLocalPartners(filtered);
        logLocalAction("Xóa đối tác", "partners", id, null, null);
        return;
      }
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", id);
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

function invalidatePartnerRelated(queryClient: any) {
  queryClient.invalidateQueries({ queryKey: ["partners"] });
}

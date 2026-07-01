import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { supabase } from "@/integrations/supabase/client";

export type PolicySegment = "loyalty" | "wholesale" | "all";
export type PolicyType = "return" | "loyalty_points" | "shipping" | "credit" | "support" | "other";

export interface SalesPolicy {
  id: string;
  segment: PolicySegment;
  type: PolicyType;
  title: string;
  description: string;
  value: number;
  unit: string; // "ngày", "%", "đ", "giờ"
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type SalesPolicyInsert = Omit<SalesPolicy, "id" | "created_at">;

const STORAGE_KEY = "erp-mini-local-demo-sales-policies";

const DEFAULT_POLICIES: SalesPolicy[] = [
  // VIP / Loyalty
  { id: "pol-1", segment: "loyalty", type: "return", title: "Đổi trả 30 ngày", description: "Miễn phí hoàn trả hàng đối với lỗi kỹ thuật hoặc không ưng ý.", value: 30, unit: "ngày", is_active: true, sort_order: 0, created_at: new Date().toISOString() },
  { id: "pol-2", segment: "loyalty", type: "loyalty_points", title: "Tích điểm VIP", description: "Hoàn 2% tổng hóa đơn dưới dạng điểm tích lũy thành viên.", value: 2, unit: "%", is_active: true, sort_order: 1, created_at: new Date().toISOString() },
  { id: "pol-3", segment: "loyalty", type: "support", title: "Hotline 24/7", description: "Kênh chăm sóc kỹ thuật đặc biệt dành riêng cho VIP.", value: 24, unit: "giờ", is_active: true, sort_order: 2, created_at: new Date().toISOString() },
  { id: "pol-4", segment: "loyalty", type: "other", title: "Tri ân VIP", description: "Quà tặng ngày sinh nhật và ưu đãi trước các sự kiện lớn.", value: 0, unit: "", is_active: true, sort_order: 3, created_at: new Date().toISOString() },

  // Wholesale / Sỉ
  { id: "pol-5", segment: "wholesale", type: "credit", title: "Hạn mức Công nợ", description: "Hỗ trợ thanh toán trả chậm gối đầu trong vòng 30 ngày.", value: 30, unit: "ngày", is_active: true, sort_order: 0, created_at: new Date().toISOString() },
  { id: "pol-6", segment: "wholesale", type: "shipping", title: "Giao hàng miễn phí", description: "Áp dụng cho các đơn hàng phân phối có giá trị từ 5,000,000đ.", value: 5000000, unit: "đ", is_active: true, sort_order: 1, created_at: new Date().toISOString() },
  { id: "pol-7", segment: "wholesale", type: "return", title: "Đổi trả phân phối", description: "15 ngày đối với các sản phẩm lỗi do nhà sản xuất.", value: 15, unit: "ngày", is_active: true, sort_order: 2, created_at: new Date().toISOString() },

  // All / Khách lẻ
  { id: "pol-8", segment: "all", type: "return", title: "Đổi trả 7 ngày", description: "Đổi mới sản phẩm đối với các lỗi kỹ thuật phát sinh.", value: 7, unit: "ngày", is_active: true, sort_order: 0, created_at: new Date().toISOString() },
  { id: "pol-9", segment: "all", type: "loyalty_points", title: "Tích điểm Loyalty", description: "Hoàn 1% giá trị hóa đơn quy đổi sang điểm thưởng.", value: 1, unit: "%", is_active: true, sort_order: 1, created_at: new Date().toISOString() },
  { id: "pol-10", segment: "all", type: "shipping", title: "Giao hàng", description: "Miễn phí ship cho đơn từ 200,000đ khi đặt mua online.", value: 200000, unit: "đ", is_active: true, sort_order: 2, created_at: new Date().toISOString() },
];

function getLocalPolicies(): SalesPolicy[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // Seed defaults on first load
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POLICIES));
    return DEFAULT_POLICIES;
  }
  return JSON.parse(raw);
}

function saveLocalPolicies(policies: SalesPolicy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
}

export const SEGMENT_LABELS: Record<PolicySegment, string> = {
  loyalty: "VIP / Loyalty",
  wholesale: "Sỉ / Phân phối",
  all: "Khách lẻ (Mặc định)",
};

export const SEGMENT_COLORS: Record<PolicySegment, string> = {
  loyalty: "text-amber-600",
  wholesale: "text-indigo-600",
  all: "text-muted-foreground",
};

export const TYPE_LABELS: Record<PolicyType, string> = {
  return: "Đổi trả",
  loyalty_points: "Tích điểm",
  shipping: "Giao hàng",
  credit: "Công nợ",
  support: "Hỗ trợ",
  other: "Khác",
};

export function useSalesPolicies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["sales-policies"],
    queryFn: async () => {
      // Always use local storage for policies (lightweight config, no DB table needed)
      return getLocalPolicies();
    },
  });

  const createPolicy = useMutation({
    mutationFn: async (policy: SalesPolicyInsert) => {
      const all = getLocalPolicies();
      const newPolicy: SalesPolicy = {
        ...policy,
        id: `pol-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      all.push(newPolicy);
      saveLocalPolicies(all);
      return newPolicy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-policies"] });
      toast({ title: "Thêm chính sách thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updatePolicy = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalesPolicy> & { id: string }) => {
      const all = getLocalPolicies();
      const idx = all.findIndex(p => p.id === id);
      if (idx === -1) throw new Error("Không tìm thấy chính sách");
      all[idx] = { ...all[idx], ...updates };
      saveLocalPolicies(all);
      return all[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-policies"] });
      toast({ title: "Cập nhật chính sách thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const deletePolicy = useMutation({
    mutationFn: async (id: string) => {
      const all = getLocalPolicies();
      saveLocalPolicies(all.filter(p => p.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-policies"] });
      toast({ title: "Xóa chính sách thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const getPoliciesForSegment = (segment: PolicySegment): SalesPolicy[] => {
    return policies
      .filter(p => p.segment === segment && p.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  return {
    policies,
    isLoading,
    createPolicy,
    updatePolicy,
    deletePolicy,
    getPoliciesForSegment,
  };
}

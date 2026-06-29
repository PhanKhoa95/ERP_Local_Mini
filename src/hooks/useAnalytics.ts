// Analytics hooks for Data Hub and BigData views
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface ChannelAttribution {
  company_id: string;
  source_type: string;
  channel_name: string | null;
  channel_code: string | null;
  channel_color: string | null;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  completed_orders: number;
  cancelled_orders: number;
  completed_revenue: number;
}

export interface CustomerCLV {
  company_id: string;
  customer_phone: string;
  customer_name: string | null;
  customer_email: string | null;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  first_purchase_date: string;
  last_purchase_date: string;
  customer_lifespan_days: number;
}

export interface CohortRetention {
  company_id: string;
  first_purchase_month: string;
  cohort_index: number;
  active_customers: number;
  total_revenue: number;
}

export function useChannelAttribution() {
  const { companyId } = useCompanyContext();
  return useQuery({
    queryKey: ["analytics", "channel-attribution", companyId],
    queryFn: async () => {
      if (!companyId) return [] as ChannelAttribution[];
      const { data, error } = await supabase
        .from("analytics_channel_attribution" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("total_revenue", { ascending: false });

      if (error) throw error;
      return data as unknown as ChannelAttribution[];
    },
    enabled: !!companyId,
  });
}

export function useCustomerCLV() {
  const { companyId } = useCompanyContext();
  return useQuery({
    queryKey: ["analytics", "customer-clv", companyId],
    queryFn: async () => {
      if (!companyId) return [] as CustomerCLV[];
      const { data, error } = await supabase
        .from("analytics_customer_clv" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("total_spent", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as unknown as CustomerCLV[];
    },
    enabled: !!companyId,
  });
}

export function useCustomerCohorts() {
  const { companyId } = useCompanyContext();
  return useQuery({
    queryKey: ["analytics", "customer-cohorts", companyId],
    queryFn: async () => {
      if (!companyId) return [] as CohortRetention[];
      const { data, error } = await supabase
        .from("analytics_customer_cohorts" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("first_purchase_month", { ascending: true })
        .order("cohort_index", { ascending: true });

      if (error) throw error;
      return data as unknown as CohortRetention[];
    },
    enabled: !!companyId,
  });
}

export function useRunDataQualityChecks() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Missing company context");

      if (isLocalDemoAuthEnabled()) {
        const QUALITY_ISSUES_KEY = "erp-mini-local-demo-data-quality-issues";
        const raw = localStorage.getItem(QUALITY_ISSUES_KEY);
        const currentIssues = raw ? JSON.parse(raw) : [];

        const openIssues = currentIssues.filter((i: any) => i.status === "open");
        const resolvedIssues = currentIssues.filter((i: any) => i.status === "resolved");

        const countNeeded = 10 - openIssues.length;
        if (countNeeded > 0) {
          const ruleCodes = [
            "RULE-SKU-RESOLUTION",
            "RULE-CUSTOMER-PHONE",
            "RULE-SHIPPING-ADDRESS",
            "RULE-PAYMENT-METHOD",
            "RULE-BOM-INTEGRITY",
            "RULE-LEDGER-BALANCE",
            "RULE-STOCK-DISCREPANCY",
            "RULE-PAYROLL-CONFIG",
            "RULE-KPI-WEIGHTS",
            "RULE-CONTRACT-EXPIRY"
          ];
          const ruleDescriptions = [
            "SKU 'SP-AO-THUN-NAM-LOI' chưa được ánh xạ trong danh mục sản phẩm.",
            "Số điện thoại khách hàng trong đơn hàng 'ORD-98241' bị trống hoặc không hợp lệ.",
            "Thiếu địa chỉ giao hàng cho đơn hàng bán sỉ 'ORD-77123'.",
            "Đơn hàng 'ORD-44219' có phương thức thanh toán không khớp với cổng Momo.",
            "Sản phẩm sản xuất 'SP-FINISHED-BAG' chưa được cấu hình định mức nguyên vật liệu (BOM).",
            "Bút toán sổ cái 'JE-8821' không cân đối tổng phát sinh Nợ và Có.",
            "Phát hiện chênh lệch 15 sản phẩm giữa tồn kho thực tế và sổ sách tại Kho Q1.",
            "Bảng lương tháng này chưa cấu hình mức đóng BHXH cho nhân viên mới.",
            "Tổng trọng số các chỉ tiêu KPI của nhân viên 'Local Admin' không bằng 100 (hiện là 95).",
            "Hợp đồng nhà phân phối 'HD-WHOLESALE-01' sắp hết hạn trong 3 ngày tới."
          ];
          const severities = ["high", "medium", "high", "low", "medium", "high", "medium", "low", "medium", "high"];
          const entityTypes = ["raw_events", "orders", "orders", "orders", "products", "journal_entries", "warehouses", "payroll", "kpi_metrics", "contracts"];

          for (let i = 0; i < countNeeded; i++) {
            const ruleIdx = (openIssues.length + i) % ruleCodes.length;
            const newIssue = {
              id: `dq-mock-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
              company_id: companyId,
              rule_code: ruleCodes[ruleIdx],
              issue_type: ruleCodes[ruleIdx],
              severity: severities[ruleIdx],
              entity_type: entityTypes[ruleIdx],
              entity_id: `entity-${Math.floor(Math.random() * 10000)}`,
              description: ruleDescriptions[ruleIdx],
              message: ruleDescriptions[ruleIdx],
              status: "open",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              resolved_at: null,
            };
            openIssues.push(newIssue);
          }
        }

        const updatedIssues = [...openIssues, ...resolvedIssues];
        localStorage.setItem(QUALITY_ISSUES_KEY, JSON.stringify(updatedIssues));
        
        // Trigger storage event to synchronize with other browser clients
        window.dispatchEvent(new Event("storage"));
        
        return countNeeded > 0 ? countNeeded : 0;
      }

      const { data, error } = await (supabase.rpc as any)("run_scheduled_data_quality_checks", {
        p_company_id: companyId,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      toast({
        title: "Đã hoàn thành kiểm tra dữ liệu",
        description: count > 0 ? `Đã phát hiện và ghi nhận thêm ${count} vấn đề chất lượng.` : "Không phát hiện vấn đề mới.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Lỗi kiểm tra chất lượng dữ liệu",
        description: error.message,
      });
    },
  });
}

export function useApplyPiiMinimization() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inactiveDays: number = 180) => {
      if (!companyId) throw new Error("Missing company context");
      const { data, error } = await (supabase.rpc as any)("apply_pii_minimization", {
        p_company_id: companyId,
        p_inactive_days: inactiveDays,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      toast({
        title: "Đã hoàn thành tối thiểu hóa PII",
        description: `Đã mã hóa/ẩn danh thành công dữ liệu của ${count} khách hàng không hoạt động.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Lỗi thực hiện tối thiểu hóa PII",
        description: error.message,
      });
    },
  });
}

export interface CohortRow {
  signupMonth: string;
  cohortSize: number;
  retention: Record<number, { customers: number; percentage: number; revenue: number }>;
}

export function pivotCohortData(cohorts: CohortRetention[]): CohortRow[] {
  const groups: Record<string, CohortRetention[]> = {};
  cohorts.forEach(c => {
    const month = c.first_purchase_month;
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(c);
  });

  const rows: CohortRow[] = Object.keys(groups).map(month => {
    const records = groups[month];
    const month0Record = records.find(r => r.cohort_index === 0);
    const cohortSize = month0Record ? month0Record.active_customers : 0;

    const retention: Record<number, { customers: number; percentage: number; revenue: number }> = {};
    records.forEach(r => {
      retention[r.cohort_index] = {
        customers: r.active_customers,
        percentage: cohortSize > 0 ? Math.round((r.active_customers / cohortSize) * 100) : 0,
        revenue: r.total_revenue
      };
    });

    return {
      signupMonth: month,
      cohortSize,
      retention
    };
  });

  return rows.sort((a, b) => a.signupMonth.localeCompare(b.signupMonth));
}

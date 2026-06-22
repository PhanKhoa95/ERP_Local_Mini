import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useAuth } from "./useAuth";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { useKpiSeasons } from "./useKpiSeasons";
import { toast } from "sonner";

export interface StrategicReport {
  id: string;
  company_id: string;
  employee_id: string | null;
  season_id: string | null;
  project_id: string | null;
  title: string;
  report_date: string;
  executive_summary: {
    objective?: string;
    timeline?: string;
    current_status?: string;
  } | null;
  key_results: Array<{
    name: string;
    actual: number;
    target: number;
    unit?: string;
  }> | null;
  highlight: string | null;
  barriers: Array<{
    description: string;
    cause: string;
  }> | null;
  next_steps: Array<{
    priority: number;
    action: string;
    deadline?: string;
  }> | null;
  requests: Array<{
    type: string;
    description: string;
    deadline?: string;
  }> | null;
  project_tasks_summary: any | null;
  resources_summary: Array<{
    name: string;
    role: string;
    allocated_hours: number | null;
  }> | null;
  status: string;
  review_comment: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_REPORTS_KEY = "erp-mini-local-demo-strategic-reports";

function getLocalReports(companyId: string): StrategicReport[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DEFAULT_REPORTS_KEY);
  if (!raw) {
    const defaultReports: StrategicReport[] = [
      {
        id: "report-1",
        company_id: companyId,
        employee_id: "emp-local-demo-user",
        season_id: "kpi-season-1",
        project_id: null,
        title: "Báo cáo Chiến lược Phát triển Thị trường Q3 2026",
        report_date: "2026-06-22",
        executive_summary: {
          objective: "Mở rộng tệp khách hàng doanh nghiệp vừa và nhỏ (SME) khu vực phía Nam, tăng trưởng doanh thu 25%.",
          timeline: "Quý 3 - 2026",
          current_status: "on_track"
        },
        key_results: [
          { name: "Đạt số lượng 50 khách hàng ký hợp đồng mới", actual: 12, target: 50, unit: "khách hàng" },
          { name: "Doanh số ký mới đạt 1.5 tỷ VNĐ", actual: 450000000, target: 1500000000, unit: "VNĐ" },
          { name: "Mức độ hài lòng của khách hàng đạt trên 85%", actual: 88, target: 90, unit: "%" }
        ],
        highlight: "Đã hoàn thành thiết lập văn phòng đại diện mới tại TP.HCM và tuyển dụng đủ 5 nhân sự sales nòng cốt.",
        barriers: [
          { description: "Cạnh tranh gay gắt về giá từ các đối thủ bản địa.", cause: "Thị trường" },
          { description: "Thời gian đào tạo quy trình sản phẩm mới cho nhân viên mới kéo dài hơn dự kiến.", cause: "Nguồn lực" }
        ],
        next_steps: [
          { priority: 1, action: "Tổ chức chuỗi workshop giới thiệu giải pháp trực tiếp cho khách hàng mục tiêu.", deadline: "2026-07-15" },
          { priority: 2, action: "Tối ưu quy trình onboarding và tài liệu hướng dẫn nhanh cho Sales mới.", deadline: "2026-07-20" }
        ],
        requests: [
          { type: "Ngân sách", description: "Bổ sung thêm 50,000,000 VNĐ cho hoạt động marketing workshop tại TP.HCM.", deadline: "2026-07-05" }
        ],
        project_tasks_summary: { total: 10, completed: 3, in_progress: 5, pending: 2 },
        resources_summary: [
          { name: "Nguyễn Văn A", role: "Trưởng nhóm Sales", allocated_hours: 120 },
          { name: "Trần Thị B", role: "Chuyên viên Tư vấn", allocated_hours: 160 }
        ],
        status: "approved",
        review_comment: "Kế hoạch rất chi tiết và khả thi. Cần tập trung bám sát tiến độ giải ngân ngân sách workshop.",
        reviewed_at: new Date().toISOString(),
        reviewed_by: "admin@qtdn.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(DEFAULT_REPORTS_KEY, JSON.stringify(defaultReports));
    return defaultReports;
  }
  return JSON.parse(raw);
}

function saveLocalReports(reports: StrategicReport[]) {
  localStorage.setItem(DEFAULT_REPORTS_KEY, JSON.stringify(reports));
}

export function useStrategicReports(filterStatus?: string) {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { seasons = [], isLoading: seasonsLoading } = useKpiSeasons();

  // Get current perf_employees record for user
  const { data: employee } = useQuery({
    queryKey: ["perf-employee", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return null;
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-perf-employees");
        if (raw) {
          const list = JSON.parse(raw);
          return list.find((e: any) => e.user_id === user.id) || null;
        }
        return { id: "emp-local-demo-user" };
      }
      const { data, error } = await supabase
        .from("perf_employees")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!user?.id,
  });

  const { data: myReports = [], isLoading: myLoading } = useQuery({
    queryKey: ["my-strategic-reports", companyId, user?.id, employee?.id],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalReports(companyId);
        return all.filter((r) => r.employee_id === (employee?.id || "emp-local-demo-user"));
      }

      let empId = employee?.id;
      if (!empId && user?.id) {
        const { data: emp } = await supabase
          .from("perf_employees")
          .select("id")
          .eq("company_id", companyId)
          .eq("user_id", user.id)
          .maybeSingle();
        empId = emp?.id;
      }

      if (!empId) return [];

      const { data, error } = await supabase
        .from("strategic_reports")
        .select("*")
        .eq("company_id", companyId)
        .eq("employee_id", empId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as StrategicReport[];
    },
    enabled: !!companyId,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["strategic-reports", companyId, filterStatus],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalReports(companyId);
        return filterStatus ? all.filter((r) => r.status === filterStatus) : all;
      }
      let query = supabase
        .from("strategic_reports")
        .select("*")
        .eq("company_id", companyId);
      if (filterStatus) {
        query = query.eq("status", filterStatus);
      }
      query = query.order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StrategicReport[];
    },
    enabled: !!companyId,
  });

  const createReport = useMutation({
    mutationFn: async (payload: Omit<StrategicReport, "id" | "created_at" | "updated_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      const empId = employee?.id || null;
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalReports(companyId);
        const newReport: StrategicReport = {
          ...payload,
          id: `report-${Date.now()}`,
          company_id: companyId,
          employee_id: empId || "emp-local-demo-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any;
        all.push(newReport);
        saveLocalReports(all);
        return newReport;
      }
      const { data, error } = await supabase
        .from("strategic_reports")
        .insert({
          ...payload,
          company_id: companyId,
          employee_id: empId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as StrategicReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-strategic-reports", companyId] });
      queryClient.invalidateQueries({ queryKey: ["strategic-reports", companyId] });
      toast.success("Đã lưu báo cáo chiến lược thành công");
    },
    onError: (e: any) => {
      toast.error("Lỗi lưu báo cáo: " + e.message);
    }
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<StrategicReport> & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalReports(companyId || "");
        const idx = all.findIndex(r => r.id === id);
        if (idx !== -1) {
          all[idx] = {
            ...all[idx],
            ...payload,
            updated_at: new Date().toISOString()
          } as any;
          saveLocalReports(all);
        }
        return all[idx];
      }
      const { data, error } = await supabase
        .from("strategic_reports")
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as StrategicReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-strategic-reports", companyId] });
      queryClient.invalidateQueries({ queryKey: ["strategic-reports", companyId] });
      toast.success("Đã cập nhật báo cáo chiến lược");
    },
    onError: (e: any) => {
      toast.error("Lỗi cập nhật: " + e.message);
    }
  });

  const submitReport = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalReports(companyId || "");
        const idx = all.findIndex(r => r.id === id);
        if (idx !== -1) {
          all[idx].status = "submitted";
          all[idx].updated_at = new Date().toISOString();
          saveLocalReports(all);
        }
        return;
      }
      const { error } = await supabase
        .from("strategic_reports")
        .update({ status: "submitted", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-strategic-reports", companyId] });
      queryClient.invalidateQueries({ queryKey: ["strategic-reports", companyId] });
      toast.success("Đã gửi báo cáo chiến lược để phê duyệt");
    },
    onError: (e: any) => {
      toast.error("Lỗi gửi báo cáo: " + e.message);
    }
  });

  const reviewReport = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: "approved" | "rejected"; comment?: string }) => {
      const reviewerName = user?.email || "Manager";
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalReports(companyId || "");
        const idx = all.findIndex(r => r.id === id);
        if (idx !== -1) {
          all[idx].status = status;
          all[idx].review_comment = comment || null;
          all[idx].reviewed_at = new Date().toISOString();
          all[idx].reviewed_by = reviewerName;
          all[idx].updated_at = new Date().toISOString();
          saveLocalReports(all);
        }
        return;
      }
      const { error } = await supabase
        .from("strategic_reports")
        .update({
          status,
          review_comment: comment || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerName,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-strategic-reports", companyId] });
      queryClient.invalidateQueries({ queryKey: ["strategic-reports", companyId] });
      toast.success("Đã ghi nhận đánh giá báo cáo");
    },
    onError: (e: any) => {
      toast.error("Lỗi phê duyệt: " + e.message);
    }
  });

  const fetchKpiData = async (seasonId: string) => {
    if (isLocalDemoAuthEnabled()) {
      // Mock local KPI metrics
      return [
        { name: "Doanh số toàn công ty đạt chỉ tiêu", actual: 85, target: 100, unit: "%" },
        { name: "Số lượng khách hàng doanh nghiệp mới", actual: 18, target: 20, unit: "khách hàng" },
        { name: "Độ phủ thương hiệu trên các kênh online", actual: 70, target: 80, unit: "%" }
      ];
    }
    const { data, error } = await supabase
      .from("kpi_metrics")
      .select("name, target_value, unit")
      .eq("season_id", seasonId);
    if (error) return [];
    return (data || []).map((m: any) => ({
      name: m.name,
      actual: 0,
      target: m.target_value || 100,
      unit: m.unit || "",
    }));
  };

  return {
    seasons,
    seasonsLoading,
    myReports,
    myLoading,
    reports,
    isLoading,
    createReport,
    updateReport,
    submitReport,
    reviewReport,
    fetchKpiData
  };
}

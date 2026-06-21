import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { usePerformanceEmployee } from "./usePerformanceEmployee";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export interface WorkReport {
  id: string;
  employee_id: string;
  org_unit_id: string | null;
  report_type: "daily" | "weekly" | "monthly" | "seasonal";
  report_date: string;
  period_start: string | null;
  period_end: string | null;
  summary: string | null;
  completed_tasks: any[];
  pending_tasks: any[];
  blockers: any[];
  auto_metrics: any;
  status: "draft" | "submitted" | "reviewed" | "approved" | "rejected";
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportMetricValue {
  id: string;
  report_id: string;
  metric_id: string;
  target_value: number | null;
  actual_value: number | null;
  unit: string | null;
  notes: string | null;
  evidence_urls: string[];
}

import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

const WORK_REPORTS_KEY = "erp-mini-local-demo-work-reports";

function getLocalReports(): WorkReport[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(WORK_REPORTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalReports(reports: WorkReport[]) {
  localStorage.setItem(WORK_REPORTS_KEY, JSON.stringify(reports));
}

export function useWorkReports(reportType?: string) {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();
  const queryClient = useQueryClient();

  // Fetch user's reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ["work-reports", employee?.id, reportType],
    queryFn: async () => {
      if (!employee?.id) return [];

      if (isLocalDemoAuthEnabled()) {
        const list = getLocalReports();
        const empReports = list.filter(r => r.employee_id === employee.id);
        if (reportType) {
          return empReports.filter(r => r.report_type === reportType);
        }
        return empReports;
      }
      
      let query = supabase
        .from("work_reports")
        .select("*")
        .eq("employee_id", employee.id)
        .order("report_date", { ascending: false });
      
      if (reportType) {
        query = query.eq("report_type", reportType);
      }
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as WorkReport[];
    },
    enabled: !!employee?.id,
  });

  // Get today's report
  const { data: todayReport } = useQuery({
    queryKey: ["work-report-today", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return null;
      
      const today = format(new Date(), "yyyy-MM-dd");

      if (isLocalDemoAuthEnabled()) {
        const list = getLocalReports();
        const report = list.find(r => r.employee_id === employee.id && r.report_type === "daily" && r.report_date === today);
        return report || null;
      }

      const { data, error } = await supabase
        .from("work_reports")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("report_type", "daily")
        .eq("report_date", today)
        .maybeSingle();
      
      if (error) throw error;
      return data as WorkReport | null;
    },
    enabled: !!employee?.id,
  });

  // Create report
  const createReport = useMutation({
    mutationFn: async (data: {
      report_type: "daily" | "weekly" | "monthly" | "seasonal";
      report_date?: string;
      summary?: string;
      completed_tasks?: any[];
      pending_tasks?: any[];
    }) => {
      if (!employee?.id) throw new Error("No employee");
      
      const today = new Date();
      let period_start: string | null = null;
      let period_end: string | null = null;
      
      if (data.report_type === "weekly") {
        period_start = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        period_end = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      } else if (data.report_type === "monthly") {
        period_start = format(startOfMonth(today), "yyyy-MM-dd");
        period_end = format(endOfMonth(today), "yyyy-MM-dd");
      }

      if (isLocalDemoAuthEnabled()) {
        const list = getLocalReports();
        const targetDate = data.report_date || format(today, "yyyy-MM-dd");
        const exists = list.some(r => r.employee_id === employee.id && r.report_type === data.report_type && r.report_date === targetDate);
        if (exists) {
          const err = new Error("Báo cáo cho ngày này đã tồn tại");
          (err as any).code = "23505";
          throw err;
        }

        const newReport: WorkReport = {
          id: `report-${Date.now()}`,
          employee_id: employee.id,
          org_unit_id: employee.org_unit_id,
          report_type: data.report_type,
          report_date: targetDate,
          period_start,
          period_end,
          summary: data.summary || null,
          completed_tasks: data.completed_tasks || [],
          pending_tasks: data.pending_tasks || [],
          blockers: [],
          auto_metrics: null,
          status: "draft",
          submitted_at: null,
          reviewed_by: null,
          reviewed_at: null,
          review_comment: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        saveLocalReports([newReport, ...list]);
        return newReport;
      }
      
      const { data: report, error } = await supabase
        .from("work_reports")
        .insert({
          employee_id: employee.id,
          org_unit_id: employee.org_unit_id,
          report_type: data.report_type,
          report_date: data.report_date || format(today, "yyyy-MM-dd"),
          period_start,
          period_end,
          summary: data.summary || null,
          completed_tasks: data.completed_tasks || [],
          pending_tasks: data.pending_tasks || [],
          status: "draft",
        })
        .select()
        .single();
      
      if (error) throw error;
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-reports"] });
      queryClient.invalidateQueries({ queryKey: ["work-report-today"] });
      toast.success("Đã tạo báo cáo");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Báo cáo cho ngày này đã tồn tại");
      } else {
        toast.error("Lỗi tạo báo cáo: " + error.message);
      }
    },
  });

  // Update report
  const updateReport = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkReport> & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const list = getLocalReports();
        const idx = list.findIndex(r => r.id === id);
        if (idx === -1) throw new Error("Không tìm thấy báo cáo");
        list[idx] = {
          ...list[idx],
          ...updates,
          updated_at: new Date().toISOString()
        } as WorkReport;
        saveLocalReports(list);
        return list[idx];
      }

      const { data, error } = await supabase
        .from("work_reports")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-reports"] });
      queryClient.invalidateQueries({ queryKey: ["work-report-today"] });
      toast.success("Đã lưu báo cáo");
    },
    onError: (error) => {
      toast.error("Lỗi cập nhật: " + error.message);
    },
  });

  // Submit report
  const submitReport = useMutation({
    mutationFn: async (reportId: string) => {
      if (isLocalDemoAuthEnabled()) {
        const list = getLocalReports();
        const idx = list.findIndex(r => r.id === reportId);
        if (idx === -1) throw new Error("Không tìm thấy báo cáo");
        list[idx] = {
          ...list[idx],
          status: "submitted",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as WorkReport;
        saveLocalReports(list);
        return list[idx];
      }

      const { data, error } = await supabase
        .from("work_reports")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-reports"] });
      queryClient.invalidateQueries({ queryKey: ["work-report-today"] });
      toast.success("Đã gửi báo cáo");
    },
    onError: (error) => {
      toast.error("Lỗi gửi báo cáo: " + error.message);
    },
  });

  // Calculate auto metrics from orders
  const calculateAutoMetrics = async (startDate: string, endDate: string) => {
    if (!companyId) return {};

    if (isLocalDemoAuthEnabled()) {
      try {
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders") || localStorage.getItem("orders");
        const orders = rawOrders ? JSON.parse(rawOrders) : [];
        const monthOrders = orders.filter((o: any) => o.company_id === companyId && o.created_at?.slice(0, 10) >= startDate && o.created_at?.slice(0, 10) <= endDate);
        const delivered = monthOrders.filter((o: any) => o.status === "delivered" || o.status === "paid");
        const totalRevenue = delivered.reduce((sum: number, o: any) => sum + (Number(o.total_amount || o.total || 0)), 0);
        return {
          total_orders: monthOrders.length,
          completed_orders: delivered.length,
          total_revenue: totalRevenue,
          conversion_rate: monthOrders.length ? Math.round((delivered.length / monthOrders.length) * 100) : 0,
        };
      } catch {
        return {};
      }
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, total, status, created_at")
      .eq("company_id", companyId)
      .gte("created_at", startDate)
      .lte("created_at", endDate + "T23:59:59");
    
    if (error) {
      console.error("Error fetching orders:", error);
      return {};
    }
    
    const delivered = orders?.filter(o => o.status === "delivered") || [];
    const totalRevenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0);
    
    return {
      total_orders: orders?.length || 0,
      completed_orders: delivered.length,
      total_revenue: totalRevenue,
      conversion_rate: orders?.length ? Math.round((delivered.length / orders.length) * 100) : 0,
    };
  };

  return {
    reports,
    todayReport,
    isLoading,
    createReport,
    updateReport,
    submitReport,
    calculateAutoMetrics,
  };
}


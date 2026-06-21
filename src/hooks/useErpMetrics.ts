import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, startOfMonth, format } from "date-fns";

export interface ProjectTaskSummary {
  total: number;
  pending: number;
  in_progress: number;
  done: number;
  overdue: number;
  tasks: Array<{ id: string; title: string; status: string; priority: string; assignee?: string; due_date?: string }>;
}

export interface ProjectMemberSummary {
  employee_id: string;
  name: string;
  role: string;
  allocated_hours: number | null;
}

export interface ProjectResourceSummary {
  members: ProjectMemberSummary[];
  totalAllocatedHours: number;
  budget: number;
  budgetUsed: number;
  projectName: string;
  projectStatus: string;
  projectProgress: number;
}

export interface ErpMetrics {
  // Revenue & Orders
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  orderCompletionRate: number;
  avgOrderValue: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;

  // Inventory
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  topProducts: Array<{ name: string; sold: number }>;

  // Finance & Debt
  totalDebtReceivable: number;
  totalDebtPayable: number;
  netDebt: number;
  grossProfit: number;
  profitMargin: number;

  // Performance
  totalEmployees: number;
  avgXp: number;
  taskCompletionRate: number;
  totalTasksDone: number;
  totalTasksPending: number;
  reportsSubmitted: number;

  // Project (optional, filled when projectId provided)
  projectTasks?: ProjectTaskSummary;
  projectResources?: ProjectResourceSummary;
}

export function useErpMetrics(enabled = true, projectId?: string) {
  return useQuery({
    queryKey: ["erp-metrics-strategic", projectId],
    queryFn: async (): Promise<ErpMetrics> => {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();

      const [ordersRes, productsRes, partnersRes, employeesRes, tasksRes, reportsRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, created_at, order_date"),
        supabase.from("products").select("id, name, stock_quantity, min_stock, selling_price, cost_price, is_active").eq("is_active", true),
        supabase.from("partners").select("id, partner_type, debt_amount"),
        supabase.from("perf_employees").select("id, total_xp, is_active").eq("is_active", true),
        supabase.from("tasks").select("id, status, completed_at"),
        supabase.from("work_reports" as any).select("id, status").eq("status", "approved"),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const partners = partnersRes.data || [];
      const employees = employeesRes.data || [];
      const tasks = tasksRes.data || [];
      const reports = (reportsRes.data as any[]) || [];

      // Revenue & Orders
      const delivered = orders.filter(o => o.status === "delivered");
      const totalRevenue = delivered.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const pending = orders.filter(o => o.status === "pending" || o.status === "processing");

      // Revenue by month (last 6 months)
      const monthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const m = format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM");
        monthMap[m] = 0;
      }
      delivered.forEach(o => {
        const m = format(new Date(o.created_at), "yyyy-MM");
        if (monthMap[m] !== undefined) monthMap[m] += Number(o.total) || 0;
      });
      const revenueByMonth = Object.entries(monthMap).map(([month, revenue]) => ({
        month: `T${new Date(month + "-01").getMonth() + 1}`,
        revenue: Math.round(revenue / 1_000_000 * 10) / 10,
      }));

      // Inventory
      const lowStock = products.filter(p => (p.stock_quantity || 0) <= (p.min_stock || 0) && (p.stock_quantity || 0) > 0);
      const outOfStock = products.filter(p => (p.stock_quantity || 0) <= 0);
      const totalStockValue = products.reduce((s, p) => s + (p.stock_quantity || 0) * (Number(p.cost_price) || 0), 0);

      // COGS & profit
      let totalCOGS = 0;
      delivered.forEach(o => {
        // Simplified: use avg cost ratio
        totalCOGS += (Number(o.total) || 0) * 0.65; // placeholder ratio
      });
      const grossProfit = totalRevenue - totalCOGS;

      // Debt
      const customers = partners.filter(p => p.partner_type === "customer" || p.partner_type === "both");
      const suppliers = partners.filter(p => p.partner_type === "supplier" || p.partner_type === "both");
      const totalDebtReceivable = customers.reduce((s, p) => s + Math.max(Number(p.debt_amount) || 0, 0), 0);
      const totalDebtPayable = suppliers.reduce((s, p) => s + Math.max(Number(p.debt_amount) || 0, 0), 0);

      // Performance
      const doneTasks = tasks.filter(t => t.status === "done");
      const pendingTasks = tasks.filter(t => t.status !== "done" && t.status !== "cancelled");
      const avgXp = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + (e.total_xp || 0), 0) / employees.length) : 0;

      // Project data (if projectId provided)
      let projectTasks: ProjectTaskSummary | undefined;
      let projectResources: ProjectResourceSummary | undefined;

      if (projectId) {
        const [projTasksRes, projMembersRes, projRes] = await Promise.all([
          supabase.from("tasks").select("id, title, status, priority, due_date, assigned_to").eq("project_id", projectId),
          supabase.from("project_members").select("employee_id, role, allocated_hours").eq("project_id", projectId),
          supabase.from("projects").select("name, status, budget").eq("id", projectId).single(),
        ]);

        const projTasks = projTasksRes.data || [];
        const projMembers = projMembersRes.data || [];
        const project = projRes.data;

        // Get employee names for members
        const employeeIds = projMembers.map(m => m.employee_id);
        const memberNames: Record<string, string> = {};
        if (employeeIds.length > 0) {
          const { data: empProfiles } = await supabase
            .from("perf_employees")
            .select("id, user_id")
            .in("id", employeeIds);
          
          if (empProfiles && empProfiles.length > 0) {
            const userIds = empProfiles.map(e => e.user_id);
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", userIds);
            
            const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name || ""]));
            empProfiles.forEach(e => {
              memberNames[e.id] = profileMap.get(e.user_id) || "N/A";
            });
          }
        }

        const now = new Date();
        const overdue = projTasks.filter(t => t.status !== "done" && t.due_date && new Date(t.due_date) < now);
        const done = projTasks.filter(t => t.status === "done");

        projectTasks = {
          total: projTasks.length,
          pending: projTasks.filter(t => t.status === "pending").length,
          in_progress: projTasks.filter(t => t.status === "in_progress").length,
          done: done.length,
          overdue: overdue.length,
          tasks: projTasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority || "normal",
            assignee: t.assigned_to ? memberNames[t.assigned_to] : undefined,
            due_date: t.due_date || undefined,
          })),
        };

        const totalAllocatedHours = projMembers.reduce((s, m) => s + (m.allocated_hours || 0), 0);

        projectResources = {
          members: projMembers.map(m => ({
            employee_id: m.employee_id,
            name: memberNames[m.employee_id] || "N/A",
            role: m.role,
            allocated_hours: m.allocated_hours,
          })),
          totalAllocatedHours,
          budget: Number(project?.budget) || 0,
          budgetUsed: 0,
          projectName: project?.name || "",
          projectStatus: project?.status || "planning",
          projectProgress: projTasks.length > 0 ? Math.round((done.length / projTasks.length) * 100) : 0,
        };
      }

      return {
        totalRevenue,
        totalOrders: orders.length,
        deliveredOrders: delivered.length,
        pendingOrders: pending.length,
        orderCompletionRate: orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0,
        avgOrderValue: delivered.length > 0 ? Math.round(totalRevenue / delivered.length) : 0,
        revenueByMonth,

        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalStockValue,
        topProducts: [],

        totalDebtReceivable,
        totalDebtPayable,
        netDebt: totalDebtReceivable - totalDebtPayable,
        grossProfit,
        profitMargin: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0,

        totalEmployees: employees.length,
        avgXp,
        taskCompletionRate: tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
        totalTasksDone: doneTasks.length,
        totalTasksPending: pendingTasks.length,
        reportsSubmitted: reports.length,

        projectTasks,
        projectResources,
      };
    },
    enabled,
  });
}

/** Convert ERP metrics to key_results format for strategic report */
export function erpMetricsToKeyResults(m: ErpMetrics) {
  const results = [
    { name: "Doanh thu", actual: Math.round(m.totalRevenue / 1_000_000), target: 0, unit: "triệu đ" },
    { name: "Tổng đơn hàng", actual: m.totalOrders, target: 0, unit: "đơn" },
    { name: "Tỷ lệ hoàn thành đơn", actual: m.orderCompletionRate, target: 100, unit: "%" },
    { name: "Lợi nhuận gộp", actual: Math.round(m.grossProfit / 1_000_000), target: 0, unit: "triệu đ" },
    { name: "Biên lợi nhuận", actual: m.profitMargin, target: 0, unit: "%" },
    { name: "Tỷ lệ hoàn thành task", actual: m.taskCompletionRate, target: 100, unit: "%" },
  ];

  // Add project-specific KPIs if available
  if (m.projectTasks) {
    results.push({ name: "Tiến độ dự án", actual: m.projectResources?.projectProgress || 0, target: 100, unit: "%" });
    results.push({ name: "Tasks dự án hoàn thành", actual: m.projectTasks.done, target: m.projectTasks.total, unit: "task" });
  }

  return results;
}

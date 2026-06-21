import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useEffect } from "react";

import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface DirectiveTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  assignee_name: string | null;
  assignee_org_unit: string | null;
  completed_at: string | null;
  source_type: string;
}

export interface DirectiveWithTasks {
  id: string;
  title: string;
  content: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  assigned_manager_id: string | null;
  assigned_manager_name: string | null;
  escalation_count: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  tasks: DirectiveTask[];
}

interface OrgUnitMetrics {
  org_unit_name: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}

export function useDirectiveDashboard() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();

  // Fetch directives with assigned manager name
  const { data: directives, isLoading: directivesLoading } = useQuery({
    queryKey: ["directive-dashboard-directives", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      if (isLocalDemoAuthEnabled()) {
        const rawDirs = localStorage.getItem("erp-mini-local-demo-directives");
        const dirs = rawDirs ? JSON.parse(rawDirs) : [];
        
        // Map manager name
        const rawEmps = localStorage.getItem("erp-mini-local-demo-perf-employees");
        const emps = rawEmps ? JSON.parse(rawEmps) : [];
        const empMap = new Map(emps.map((e: any) => [e.id, e.full_name || ""]));

        return dirs.map((d: any) => ({
          ...d,
          assigned_manager: {
            id: d.assigned_manager_id,
            name: empMap.get(d.assigned_manager_id) || "Chưa giao"
          }
        }));
      }

      const { data, error } = await supabase
        .from("directives")
        .select("*, assigned_manager:perf_employees!directives_assigned_manager_id_fkey(id, name)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch tasks with assignee info
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["directive-dashboard-tasks", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      if (isLocalDemoAuthEnabled()) {
        const rawTasks = localStorage.getItem("erp-mini-local-demo-tasks");
        const tks = rawTasks ? JSON.parse(rawTasks) : [];
        
        const rawEmps = localStorage.getItem("erp-mini-local-demo-perf-employees");
        const emps = rawEmps ? JSON.parse(rawEmps) : [];
        const empMap = new Map(emps.map((e: any) => [e.id, e]));

        return tks.filter((t: any) => t.company_id === companyId)
          .map((t: any) => {
            const emp = empMap.get(t.assigned_to) as any;
            return {
              ...t,
              assignee: emp ? {
                id: emp.id,
                name: emp.full_name,
                perf_org_units: {
                  name: emp.org_unit_name || "Chưa phân loại"
                }
              } : null
            };
          });
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assigned_to, directive_id, created_at, completed_at, source_type, assignee:perf_employees!tasks_assigned_to_fkey(id, name, perf_org_units(name))")
        .eq("company_id", companyId);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch employees with org units for department metrics
  const { data: employees } = useQuery({
    queryKey: ["directive-dashboard-employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      if (isLocalDemoAuthEnabled()) {
        const rawEmps = localStorage.getItem("erp-mini-local-demo-perf-employees");
        const emps = rawEmps ? JSON.parse(rawEmps) : [];
        return emps.map((e: any) => ({
          id: e.id,
          name: e.full_name,
          org_unit_id: e.org_unit_id,
          perf_org_units: {
            name: e.org_unit_name || "Chưa phân loại"
          }
        }));
      }

      const { data, error } = await supabase
        .from("perf_employees")
        .select("id, name, org_unit_id, perf_org_units(name)")
        .eq("company_id", companyId)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Realtime subscriptions — also invalidate cross-system queries
  useEffect(() => {
    if (!companyId) return;
    if (isLocalDemoAuthEnabled()) return; // Disable realtime on Local Demo

    const channel = supabase
      .channel("directive-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "directives" }, () => {
        queryClient.invalidateQueries({ queryKey: ["directive-dashboard-directives"] });
        queryClient.invalidateQueries({ queryKey: ["directives"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["directive-dashboard-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["my-tasks-stats"] });
        queryClient.invalidateQueries({ queryKey: ["team-tasks"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, queryClient]);


  // Compute directive stats
  const directiveStats = {
    total: directives?.length || 0,
    draft: directives?.filter(d => d.status === "draft").length || 0,
    dispatched: directives?.filter(d => d.status === "dispatched").length || 0,
    inProgress: directives?.filter(d => d.status === "in_progress").length || 0,
    completed: directives?.filter(d => d.status === "completed").length || 0,
  };

  // Compute task stats
  const now = new Date();
  const allTasks = tasks || [];
  const taskStats = {
    total: allTasks.length,
    completed: allTasks.filter(t => t.status === "done").length,
    onTime: allTasks.filter(t => t.status === "done" && t.due_date && t.completed_at && new Date(t.completed_at) <= new Date(t.due_date)).length,
    overdue: allTasks.filter(t => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < now).length,
  };

  // Directives with task progress and assignee details
  const directivesWithProgress: DirectiveWithTasks[] = (directives || []).map(d => {
    const dTasks = allTasks.filter(t => t.directive_id === d.id);
    const mappedTasks: DirectiveTask[] = dTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      assigned_to: t.assigned_to,
      assignee_name: t.assignee?.name || null,
      assignee_org_unit: t.assignee?.perf_org_units?.name || null,
      completed_at: t.completed_at,
      source_type: t.source_type,
    }));
    return {
      id: d.id,
      title: d.title,
      content: d.content,
      status: d.status,
      deadline: d.deadline,
      created_at: d.created_at,
      assigned_manager_id: d.assigned_manager_id,
      assigned_manager_name: (d as any).assigned_manager?.name || null,
      escalation_count: d.escalation_count,
      total_tasks: dTasks.length,
      completed_tasks: dTasks.filter(t => t.status === "done").length,
      overdue_tasks: dTasks.filter(t => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < now).length,
      tasks: mappedTasks,
    };
  });

  // Org unit metrics
  const orgUnitMetrics: OrgUnitMetrics[] = (() => {
    if (!employees?.length) return [];
    const empMap = new Map<string, string>();
    const orgMap = new Map<string, { name: string; total: number; completed: number }>();
    
    employees.forEach((e: any) => {
      empMap.set(e.id, e.org_unit_id);
      const orgName = e.perf_org_units?.name || "Chưa phân loại";
      if (!orgMap.has(orgName)) orgMap.set(orgName, { name: orgName, total: 0, completed: 0 });
    });

    allTasks.forEach(t => {
      if (!t.assigned_to) return;
      const orgUnitId = empMap.get(t.assigned_to);
      if (!orgUnitId) return;
      const emp = employees.find((e: any) => e.id === t.assigned_to);
      const orgName = (emp as any)?.perf_org_units?.name || "Chưa phân loại";
      const entry = orgMap.get(orgName);
      if (entry) {
        entry.total++;
        if (t.status === "done") entry.completed++;
      }
    });

    return Array.from(orgMap.values())
      .filter(o => o.total > 0)
      .map(o => ({ org_unit_name: o.name, total_tasks: o.total, completed_tasks: o.completed, completion_rate: o.total ? Math.round((o.completed / o.total) * 100) : 0 }));
  })();

  // Status timeline data for charts (last 7 days)
  const timelineData = (() => {
    const days: { date: string; created: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        created: (directives || []).filter(dir => dir.created_at.slice(0, 10) === dateStr).length,
        completed: allTasks.filter(t => t.status === "done" && t.completed_at?.slice(0, 10) === dateStr).length,
      });
    }
    return days;
  })();

  // Task status distribution for pie chart
  const taskStatusDistribution = [
    { name: "Hoàn thành", value: taskStats.completed, fill: "hsl(var(--success))" },
    { name: "Đang làm", value: allTasks.filter(t => t.status === "in_progress").length, fill: "hsl(var(--primary))" },
    { name: "Chờ", value: allTasks.filter(t => t.status === "todo" || t.status === "pending").length, fill: "hsl(var(--muted-foreground))" },
    { name: "Quá hạn", value: taskStats.overdue, fill: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

  return {
    directiveStats,
    taskStats,
    directivesWithProgress,
    orgUnitMetrics,
    timelineData,
    taskStatusDistribution,
    isLoading: directivesLoading || tasksLoading,
  };
}

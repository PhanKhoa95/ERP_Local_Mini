import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { usePerformanceEmployee } from "./usePerformanceEmployee";
import { toast } from "sonner";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

const TASKS_KEY = "erp-mini-local-demo-tasks";

function getLocalTasks(companyId: string, employeeId: string): Task[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) {
    const defaultTasks: Task[] = [
      {
        id: "task-local-1",
        company_id: companyId,
        project_id: null,
        assigned_by: "system",
        assigned_to: employeeId,
        org_unit_id: "local-org-unit-1",
        title: "In và gia công bế đứt 100 Tem Nhãn Decal",
        description: "Thực hiện in trên máy Epson L8050, cán màng bóng, bế đứt tem tròn 5cm cho đơn hàng POS-ORD-001.",
        priority: "high",
        source_type: "manual",
        source_id: null,
        status: "in_progress",
        progress: 50,
        due_date: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
        started_at: new Date().toISOString(),
        completed_at: null,
        quality_score: null,
        completion_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "task-local-2",
        company_id: companyId,
        project_id: null,
        assigned_by: "system",
        assigned_to: employeeId,
        org_unit_id: "local-org-unit-1",
        title: "Thiết kế market Combo Shop Mới cho Khách lẻ",
        description: "Thiết kế logo, danh thiếp cảm ơn và bảng mica QR thanh toán theo yêu cầu.",
        priority: "normal",
        source_type: "manual",
        source_id: null,
        status: "done",
        progress: 100,
        due_date: new Date().toISOString(),
        started_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        completed_at: new Date().toISOString(),
        quality_score: 95,
        completion_notes: "Hoàn tất bản thiết kế market và gửi khách duyệt qua Zalo.",
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "task-local-3",
        company_id: companyId,
        project_id: null,
        assigned_by: "system",
        assigned_to: employeeId,
        org_unit_id: "local-org-unit-1",
        title: "Kiểm kho giấy decal bóng và mực in màu Epson",
        description: "Kiểm tra số lượng xấp decal A4 còn lại, định mức hao hụt và mực in chai màu Epson.",
        priority: "high",
        source_type: "manual",
        source_id: null,
        status: "pending",
        progress: 0,
        due_date: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
        started_at: null,
        completed_at: null,
        quality_score: null,
        completion_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    localStorage.setItem(TASKS_KEY, JSON.stringify(defaultTasks));
    return defaultTasks;
  }
  return JSON.parse(raw);
}

export interface Task {
  id: string;
  company_id: string;
  project_id: string | null;
  assigned_by: string | null;
  assigned_to: string | null;
  org_unit_id: string | null;
  title: string;
  description: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  source_type: "directive" | "order" | "manual" | "project" | "self";
  source_id: string | null;
  status: "pending" | "accepted" | "in_progress" | "done" | "cancelled";
  progress: number;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  quality_score: number | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
  project?: { name: string; code: string } | null;
}

export interface TaskFilter {
  status?: string;
  projectId?: string;
  orgUnitId?: string;
  sourceType?: string;
}

export function useTasks(filter?: TaskFilter) {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();
  const queryClient = useQueryClient();

  // Stats query
  const { data: allTasksForStats } = useQuery({
    queryKey: ["my-tasks-stats", employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalTasks(companyId || "", employee.id);
      }
      const { data, error } = await supabase
        .from("tasks")
        .select("id, status, due_date, completed_at")
        .or(`assigned_to.eq.${employee.id},and(assigned_by.eq.${employee.user_id},source_type.eq.self)`)
        .not("status", "eq", "cancelled");
      if (error) throw error;
      return data || [];
    },
    enabled: !!employee?.id,
  });

  // Filtered display query
  const { data: myTasks, isLoading: myTasksLoading } = useQuery({
    queryKey: ["my-tasks", employee?.id, filter],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      if (isLocalDemoAuthEnabled()) {
        let tasks = getLocalTasks(companyId || "", employee.id);
        if (filter?.status && filter.status !== "all") {
          tasks = tasks.filter(t => t.status === filter.status);
        }
        if (filter?.projectId) {
          tasks = tasks.filter(t => t.project_id === filter.projectId);
        }
        if (filter?.orgUnitId) {
          tasks = tasks.filter(t => t.org_unit_id === filter.orgUnitId);
        }
        if (filter?.sourceType && filter.sourceType !== "all") {
          tasks = tasks.filter(t => t.source_type === filter.sourceType);
        }
        return tasks;
      }

      let query = supabase
        .from("tasks")
        .select(`*, project:projects(name, code)`)
        .or(`assigned_to.eq.${employee.id},and(assigned_by.eq.${employee.user_id},source_type.eq.self)`)
        .order("due_date", { ascending: true, nullsFirst: false });
      
      if (filter?.status && filter.status !== "all") {
        query = query.eq("status", filter.status);
      }
      if (filter?.projectId) {
        query = query.eq("project_id", filter.projectId);
      }
      if (filter?.orgUnitId) {
        query = query.eq("org_unit_id", filter.orgUnitId);
      }
      if (filter?.sourceType && filter.sourceType !== "all") {
        query = query.eq("source_type", filter.sourceType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!employee?.id,
  });

  // Today's completed tasks
  const { data: todayCompletedTasks } = useQuery({
    queryKey: ["today-completed-tasks", employee?.id, companyId],
    queryFn: async () => {
      if (!employee?.id || !companyId) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const today = new Date().toISOString().split('T')[0];
        return getLocalTasks(companyId, employee.id).filter(
          t => t.status === "done" && t.completed_at && t.completed_at.startsWith(today)
        );
      }

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("tasks")
        .select(`*, project:projects(name, code)`)
        .eq("company_id", companyId)
        .eq("assigned_to", employee.id)
        .eq("status", "done")
        .gte("completed_at", `${today}T00:00:00`)
        .lte("completed_at", `${today}T23:59:59`);
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!employee?.id && !!companyId,
  });

  // Team tasks
  const { data: teamTasks, isLoading: teamTasksLoading } = useQuery({
    queryKey: ["team-tasks", companyId, employee?.org_unit_id],
    queryFn: async () => {
      if (!companyId || !employee?.org_unit_id) return [];
      
      if (isLocalDemoAuthEnabled()) {
        return getLocalTasks(companyId, employee.id);
      }

      const { data, error } = await supabase
        .from("tasks")
        .select(`*, project:projects(name, code)`)
        .eq("company_id", companyId)
        .eq("org_unit_id", employee.org_unit_id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!companyId && !!employee?.org_unit_id,
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["my-tasks-stats"] });
    queryClient.invalidateQueries({ queryKey: ["team-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["today-completed-tasks"] });
  };

  const createTask = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      if (!companyId) throw new Error("No company");
      
      if (isLocalDemoAuthEnabled()) {
        const tasks = getLocalTasks(companyId, employee?.id || "emp-local-demo-user");
        const newTask: Task = {
          id: `task-${Date.now()}`,
          company_id: companyId,
          project_id: data.project_id || null,
          assigned_by: "local-demo-user",
          assigned_to: data.assigned_to || null,
          org_unit_id: data.org_unit_id || employee?.org_unit_id || "local-org-unit-1",
          title: data.title!,
          description: data.description || null,
          priority: data.priority || "normal",
          source_type: data.source_type || "manual",
          source_id: data.source_id || null,
          status: "pending",
          progress: 0,
          due_date: data.due_date || null,
          started_at: null,
          completed_at: null,
          quality_score: null,
          completion_notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        tasks.push(newTask);
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        return newTask;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          company_id: companyId,
          assigned_by: user?.id,
          assigned_to: data.assigned_to,
          project_id: data.project_id,
          org_unit_id: data.org_unit_id || employee?.org_unit_id,
          title: data.title!,
          description: data.description,
          priority: data.priority || "normal",
          source_type: data.source_type || "manual",
          source_id: data.source_id,
          due_date: data.due_date,
        })
        .select()
        .single();
      if (error) throw error;
      return task;
    },
    onSuccess: () => { invalidateTasks(); toast.success("Đã tạo công việc"); },
    onError: (error) => { toast.error("Lỗi: " + error.message); },
  });

  const createSelfTask = useMutation({
    mutationFn: async (data: { title: string; description?: string; priority?: string; project_id?: string; due_date?: string }) => {
      if (!companyId || !employee?.id) throw new Error("No company or employee");
      
      if (isLocalDemoAuthEnabled()) {
        const tasks = getLocalTasks(companyId, employee.id);
        const newTask: Task = {
          id: `task-${Date.now()}`,
          company_id: companyId,
          project_id: data.project_id || null,
          assigned_by: "local-demo-user",
          assigned_to: employee.id,
          org_unit_id: employee.org_unit_id,
          title: data.title,
          description: data.description || null,
          priority: (data.priority as any) || "normal",
          source_type: "self",
          source_id: null,
          status: "in_progress",
          progress: 0,
          due_date: data.due_date || null,
          started_at: new Date().toISOString(),
          completed_at: null,
          quality_score: null,
          completion_notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        tasks.push(newTask);
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        return newTask;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          company_id: companyId,
          assigned_by: user?.id,
          assigned_to: employee.id,
          project_id: data.project_id || null,
          org_unit_id: employee.org_unit_id,
          title: data.title,
          description: data.description || null,
          priority: data.priority || "normal",
          source_type: "self",
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return task;
    },
    onSuccess: () => { invalidateTasks(); toast.success("Đã tạo công việc cá nhân"); },
    onError: (error) => { toast.error("Lỗi: " + error.message); },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const tasks = getLocalTasks(companyId || "", employee?.id || "emp-local-demo-user");
        const idx = tasks.findIndex(t => t.id === id);
        if (idx >= 0) {
          const updateData: any = { ...updates };
          if (updates.status === "in_progress" && !updates.started_at) {
            updateData.started_at = new Date().toISOString();
          }
          if (updates.status === "done" && !updates.completed_at) {
            updateData.completed_at = new Date().toISOString();
            updateData.progress = 100;
          }
          tasks[idx] = { ...tasks[idx], ...updateData, updated_at: new Date().toISOString() };
          localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
          return tasks[idx];
        }
        throw new Error("Không tìm thấy công việc");
      }

      const updateData: any = { ...updates };
      if (updates.status === "in_progress" && !updates.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if (updates.status === "done" && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
        updateData.progress = 100;
      }
      const { data, error } = await supabase
        .from("tasks").update(updateData).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidateTasks(); toast.success("Đã cập nhật"); },
  });

  const acceptTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (isLocalDemoAuthEnabled()) {
        const tasks = getLocalTasks(companyId || "", employee?.id || "emp-local-demo-user");
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx >= 0) {
          tasks[idx].status = "accepted";
          tasks[idx].updated_at = new Date().toISOString();
          localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
          return tasks[idx];
        }
        throw new Error("Không tìm thấy công việc");
      }

      const { data, error } = await supabase
        .from("tasks").update({ status: "accepted" }).eq("id", taskId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidateTasks(); toast.success("Đã nhận việc"); },
  });

  const startTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (isLocalDemoAuthEnabled()) {
        const tasks = getLocalTasks(companyId || "", employee?.id || "emp-local-demo-user");
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx >= 0) {
          tasks[idx].status = "in_progress";
          tasks[idx].started_at = new Date().toISOString();
          tasks[idx].updated_at = new Date().toISOString();
          localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
          return tasks[idx];
        }
        throw new Error("Không tìm thấy công việc");
      }

      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", taskId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidateTasks(); toast.success("Đã bắt đầu"); },
  });

  const completeTask = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const tasks = getLocalTasks(companyId || "", employee?.id || "emp-local-demo-user");
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx >= 0) {
          tasks[idx].status = "done";
          tasks[idx].progress = 100;
          tasks[idx].completed_at = new Date().toISOString();
          tasks[idx].completion_notes = notes || null;
          tasks[idx].updated_at = new Date().toISOString();
          localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
          return tasks[idx];
        }
        throw new Error("Không tìm thấy công việc");
      }

      const { data, error } = await supabase
        .from("tasks")
        .update({ 
          status: "done", progress: 100,
          completed_at: new Date().toISOString(),
          completion_notes: notes
        })
        .eq("id", taskId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidateTasks(); toast.success("Đã hoàn thành"); },
  });

  // Compute stats from the unfiltered stats query
  const statsData = allTasksForStats || [];
  const now = new Date();
  const taskStats = {
    pending: statsData.filter(t => t.status === "pending").length,
    inProgress: statsData.filter(t => t.status === "in_progress" || t.status === "accepted").length,
    done: statsData.filter(t => t.status === "done").length,
    overdue: statsData.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "done").length,
  };

  const getTaskMetrics = (date: string) => {
    const dayTasks = myTasks?.filter(t => {
      const taskDate = t.completed_at?.split("T")[0] || t.created_at.split("T")[0];
      return taskDate === date;
    }) || [];
    const completed = dayTasks.filter(t => t.status === "done");
    const onTime = completed.filter(t => t.due_date && t.completed_at && t.completed_at <= t.due_date);
    return {
      total_assigned: dayTasks.length,
      completed: completed.length,
      completed_on_time: onTime.length,
      on_time_rate: completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 0,
      avg_quality: completed.length > 0
        ? Math.round(completed.reduce((sum, t) => sum + (t.quality_score || 0), 0) / completed.length * 10) / 10
        : 0,
    };
  };

  return {
    myTasks,
    teamTasks,
    todayCompletedTasks,
    myTasksLoading,
    teamTasksLoading,
    taskStats,
    createTask,
    createSelfTask,
    updateTask,
    acceptTask,
    startTask,
    completeTask,
    getTaskMetrics,
  };
}

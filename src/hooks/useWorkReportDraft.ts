import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useAuth } from "./useAuth";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface DraftTask {
  id: string;
  task_id?: string;
  project_id?: string;
  project_code?: string;
  project_name?: string;
  task: string;
  type: "completed" | "pending" | "blocker";
  source: "voice" | "chat" | "form" | "task";
  created_at: string;
}

interface WorkReportDraft {
  id: string;
  user_id: string;
  company_id: string;
  report_date: string;
  tasks: DraftTask[];
  updated_at: string;
  created_at: string;
}

export function useWorkReportDraft() {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localTasks, setLocalTasks] = useState<DraftTask[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const draftIdRef = useRef<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const { data: draft, isLoading, refetch } = useQuery({
    queryKey: ["work-report-draft", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("work_report_drafts")
        .select("*")
        .eq("user_id", user.id)
        .eq("report_date", today)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const tasks: DraftTask[] = Array.isArray(data.tasks)
          ? (data.tasks as unknown as DraftTask[]) : [];
        draftIdRef.current = data.id;
        return { ...data, tasks } as WorkReportDraft;
      }
      draftIdRef.current = null;
      return null;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (draft && !isInitializedRef.current) {
      setLocalTasks(draft.tasks);
      isInitializedRef.current = true;
    }
  }, [draft]);

  useEffect(() => { isInitializedRef.current = false; draftIdRef.current = null; }, [today]);

  // Optimized save: use cached draftId, upsert pattern
  const saveToDatabaseDebounced = useCallback((tasks: DraftTask[]) => {
    if (!user?.id || !companyId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const tasksJson = JSON.parse(JSON.stringify(tasks)) as Json;
        
        if (draftIdRef.current) {
          // Update existing draft directly
          const { error } = await supabase
            .from("work_report_drafts")
            .update({ tasks: tasksJson, updated_at: new Date().toISOString() })
            .eq("id", draftIdRef.current);
          if (error) throw error;
        } else {
          // Insert new draft and cache ID
          const { data, error } = await supabase
            .from("work_report_drafts")
            .insert({
              user_id: user.id, company_id: companyId, report_date: today,
              tasks: tasksJson,
            })
            .select("id")
            .single();
          if (error) throw error;
          if (data) draftIdRef.current = data.id;
        }
      } catch (error: any) {
        console.error("Auto-save error:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  }, [user?.id, companyId, today]);

  const addTasks = useCallback((newTasks: Omit<DraftTask, "id" | "created_at">[]) => {
    const tasksWithIds: DraftTask[] = newTasks.map(t => ({
      ...t, id: crypto.randomUUID(), created_at: new Date().toISOString(),
    }));
    setLocalTasks(prev => {
      const updated = [...prev, ...tasksWithIds];
      saveToDatabaseDebounced(updated);
      return updated;
    });
  }, [saveToDatabaseDebounced]);

  const removeTask = useCallback((taskId: string) => {
    setLocalTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      saveToDatabaseDebounced(updated);
      return updated;
    });
  }, [saveToDatabaseDebounced]);

  const updateTask = useCallback((taskId: string, updates: Partial<DraftTask>) => {
    setLocalTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, ...updates } : t);
      saveToDatabaseDebounced(updated);
      return updated;
    });
  }, [saveToDatabaseDebounced]);

  const clearDraft = useCallback(async () => {
    setLocalTasks([]);
    draftIdRef.current = null;
    if (!user?.id) return;
    try {
      await supabase.from("work_report_drafts").delete().eq("user_id", user.id).eq("report_date", today);
      queryClient.invalidateQueries({ queryKey: ["work-report-draft"] });
    } catch (error) {
      console.error("Clear draft error:", error);
    }
  }, [user?.id, today, queryClient]);

  const saveNow = useCallback(async () => {
    if (!user?.id || !companyId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    try {
      const tasksJson = JSON.parse(JSON.stringify(localTasks)) as Json;
      if (draftIdRef.current) {
        const { error } = await supabase
          .from("work_report_drafts")
          .update({ tasks: tasksJson, updated_at: new Date().toISOString() })
          .eq("id", draftIdRef.current);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("work_report_drafts")
          .insert({ user_id: user.id, company_id: companyId, report_date: today, tasks: tasksJson })
          .select("id")
          .single();
        if (error) throw error;
        if (data) draftIdRef.current = data.id;
      }
      toast.success("Đã lưu draft");
    } catch (error: any) {
      toast.error("Lỗi lưu: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, companyId, today, localTasks]);

  const importCompletedTasks = useCallback((completedTasks: Array<{
    id: string; title: string; completion_notes?: string | null;
    project?: { name: string; code: string } | null;
    project_id?: string | null;
  }>) => {
    const existingTaskIds = new Set(localTasks.filter(t => t.task_id).map(t => t.task_id));
    const newTasks = completedTasks
      .filter(t => !existingTaskIds.has(t.id))
      .map(t => ({
        task_id: t.id,
        task: t.completion_notes ? `${t.title} — ${t.completion_notes}` : t.title,
        type: "completed" as const,
        source: "task" as const,
        project_id: t.project_id || undefined,
        project_code: t.project?.code,
        project_name: t.project?.name,
      }));
    if (newTasks.length > 0) addTasks(newTasks);
    return newTasks.length;
  }, [localTasks, addTasks]);

  const tasksByProject = localTasks.reduce((acc, task) => {
    const key = task.project_code || "general";
    if (!acc[key]) {
      acc[key] = { project_id: task.project_id, project_code: task.project_code, project_name: task.project_name || "Chung", tasks: [] };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {} as Record<string, { project_id?: string; project_code?: string; project_name: string; tasks: DraftTask[] }>);

  const completedCount = localTasks.filter(t => t.type === "completed").length;
  const pendingCount = localTasks.filter(t => t.type === "pending").length;
  const blockerCount = localTasks.filter(t => t.type === "blocker").length;

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  return {
    tasks: localTasks,
    tasksByProject,
    isLoading,
    isSaving,
    addTasks,
    removeTask,
    updateTask,
    clearDraft,
    saveNow,
    importCompletedTasks,
    refetch,
    stats: { total: localTasks.length, completed: completedCount, pending: pendingCount, blocker: blockerCount },
  };
}

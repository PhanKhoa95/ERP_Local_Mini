import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useAuth } from "./useAuth";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { toast } from "sonner";

export interface WorkflowNode {
  id: string;
  type: "trigger" | "condition" | "action";
  label?: string;
  data?: {
    label: string;
  };
  trigger_type?: string;
  condition_type?: string;
  action_type?: string;
  config?: Record<string, any>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowFlowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Workflow {
  id: string;
  company_id: string;
  created_by: string;
  name: string;
  trigger_type: string;
  description: string | null;
  flow_data: WorkflowFlowData;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowLog {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  trigger_data: any;
  node_executions: any;
  execution_log: any;
  approval_request_id: string | null;
  waiting_for_approval: boolean | null;
  workflow?: {
    name: string;
  } | null;
}

const LOCAL_WORKFLOWS_KEY = "erp-mini-local-demo-workflows";
const LOCAL_WORKFLOW_LOGS_KEY = "erp-mini-local-demo-workflow-logs";

function getLocalWorkflows(companyId: string, userId: string): Workflow[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_WORKFLOWS_KEY);
  if (!raw) {
    const defaultWorkflows: Workflow[] = [
      {
        id: "wf-1",
        company_id: companyId,
        created_by: userId,
        name: "Tự động gửi email cám ơn khách hàng Shopee",
        trigger_type: "order_created",
        description: "Khi phát sinh đơn hàng Shopee mới, tự động gửi email/tin nhắn chào mừng và cám ơn.",
        flow_data: {
          nodes: [
            { id: "node-1", type: "trigger", data: { label: "Đơn hàng Shopee" } },
            { id: "node-2", type: "action", data: { label: "Gửi Email Cám Ơn" } }
          ],
          edges: [
            { id: "edge-1", source: "node-1", target: "node-2" }
          ]
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "wf-2",
        company_id: companyId,
        created_by: userId,
        name: "Đối soát Casso tự động khớp đơn hàng",
        trigger_type: "payment_received",
        description: "Tự động nhận callback biến động số dư VietQR và cập nhật trạng thái đơn hàng.",
        flow_data: {
          nodes: [
            { id: "node-1", type: "trigger", data: { label: "Biến động số dư" } },
            { id: "node-2", type: "action", data: { label: "Cập nhật đơn hàng" } }
          ],
          edges: [
            { id: "edge-1", source: "node-1", target: "node-2" }
          ]
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(LOCAL_WORKFLOWS_KEY, JSON.stringify(defaultWorkflows));
    return defaultWorkflows;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalWorkflows(workflows: Workflow[]) {
  localStorage.setItem(LOCAL_WORKFLOWS_KEY, JSON.stringify(workflows));
}

function getLocalWorkflowLogs(workflowIds: string[]): WorkflowLog[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_WORKFLOW_LOGS_KEY);
  if (!raw) {
    const defaultLogs: WorkflowLog[] = [
      {
        id: "log-1",
        workflow_id: "wf-1",
        status: "success",
        started_at: new Date(Date.now() - 3600000).toISOString(),
        finished_at: new Date(Date.now() - 3598000).toISOString(),
        trigger_data: { order_id: "ord-1" },
        node_executions: {},
        execution_log: [{ time: new Date().toISOString(), message: "Bắt đầu workflow" }],
        approval_request_id: null,
        waiting_for_approval: false,
      }
    ];
    localStorage.setItem(LOCAL_WORKFLOW_LOGS_KEY, JSON.stringify(defaultLogs));
    return defaultLogs;
  }
  try {
    const allLogs: WorkflowLog[] = JSON.parse(raw);
    return allLogs.filter(l => workflowIds.includes(l.workflow_id));
  } catch {
    return [];
  }
}

export function useWorkflows() {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalWorkflows(companyId, user.id);
      }

      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Workflow[];
    },
    enabled: !!companyId && !!user?.id,
  });

  const { data: workflowLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["workflow-logs", companyId, workflows.map(w => w.id)],
    queryFn: async () => {
      if (workflows.length === 0) return [];
      if (isLocalDemoAuthEnabled()) {
        const logs = getLocalWorkflowLogs(workflows.map(w => w.id));
        return logs.map(l => ({
          ...l,
          workflow: workflows.find(w => w.id === l.workflow_id) || null
        }));
      }

      const { data, error } = await supabase
        .from("workflow_logs")
        .select(`
          *,
          workflows(name)
        `)
        .in("workflow_id", workflows.map(w => w.id))
        .order("started_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((l: any) => ({
        ...l,
        workflow: l.workflows ? { name: l.workflows.name } : null
      })) as WorkflowLog[];
    },
    enabled: workflows.length > 0,
  });

  const createWorkflow = useMutation({
    mutationFn: async (payload: { name: string; trigger_type: string; description?: string; flow_data?: WorkflowFlowData }) => {
      if (!companyId || !user?.id) throw new Error("Chưa xác thực");

      const defaultFlowData: WorkflowFlowData = payload.flow_data || {
        nodes: [
          { id: "node-1", type: "trigger", data: { label: `Khi: ${payload.trigger_type}` } }
        ],
        edges: []
      };

      if (isLocalDemoAuthEnabled()) {
        const all = getLocalWorkflows(companyId, user.id);
        const newWorkflow: Workflow = {
          id: `wf-${Date.now()}`,
          company_id: companyId,
          created_by: user.id,
          name: payload.name,
          trigger_type: payload.trigger_type,
          description: payload.description || null,
          flow_data: defaultFlowData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        all.unshift(newWorkflow);
        saveLocalWorkflows(all);
        return newWorkflow;
      }

      const { data, error } = await supabase
        .from("workflows")
        .insert({
          company_id: companyId,
          created_by: user.id,
          name: payload.name,
          trigger_type: payload.trigger_type,
          description: payload.description || null,
          flow_data: defaultFlowData as any,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", companyId] });
      toast.success("Tạo workflow thành công");
    },
    onError: (e: any) => {
      toast.error("Lỗi: " + e.message);
    }
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Workflow> & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalWorkflows(companyId || "", user?.id || "");
        const idx = all.findIndex(w => w.id === id);
        if (idx !== -1) {
          all[idx] = {
            ...all[idx],
            ...updates,
            updated_at: new Date().toISOString()
          } as any;
          saveLocalWorkflows(all);
        }
        return;
      }

      const { error } = await supabase
        .from("workflows")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", companyId] });
      toast.success("Cập nhật workflow thành công");
    },
    onError: (e: any) => {
      toast.error("Lỗi: " + e.message);
    }
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalWorkflows(companyId || "", user?.id || "");
        const filtered = all.filter(w => w.id !== id);
        saveLocalWorkflows(filtered);
        return;
      }

      const { error } = await supabase
        .from("workflows")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", companyId] });
      toast.success("Đã xóa workflow");
    },
    onError: (e: any) => {
      toast.error("Lỗi: " + e.message);
    }
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalWorkflows(companyId || "", user?.id || "");
        const idx = all.findIndex(w => w.id === id);
        if (idx !== -1) {
          all[idx].is_active = isActive;
          all[idx].updated_at = new Date().toISOString();
          saveLocalWorkflows(all);
        }
        return;
      }

      const { error } = await supabase
        .from("workflows")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", companyId] });
      toast.success("Đã cập nhật trạng thái hoạt động");
    },
    onError: (e: any) => {
      toast.error("Lỗi: " + e.message);
    }
  });

  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleActive,
    workflowLogs,
    logsLoading
  };
}

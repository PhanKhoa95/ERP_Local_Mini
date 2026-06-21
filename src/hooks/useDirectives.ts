import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface Directive {
  id: string;
  company_id: string;
  issued_by: string;
  title: string;
  content: string | null;
  source_type: string;
  source_data: any;
  status: string;
  project_id: string | null;
  kpi_targets: any;
  deadline: string | null;
  assigned_manager_id: string | null;
  escalation_count: number;
  created_at: string;
  updated_at: string;
}

const DIRECTIVES_KEY = "erp-mini-local-demo-directives";
const TASKS_KEY = "erp-mini-local-demo-tasks";

const DEFAULT_DIRECTIVES = (companyId: string): Directive[] => [
  {
    id: "dir-1",
    company_id: companyId,
    issued_by: "user-admin",
    title: "Triển khai chiến dịch bán hàng hè và báo cáo doanh số POS",
    content: "Yêu cầu phòng Kinh doanh (Trần Thị B phụ trách) lập kế hoạch, chạy thử hệ thống POS đạt chỉ tiêu doanh số 10.000.000đ trong tuần này và báo cáo.",
    source_type: "meeting",
    source_data: null,
    status: "in_progress",
    project_id: null,
    kpi_targets: null,
    deadline: "2026-06-25",
    assigned_manager_id: "emp-b",
    escalation_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dir-2",
    company_id: companyId,
    issued_by: "user-admin",
    title: "Lập báo cáo kế hoạch và ngân sách lương Quý 3/2026",
    content: "Yêu cầu phòng Kế toán (Lê Văn C phụ trách) tính toán lương tháng hiện tại làm cơ sở lập ngân sách dự phòng cho Quý 3/2026.",
    source_type: "meeting",
    source_data: null,
    status: "in_progress",
    project_id: null,
    kpi_targets: null,
    deadline: "2026-06-30",
    assigned_manager_id: "emp-c",
    escalation_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dir-3",
    company_id: companyId,
    issued_by: "user-admin",
    title: "Kiểm tra và nâng cấp hạ tầng mạng máy chủ ERP",
    content: "Yêu cầu phòng Kỹ thuật (Nguyễn Văn A phụ trách) rà soát hệ thống, backup cơ sở dữ liệu local để phục vụ chạy offline.",
    source_type: "meeting",
    source_data: null,
    status: "in_progress",
    project_id: null,
    kpi_targets: null,
    deadline: "2026-06-20",
    assigned_manager_id: "emp-a",
    escalation_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

function getLocalDirectives(companyId: string): Directive[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DIRECTIVES_KEY);
  if (!raw) {
    const seeded = DEFAULT_DIRECTIVES(companyId);
    localStorage.setItem(DIRECTIVES_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DIRECTIVES(companyId);
  }
}

function saveLocalDirectives(dirs: Directive[]) {
  localStorage.setItem(DIRECTIVES_KEY, JSON.stringify(dirs));
}

export function useDirectives() {
  const { companyId } = useCompanyContext();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: directives, isLoading } = useQuery({
    queryKey: ["directives", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      if (isLocalDemoAuthEnabled()) {
        return getLocalDirectives(companyId);
      }

      const { data, error } = await supabase
        .from("directives")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Directive[];
    },
    enabled: !!companyId,
  });

  const transcribeToTasks = useMutation({
    mutationFn: async (text: string) => {
      if (isLocalDemoAuthEnabled()) {
        // Tải danh sách hiện tại
        const dirs = getLocalDirectives(companyId || "");
        const newDir: Directive = {
          id: `dir-${Date.now()}`,
          company_id: companyId || "",
          issued_by: user?.id || "user-admin",
          title: "Chỉ thị AI bóc tách từ hội thoại",
          content: text,
          source_type: "meeting",
          source_data: null,
          status: "draft",
          project_id: null,
          kpi_targets: null,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          assigned_manager_id: "emp-a",
          escalation_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveLocalDirectives([newDir, ...dirs]);
        return { success: true };
      }

      const { data, error } = await supabase.functions.invoke("ai-task-dispatcher", {
        body: {
          action: "transcribe_to_tasks",
          text,
          company_id: companyId,
          user_id: user?.id,
          source_type: "meeting",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directives"] });
      queryClient.invalidateQueries({ queryKey: ["directive-dashboard-directives"] });
      queryClient.invalidateQueries({ queryKey: ["directive-dashboard-tasks"] });
      toast.success("AI đã bóc tách công việc thành công");
    },
    onError: (error) => toast.error("Lỗi: " + error.message),
  });

  const dispatchDirective = useMutation({
    mutationFn: async (directiveId: string) => {
      if (isLocalDemoAuthEnabled()) {
        const dirs = getLocalDirectives(companyId || "");
        const idx = dirs.findIndex(d => d.id === directiveId);
        if (idx !== -1) {
          dirs[idx].status = "dispatched";
          saveLocalDirectives(dirs);
        }
        return { tasks_created: 1 };
      }

      const { data, error } = await supabase.functions.invoke("ai-task-dispatcher", {
        body: {
          action: "dispatch_directive",
          directive_id: directiveId,
          company_id: companyId,
          user_id: user?.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["directives"] });
      queryClient.invalidateQueries({ queryKey: ["directive-dashboard-directives"] });
      queryClient.invalidateQueries({ queryKey: ["directive-dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks-stats"] });
      queryClient.invalidateQueries({ queryKey: ["team-tasks"] });
      toast.success(`Đã phân phối ${data.tasks_created} công việc`);
    },
    onError: (error) => toast.error("Lỗi: " + error.message),
  });

  const breakdownWbs = useMutation({
    mutationFn: async ({ directiveId, suggestions }: { directiveId: string; suggestions?: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const dirs = getLocalDirectives(companyId || "");
        const targetDir = dirs.find(d => d.id === directiveId);
        const managerId = targetDir?.assigned_manager_id || "emp-a";

        // Tạo sẵn các Tasks con trong localStorage
        const rawTasks = localStorage.getItem(TASKS_KEY);
        const currentTasks = rawTasks ? JSON.parse(rawTasks) : [];

        const timestamp = new Date().toISOString();
        const subTasks = [
          {
            id: `task-sub-${directiveId}-1`,
            company_id: companyId || "",
            title: `[WBS-1] Thực hiện khảo sát & lên kế hoạch của chỉ thị: ${targetDir?.title}`,
            status: "in_progress",
            priority: "high",
            due_date: targetDir?.deadline || null,
            assigned_to: managerId,
            directive_id: directiveId,
            source_type: "directive",
            source_id: null,
            created_at: timestamp,
            updated_at: timestamp,
          },
          {
            id: `task-sub-${directiveId}-2`,
            company_id: companyId || "",
            title: `[WBS-2] Tổng hợp báo cáo & tối ưu quy trình liên quan`,
            status: "in_progress",
            priority: "normal",
            due_date: targetDir?.deadline || null,
            assigned_to: managerId,
            directive_id: directiveId,
            source_type: "directive",
            source_id: null,
            created_at: timestamp,
            updated_at: timestamp,
          }
        ];

        localStorage.setItem(TASKS_KEY, JSON.stringify([...subTasks, ...currentTasks]));

        // Cập nhật trạng thái chỉ thị
        const updatedDirs = dirs.map(d => {
          if (d.id === directiveId) {
            return { ...d, status: "in_progress" };
          }
          return d;
        });
        saveLocalDirectives(updatedDirs);

        return { tasks_created: subTasks.length };
      }

      const { data, error } = await supabase.functions.invoke("ai-task-dispatcher", {
        body: {
          action: "breakdown_wbs",
          directive_id: directiveId,
          company_id: companyId,
          suggestions,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["directives"] });
      queryClient.invalidateQueries({ queryKey: ["directive-dashboard-directives"] });
      queryClient.invalidateQueries({ queryKey: ["directive-dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks-stats"] });
      queryClient.invalidateQueries({ queryKey: ["team-tasks"] });
      toast.success(`WBS: Đã tạo ${data.tasks_created} task chi tiết`);
    },
    onError: (error) => toast.error("Lỗi: " + error.message),
  });

  const stats = {
    total: (directives || []).length,
    draft: (directives || []).filter(d => d.status === "draft").length,
    dispatched: (directives || []).filter(d => d.status === "dispatched").length,
    inProgress: (directives || []).filter(d => d.status === "in_progress").length,
    completed: (directives || []).filter(d => d.status === "completed").length,
  };

  return {
    directives,
    isLoading,
    stats,
    transcribeToTasks,
    dispatchDirective,
    breakdownWbs,
  };
}


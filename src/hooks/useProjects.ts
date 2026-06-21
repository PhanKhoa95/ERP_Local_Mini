import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { toast } from "sonner";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface Project {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description: string | null;
  status: "planning" | "active" | "completed" | "on_hold" | "cancelled";
  start_date: string | null;
  end_date: string | null;
  manager_id: string | null;
  org_unit_id: string | null;
  budget: number | null;
  priority: "low" | "normal" | "high" | "critical";
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  employee_id: string;
  role: "member" | "lead" | "observer";
  allocated_hours: number | null;
  joined_at: string;
}

const PROJECTS_KEY = "erp-mini-local-demo-projects";

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-1",
    company_id: "demo-company",
    name: "Tích hợp Kênh Bán Hàng Shopee",
    code: "SHP",
    description: "Kết nối API Shopee để tự động đồng bộ đơn hàng, tồn kho và trạng thái vận chuyển.",
    status: "active",
    start_date: "2026-06-01",
    end_date: "2026-06-30",
    manager_id: "emp-2",
    org_unit_id: null,
    budget: 50000000,
    priority: "critical",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-2",
    company_id: "demo-company",
    name: "Tối ưu hóa Định mức BOM & Cung ứng",
    code: "SCM",
    description: "Rà soát định mức nguyên vật liệu sản xuất áo thun, tối ưu quy trình hao hụt sợi vải.",
    status: "active",
    start_date: "2026-06-05",
    end_date: "2026-07-15",
    manager_id: "emp-1",
    org_unit_id: null,
    budget: 35000000,
    priority: "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-3",
    company_id: "demo-company",
    name: "Mở rộng Kho bãi Khu vực Miền Nam",
    code: "WHE",
    description: "Khảo sát và thuê kho bãi mới tại Bình Dương có diện tích 500m2 phục vụ chiến dịch cuối năm.",
    status: "planning",
    start_date: "2026-07-01",
    end_date: "2026-09-30",
    manager_id: "emp-3",
    org_unit_id: null,
    budget: 120000000,
    priority: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-4",
    company_id: "demo-company",
    name: "Chiến dịch Marketing Thu Đông 2026",
    code: "MKT",
    description: "Triển khai chiến dịch truyền thông đa kênh phủ thương hiệu BST mới.",
    status: "planning",
    start_date: "2026-08-15",
    end_date: "2026-11-15",
    manager_id: "emp-4",
    org_unit_id: null,
    budget: 80000000,
    priority: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-5",
    company_id: "demo-company",
    name: "Xây dựng Trợ lý ảo AI Chăm sóc Khách hàng",
    code: "AIC",
    description: "Tích hợp mô hình Gemini để trả lời tin nhắn tự động trên Fanpage và Shopee chat.",
    status: "active",
    start_date: "2026-06-10",
    end_date: "2026-08-10",
    manager_id: "emp-1",
    org_unit_id: null,
    budget: 45000000,
    priority: "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

function getLocalProjects(companyId: string): Project[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (!raw) {
    const seeded = DEFAULT_PROJECTS.map(p => ({
      ...p,
      company_id: companyId,
    }));
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

function saveLocalProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function useProjects() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalProjects(companyId);
      }
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!companyId,
  });

  const createProject = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      if (!companyId) throw new Error("No company");
      
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalProjects(companyId);
        const newProj: Project = {
          id: `proj-${Math.random().toString(36).substr(2, 9)}`,
          company_id: companyId,
          name: data.name!,
          code: data.code!,
          description: data.description || null,
          status: data.status || "planning",
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          manager_id: data.manager_id || null,
          org_unit_id: data.org_unit_id || null,
          budget: data.budget || null,
          priority: data.priority || "normal",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        local.unshift(newProj);
        saveLocalProjects(local);
        return newProj;
      }

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          company_id: companyId,
          name: data.name!,
          code: data.code!,
          description: data.description,
          status: data.status || "planning",
          start_date: data.start_date,
          end_date: data.end_date,
          priority: data.priority || "normal",
          budget: data.budget,
        })
        .select()
        .single();
      
      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Đã tạo dự án");
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalProjects(companyId || "demo-company");
        const idx = local.findIndex(p => p.id === id);
        if (idx !== -1) {
          local[idx] = {
            ...local[idx],
            ...updates,
            updated_at: new Date().toISOString(),
          };
          saveLocalProjects(local);
          return local[idx];
        }
        throw new Error("Project not found");
      }

      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Đã cập nhật dự án");
    },
  });

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
  };
}

export function useEmployeeProjects(employeeId?: string) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["employee-projects", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          *,
          project:projects(*)
        `)
        .eq("employee_id", employeeId);
      
      if (error) throw error;
      return data.map((pm: any) => ({
        ...pm.project,
        memberRole: pm.role,
        allocatedHours: pm.allocated_hours,
      })) as (Project & { memberRole: string; allocatedHours: number })[];
    },
    enabled: !!employeeId,
  });

  return { projects, isLoading };
}

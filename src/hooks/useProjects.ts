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
  actual_cost?: number | null;
  progress?: number | null;
  owner_name?: string | null;
  milestones?: string | null;
  deliverables?: string | null;
  cost_documents?: string | null;
  delay_reason?: string | null;
  created_at: string;
  updated_at: string;
}

type SupabaseProjectUpdate = Omit<
  Partial<Project>,
  "actual_cost" | "progress" | "owner_name" | "milestones" | "deliverables" | "cost_documents" | "delay_reason"
>;

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
    name: "Setup Cửa hàng Shopee Shop",
    code: "SHP",
    description: "Thiết lập gian hàng Shopee Shop, đăng bán các sản phẩm Sticker, Card cảm ơn, Bảng QR mica và tối ưu SEO.",
    status: "active",
    start_date: "2026-06-01",
    end_date: "2026-06-30",
    manager_id: "emp-b",
    org_unit_id: null,
    budget: 2000000,
    actual_cost: 1500000,
    progress: 75,
    owner_name: "Trần Thị B",
    milestones: "Đăng ký shop, Đăng bán sản phẩm, Cấu hình SEO",
    deliverables: "Gian hàng trực tuyến vận hành ổn định",
    cost_documents: "HD-012, HD-015",
    delay_reason: "Chờ API Shopee phê duyệt kết nối chính thức",
    priority: "critical",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-2",
    company_id: "demo-company",
    name: "Tối ưu Định mức & Hao hụt Nguyên vật liệu in",
    code: "BOM",
    description: "Tối ưu hóa tiêu hao giấy decal, mực in màu Epson L8050 để giảm tỷ lệ tem lỗi xuống dưới 5%.",
    status: "active",
    start_date: "2026-06-05",
    end_date: "2026-07-15",
    manager_id: "emp-a",
    org_unit_id: null,
    budget: 3000000,
    actual_cost: 2800000,
    progress: 90,
    owner_name: "Nguyễn Văn A",
    milestones: "Đo lường hao hụt decal, Test mẻ in thử nghiệm",
    deliverables: "Bộ tiêu chuẩn định mức hao hụt < 5%",
    cost_documents: "HD-088",
    delay_reason: null,
    priority: "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-3",
    company_id: "demo-company",
    name: "Xây dựng Trợ lý ảo AI Chăm sóc Khách hàng Zalo",
    code: "AIC",
    description: "Tích hợp chatbot AI tự động tư vấn báo giá in ấn và duyệt file in trên kênh Zalo Chat / Zalo OA.",
    status: "planning",
    start_date: "2026-07-01",
    end_date: "2026-08-30",
    manager_id: "emp-d",
    org_unit_id: null,
    budget: 5000000,
    actual_cost: 0,
    progress: 10,
    owner_name: "Lê Văn C",
    milestones: "Đăng ký Zalo OA, Kết nối webhook AI",
    deliverables: "Chatbot trả lời mẫu tự động",
    cost_documents: null,
    delay_reason: "Zalo OA đang chờ duyệt giấy phép kinh doanh",
    priority: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-4",
    company_id: "demo-company",
    name: "Chiến dịch Marketing khai trương đại lý địa phương",
    code: "MKT",
    description: "Thiết kế mẫu in thử miễn phí cho 50 shop online tại địa bàn TP.HCM để kéo khách trực tiếp.",
    status: "planning",
    start_date: "2026-08-15",
    end_date: "2026-09-15",
    manager_id: "emp-a",
    org_unit_id: null,
    budget: 5000000,
    actual_cost: 0,
    progress: 0,
    owner_name: "Phạm Thị D",
    milestones: "Thiết kế mẫu in, Lập danh sách 50 shop online",
    deliverables: "50 đối tác tiếp cận thử mẫu",
    cost_documents: null,
    delay_reason: null,
    priority: "normal",
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

      const {
        actual_cost,
        progress,
        owner_name,
        milestones,
        deliverables,
        cost_documents,
        delay_reason,
        ...supabaseUpdates
      } = updates;

      const { data, error } = await supabase
        .from("projects")
        .update(supabaseUpdates satisfies SupabaseProjectUpdate)
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

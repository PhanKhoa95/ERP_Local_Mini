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
    name: "Bảo vệ Nam Thiên Long",
    code: "NAMTHIEN",
    description: "Triển khai dịch vụ bảo vệ cho chuỗi cửa hàng và tòa nhà văn phòng Nam Thiên Long.",
    status: "active",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    manager_id: "emp-a",
    org_unit_id: null,
    budget: 1500000000,
    actual_cost: 1250000000,
    progress: 78,
    owner_name: "Anh Minh",
    milestones: "Khảo sát thực địa, Ký hợp đồng, Triển khai quân số",
    deliverables: "Bảo vệ mục tiêu an toàn ổn định",
    cost_documents: "HD-NTL-01, HD-NTL-02",
    delay_reason: null,
    priority: "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-2",
    company_id: "demo-company",
    name: "An ninh Công nghệ",
    code: "ANNINH",
    description: "Cung cấp giải pháp an ninh, camera giám sát và kiểm soát ra vào thông minh.",
    status: "active",
    start_date: "2026-02-15",
    end_date: "2026-10-15",
    manager_id: "emp-b",
    org_unit_id: null,
    budget: 1200000000,
    actual_cost: 980000000,
    progress: 74,
    owner_name: "Chị Lan",
    milestones: "Thiết kế sơ đồ, Lắp đặt chạy thử, Nghiệm thu",
    deliverables: "Hệ thống camera AI giám sát thông suốt",
    cost_documents: "HD-AN-01",
    delay_reason: null,
    priority: "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-3",
    company_id: "demo-company",
    name: "Spa Queency",
    code: "QUEENCY",
    description: "Setup trọn gói và khai trương chi nhánh Spa Queency phân khúc cao cấp.",
    status: "active",
    start_date: "2026-03-01",
    end_date: "2026-08-30",
    manager_id: "emp-c",
    org_unit_id: null,
    budget: 2000000000,
    actual_cost: 1420000000,
    progress: 68,
    owner_name: "Chị Hương",
    milestones: "Thuê mặt bằng, Thiết kế nội thất, Tuyển nhân sự, Khai trương pilot",
    deliverables: "Spa Queency chi nhánh 1 vận hành",
    cost_documents: "HD-QC-01",
    delay_reason: null,
    priority: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-4",
    company_id: "demo-company",
    name: "Life Care",
    code: "LIFECAR",
    description: "Dự án chuỗi nhà thuốc và chăm sóc sức khỏe cộng đồng Life Care.",
    status: "active",
    start_date: "2026-01-10",
    end_date: "2026-12-10",
    manager_id: "emp-d",
    org_unit_id: null,
    budget: 1500000000,
    actual_cost: 1080000000,
    progress: 71,
    owner_name: "Anh Phúc",
    milestones: "Giấy phép y tế, Nhập dược phẩm, Đào tạo dược sĩ",
    deliverables: "Hệ thống nhà thuốc đạt chuẩn GPP",
    cost_documents: "HD-LC-01",
    delay_reason: null,
    priority: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-5",
    company_id: "demo-company",
    name: "Phở Cô Ba Sài Gòn",
    code: "COBA",
    description: "Nhượng quyền và mở điểm bán mới cho thương hiệu Phở Cô Ba Sài Gòn.",
    status: "active",
    start_date: "2026-04-01",
    end_date: "2026-09-30",
    manager_id: "emp-a",
    org_unit_id: null,
    budget: 2500000000,
    actual_cost: 1860000000,
    progress: 82,
    owner_name: "Anh Dũng",
    milestones: "Đàm phán nhượng quyền, Ký hợp đồng mặt bằng, Thi công bếp",
    deliverables: "Cửa hàng khai trương đúng tiến độ",
    cost_documents: "HD-COBA-01",
    delay_reason: "Chậm tiến độ bàn giao mặt bằng thi công",
    priority: "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-6",
    company_id: "demo-company",
    name: "Cà phê Aroma",
    code: "AROMA",
    description: "Chuỗi Cà phê Aroma - Setup chi nhánh Aroma Coffee & Tea và tối ưu vận hành.",
    status: "active",
    start_date: "2026-05-01",
    end_date: "2026-11-30",
    manager_id: "emp-b",
    org_unit_id: null,
    budget: 2000000000,
    actual_cost: 1540000000,
    progress: 79,
    owner_name: "Chị Vy",
    milestones: "Setup quầy bar, Đào tạo công thức, Chạy thử nội bộ",
    deliverables: "Quầy bar pha chế hoạt động 100% công suất",
    cost_documents: "HD-ARM-01, HD-ARM-02",
    delay_reason: null,
    priority: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-7",
    company_id: "demo-company",
    name: "Silver Ion",
    code: "SILVER",
    description: "Phát triển mạng lưới nhà phân phối và đại lý dung dịch sát khuẩn Silver Ion.",
    status: "active",
    start_date: "2026-02-01",
    end_date: "2026-08-31",
    manager_id: "emp-c",
    org_unit_id: null,
    budget: 1000000000,
    actual_cost: 920000000,
    progress: 69,
    owner_name: "Anh Khoa",
    milestones: "Đăng ký lưu hành, Ký kết 10 tổng đại lý",
    deliverables: "Hợp đồng phân phối đại lý cấp 1",
    cost_documents: "HD-SI-01",
    delay_reason: "Bị chậm phê duyệt giấy tờ kiểm nghiệm",
    priority: "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-8",
    company_id: "demo-company",
    name: "Queency KLT",
    code: "QUEENKLT",
    description: "Mở rộng đại lý và dịch vụ spa chăm sóc sức khỏe phân khu Queency KLT.",
    status: "active",
    start_date: "2026-03-15",
    end_date: "2026-09-15",
    manager_id: "emp-d",
    org_unit_id: null,
    budget: 1000000000,
    actual_cost: 760000000,
    progress: 70,
    owner_name: "Chị Mai",
    milestones: "Ký kết chuyển giao công nghệ, Đào tạo kỹ thuật viên",
    deliverables: "Chi nhánh spa KLT đi vào hoạt động",
    cost_documents: "HD-QKLT-01",
    delay_reason: null,
    priority: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-9",
    company_id: "demo-company",
    name: "Bách Hóa Thông Minh",
    code: "BACHHOA",
    description: "Phát triển và triển khai hệ thống quản lý bán hàng cho chuỗi Bách Hóa Thông Minh.",
    status: "active",
    start_date: "2026-01-15",
    end_date: "2026-10-15",
    manager_id: "emp-a",
    org_unit_id: null,
    budget: 3000000000,
    actual_cost: 2670000000,
    progress: 58,
    owner_name: "Anh Nam",
    milestones: "Khảo sát mặt bằng, Lắp kệ kho, Đấu nối phần mềm bán hàng",
    deliverables: "15 điểm bách hóa tích hợp phần mềm thông minh",
    cost_documents: "HD-BH-01",
    delay_reason: "Chậm lắp đặt kệ trưng bày nhập khẩu",
    priority: "high",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "proj-10",
    company_id: "demo-company",
    name: "Nhà In Nhỏ",
    code: "NHAIN",
    description: "Dự án phát triển Nhà In Nhỏ - In tem nhãn, logo decal, card cảm ơn tại nhà và Shopee/FB/Zalo.",
    status: "active",
    start_date: "2026-06-01",
    end_date: "2026-12-31",
    manager_id: "emp-b",
    org_unit_id: null,
    budget: 85000000,
    actual_cost: 71369000,
    progress: 85,
    owner_name: "Anh Khoa",
    milestones: "Mua sắm máy Epson L8050, Thiết lập Shopee Shop, Đạt mốc 7.3 đơn/ngày",
    deliverables: "Hệ thống máy in và gian hàng Shopee vận hành tự động",
    cost_documents: "HD-NIN-01, HD-NIN-02",
    delay_reason: null,
    priority: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

function getLocalProjects(companyId: string): Project[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PROJECTS_KEY);
  let projects: Project[] = [];
  if (raw) {
    try {
      projects = JSON.parse(raw);
    } catch {
      projects = [];
    }
  }

  const hasNamThien = projects.some(p => p.code === "NAMTHIEN");
  const hasNhaIn = projects.some(p => p.code === "NHAIN");

  if (!raw || !hasNamThien || !hasNhaIn) {
    const seeded = DEFAULT_PROJECTS.map(p => ({
      ...p,
      company_id: companyId,
    }));
    const merged = [...seeded];
    projects.forEach(p => {
      if (!merged.some(m => m.code === p.code)) {
        merged.push(p);
      }
    });
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(merged));
    return merged;
  }
  return projects;
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

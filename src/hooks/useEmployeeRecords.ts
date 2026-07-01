import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { toast } from "sonner";

import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface WorkHistoryItem {
  company: string;
  role: string;
  period: string;
  description?: string;
}

export interface PromotionHistoryItem {
  date: string;
  previous_role: string;
  new_role: string;
  reason: string;
}

export interface EducationHistoryItem {
  school: string;
  degree: string;
  period: string;
}

export interface EmployeeRecord {
  id: string;
  user_id: string;
  title: string | null;
  hire_date: string | null;
  is_active: boolean;
  total_xp: number;
  org_unit_id: string | null;
  position_id: string | null;
  org_unit_name?: string;
  position_name?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  employee_profile?: EmployeeProfileData | null;
  work_history?: WorkHistoryItem[];
  promotion_history?: PromotionHistoryItem[];
  education_history?: EducationHistoryItem[];
}

export interface EmployeeProfileData {
  id?: string;
  employee_id: string;
  company_id: string;
  date_of_birth: string | null;
  gender: string | null;
  id_number: string | null;
  id_issued_date: string | null;
  id_issued_place: string | null;
  permanent_address: string | null;
  current_address: string | null;
  personal_email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  bank_account?: string | null;
  bank_name?: string | null;
  tax_code?: string | null;
  social_insurance_number?: string | null;
}

const EMPLOYEES_KEY = "erp-mini-local-demo-perf-employees";

const DEFAULT_EMPLOYEES = (companyId: string): EmployeeRecord[] => [
  {
    id: "emp-a",
    user_id: "user-a",
    title: "Chủ shop",
    hire_date: "2024-01-01",
    is_active: true,
    total_xp: 2500,
    org_unit_id: "unit-admin",
    position_id: "pos-owner",
    org_unit_name: "Ban Quản trị",
    position_name: "Chủ shop (bạn)",
    full_name: "Chủ shop (bạn)",
    phone: "0912345678",
    avatar_url: "",
    employee_profile: {
      employee_id: "emp-a",
      company_id: companyId,
      date_of_birth: "1992-05-10",
      gender: "Nam",
      id_number: "123456789",
      id_issued_date: "2015-01-01",
      id_issued_place: "TP.HCM",
      permanent_address: "TP.HCM",
      current_address: "TP.HCM",
      personal_email: "chushop.nhainnho@company.com",
      emergency_contact_name: "Nguyễn Thị Mẹ",
      emergency_contact_phone: "0987654321",
      bank_account: "111222333",
      bank_name: "Vietcombank",
      tax_code: "MST-CHUSHOP",
      social_insurance_number: "BH-CHUSHOP"
    },
    work_history: [
      { company: "Công ty Thiết kế & In ấn K", role: "Trưởng nhóm vận hành", period: "2020 - 2023", description: "Quản lý hệ thống máy in và hoàn thiện thành phẩm." }
    ],
    promotion_history: [
      { date: "01/01/2024", previous_role: "Lập nghiệp", new_role: "Chủ shop", reason: "Khởi nghiệp thành lập Nhà In Nhỏ tại nhà." }
    ],
    education_history: [
      { school: "Đại học Mỹ thuật TP.HCM", degree: "Cử nhân Thiết kế đồ họa", period: "2016 - 2020" }
    ]
  },
  {
    id: "emp-b",
    user_id: "user-b",
    title: "Nhân viên part-time 1",
    hire_date: "2025-05-01",
    is_active: true,
    total_xp: 950,
    org_unit_id: "unit-ops",
    position_id: "pos-staff-ops",
    org_unit_name: "Bộ phận Sản xuất",
    position_name: "Part-time Sản xuất",
    full_name: "Nhân viên part-time 1",
    phone: "0923456789",
    avatar_url: "",
    employee_profile: {
      employee_id: "emp-b",
      company_id: companyId,
      date_of_birth: "2003-08-15",
      gender: "Nam",
      id_number: "223456789",
      id_issued_date: "2021-08-15",
      id_issued_place: "Đồng Nai",
      permanent_address: "Đồng Nai",
      current_address: "TP.HCM",
      personal_email: "parttime1@company.com",
      emergency_contact_name: "Trần Văn A",
      emergency_contact_phone: "0987654322",
      bank_account: "444555666",
      bank_name: "Techcombank",
      tax_code: "MST-PT1",
      social_insurance_number: "BH-PT1"
    },
    work_history: [
      { company: "Cửa hàng photocopy Q", role: "Nhân viên kỹ thuật in", period: "2024 - 2025", description: "Vận hành máy photocopy, máy cắt xén giấy thành phẩm." }
    ],
    promotion_history: [
      { date: "01/05/2025", previous_role: "Thử việc", new_role: "Nhân viên chính thức part-time", reason: "Nắm vững kỹ năng vận hành máy in ảnh và máy bế tem." }
    ],
    education_history: [
      { school: "Đại học Công nghiệp TP.HCM", degree: "Sinh viên năm 3 ngành Cơ khí", period: "2022 - Nay" }
    ]
  },
  {
    id: "emp-c",
    user_id: "user-c",
    title: "Nhân viên part-time 2",
    hire_date: "2025-06-01",
    is_active: true,
    total_xp: 880,
    org_unit_id: "unit-ops",
    position_id: "pos-staff-shipping",
    org_unit_name: "Bộ phận Sản xuất",
    position_name: "Part-time Đóng gói",
    full_name: "Nhân viên part-time 2",
    phone: "0934567890",
    avatar_url: "",
    employee_profile: {
      employee_id: "emp-c",
      company_id: companyId,
      date_of_birth: "2004-10-20",
      gender: "Nữ",
      id_number: "323456789",
      id_issued_date: "2022-10-20",
      id_issued_place: "Long An",
      permanent_address: "Long An",
      current_address: "TP.HCM",
      personal_email: "parttime2@company.com",
      emergency_contact_name: "Lê Thị B",
      emergency_contact_phone: "0987654323",
      bank_account: "777888999",
      bank_name: "BIDV",
      tax_code: "MST-PT2",
      social_insurance_number: "BH-PT2"
    },
    work_history: [
      { company: "Kho Shopee Express", role: "Nhân viên đóng gói", period: "2024 - 2025", description: "Phân loại hàng hóa, đóng hộp và dán mã vận đơn giao hàng nhanh." }
    ],
    promotion_history: [
      { date: "01/06/2025", previous_role: "Thử việc", new_role: "Nhân viên đóng gói chính thức", reason: "Đóng gói hàng chính xác, tốc độ cao, hỗ trợ giao hàng nhanh POS." }
    ],
    education_history: [
      { school: "Đại học Sư phạm Kỹ thuật", degree: "Sinh viên năm 2", period: "2023 - Nay" }
    ]
  },
  {
    id: "emp-d",
    user_id: "user-d",
    title: "Cộng tác viên thiết kế",
    hire_date: "2025-08-01",
    is_active: true,
    total_xp: 1200,
    org_unit_id: "unit-design",
    position_id: "pos-designer",
    org_unit_name: "Bộ phận Thiết kế",
    position_name: "CTV Thiết kế",
    full_name: "Cộng tác viên thiết kế",
    phone: "0945678901",
    avatar_url: "",
    employee_profile: {
      employee_id: "emp-d",
      company_id: companyId,
      date_of_birth: "2002-12-05",
      gender: "Nữ",
      id_number: "423456789",
      id_issued_date: "2020-12-05",
      id_issued_place: "Lâm Đồng",
      permanent_address: "Lâm Đồng",
      current_address: "TP.HCM",
      personal_email: "designer.ctv@company.com",
      emergency_contact_name: "Phạm Văn F",
      emergency_contact_phone: "0987654324",
      bank_account: "101010101",
      bank_name: "VietinBank",
      tax_code: "MST-CTV",
      social_insurance_number: "BH-CTV"
    },
    work_history: [
      { company: "Freelance Designer", role: "Thiết kế nhận diện thương hiệu", period: "2022 - Nay", description: "Thiết kế logo, danh thiếp, bảng biển và ấn phẩm truyền thông." }
    ],
    promotion_history: [
      { date: "01/08/2025", previous_role: "Cộng tác", new_role: "CTV Thiết kế chính thức", reason: "Tốc độ thiết kế avatar & QR code nhanh, được khách hàng đánh giá cao." }
    ],
    education_history: [
      { school: "Đại học Kiến trúc TP.HCM", degree: "Sinh viên năm cuối thiết kế đồ họa", period: "2021 - Nay" }
    ]
  }
];


export function useEmployeeRecords() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employee-records", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(EMPLOYEES_KEY);
        if (!raw) {
          const seeded = DEFAULT_EMPLOYEES(companyId);
          localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(seeded));
          return seeded;
        }
        try {
          return JSON.parse(raw);
        } catch {
          return DEFAULT_EMPLOYEES(companyId);
        }
      }

      const { data: emps, error } = await supabase
        .from("perf_employees")
        .select(`
          id, user_id, title, hire_date, is_active, total_xp, org_unit_id, position_id,
          perf_org_units(name),
          perf_positions(name)
        `)
        .eq("company_id", companyId)
        .order("hire_date", { ascending: false });

      if (error) throw error;

      // Get profiles for names
      const userIds = (emps || []).map((e: any) => e.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url")
        .in("id", userIds);

      // Get employee_profiles
      const empIds = (emps || []).map((e: any) => e.id);
      const { data: empProfiles } = await supabase
        .from("employee_profiles")
        .select("*")
        .in("employee_id", empIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const empProfileMap = new Map((empProfiles || []).map((ep: any) => [ep.employee_id, ep]));

      return (emps || []).map((e: any) => {
        const profile = profileMap.get(e.user_id);
        return {
          id: e.id,
          user_id: e.user_id,
          title: e.title,
          hire_date: e.hire_date,
          is_active: e.is_active,
          total_xp: e.total_xp,
          org_unit_id: e.org_unit_id,
          position_id: e.position_id,
          org_unit_name: e.perf_org_units?.name,
          position_name: e.perf_positions?.name,
          full_name: profile?.full_name,
          phone: profile?.phone,
          avatar_url: profile?.avatar_url,
          employee_profile: empProfileMap.get(e.id) || null,
        } as EmployeeRecord;
      });
    },
    enabled: !!companyId,
  });

  const upsertProfile = useMutation({
    mutationFn: async (data: EmployeeProfileData) => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(EMPLOYEES_KEY);
        const list: EmployeeRecord[] = raw ? JSON.parse(raw) : DEFAULT_EMPLOYEES(companyId || "");
        const updated = list.map(emp => {
          if (emp.id === data.employee_id) {
            return {
              ...emp,
              employee_profile: {
                ...emp.employee_profile,
                ...data
              }
            };
          }
          return emp;
        });
        localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updated));
        return;
      }

      const { error } = await supabase
        .from("employee_profiles")
        .upsert(data, { onConflict: "employee_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-records"] });
      toast.success("Đã lưu hồ sơ nhân viên");
    },
    onError: (e: any) => toast.error("Lỗi: " + e.message),
  });

  return { employees, isLoading, upsertProfile };
}


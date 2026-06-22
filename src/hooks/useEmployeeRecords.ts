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
    title: "Kỹ sư Cấp cao",
    hire_date: "2025-06-16",
    is_active: true,
    total_xp: 1550,
    org_unit_id: "unit-tech",
    position_id: "pos-lead",
    org_unit_name: "Kỹ thuật",
    position_name: "Trưởng phòng",
    full_name: "Nguyễn Văn A",
    phone: "0912345678",
    avatar_url: "",
    employee_profile: {
      employee_id: "emp-a",
      company_id: companyId,
      date_of_birth: "1990-01-01",
      gender: "Nam",
      id_number: "123456789",
      id_issued_date: "2015-01-01",
      id_issued_place: "Hà Nội",
      permanent_address: "Hà Nội",
      current_address: "Hà Nội",
      personal_email: "a.nguyen@company.com",
      emergency_contact_name: "Nguyễn Văn B",
      emergency_contact_phone: "0987654321",
      bank_account: "111222333",
      bank_name: "Vietcombank",
      tax_code: "MST-A",
      social_insurance_number: "BH-A"
    },
    work_history: [
      { company: "VNG Corporation", role: "Kỹ sư phần mềm", period: "2022 - 2024", description: "Lập trình backend NodeJS và thiết kế microservices." },
      { company: "FPT Software", role: "Lập trình viên PHP", period: "2020 - 2022", description: "Bảo trì và phát triển các hệ thống thương mại điện tử." }
    ],
    promotion_history: [
      { date: "16/12/2025", previous_role: "Kỹ sư Tập sự", new_role: "Kỹ sư Cấp cao", reason: "Có đóng góp xuất sắc trong việc triển khai phân hệ Kế toán ERP ngoại tuyến." }
    ],
    education_history: [
      { school: "Đại học Bách Khoa Hà Nội", degree: "Cử nhân Công nghệ thông tin", period: "2016 - 2020" }
    ]
  },
  {
    id: "emp-b",
    user_id: "user-b",
    title: "Sales Agent",
    hire_date: "2025-12-16",
    is_active: true,
    total_xp: 800,
    org_unit_id: "unit-sales",
    position_id: "pos-staff",
    org_unit_name: "Kinh doanh",
    position_name: "Nhân viên",
    full_name: "Trần Thị B",
    phone: "0923456789",
    avatar_url: "",
    employee_profile: {
      employee_id: "emp-b",
      company_id: companyId,
      date_of_birth: "1995-05-15",
      gender: "Nữ",
      id_number: "223456789",
      id_issued_date: "2018-05-15",
      id_issued_place: "Hải Phòng",
      permanent_address: "Hải Phòng",
      current_address: "Hà Nội",
      personal_email: "b.tran@company.com",
      emergency_contact_name: "Trần Văn D",
      emergency_contact_phone: "0987654322",
      bank_account: "444555666",
      bank_name: "Techcombank",
      tax_code: "MST-B",
      social_insurance_number: "BH-B"
    },
    work_history: [
      { company: "Thế giới Di động", role: "Nhân viên tư vấn bán hàng", period: "2023 - 2024", description: "Tư vấn và bán các thiết bị di động, chăm sóc khách hàng." }
    ],
    promotion_history: [
      { date: "01/01/2026", previous_role: "Thử việc", new_role: "Sales Agent chính thức", reason: "Đạt chỉ tiêu doanh số POS vượt định mức 120% trong thời gian thử việc." }
    ],
    education_history: [
      { school: "Đại học Kinh tế Quốc dân", degree: "Cử nhân Quản trị Kinh doanh", period: "2019 - 2023" }
    ]
  },
  {
    id: "emp-c",
    user_id: "user-c",
    title: "Kế toán trưởng",
    hire_date: "2025-10-16",
    is_active: true,
    total_xp: 1100,
    org_unit_id: "unit-acc",
    position_id: "pos-chief",
    org_unit_name: "Kế toán",
    position_name: "Kế toán trưởng",
    full_name: "Lê Văn C",
    phone: "0934567890",
    avatar_url: "",
    employee_profile: {
      employee_id: "emp-c",
      company_id: companyId,
      date_of_birth: "1988-08-20",
      gender: "Nam",
      id_number: "323456789",
      id_issued_date: "2012-08-20",
      id_issued_place: "Đà Nẵng",
      permanent_address: "Đà Nẵng",
      current_address: "TP HCM",
      personal_email: "c.le@company.com",
      emergency_contact_name: "Lê Thị E",
      emergency_contact_phone: "0987654323",
      bank_account: "777888999",
      bank_name: "BIDV",
      tax_code: "MST-C",
      social_insurance_number: "BH-C"
    },
    work_history: [
      { company: "Deloitte Việt Nam", role: "Kiểm toán viên cao cấp", period: "2021 - 2024", description: "Kiểm toán báo cáo tài chính cho các tập đoàn lớn." }
    ],
    promotion_history: [
      { date: "16/10/2025", previous_role: "Kế toán viên", new_role: "Kế toán trưởng", reason: "Sở hữu chứng chỉ CPA Việt Nam và hoàn thành xuất sắc kỳ quyết toán thuế năm." }
    ],
    education_history: [
      { school: "Học viện Tài chính", degree: "Cử nhân Kế toán - Kiểm toán", period: "2017 - 2021" }
    ]
  },
  {
    id: "emp-d",
    user_id: "user-d",
    title: "Trưởng phòng Nhân sự",
    hire_date: "2025-09-16",
    is_active: true,
    total_xp: 1300,
    org_unit_id: "unit-hr",
    position_id: "pos-hr-lead",
    org_unit_name: "Nhân sự",
    position_name: "Trưởng phòng",
    full_name: "Phạm Thị D",
    phone: "0945678901",
    avatar_url: "",
    employee_profile: {
      employee_id: "emp-d",
      company_id: companyId,
      date_of_birth: "1991-11-30",
      gender: "Nữ",
      id_number: "423456789",
      id_issued_date: "2016-11-30",
      id_issued_place: "Cần Thơ",
      permanent_address: "Cần Thơ",
      current_address: "TP HCM",
      personal_email: "d.pham@company.com",
      emergency_contact_name: "Phạm Văn F",
      emergency_contact_phone: "0987654324",
      bank_account: "101010101",
      bank_name: "VietinBank",
      tax_code: "MST-D",
      social_insurance_number: "BH-D"
    },
    work_history: [
      { company: "Tập đoàn Vingroup", role: "Chuyên viên Tuyển dụng", period: "2022 - 2024", description: "Tìm kiếm nhân tài và xây dựng thương hiệu tuyển dụng." }
    ],
    promotion_history: [
      { date: "16/09/2025", previous_role: "Chuyên viên HR", new_role: "Trưởng phòng Nhân sự", reason: "Thiết kế và số hóa thành công quy trình đánh giá KPI toàn diện." }
    ],
    education_history: [
      { school: "Đại học Luật Hà Nội", degree: "Cử nhân Luật Kinh tế", period: "2018 - 2022" }
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


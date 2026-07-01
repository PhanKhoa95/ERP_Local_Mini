import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCompanyContext } from "./useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface CustomRole {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  permissions: {
    modules: Record<string, {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    }>;
    view_cost_price: boolean;
    regions: string[];
  };
  created_at: string;
  updated_at: string;
}

const DEFAULT_PERMISSIONS = {
  admin: {
    modules: {
      pos: { view: true, create: true, edit: true, delete: true },
      orders: { view: true, create: true, edit: true, delete: true },
      inventory: { view: true, create: true, edit: true, delete: true },
      partners: { view: true, create: true, edit: true, delete: true },
      debt: { view: true, create: true, edit: true, delete: true },
      contracts: { view: true, create: true, edit: true, delete: true },
      accounting: { view: true, create: true, edit: true, delete: true },
      finance: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
    },
    view_cost_price: true,
    regions: [] as string[]
  },
  manager: {
    modules: {
      pos: { view: true, create: true, edit: true, delete: true },
      orders: { view: true, create: true, edit: true, delete: true },
      inventory: { view: true, create: true, edit: true, delete: true },
      partners: { view: true, create: true, edit: true, delete: true },
      debt: { view: true, create: true, edit: true, delete: true },
      contracts: { view: true, create: true, edit: true, delete: true },
      accounting: { view: true, create: true, edit: true, delete: true },
      finance: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      settings: { view: false, create: false, edit: false, delete: false },
    },
    view_cost_price: true,
    regions: [] as string[]
  },
  staff: {
    modules: {
      pos: { view: true, create: true, edit: false, delete: false },
      orders: { view: true, create: true, edit: false, delete: false },
      inventory: { view: false, create: false, edit: false, delete: false },
      partners: { view: true, create: true, edit: false, delete: false },
      debt: { view: true, create: true, edit: false, delete: false },
      contracts: { view: false, create: false, edit: false, delete: false },
      accounting: { view: false, create: false, edit: false, delete: false },
      finance: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
    view_cost_price: false,
    regions: [] as string[]
  }
};

const LOCAL_CUSTOM_ROLES_KEY = "erp-mini-local-demo-custom-roles";
const LOCAL_MEMBERS_KEY = "erp-mini-local-demo-company-members";

export function getLocalCustomRoles(): CustomRole[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_CUSTOM_ROLES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getLocalCompanyMembers() {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_MEMBERS_KEY);
  if (!raw) {
    const defaultMembers = [
      {
        id: "demo-member-1",
        user_id: "00000000-0000-4000-8000-000000000002",
        company_id: "00000000-0000-4000-8000-000000000001",
        role: "admin",
        region: null,
        created_at: new Date().toISOString(),
        profile: {
          full_name: "Local Admin",
          phone: "0987654321",
          avatar_url: null
        },
        email: "admin@local.test"
      },
      {
        id: "demo-member-2",
        user_id: "demo-user-2",
        company_id: "00000000-0000-4000-8000-000000000001",
        role: "manager",
        region: "Miền Bắc",
        created_at: new Date().toISOString(),
        profile: {
          full_name: "Demo Manager",
          phone: "0912345678",
          avatar_url: null
        },
        email: "manager@local.test"
      },
      {
        id: "demo-member-3",
        user_id: "demo-user-3",
        company_id: "00000000-0000-4000-8000-000000000001",
        role: "staff",
        region: "Miền Nam",
        created_at: new Date().toISOString(),
        profile: {
          full_name: "Demo Staff",
          phone: "0909090909",
          avatar_url: null
        },
        email: "staff@local.test"
      }
    ];
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(defaultMembers));
    return defaultMembers;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function usePermissions() {
  const { user } = useAuth();
  const { companyId } = useCompanyContext();

  const { data: member, isLoading: isMemberLoading, refetch: refetchMember } = useQuery({
    queryKey: ["current-member", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return null;
      if (isLocalDemoAuthEnabled()) {
        const members = getLocalCompanyMembers();
        return members.find((m: any) => m.user_id === user.id) || null;
      }
      const { data, error } = await supabase
        .from("company_members")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!user?.id
  });

  const { data: customRoles = [], isLoading: isRolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ["custom-roles", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalCustomRoles();
      }
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      
      return (data || []).map((r: any) => {
        let permissions = r.permissions;
        if (typeof permissions === "string") {
          try {
            permissions = JSON.parse(permissions);
          } catch {
            permissions = {};
          }
        }
        return {
          ...r,
          permissions
        };
      }) as CustomRole[];
    },
    enabled: !!companyId
  });

  const userRole = member?.role || null;
  const userRegion = member?.region || null;

  const customRole = customRoles.find(
    (r) => r.name.toLowerCase() === userRole?.toLowerCase()
  );

  const hasPermission = (
    module: string,
    action: "view" | "create" | "edit" | "delete"
  ): boolean => {
    if (!userRole) return false;

    if (customRole) {
      const perms = customRole.permissions;
      const modPerms = perms?.modules?.[module];
      return !!modPerms?.[action];
    }

    const defaultPerms = DEFAULT_PERMISSIONS[userRole.toLowerCase() as keyof typeof DEFAULT_PERMISSIONS];
    if (defaultPerms) {
      const modPerms = defaultPerms.modules[module as keyof typeof defaultPerms.modules];
      return !!modPerms?.[action];
    }

    return false;
  };

  const hasFieldPermission = (module: string, field: string): boolean => {
    if (module === "inventory" && field === "cost_price") {
      if (!userRole) return false;
      if (customRole) {
        return !!customRole.permissions?.view_cost_price;
      }
      const defaultPerms = DEFAULT_PERMISSIONS[userRole.toLowerCase() as keyof typeof DEFAULT_PERMISSIONS];
      if (defaultPerms) {
        return !!defaultPerms.view_cost_price;
      }
      return false;
    }
    return true;
  };

  const getUserRegion = (): string => {
    return userRegion || "";
  };

  const canView = (module: string) => hasPermission(module, "view");
  const canCreate = (module: string) => hasPermission(module, "create");
  const canEdit = (module: string) => hasPermission(module, "edit");
  const canDelete = (module: string) => hasPermission(module, "delete");

  return {
    hasPermission,
    hasFieldPermission,
    getUserRegion,
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    userRegion,
    isLoading: isMemberLoading || isRolesLoading,
    refetch: () => {
      refetchMember();
      refetchRoles();
    }
  };
}

export function getRegionFromProvince(province: string): string {
  if (!province) return "Khác";
  const p = province.toLowerCase().trim();
  
  // Northern provinces
  const northern = [
    "hà nội", "ha noi", "hải phòng", "hai phong", "bắc ninh", "bac ninh", "hà nam", "ha nam", 
    "hải dương", "hai duong", "hưng yên", "hung yen", "nam định", "nam dinh", "ninh bình", "ninh binh", 
    "thái bình", "thai binh", "vĩnh phúc", "vinh phuc", "hà giang", "ha giang", "cao bằng", "cao bang", 
    "bắc kạn", "bac kan", "tuyên quang", "tuyen quang", "lào cai", "lao cai", "yên bái", "yen bai", 
    "thái nguyên", "thai nguyen", "lạng sơn", "lang son", "bắc giang", "bac giang", "quảng ninh", "quang ninh", 
    "phú thọ", "phu tho", "điện biên", "dien bien", "lai châu", "lai chau", "sơn la", "son la", "hòa bình", "hoa binh",
    "miền bắc", "mien bac"
  ];
  
  // Central provinces
  const central = [
    "đà nẵng", "da nang", "thanh hóa", "thanh hoa", "nghệ an", "nghe an", "hà tĩnh", "ha tinh", 
    "quảng bình", "quang binh", "quảng trị", "quang tri", "thừa thiên huế", "thua thien hue", "quảng nam", "quang nam", 
    "quảng ngãi", "quang ngai", "bình định", "binh dinh", "phú yên", "phu yen", "khánh hòa", "khanh hoa", 
    "ninh thuận", "ninh thuan", "bình thuận", "binh thuan", "kon tum", "gia lai", "đắk lắk", "dak lak", 
    "đắk nông", "dak nong", "lâm đồng", "lam dong",
    "miền trung", "mien trung"
  ];
  
  // Southern provinces
  const southern = [
    "hồ chí minh", "ho chi minh", "tp.hcm", "tphcm", "sg", "sài gòn", "sai gon", "bình phước", "binh phuoc", 
    "bình dương", "binh duong", "đồng nai", "dong nai", "tây ninh", "tay ninh", "bà rịa", "ba ria", "vũng tàu", "vung tau", 
    "long an", "đồng tháp", "dong thap", "an giang", "tiền giang", "tien giang", "bến tre", "ben tre", 
    "vĩnh long", "vinh long", "trà vinh", "tra vinh", "hậu giang", "hau giang", "kiên giang", "kien giang", 
    "sóc trăng", "soc trang", "bạc liêu", "bac lieu", "cà mau", "ca mau", "cần thơ", "can tho",
    "miền nam", "mien nam"
  ];

  if (northern.some(prov => p.includes(prov))) return "Miền Bắc";
  if (central.some(prov => p.includes(prov))) return "Miền Trung";
  if (southern.some(prov => p.includes(prov))) return "Miền Nam";
  
  return "Khác";
}


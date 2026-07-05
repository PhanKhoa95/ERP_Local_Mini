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
  let user: any = null;
  let companyId: any = null;

  try {
    const auth = useAuth();
    user = auth?.user;
  } catch (e) {
    // Fallback when called outside AuthProvider (e.g. in tests)
  }

  try {
    const comp = useCompanyContext();
    companyId = comp?.companyId;
  } catch (e) {
    // Fallback when called outside CompanyProvider (e.g. in tests)
  }

  const { data: member, isLoading: isMemberLoading, refetch: refetchMember } = useQuery({
    queryKey: ["current-member", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return null;
      if (isLocalDemoAuthEnabled()) {
        const members = getLocalCompanyMembers();
        const activeMember = members.find((m: any) => m.user_id === user.id);
        if (activeMember) {
          activeMember.role = localStorage.getItem("erp-mini-local-demo-role") || "admin";
        }
        return activeMember || null;
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
      const { data, error } = await (supabase as any)
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

  const hasStorePermission = (permissionKey: string): boolean => {
    if (!userRole) return false;
    const roleKey = userRole.toLowerCase();

    if (roleKey === "admin") return true;

    // 1. Resolve from department if local demo is active and member is assigned to a department
    if (isLocalDemoAuthEnabled() && member) {
      const rawDept = localStorage.getItem("erp-mini-local-demo-departments");
      if (rawDept) {
        try {
          const depts = JSON.parse(rawDept);
          const myDept = depts.find((d: any) => d.member_ids.includes(member.id));
          if (myDept && myDept.store_permissions && myDept.store_permissions[permissionKey] !== undefined) {
            return !!myDept.store_permissions[permissionKey];
          }
        } catch (e) {
          console.error("Resolve store permission from department error:", e);
        }
      }

      // 2. Resolve from personal custom permissions if not in a department
      if (member.custom_permissions && (member.custom_permissions as any)[permissionKey] !== undefined) {
        return !!(member.custom_permissions as any)[permissionKey];
      }
    }

    if (customRole) {
      const perms = customRole.permissions as any;
      if (perms?.store_permissions && perms.store_permissions[permissionKey] !== undefined) {
        return !!perms.store_permissions[permissionKey];
      }
    }

    const roleMap = DEFAULT_STORE_PERMISSIONS[roleKey as keyof typeof DEFAULT_STORE_PERMISSIONS];
    if (roleMap && (roleMap as any)[permissionKey] !== undefined) {
      return !!(roleMap as any)[permissionKey];
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

  const getMaskingConfig = () => {
    if (!isLocalDemoAuthEnabled() || !member) return { hidePhone: false, hideCustomerInfo: false };
    const rawDept = localStorage.getItem("erp-mini-local-demo-departments");
    if (rawDept) {
      try {
        const depts = JSON.parse(rawDept);
        const myDept = depts.find((d: any) => d.member_ids.includes(member.id));
        if (myDept) {
          return {
            hidePhone: !!myDept.hide_phone,
            hideCustomerInfo: !!myDept.hide_customer_info
          };
        }
      } catch (e) {
        console.error("Error reading masking config:", e);
      }
    }
    return { hidePhone: false, hideCustomerInfo: false };
  };

  const maskPhone = (phone: string | null | undefined): string => {
    if (!phone) return "";
    const config = getMaskingConfig();
    if (!config.hidePhone) return phone;
    if (phone.length <= 6) return "***";
    const start = phone.substring(0, 3);
    const end = phone.substring(phone.length - 3);
    return `${start}***${end}`;
  };

  const maskName = (name: string | null | undefined): string => {
    if (!name) return "";
    const config = getMaskingConfig();
    if (!config.hideCustomerInfo) return name;
    const parts = name.trim().split(" ");
    if (parts.length <= 1) return "***";
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first} *** ${last}`;
  };

  const maskAddress = (address: string | null | undefined): string => {
    if (!address) return "";
    const config = getMaskingConfig();
    if (!config.hideCustomerInfo) return address;
    return "Địa chỉ đã ẩn";
  };

  return {
    hasPermission,
    hasStorePermission,
    hasFieldPermission,
    getUserRegion,
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    userRegion,
    maskPhone,
    maskName,
    maskAddress,
    getMaskingConfig,
    isLoading: isMemberLoading || isRolesLoading,
    refetch: () => {
      refetchMember();
      refetchRoles();
    }
  };
}

const DEFAULT_STORE_PERMISSIONS = {
  admin: {
    config_report_all: true,
    config_report_margin: true,
    config_report_commission: true,
    config_report_financial: true,
    config_cashflow_view: true,
    config_cashflow_create: true,
    config_cashflow_update: true,
    config_store_merge: true,
    config_store_settings: true,
    config_staff_settings: true,
    config_channel_settings: true,
    config_warehouse_settings: true,
    config_print_template: true,
    config_notifications: true,
    config_commission_rules: true,
    prod_create: true,
    prod_edit_info: true,
    prod_edit_price: true,
    prod_delete: true,
    prod_stock_manage: true,
    prod_stock_transfer: true,
    prod_view_cost: true,
    prod_view_collaborator_price: true,
    prod_promo_view: true,
    prod_promo_create: true,
    prod_promo_update: true,
    sales_customer_manage: true,
    sales_order_manage: true,
    sales_export: true,
    sales_assign_order: true,
    sales_assign_marketer: true,
    sales_invoice_create: true,
    sales_invoice_approve: true,
    sales_push_carrier: true,
    sales_reconciliation: true,
    app_supplier_manage: true,
    app_brand_manage: true,
    app_materials_manage: true,
    app_supplier_debt: true,
    app_customer_debt: true,
  },
  manager: {
    config_report_all: true,
    config_report_margin: true,
    config_report_commission: true,
    config_report_financial: true,
    config_cashflow_view: true,
    config_cashflow_create: true,
    config_cashflow_update: true,
    config_store_merge: false,
    config_store_settings: false,
    config_staff_settings: false,
    config_channel_settings: true,
    config_warehouse_settings: true,
    config_print_template: true,
    config_notifications: true,
    config_commission_rules: true,
    prod_create: true,
    prod_edit_info: true,
    prod_edit_price: true,
    prod_delete: false,
    prod_stock_manage: true,
    prod_stock_transfer: true,
    prod_view_cost: true,
    prod_view_collaborator_price: true,
    prod_promo_view: true,
    prod_promo_create: true,
    prod_promo_update: true,
    sales_customer_manage: true,
    sales_order_manage: true,
    sales_export: true,
    sales_assign_order: true,
    sales_assign_marketer: true,
    sales_invoice_create: true,
    sales_invoice_approve: true,
    sales_push_carrier: true,
    sales_reconciliation: true,
    app_supplier_manage: true,
    app_brand_manage: true,
    app_materials_manage: true,
    app_supplier_debt: true,
    app_customer_debt: true,
  },
  staff: {
    config_report_all: false,
    config_report_margin: false,
    config_report_commission: false,
    config_report_financial: false,
    config_cashflow_view: false,
    config_cashflow_create: false,
    config_cashflow_update: false,
    config_store_merge: false,
    config_store_settings: false,
    config_staff_settings: false,
    config_channel_settings: false,
    config_warehouse_settings: false,
    config_print_template: false,
    config_notifications: false,
    config_commission_rules: false,
    prod_create: true,
    prod_edit_info: true,
    prod_edit_price: false,
    prod_delete: false,
    prod_stock_manage: false,
    prod_stock_transfer: false,
    prod_view_cost: false,
    prod_view_collaborator_price: false,
    prod_promo_view: true,
    prod_promo_create: false,
    prod_promo_update: false,
    sales_customer_manage: true,
    sales_order_manage: true,
    sales_export: false,
    sales_assign_order: false,
    sales_assign_marketer: false,
    sales_invoice_create: true,
    sales_invoice_approve: false,
    sales_push_carrier: false,
    sales_reconciliation: false,
    app_supplier_manage: false,
    app_brand_manage: false,
    app_materials_manage: false,
    app_supplier_debt: false,
    app_customer_debt: false,
  }
};


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


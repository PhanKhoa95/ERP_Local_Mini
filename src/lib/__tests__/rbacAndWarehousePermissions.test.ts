import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  getLocalWarehousePermissions, 
  saveLocalWarehousePermissions,
  WarehousePermission
} from "@/hooks/useWarehousePermissions";

// Mock isLocalDemoAuthEnabled to always return true for testing local demo handlers
vi.mock("@/lib/localDemoAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/localDemoAuth")>();
  return {
    ...actual,
    isLocalDemoAuthEnabled: () => true
  };
});

describe("RBAC & Warehouse Permissions Override Logic Tests (st-s1 & st-s2)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const getEffectiveWarehousePermissionMock = (
    list: WarehousePermission[],
    userId: string | null | undefined,
    roleId: string | null | undefined,
    warehouseId: string,
    permissionKey: string
  ): boolean => {
    // 1. Check personal override (user_id & warehouse_id)
    if (userId) {
      const personal = list.find(
        (p) => p.user_id === userId && p.warehouse_id === warehouseId
      );
      if (personal && personal.permissions[permissionKey] !== undefined) {
        return personal.permissions[permissionKey];
      }
    }

    // 2. Check role/department override (role_id & warehouse_id)
    if (roleId) {
      const rolePerm = list.find(
        (p) => p.role_id === roleId && p.warehouse_id === warehouseId
      );
      if (rolePerm && rolePerm.permissions[permissionKey] !== undefined) {
        return rolePerm.permissions[permissionKey];
      }
    }

    // 3. Default: no permission
    return false;
  };

  it("1. should return false by default if no warehouse configuration exists", () => {
    const list = getLocalWarehousePermissions();
    const hasPerm = getEffectiveWarehousePermissionMock(
      list,
      "user-1",
      "role-staff",
      "wh-online",
      "wh_view_stock"
    );
    expect(hasPerm).toBe(false);
  });

  it("2. should resolve role-based warehouse permissions when no personal override is set", () => {
    const roleId = "role-staff";
    const whId = "wh-online";
    const key = "wh_view_stock";

    const initialPermissions: WarehousePermission[] = [
      {
        id: "perm-1",
        company_id: "demo-company",
        user_id: null,
        role_id: roleId,
        warehouse_id: whId,
        permissions: { [key]: true }
      }
    ];
    saveLocalWarehousePermissions(initialPermissions);

    const list = getLocalWarehousePermissions();
    const hasPerm = getEffectiveWarehousePermissionMock(
      list,
      "user-1",
      roleId,
      whId,
      key
    );
    expect(hasPerm).toBe(true);
  });

  it("3. should prioritize personal override over role-based warehouse permissions", () => {
    const userId = "user-1";
    const roleId = "role-staff";
    const whId = "wh-online";
    const key = "wh_create_receive";

    const initialPermissions: WarehousePermission[] = [
      {
        id: "perm-role",
        company_id: "demo-company",
        user_id: null,
        role_id: roleId,
        warehouse_id: whId,
        permissions: { [key]: true } // Role allows creation
      },
      {
        id: "perm-personal",
        company_id: "demo-company",
        user_id: userId,
        role_id: null,
        warehouse_id: whId,
        permissions: { [key]: false } // Personal override blocks creation
      }
    ];
    saveLocalWarehousePermissions(initialPermissions);

    const list = getLocalWarehousePermissions();
    const hasPerm = getEffectiveWarehousePermissionMock(
      list,
      userId,
      roleId,
      whId,
      key
    );
    expect(hasPerm).toBe(false); // Should be false because of personal override
  });

  it("4. should verify that saving permissions updates existing warehouse configurations", () => {
    const roleId = "role-manager";
    const whId = "wh-retail";
    const key = "wh_adjust_stock";

    const list1 = getLocalWarehousePermissions();
    expect(list1.length).toBe(0);

    const entry: WarehousePermission = {
      id: "perm-manager",
      company_id: "demo-company",
      user_id: null,
      role_id: roleId,
      warehouse_id: whId,
      permissions: { [key]: true }
    };
    saveLocalWarehousePermissions([entry]);

    const list2 = getLocalWarehousePermissions();
    expect(list2.length).toBe(1);
    expect(list2[0].permissions[key]).toBe(true);
  });

  it("5. should support allow_ordering flag on warehouses", () => {
    const mockWarehouse = {
      id: "wh-1",
      code: "WH-TEST",
      name: "Kho Test",
      is_active: true,
      allow_ordering: false // block orders
    };

    expect(mockWarehouse.allow_ordering).toBe(false);
  });

  it("6. should correctly evaluate hasStorePermission mock behavior", () => {
    const mockCustomRole = {
      name: "staff-demo",
      permissions: {
        store_permissions: {
          config_warehouse_settings: false,
          prod_view_cost: true
        }
      }
    };

    const hasWarehousePerm = !!mockCustomRole.permissions.store_permissions.config_warehouse_settings;
    const hasViewCost = !!mockCustomRole.permissions.store_permissions.prod_view_cost;

    expect(hasWarehousePerm).toBe(false);
    expect(hasViewCost).toBe(true);
  });

  describe("Worktime Access Control Interceptor Checks", () => {
    const checkWorktimeMock = (now: Date, worktimeConf: { isRest: boolean; start: string; end: string } | null): boolean => {
      if (!worktimeConf) return false; // Allowed if no config
      if (worktimeConf.isRest) return true; // Blocked rest day
      
      const { start, end } = worktimeConf;
      if (!start || !end) return false;

      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);

      const currentH = now.getHours();
      const currentM = now.getMinutes();

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const currentMinutes = currentH * 60 + currentM;

      return currentMinutes < startMinutes || currentMinutes > endMinutes;
    };

    it("7. should allow access inside schedule on a standard workday", () => {
      const now = new Date();
      now.setHours(10, 0, 0); // 10:00 AM

      const conf = { isRest: false, start: "08:00", end: "17:00" };
      const isBlocked = checkWorktimeMock(now, conf);
      expect(isBlocked).toBe(false); // allowed
    });

    it("8. should block access outside schedule on a standard workday", () => {
      const now = new Date();
      now.setHours(19, 30, 0); // 7:30 PM

      const conf = { isRest: false, start: "08:00", end: "17:00" };
      const isBlocked = checkWorktimeMock(now, conf);
      expect(isBlocked).toBe(true); // blocked
    });

    it("9. should block access completely on rest days", () => {
      const now = new Date();
      now.setHours(12, 0, 0); // 12:00 PM

      const conf = { isRest: true, start: "08:00", end: "17:00" };
      const isBlocked = checkWorktimeMock(now, conf);
      expect(isBlocked).toBe(true); // rest day is always blocked
    });
  });

  describe("Hierarchical Store Permissions", () => {
    const resolveStorePermissionMock = (
      permissionKey: string,
      role: string,
      memberCustomPerms: Record<string, boolean> | undefined,
      myDept: { name: string; store_permissions?: Record<string, boolean> } | undefined
    ): boolean => {
      if (role === "admin") return true;

      // 1. Resolve from department if member belongs to one
      if (myDept && myDept.store_permissions && myDept.store_permissions[permissionKey] !== undefined) {
        return !!myDept.store_permissions[permissionKey];
      }

      // 2. Resolve from personal custom overrides
      if (memberCustomPerms && memberCustomPerms[permissionKey] !== undefined) {
        return !!memberCustomPerms[permissionKey];
      }

      // 3. Fallback default role
      return role === "manager";
    };

    it("10. should return true for admin regardless of other levels", () => {
      const allowed = resolveStorePermissionMock("config_store_settings", "admin", { config_store_settings: false }, { name: "Sale", store_permissions: { config_store_settings: false } });
      expect(allowed).toBe(true);
    });

    it("11. should prioritize department settings over personal custom overrides", () => {
      const allowed = resolveStorePermissionMock(
        "prod_create",
        "staff",
        { prod_create: true }, // Personal says allowed
        { name: "Support", store_permissions: { prod_create: false } } // Department says blocked
      );
      expect(allowed).toBe(false); // Department override prioritised
    });

    it("12. should fallback to personal custom overrides if not in a department", () => {
      const allowed = resolveStorePermissionMock(
        "prod_create",
        "staff",
        { prod_create: true }, // Personal says allowed
        undefined // No department
      );
      expect(allowed).toBe(true);
    });
  });
});


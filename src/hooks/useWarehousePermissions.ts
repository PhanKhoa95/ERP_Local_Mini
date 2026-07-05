import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

export interface WarehousePermission {
  id: string;
  company_id: string;
  user_id: string | null;
  role_id: string | null;
  warehouse_id: string;
  permissions: Record<string, boolean>;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_WH_PERMS_KEY = "erp-mini-local-demo-warehouse-permissions";

export function getLocalWarehousePermissions(): WarehousePermission[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_WH_PERMS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalWarehousePermissions(list: WarehousePermission[]) {
  localStorage.setItem(LOCAL_WH_PERMS_KEY, JSON.stringify(list));
}

export function useWarehousePermissions() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: whPermissions = [], isLoading } = useQuery({
    queryKey: ["warehouse-permissions-list", companyId],
    queryFn: async (): Promise<WarehousePermission[]> => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalWarehousePermissions();
      }
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("warehouse_permissions" as any)
        .select("*")
        .eq("company_id", companyId);

      if (error) {
        console.error("Error fetching warehouse permissions:", error);
        throw error;
      }

      return (data || []).map((row: any) => {
        let perms = row.permissions;
        if (typeof perms === "string") {
          try {
            perms = JSON.parse(perms);
          } catch {
            perms = {};
          }
        }
        return {
          ...row,
          permissions: perms || {},
        };
      }) as WarehousePermission[];
    },
    enabled: !!companyId,
  });

  const getEffectiveWarehousePermission = (
    userId: string | null | undefined,
    roleId: string | null | undefined,
    warehouseId: string,
    permissionKey: string
  ): boolean => {
    // 1. Check personal override (user_id & warehouse_id)
    if (userId) {
      const personal = whPermissions.find(
        (p) => p.user_id === userId && p.warehouse_id === warehouseId
      );
      if (personal && personal.permissions[permissionKey] !== undefined) {
        return personal.permissions[permissionKey];
      }
    }

    // 2. Check role/department override (role_id & warehouse_id)
    if (roleId) {
      const rolePerm = whPermissions.find(
        (p) => p.role_id === roleId && p.warehouse_id === warehouseId
      );
      if (rolePerm && rolePerm.permissions[permissionKey] !== undefined) {
        return rolePerm.permissions[permissionKey];
      }
    }

    // 3. Default: no permission
    return false;
  };

  const saveWarehousePermission = useMutation({
    mutationFn: async (params: {
      userId: string | null;
      roleId: string | null;
      warehouseId: string;
      permissions: Record<string, boolean>;
    }) => {
      const { userId, roleId, warehouseId, permissions } = params;
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      if (isLocalDemoAuthEnabled()) {
        const list = getLocalWarehousePermissions();
        const existingIdx = list.findIndex(
          (p) =>
            p.warehouse_id === warehouseId &&
            ((userId && p.user_id === userId) || (roleId && p.role_id === roleId))
        );

        if (existingIdx !== -1) {
          list[existingIdx] = {
            ...list[existingIdx],
            permissions: {
              ...list[existingIdx].permissions,
              ...permissions,
            },
            updated_at: new Date().toISOString(),
          };
        } else {
          list.push({
            id: `wh-perm-${Date.now()}`,
            company_id: companyId,
            user_id: userId,
            role_id: roleId,
            warehouse_id: warehouseId,
            permissions,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        saveLocalWarehousePermissions(list);
        return;
      }

      // Supabase mode
      // First, check if there's an existing row matching
      let query = supabase
        .from("warehouse_permissions" as any)
        .select("id, permissions")
        .eq("warehouse_id", warehouseId);

      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("role_id", roleId);
      }

      const { data: existing, error: selectErr } = (await query.maybeSingle()) as any;
      if (selectErr) throw selectErr;

      if (existing) {
        const mergedPerms = {
          ...(existing.permissions as Record<string, boolean> || {}),
          ...permissions,
        };

        const { error: updateErr } = await supabase
          .from("warehouse_permissions" as any)
          .update({
            permissions: mergedPerms,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from("warehouse_permissions" as any)
          .insert({
            company_id: companyId,
            user_id: userId,
            role_id: roleId,
            warehouse_id: warehouseId,
            permissions,
          });
        if (insertErr) throw insertErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-permissions-list", companyId] });
      toast.success("Cập nhật quyền trên kho thành công!");
    },
    onError: (err) => {
      console.error("Error saving warehouse permissions:", err);
      toast.error("Không thể lưu cấu hình quyền trên kho!");
    },
  });

  return {
    whPermissions,
    isLoading,
    getEffectiveWarehousePermission,
    saveWarehousePermission,
  };
}

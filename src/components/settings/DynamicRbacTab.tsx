import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled, LOCAL_DEMO_COMPANY_ID } from "@/lib/localDemoAuth";
import { Plus, Trash2, Shield, ShieldAlert, Loader2, Save } from "lucide-react";
import { getLocalCustomRoles, CustomRole } from "@/hooks/usePermissions";

const MODULES = [
  { id: "pos", name: "Bán hàng (POS)" },
  { id: "orders", name: "Đơn hàng" },
  { id: "inventory", name: "Kho hàng" },
  { id: "partners", name: "Đối tác" },
  { id: "debt", name: "Công nợ" },
  { id: "contracts", name: "Hợp đồng" },
  { id: "accounting", name: "Kế toán" },
  { id: "finance", name: "Tài chính" },
  { id: "reports", name: "Báo cáo" },
  { id: "settings", name: "Cài đặt" }
];

const ACTIONS = [
  { id: "view", name: "Xem" },
  { id: "create", name: "Thêm" },
  { id: "edit", name: "Sửa" },
  { id: "delete", name: "Xóa" }
];

const REGIONS = ["Miền Bắc", "Miền Trung", "Miền Nam"];

const LOCAL_CUSTOM_ROLES_KEY = "erp-mini-local-demo-custom-roles";

export function DynamicRbacTab() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Form states
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [viewCostPrice, setViewCostPrice] = useState(false);
  const [allowedRegions, setAllowedRegions] = useState<string[]>([]);

  const { data: roles = [], isLoading, refetch } = useQuery({
    queryKey: ["custom-roles-list", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalCustomRoles();
      }
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });
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
        return { ...r, permissions };
      }) as CustomRole[];
    },
    enabled: !!companyId
  });

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Initialize form when role changes
  useState(() => {
    if (selectedRole) {
      setRoleName(selectedRole.name);
      setRoleDesc(selectedRole.description || "");
      const permissions = selectedRole.permissions || {};
      setMatrix(permissions.modules || {});
      setViewCostPrice(!!permissions.view_cost_price);
      setAllowedRegions(permissions.regions || []);
    }
  });

  const selectRole = (role: CustomRole) => {
    setSelectedRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    const permissions = role.permissions || {};
    setMatrix(permissions.modules || {});
    setViewCostPrice(!!permissions.view_cost_price);
    setAllowedRegions(permissions.regions || []);
  };

  const handleMatrixChange = (moduleId: string, actionId: string, checked: boolean) => {
    setMatrix((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [actionId]: checked
      }
    }));
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    if (checked) {
      setAllowedRegions((prev) => [...prev, region]);
    } else {
      setAllowedRegions((prev) => prev.filter((r) => r !== region));
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const defaultPerms = {
        modules: MODULES.reduce((acc, m) => {
          acc[m.id] = { view: false, create: false, edit: false, delete: false };
          return acc;
        }, {} as Record<string, Record<string, boolean>>),
        view_cost_price: false,
        regions: []
      };

      if (isLocalDemoAuthEnabled()) {
        const customRoles = getLocalCustomRoles();
        const newRole: CustomRole = {
          id: `custom-role-${Date.now()}`,
          company_id: LOCAL_DEMO_COMPANY_ID,
          name: "Vai trò mới",
          description: "Mô tả vai trò",
          permissions: defaultPerms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        customRoles.push(newRole);
        localStorage.setItem(LOCAL_CUSTOM_ROLES_KEY, JSON.stringify(customRoles));

        // Log local audit
        const logsKey = "erp-mini-local-demo-audit-logs";
        const logs = JSON.parse(localStorage.getItem(logsKey) || "[]");
        logs.unshift({
          id: `log-${Date.now()}`,
          action: "Tạo vai trò tùy chỉnh: Vai trò mới",
          table_name: "custom_roles",
          record_id: newRole.id,
          new_data: newRole,
          created_at: new Date().toISOString(),
          user_email: "admin@local.test"
        });
        localStorage.setItem(logsKey, JSON.stringify(logs));

        return newRole;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("custom_roles")
        .insert({
          company_id: companyId,
          name: "Vai trò mới",
          description: "Mô tả vai trò",
          permissions: defaultPerms
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: "Tạo vai trò tùy chỉnh: Vai trò mới",
        table_name: "custom_roles",
        record_id: data.id,
        new_data: data
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      selectRole(data as any);
      toast({ title: "Đã tạo vai trò mới" });
    },
    onError: (e) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleId) return;
      const permissions = {
        modules: matrix,
        view_cost_price: viewCostPrice,
        regions: allowedRegions
      };

      if (isLocalDemoAuthEnabled()) {
        const customRoles = getLocalCustomRoles();
        const oldRole = customRoles.find((r) => r.id === selectedRoleId);
        const updated = customRoles.map((r) =>
          r.id === selectedRoleId
            ? { ...r, name: roleName, description: roleDesc, permissions, updated_at: new Date().toISOString() }
            : r
        );
        localStorage.setItem(LOCAL_CUSTOM_ROLES_KEY, JSON.stringify(updated));

        // Log local audit
        const logsKey = "erp-mini-local-demo-audit-logs";
        const logs = JSON.parse(localStorage.getItem(logsKey) || "[]");
        logs.unshift({
          id: `log-${Date.now()}`,
          action: `Cập nhật vai trò tùy chỉnh: ${roleName}`,
          table_name: "custom_roles",
          record_id: selectedRoleId,
          old_data: oldRole,
          new_data: { ...oldRole, name: roleName, description: roleDesc, permissions },
          created_at: new Date().toISOString(),
          user_email: "admin@local.test"
        });
        localStorage.setItem(logsKey, JSON.stringify(logs));
        return;
      }

      const { data: oldRole } = await supabase
        .from("custom_roles")
        .select("*")
        .eq("id", selectedRoleId)
        .single();

      const { error } = await supabase
        .from("custom_roles")
        .update({
          name: roleName,
          description: roleDesc,
          permissions
        })
        .eq("id", selectedRoleId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: `Cập nhật cấu hình vai trò tùy chỉnh: ${roleName}`,
        table_name: "custom_roles",
        record_id: selectedRoleId,
        old_data: oldRole,
        new_data: { ...oldRole, name: roleName, description: roleDesc, permissions }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      toast({ title: "Đã lưu cấu hình vai trò" });
    },
    onError: (e) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleId) return;
      
      if (isLocalDemoAuthEnabled()) {
        const customRoles = getLocalCustomRoles();
        const oldRole = customRoles.find((r) => r.id === selectedRoleId);
        const updated = customRoles.filter((r) => r.id !== selectedRoleId);
        localStorage.setItem(LOCAL_CUSTOM_ROLES_KEY, JSON.stringify(updated));

        // Log local audit
        const logsKey = "erp-mini-local-demo-audit-logs";
        const logs = JSON.parse(localStorage.getItem(logsKey) || "[]");
        logs.unshift({
          id: `log-${Date.now()}`,
          action: `Xóa vai trò tùy chỉnh: ${oldRole?.name}`,
          table_name: "custom_roles",
          record_id: selectedRoleId,
          old_data: oldRole,
          created_at: new Date().toISOString(),
          user_email: "admin@local.test"
        });
        localStorage.setItem(logsKey, JSON.stringify(logs));
        return;
      }

      const { data: oldRole } = await supabase
        .from("custom_roles")
        .select("*")
        .eq("id", selectedRoleId)
        .single();

      const { error } = await supabase
        .from("custom_roles")
        .delete()
        .eq("id", selectedRoleId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: `Xóa vai trò tùy chỉnh: ${oldRole?.name}`,
        table_name: "custom_roles",
        record_id: selectedRoleId,
        old_data: oldRole
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      setSelectedRoleId(null);
      toast({ title: "Đã xóa vai trò thành công" });
    },
    onError: (e) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    }
  });

  const handleDelete = () => {
    if (confirm(`Bạn có chắc muốn xóa vai trò "${roleName}"?`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar List of Roles */}
      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Vai trò tùy chỉnh</CardTitle>
          <Button size="icon" variant="ghost" onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-2">
          {roles.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chưa có vai trò tùy chỉnh. Nhấn + để tạo mới.
            </div>
          ) : (
            <div className="space-y-1">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRole(r)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedRoleId === r.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Settings Matrix */}
      <Card className="md:col-span-3">
        {selectedRoleId && selectedRole ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cấu hình quyền hạn</CardTitle>
                  <CardDescription>Thiết lập chi tiết ma trận quyền và thuộc tính ABAC</CardDescription>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa vai trò
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên vai trò *</Label>
                  <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Nhập tên vai trò" />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Nhập mô tả" />
                </div>
              </div>

              {/* Permission Matrix */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Ma trận quyền hạn mô-đun</h4>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="p-3 text-left font-medium">Mô-đun</th>
                        {ACTIONS.map((a) => (
                          <th key={a.id} className="p-3 text-center font-medium w-24">
                            {a.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {MODULES.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/50">
                          <td className="p-3 font-medium text-foreground">{m.name}</td>
                          {ACTIONS.map((a) => {
                            const val = !!matrix[m.id]?.[a.id];
                            return (
                              <td key={a.id} className="p-3 text-center">
                                <Checkbox
                                  checked={val}
                                  onCheckedChange={(checked) => handleMatrixChange(m.id, a.id, !!checked)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Field Level & ABAC */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-sm">Cài đặt thuộc tính đặc biệt (Field & ABAC)</h4>
                
                <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/10">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Xem giá vốn và Biên lợi nhuận</Label>
                    <p className="text-xs text-muted-foreground">Cho phép xem trường giá vốn trong danh sách sản phẩm và báo cáo tài chính.</p>
                  </div>
                  <Switch checked={viewCostPrice} onCheckedChange={setViewCostPrice} />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Khu vực được phép truy cập (ABAC)</Label>
                  <p className="text-xs text-muted-foreground">Nếu chọn, người dùng thuộc vai trò này sẽ chỉ được xem và quản lý dữ liệu thuộc các khu vực tương ứng. Không chọn mặc định là Toàn quốc.</p>
                  <div className="flex gap-6 mt-2">
                    {REGIONS.map((r) => {
                      const checked = allowedRegions.includes(r);
                      return (
                        <div key={r} className="flex items-center gap-2">
                          <Checkbox id={`region-${r}`} checked={checked} onCheckedChange={(c) => handleRegionChange(r, !!c)} />
                          <label htmlFor={`region-${r}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {r}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !roleName.trim()}>
                  {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Lưu cấu hình
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <Shield className="w-16 h-16 opacity-30 mb-4" />
            <h3 className="font-medium text-lg">Chọn hoặc tạo vai trò tùy chỉnh</h3>
            <p className="text-sm">Quản lý quyền hạn hệ thống của bạn ở đây.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

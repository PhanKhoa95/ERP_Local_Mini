import { useState, useEffect } from "react";
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
import { Plus, Trash2, Shield, ShieldAlert, Loader2, Save, Store, Warehouse } from "lucide-react";
import { getLocalCustomRoles, CustomRole } from "@/hooks/usePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useWarehousePermissions } from "@/hooks/useWarehousePermissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const STORE_PERMISSION_GROUPS = [
  {
    title: "Cấu hình (st-s1)",
    permissions: [
      { id: "config_report_all", label: "Báo cáo (Tất cả nhân viên)" },
      { id: "config_report_margin", label: "Báo cáo (Lợi nhuận, giá vốn)" },
      { id: "config_report_commission", label: "Báo cáo (Hoa hồng)" },
      { id: "config_report_financial", label: "Xem báo cáo tài chính" },
      { id: "config_cashflow_view", label: "Xem thu chi" },
      { id: "config_cashflow_create", label: "Tạo thu chi" },
      { id: "config_cashflow_update", label: "Cập nhật thu chi" },
      { id: "config_store_merge", label: "Gộp shop" },
      { id: "config_store_settings", label: "Cấu hình cửa hàng" },
      { id: "config_staff_settings", label: "Cấu hình nhân viên" },
      { id: "config_channel_settings", label: "Cấu hình kênh bán" },
      { id: "config_warehouse_settings", label: "Cấu hình kho" },
      { id: "config_print_template", label: "Cấu hình mẫu in" },
      { id: "config_notifications", label: "Cấu hình thông báo" },
      { id: "config_commission_rules", label: "Cấu hình hoa hồng" },
    ]
  },
  {
    title: "Sản phẩm (st-s1)",
    permissions: [
      { id: "prod_create", label: "Tạo sản phẩm" },
      { id: "prod_edit_info", label: "Sửa thông tin sản phẩm" },
      { id: "prod_edit_price", label: "Sửa giá sản phẩm" },
      { id: "prod_delete", label: "Xóa sản phẩm" },
      { id: "prod_stock_manage", label: "Quản lý tồn kho" },
      { id: "prod_stock_transfer", label: "Chuyển sản phẩm giữa các kho" },
      { id: "prod_view_cost", label: "Xem giá nhập hàng" },
      { id: "prod_view_collaborator_price", label: "Xem giá CTV" },
      { id: "prod_promo_view", label: "Xem khuyến mãi" },
      { id: "prod_promo_create", label: "Tạo khuyến mãi" },
      { id: "prod_promo_update", label: "Cập nhật khuyến mãi" },
    ]
  },
  {
    title: "Bán hàng (st-s1)",
    permissions: [
      { id: "sales_customer_manage", label: "Quản lý khách hàng" },
      { id: "sales_order_manage", label: "Quản lý đơn hàng" },
      { id: "sales_export", label: "Xuất đơn hàng và khách hàng" },
      { id: "sales_assign_order", label: "Phân công đơn hàng" },
      { id: "sales_assign_marketer", label: "Phân công Marketer" },
      { id: "sales_invoice_create", label: "Tạo hóa đơn" },
      { id: "sales_invoice_approve", label: "Duyệt hóa đơn" },
      { id: "sales_push_carrier", label: "Đẩy đơn sang đơn vị vận chuyển" },
      { id: "sales_reconciliation", label: "Đối soát" },
    ]
  },
  {
    title: "Ứng dụng (st-s1)",
    permissions: [
      { id: "app_supplier_manage", label: "Quản lý nhà cung cấp" },
      { id: "app_brand_manage", label: "Quản lý thương hiệu" },
      { id: "app_materials_manage", label: "Quản lý nguyên phụ liệu" },
      { id: "app_supplier_debt", label: "Công nợ nhà cung cấp" },
      { id: "app_customer_debt", label: "Công nợ khách hàng" },
    ]
  }
];

const WAREHOUSE_PERMISSION_GROUPS = [
  {
    title: "Phiếu kho (st-s2)",
    permissions: [
      { id: "wh_view_audit", label: "Xem phiếu kiểm" },
      { id: "wh_create_audit", label: "Tạo phiếu kiểm" },
      { id: "wh_approve_audit", label: "Duyệt phiếu kiểm" },
      { id: "wh_view_receive", label: "Xem phiếu nhập" },
      { id: "wh_create_receive", label: "Tạo phiếu nhập" },
      { id: "wh_approve_receive", label: "Duyệt phiếu nhập" },
      { id: "wh_edit_receive_numbers", label: "Sửa số liệu phiếu nhập" },
      { id: "wh_view_issue", label: "Xem phiếu xuất" },
      { id: "wh_create_issue", label: "Tạo phiếu xuất" },
      { id: "wh_approve_issue", label: "Duyệt phiếu xuất" },
      { id: "wh_view_transfer", label: "Xem phiếu chuyển kho" },
      { id: "wh_create_transfer", label: "Tạo phiếu chuyển kho" },
      { id: "wh_approve_transfer", label: "Hoàn tất chuyển kho" },
    ]
  },
  {
    title: "Quyền chung (st-s2)",
    permissions: [
      { id: "wh_view_stock", label: "Xem số liệu trên kho" },
      { id: "wh_adjust_stock", label: "Điều chỉnh kho" },
      { id: "wh_adjust_stock_excel", label: "Điều chỉnh kho từ Excel" },
      { id: "wh_export_stock_excel", label: "Xuất Excel tồn kho" },
      { id: "wh_edit_location", label: "Chỉnh sửa lô kệ" },
      { id: "wh_view_location", label: "Xem lô kệ" },
    ]
  },
  {
    title: "Bán hàng theo kho (st-s2)",
    permissions: [
      { id: "wh_create_online_order", label: "Tạo đơn hàng online" },
      { id: "wh_create_retail_order", label: "Tạo đơn bán tại quầy" },
      { id: "wh_view_orders", label: "Xem đơn hàng" },
      { id: "wh_update_orders", label: "Cập nhật đơn hàng" },
      { id: "wh_view_reports", label: "Xem báo cáo" },
    ]
  }
];

export function DynamicRbacTab() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const { warehouses = [] } = useWarehouses();
  const { whPermissions, saveWarehousePermission } = useWarehousePermissions();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  // Form states
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [viewCostPrice, setViewCostPrice] = useState(false);
  const [allowedRegions, setAllowedRegions] = useState<string[]>([]);
  const [storePermissions, setStorePermissions] = useState<Record<string, boolean>>({});

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["custom-roles-list", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalCustomRoles();
      }
      const { data, error } = await (supabase as any)
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

  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const selectRole = (role: CustomRole) => {
    setSelectedRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    const permissions = (role.permissions || {}) as any;
    setMatrix(permissions.modules || {});
    setViewCostPrice(!!permissions.view_cost_price);
    setAllowedRegions(permissions.regions || []);
    setStorePermissions(permissions.store_permissions || {});
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

  const handleStorePermChange = (permId: string, checked: boolean) => {
    setStorePermissions((prev) => ({
      ...prev,
      [permId]: checked
    }));
  };

  const handleWarehousePermChange = (permId: string, checked: boolean) => {
    if (!selectedRoleId || !selectedWarehouseId) return;
    saveWarehousePermission.mutate({
      userId: null,
      roleId: selectedRoleId,
      warehouseId: selectedWarehouseId,
      permissions: { [permId]: checked },
    });
  };

  // Get current warehouse permissions config
  const currentWarehouseConfig = selectedRoleId && selectedWarehouseId
    ? whPermissions.find(p => p.role_id === selectedRoleId && p.warehouse_id === selectedWarehouseId)?.permissions || {}
    : {};

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const defaultPerms = {
        modules: MODULES.reduce((acc, m) => {
          acc[m.id] = { view: false, create: false, edit: false, delete: false };
          return acc;
        }, {} as Record<string, Record<string, boolean>>),
        view_cost_price: false,
        regions: [],
        store_permissions: {}
      };

      if (isLocalDemoAuthEnabled()) {
        const customRoles = getLocalCustomRoles();
        const newRole: CustomRole = {
          id: `custom-role-${Date.now()}`,
          company_id: LOCAL_DEMO_COMPANY_ID,
          name: "Vai trò mới",
          description: "Mô tả vai trò",
          permissions: defaultPerms as any,
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
      const { data, error } = await (supabase as any)
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

      await (supabase as any).from("audit_logs").insert({
        user_id: user?.id,
        action: "Tạo vai trò tùy chỉnh: Vai trò mới",
        table_name: "custom_roles",
        record_id: (data as any).id,
        new_data: data as any
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
        regions: allowedRegions,
        store_permissions: storePermissions
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

      const { data: oldRole } = await (supabase as any)
        .from("custom_roles")
        .select("*")
        .eq("id", selectedRoleId)
        .single();

      const { error } = await (supabase as any)
        .from("custom_roles")
        .update({
          name: roleName,
          description: roleDesc,
          permissions
        })
        .eq("id", selectedRoleId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("audit_logs").insert({
        user_id: user?.id,
        action: `Cập nhật cấu hình vai trò tùy chỉnh: ${roleName}`,
        table_name: "custom_roles",
        record_id: selectedRoleId,
        old_data: oldRole as any,
        new_data: { ...oldRole, name: roleName, description: roleDesc, permissions } as any
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

      const { data: oldRole } = await (supabase as any)
        .from("custom_roles")
        .select("*")
        .eq("id", selectedRoleId)
        .single();

      const { error } = await (supabase as any)
        .from("custom_roles")
        .delete()
        .eq("id", selectedRoleId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("audit_logs").insert({
        user_id: user?.id,
        action: `Xóa vai trò tùy chỉnh: ${(oldRole as any)?.name}`,
        table_name: "custom_roles",
        record_id: selectedRoleId,
        old_data: oldRole as any
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
          <Button size="icon" variant="ghost" onClick={() => createMutation.mutate()} className="cursor-pointer">
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
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
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
                  <CardDescription>Thiết lập chi tiết ma trận quyền cửa hàng và quyền theo kho hàng</CardDescription>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending} className="cursor-pointer">
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

              {/* Sub tabs partitioning Store vs Warehouse permissions */}
              <Tabs defaultValue="store_perms" className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="store_perms" className="flex items-center gap-2 cursor-pointer">
                    <Store className="w-4 h-4" />
                    Quyền trên cửa hàng (st-s1)
                  </TabsTrigger>
                  <TabsTrigger value="warehouse_perms" className="flex items-center gap-2 cursor-pointer">
                    <Warehouse className="w-4 h-4" />
                    Quyền trên kho (st-s2)
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Quyền cửa hàng */}
                <TabsContent value="store_perms" className="space-y-6">
                  {/* Module permission matrix */}
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

                  {/* Fine-grained Store Permissions (st-s1) */}
                  <div className="space-y-6 pt-4 border-t">
                    <h4 className="font-semibold text-sm">Phân quyền chi tiết cửa hàng</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {STORE_PERMISSION_GROUPS.map((group) => (
                        <div key={group.title} className="space-y-3 p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/20">
                          <p className="font-bold text-xs text-indigo-650 uppercase tracking-wider">{group.title}</p>
                          <div className="space-y-2">
                            {group.permissions.map((perm) => {
                              const checked = !!storePermissions[perm.id];
                              return (
                                <div key={perm.id} className="flex items-center gap-2">
                                  <Checkbox 
                                    id={`store-perm-${perm.id}`} 
                                    checked={checked} 
                                    onCheckedChange={(c) => handleStorePermChange(perm.id, !!c)} 
                                  />
                                  <label 
                                    htmlFor={`store-perm-${perm.id}`} 
                                    className="text-xs font-medium cursor-pointer"
                                  >
                                    {perm.label}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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
                    <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !roleName.trim()} className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold cursor-pointer">
                      {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Lưu cấu hình cửa hàng
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab 2: Quyền trên kho */}
                <TabsContent value="warehouse_perms" className="space-y-6">
                  {/* Select warehouse */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Chọn kho hàng cấu hình</p>
                      <p className="text-xs text-muted-foreground">
                        Thiết lập quyền thao tác phiếu kho, xem số liệu và bán hàng chi tiết cho kho này
                      </p>
                    </div>
                    <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                      <SelectTrigger className="w-[200px] bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Chọn kho..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fine-grained Warehouse Permissions (st-s2) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {WAREHOUSE_PERMISSION_GROUPS.map((group) => (
                      <div key={group.title} className="space-y-3 p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/20">
                        <p className="font-bold text-xs text-indigo-650 uppercase tracking-wider">{group.title}</p>
                        <div className="space-y-2">
                          {group.permissions.map((perm) => {
                            const checked = !!currentWarehouseConfig[perm.id];
                            return (
                              <div key={perm.id} className="flex items-center gap-2">
                                <Checkbox 
                                  id={`wh-perm-${perm.id}`} 
                                  checked={checked} 
                                  onCheckedChange={(c) => handleWarehousePermChange(perm.id, !!c)} 
                                  disabled={saveWarehousePermission.isPending}
                                />
                                <label 
                                  htmlFor={`wh-perm-${perm.id}`} 
                                  className="text-xs font-medium cursor-pointer"
                                >
                                  {perm.label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <Shield className="w-16 h-16 opacity-30 mb-4 animate-pulse" />
            <h3 className="font-medium text-lg">Chọn hoặc tạo vai trò tùy chỉnh</h3>
            <p className="text-sm">Quản lý quyền hạn hệ thống của bạn ở đây.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, Shield, Users, UserPlus, FolderKanban, Users2, Award, Briefcase, Trash, Sliders } from "lucide-react";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useWarehousePermissions } from "@/hooks/useWarehousePermissions";

const DAYS_OF_WEEK = [
  { key: "mon", label: "Thứ Hai" },
  { key: "tue", label: "Thứ Ba" },
  { key: "wed", label: "Thứ Tư" },
  { key: "thu", label: "Thứ Năm" },
  { key: "fri", label: "Thứ Sáu" },
  { key: "sat", label: "Thứ Bảy" },
  { key: "sun", label: "Chủ Nhật" },
];

const storePermissionGroups = [
  {
    title: "Cấu hình cửa hàng",
    permissions: [
      { key: "config_store_settings", label: "Cấu hình chung cửa hàng" },
      { key: "config_staff_settings", label: "Cấu hình nhân viên & bộ phận" },
      { key: "config_channel_settings", label: "Kết nối kênh bán hàng" },
      { key: "config_warehouse_settings", label: "Cấu hình kho hàng & thêm/xóa kho" },
      { key: "config_print_template", label: "Mẫu in hóa đơn" },
      { key: "config_notifications", label: "Cấu hình thông báo tự động" },
      { key: "config_commission_rules", label: "Quy tắc tính hoa hồng" },
    ]
  },
  {
    title: "Quản lý Sản phẩm & Khuyến mãi",
    permissions: [
      { key: "prod_create", label: "Thêm sản phẩm mới" },
      { key: "prod_edit_info", label: "Sửa thông tin sản phẩm" },
      { key: "prod_edit_price", label: "Sửa giá sản phẩm" },
      { key: "prod_delete", label: "Ẩn/Xóa sản phẩm" },
      { key: "prod_stock_manage", label: "Quản lý xuất nhập tồn" },
      { key: "prod_stock_transfer", label: "Yêu cầu luân chuyển kho" },
      { key: "prod_view_cost", label: "Xem giá vốn" },
      { key: "prod_view_collaborator_price", label: "Xem giá CTV" },
      { key: "prod_promo_view", label: "Xem danh sách khuyến mãi" },
      { key: "prod_promo_create", label: "Tạo chương trình khuyến mãi" },
      { key: "prod_promo_update", label: "Cập nhật khuyến mãi" },
    ]
  },
  {
    title: "Quản lý Bán hàng & Tài chính",
    permissions: [
      { key: "sales_customer_manage", label: "Quản lý thông tin khách hàng" },
      { key: "sales_order_manage", label: "Quản lý đơn hàng" },
      { key: "sales_export", label: "Xuất file danh sách đơn" },
      { key: "sales_assign_order", label: "Phân bổ đơn cho Telesale" },
      { key: "sales_assign_marketer", label: "Phân đơn cho Marketer" },
      { key: "sales_invoice_create", label: "Tạo hóa đơn điện tử" },
      { key: "sales_invoice_approve", label: "Ký duyệt hóa đơn" },
      { key: "sales_push_carrier", label: "Giao vận chuyển" },
      { key: "sales_reconciliation", label: "Đối soát COD nhà vận chuyển" },
      { key: "config_cashflow_view", label: "Xem sổ quỹ thu chi" },
      { key: "config_cashflow_create", label: "Lập phiếu thu chi" },
      { key: "config_cashflow_update", label: "Cập nhật phiếu thu chi" },
    ]
  },
  {
    title: "Ứng dụng & Nhà cung cấp",
    permissions: [
      { key: "app_supplier_manage", label: "Quản lý Nhà cung cấp" },
      { key: "app_brand_manage", label: "Quản lý thương hiệu" },
      { key: "app_materials_manage", label: "Quản lý vật tư sản xuất" },
      { key: "app_supplier_debt", label: "Xem công nợ nhà cung cấp" },
    ]
  }
];

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
};

interface Department {
  id: string;
  name: string;
  description: string;
  member_ids: string[]; // List of company_member IDs
}

interface SalesGroup {
  id: string;
  name: string;
  leader_id: string; // company_member ID of the leader
  member_ids: string[]; // List of company_member IDs
}

export function CompanyMembersTab() {
  const { toast } = useToast();
  const { members, customRoles, isLoading, updateRole, updateRegion, removeMember, addMemberById } = useCompanyMembers();
  const { user } = useAuth();
  const { role } = useCompanyContext();
  const isAdmin = role === "admin";

  const { warehouses = [] } = useWarehouses();
  const { whPermissions = [], saveWarehousePermission } = useWarehousePermissions();

  const [activeTab, setActiveTab] = useState("members");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ userId: "", role: "staff" });
  const [addMethod, setAddMethod] = useState<"uuid" | "email" | "phone" | "facebook_id" | "username">("uuid");
  const [inputValue, setInputValue] = useState("");

  const [configuredMember, setConfiguredMember] = useState<any | null>(null);
  const [activeWhId, setActiveWhId] = useState<string>("");

  // Departments & Sales Groups State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [salesGroups, setSalesGroups] = useState<SalesGroup[]>([]);

  // Modals state for Dept/Group
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", description: "" });
  
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", leader_id: "" });

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const rawDept = localStorage.getItem("erp-mini-local-demo-departments");
    if (rawDept) {
      try { setDepartments(JSON.parse(rawDept)); } catch (e) { console.error("Error parsing departments:", e); }
    } else {
      const defaultDepts: Department[] = [
        { id: "dept-1", name: "Vận hành chính", description: "Bộ phận xử lý đơn hàng và đóng gói", member_ids: ["member-1"] },
        { id: "dept-2", name: "Sản xuất", description: "Bộ phận dệt may và chuẩn bị nguyên phụ liệu", member_ids: [] },
      ];
      setDepartments(defaultDepts);
      localStorage.setItem("erp-mini-local-demo-departments", JSON.stringify(defaultDepts));
    }

    const rawGroups = localStorage.getItem("erp-mini-local-demo-sales-groups");
    if (rawGroups) {
      try { setSalesGroups(JSON.parse(rawGroups)); } catch (e) { console.error("Error parsing sales groups:", e); }
    } else {
      // Find first staff/admin ID for leader or default "member-1"
      const leader = members[0]?.id || "member-1";
      const defaultGroups: SalesGroup[] = [
        { id: "group-1", name: "Telesale Đội 1", leader_id: leader, member_ids: [] },
      ];
      setSalesGroups(defaultGroups);
      localStorage.setItem("erp-mini-local-demo-sales-groups", JSON.stringify(defaultGroups));
    }
  }, [members]);

  const saveDepartments = (list: Department[]) => {
    setDepartments(list);
    localStorage.setItem("erp-mini-local-demo-departments", JSON.stringify(list));
  };

  const saveSalesGroups = (list: SalesGroup[]) => {
    setSalesGroups(list);
    localStorage.setItem("erp-mini-local-demo-sales-groups", JSON.stringify(list));
  };

  // Helper functions
  const getMemberDepartment = (memberId: string) => {
    return departments.find((d) => d.member_ids.includes(memberId));
  };

  const getMemberSalesGroup = (memberId: string) => {
    return salesGroups.find((g) => g.member_ids.includes(memberId) || g.leader_id === memberId);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMemberById.mutateAsync({ 
      userId: addMethod === "uuid" ? formData.userId : "", 
      role: formData.role,
      method: addMethod,
      inputValue: addMethod === "uuid" ? "" : inputValue
    });
    setDialogOpen(false);
    setFormData({ userId: "", role: "staff" });
    setInputValue("");
    setAddMethod("uuid");
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateRole.mutate({ memberId, role: newRole });
  };

  const handleRegionChange = (memberId: string, newRegion: string | null) => {
    updateRegion.mutate({ memberId, region: newRegion });
  };

  const handleRemove = (memberId: string, memberUserId: string) => {
    if (memberUserId === user?.id) return;
    if (confirm("Bạn có chắc muốn xóa thành viên này khỏi công ty?")) {
      removeMember.mutate(memberId);
    }
  };

  // Department CRUD
  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name.trim()) return;
    const created: Department = {
      id: `dept-${Date.now()}`,
      name: newDept.name,
      description: newDept.description,
      member_ids: [],
    };
    saveDepartments([...departments, created]);
    setNewDept({ name: "", description: "" });
    setDeptDialogOpen(false);
    toast({ title: "Đã tạo bộ phận mới" });
  };

  const handleDeleteDept = (id: string) => {
    if (confirm("Xóa bộ phận này? Nhân viên thuộc bộ phận sẽ được gỡ ra.")) {
      saveDepartments(departments.filter((d) => d.id !== id));
      if (selectedDeptId === id) setSelectedDeptId(null);
      toast({ title: "Đã xóa bộ phận" });
    }
  };

  const handleAssignDeptMember = (deptId: string, memberId: string) => {
    const updated = departments.map((d) => {
      // Remove from other departments first to ensure 1 member per department
      const mIds = d.member_ids.filter((id) => id !== memberId);
      if (d.id === deptId) {
        if (!mIds.includes(memberId)) mIds.push(memberId);
      }
      return { ...d, member_ids: mIds };
    });
    saveDepartments(updated);
    toast({ title: "Đã cập nhật bộ phận cho nhân viên" });
  };

  const handleRemoveDeptMember = (deptId: string, memberId: string) => {
    const updated = departments.map((d) => {
      if (d.id === deptId) {
        return { ...d, member_ids: d.member_ids.filter((id) => id !== memberId) };
      }
      return d;
    });
    saveDepartments(updated);
    toast({ title: "Đã gỡ nhân viên khỏi bộ phận" });
  };

  // Sales Group CRUD
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;
    const created: SalesGroup = {
      id: `group-${Date.now()}`,
      name: newGroup.name,
      leader_id: newGroup.leader_id || members[0]?.id || "member-1",
      member_ids: [],
    };
    saveSalesGroups([...salesGroups, created]);
    setNewGroup({ name: "", leader_id: "" });
    setGroupDialogOpen(false);
    toast({ title: "Đã tạo nhóm kinh doanh mới" });
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm("Xóa nhóm kinh doanh này?")) {
      saveSalesGroups(salesGroups.filter((g) => g.id !== id));
      if (selectedGroupId === id) setSelectedGroupId(null);
      toast({ title: "Đã xóa nhóm kinh doanh" });
    }
  };

  const handleAssignGroupMember = (groupId: string, memberId: string) => {
    const updated = salesGroups.map((g) => {
      const mIds = g.member_ids.filter((id) => id !== memberId);
      if (g.id === groupId) {
        if (!mIds.includes(memberId)) mIds.push(memberId);
      }
      return { ...g, member_ids: mIds };
    });
    saveSalesGroups(updated);
    toast({ title: "Đã cập nhật nhóm kinh doanh cho nhân viên" });
  };

  const handleRemoveGroupMember = (groupId: string, memberId: string) => {
    const updated = salesGroups.map((g) => {
      if (g.id === groupId) {
        return { ...g, member_ids: g.member_ids.filter((id) => id !== memberId) };
      }
      return g;
    });
    saveSalesGroups(updated);
    toast({ title: "Đã gỡ nhân viên khỏi nhóm kinh doanh" });
  };

  const handleUpdateGroupLeader = (groupId: string, leaderId: string) => {
    const updated = salesGroups.map((g) => {
      if (g.id === groupId) {
        return { ...g, leader_id: leaderId };
      }
      return g;
    });
    saveSalesGroups(updated);
    toast({ title: "Đã cập nhật Trưởng nhóm" });
  };

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const selectedDept = departments.find((d) => d.id === selectedDeptId);
  const selectedGroup = salesGroups.find((g) => g.id === selectedGroupId);

  return (
    <div className="space-y-6 text-foreground text-xs">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" /> Thành viên ({members.length})
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-1.5">
            <Briefcase className="h-4 w-4" /> Bộ phận ({departments.length})
          </TabsTrigger>
          <TabsTrigger value="sales_groups" className="gap-1.5">
            <Users2 className="h-4 w-4" /> Nhóm kinh doanh ({salesGroups.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Member List */}
        <TabsContent value="members">
          <Card className="border border-border shadow-none">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
              <div>
                <CardTitle className="text-sm font-bold">Thành viên công ty</CardTitle>
                <CardDescription className="text-[11px]">Quản lý thành viên và phân quyền trong tổ chức</CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => setDialogOpen(true)} className="w-full sm:w-auto font-semibold">
                  <UserPlus className="h-4 w-4 mr-2" /> Thêm thành viên
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {!isAdmin && (
                <div className="mb-4 p-3 rounded-lg bg-muted text-muted-foreground border">
                  <Shield className="inline w-3.5 h-3.5 mr-2" />
                  Chỉ quản trị viên mới có thể quản lý thành viên
                </div>
              )}

              <div className="space-y-2">
                {members.map((m) => {
                  const dept = getMemberDepartment(m.id);
                  const sGroup = getMemberSalesGroup(m.id);

                  return (
                    <div
                      key={m.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-secondary/20 border border-border/50 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {(m.profile?.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {m.profile?.full_name || "Chưa đặt tên"}
                            {m.user_id === user?.id && (
                              <Badge variant="outline" className="ml-2 text-[9px] px-1 py-0 bg-white dark:bg-card">Bạn</Badge>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {m.profile?.phone || "—"} · Tham gia {format(new Date(m.created_at), "dd/MM/yyyy", { locale: vi })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Tags for department and sales groups */}
                        {dept && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            {dept.name}
                          </Badge>
                        )}
                        {sGroup && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            {sGroup.name} {sGroup.leader_id === m.id && "👑"}
                          </Badge>
                        )}

                        {isAdmin && m.user_id !== user?.id ? (
                          <>
                            <Select
                              value={m.role}
                              onValueChange={(v) => handleRoleChange(m.id, v)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Vai trò" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                <SelectItem value="admin">Quản trị viên</SelectItem>
                                <SelectItem value="manager">Quản lý</SelectItem>
                                <SelectItem value="staff">Nhân viên</SelectItem>
                                {customRoles.map((r: any) => (
                                  <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={m.region || "all"}
                              onValueChange={(v) => handleRegionChange(m.id, v === "all" ? null : v)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Vùng miền" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                <SelectItem value="all">Toàn quốc</SelectItem>
                                <SelectItem value="Miền Bắc">Miền Bắc</SelectItem>
                                <SelectItem value="Miền Trung">Miền Trung</SelectItem>
                                <SelectItem value="Miền Nam">Miền Nam</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <>
                            <Badge variant={m.role === "admin" ? "destructive" : "default"} className="text-[9px] px-1.5 py-0">
                              {roleLabels[m.role] || m.role}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-white dark:bg-card">
                              {m.region || "Toàn quốc"}
                            </Badge>
                          </>
                        )}
                        {isAdmin && m.user_id !== user?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setConfiguredMember(m);
                                if (warehouses && warehouses.length > 0) {
                                  setActiveWhId(warehouses[0].id);
                                }
                              }}
                              title="Cấu hình nâng cao"
                              className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 mr-1"
                            >
                              <Sliders className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemove(m.id, m.user_id)}
                              className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border text-muted-foreground space-y-1">
                <h4 className="font-bold text-foreground mb-1 text-xs">Mô tả vai trò trong hệ thống:</h4>
                <p><strong>Quản trị viên:</strong> Toàn quyền quản lý hệ thống, thành viên, và các cấu hình nghiệp vụ.</p>
                <p><strong>Quản lý:</strong> Quản lý bán hàng đa kênh, sản xuất, báo cáo thống kê, và phân công.</p>
                <p><strong>Nhân viên:</strong> Lên đơn hàng, chăm sóc khách hàng, và xem các tab được chỉ định.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Departments */}
        <TabsContent value="departments">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dept List */}
            <Card className="lg:col-span-1 border border-border shadow-none">
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold">Danh sách bộ phận</CardTitle>
                {isAdmin && (
                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1" onClick={() => setDeptDialogOpen(true)}>
                    <Plus className="h-3 w-3" /> Tạo mới
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {departments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Chưa có bộ phận nào.</div>
                ) : (
                  departments.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors text-xs border",
                        selectedDeptId === dept.id
                          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-foreground"
                          : "bg-transparent border-transparent hover:bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      <div>
                        <div className="font-bold text-foreground mb-0.5">{dept.name}</div>
                        <div className="text-[10px] text-muted-foreground">{dept.member_ids.length} nhân sự</div>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }} 
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Dept Details */}
            <div className="lg:col-span-2">
              {selectedDept ? (
                <Card className="border border-border shadow-none">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-bold text-foreground">{selectedDept.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      {selectedDept.description || "Chưa có mô tả cho bộ phận này."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Add member to this department */}
                    {isAdmin && (
                      <div className="flex gap-2 items-center max-w-sm">
                        <Select onValueChange={(val) => handleAssignDeptMember(selectedDept.id, val)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Thêm nhân sự vào bộ phận..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {members
                              .filter((m) => !selectedDept.member_ids.includes(m.id))
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.profile?.full_name || m.id}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Member list in department */}
                    <div className="space-y-2">
                      <span className="font-bold text-muted-foreground text-[10px] block">NHÂN SỰ THUỘC BỘ PHẬN</span>
                      {selectedDept.member_ids.length === 0 ? (
                        <div className="text-center py-6 border border-dashed rounded text-muted-foreground">
                          Bộ phận này chưa có nhân sự nào được gán.
                        </div>
                      ) : (
                        selectedDept.member_ids.map((mId) => {
                          const m = members.find((x) => x.id === mId);
                          if (!m) return null;
                          return (
                            <div key={mId} className="flex items-center justify-between p-3.5 bg-secondary/30 rounded border border-border/40">
                              <span className="font-semibold text-foreground">{m.profile?.full_name || m.id}</span>
                              <div className="flex items-center gap-3">
                                <Badge className="text-[9px] px-1 py-0">{roleLabels[m.role] || m.role}</Badge>
                                {isAdmin && (
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleRemoveDeptMember(selectedDept.id, mId)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Department configuration settings */}
                    <div className="flex items-center justify-between p-3.5 bg-secondary/10 rounded border border-border/40 mt-4">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Bộ phận mặc định</Label>
                        <p className="text-[10px] text-muted-foreground">Nhân sự mới thêm vào cửa hàng sẽ tự động gán vào bộ phận này.</p>
                      </div>
                      <Switch
                        checked={selectedDept.is_default || false}
                        onCheckedChange={(checked) => {
                          const updated = departments.map((d) => ({
                            ...d,
                            is_default: d.id === selectedDept.id ? checked : false // only one default
                          }));
                          saveDepartments(updated);
                        }}
                      />
                    </div>

                    {/* Worktime Section */}
                    <div className="space-y-2 border-t pt-4">
                      <span className="font-bold text-muted-foreground text-[10px] block">KHUNG GIỜ LÀM VIỆC BỘ PHẬN</span>
                      <p className="text-[10px] text-muted-foreground">Áp dụng chung cho tất cả nhân sự thuộc bộ phận.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {DAYS_OF_WEEK.map((day) => {
                          const dayConf = selectedDept.worktime?.[day.key] || { isRest: false, start: "08:00", end: "17:00" };
                          return (
                            <div key={day.key} className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-border/40 gap-2">
                              <span className="text-[11px] font-semibold w-16">{day.label}</span>
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={!dayConf.isRest}
                                  onCheckedChange={(checked) => {
                                    const updatedWorktime = {
                                      ...(selectedDept.worktime || {}),
                                      [day.key]: { ...dayConf, isRest: !checked }
                                    };
                                    const updated = departments.map(d => d.id === selectedDept.id ? { ...d, worktime: updatedWorktime } : d);
                                    saveDepartments(updated);
                                  }}
                                />
                                <Input
                                  type="time"
                                  disabled={dayConf.isRest}
                                  value={dayConf.start}
                                  onChange={(e) => {
                                    const updatedWorktime = {
                                      ...(selectedDept.worktime || {}),
                                      [day.key]: { ...dayConf, start: e.target.value }
                                    };
                                    const updated = departments.map(d => d.id === selectedDept.id ? { ...d, worktime: updatedWorktime } : d);
                                    saveDepartments(updated);
                                  }}
                                  className="h-7 w-20 text-center text-xs"
                                />
                                <Input
                                  type="time"
                                  disabled={dayConf.isRest}
                                  value={dayConf.end}
                                  onChange={(e) => {
                                    const updatedWorktime = {
                                      ...(selectedDept.worktime || {}),
                                      [day.key]: { ...dayConf, end: e.target.value }
                                    };
                                    const updated = departments.map(d => d.id === selectedDept.id ? { ...d, worktime: updatedWorktime } : d);
                                    saveDepartments(updated);
                                  }}
                                  className="h-7 w-20 text-center text-xs"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Warehouse permissions mapping */}
                    <div className="space-y-2 border-t pt-4">
                      <span className="font-bold text-muted-foreground text-[10px] block">KHO HÀNG & PHÂN QUYỀN KHO CHUNG</span>
                      <p className="text-[10px] text-muted-foreground">Thiết lập các kho thuộc quyền quản lý của bộ phận này.</p>
                      <div className="space-y-2">
                        {warehouses.map((wh) => {
                          const isLinked = selectedDept.warehouse_ids?.includes(wh.id) || false;
                          return (
                            <div key={wh.id} className="p-3 border rounded-lg bg-secondary/10 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-foreground">{wh.name}</span>
                                <Switch
                                  checked={isLinked}
                                  onCheckedChange={(checked) => {
                                    const whIds = selectedDept.warehouse_ids ? [...selectedDept.warehouse_ids] : [];
                                    const newWhIds = checked
                                      ? [...whIds, wh.id]
                                      : whIds.filter((id) => id !== wh.id);
                                    const updated = departments.map(d => d.id === selectedDept.id ? { ...d, warehouse_ids: newWhIds } : d);
                                    saveDepartments(updated);
                                  }}
                                />
                              </div>

                              {isLinked && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-dashed">
                                  {[
                                    { key: "wh_view_stock", label: "Xem tồn" },
                                    { key: "wh_create_receive", label: "Nhập kho" },
                                    { key: "wh_adjust_stock", label: "Kiểm/Sửa" },
                                    { key: "wh_create_transfer", label: "Chuyển kho" },
                                  ].map((wp) => {
                                    const rawPerms = selectedDept.warehouse_permissions?.[wh.id] || {};
                                    const isWPAllowed = rawPerms[wp.key] ?? false;

                                    return (
                                      <label key={wp.key} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                                        <Checkbox
                                          checked={isWPAllowed}
                                          onCheckedChange={(checked) => {
                                            const whPermsObj = selectedDept.warehouse_permissions || {};
                                            const whPerms = whPermsObj[wh.id] || {};
                                            const updatedWhPerms = {
                                              ...whPermsObj,
                                              [wh.id]: {
                                                ...whPerms,
                                                [wp.key]: !!checked
                                              }
                                            };
                                            const updated = departments.map(d => d.id === selectedDept.id ? { ...d, warehouse_permissions: updatedWhPerms } : d);
                                            saveDepartments(updated);
                                          }}
                                        />
                                        <span>{wp.label}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Department Limits & Data Masking */}
                    <div className="space-y-4 border-t pt-4">
                      <span className="font-bold text-muted-foreground text-[10px] block">GIỚI HẠN & BẢO MẬT DỮ LIỆU</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3.5 bg-secondary/10 rounded border border-border/40">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-semibold">Ẩn số điện thoại</Label>
                            <p className="text-[10px] text-muted-foreground">Che 4 số giữa SĐT khách hàng.</p>
                          </div>
                          <Switch
                            checked={selectedDept.hide_phone || false}
                            onCheckedChange={(checked) => {
                              const updated = departments.map(d => d.id === selectedDept.id ? { ...d, hide_phone: checked } : d);
                              saveDepartments(updated);
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-secondary/10 rounded border border-border/40">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-semibold">Ẩn thông tin khách hàng</Label>
                            <p className="text-[10px] text-muted-foreground">Che tên và địa chỉ khách hàng.</p>
                          </div>
                          <Switch
                            checked={selectedDept.hide_customer_info || false}
                            onCheckedChange={(checked) => {
                              const updated = departments.map(d => d.id === selectedDept.id ? { ...d, hide_customer_info: checked } : d);
                              saveDepartments(updated);
                            }}
                          />
                        </div>
                      </div>

                      {/* Input fields for various constraints */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Trạng thái đơn được xem/sửa (phân cách bằng dấu phẩy)</Label>
                          <Input
                            value={selectedDept.allowed_statuses || ""}
                            onChange={(e) => {
                              const updated = departments.map(d => d.id === selectedDept.id ? { ...d, allowed_statuses: e.target.value } : d);
                              saveDepartments(updated);
                            }}
                            placeholder="Ví dụ: nhap, xac_nhan, dang_giao (để trống là xem tất cả)"
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Danh mục sản phẩm được phép bán (phân cách bằng dấu phẩy)</Label>
                          <Input
                            value={selectedDept.allowed_categories || ""}
                            onChange={(e) => {
                              const updated = departments.map(d => d.id === selectedDept.id ? { ...d, allowed_categories: e.target.value } : d);
                              saveDepartments(updated);
                            }}
                            placeholder="Ví dụ: Ao thun, Vay dam (để trống là xem tất cả)"
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Nguồn đơn hàng được tiếp cận (phân cách bằng dấu phẩy)</Label>
                          <Input
                            value={selectedDept.allowed_channels || ""}
                            onChange={(e) => {
                              const updated = departments.map(d => d.id === selectedDept.id ? { ...d, allowed_channels: e.target.value } : d);
                              saveDepartments(updated);
                            }}
                            placeholder="Ví dụ: Shopee, Facebook, Website (để trống là xem tất cả)"
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Đơn vị vận chuyển được chỉ định (phân cách bằng dấu phẩy)</Label>
                          <Input
                            value={selectedDept.allowed_carriers || ""}
                            onChange={(e) => {
                              const updated = departments.map(d => d.id === selectedDept.id ? { ...d, allowed_carriers: e.target.value } : d);
                              saveDepartments(updated);
                            }}
                            placeholder="Ví dụ: GHTK, GHN, Viettel Post (để trống là xem tất cả)"
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Nhà cung cấp được liên hệ (phân cách bằng dấu phẩy)</Label>
                          <Input
                            value={selectedDept.allowed_suppliers || ""}
                            onChange={(e) => {
                              const updated = departments.map(d => d.id === selectedDept.id ? { ...d, allowed_suppliers: e.target.value } : d);
                              saveDepartments(updated);
                            }}
                            placeholder="Ví dụ: Supplier A, Supplier B (để trống là xem tất cả)"
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Thẻ đơn hàng được lọc (phân cách bằng dấu phẩy)</Label>
                          <Input
                            value={selectedDept.allowed_tags || ""}
                            onChange={(e) => {
                              const updated = departments.map(d => d.id === selectedDept.id ? { ...d, allowed_tags: e.target.value } : d);
                              saveDepartments(updated);
                            }}
                            placeholder="Ví dụ: VIP, Ship gap, Huy (để trống là xem tất cả)"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-16 border border-dashed rounded-lg bg-card text-muted-foreground flex flex-col items-center justify-center">
                  <FolderKanban className="h-10 w-10 opacity-30 mb-2" />
                  <h4 className="font-bold text-foreground mb-1 text-sm">Chưa chọn bộ phận</h4>
                  <p className="text-xs max-w-xs text-muted-foreground">
                    Chọn một bộ phận ở danh sách bên trái để cấu hình gán thành viên.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Sales Groups */}
        <TabsContent value="sales_groups">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Group list */}
            <Card className="lg:col-span-1 border border-border shadow-none">
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold">Nhóm kinh doanh</CardTitle>
                {isAdmin && (
                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1" onClick={() => setGroupDialogOpen(true)}>
                    <Plus className="h-3 w-3" /> Tạo mới
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {salesGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Chưa có nhóm kinh doanh nào.</div>
                ) : (
                  salesGroups.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors text-xs border",
                        selectedGroupId === g.id
                          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-foreground"
                          : "bg-transparent border-transparent hover:bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      <div>
                        <div className="font-bold text-foreground mb-0.5">{g.name}</div>
                        <div className="text-[10px] text-muted-foreground">{g.member_ids.length} nhân sự</div>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }} 
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Group details */}
            <div className="lg:col-span-2">
              {selectedGroup ? (
                <Card className="border border-border shadow-none">
                  <CardHeader className="p-4 border-b space-y-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-foreground">{selectedGroup.name}</CardTitle>
                    </div>
                    {/* Leader settings */}
                    <div className="flex items-center gap-3 bg-secondary/15 p-3 rounded border">
                      <Award className="h-5 w-5 text-yellow-500 shrink-0" />
                      <div className="flex-1">
                        <span className="text-[10px] text-muted-foreground block font-bold">TRƯỞNG NHÓM (LEADER)</span>
                        <span className="font-bold text-foreground">
                          {members.find((x) => x.id === selectedGroup.leader_id)?.profile?.full_name || "Chưa bổ nhiệm"}
                        </span>
                      </div>
                      {isAdmin && (
                        <Select
                          value={selectedGroup.leader_id}
                          onValueChange={(val) => handleUpdateGroupLeader(selectedGroup.id, val)}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs bg-white dark:bg-card">
                            <SelectValue placeholder="Bổ nhiệm..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.profile?.full_name || m.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardHeader>
                   <CardContent className="p-4 space-y-4">
                    {/* General group settings switches */}
                    <div className="space-y-3 p-3.5 rounded bg-secondary/10 border border-border/40">
                      <h4 className="font-bold text-foreground text-[10px]">CÀI ĐẶT BẢO MẬT & PHÂN QUYỀN NHÓM</h4>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold block">Chỉ thấy đơn cùng nhóm</span>
                          <span className="text-[10px] text-muted-foreground">Nhân sự trong nhóm chỉ xem/sửa đơn hàng thuộc các thành viên trong nhóm.</span>
                        </div>
                        <Switch
                          checked={selectedGroup.only_own_orders || false}
                          onCheckedChange={(checked) => {
                            const updated = salesGroups.map((g) =>
                              g.id === selectedGroup.id ? { ...g, only_own_orders: checked } : g
                            );
                            saveSalesGroups(updated);
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-dashed pt-2.5 mt-2.5">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold block">Chỉ thấy thu chi cùng nhóm</span>
                          <span className="text-[10px] text-muted-foreground">Chỉ hiển thị dòng tiền thu chi của nhóm cho các thành viên.</span>
                        </div>
                        <Switch
                          checked={selectedGroup.only_own_cashflow || false}
                          onCheckedChange={(checked) => {
                            const updated = salesGroups.map((g) =>
                              g.id === selectedGroup.id ? { ...g, only_own_cashflow: checked } : g
                            );
                            saveSalesGroups(updated);
                          }}
                        />
                      </div>
                    </div>

                    {/* Add member */}
                    {isAdmin && (
                      <div className="flex gap-2 items-center max-w-sm">
                        <Select onValueChange={(val) => handleAssignGroupMember(selectedGroup.id, val)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Thêm nhân sự sales..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {members
                              .filter((m) => !selectedGroup.member_ids.includes(m.id) && m.id !== selectedGroup.leader_id)
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.profile?.full_name || m.id}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-2">
                      <span className="font-bold text-muted-foreground text-[10px] block">NHÂN VIÊN KINH DOANH</span>
                      {selectedGroup.member_ids.length === 0 ? (
                        <div className="text-center py-6 border border-dashed rounded text-muted-foreground">
                          Chưa có thành viên nào khác trong nhóm.
                        </div>
                      ) : (
                        selectedGroup.member_ids.map((mId) => {
                          const m = members.find((x) => x.id === mId);
                          if (!m) return null;
                          return (
                            <div key={mId} className="flex items-center justify-between p-3.5 bg-secondary/30 rounded border border-border/40">
                              <span className="font-semibold text-foreground">{m.profile?.full_name || m.id}</span>
                              <div className="flex items-center gap-3">
                                <Badge className="text-[9px] px-1 py-0">{roleLabels[m.role] || m.role}</Badge>
                                {isAdmin && (
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleRemoveGroupMember(selectedGroup.id, mId)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-16 border border-dashed rounded-lg bg-card text-muted-foreground flex flex-col items-center justify-center">
                  <Users2 className="h-10 w-10 opacity-30 mb-2" />
                  <h4 className="font-bold text-foreground mb-1 text-sm">Chưa chọn nhóm</h4>
                  <p className="text-xs max-w-xs text-muted-foreground">
                    Chọn một nhóm kinh doanh ở bên trái để chỉ định Leader và gán thành viên.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Invite / Add member */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Thêm thành viên mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Phương thức định danh</Label>
              <Select value={addMethod} onValueChange={(v: any) => setAddMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="uuid">User ID (UUID)</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Số điện thoại</SelectItem>
                  <SelectItem value="facebook_id">Facebook ID</SelectItem>
                  <SelectItem value="username">Tên đăng nhập</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Thông tin định danh *</Label>
              {addMethod === "uuid" ? (
                <Input
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="Ví dụ: 00000000-0000-4000-8000-000000000002"
                />
              ) : (
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    addMethod === "email"
                      ? "Nhập email đăng ký Pancake ID..."
                      : addMethod === "phone"
                      ? "Nhập số điện thoại..."
                      : addMethod === "facebook_id"
                      ? "Nhập Facebook ID..."
                      : "Nhập tên đăng nhập Pancake ID..."
                  }
                />
              )}
              <p className="text-xs text-muted-foreground">
                Định danh nhân viên giúp liên kết tài khoản Supabase / Pancake ID của họ vào cửa hàng.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="manager">Quản lý</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  {customRoles.map((r: any) => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={addMemberById.isPending || (addMethod === "uuid" ? !formData.userId : !inputValue)}
              >
                {addMemberById.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Create Department */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Tạo bộ phận mới</DialogTitle>
            <DialogDescription>Nhập tên bộ phận và mô tả nhiệm vụ cơ bản.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDept} className="space-y-4 text-foreground">
            <div className="space-y-1">
              <Label htmlFor="dName">Tên bộ phận</Label>
              <Input id="dName" placeholder="Telesale, Đóng gói, Main..." value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dDesc">Mô tả</Label>
              <Input id="dDesc" placeholder="Nhiệm vụ chính..." value={newDept.description} onChange={(e) => setNewDept({ ...newDept, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeptDialogOpen(false)}>Hủy</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Tạo bộ phận</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Create Sales Group */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Tạo nhóm kinh doanh mới</DialogTitle>
            <DialogDescription>Nhóm kinh doanh giúp quản lý doanh số bán hàng đa kênh.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4 text-foreground">
            <div className="space-y-1">
              <Label htmlFor="gName">Tên nhóm</Label>
              <Input id="gName" placeholder="Ví dụ: Đội 1, Đội miền Nam..." value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Trưởng nhóm</Label>
              <Select value={newGroup.leader_id} onValueChange={(val) => setNewGroup({ ...newGroup, leader_id: val })}>
                <SelectTrigger><SelectValue placeholder="Chọn Trưởng nhóm..." /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.profile?.full_name || m.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>Hủy</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Tạo nhóm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Configure Member details (Store perms, Wh perms, Worktime) */}
      <Dialog open={!!configuredMember} onOpenChange={(open) => { if (!open) setConfiguredMember(null); }}>
        <DialogContent className="max-w-2xl bg-card border border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cấu hình nhân sự: {configuredMember?.profile?.full_name || configuredMember?.id}</DialogTitle>
            <DialogDescription>
              Thiết lập vai trò, vùng miền, bộ phận, quyền cửa hàng riêng, phân quyền trên kho và thời gian làm việc.
            </DialogDescription>
          </DialogHeader>

          {configuredMember && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="store">Quyền cửa hàng</TabsTrigger>
                <TabsTrigger value="warehouse">Quyền kho</TabsTrigger>
                <TabsTrigger value="worktime">Giờ làm việc</TabsTrigger>
              </TabsList>

              {/* Tab 1: Info & Dept/Group */}
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Vai trò</Label>
                    <Select
                      value={configuredMember.role}
                      onValueChange={(val) => {
                        const updated = members.map(m => m.id === configuredMember.id ? { ...m, role: val } : m);
                        localStorage.setItem("erp-mini-local-demo-company-members", JSON.stringify(updated));
                        setConfiguredMember({ ...configuredMember, role: val });
                        handleRoleChange(configuredMember.id, val);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="admin">Quản trị viên</SelectItem>
                        <SelectItem value="manager">Quản lý</SelectItem>
                        <SelectItem value="staff">Nhân viên</SelectItem>
                        {customRoles.map((r: any) => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Vùng miền</Label>
                    <Select
                      value={configuredMember.region || "all"}
                      onValueChange={(val) => {
                        const regionVal = val === "all" ? null : val;
                        const updated = members.map(m => m.id === configuredMember.id ? { ...m, region: regionVal } : m);
                        localStorage.setItem("erp-mini-local-demo-company-members", JSON.stringify(updated));
                        setConfiguredMember({ ...configuredMember, region: regionVal });
                        handleRegionChange(configuredMember.id, regionVal);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">Toàn quốc</SelectItem>
                        <SelectItem value="Miền Bắc">Miền Bắc</SelectItem>
                        <SelectItem value="Miền Trung">Miền Trung</SelectItem>
                        <SelectItem value="Miền Nam">Miền Nam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Department Assignment */}
                  <div className="space-y-1">
                    <Label>Bộ phận</Label>
                    <Select
                      value={getMemberDepartment(configuredMember.id)?.id || "none"}
                      onValueChange={(val) => {
                        const updatedDepts = departments.map((d) => {
                          const mIds = d.member_ids.filter((id) => id !== configuredMember.id);
                          if (d.id === val) {
                            mIds.push(configuredMember.id);
                          }
                          return { ...d, member_ids: mIds };
                        });
                        saveDepartments(updatedDepts);
                        toast({ title: "Đã cập nhật bộ phận" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="none">Không thuộc bộ phận</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sales Group Assignment */}
                  <div className="space-y-1">
                    <Label>Nhóm kinh doanh</Label>
                    <Select
                      value={getMemberSalesGroup(configuredMember.id)?.id || "none"}
                      onValueChange={(val) => {
                        const updatedGroups = salesGroups.map((g) => {
                          const mIds = g.member_ids.filter((id) => id !== configuredMember.id);
                          let leaderId = g.leader_id;
                          if (g.id === val) {
                            mIds.push(configuredMember.id);
                          } else if (g.leader_id === configuredMember.id) {
                            leaderId = ""; // remove from leader
                          }
                          return { ...g, member_ids: mIds, leader_id: leaderId };
                        });
                        saveSalesGroups(updatedGroups);
                        toast({ title: "Đã cập nhật nhóm kinh doanh" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="none">Không thuộc nhóm nào</SelectItem>
                        {salesGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Store Permissions */}
              <TabsContent value="store" className="space-y-4">
                {getMemberDepartment(configuredMember.id) ? (
                  <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400">
                    Nhân viên này thuộc bộ phận **{getMemberDepartment(configuredMember.id)?.name}**. Quyền cửa hàng của họ được kế thừa hoàn toàn từ bộ phận và không thể chỉnh sửa riêng lẻ.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-[10px]">
                      Quyền cửa hàng cá nhân áp dụng trực tiếp cho nhân viên khi không thuộc bộ phận nào.
                    </p>
                    {storePermissionGroups.map((group) => (
                      <div key={group.title} className="space-y-2 border-b pb-3">
                        <h4 className="font-bold text-foreground text-xs">{group.title}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {group.permissions.map((p) => {
                            const isAllowed = configuredMember.custom_permissions?.[p.key] ?? false;
                            return (
                              <div key={p.key} className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-border/40">
                                <span className="text-[11px] font-medium">{p.label}</span>
                                <Switch
                                  checked={isAllowed}
                                  onCheckedChange={(checked) => {
                                    const customPerms = {
                                      ...(configuredMember.custom_permissions || {}),
                                      [p.key]: checked
                                    };
                                    const updated = members.map(m =>
                                      m.id === configuredMember.id ? { ...m, custom_permissions: customPerms } : m
                                    );
                                    localStorage.setItem("erp-mini-local-demo-company-members", JSON.stringify(updated));
                                    setConfiguredMember({ ...configuredMember, custom_permissions: customPerms });
                                    toast({ title: "Đã cập nhật quyền" });
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Warehouse Permissions */}
              <TabsContent value="warehouse" className="space-y-4">
                <div className="space-y-2">
                  <Label>Chọn kho hàng cấu hình</Label>
                  <Select value={activeWhId} onValueChange={setActiveWhId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kho..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {warehouses?.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeWhId && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-semibold text-xs text-foreground">
                      Quyền hạn tại kho: {warehouses?.find(w => w.id === activeWhId)?.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Cấu hình này ghi đè quyền kho mặc định lấy từ bộ phận.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "wh_view_stock", label: "Xem tồn kho" },
                        { key: "wh_create_receive", label: "Nhập kho (Nhập/Trả)" },
                        { key: "wh_adjust_stock", label: "Kiểm kho & điều chỉnh" },
                        { key: "wh_create_transfer", label: "Yêu cầu chuyển kho" },
                      ].map((wp) => {
                        // Resolve current state
                        const personalWH = whPermissions.find(
                          (p) => p.user_id === configuredMember.user_id && p.warehouse_id === activeWhId
                        );
                        const isWPAllowed = personalWH?.permissions[wp.key] ?? false;

                        return (
                          <div key={wp.key} className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-border/40">
                            <span className="text-[11px] font-medium">{wp.label}</span>
                            <Switch
                              checked={isWPAllowed}
                              onCheckedChange={(checked) => {
                                const currentWH = whPermissions.find(
                                  (p) => p.user_id === configuredMember.user_id && p.warehouse_id === activeWhId
                                );
                                const newWHPerms = {
                                  ...(currentWH?.permissions || {}),
                                  [wp.key]: checked,
                                };
                                saveWarehousePermission.mutate({
                                  userId: configuredMember.user_id,
                                  roleId: null,
                                  warehouseId: activeWhId,
                                  permissions: newWHPerms,
                                });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab 4: Worktime */}
              <TabsContent value="worktime" className="space-y-4">
                <p className="text-muted-foreground text-[10px]">
                  Cấu hình khung giờ được truy cập hệ thống theo từng ngày. Ngoài khung giờ, nhân sự sẽ bị khóa truy cập.
                </p>
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayConf = configuredMember.worktime?.[day.key] || { isRest: false, start: "08:00", end: "17:00" };

                    return (
                      <div key={day.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/40 gap-4">
                        <span className="font-semibold text-foreground w-20">{day.label}</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px] text-muted-foreground">Nghỉ</Label>
                          <Switch
                            checked={dayConf.isRest}
                            onCheckedChange={(checked) => {
                              const newWorktime = {
                                ...(configuredMember.worktime || {}),
                                [day.key]: { ...dayConf, isRest: checked }
                              };
                              const updated = members.map(m =>
                                m.id === configuredMember.id ? { ...m, worktime: newWorktime } : m
                              );
                              localStorage.setItem("erp-mini-local-demo-company-members", JSON.stringify(updated));
                              setConfiguredMember({ ...configuredMember, worktime: newWorktime });
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            disabled={dayConf.isRest}
                            value={dayConf.start}
                            onChange={(e) => {
                              const newWorktime = {
                                ...(configuredMember.worktime || {}),
                                [day.key]: { ...dayConf, start: e.target.value }
                              };
                              const updated = members.map(m =>
                                m.id === configuredMember.id ? { ...m, worktime: newWorktime } : m
                              );
                              localStorage.setItem("erp-mini-local-demo-company-members", JSON.stringify(updated));
                              setConfiguredMember({ ...configuredMember, worktime: newWorktime });
                            }}
                            className="h-8 w-24 text-center text-xs"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            disabled={dayConf.isRest}
                            value={dayConf.end}
                            onChange={(e) => {
                              const newWorktime = {
                                ...(configuredMember.worktime || {}),
                                [day.key]: { ...dayConf, end: e.target.value }
                              };
                              const updated = members.map(m =>
                                m.id === configuredMember.id ? { ...m, worktime: newWorktime } : m
                              );
                              localStorage.setItem("erp-mini-local-demo-company-members", JSON.stringify(updated));
                              setConfiguredMember({ ...configuredMember, worktime: newWorktime });
                            }}
                            className="h-8 w-24 text-center text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button onClick={() => setConfiguredMember(null)} className="font-semibold bg-blue-600 hover:bg-blue-700 text-white">
              Đóng & Lưu cấu hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

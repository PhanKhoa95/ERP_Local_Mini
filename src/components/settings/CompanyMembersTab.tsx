import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, Shield, Users, UserPlus, FolderKanban, Users2, Award, Briefcase, Trash } from "lucide-react";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

  const [activeTab, setActiveTab] = useState("members");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ userId: "", role: "staff" });

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
      try { setDepartments(JSON.parse(rawDept)); } catch (e) {}
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
      try { setSalesGroups(JSON.parse(rawGroups)); } catch (e) {}
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
    await addMemberById.mutateAsync({ userId: formData.userId, role: formData.role });
    setDialogOpen(false);
    setFormData({ userId: "", role: "staff" });
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
      let mIds = d.member_ids.filter((id) => id !== memberId);
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
      let mIds = g.member_ids.filter((id) => id !== memberId);
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(m.id, m.user_id)}
                            className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
              <Label>User ID *</Label>
              <Input
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="UUID của người dùng"
              />
              <p className="text-xs text-muted-foreground">
                Người dùng cần đăng ký tài khoản trước. Lấy User ID từ hồ sơ cá nhân của họ.
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
              <Button type="submit" disabled={addMemberById.isPending || !formData.userId}>
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
    </div>
  );
}

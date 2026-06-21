import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Shield, Users, UserPlus } from "lucide-react";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
};

export function CompanyMembersTab() {
  const { members, isLoading, updateRole, removeMember, addMemberById } = useCompanyMembers();
  const { user } = useAuth();
  const { role } = useCompanyContext();
  const isAdmin = role === "admin";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ userId: "", role: "staff" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMemberById.mutateAsync({ userId: formData.userId, role: formData.role });
    setDialogOpen(false);
    setFormData({ userId: "", role: "staff" });
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateRole.mutate({ memberId, role: newRole });
  };

  const handleRemove = (memberId: string, memberUserId: string) => {
    if (memberUserId === user?.id) return;
    if (confirm("Bạn có chắc muốn xóa thành viên này khỏi công ty?")) {
      removeMember.mutate(memberId);
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
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Thành viên công ty</CardTitle>
            <CardDescription>Quản lý thành viên và phân quyền trong tổ chức</CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Thêm thành viên
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!isAdmin && (
            <div className="mb-4 p-4 rounded-lg bg-muted text-muted-foreground border">
              <Shield className="inline w-4 h-4 mr-2" />
              Chỉ quản trị viên mới có thể quản lý thành viên
            </div>
          )}

          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có thành viên</p>
              </div>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/30 gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(m.profile?.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {m.profile?.full_name || "Chưa đặt tên"}
                        {m.user_id === user?.id && (
                          <Badge variant="outline" className="ml-2 text-xs">Bạn</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.profile?.phone || "—"} · Tham gia {format(new Date(m.created_at), "dd/MM/yyyy", { locale: vi })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && m.user_id !== user?.id ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) => handleRoleChange(m.id, v)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Quản trị viên</SelectItem>
                          <SelectItem value="manager">Quản lý</SelectItem>
                          <SelectItem value="staff">Nhân viên</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={m.role === "admin" ? "destructive" : "default"}>
                        {roleLabels[m.role] || m.role}
                      </Badge>
                    )}
                    {isAdmin && m.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(m.id, m.user_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium mb-2">Mô tả vai trò:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li><strong>Quản trị viên:</strong> Toàn quyền quản lý hệ thống, thành viên, cấu hình</li>
              <li><strong>Quản lý:</strong> Quản lý đơn hàng, sản phẩm, nhân viên, báo cáo</li>
              <li><strong>Nhân viên:</strong> Tạo đơn hàng, xem thông tin cơ bản</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm thành viên</DialogTitle>
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
                Người dùng cần đăng ký tài khoản trước. Lấy User ID từ hồ sơ của họ.
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
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="manager">Quản lý</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
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
    </>
  );
}

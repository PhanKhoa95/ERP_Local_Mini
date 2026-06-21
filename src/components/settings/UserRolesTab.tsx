import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Shield, Users } from "lucide-react";
import { useUserRoles, type AppRole } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";

const roleLabels: Record<AppRole, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  viewer: "Xem",
};

const roleColors: Record<AppRole, string> = {
  admin: "bg-destructive text-destructive-foreground",
  manager: "bg-primary text-primary-foreground",
  staff: "bg-secondary text-secondary-foreground",
  viewer: "bg-muted text-muted-foreground",
};

export function UserRolesTab() {
  const { userRoles, isLoading, assignRole, removeRole, isAdmin } = useUserRoles();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ user_id: "", role: "staff" as AppRole });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await assignRole.mutateAsync(formData);
    setDialogOpen(false);
    setFormData({ user_id: "", role: "staff" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa quyền này?")) {
      await removeRole.mutateAsync(id);
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
            <CardTitle>Phân quyền người dùng</CardTitle>
            <CardDescription>Quản lý vai trò và quyền hạn</CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Thêm quyền
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!isAdmin && (
            <div className="mb-4 p-4 rounded-lg bg-warning/10 text-warning border border-warning/30">
              <Shield className="inline w-4 h-4 mr-2" />
              Bạn cần quyền Admin để quản lý phân quyền
            </div>
          )}

          <div className="space-y-3">
            {userRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có phân quyền nào</p>
              </div>
            ) : (
              userRoles.map((ur) => (
                <div
                  key={ur.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/30 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground font-mono text-sm">{ur.user_id}</p>
                      <Badge className={roleColors[ur.role]}>{roleLabels[ur.role]}</Badge>
                      {ur.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2">Bạn</Badge>
                      )}
                    </div>
                  </div>
                  {isAdmin && ur.user_id !== user?.id && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ur.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-info/10 border border-info/30">
            <h4 className="font-medium mb-2">Mô tả vai trò:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li><strong>Admin:</strong> Toàn quyền quản lý hệ thống</li>
              <li><strong>Manager:</strong> Quản lý đơn hàng, sản phẩm, khách hàng</li>
              <li><strong>Staff:</strong> Tạo đơn hàng, xem thông tin</li>
              <li><strong>Viewer:</strong> Chỉ xem, không chỉnh sửa</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm phân quyền</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>User ID *</Label>
              <Input
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                placeholder="UUID của user"
              />
              <p className="text-xs text-muted-foreground">Lấy User ID từ trang quản lý người dùng</p>
            </div>

            <div className="space-y-2">
              <Label>Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v as AppRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="manager">Quản lý</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="viewer">Xem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={assignRole.isPending}>
                {assignRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

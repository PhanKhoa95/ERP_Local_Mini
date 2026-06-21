import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { useCustomerGroups, type CustomerGroup } from "@/hooks/useCustomerGroups";

export function CustomerGroupsTab() {
  const { customerGroups, isLoading, createGroup, updateGroup, deleteGroup } = useCustomerGroups();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount_percent: 0,
    min_total_orders: 0,
    color: "#3B82F6",
    is_active: true,
  });

  const openDialog = (group?: CustomerGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || "",
        discount_percent: group.discount_percent,
        min_total_orders: group.min_total_orders,
        color: group.color,
        is_active: group.is_active,
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: "",
        description: "",
        discount_percent: 0,
        min_total_orders: 0,
        color: "#3B82F6",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      await updateGroup.mutateAsync({ id: editingGroup.id, ...formData });
    } else {
      await createGroup.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa nhóm khách hàng này?")) {
      await deleteGroup.mutateAsync(id);
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";

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
            <CardTitle>Nhóm khách hàng</CardTitle>
            <CardDescription>Phân loại khách hàng theo mức chi tiêu</CardDescription>
          </div>
          <Button onClick={() => openDialog()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Thêm nhóm
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customerGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có nhóm khách hàng nào</p>
              </div>
            ) : (
              customerGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/30 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: group.color }}
                    >
                      {group.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{group.name}</span>
                        <Badge variant={group.is_active ? "default" : "secondary"}>
                          {group.is_active ? "Hoạt động" : "Tắt"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {group.description || "Không có mô tả"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Giảm: {group.discount_percent}%
                        {group.min_total_orders > 0 && (
                          <span> | Từ: {formatCurrency(group.min_total_orders)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(group)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Sửa nhóm khách hàng" : "Thêm nhóm khách hàng"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên nhóm *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Khách VIP"
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>% Giảm giá</Label>
                <Input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tổng chi tiêu tối thiểu (đ)</Label>
                <Input
                  type="number"
                  value={formData.min_total_orders}
                  onChange={(e) => setFormData({ ...formData, min_total_orders: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 rounded cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Kích hoạt</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createGroup.isPending || updateGroup.isPending}>
                {(createGroup.isPending || updateGroup.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingGroup ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

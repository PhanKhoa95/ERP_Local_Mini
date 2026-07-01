import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ShieldCheck, Loader2, RotateCcw, Coins, Truck, CreditCard, Headphones, MoreHorizontal, Package, Save } from "lucide-react";
import {
  useSalesPolicies,
  SEGMENT_LABELS,
  SEGMENT_COLORS,
  TYPE_LABELS,
  type SalesPolicy,
  type PolicySegment,
  type PolicyType,
  type SalesPolicyInsert,
} from "@/hooks/useSalesPolicies";
import { useProductCategories, type ProductCategory } from "@/hooks/useProductCategories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const POLICY_TYPE_ICONS: Record<PolicyType, React.ReactNode> = {
  return: <RotateCcw className="h-4 w-4" />,
  loyalty_points: <Coins className="h-4 w-4" />,
  shipping: <Truck className="h-4 w-4" />,
  credit: <CreditCard className="h-4 w-4" />,
  support: <Headphones className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

const SEGMENTS: PolicySegment[] = ["loyalty", "wholesale", "all"];

export function SalesPoliciesTab() {
  const { policies, isLoading, createPolicy, updatePolicy, deletePolicy } = useSalesPolicies();
  const { categories, updateCategory } = useProductCategories();
  const [editingWarranty, setEditingWarranty] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SalesPolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<SalesPolicy | null>(null);

  const [formData, setFormData] = useState<SalesPolicyInsert>({
    segment: "all",
    type: "return",
    title: "",
    description: "",
    value: 0,
    unit: "ngày",
    is_active: true,
    sort_order: 0,
  });

  const handleOpenDialog = (policy?: SalesPolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        segment: policy.segment,
        type: policy.type,
        title: policy.title,
        description: policy.description,
        value: policy.value,
        unit: policy.unit,
        is_active: policy.is_active,
        sort_order: policy.sort_order,
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        segment: "all",
        type: "return",
        title: "",
        description: "",
        value: 0,
        unit: "ngày",
        is_active: true,
        sort_order: policies.length,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    if (editingPolicy) {
      await updatePolicy.mutateAsync({ id: editingPolicy.id, ...formData });
    } else {
      await createPolicy.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (policy: SalesPolicy) => {
    setDeletingPolicy(policy);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingPolicy) {
      await deletePolicy.mutateAsync(deletingPolicy.id);
      setDeleteDialogOpen(false);
      setDeletingPolicy(null);
    }
  };

  const handleToggleActive = async (policy: SalesPolicy) => {
    await updatePolicy.mutateAsync({ id: policy.id, is_active: !policy.is_active });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Chính sách bán hàng
          </CardTitle>
          <CardDescription>Quản lý chính sách đổi trả, tích điểm, giao hàng, công nợ theo phân khúc khách hàng</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm chính sách
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {SEGMENTS.map((segment) => {
          const segmentPolicies = policies
            .filter((p) => p.segment === segment)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <div key={segment}>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold", SEGMENT_COLORS[segment])}
                >
                  {SEGMENT_LABELS[segment]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({segmentPolicies.length} chính sách)
                </span>
              </div>

              {segmentPolicies.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                  Chưa có chính sách nào cho phân khúc này.
                </div>
              ) : (
                <div className="space-y-2">
                  {segmentPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        policy.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-0.5", SEGMENT_COLORS[segment])}>
                          {POLICY_TYPE_ICONS[policy.type]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{policy.title}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {TYPE_LABELS[policy.type]}
                            </Badge>
                            {policy.value > 0 && policy.unit && (
                              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                {policy.unit === "đ"
                                  ? `${policy.value.toLocaleString("vi-VN")}${policy.unit}`
                                  : `${policy.value} ${policy.unit}`}
                              </Badge>
                            )}
                            {!policy.is_active && (
                              <Badge variant="secondary" className="text-[10px]">Tắt</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{policy.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={policy.is_active}
                          onCheckedChange={() => handleToggleActive(policy)}
                          className="scale-75"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(policy)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(policy)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>

      {/* Warranty by Category Section */}
      <CardContent className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Bảo hành theo ngành hàng
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thời gian bảo hành mặc định cho sản phẩm thuộc từng danh mục
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
            Chưa có danh mục. Tạo tại Cài đặt → Danh mục.
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Danh mục</TableHead>
                  <TableHead className="text-xs text-center w-[140px]">Bảo hành (tháng)</TableHead>
                  <TableHead className="text-xs text-right w-[80px]">Lưu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories
                  .filter(c => !c.parent_id)
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map((cat) => {
                    const children = categories.filter(c => c.parent_id === cat.id);
                    return [
                      <WarrantyRow
                        key={cat.id}
                        category={cat}
                        editingWarranty={editingWarranty}
                        setEditingWarranty={setEditingWarranty}
                        updateCategory={updateCategory}
                      />,
                      ...children.map(child => (
                        <WarrantyRow
                          key={child.id}
                          category={child}
                          isChild
                          editingWarranty={editingWarranty}
                          setEditingWarranty={setEditingWarranty}
                          updateCategory={updateCategory}
                        />
                      ))
                    ];
                  })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Policy Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Sửa chính sách" : "Thêm chính sách mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pol-title">Tiêu đề *</Label>
              <Input
                id="pol-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Đổi trả 15 ngày, Tích điểm 3%..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phân khúc</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(v) => setFormData({ ...formData, segment: v as PolicySegment })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SEGMENT_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Loại</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as PolicyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as PolicyType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pol-desc">Mô tả chi tiết</Label>
              <Textarea
                id="pol-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chính sách áp dụng cho khách hàng..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pol-value">Giá trị</Label>
                <Input
                  id="pol-value"
                  type="number"
                  min={0}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  placeholder="VD: 15, 3, 200000..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pol-unit">Đơn vị</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) => setFormData({ ...formData, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ngày">ngày</SelectItem>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="đ">đ (VNĐ)</SelectItem>
                    <SelectItem value="giờ">giờ</SelectItem>
                    <SelectItem value="">Không</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="pol-active">Kích hoạt</Label>
                <p className="text-sm text-muted-foreground">Hiển thị cho khách hàng</p>
              </div>
              <Switch
                id="pol-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createPolicy.isPending || updatePolicy.isPending}
              >
                {(createPolicy.isPending || updatePolicy.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingPolicy ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa chính sách?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa chính sách "{deletingPolicy?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function WarrantyRow({
  category,
  isChild,
  editingWarranty,
  setEditingWarranty,
  updateCategory,
}: {
  category: ProductCategory;
  isChild?: boolean;
  editingWarranty: Record<string, number>;
  setEditingWarranty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  updateCategory: any;
}) {
  const currentVal = editingWarranty[category.id] ?? category.warranty_months ?? 3;
  const isEdited = editingWarranty[category.id] !== undefined && editingWarranty[category.id] !== (category.warranty_months ?? 3);

  const handleSave = async () => {
    if (editingWarranty[category.id] === undefined) return;
    await updateCategory.mutateAsync({
      id: category.id,
      name: category.name,
      warranty_months: editingWarranty[category.id],
    });
    setEditingWarranty((prev) => {
      const next = { ...prev };
      delete next[category.id];
      return next;
    });
  };

  return (
    <TableRow>
      <TableCell className="text-xs">
        <div className="flex items-center gap-2">
          {isChild && <span className="text-muted-foreground ml-4">↳</span>}
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: category.color || "#3B82F6" }}
          />
          <span className={cn(isChild && "text-muted-foreground")}>{category.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Input
          type="number"
          min={0}
          max={120}
          className="w-[80px] h-7 text-xs mx-auto text-center"
          value={currentVal}
          onChange={(e) =>
            setEditingWarranty((prev) => ({
              ...prev,
              [category.id]: parseInt(e.target.value) || 0,
            }))
          }
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant={isEdited ? "default" : "ghost"}
          size="sm"
          className="h-7 w-7 p-0"
          disabled={!isEdited || updateCategory.isPending}
          onClick={handleSave}
        >
          {updateCategory.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Factory, Plus, Loader2, Play, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useProducts } from "@/hooks/useProducts";
import { useProductBom } from "@/hooks/useProductBom";
import { ProductionOrderRow } from "./ProductionOrderRow";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Nháp", color: "bg-muted text-muted-foreground border-gray-200", icon: Factory },
  in_progress: { label: "Đang sản xuất", color: "bg-primary/5 text-primary border-primary/20", icon: Play },
  completed: { label: "Hoàn thành", color: "bg-success/5 text-success border-success/20", icon: CheckCircle },
  cancelled: { label: "Đã hủy", color: "bg-destructive/5 text-destructive border-destructive/20", icon: XCircle },
};

export function ProductionPlanPanel() {
  const { 
    productionOrders, 
    isLoading, 
    createProductionOrder, 
    updateStatus,
    updateProductionOrder 
  } = useProductionOrders();
  const { products } = useProducts();
  const { productsWithBom } = useProductBom();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", quantity: "1", notes: "" });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState({ product_id: "", quantity: "1", notes: "" });

  // Hook for BOM preview in production creation dialog
  const { checkMaterialAvailability: previewAvailability, bomItems: previewBom } = useProductBom(
    form.product_id || undefined
  );

  // Hook for BOM preview in production editing dialog
  const { checkMaterialAvailability: editPreviewAvailability, bomItems: editPreviewBom } = useProductBom(
    editForm.product_id || undefined
  );

  const bomProducts = products.filter(p => productsWithBom.includes(p.id));

  const handleCreate = async () => {
    const quantity = Number(form.quantity);
    if (!form.product_id || !Number.isFinite(quantity) || quantity <= 0) return;
    await createProductionOrder.mutateAsync({
      product_id: form.product_id,
      quantity,
      notes: form.notes || undefined,
    });
    setDialogOpen(false);
    setForm({ product_id: "", quantity: "1", notes: "" });
  };

  const handleOpenEditDialog = (po: any) => {
    setEditingOrder(po);
    setEditForm({
      product_id: po.product_id,
      quantity: String(po.quantity),
      notes: po.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    const quantity = Number(editForm.quantity);
    if (!editingOrder || !editForm.product_id || !Number.isFinite(quantity) || quantity <= 0) return;
    await updateProductionOrder.mutateAsync({
      id: editingOrder.id,
      product_id: editForm.product_id,
      quantity,
      notes: editForm.notes || undefined,
    });
    setEditDialogOpen(false);
    setEditingOrder(null);
  };

  const getNextStatus = (current: string) => {
    if (current === "draft") return "in_progress";
    if (current === "in_progress") return "completed";
    return null;
  };

  const qtyNum = Number(form.quantity) || 0;
  const previewList = form.product_id && qtyNum > 0 ? previewAvailability(qtyNum) : [];
  const hasPreviewBom = previewBom.length > 0;
  const isPreviewMissing = previewList.some(m => !m.isAvailable);

  const editQtyNum = Number(editForm.quantity) || 0;
  const editPreviewList = editForm.product_id && editQtyNum > 0 ? editPreviewAvailability(editQtyNum) : [];
  const hasEditPreviewBom = editPreviewBom.length > 0;
  const isEditPreviewMissing = editPreviewList.some(m => !m.isAvailable);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            Lệnh sản xuất (MRP)
          </h3>
          <p className="text-xs text-muted-foreground">Quản lý định mức nguyên vật liệu tiêu hao và lệnh sản xuất</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="h-9 text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Tạo lệnh sản xuất
        </Button>
      </div>

      {productionOrders.length === 0 ? (
        <Card className="border-dashed bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Factory className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Chưa có lệnh sản xuất nào được tạo</p>
            <p className="text-xs text-gray-400 mt-1">Các lệnh sản xuất giúp tự động tính toán tiêu hao nguyên vật liệu</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border rounded-lg overflow-hidden bg-card">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                  <th className="p-3 w-10"></th>
                  <th className="p-3 text-left w-24">Mã lệnh</th>
                  <th className="p-3 text-left">Thành phẩm</th>
                  <th className="p-3 text-right w-28">Số lượng</th>
                  <th className="p-3 text-center w-32">Trạng thái</th>
                  <th className="p-3 text-center w-36">Vật tư (BOM)</th>
                  <th className="p-3 text-left">Ghi chú</th>
                  <th className="p-3 text-center w-24">Ngày tạo</th>
                  <th className="p-3 text-right w-36">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {productionOrders.map((po: any) => {
                  const nextStatus = getNextStatus(po.status);
                  return (
                    <ProductionOrderRow
                      key={po.id}
                      po={po}
                      statusConfig={statusConfig}
                      nextStatus={nextStatus}
                      onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
                      onEdit={handleOpenEditDialog}
                      isPending={updateStatus.isPending || updateProductionOrder.isPending}
                    />
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Tạo lệnh sản xuất */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Tạo lệnh sản xuất</DialogTitle>
            <DialogDescription className="text-xs">
              Chọn sản phẩm cần sản xuất và nhập số lượng để hệ thống tính toán định mức vật tư tiêu hao.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Sản phẩm cần sản xuất</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {bomProducts.length > 0 ? (
                    bomProducts.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.sku})</SelectItem>
                    ))
                  ) : (
                    products.filter(p => !p.is_service).map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.sku})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {bomProducts.length === 0 && (
                <p className="text-[10px] text-warning flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Hệ thống chưa có sản phẩm nào được cấu hình định mức BOM.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Số lượng thành phẩm</Label>
              <Input
                type="number"
                min="0.0001"
                step="0.0001"
                className="h-9 text-xs"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>

            {/* Material Availability Preview inside Creation Dialog */}
            {form.product_id && qtyNum > 0 && (
              <div className="space-y-2 border rounded-lg p-3 bg-secondary/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Dự kiến nguyên vật liệu tiêu hao</span>
                  {hasPreviewBom && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] py-0 px-2 font-semibold shadow-none border",
                        isPreviewMissing
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-success/10 text-success border-success/20"
                      )}
                    >
                      {isPreviewMissing ? "Thiếu vật tư" : "Đủ vật tư"}
                    </Badge>
                  )}
                </div>

                {!hasPreviewBom ? (
                  <p className="text-[10px] text-muted-foreground italic">
                    Sản phẩm này chưa cấu hình định mức BOM. Lệnh sản xuất sẽ được tạo mà không trừ kho NVL.
                  </p>
                ) : (
                  <div className="border border-border/60 rounded-md overflow-hidden bg-card text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border/80 text-muted-foreground font-semibold">
                          <th className="p-2">Nguyên vật liệu</th>
                          <th className="p-2 text-right">Cần dùng</th>
                          <th className="p-2 text-right">Tồn hiện có</th>
                          <th className="p-2 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewList.map((m: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/30 hover:bg-secondary/5">
                            <td className="p-2 font-medium text-foreground truncate max-w-[120px]">
                              {m.material?.name}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-primary">
                              {m.consumption} {m.unit}
                            </td>
                            <td className="p-2 text-right font-mono text-muted-foreground">
                              {m.currentStock} {m.unit}
                            </td>
                            <td className="p-2 text-center align-middle">
                              {m.isAvailable ? (
                                <span className="text-success font-bold">Đủ</span>
                              ) : (
                                <span className="text-destructive font-bold">Thiếu {m.shortage}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Ghi chú lệnh</Label>
              <Textarea
                className="text-xs"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Ví dụ: Sản xuất cho đơn hàng xuất khẩu, lô sản xuất số 5..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-9 text-xs">
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={!form.product_id || createProductionOrder.isPending} className="h-9 text-xs">
              {createProductionOrder.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Tạo lệnh sản xuất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Sửa lệnh sản xuất */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Sửa lệnh sản xuất</DialogTitle>
            <DialogDescription className="text-xs">
              Điều chỉnh sản phẩm hoặc số lượng sản xuất. Hệ thống sẽ tự động tính lại định mức vật tư tiêu hao.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Sản phẩm cần sản xuất</Label>
              <Select value={editForm.product_id} onValueChange={(v) => setEditForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {bomProducts.length > 0 ? (
                    bomProducts.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.sku})</SelectItem>
                    ))
                  ) : (
                    products.filter(p => !p.is_service).map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.sku})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Số lượng thành phẩm</Label>
              <Input
                type="number"
                min="0.0001"
                step="0.0001"
                className="h-9 text-xs"
                value={editForm.quantity}
                onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>

            {/* Edit Material Availability Preview */}
            {editForm.product_id && editQtyNum > 0 && (
              <div className="space-y-2 border rounded-lg p-3 bg-secondary/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Dự kiến nguyên vật liệu tiêu hao mới</span>
                  {hasEditPreviewBom && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] py-0 px-2 font-semibold shadow-none border",
                        isEditPreviewMissing
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-success/10 text-success border-success/20"
                      )}
                    >
                      {isEditPreviewMissing ? "Thiếu vật tư" : "Đủ vật tư"}
                    </Badge>
                  )}
                </div>

                {!hasEditPreviewBom ? (
                  <p className="text-[10px] text-muted-foreground italic">
                    Sản phẩm này chưa cấu hình định mức BOM.
                  </p>
                ) : (
                  <div className="border border-border/60 rounded-md overflow-hidden bg-card text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border/80 text-muted-foreground font-semibold">
                          <th className="p-2">Nguyên vật liệu</th>
                          <th className="p-2 text-right">Cần dùng</th>
                          <th className="p-2 text-right">Tồn hiện có</th>
                          <th className="p-2 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editPreviewList.map((m: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/30 hover:bg-secondary/5">
                            <td className="p-2 font-medium text-foreground truncate max-w-[120px]">
                              {m.material?.name}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-primary">
                              {m.consumption} {m.unit}
                            </td>
                            <td className="p-2 text-right font-mono text-muted-foreground">
                              {m.currentStock} {m.unit}
                            </td>
                            <td className="p-2 text-center align-middle">
                              {m.isAvailable ? (
                                <span className="text-success font-bold">Đủ</span>
                              ) : (
                                <span className="text-destructive font-bold">Thiếu {m.shortage}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Ghi chú lệnh</Label>
              <Textarea
                className="text-xs"
                value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Ghi chú thêm..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)} className="h-9 text-xs">
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.product_id || updateProductionOrder.isPending} className="h-9 text-xs">
              {updateProductionOrder.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Factory, Plus, Loader2, Play, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import { useProducts } from "@/hooks/useProducts";
import { useProductBom } from "@/hooks/useProductBom";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Nháp", color: "bg-muted text-muted-foreground", icon: Factory },
  in_progress: { label: "Đang SX", color: "bg-primary/10 text-primary", icon: Play },
  completed: { label: "Hoàn thành", color: "bg-success/10 text-success", icon: CheckCircle },
  cancelled: { label: "Đã hủy", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

export function ProductionPlanPanel() {
  const { productionOrders, isLoading, createProductionOrder, updateStatus } = useProductionOrders();
  const { products } = useProducts();
  const { productsWithBom } = useProductBom();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", quantity: "1", notes: "" });

  const bomProducts = products.filter(p => productsWithBom.includes(p.id));

  const handleCreate = async () => {
    if (!form.product_id || !form.quantity) return;
    await createProductionOrder.mutateAsync({
      product_id: form.product_id,
      quantity: parseInt(form.quantity),
      notes: form.notes || undefined,
    });
    setDialogOpen(false);
    setForm({ product_id: "", quantity: "1", notes: "" });
  };

  const getNextStatus = (current: string) => {
    if (current === "draft") return "in_progress";
    if (current === "in_progress") return "completed";
    return null;
  };

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
        <h3 className="text-lg font-semibold text-foreground">Lệnh sản xuất</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo lệnh SX
        </Button>
      </div>

      {productionOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Factory className="h-8 w-8 text-muted-foreground opacity-40 mb-3" />
            <p className="text-sm text-muted-foreground">Chưa có lệnh sản xuất nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {productionOrders.map((po: any) => {
            const config = statusConfig[po.status] || statusConfig.draft;
            const nextStatus = getNextStatus(po.status);
            const StatusIcon = config.icon;
            return (
              <Card key={po.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">{po.production_number}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(po as any).products?.name || "N/A"} × {po.quantity}
                      </p>
                    </div>
                    <Badge className={cn(config.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>

                  {(po as any).orders?.order_number && (
                    <p className="text-xs text-muted-foreground">
                      Đơn hàng: {(po as any).orders.order_number}
                    </p>
                  )}

                  {po.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{po.notes}</p>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {nextStatus && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ id: po.id, status: nextStatus })}
                        disabled={updateStatus.isPending}
                      >
                        {nextStatus === "in_progress" ? "Bắt đầu SX" : "Hoàn thành"}
                      </Button>
                    )}
                    {po.status === "draft" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => updateStatus.mutate({ id: po.id, status: "cancelled" })}
                        disabled={updateStatus.isPending}
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lệnh sản xuất</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sản phẩm</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm có BOM" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {bomProducts.length > 0 ? (
                    bomProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                    ))
                  ) : (
                    products.filter(p => !p.is_service).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {bomProducts.length === 0 && (
                <p className="text-xs text-warning mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Chưa có sản phẩm nào có BOM. Vẫn có thể tạo lệnh SX.
                </p>
              )}
            </div>
            <div>
              <Label>Số lượng</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!form.product_id || createProductionOrder.isPending}>
              {createProductionOrder.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tạo lệnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

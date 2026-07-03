import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Layers, AlertCircle } from "lucide-react";
import { useProductVariants, ProductVariant } from "@/hooks/useProductVariants";
import { useProductVariantComponents, VariantComponent } from "@/hooks/useProductVariantComponents";

interface VariantComponentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentVariant: ProductVariant | null;
}

export function VariantComponentsDialog({ open, onOpenChange, parentVariant }: VariantComponentsDialogProps) {
  const { variants: allVariants = [], isLoading: isLoadingAll } = useProductVariants();
  const { components = [], isLoading: isLoadingComponents, saveComponents } = useProductVariantComponents(parentVariant?.id);

  const [items, setItems] = useState<{ child_variant_id: string; quantity: number }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [childQty, setChildQty] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (components.length > 0) {
      setItems(components.map(c => ({
        child_variant_id: c.child_variant_id,
        quantity: c.quantity
      })));
    } else {
      setItems([]);
    }
  }, [components]);

  if (!parentVariant) return null;

  // Filter out variants that can be added as child components:
  // 1. Cannot be the parent variant itself
  // 2. Cannot be already added
  // 3. (Optional) Prevent circular reference: we just prevent parent-child identity and keep it simple.
  const availableChildren = allVariants.filter(v => 
    v.id !== parentVariant.id && 
    !items.some(item => item.child_variant_id === v.id)
  );

  const handleAddItem = () => {
    if (!selectedChildId || childQty <= 0) return;
    setItems([...items, { child_variant_id: selectedChildId, quantity: childQty }]);
    setSelectedChildId("");
    setChildQty(1);
  };

  const handleRemoveItem = (childId: string) => {
    setItems(items.filter(item => item.child_variant_id !== childId));
  };

  const handleQtyChange = (childId: string, qty: number) => {
    if (qty <= 0) return;
    setItems(items.map(item => item.child_variant_id === childId ? { ...item, quantity: qty } : item));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = items.map(item => ({
        parent_variant_id: parentVariant.id,
        child_variant_id: item.child_variant_id,
        quantity: item.quantity
      }));
      await saveComponents.mutateAsync(dataToSave);
      onOpenChange(false);
    } catch {
      // toast is already handled inside the hook
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get variant info by id
  const getVariantInfo = (id: string) => {
    return allVariants.find(v => v.id === id);
  };

  // Calculate composite stock
  const calculateCompositeStock = () => {
    if (items.length === 0) return 0;
    let minStock = Infinity;
    for (const item of items) {
      const child = getVariantInfo(item.child_variant_id);
      if (!child) continue;
      const possibleStock = Math.floor(child.stock_quantity / item.quantity);
      if (possibleStock < minStock) {
        minStock = possibleStock;
      }
    }
    return minStock === Infinity ? 0 : minStock;
  };

  const compositeStock = calculateCompositeStock();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            Cấu hình Sản phẩm cấu thành (Set/Combo)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Header Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-muted-foreground">Mẫu mã cha (Set/Combo)</span>
                <h4 className="font-semibold text-blue-900 dark:text-blue-200">{parentVariant.name}</h4>
                <span className="text-xs text-muted-foreground">SKU: {parentVariant.sku}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Tồn kho khả dụng (tính động)</span>
                <div className="text-2xl font-bold text-blue-600">{compositeStock}</div>
              </div>
            </div>
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Tồn kho của mẫu mã cha sẽ tự động tính toán dựa trên số lượng tồn kho của các mẫu mã con thành phần.
            </div>
          </div>

          {/* Add components */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-sm">Thêm mẫu mã thành phần</h3>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-8">
                <Label className="text-xs">Mẫu mã con *</Label>
                <Select
                  value={selectedChildId}
                  onValueChange={setSelectedChildId}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Chọn mẫu mã con..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChildren.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="text-xs">
                        {v.name} ({v.sku}) - Tồn: {v.stock_quantity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Số lượng định mức *</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={childQty}
                  onChange={(e) => setChildQty(parseInt(e.target.value) || 1)}
                  className="text-xs"
                />
              </div>
              <div className="col-span-1">
                <Button
                  onClick={handleAddItem}
                  disabled={!selectedChildId || childQty <= 0}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Mẫu mã con</TableHead>
                  <TableHead className="text-xs">SKU</TableHead>
                  <TableHead className="text-right text-xs">Số lượng</TableHead>
                  <TableHead className="text-right text-xs">Tồn kho hiện tại</TableHead>
                  <TableHead className="text-right text-xs">Khả năng cung cấp</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingComponents ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      Chưa cấu hình thành phần cấu thành nào. Mẫu mã này sẽ hoạt động như sản phẩm độc lập.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const child = getVariantInfo(item.child_variant_id);
                    const isLowStock = child ? child.stock_quantity < item.quantity : true;
                    const possibleQty = child ? Math.floor(child.stock_quantity / item.quantity) : 0;

                    return (
                      <TableRow key={item.child_variant_id}>
                        <TableCell className="text-xs font-medium">
                          {child?.name || "Lỗi tải thông tin mẫu mã"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {child?.sku || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQtyChange(item.child_variant_id, parseInt(e.target.value) || 1)}
                            className="w-20 ml-auto text-right text-xs h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          <span className={isLowStock ? "text-destructive font-medium" : ""}>
                            {child?.stock_quantity ?? 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-blue-600">
                          {possibleQty} set
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.child_variant_id)}
                            className="text-destructive hover:text-destructive h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700">
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu cấu hình
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

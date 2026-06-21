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
import { Loader2, Plus, Trash2, Package, AlertTriangle } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useProductBom, ProductBomItem } from "@/hooks/useProductBom";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface BomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function BomDialog({ open, onOpenChange, product }: BomDialogProps) {
  const { products = [] } = useProducts();
  const { bomItems, isBomLoading, addBomItem, updateBomItem, deleteBomItem } = useProductBom(product?.id);
  
  const [newItem, setNewItem] = useState({
    material_id: "",
    quantity: 1,
    unit: "",
    notes: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  // Check if product is a service item
  const isServiceItem = product?.is_service === true;

  // Filter out products that are already in BOM, the product itself, and service items (service items cannot be materials)
  const availableMaterials = products.filter(p => 
    p.id !== product?.id && 
    !bomItems.some(bom => bom.material_id === p.id) &&
    p.is_service !== true
  );

  const handleAddItem = async () => {
    if (!product?.id || !newItem.material_id || newItem.quantity <= 0) return;
    
    setIsAdding(true);
    try {
      await addBomItem.mutateAsync({
        product_id: product.id,
        material_id: newItem.material_id,
        quantity: newItem.quantity,
        unit: newItem.unit || undefined,
        notes: newItem.notes || undefined,
      });
      setNewItem({ material_id: "", quantity: 1, unit: "", notes: "" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    await deleteBomItem.mutateAsync(id);
  };

  const handleQuantityChange = async (id: string, quantity: number) => {
    if (quantity <= 0) return;
    await updateBomItem.mutateAsync({ id, updates: { quantity } });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Calculate total material cost
  const totalMaterialCost = bomItems.reduce((sum, item) => {
    const materialCost = item.material?.cost_price || 0;
    return sum + (materialCost * item.quantity);
  }, 0);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Định mức nguyên vật liệu (BOM) - {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Service Item Warning */}
          {isServiceItem && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">
                    Sản phẩm dịch vụ không hỗ trợ BOM
                  </h4>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Sản phẩm dịch vụ không quản lý tồn kho và không có định mức nguyên vật liệu. 
                    Để sử dụng BOM, vui lòng tắt cờ "Sản phẩm dịch vụ" trong thông tin sản phẩm.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">SKU:</span>{" "}
                <span className="font-medium">{product.sku}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Giá bán:</span>{" "}
                <span className="font-medium">{formatCurrency(product.selling_price || 0)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Loại:</span>{" "}
                <span className="font-medium">
                  {isServiceItem ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">Dịch vụ</Badge>
                  ) : (
                    <Badge variant="outline">Hàng hóa</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Add New Material - Only show if not a service item */}
          {!isServiceItem && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Thêm nguyên vật liệu</h3>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <Label>Nguyên vật liệu *</Label>
                  <Select
                    value={newItem.material_id}
                    onValueChange={(value) => setNewItem({ ...newItem, material_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn NVL" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaterials.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Định mức *</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Đơn vị</Label>
                  <Input
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="VD: kg, m, cái"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Ghi chú</Label>
                  <Input
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button
                    onClick={handleAddItem}
                    disabled={!newItem.material_id || newItem.quantity <= 0 || isAdding}
                    className="w-full"
                  >
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* BOM List */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nguyên vật liệu</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Định mức</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Giá vốn</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isBomLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : bomItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chưa có định mức NVL nào
                    </TableCell>
                  </TableRow>
                ) : (
                  bomItems.map((item) => {
                    const material = item.material;
                    const materialCost = (material?.cost_price || 0) * item.quantity;
                    const isLowStock = (material?.stock_quantity || 0) < item.quantity;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {material?.name || "N/A"}
                            {isLowStock && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Thiếu
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {material?.sku}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={isLowStock ? "text-destructive font-medium" : ""}>
                            {material?.stock_quantity || 0}
                          </span>
                          {" "}{item.unit || material?.unit || "cái"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(material?.cost_price || 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(materialCost)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive hover:text-destructive"
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

          {/* Summary */}
          {bomItems.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground">Tổng số NVL:</span>{" "}
                  <span className="font-medium">{bomItems.length} loại</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tổng giá vốn NVL:</span>{" "}
                  <span className="font-bold text-lg">{formatCurrency(totalMaterialCost)}</span>
                </div>
              </div>
              {product.selling_price && totalMaterialCost > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Biên lợi nhuận ước tính:{" "}
                  <span className={product.selling_price > totalMaterialCost ? "text-green-600" : "text-destructive"}>
                    {formatCurrency(product.selling_price - totalMaterialCost)}
                    {" "}({((product.selling_price - totalMaterialCost) / product.selling_price * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

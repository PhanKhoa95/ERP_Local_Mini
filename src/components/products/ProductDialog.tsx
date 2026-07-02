import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wrench, Plus, Barcode, Scale, Package, Trash2 } from "lucide-react";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";
import { ImageUpload } from "./ImageUpload";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useProducts } from "@/hooks/useProducts";

const productSchema = z.object({
  sku: z.string().max(50).optional().default(""),
  name: z.string().min(1, "Tên sản phẩm không được để trống").max(200),
  category: z.string().max(100).optional(),
  unit: z.string().max(20).optional(),
  cost_price: z.number().min(0, "Giá nhập phải >= 0"),
  selling_price: z.number().min(0, "Giá bán phải >= 0"),
  stock_quantity: z.number().min(0, "Tồn kho phải >= 0"),
  min_stock: z.number().min(0, "Tồn kho tối thiểu phải >= 0"),
  description: z.string().max(1000).optional(),
  image_url: z.string().optional(),
  is_service: z.boolean().optional(),
});

type Product = Tables<"products">;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function ProductDialog({ open, onOpenChange, product, onSubmit, isLoading }: ProductDialogProps) {
  const { activeCategories, createCategory } = useProductCategories();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // Conversions temporary state for new products
  const [conversions, setConversions] = useState<{ from_unit: string; factor: number }[]>([]);
  const [tempFromUnit, setTempFromUnit] = useState("");
  const [tempFactor, setTempFactor] = useState<number>(10);

  // Combo states
  const { products = [] } = useProducts();
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState<{ product_id: string; quantity: number }[]>([]);

  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    name: "",
    category: "",
    unit: "cái",
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock: 0,
    description: "",
    image_url: "",
    is_service: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        barcode: (product as any).barcode || "",
        name: product.name,
        category: product.category || "",
        unit: product.unit || "cái",
        cost_price: Number(product.cost_price) || 0,
        selling_price: Number(product.selling_price) || 0,
        stock_quantity: product.stock_quantity || 0,
        min_stock: product.min_stock || 0,
        description: product.description || "",
        image_url: product.image_url || "",
        is_service: product.is_service || false,
      });
    } else {
      setFormData({
        sku: "",
        barcode: "",
        name: "",
        category: "",
        unit: "cái",
        cost_price: 0,
        selling_price: 0,
        stock_quantity: 0,
        min_stock: 0,
        description: "",
        image_url: "",
        is_service: false,
      });
    }
    setConversions([]);
    setTempFromUnit("");
    setTempFactor(10);
    setTempFactor(10);
    setErrors({});

    if (product) {
      const rawCombos = localStorage.getItem("erp-mini-local-demo-combos");
      const combos = rawCombos ? JSON.parse(rawCombos) : [];
      const matched = combos.find((c: any) => c.id === product.id);
      if (matched) {
        setIsCombo(true);
        setComboItems(matched.items || []);
      } else {
        setIsCombo(false);
        setComboItems([]);
      }
    } else {
      setIsCombo(false);
      setComboItems([]);
    }
  }, [product, open]);

  /** Generate SKU: SKU-{timestamp}-{random} */
  const generateSku = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `SKU-${ts}-${rand}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToValidate = {
        ...formData,
        sku: formData.sku.trim() || generateSku(),
      };
      const validated = productSchema.parse(dataToValidate);
      const payload = { ...validated, barcode: formData.barcode.trim() || undefined };
      
      // If creating new, include the temporary conversions list in submission
      onSubmit({ 
        ...(product ? { id: product.id } : {}), 
        ...payload, 
        conversions, 
        is_combo: isCombo, 
        combo_items: comboItems 
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) fieldErrors[error.path[0] as string] = error.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory.mutateAsync({ name: newCategoryName.trim() });
    setFormData({ ...formData, category: newCategoryName.trim() });
    setNewCategoryName("");
    setShowNewCategory(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pr-1">
          {/* Image Upload */}
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                disabled={!!product}
                placeholder={product ? "" : "Để trống để tự tạo"}
              />
              {!product && !formData.sku && (
                <p className="text-xs text-muted-foreground">Tự tạo mã nếu để trống</p>
              )}
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode" className="flex items-center gap-1.5">
                <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                Mã vạch sản phẩm
              </Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="VD: 8934567890123"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Tên danh mục mới"
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddCategory} disabled={createCategory.isPending}>
                    Thêm
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowNewCategory(false)}>
                    Hủy
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: cat.color || '#3B82F6' }} 
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="outline" onClick={() => setShowNewCategory(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Tên sản phẩm *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Service Item Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="is_service" className="text-base font-medium">
                  Sản phẩm dịch vụ
                </Label>
                <p className="text-sm text-muted-foreground">
                  Không quản lý tồn kho, không BOM, không backflush
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formData.is_service && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Dịch vụ
                </Badge>
              )}
              <Switch
                id="is_service"
                checked={formData.is_service}
                onCheckedChange={(checked) => setFormData({ ...formData, is_service: checked })}
              />
            </div>
          </div>

          {/* Combo Item Toggle */}
          {!formData.is_service && (
            <div className="flex flex-col p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="is_combo" className="text-base font-medium">
                      Sản phẩm Combo / Gói
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Gồm nhiều sản phẩm thành phần bán chung, tự động trừ kho thành phần khi bán.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCombo && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      Combo
                    </Badge>
                  )}
                  <Switch
                    id="is_combo"
                    checked={isCombo}
                    onCheckedChange={(checked) => {
                      setIsCombo(checked);
                      if (checked) {
                        setFormData({ ...formData, is_service: false });
                      }
                    }}
                  />
                </div>
              </div>

              {/* Combo components list */}
              {isCombo && (
                <div className="pt-2 border-t space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] font-semibold text-muted-foreground">Chọn sản phẩm thành phần</Label>
                      <Select
                        onValueChange={(val) => {
                          const existing = comboItems.find(item => item.product_id === val);
                          if (existing) return;
                          setComboItems([...comboItems, { product_id: val, quantity: 1 }]);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-card">
                          <SelectValue placeholder="Chọn sản phẩm..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-foreground z-[130] max-h-[180px] overflow-y-auto">
                          {products
                            .filter(p => p.id !== product?.id && !p.is_service && !comboItems.some(ci => ci.product_id === p.id))
                            .map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku || p.id})</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {comboItems.length > 0 && (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {comboItems.map((ci, idx) => {
                        const prod = products.find(p => p.id === ci.product_id);
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-white dark:bg-card border text-xs">
                            <div className="font-medium truncate flex-1 mr-2">
                              {prod?.name || ci.product_id}
                              <span className="text-[10px] text-muted-foreground block font-mono">SKU: {prod?.sku || ci.product_id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={ci.quantity}
                                onChange={(e) => {
                                  const qty = Math.max(1, Number(e.target.value));
                                  setComboItems(comboItems.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
                                }}
                                className="w-14 h-7 text-center text-xs"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setComboItems(comboItems.filter((_, i) => i !== idx))}
                                className="h-7 w-7 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Giá nhập</Label>
              <Input
                id="cost_price"
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
              />
              {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="selling_price">Giá bán</Label>
              <Input
                id="selling_price"
                type="number"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
              />
              {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price}</p>}
              {formData.selling_price > 0 && formData.cost_price > 0 && formData.selling_price < formData.cost_price && (
                <p className="text-xs text-amber-500 font-medium">Cảnh báo: Giá bán thấp hơn giá vốn (giá nhập)</p>
              )}
            </div>
          </div>

          {/* Only show stock fields for non-service items */}
          {!formData.is_service && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Tồn kho</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                />
                {errors.stock_quantity && <p className="text-xs text-destructive">{errors.stock_quantity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Tồn kho tối thiểu</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                />
                {errors.min_stock && <p className="text-xs text-destructive">{errors.min_stock}</p>}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Unit conversions configuration section (Only for new non-service items) */}
          {!product && !formData.is_service && (
            <div className="space-y-3 p-3.5 border rounded-lg bg-secondary/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Scale className="h-4 w-4" />
                Quy cách quy đổi & Chia lẻ
              </div>
              <p className="text-[10px] text-muted-foreground">
                Thiết lập các đơn vị quy đổi lớn hơn đơn vị cơ bản (VD: 1 Thùng = 24 {formData.unit || "cái"}) để tự động chia khi xé lẻ hoặc nhập/xuất kho.
              </p>

              {/* List of temporary conversions */}
              {conversions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {conversions.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-mono py-1 px-2 flex items-center gap-1">
                      1 {c.from_unit} = {c.factor} {formData.unit || "cái"}
                      <button
                        type="button"
                        onClick={() => setConversions(conversions.filter((_, idx) => idx !== i))}
                        className="hover:text-destructive text-muted-foreground font-bold ml-1.5"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add new conversion inputs */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Đơn vị quy đổi</Label>
                  <Input
                    placeholder="Thùng, Hộp..."
                    value={tempFromUnit}
                    onChange={(e) => setTempFromUnit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Tỉ lệ quy đổi</Label>
                  <Input
                    type="number"
                    min="2"
                    step="1"
                    value={tempFactor}
                    onChange={(e) => setTempFactor(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!tempFromUnit.trim()) return;
                    if (tempFactor <= 1) return;
                    if (conversions.some(c => c.from_unit.toLowerCase() === tempFromUnit.trim().toLowerCase())) {
                      alert("Đơn vị này đã được cấu hình.");
                      return;
                    }
                    setConversions([...conversions, { from_unit: tempFromUnit.trim(), factor: tempFactor }]);
                    setTempFromUnit("");
                    setTempFactor(10);
                  }}
                  className="h-8 text-xs"
                >
                  Thêm
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

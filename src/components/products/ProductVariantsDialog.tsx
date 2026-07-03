import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useProductVariants, type ProductVariant } from "@/hooks/useProductVariants";
import { Plus, Trash2, Edit2, Check, X, Loader2, Layers, Settings, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProductWholesalePrices } from "@/hooks/useWholesaleSettings";
import { calculateCompositeVariantStock } from "@/lib/wholesaleControl";
import { VariantComponentsDialog } from "./VariantComponentsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

interface ProductVariantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

interface AttributePair {
  key: string;
  value: string;
}

export function ProductVariantsDialog({ open, onOpenChange, product }: ProductVariantsDialogProps) {
  const { variants, isLoading, createVariant, updateVariant, deleteVariant } = useProductVariants(product?.id);

  // Form states
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [attributes, setAttributes] = useState<AttributePair[]>([{ key: "Màu sắc", value: "" }]);

  // Composite product dialog state
  const [componentsDialogOpen, setComponentsDialogOpen] = useState(false);
  const [selectedVariantForComponents, setSelectedVariantForComponents] = useState<ProductVariant | null>(null);

  // Wholesale prices hook
  const { wholesalePrices = [], saveWholesalePrices } = useProductWholesalePrices(product?.id);
  const [wholesaleTiers, setWholesaleTiers] = useState<{ min_quantity: number; wholesale_price: number }[]>([]);

  // Fetch whether variants have components to show Set/Combo badge
  const { data: compositeVariantIds = [], refetch: refetchComposites } = useQuery({
    queryKey: ["composite-variant-ids", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-product-variant-components");
        const all = raw ? JSON.parse(raw) : [];
        const parentIds = all.map((c: any) => c.parent_variant_id);
        return Array.from(new Set(parentIds)) as string[];
      }
      const { data, error } = await supabase
        .from("product_variant_components")
        .select("parent_variant_id");
      if (error) throw error;
      return Array.from(new Set(data.map(d => d.parent_variant_id))) as string[];
    },
    enabled: !!product?.id
  });

  // Load all variants & components to calculate composite stock dynamically
  const { variants: allVariants = [] } = useProductVariants();

  const { data: allComponents = [] } = useQuery({
    queryKey: ["all-product-variant-components-dialog"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-product-variant-components");
        return raw ? JSON.parse(raw) : [];
      }
      const { data, error } = await supabase.from("product_variant_components").select("*");
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, product]);

  const resetForm = () => {
    setEditingVariant(null);
    setIsAddingNew(false);
    setSku("");
    setName("");
    setCostPrice(product?.cost_price || 0);
    setSellingPrice(product?.selling_price || 0);
    setStockQuantity(0);
    setIsActive(true);
    setAttributes([{ key: "Màu sắc", value: "" }]);
    setWholesaleTiers([]);
  };

  const handleAddAttributePair = () => {
    setAttributes([...attributes, { key: "", value: "" }]);
  };

  const handleRemoveAttributePair = (index: number) => {
    const next = [...attributes];
    next.splice(index, 1);
    setAttributes(next);
  };

  const handleAttributeChange = (index: number, field: "key" | "value", val: string) => {
    const next = [...attributes];
    next[index][field] = val;
    setAttributes(next);

    // Auto-generate name based on attributes if name is empty or matches original product structure
    if (field === "value" && (!name || name.startsWith(product?.name))) {
      const vals = next.map(p => p.value).filter(Boolean).join(" / ");
      setName(vals ? `${product?.name} - ${vals}` : product?.name || "");
    }

    // Auto-generate SKU based on attributes if SKU is empty or matches original product SKU
    if (field === "value" && (!sku || sku.startsWith(product?.sku))) {
      const suffix = next.map(p => p.value.toUpperCase().replace(/[^A-Z0-9]/g, "")).filter(Boolean).join("-");
      setSku(suffix ? `${product?.sku}-${suffix}` : product?.sku || "");
    }
  };

  const handleEditClick = (v: ProductVariant) => {
    setEditingVariant(v);
    setIsAddingNew(false);
    setSku(v.sku);
    setName(v.name);
    setCostPrice(v.cost_price);
    setSellingPrice(v.selling_price);
    setStockQuantity(v.stock_quantity);
    setIsActive(v.is_active);

    const pairs = Object.entries(v.attributes || {}).map(([key, value]) => ({ key, value }));
    setAttributes(pairs.length > 0 ? pairs : [{ key: "Màu sắc", value: "" }]);

    // Load wholesale prices for this variant
    const tiers = wholesalePrices
      .filter(p => p.variant_id === v.id)
      .map(p => ({ min_quantity: p.min_quantity, wholesale_price: p.wholesale_price }));
    setWholesaleTiers(tiers);
  };

  const handleAddWholesaleTier = () => {
    setWholesaleTiers([...wholesaleTiers, { min_quantity: 5, wholesale_price: sellingPrice * 0.9 }]);
  };

  const handleRemoveWholesaleTier = (index: number) => {
    const next = [...wholesaleTiers];
    next.splice(index, 1);
    setWholesaleTiers(next);
  };

  const handleWholesaleTierChange = (index: number, field: "min_quantity" | "wholesale_price", val: number) => {
    const next = [...wholesaleTiers];
    next[index][field] = val;
    setWholesaleTiers(next);
  };

  const handleConfigureComponents = (v: ProductVariant) => {
    setSelectedVariantForComponents(v);
    setComponentsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !sku || !name) return;

    // Convert attributes to Record
    const attrObj: Record<string, string> = {};
    attributes.forEach(p => {
      if (p.key.trim() && p.value.trim()) {
        attrObj[p.key.trim()] = p.value.trim();
      }
    });

    const payload = {
      product_id: product.id,
      sku: sku.trim(),
      name: name.trim(),
      cost_price: Number(costPrice) || 0,
      selling_price: Number(sellingPrice) || 0,
      stock_quantity: Number(stockQuantity) || 0,
      is_active: isActive,
      attributes: attrObj
    };

    try {
      let savedVar: any;
      if (editingVariant) {
        savedVar = await updateVariant.mutateAsync({ id: editingVariant.id, ...payload });
      } else {
        savedVar = await createVariant.mutateAsync(payload);
      }

      // Save wholesale prices for this variant
      if (savedVar && savedVar.id) {
        await saveWholesalePrices.mutateAsync({
          variantId: savedVar.id,
          tiers: wholesaleTiers
        });
      }

      resetForm();
    } catch (err) {
      // toast is shown by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa biến thể này không?")) {
      await deleteVariant.mutateAsync(id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Biến thể của: {product?.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Quản lý các phân loại, thuộc tính khác nhau của sản phẩm (Kích thước, Màu sắc, Chất liệu...)
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
          {/* LEFT: LIST OF VARIANTS (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground">Danh sách biến thể ({variants.length})</h3>
              {!isAddingNew && !editingVariant && (
                <Button size="sm" onClick={() => setIsAddingNew(true)} className="h-8 text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" /> Thêm biến thể
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : variants.length === 0 ? (
              <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Sản phẩm chưa có biến thể nào</p>
                <p className="text-[10px] opacity-60">Hãy tạo biến thể đầu tiên để quản lý phân khúc hàng</p>
              </div>
            ) : (
              <div className="space-y-2">
                {variants.map((v) => {
                  const isComposite = compositeVariantIds.includes(v.id);
                  return (
                    <Card key={v.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{v.name}</span>
                            {isComposite && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 font-bold uppercase">
                                Set/Combo
                              </Badge>
                            )}
                            {!v.is_active && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-slate-100 text-slate-500">
                                Ngừng bán
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span>SKU: {v.sku}</span>
                            <span>•</span>
                            <span>
                              Tồn:{" "}
                              <span className="font-semibold text-foreground">
                                {isComposite 
                                  ? `${calculateCompositeVariantStock(v, allComponents, allVariants)} (Combo)`
                                  : v.stock_quantity
                                }
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {Object.entries(v.attributes || {}).map(([key, val]) => (
                              <Badge key={key} variant="outline" className="text-[9px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200">
                                {key}: {val}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{(v.selling_price || 0).toLocaleString("vi-VN")}đ</p>
                          <p className="text-[10px] text-muted-foreground">Vốn: {(v.cost_price || 0).toLocaleString("vi-VN")}đ</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleConfigureComponents(v)}
                            title="Cấu hình Sản phẩm cấu thành (Set/Combo)"
                            type="button"
                          >
                            <Layers className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditClick(v)} type="button">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(v.id)} type="button">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: EDITOR FORM (5 cols) */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-6">
            {isAddingNew || editingVariant ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="text-sm font-semibold flex items-center gap-1 text-primary">
                    <Settings className="h-4 w-4" />
                    {editingVariant ? "Sửa biến thể" : "Thêm biến thể mới"}
                  </h3>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="var-sku" className="text-xs">SKU Biến thể *</Label>
                    <Input id="var-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="VD: SKU-COLOR-SIZE" required className="h-9 text-xs" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="var-name" className="text-xs">Tên biến thể *</Label>
                    <Input id="var-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên kèm phân loại" required className="h-9 text-xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="var-cost" className="text-xs">Giá nhập *</Label>
                      <Input id="var-cost" type="number" value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} required className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="var-price" className="text-xs">Giá bán *</Label>
                      <Input id="var-price" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} required className="h-9 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="space-y-1">
                      <Label htmlFor="var-stock" className="text-xs">Số lượng tồn kho</Label>
                      <Input id="var-stock" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} className="h-9 text-xs" />
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <input type="checkbox" id="var-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                      <Label htmlFor="var-active" className="text-xs cursor-pointer">Đang bán</Label>
                    </div>
                  </div>

                  {/* Attributes setup */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold">Thuộc tính biến thể</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddAttributePair} className="h-6 text-[10px] px-2">
                        + Thêm cặp thuộc tính
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {attributes.map((pair, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input placeholder="Tên: VD màu sắc" value={pair.key} onChange={(e) => handleAttributeChange(index, "key", e.target.value)} required className="h-8 text-xs flex-1" />
                          <Input placeholder="Giá trị: " value={pair.value} onChange={(e) => handleAttributeChange(index, "value", e.target.value)} required className="h-8 text-xs flex-1" />
                          {attributes.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleRemoveAttributePair(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wholesale Price Tiers */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        Giá bán sỉ bậc thang
                        <HelpCircle className="h-3 w-3 text-muted-foreground" title="Bật giá bán sỉ cho riêng biến thể này" />
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddWholesaleTier} className="h-6 text-[10px] px-2">
                        + Thêm bậc giá
                      </Button>
                    </div>

                    {wholesaleTiers.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic">Chưa cấu hình giá sỉ riêng cho biến thể này (Sẽ áp dụng giá sỉ của sản phẩm chính nếu có).</p>
                    ) : (
                      <div className="space-y-2">
                        {wholesaleTiers.map((tier, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-[10px] text-muted-foreground">Mua từ:</span>
                              <Input 
                                type="number" 
                                value={tier.min_quantity} 
                                onChange={(e) => handleWholesaleTierChange(index, "min_quantity", Number(e.target.value))} 
                                required 
                                className="h-8 text-xs flex-1" 
                              />
                            </div>
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-[10px] text-muted-foreground">Đơn giá:</span>
                              <Input 
                                type="number" 
                                value={tier.wholesale_price} 
                                onChange={(e) => handleWholesaleTierChange(index, "wholesale_price", Number(e.target.value))} 
                                required 
                                className="h-8 text-xs flex-1" 
                              />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleRemoveWholesaleTier(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-9 text-xs">
                    Hủy
                  </Button>
                  <Button type="submit" className="flex-1 h-9 text-xs gap-1" disabled={createVariant.isPending || updateVariant.isPending}>
                    {(createVariant.isPending || updateVariant.isPending) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Xác nhận
                  </Button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col justify-center items-center p-8 text-center text-muted-foreground opacity-60 space-y-2">
                <Layers className="h-12 w-12 text-primary/40 animate-pulse" />
                <p className="text-xs font-semibold">Chọn sửa biến thể hoặc nhấn nút Thêm mới ở cột bên trái để bắt đầu thiết lập thuộc tính sản phẩm.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {selectedVariantForComponents && (
      <VariantComponentsDialog
        open={componentsDialogOpen}
        onOpenChange={setComponentsDialogOpen}
        variant={selectedVariantForComponents}
        onSaved={refetchComposites}
      />
    )}
  </>
  );
}

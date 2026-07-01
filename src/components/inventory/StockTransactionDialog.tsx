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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useProductVariants } from "@/hooks/useProductVariants";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { invalidateWarehouseRelated } from "@/lib/queryInvalidation";
import { z } from "zod";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction } from "@/lib/localInventoryStore";

const transactionSchema = z.object({
  product_id: z.string().min(1, "Vui lòng chọn sản phẩm"),
  variant_id: z.string().optional(),
  transaction_type: z.enum(["in", "out"]),
  quantity: z.number().min(0.0001, "Số lượng phải lớn hơn 0"),
  notes: z.string().max(500).optional(),
});

interface StockTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "in" | "out";
}

export function StockTransactionDialog({
  open,
  onOpenChange,
  defaultType = "in",
}: StockTransactionDialogProps) {
  const { products } = useProducts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    product_id: "",
    variant_id: "",
    transaction_type: defaultType as "in" | "out",
    quantity: 1,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        product_id: "",
        variant_id: "",
        transaction_type: defaultType,
        quantity: 1,
        notes: "",
      });
      setErrors({});
    }
  }, [open, defaultType]);

  const selectedProduct = products.find((p) => p.id === formData.product_id);
  const { variants } = useProductVariants(formData.product_id);
  const hasVariants = selectedProduct?.has_variants || (variants && variants.length > 0);
  const selectedVariant = variants.find((v) => v.id === formData.variant_id);

  // Auto-reset variant when product changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, variant_id: "" }));
  }, [formData.product_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      transactionSchema.parse(formData);

      if (hasVariants && !formData.variant_id) {
        setErrors({ variant_id: "Sản phẩm này có biến thể, vui lòng chọn phân loại cụ thể" });
        return;
      }

      setErrors({});
      setIsLoading(true);

      // Check stock for outbound transaction
      if (formData.transaction_type === "out") {
        if (hasVariants && selectedVariant) {
          if (selectedVariant.stock_quantity < formData.quantity) {
            toast({
              variant: "destructive",
              title: "Lỗi",
              description: `Phân loại "${selectedVariant.name}" không đủ tồn kho. Chỉ còn ${selectedVariant.stock_quantity} sản phẩm.`,
            });
            setIsLoading(false);
            return;
          }
        } else if (selectedProduct) {
          if ((selectedProduct.stock_quantity || 0) < formData.quantity) {
            toast({
              variant: "destructive",
              title: "Lỗi",
              description: `Không đủ tồn kho. Chỉ còn ${selectedProduct.stock_quantity} sản phẩm.`,
            });
            setIsLoading(false);
            return;
          }
        }
      }

      const delta = formData.transaction_type === "in" ? formData.quantity : -formData.quantity;
      const variantLogText = selectedVariant ? ` [Biến thể: ${selectedVariant.name}]` : "";
      const finalNotes = (formData.notes || "").trim() + variantLogText;

      if (isLocalDemoAuthEnabled()) {
        if (hasVariants && formData.variant_id) {
          // 1. Update variant stock
          const LOCAL_VARIANTS_KEY = "erp-mini-local-demo-product-variants";
          const allVariants = JSON.parse(localStorage.getItem(LOCAL_VARIANTS_KEY) || "[]");
          const vIdx = allVariants.findIndex((v: any) => v.id === formData.variant_id);
          if (vIdx !== -1) {
            allVariants[vIdx].stock_quantity = Math.max(0, allVariants[vIdx].stock_quantity + delta);
            localStorage.setItem(LOCAL_VARIANTS_KEY, JSON.stringify(allVariants));
          }

          // 2. Sum up all variants and update parent product
          const updatedVars = allVariants.filter((v: any) => v.product_id === formData.product_id);
          const totalStock = updatedVars.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0);

          const LOCAL_PRODUCTS_KEY = "erp-mini-local-demo-products";
          const allProducts = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");
          const pIdx = allProducts.findIndex((p: any) => p.id === formData.product_id);
          if (pIdx !== -1) {
            allProducts[pIdx].stock_quantity = totalStock;
            localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(allProducts));
          }
        }

        // 3. Create local inventory transaction
        createLocalInventoryTransaction({
          product_id: formData.product_id,
          transaction_type: formData.transaction_type,
          quantity: formData.quantity,
          notes: finalNotes || null,
        });

        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["product-variants"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
        invalidateWarehouseRelated(queryClient);

        toast({
          title: formData.transaction_type === "in" ? "Nhập kho local thành công" : "Xuất kho local thành công",
        });
        onOpenChange(false);
        return;
      }

      // Online logic (Supabase)
      if (hasVariants && formData.variant_id) {
        // 1. Update variant stock
        const { error: vError } = await supabase
          .from("product_variants")
          .update({ stock_quantity: Math.max(0, (selectedVariant?.stock_quantity || 0) + delta) })
          .eq("id", formData.variant_id);
        if (vError) throw vError;

        // 2. Get sum of all variants
        const { data: siblingVars } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("product_id", formData.product_id);
        
        const totalStock = (siblingVars || []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

        // 3. Update parent product stock
        const { error: pError } = await supabase
          .from("products")
          .update({ stock_quantity: totalStock })
          .eq("id", formData.product_id);
        if (pError) throw pError;
      } else {
        // Update product stock atomically via RPC
        const { error: rpcError } = await supabase.rpc("increment_stock_quantity", {
          p_product_id: formData.product_id,
          p_quantity: delta,
        });
        if (rpcError) throw rpcError;
      }

      // Create transaction
      const { error: txError } = await supabase
        .from("inventory_transactions")
        .insert({
          product_id: formData.product_id,
          transaction_type: formData.transaction_type,
          quantity: formData.transaction_type === "in" ? formData.quantity : -formData.quantity,
          notes: finalNotes || null,
        });
      if (txError) throw txError;

      // Update warehouse stock
      if (selectedProduct?.company_id) {
        const { data: defaultWh } = await supabase
          .from("warehouses")
          .select("id")
          .eq("company_id", selectedProduct.company_id)
          .eq("is_default", true)
          .maybeSingle();

        if (defaultWh) {
          const { data: existingWs } = await supabase
            .from("warehouse_stock")
            .select("id, quantity")
            .eq("warehouse_id", defaultWh.id)
            .eq("product_id", formData.product_id)
            .maybeSingle();

          if (existingWs) {
            // Recalculate stock based on parent product's new stock
            const { data: updatedProd } = await supabase
              .from("products")
              .select("stock_quantity")
              .eq("id", formData.product_id)
              .single();

            await supabase
              .from("warehouse_stock")
              .update({ quantity: updatedProd?.stock_quantity || 0 })
              .eq("id", existingWs.id);
          } else if (formData.transaction_type === "in") {
            await supabase
              .from("warehouse_stock")
              .insert({
                warehouse_id: defaultWh.id,
                product_id: formData.product_id,
                quantity: formData.quantity,
              });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      invalidateWarehouseRelated(queryClient);

      toast({
        title: formData.transaction_type === "in" ? "Nhập kho thành công" : "Xuất kho thành công",
      });

      onOpenChange(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) fieldErrors[error.path[0] as string] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: (err as Error).message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold">
            {formData.transaction_type === "in" ? (
              <>
                <ArrowDownLeft className="h-5 w-5 text-success" />
                Nhập kho
              </>
            ) : (
              <>
                <ArrowUpRight className="h-5 w-5 text-destructive" />
                Xuất kho
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Loại giao dịch</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value: "in" | "out") =>
                setFormData({ ...formData, transaction_type: value })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in" className="text-xs">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                    Nhập kho
                  </div>
                </SelectItem>
                <SelectItem value="out" className="text-xs">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                    Xuất kho
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Sản phẩm *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) =>
                setFormData({ ...formData, product_id: value })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id} className="text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span>
                        {product.sku} - {product.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        (Tồn: {product.stock_quantity || 0})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product_id && (
              <p className="text-[11px] text-destructive">{errors.product_id}</p>
            )}
          </div>

          {/* Conditional Variant Selection */}
          {hasVariants && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label className="text-xs font-semibold text-primary">Phân loại biến thể sản phẩm *</Label>
              <Select
                value={formData.variant_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, variant_id: value })
                }
              >
                <SelectTrigger className="h-9 text-xs border-primary/40 focus:ring-primary">
                  <SelectValue placeholder="Chọn biến thể (VD: Màu, Size)" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <span>{v.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          (Tồn: {v.stock_quantity || 0})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.variant_id && (
                <p className="text-[11px] text-destructive font-medium">{errors.variant_id}</p>
              )}
            </div>
          )}

          {selectedProduct && (
            <div className="p-3 rounded-lg bg-secondary/50 space-y-1.5 border border-border">
              {hasVariants && selectedVariant ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Tồn biến thể hiện tại:</span>
                    <span className="font-semibold text-foreground">
                      {selectedVariant.stock_quantity} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Sau giao dịch (Biến thể):</span>
                    <span
                      className={`font-semibold ${
                        formData.transaction_type === "in" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {selectedVariant.stock_quantity +
                        (formData.transaction_type === "in" ? formData.quantity : -formData.quantity)}{" "}
                      {selectedProduct.unit}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Tồn sản phẩm hiện tại:</span>
                    <span className="font-semibold text-foreground">
                      {selectedProduct.stock_quantity || 0} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Sau giao dịch:</span>
                    <span
                      className={`font-semibold ${
                        formData.transaction_type === "in" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {(selectedProduct.stock_quantity || 0) +
                        (formData.transaction_type === "in" ? formData.quantity : -formData.quantity)}{" "}
                      {selectedProduct.unit}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Số lượng *</Label>
            <Input
              type="number"
              min="0.0001"
              step="0.0001"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: Number(e.target.value) })
              }
              className="h-9 text-xs"
            />
            {errors.quantity && (
              <p className="text-[11px] text-destructive">{errors.quantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Ghi chú</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Lý do nhập/xuất kho..."
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`h-9 text-xs ${
                formData.transaction_type === "in"
                  ? "bg-success hover:bg-success/90"
                  : "bg-destructive hover:bg-destructive/90"
              }`}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.transaction_type === "in" ? "Nhập kho" : "Xuất kho"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2, ArrowDownLeft, ArrowUpRight, Plus, Trash2, Search, Barcode } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { invalidateWarehouseRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction } from "@/lib/localInventoryStore";
import { type ProductVariant } from "@/hooks/useProductVariants";

interface StockTransactionItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  search_query: string;
  is_open: boolean;
}

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

  const [transactionType, setTransactionType] = useState<"in" | "out">(defaultType);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<StockTransactionItem[]>([
    { id: "init-1", product_id: "", variant_id: "", quantity: 1, search_query: "", is_open: false }
  ]);

  // Fetch all variants in one query to allow local filtering by product_id in memory
  const { data: allVariants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["all-product-variants-for-transactions"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const LOCAL_VARIANTS_KEY = "erp-mini-local-demo-product-variants";
        return JSON.parse(localStorage.getItem(LOCAL_VARIANTS_KEY) || "[]");
      }
      const { data, error } = await supabase.from("product_variants").select("*");
      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setTransactionType(defaultType);
      setNotes("");
      setItems([{ id: "init-1", product_id: "", variant_id: "", quantity: 1, search_query: "", is_open: false }]);
    }
  }, [open, defaultType]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product_id: "",
        variant_id: "",
        quantity: 1,
        search_query: "",
        is_open: false
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof StockTransactionItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "product_id") {
          updated.variant_id = ""; // Reset variant when product changes
          const selected = products.find(p => p.id === value);
          if (selected) {
            updated.search_query = `${selected.sku} - ${selected.name}`;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation
    if (items.some(item => !item.product_id)) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng chọn sản phẩm cho tất cả các dòng." });
      return;
    }

    if (items.some(item => item.quantity <= 0)) {
      toast({ variant: "destructive", title: "Lỗi", description: "Số lượng nhập/xuất phải lớn hơn 0." });
      return;
    }

    // Check if variant is required but not selected
    for (const item of items) {
      const prod = products.find(p => p.id === item.product_id);
      const prodVars = allVariants.filter(v => v.product_id === item.product_id);
      const hasVars = prod?.has_variants || prodVars.length > 0;
      if (hasVars && !item.variant_id) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: `Sản phẩm "${prod?.name}" yêu cầu chọn phân loại biến thể.`
        });
        return;
      }
    }

    // Check stock for outbound transaction
    if (transactionType === "out") {
      const aggregates: Record<string, number> = {};
      items.forEach(item => {
        const key = item.variant_id ? `var-${item.variant_id}` : `prod-${item.product_id}`;
        aggregates[key] = (aggregates[key] || 0) + item.quantity;
      });

      for (const [key, qty] of Object.entries(aggregates)) {
        if (key.startsWith("var-")) {
          const varId = key.replace("var-", "");
          const variant = allVariants.find(v => v.id === varId);
          if (variant && variant.stock_quantity < qty) {
            toast({
              variant: "destructive",
              title: "Không đủ tồn kho",
              description: `Phân loại "${variant.name}" chỉ còn ${variant.stock_quantity} sản phẩm. Bạn đang yêu cầu xuất ${qty} sản phẩm.`
            });
            return;
          }
        } else {
          const prodId = key.replace("prod-", "");
          const prod = products.find(p => p.id === prodId);
          if (prod && (prod.stock_quantity || 0) < qty) {
            toast({
              variant: "destructive",
              title: "Không đủ tồn kho",
              description: `Sản phẩm "${prod.name}" chỉ còn ${prod.stock_quantity || 0} sản phẩm. Bạn đang yêu cầu xuất ${qty} sản phẩm.`
            });
            return;
          }
        }
      }
    }

    try {
      setIsLoading(true);

      if (isLocalDemoAuthEnabled()) {
        const LOCAL_VARIANTS_KEY = "erp-mini-local-demo-product-variants";
        const LOCAL_PRODUCTS_KEY = "erp-mini-local-demo-products";

        const localVariantsList = JSON.parse(localStorage.getItem(LOCAL_VARIANTS_KEY) || "[]");
        const localProductsList = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");

        for (const item of items) {
          const delta = transactionType === "in" ? item.quantity : -item.quantity;
          const prod = localProductsList.find((p: any) => p.id === item.product_id);
          const prodVars = localVariantsList.filter((v: any) => v.product_id === item.product_id);
          const hasVars = prod?.has_variants || prodVars.length > 0;

          const selectedVar = localVariantsList.find((v: any) => v.id === item.variant_id);
          const variantLogText = selectedVar ? ` [Biến thể: ${selectedVar.name}]` : "";
          const finalNotes = (notes || "").trim() + variantLogText;

          if (hasVars && item.variant_id) {
            // Update variant stock
            const vIdx = localVariantsList.findIndex((v: any) => v.id === item.variant_id);
            if (vIdx !== -1) {
              localVariantsList[vIdx].stock_quantity = Math.max(0, localVariantsList[vIdx].stock_quantity + delta);
            }

            // Sum up variants and update parent product stock
            const updatedVars = localVariantsList.filter((v: any) => v.product_id === item.product_id);
            const totalStock = updatedVars.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0);

            const pIdx = localProductsList.findIndex((p: any) => p.id === item.product_id);
            if (pIdx !== -1) {
              localProductsList[pIdx].stock_quantity = totalStock;
            }
          } else {
            const pIdx = localProductsList.findIndex((p: any) => p.id === item.product_id);
            if (pIdx !== -1) {
              localProductsList[pIdx].stock_quantity = Math.max(0, (localProductsList[pIdx].stock_quantity || 0) + delta);
            }
          }

          // Create local transaction
          createLocalInventoryTransaction({
            product_id: item.product_id,
            transaction_type: transactionType,
            quantity: item.quantity,
            notes: finalNotes || null,
          });
        }

        localStorage.setItem(LOCAL_VARIANTS_KEY, JSON.stringify(localVariantsList));
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(localProductsList));

        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["product-variants"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
        invalidateWarehouseRelated(queryClient);

        toast({
          title: transactionType === "in" ? "Nhập kho hàng loạt local thành công" : "Xuất kho hàng loạt local thành công",
        });
        onOpenChange(false);
        return;
      }

      // Online logic (Supabase)
      for (const item of items) {
        const delta = transactionType === "in" ? item.quantity : -item.quantity;
        const prod = products.find(p => p.id === item.product_id);
        const prodVars = allVariants.filter(v => v.product_id === item.product_id);
        const hasVars = prod?.has_variants || prodVars.length > 0;
        const selectedVar = allVariants.find(v => v.id === item.variant_id);

        const variantLogText = selectedVar ? ` [Biến thể: ${selectedVar.name}]` : "";
        const finalNotes = (notes || "").trim() + variantLogText;

        if (hasVars && item.variant_id) {
          // 1. Update variant stock
          const { error: vError } = await supabase
            .from("product_variants")
            .update({ stock_quantity: Math.max(0, (selectedVar?.stock_quantity || 0) + delta) })
            .eq("id", item.variant_id);
          if (vError) throw vError;

          // 2. Sum up variants
          const { data: siblingVars } = await supabase
            .from("product_variants")
            .select("stock_quantity")
            .eq("product_id", item.product_id);
          
          const totalStock = (siblingVars || []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

          // 3. Update parent product stock
          const { error: pError } = await supabase
            .from("products")
            .update({ stock_quantity: totalStock })
            .eq("id", item.product_id);
          if (pError) throw pError;
        } else {
          // Update product stock atomically via RPC
          const { error: rpcError } = await supabase.rpc("increment_stock_quantity", {
            p_product_id: item.product_id,
            p_quantity: delta,
          });
          if (rpcError) throw rpcError;
        }

        // Create transaction
        const { error: txError } = await supabase
          .from("inventory_transactions")
          .insert({
            product_id: item.product_id,
            transaction_type: transactionType,
            quantity: transactionType === "in" ? item.quantity : -item.quantity,
            notes: finalNotes || null,
          });
        if (txError) throw txError;

        // Update warehouse stock
        if (prod?.company_id) {
          const { data: defaultWh } = await supabase
            .from("warehouses")
            .select("id")
            .eq("company_id", prod.company_id)
            .eq("is_default", true)
            .maybeSingle();

          if (defaultWh) {
            const { data: existingWs } = await supabase
              .from("warehouse_stock")
              .select("id, quantity")
              .eq("warehouse_id", defaultWh.id)
              .eq("product_id", item.product_id)
              .maybeSingle();

            if (existingWs) {
              const { data: updatedProd } = await supabase
                .from("products")
                .select("stock_quantity")
                .eq("id", item.product_id)
                .single();

              await supabase
                .from("warehouse_stock")
                .update({ quantity: updatedProd?.stock_quantity || 0 })
                .eq("id", existingWs.id);
            } else if (transactionType === "in") {
              await supabase
                .from("warehouse_stock")
                .insert({
                  warehouse_id: defaultWh.id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                });
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      invalidateWarehouseRelated(queryClient);

      toast({
        title: transactionType === "in" ? "Nhập kho thành công" : "Xuất kho thành công",
      });

      onOpenChange(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: (err as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-lg text-foreground">
            {transactionType === "in" ? (
              <>
                <ArrowDownLeft className="h-5 w-5 text-success animate-bounce" />
                Phiếu nhập kho hàng loạt
              </>
            ) : (
              <>
                <ArrowUpRight className="h-5 w-5 text-destructive animate-bounce" />
                Phiếu xuất kho hàng loạt
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Quét Barcode hoặc gõ tìm kiếm theo SKU, Tên sản phẩm để thao tác nhanh chóng và chính xác.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="type-in"
                    name="transactionType"
                    checked={transactionType === "in"}
                    onChange={() => setTransactionType("in")}
                    className="text-success focus:ring-success h-4 w-4 border-gray-300"
                  />
                  <Label htmlFor="type-in" className="text-xs font-semibold cursor-pointer text-success flex items-center gap-1">
                    Nhập kho
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="type-out"
                    name="transactionType"
                    checked={transactionType === "out"}
                    onChange={() => setTransactionType("out")}
                    className="text-destructive focus:ring-destructive h-4 w-4 border-gray-300"
                  />
                  <Label htmlFor="type-out" className="text-xs font-semibold cursor-pointer text-destructive flex items-center gap-1">
                    Xuất kho
                  </Label>
                </div>
              </div>

              <Button type="button" size="sm" onClick={handleAddItem} className="h-8 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Thêm SKU
              </Button>
            </div>

            {/* List of items table */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const prod = products.find(p => p.id === item.product_id);
                const prodVars = allVariants.filter(v => v.product_id === item.product_id);
                const hasVars = prod?.has_variants || prodVars.length > 0;
                const selectedVar = prodVars.find(v => v.id === item.variant_id);

                // Filter products in memory based on local query
                const filteredProducts = products.filter(p => {
                  const q = item.search_query.trim().toLowerCase();
                  if (!q || item.product_id) return true; // Show all if empty or product is already selected
                  const barcode = (p as any).barcode || "";
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    barcode.toLowerCase().includes(q)
                  );
                }).slice(0, 10); // Limit to top 10 matches for neatness

                return (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    {/* Index */}
                    <div className="md:col-span-1 text-xs font-semibold text-muted-foreground flex justify-between md:justify-center items-center">
                      <span>Dòng {index + 1}</span>
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive md:hidden" onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Product Search Autocomplete */}
                    <div className="md:col-span-4 relative space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Sản phẩm (Barcode/SKU/Tên)</Label>
                      <div className="relative">
                        <Input
                          placeholder="Gõ hoặc quét Barcode..."
                          value={item.search_query}
                          onChange={(e) => {
                            handleItemChange(item.id, "search_query", e.target.value);
                            handleItemChange(item.id, "product_id", ""); // Reset product id when typing
                            handleItemChange(item.id, "is_open", true);
                          }}
                          onFocus={() => handleItemChange(item.id, "is_open", true)}
                          onBlur={() => setTimeout(() => handleItemChange(item.id, "is_open", false), 250)} // Delay for click event
                          className="h-9 text-xs pl-8 pr-3"
                        />
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>

                      {/* Dropdown panel */}
                      {item.is_open && filteredProducts.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border rounded-md shadow-lg z-50 max-h-56 overflow-y-auto divide-y">
                          {filteredProducts.map((p) => {
                            const bc = (p as any).barcode;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full text-left p-2.5 hover:bg-primary/10 text-xs transition-colors flex flex-col gap-0.5"
                                onClick={() => handleItemChange(item.id, "product_id", p.id)}
                              >
                                <span className="font-semibold text-foreground">{p.name}</span>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                  <span>SKU: {p.sku}</span>
                                  {bc && (
                                    <span className="flex items-center gap-0.5 text-primary">
                                      <Barcode className="h-3 w-3" />
                                      {bc}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Variant selector */}
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Biến thể</Label>
                      {hasVars ? (
                        <Select
                          value={item.variant_id}
                          onValueChange={(val) => handleItemChange(item.id, "variant_id", val)}
                        >
                          <SelectTrigger className="h-9 text-xs border-primary/40 focus:ring-primary">
                            <SelectValue placeholder="Chọn biến thể (Màu, Size)" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {prodVars.map((v) => (
                              <SelectItem key={v.id} value={v.id} className="text-xs">
                                {v.name} (Tồn: {v.stock_quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="h-9 border border-input rounded-md bg-secondary/50 flex items-center justify-center text-[10px] text-muted-foreground italic">
                          Không có biến thể
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Số lượng</Label>
                      <Input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    {/* Remove Action Button (Desktop only) */}
                    <div className="md:col-span-1 hidden md:flex justify-center">
                      {items.length > 1 ? (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Stock preview badge */}
                    {item.product_id && (
                      <div className="col-span-1 md:col-start-2 md:col-span-10 text-[10px] text-muted-foreground flex justify-between flex-wrap gap-2 mt-1 border-t border-dashed pt-1.5 opacity-80">
                        {hasVars && selectedVar ? (
                          <>
                            <span>Tồn hiện tại: <span className="font-semibold text-foreground">{selectedVar.stock_quantity}</span></span>
                            <span>Sau giao dịch: <span className={`font-semibold ${transactionType === "in" ? "text-success" : "text-destructive"}`}>
                              {selectedVar.stock_quantity + (transactionType === "in" ? item.quantity : -item.quantity)}
                            </span></span>
                          </>
                        ) : (
                          prod && (
                            <>
                              <span>Tồn hiện tại: <span className="font-semibold text-foreground">{prod.stock_quantity || 0}</span></span>
                              <span>Sau giao dịch: <span className={`font-semibold ${transactionType === "in" ? "text-success" : "text-destructive"}`}>
                                {(prod.stock_quantity || 0) + (transactionType === "in" ? item.quantity : -item.quantity)}
                              </span></span>
                            </>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Ghi chú chung cho phiếu</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Nhập hàng từ nhà cung cấp ABC, xuất hàng phục vụ hội chợ..."
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
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
                transactionType === "in"
                  ? "bg-success hover:bg-success/90"
                  : "bg-destructive hover:bg-destructive/90"
              }`}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {transactionType === "in" ? "Nhập kho hàng loạt" : "Xuất kho hàng loạt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Scale, ArrowRight, Layers, HelpCircle } from "lucide-react";
import { useUnitConversions, type UnitConversion } from "@/hooks/useUnitConversions";
import { useProductVariants, type ProductVariant } from "@/hooks/useProductVariants";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction } from "@/lib/localInventoryStore";
import { invalidateProductRelated, invalidateWarehouseRelated } from "@/lib/queryInvalidation";

interface UnitConversionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    unit: string | null;
    sku: string;
    has_variants: boolean | null;
  } | null;
}

export function UnitConversionsDialog({
  open,
  onOpenChange,
  product,
}: UnitConversionsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("config");

  // Hook UOM
  const { conversions, addConversion, deleteConversion } = useUnitConversions(product?.id);

  // Hook Variants
  const { variants = [] } = useProductVariants(product?.id || "");

  // Form states for new conversion
  const [fromUnit, setFromUnit] = useState("");
  const [factor, setFactor] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Break pack states
  const [selectedConvId, setSelectedConvId] = useState("");
  const [sourceVariantId, setSourceVariantId] = useState("");
  const [destVariantId, setDestVariantId] = useState("");
  const [breakQty, setBreakQty] = useState<number>(1);
  const [isBreaking, setIsBreaking] = useState(false);

  const baseUnit = product?.unit || "Cái";

  const handleAddConv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!fromUnit.trim()) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng nhập tên đơn vị quy đổi." });
      return;
    }
    if (factor <= 1) {
      toast({ variant: "destructive", title: "Lỗi", description: "Hệ số quy đổi phải lớn hơn 1." });
      return;
    }

    try {
      setIsSubmitting(true);
      await addConversion.mutateAsync({
        product_id: product.id,
        from_unit: fromUnit.trim(),
        to_unit: baseUnit,
        factor,
        is_active: true
      });
      toast({ title: "Thêm quy cách thành công" });
      setFromUnit("");
      setFactor(10);
    } catch (err) {
      toast({ variant: "destructive", title: "Lỗi", description: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConv = async (id: string) => {
    try {
      await deleteConversion.mutateAsync(id);
      toast({ title: "Đã xóa quy cách" });
      if (selectedConvId === id) setSelectedConvId("");
    } catch (err) {
      toast({ variant: "destructive", title: "Lỗi", description: (err as Error).message });
    }
  };

  const handleBreakPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (breakQty <= 0) {
      toast({ variant: "destructive", title: "Lỗi", description: "Số lượng xé lẻ phải lớn hơn 0." });
      return;
    }

    const selectedConv = conversions.find(c => c.id === selectedConvId);
    if (!selectedConv) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng chọn quy cách xé lẻ." });
      return;
    }

    const hasVariants = product.has_variants || variants.length > 0;
    if (hasVariants && (!sourceVariantId || !destVariantId)) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng chọn phân loại nguồn và phân loại đích." });
      return;
    }

    if (hasVariants && sourceVariantId === destVariantId) {
      toast({ variant: "destructive", title: "Lỗi", description: "Phân loại nguồn và đích phải khác nhau." });
      return;
    }

    try {
      setIsBreaking(true);
      const totalDestQty = breakQty * selectedConv.factor;

      if (isLocalDemoAuthEnabled()) {
        const LOCAL_VARIANTS_KEY = "erp-mini-local-demo-product-variants";
        const LOCAL_PRODUCTS_KEY = "erp-mini-local-demo-products";

        const localVariantsList = JSON.parse(localStorage.getItem(LOCAL_VARIANTS_KEY) || "[]");
        const localProductsList = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");

        if (hasVariants) {
          // Find source variant and check stock
          const srcIdx = localVariantsList.findIndex((v: any) => v.id === sourceVariantId);
          if (srcIdx === -1) throw new Error("Không tìm thấy phân loại nguồn.");
          
          if (localVariantsList[srcIdx].stock_quantity < breakQty) {
            toast({
              variant: "destructive",
              title: "Không đủ tồn kho",
              description: `Phân loại nguồn chỉ còn ${localVariantsList[srcIdx].stock_quantity} sản phẩm. Cần ${breakQty} để xé lẻ.`
            });
            return;
          }

          // Deduct from source variant
          localVariantsList[srcIdx].stock_quantity = Math.max(0, localVariantsList[srcIdx].stock_quantity - breakQty);

          // Add to dest variant
          const dstIdx = localVariantsList.findIndex((v: any) => v.id === destVariantId);
          if (dstIdx === -1) throw new Error("Không tìm thấy phân loại đích.");
          localVariantsList[dstIdx].stock_quantity += totalDestQty;

          // Recalculate parent product stock
          const siblingVars = localVariantsList.filter((v: any) => v.product_id === product.id);
          const totalStock = siblingVars.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0);

          const pIdx = localProductsList.findIndex((p: any) => p.id === product.id);
          if (pIdx !== -1) {
            localProductsList[pIdx].stock_quantity = totalStock;
          }

          localStorage.setItem(LOCAL_VARIANTS_KEY, JSON.stringify(localVariantsList));
          localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(localProductsList));

          // Log transactions
          const srcVar = variants.find(v => v.id === sourceVariantId);
          const dstVar = variants.find(v => v.id === destVariantId);

          createLocalInventoryTransaction({
            product_id: product.id,
            transaction_type: "out",
            quantity: breakQty,
            notes: `Xé lẻ tự chia: Xuất phân loại lớn [${srcVar?.name}] để xé lẻ`,
          });

          createLocalInventoryTransaction({
            product_id: product.id,
            transaction_type: "in",
            quantity: totalDestQty,
            notes: `Xé lẻ tự chia: Nhận ${totalDestQty} phân loại nhỏ [${dstVar?.name}] từ xé lẻ ${breakQty} [${srcVar?.name}]`,
          });
        } else {
          // If no variants, just log transaction for info (virtual breakout)
          // Adjust stock quantity: stock actually increases because 1 package unit is now broken to multiple base units
          // Actually, if there are no variants, the parent product quantity already holds everything in base UOM.
          // Debulking only changes virtual package numbers, stock quantity in base UOM remains unchanged unless 
          // we track different physical entities. To represent xé lẻ in a single product, we just record a note.
          createLocalInventoryTransaction({
            product_id: product.id,
            transaction_type: "in",
            quantity: 0,
            notes: `Xé lẻ ảo: Cấu hình ${breakQty} ${selectedConv.from_unit} thành ${totalDestQty} ${selectedConv.to_unit}`,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["product-variants"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
        invalidateWarehouseRelated(queryClient);

        toast({
          title: "Xé lẻ sản phẩm thành công",
          description: `Đã xé ${breakQty} ${selectedConv.from_unit} thành ${totalDestQty} ${selectedConv.to_unit} và tự động chia tồn kho.`
        });
        setBreakQty(1);
        onOpenChange(false);
        return;
      }

      // Online logic (Supabase)
      if (hasVariants) {
        // Fetch current variant stocks
        const { data: srcV } = await supabase.from("product_variants").select("stock_quantity").eq("id", sourceVariantId).single();
        if (!srcV || srcV.stock_quantity < breakQty) {
          toast({ variant: "destructive", title: "Không đủ tồn kho", description: "Phân loại nguồn không đủ tồn kho để xé lẻ." });
          return;
        }

        // 1. Deduct from source
        const { error: err1 } = await supabase
          .from("product_variants")
          .update({ stock_quantity: Math.max(0, srcV.stock_quantity - breakQty) })
          .eq("id", sourceVariantId);
        if (err1) throw err1;

        // 2. Add to dest
        const { data: dstV } = await supabase.from("product_variants").select("stock_quantity").eq("id", destVariantId).single();
        const { error: err2 } = await supabase
          .from("product_variants")
          .update({ stock_quantity: (dstV?.stock_quantity || 0) + totalDestQty })
          .eq("id", destVariantId);
        if (err2) throw err2;

        // 3. Recalculate parent
        const { data: siblingVars } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("product_id", product.id);
        const totalStock = (siblingVars || []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

        const { error: err3 } = await supabase
          .from("products")
          .update({ stock_quantity: totalStock })
          .eq("id", product.id);
        if (err3) throw err3;

        // 4. Log transactions
        const srcVar = variants.find(v => v.id === sourceVariantId);
        const dstVar = variants.find(v => v.id === destVariantId);

        await supabase.from("inventory_transactions").insert([
          {
            product_id: product.id,
            transaction_type: "out",
            quantity: -breakQty,
            notes: `Xé lẻ tự chia: Xuất phân loại lớn [${srcVar?.name}] để xé lẻ`,
          },
          {
            product_id: product.id,
            transaction_type: "in",
            quantity: totalDestQty,
            notes: `Xé lẻ tự chia: Nhận ${totalDestQty} phân loại nhỏ [${dstVar?.name}] từ xé lẻ ${breakQty} [${srcVar?.name}]`,
          }
        ]);
      } else {
        // No variants online
        await supabase.from("inventory_transactions").insert({
          product_id: product.id,
          transaction_type: "in",
          quantity: 0,
          notes: `Xé lẻ ảo: Cấu hình ${breakQty} ${selectedConv.from_unit} thành ${totalDestQty} ${selectedConv.to_unit}`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      invalidateWarehouseRelated(queryClient);

      toast({
        title: "Xé lẻ sản phẩm thành công",
        description: `Đã xé ${breakQty} ${selectedConv.from_unit} thành ${totalDestQty} ${selectedConv.to_unit} và tự động chia tồn kho.`
      });
      setBreakQty(1);
      onOpenChange(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Lỗi", description: (err as Error).message });
    } finally {
      setIsBreaking(false);
    }
  };

  const selectedConv = conversions.find(c => c.id === selectedConvId);
  const calculatedOutput = selectedConv ? breakQty * selectedConv.factor : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-lg text-foreground">
            <Scale className="h-5 w-5 text-primary" />
            Quy cách & Xé lẻ sản phẩm
          </DialogTitle>
          <DialogDescription className="text-xs">
            Quản lý đơn vị quy đổi, tỉ lệ đóng gói và thực hiện xé lẻ (de-bulk) tự động chia tồn kho cho sản phẩm: <span className="font-semibold text-foreground">{product?.name}</span> (SKU: {product?.sku})
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="config" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Cấu hình quy cách
            </TabsTrigger>
            <TabsTrigger value="break" className="text-xs gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              Thực hiện xé lẻ
            </TabsTrigger>
          </TabsList>

          {/* Config conversions tab */}
          <TabsContent value="config" className="space-y-4">
            <form onSubmit={handleAddConv} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 rounded-lg border bg-secondary/20">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">1 Đơn vị lớn (Ví dụ: Thùng, Hộp)</Label>
                <Input
                  placeholder="Nhập tên đơn vị..."
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tỉ lệ quy đổi ra {baseUnit}</Label>
                <Input
                  type="number"
                  min="2"
                  step="1"
                  value={factor}
                  onChange={(e) => setFactor(Number(e.target.value))}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="h-9 text-xs w-full gap-1">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Thêm Quy Cách
              </Button>
            </form>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b">
                    <th className="p-3 font-semibold text-muted-foreground">Đơn vị quy đổi</th>
                    <th className="p-3 font-semibold text-muted-foreground">Tỉ lệ quy đổi</th>
                    <th className="p-3 font-semibold text-muted-foreground">Công thức hiển thị</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Thao tác</th>
                  </tr>
                </table>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody>
                      {conversions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                            Chưa có cấu hình quy cách quy đổi cho sản phẩm này.
                          </td>
                        </tr>
                      ) : (
                        conversions.map((c) => (
                          <tr key={c.id} className="border-b hover:bg-secondary/10 transition-colors">
                            <td className="p-3 font-semibold text-foreground">{c.from_unit}</td>
                            <td className="p-3">x{c.factor}</td>
                            <td className="p-3 text-muted-foreground font-mono">
                              1 {c.from_unit} = {c.factor} {c.to_unit}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteConv(c.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Break pack execution tab */}
            <TabsContent value="break" className="space-y-4">
              {conversions.length === 0 ? (
                <div className="p-8 text-center border rounded-md bg-secondary/10 space-y-2">
                  <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">Bạn cần cấu hình ít nhất một quy cách quy đổi đơn vị ở tab bên cạnh trước khi thực hiện xé lẻ.</p>
                </div>
              ) : (
                <form onSubmit={handleBreakPack} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Chọn Quy cách quy đổi</Label>
                      <Select value={selectedConvId} onValueChange={setSelectedConvId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Chọn quy cách quy đổi..." />
                        </SelectTrigger>
                        <SelectContent>
                          {conversions.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              1 {c.from_unit} = {c.factor} {c.to_unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Số lượng đơn vị lớn cần xé</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={breakQty}
                        onChange={(e) => setBreakQty(Number(e.target.value))}
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* If product has variants, show source/destination variant fields */}
                  {(product?.has_variants || variants.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg border bg-secondary/10">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Phân loại lớn cần xé (Nguồn)</Label>
                        <Select value={sourceVariantId} onValueChange={sourceVariantId => {
                          setSourceVariantId(sourceVariantId);
                          // Auto set default dest variant if name matches
                          const srcVar = variants.find(v => v.id === sourceVariantId);
                          if (srcVar) {
                            // Find alternative variant for destination
                            const alternate = variants.find(v => v.id !== sourceVariantId);
                            if (alternate) setDestVariantId(alternate.id);
                          }
                        }}>
                          <SelectTrigger className="h-9 text-xs border-primary/40">
                            <SelectValue placeholder="Chọn phân loại lớn..." />
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map(v => (
                              <SelectItem key={v.id} value={v.id} className="text-xs">
                                {v.name} (Tồn: {v.stock_quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Phân loại lẻ nhận hàng (Đích)</Label>
                        <Select value={destVariantId} onValueChange={setDestVariantId}>
                          <SelectTrigger className="h-9 text-xs border-primary/40">
                            <SelectValue placeholder="Chọn phân loại lẻ..." />
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map(v => (
                              <SelectItem key={v.id} value={v.id} className="text-xs">
                                {v.name} (Tồn: {v.stock_quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Realtime calculation preview box */}
                  {selectedConv && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between flex-wrap gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Tổng số lượng quy đổi</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-foreground">{breakQty} {selectedConv.from_unit}</span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="font-bold text-lg text-primary">{calculatedOutput} {selectedConv.to_unit}</span>
                        </div>
                      </div>
                      <div className="text-xs text-right text-muted-foreground">
                        Tỉ lệ chia tự động: <span className="font-mono">x{selectedConv.factor}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="h-9 text-xs"
                    >
                      Bỏ qua
                    </Button>
                    <Button
                      type="submit"
                      disabled={isBreaking || !selectedConvId}
                      className="h-9 text-xs bg-success hover:bg-success/90"
                    >
                      {isBreaking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Xác nhận xé lẻ & Chia kho
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
  );
}

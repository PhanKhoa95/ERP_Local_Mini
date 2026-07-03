import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Package, ClipboardCheck, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction } from "@/lib/localInventoryStore";
import { invalidateWarehouseRelated } from "@/lib/queryInvalidation";

interface WarehouseAuditTabProps {
  warehouses: any[];
  warehouseStock: any[];
}

export function WarehouseAuditTab({ warehouses, warehouseStock }: WarehouseAuditTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state to store actual counts entered by user
  // Key: product_id, Value: actual quantity
  const [actualQuantities, setActualQuantities] = useState<Record<string, number>>({});

  // Filter stock for the selected warehouse
  const currentStock = useMemo(() => {
    if (!selectedWarehouseId) return [];
    return warehouseStock.filter((s) => s.warehouse_id === selectedWarehouseId);
  }, [warehouseStock, selectedWarehouseId]);

  // Seed initial values when warehouse selection changes
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    currentStock.forEach((s) => {
      initialCounts[s.product_id] = s.quantity ?? 0;
    });
    setActualQuantities(initialCounts);
  }, [currentStock]);

  const handleQuantityChange = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setActualQuantities((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    }));
  };

  const handleReset = () => {
    const initialCounts: Record<string, number> = {};
    currentStock.forEach((s) => {
      initialCounts[s.product_id] = s.quantity ?? 0;
    });
    setActualQuantities(initialCounts);
    toast({
      title: "Đã thiết lập lại",
      description: "Số lượng kiểm kho thực tế đã được đưa về bằng số lượng hệ thống.",
    });
  };

  const handleApplyAudit = async () => {
    if (!selectedWarehouseId) return;
    
    // Find differences
    const auditAdjustments = currentStock
      .map((s) => {
        const systemQty = s.quantity ?? 0;
        const actualQty = actualQuantities[s.product_id] ?? systemQty;
        const difference = actualQty - systemQty;
        return {
          product_id: s.product_id,
          product_name: s.products?.name || "Sản phẩm",
          sku: s.products?.sku || "",
          systemQty,
          actualQty,
          difference,
        };
      })
      .filter((adj) => adj.difference !== 0);

    if (auditAdjustments.length === 0) {
      toast({
        title: "Không có chênh lệch",
        description: "Số lượng thực tế khớp hoàn toàn với số lượng hệ thống. Không cần điều chỉnh.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const whName = warehouses.find((w) => w.id === selectedWarehouseId)?.name || "Kho";

      if (isLocalDemoAuthEnabled()) {
        // LOCAL DEMO MODE
        const LOCAL_PRODUCTS_KEY = "erp-mini-local-demo-products";
        const localProductsList = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");

        auditAdjustments.forEach((adj) => {
          const delta = adj.difference;
          
          // 1. Update product total stock
          const pIdx = localProductsList.findIndex((p: any) => p.id === adj.product_id);
          if (pIdx !== -1) {
            localProductsList[pIdx].stock_quantity = Math.max(0, (localProductsList[pIdx].stock_quantity || 0) + delta);
          }

          // 2. Create inventory transaction log
          const type = delta > 0 ? "in" : "out";
          createLocalInventoryTransaction({
            product_id: adj.product_id,
            transaction_type: type,
            quantity: Math.abs(delta),
            notes: `[Kiểm kho ${whName}] Điều chỉnh tồn kho hệ thống (${adj.systemQty}) theo kiểm kho thực tế (${adj.actualQty}). Chênh lệch: ${delta > 0 ? "+" : ""}${delta}`,
          });
        });

        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(localProductsList));
      } else {
        // ONLINE SUPABASE MODE
        for (const adj of auditAdjustments) {
          const delta = adj.difference;
          const type = delta > 0 ? "in" : "out";
          const transactionQty = Math.abs(delta);

          // 1. Update warehouse_stock table
          const { data: wsData } = await supabase
            .from("warehouse_stock")
            .select("id, quantity")
            .eq("warehouse_id", selectedWarehouseId)
            .eq("product_id", adj.product_id)
            .maybeSingle();

          if (wsData) {
            await supabase
              .from("warehouse_stock")
              .update({ quantity: adj.actualQty })
              .eq("id", wsData.id);
          } else {
            await supabase.from("warehouse_stock").insert({
              warehouse_id: selectedWarehouseId,
              product_id: adj.product_id,
              quantity: adj.actualQty,
            });
          }

          // 2. Update products table stock_quantity atomically
          await supabase.rpc("increment_stock_quantity", {
            p_product_id: adj.product_id,
            p_quantity: delta,
          });

          // 3. Insert transaction log
          await supabase.from("inventory_transactions").insert({
            product_id: adj.product_id,
            transaction_type: type,
            quantity: type === "in" ? transactionQty : -transactionQty,
            notes: `[Kiểm kho ${whName}] Số lượng hệ thống: ${adj.systemQty} → Số lượng thực tế: ${adj.actualQty}. Chênh lệch: ${delta > 0 ? "+" : ""}${delta}`,
          });
        }
      }

      // Refresh cache
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock"] });
      invalidateWarehouseRelated(queryClient);

      toast({
        title: "Hoàn tất kiểm kho thành công!",
        description: `Đã tự động cập nhật tồn kho cho ${auditAdjustments.length} sản phẩm có chênh lệch.`,
      });

      // Clear local states
      const refreshedCounts: Record<string, number> = {};
      currentStock.forEach((s) => {
        const foundAdj = auditAdjustments.find((a) => a.product_id === s.product_id);
        refreshedCounts[s.product_id] = foundAdj ? foundAdj.actualQty : (s.quantity ?? 0);
      });
      setActualQuantities(refreshedCounts);

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi kiểm kho",
        description: err.message || "Đã xảy ra lỗi trong quá trình cập nhật số liệu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-4 rounded-xl shadow-xs">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Kiểm kho & Đối chiếu số liệu
          </h3>
          <p className="text-xs text-muted-foreground">
            Đối chiếu số lượng thực tế với hệ thống. Hệ thống tự động sinh phiếu điều chỉnh kho sau khi hoàn tất.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Chọn kho hàng cần kiểm" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!selectedWarehouseId ? (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Chưa chọn kho hàng</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Vui lòng chọn một kho hàng cụ thể ở phía trên để hiển thị danh sách sản phẩm và thực hiện đối chiếu kiểm kho.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              Tổng số mẫu mã cần đối chiếu: {currentStock.length} sản phẩm
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Thiết lập lại
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/95 text-white"
                onClick={handleApplyAudit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1">
                    Đang lưu...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Hoàn tất kiểm kho
                  </>
                )}
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Sản phẩm</TableHead>
                  <TableHead className="text-right">Tồn hệ thống</TableHead>
                  <TableHead className="text-center w-36">Tồn thực tế</TableHead>
                  <TableHead className="text-right">Chênh lệch</TableHead>
                  <TableHead className="w-32 text-right">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStock.map((s) => {
                  const systemQty = s.quantity ?? 0;
                  const actualQty = actualQuantities[s.product_id] ?? systemQty;
                  const diff = actualQty - systemQty;
                  
                  return (
                    <TableRow key={s.id} className={diff !== 0 ? "bg-primary/5 hover:bg-primary/10" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-secondary/50 flex items-center justify-center overflow-hidden">
                            {s.products?.image_url ? (
                              <img
                                src={s.products.image_url}
                                alt={s.products.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{s.products?.name}</p>
                            <p className="text-xs text-muted-foreground">{s.products?.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {systemQty.toLocaleString()} {s.products?.unit || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-center text-sm font-mono font-medium w-28 mx-auto"
                          value={actualQty}
                          onChange={(e) => handleQuantityChange(s.product_id, e.target.value)}
                          disabled={isSubmitting}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {diff === 0 ? (
                          <span className="text-muted-foreground">0</span>
                        ) : diff > 0 ? (
                          <span className="text-success">+{diff.toLocaleString()}</span>
                        ) : (
                          <span className="text-destructive">{diff.toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {diff === 0 ? (
                          <Badge className="bg-success/10 text-success border-success/20">Khớp</Badge>
                        ) : diff > 0 ? (
                          <Badge className="bg-success/20 text-success border-success/30">Thừa hàng</Badge>
                        ) : (
                          <Badge className="bg-destructive/15 text-destructive border-destructive/20">Thiếu hàng</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {currentStock.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Không có sản phẩm nào trong kho này. Hãy nhập kho sản phẩm trước để thực hiện kiểm kho.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

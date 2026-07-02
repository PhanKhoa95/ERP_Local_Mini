import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Search, CheckCircle2, ScanBarcode, Printer,
  ChevronRight, ChevronLeft, AlertTriangle, PackageCheck, Loader2
} from "lucide-react";
import type { Order, OrderItem } from "@/hooks/useOrders";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { getLocalInventoryTransactions, createLocalInventoryTransaction, getLocalProductBom } from "@/lib/localInventoryStore";

interface PackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Queue of orders to pack sequentially (from bulk selection) */
  orderQueue: Order[];
  /** All orders available for search/scan */
  allOrders: Order[];
  /** Callback when an order is packed – should update status + deduct stock */
  onPackOrder: (orderId: string) => Promise<void>;
}

interface PickedItem {
  itemId: string;
  pickedQty: number;
}

export function PackingDialog({
  open,
  onOpenChange,
  orderQueue,
  allOrders,
  onPackOrder,
}: PackingDialogProps) {
  const { toast } = useToast();
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Current order index in queue
  const [queueIndex, setQueueIndex] = useState(0);
  // Manual search / scan input
  const [scanValue, setScanValue] = useState("");
  // Manually found order (outside queue)
  const [manualOrder, setManualOrder] = useState<Order | null>(null);
  // Picked items tracking map keyed by order ID
  const [pickedItemsMap, setPickedItemsMap] = useState<Record<string, Record<string, number>>>({});
  // Options
  const [autoPrint, setAutoPrint] = useState(false);
  const [autoDeductStock, setAutoDeductStock] = useState(true);
  // Loading state
  const [isPacking, setIsPacking] = useState(false);
  // Stats
  const [packedCount, setPackedCount] = useState(0);

  // Determine the current order to display
  const currentOrder: Order | null = useMemo(() => {
    if (manualOrder) return manualOrder;
    if (orderQueue.length > 0 && queueIndex < orderQueue.length) {
      return orderQueue[queueIndex];
    }
    return null;
  }, [manualOrder, orderQueue, queueIndex]);

  const pickedItems = useMemo(() => currentOrder ? (pickedItemsMap[currentOrder.id] || {}) : {}, [currentOrder, pickedItemsMap]);

  const orderItems = useMemo(() => currentOrder?.order_items || [], [currentOrder]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (open) {
      setQueueIndex(0);
      setManualOrder(null);
      setPickedItemsMap({});
      setScanValue("");
      setPackedCount(0);
      timer = setTimeout(() => scanInputRef.current?.focus(), 200);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open]);

  // Check if all items are picked
  const allPicked = useMemo(() => {
    if (orderItems.length === 0) return false;
    return orderItems.every((item) => {
      const picked = pickedItems[item.id] || 0;
      return picked >= item.quantity;
    });
  }, [orderItems, pickedItems]);

  // Total progress
  const totalToPick = orderItems.reduce((s, i) => s + i.quantity, 0);
  const totalPicked = Object.values(pickedItems).reduce((s, q) => s + q, 0);

  // Toggle pick single item
  const togglePickItem = useCallback((itemId: string, maxQty: number) => {
    if (!currentOrder) return;
    setPickedItemsMap((prev) => {
      const orderPicks = prev[currentOrder.id] || {};
      const current = orderPicks[itemId] || 0;
      const nextPicks = { ...orderPicks };
      if (current >= maxQty) {
        // Unpick
        delete nextPicks[itemId];
      } else {
        nextPicks[itemId] = maxQty;
      }
      return {
        ...prev,
        [currentOrder.id]: nextPicks,
      };
    });
  }, [currentOrder]);

  // Mark all items as picked
  const markAllPicked = useCallback(() => {
    if (!currentOrder) return;
    const all: Record<string, number> = {};
    orderItems.forEach((item) => {
      all[item.id] = item.quantity;
    });
    setPickedItemsMap((prev) => ({
      ...prev,
      [currentOrder.id]: all,
    }));
  }, [currentOrder, orderItems]);

  // Handle scan/search submit
  const handleScanSubmit = useCallback(() => {
    const trimmedScan = scanValue.trim();
    if (!trimmedScan) return;

    if (currentOrder) {
      const matchedItem = orderItems.find(
        (item) =>
          item.products?.sku?.toLowerCase() === trimmedScan.toLowerCase() &&
          (pickedItems[item.id] || 0) < item.quantity
      );

      if (matchedItem) {
        const picked = pickedItems[matchedItem.id] || 0;
        setPickedItemsMap((prev) => {
          const orderPicks = prev[currentOrder.id] || {};
          const currentQty = orderPicks[matchedItem.id] || 0;
          return {
            ...prev,
            [currentOrder.id]: {
              ...orderPicks,
              [matchedItem.id]: currentQty + 1,
            },
          };
        });
        toast({
          title: "Đã quét sản phẩm",
          description: `Đã nhặt +1 ${matchedItem.products?.name || "sản phẩm"} (${picked + 1}/${matchedItem.quantity})`,
        });
        setScanValue("");
        return;
      } else {
        const anyMatchedItem = orderItems.find(
          (item) => item.products?.sku?.toLowerCase() === trimmedScan.toLowerCase()
        );
        if (anyMatchedItem) {
          toast({
            title: "Sản phẩm đã đủ",
            description: `Sản phẩm "${anyMatchedItem.products?.name}" đã được nhặt đủ số lượng.`,
          });
          setScanValue("");
          return;
        }
      }
    }

    const found = allOrders.find(
      (o) =>
        o.order_number.toLowerCase() === trimmedScan.toLowerCase() ||
        o.id === trimmedScan
    );
    if (found) {
      setManualOrder(found);
      setScanValue("");
      toast({ title: "Đã tìm thấy đơn hàng", description: `Đơn ${found.order_number} sẵn sàng đóng gói.` });
    } else {
      toast({
        title: "Không tìm thấy",
        description: "Không tìm thấy đơn hàng hoặc sản phẩm phù hợp",
        variant: "destructive",
      });
    }
  }, [scanValue, currentOrder, orderItems, pickedItems, allOrders, toast]);

  // Print K80 receipt for order
  const printK80 = useCallback((order: Order) => {
    const printWindow = window.open("", "_blank", "width=302,height=600");
    if (!printWindow) return;

    const items = (order.order_items || [])
      .map(
        (item, idx) => `
        <tr>
          <td style="text-align:center;border-bottom:1px dashed #ccc;padding:4px 0;">${idx + 1}</td>
          <td style="border-bottom:1px dashed #ccc;padding:4px 0;">
            <div style="font-weight:bold;font-size:11px;">${item.products?.name || "SP"}</div>
            <small style="color:#666;">SKU: ${item.products?.sku || "N/A"}</small>
          </td>
          <td style="text-align:center;border-bottom:1px dashed #ccc;padding:4px 0;">${item.quantity}</td>
          <td style="text-align:right;border-bottom:1px dashed #ccc;padding:4px 0;">${(item.quantity * Number(item.unit_price)).toLocaleString("vi-VN")}đ</td>
        </tr>`
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Đóng hàng - ${order.order_number}</title>
      <style>body{font-family:'Courier New',monospace;width:72mm;margin:0 auto;padding:4mm;font-size:11px;}
      table{width:100%;border-collapse:collapse;}th{text-align:left;border-bottom:1px solid #000;padding:4px 0;font-size:10px;}
      .center{text-align:center;}.right{text-align:right;}.bold{font-weight:bold;}
      .dashed{border-top:1px dashed #000;margin:6px 0;}</style></head><body>
      <div class="center bold" style="font-size:14px;margin-bottom:6px;">PHIẾU ĐÓNG HÀNG</div>
      <div class="center" style="font-size:10px;color:#666;margin-bottom:8px;">${new Date().toLocaleString("vi-VN")}</div>
      <div class="dashed"></div>
      <div><strong>Mã đơn:</strong> ${order.order_number}</div>
      <div><strong>Khách:</strong> ${order.customer_name || "N/A"}</div>
      <div><strong>SĐT:</strong> ${order.customer_phone || "N/A"}</div>
      <div><strong>Địa chỉ:</strong> ${order.shipping_address || order.customer_address || "N/A"}</div>
      <div class="dashed"></div>
      <table><thead><tr><th class="center">#</th><th>Sản phẩm</th><th class="center">SL</th><th class="right">T.Tiền</th></tr></thead>
      <tbody>${items}</tbody></table>
      <div class="dashed"></div>
      <div class="right bold" style="font-size:13px;">Tổng: ${Number(order.total || 0).toLocaleString("vi-VN")}đ</div>
      <div class="dashed"></div>
      <div class="center" style="font-size:10px;color:#999;margin-top:8px;">--- Đã kiểm hàng & đóng gói ---</div>
      </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, []);

  // Complete packing for current order
  const handleCompletePacking = useCallback(async () => {
    if (!currentOrder) return;
    setIsPacking(true);
    try {
      // 1. Verify and deduct stock if autoDeductStock is checked
      if (autoDeductStock) {
        if (isLocalDemoAuthEnabled()) {
          const transactions = getLocalInventoryTransactions();
          const orderNumber = currentOrder.order_number || currentOrder.id;
          
          // Check if there is already a transaction for this order
          const hasTx = transactions.some((tx) =>
            tx.notes?.includes(orderNumber)
          );

          if (!hasTx) {
            const orderItems = currentOrder.order_items || [];
            for (const item of orderItems) {
              if (!item.product_id) continue;
              const bomItems = getLocalProductBom(item.product_id);
              if (bomItems && bomItems.length > 0) {
                for (const bomItem of bomItems) {
                  createLocalInventoryTransaction({
                    product_id: bomItem.material_id,
                    transaction_type: "out",
                    quantity: bomItem.quantity * (item.quantity || 1),
                    notes: `Trừ vật tư ${bomItem.material?.name || bomItem.material_id} cho đơn hàng ${orderNumber}`,
                  });
                }
              } else {
                createLocalInventoryTransaction({
                  product_id: item.product_id,
                  transaction_type: "out",
                  quantity: item.quantity || 1,
                  notes: `Trừ tồn kho - Đơn hàng ${orderNumber}`,
                });
              }
            }
          }
        }
      }

      // 2. Call parent pack order (this transitions status)
      await onPackOrder(currentOrder.id);
      
      if (autoPrint) {
        printK80(currentOrder);
      }

      const packed = packedCount + 1;
      setPackedCount(packed);

      toast({
        title: "Đóng hàng thành công!",
        description: `Đơn ${currentOrder.order_number} đã chuyển sang Chờ chuyển hàng. (${packed} đơn đã đóng)`,
      });

      // 3. Move to next order in queue, using local variable to avoid stale state lag
      const isManual = !!manualOrder;
      if (isManual) {
        setManualOrder(null);
      }

      if (!isManual && queueIndex < orderQueue.length - 1) {
        setQueueIndex((prev) => prev + 1);
        toast({
          title: "Đơn tiếp theo",
          description: `Chuyển sang đơn ${orderQueue[queueIndex + 1]?.order_number}`,
        });
      } else if (!isManual && queueIndex >= orderQueue.length - 1) {
        // All queue done
        toast({
          title: "Hoàn tất tất cả!",
          description: `Đã đóng gói ${packed} đơn hàng. Bạn có thể quét mã đơn mới hoặc đóng dialog.`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Lỗi đóng hàng",
        description: err?.message || "Không thể cập nhật trạng thái đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsPacking(false);
      setTimeout(() => scanInputRef.current?.focus(), 200);
    }
  }, [currentOrder, onPackOrder, autoPrint, printK80, packedCount, toast, manualOrder, queueIndex, orderQueue, autoDeductStock]);

  // Queue navigation info
  const queueInfo = orderQueue.length > 0
    ? `${Math.min(queueIndex + 1, orderQueue.length)}/${orderQueue.length}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-blue-600" />
            Đóng hàng
            {queueInfo && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Đơn {queueInfo}
              </Badge>
            )}
            {packedCount > 0 && (
              <Badge className="ml-1 bg-emerald-500 text-white text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {packedCount} đã đóng
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Quét mã vạch hoặc nhập mã đơn hàng để kiểm hàng và đóng gói. Sau khi đóng xong, đơn tự động chuyển sang Chờ chuyển hàng.
          </DialogDescription>
        </DialogHeader>

        {/* Scan / Search bar */}
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={scanInputRef}
              placeholder="Quét barcode hoặc nhập mã đơn hàng..."
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScanSubmit()}
              className="pl-10 h-10 text-sm"
            />
          </div>
          <Button onClick={handleScanSubmit} size="sm" className="h-10 gap-1.5">
            <Search className="h-4 w-4" />
            Tìm
          </Button>
        </div>

        {/* Options */}
        <div className="flex items-center gap-6 py-2 px-1">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox
              checked={autoPrint}
              onCheckedChange={(c) => setAutoPrint(!!c)}
            />
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            In phiếu đóng hàng K80 sau khi đóng
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox
              checked={autoDeductStock}
              onCheckedChange={(c) => setAutoDeductStock(!!c)}
            />
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            Tự động trừ tồn kho
          </label>
        </div>

        {/* Current Order Info */}
        {currentOrder ? (
          <div className="space-y-3">
            {/* Order header */}
            <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">
                      {currentOrder.order_number}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {currentOrder.status === "packing" ? "Đang đóng" : currentOrder.status}
                    </Badge>
                  </div>
                  <span className="font-bold text-sm">
                    {Number(currentOrder.total || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <div><strong>Khách:</strong> {currentOrder.customer_name || "N/A"}</div>
                  <div><strong>SĐT:</strong> {currentOrder.customer_phone || "N/A"}</div>
                  <div className="col-span-2"><strong>Địa chỉ:</strong> {currentOrder.shipping_address || currentOrder.customer_address || "N/A"}</div>
                  {currentOrder.notes && (
                    <div className="col-span-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      <strong>Ghi chú:</strong> {currentOrder.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Picking list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Danh sách sản phẩm cần nhặt ({totalPicked}/{totalToPick})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllPicked}
                  className="h-7 text-[11px] gap-1"
                  disabled={allPicked}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Đã đủ hàng
                </Button>
              </div>

              <div className="space-y-1.5 max-h-[260px] overflow-y-auto border rounded-lg p-2 bg-muted/5">
                {orderItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Đơn hàng không có sản phẩm
                  </div>
                ) : (
                  orderItems.map((item) => {
                    const picked = pickedItems[item.id] || 0;
                    const isDone = picked >= item.quantity;
                    return (
                      <div
                        key={item.id}
                        onClick={() => togglePickItem(item.id, item.quantity)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                          isDone
                            ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700"
                            : "bg-white border-border hover:bg-muted/30 dark:bg-card"
                        }`}
                      >
                        <Checkbox checked={isDone} className="pointer-events-none" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
                            {item.products?.name || "Sản phẩm"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            SKU: {item.products?.sku || "N/A"} · Đơn giá: {Number(item.unit_price).toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-bold ${isDone ? "text-emerald-600" : "text-foreground"}`}>
                            {picked}/{item.quantity}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {isDone ? "✓ Đủ" : "Chờ nhặt"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tiến độ nhặt hàng</span>
                <span className="font-semibold">{totalToPick > 0 ? Math.round((totalPicked / totalToPick) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${allPicked ? "bg-emerald-500" : "bg-blue-500"}`}
                  style={{ width: `${totalToPick > 0 ? (totalPicked / totalToPick) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t">
              {/* Queue navigation */}
              <div className="flex items-center gap-2">
                {orderQueue.length > 1 && !manualOrder && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (queueIndex > 0) {
                          setQueueIndex((p) => p - 1);
                        }
                      }}
                      disabled={queueIndex === 0}
                      className="h-8 text-xs gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (queueIndex < orderQueue.length - 1) {
                          setQueueIndex((p) => p + 1);
                        }
                      }}
                      disabled={queueIndex >= orderQueue.length - 1}
                      className="h-8 text-xs gap-1"
                    >
                      Tiếp
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>

              <Button
                onClick={handleCompletePacking}
                disabled={isPacking || orderItems.length === 0}
                className={`h-9 gap-2 text-sm font-semibold ${
                  allPicked
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
              >
                {isPacking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="h-4 w-4" />
                )}
                {allPicked ? "Xác nhận đóng hàng" : "Đã đủ hàng & Đóng gói"}
              </Button>
            </div>
          </div>
        ) : (
          /* Empty state - waiting for scan */
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <ScanBarcode className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Sẵn sàng đóng hàng</p>
              <p className="text-xs text-muted-foreground mt-1">
                {orderQueue.length > 0
                  ? `Có ${orderQueue.length} đơn trong hàng đợi. Đang tải...`
                  : "Quét barcode hoặc nhập mã đơn hàng để bắt đầu kiểm hàng & đóng gói."}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import { useOrderReturns } from "@/hooks/useOrderReturns";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders"> & {
  order_items?: (Tables<"order_items"> & { products?: Tables<"products"> | null })[];
};

interface PartialReturnDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartialReturnDialog({ order, open, onOpenChange }: PartialReturnDialogProps) {
  const { createReturn, updateReturnStatus } = useOrderReturns();
  const { updateOrderStatus } = useOrders(); // To update order total/notes
  const { toast } = useToast();

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isPending, setIsPending] = useState(false);



  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  const updateQty = (itemId: string, qty: number, maxQty: number) => {
    setSelectedItems(prev => ({ 
      ...prev, 
      [itemId]: Math.min(maxQty, Math.max(1, qty)) 
    }));
  };

  // Calculate return items values
  const totalReturnAmount = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
      const item = order?.order_items?.find(i => i.id === itemId);
      return sum + (item ? Number(item.unit_price) * qty : 0);
    }, 0);
  }, [selectedItems, order?.order_items]);

  const originalTotal = Number(order?.total || 0);
  const newCODTotal = Math.max(0, originalTotal - totalReturnAmount);

  const handleSubmit = async () => {
    if (Object.keys(selectedItems).length === 0) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một sản phẩm hoàn trả."
      });
      return;
    }

    setIsPending(true);
    try {
      const returnItems = Object.entries(selectedItems).map(([itemId, quantity]) => {
        const item = order.order_items?.find(i => i.id === itemId);
        return {
          order_item_id: itemId,
          product_id: item?.product_id,
          product_name: item?.products?.name,
          quantity,
          unit_price: Number(item?.unit_price || 0),
        };
      });

      // 1. Create return record with status 'receiving' (hàng đang hoàn về kho)
      const returnRecord = await createReturn.mutateAsync({
        order_id: order.id,
        platform_source: order.source_type || "manual",
        reason: reason || "Khách từ chối nhận 1 phần khi đồng kiểm bưu tá",
        notes: `Đơn hoàn 1 phần khi giao. ${notes}`,
        refund_amount: 0, // No refund needed since client pays less COD directly to bưu tá
        return_items: returnItems,
        return_type: "partial_return",
      });

      // Transition order return status to 'receiving' immediately
      if (returnRecord && returnRecord.id) {
        await updateReturnStatus.mutateAsync({
          id: returnRecord.id,
          status: "receiving"
        });
      }

      // 2. Update parent order total and notes to reflect new COD
      const returnSummary = returnItems.map(it => `${it.product_name} (x${it.quantity})`).join(", ");
      const updatedNotes = `${order.notes || ""}\n[Hệ thống] Báo hoàn 1 phần: Trả lại ${returnSummary}. Tiền COD thu hộ giảm từ ${originalTotal.toLocaleString("vi-VN")}đ xuống ${newCODTotal.toLocaleString("vi-VN")}đ. Chờ nhận lại hàng hoàn.`;

      await updateOrderStatus.mutateAsync({
        id: order.id,
        status: order.status, // keep current status (e.g. shipping)
        notes: updatedNotes,
        total: newCODTotal
      } as any);

      toast({
        title: "Báo hoàn 1 phần thành công",
        description: `Đã cập nhật tiền COD thu hộ: ${newCODTotal.toLocaleString("vi-VN")}đ. Vận đơn hoàn đang ở trạng thái Chờ nhận.`
      });

      window.dispatchEvent(new Event("local-orders-updated"));
      onOpenChange(false);
      setSelectedItems({});
      setReason("");
      setNotes("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi báo hoàn",
        description: err.message || "Không thể thực hiện báo hoàn 1 phần."
      });
    } finally {
      setIsPending(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full bg-white dark:bg-slate-900 shadow-xl rounded-xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <RefreshCw className="h-4.5 w-4.5 text-orange-500 animate-spin-slow" />
            Báo hoàn 1 phần - Đơn #{order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-lg flex gap-2.5 items-start">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Sử dụng khi khách hàng chỉ nhận một số sản phẩm và trả lại các sản phẩm còn lại cho bưu tá tại thời điểm giao hàng. Số tiền thu hộ COD sẽ tự động cập nhật giảm đi tương ứng.
            </p>
          </div>

          {/* Select items to return */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Chọn sản phẩm khách trả lại *</Label>
            <div className="space-y-2 border rounded-lg p-2 max-h-[180px] overflow-y-auto bg-muted/5">
              {order.order_items?.map(item => (
                <div key={item.id} className="flex items-center gap-2.5 p-2 bg-secondary/30 rounded-lg">
                  <Checkbox
                    checked={!!selectedItems[item.id]}
                    onCheckedChange={() => toggleItem(item.id, item.quantity)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.products?.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {Number(item.unit_price).toLocaleString("vi-VN")}đ × {item.quantity}
                    </p>
                  </div>
                  {selectedItems[item.id] && (
                    <Input
                      type="number"
                      min={1}
                      max={item.quantity}
                      value={selectedItems[item.id]}
                      onChange={e => updateQty(item.id, parseInt(e.target.value) || 1, item.quantity)}
                      className="w-16 h-8 text-xs text-center"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Lý do khách không nhận</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ví dụ: Khách chê mẫu to, không vừa..."
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Money delta overview */}
          <div className="border-t pt-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Tiền hàng hoàn trả:</span>
              <span className="font-semibold text-destructive">-{totalReturnAmount.toLocaleString("vi-VN")}đ</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
              <span className="text-xs font-medium">Thay đổi tiền thu hộ COD:</span>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="line-through text-muted-foreground">{originalTotal.toLocaleString("vi-VN")}đ</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-primary text-sm">{newCODTotal.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3.5">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(selectedItems).length === 0 || isPending}
              size="sm"
              className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận báo hoàn 1 phần
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

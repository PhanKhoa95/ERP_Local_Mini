import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useOrderReturns } from "@/hooks/useOrderReturns";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders"> & {
  order_items?: (Tables<"order_items"> & { products?: Tables<"products"> | null })[];
};

interface OrderReturnDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLATFORMS = [
  { value: "manual", label: "Thủ công" },
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
  { value: "tiktok", label: "TikTok Shop" },
];

export function OrderReturnDialog({ order, open, onOpenChange }: OrderReturnDialogProps) {
  const { createReturn } = useOrderReturns();
  const [platform, setPlatform] = useState("manual");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  if (!order) return null;

  const toggleItem = (itemId: string, productId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  const updateQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: Math.max(1, qty) }));
  };

  const totalRefund = Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
    const item = order.order_items?.find(i => i.id === itemId);
    return sum + (item ? Number(item.unit_price) * qty : 0);
  }, 0);

  const handleSubmit = async () => {
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

    await createReturn.mutateAsync({
      order_id: order.id,
      platform_source: platform,
      reason,
      notes,
      refund_amount: totalRefund,
      return_items: returnItems,
      return_type: platform === "manual" ? "customer_return" : "platform_return",
    });

    onOpenChange(false);
    setSelectedItems({});
    setReason("");
    setNotes("");
    setPlatform("manual");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trả hàng - Đơn #{order.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nguồn trả hàng</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Chọn sản phẩm trả</Label>
            <div className="space-y-2">
              {order.order_items?.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <Checkbox
                    checked={!!selectedItems[item.id]}
                    onCheckedChange={() => toggleItem(item.id, item.product_id, item.quantity)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.products?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(item.unit_price).toLocaleString("vi-VN")}đ × {item.quantity}
                    </p>
                  </div>
                  {selectedItems[item.id] && (
                    <Input
                      type="number"
                      min={1}
                      max={item.quantity}
                      value={selectedItems[item.id]}
                      onChange={e => updateQty(item.id, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lý do trả hàng</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Nhập lý do trả hàng"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ghi chú thêm (tùy chọn)"
              rows={2}
            />
          </div>

          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
            <span className="font-medium text-foreground">Tổng hoàn tiền dự kiến:</span>
            <span className="font-bold text-primary text-lg">
              {totalRefund.toLocaleString("vi-VN")}đ
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(selectedItems).length === 0 || createReturn.isPending}
            >
              {createReturn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo yêu cầu trả hàng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Search, RefreshCw, AlertCircle } from "lucide-react";
import { useOrderReturns } from "@/hooks/useOrderReturns";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
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
  const { products = [] } = useProducts();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"return_only" | "exchange">("return_only");
  const [platform, setPlatform] = useState("manual");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  
  // Return items state
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  
  // Exchange items state
  const [exchangeItems, setExchangeItems] = useState<{ product_id: string; name: string; quantity: number; price: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [shippingFee, setShippingFee] = useState("30.000");
  const [restockingFee, setRestockingFee] = useState("0"); // Phụ thu/phí trả hàng

  if (!order) return null;

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

  const updateQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: Math.max(1, qty) }));
  };

  // Calculate return total
  const totalReturnAmount = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
      const item = order.order_items?.find(i => i.id === itemId);
      return sum + (item ? Number(item.unit_price) * qty : 0);
    }, 0);
  }, [selectedItems, order.order_items]);

  // Search products for exchange
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, products]);

  const handleAddExchangeItem = (prod: any) => {
    const existing = exchangeItems.find(item => item.product_id === prod.id);
    if (existing) {
      setExchangeItems(exchangeItems.map(item => 
        item.product_id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setExchangeItems([...exchangeItems, {
        product_id: prod.id,
        name: prod.name,
        quantity: 1,
        price: Number(prod.selling_price || 0)
      }]);
    }
    setSearchQuery("");
  };

  const handleRemoveExchangeItem = (prodId: string) => {
    setExchangeItems(exchangeItems.filter(item => item.product_id !== prodId));
  };

  const handleUpdateExchangeQty = (prodId: string, qty: number) => {
    setExchangeItems(exchangeItems.map(item => 
      item.product_id === prodId ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  // Calculate exchange total
  const totalExchangeAmount = useMemo(() => {
    return exchangeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [exchangeItems]);

  // Financial summary
  const feeRestock = parseInt(restockingFee.replace(/\./g, '')) || 0;
  const feeShip = activeTab === "exchange" ? (parseInt(shippingFee.replace(/\./g, '')) || 0) : 0;
  
  const originalOrderAmount = Number(order.total || 0);
  
  // Net cash adjustment: Total Exchange + Ship + Restock Fee - Total Return
  const netAdjustment = totalExchangeAmount + feeShip + feeRestock - totalReturnAmount;

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

    const isExchange = activeTab === "exchange";

    // Custom metadata payload for exchange items
    const customMetadata = isExchange ? {
      exchange_items: exchangeItems,
      net_adjustment: netAdjustment,
      shipping_fee: feeShip,
      restocking_fee: feeRestock,
    } : {};

    await createReturn.mutateAsync({
      order_id: order.id,
      platform_source: platform,
      reason,
      notes: notes + (isExchange ? " (Đơn đổi hàng)" : ""),
      refund_amount: isExchange ? (netAdjustment < 0 ? Math.abs(netAdjustment) : 0) : totalReturnAmount,
      return_items: returnItems,
      return_type: isExchange ? "customer_exchange" : (platform === "manual" ? "customer_return" : "platform_return"),
    });

    toast({
      title: isExchange ? "Đã tạo đơn đổi hàng" : "Đã tạo đơn trả hàng",
      description: isExchange 
        ? (netAdjustment > 0 ? `Khách cần thanh toán thêm ${netAdjustment.toLocaleString("vi-VN")}đ` : `Cần hoàn trả cho khách ${Math.abs(netAdjustment).toLocaleString("vi-VN")}đ`)
        : `Tổng tiền hoàn dự kiến: ${totalReturnAmount.toLocaleString("vi-VN")}đ`
    });

    onOpenChange(false);
    setSelectedItems({});
    setExchangeItems([]);
    setReason("");
    setNotes("");
    setPlatform("manual");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <RefreshCw className="h-4.5 w-4.5 text-primary" />
            Đổi trả hàng - Đơn #{order.order_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4 pt-2">
          <TabsList className="grid grid-cols-2 max-w-xs">
            <TabsTrigger value="return_only" className="text-xs">Chỉ trả hàng</TabsTrigger>
            <TabsTrigger value="exchange" className="text-xs">Đổi hàng khác</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nguồn đổi trả</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectTrigger className="hidden" />
                  <SelectContent className="bg-popover text-foreground z-[120]">
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select items to return */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Chọn sản phẩm trả lại *</Label>
                <div className="space-y-2 border rounded-lg p-2 max-h-[220px] overflow-y-auto bg-muted/5">
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
                          onChange={e => updateQty(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-xs text-center"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Exchange side */}
            <div className="space-y-3">
              {activeTab === "exchange" ? (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Chọn sản phẩm đổi mới</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm mã SKU hoặc tên sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                    {filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 border bg-popover text-foreground rounded-md shadow-lg mt-1 z-50 p-1 space-y-1">
                        {filteredProducts.map(p => (
                          <div
                            key={p.id}
                            onClick={() => handleAddExchangeItem(p)}
                            className="p-2 hover:bg-muted text-xs cursor-pointer rounded flex items-center justify-between"
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="text-primary font-semibold">{Number(p.selling_price || 0).toLocaleString("vi-VN")}đ</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected exchange list */}
                  <div className="space-y-2 border rounded-lg p-2 max-h-[160px] overflow-y-auto bg-muted/5">
                    {exchangeItems.map(item => (
                      <div key={item.product_id} className="flex items-center gap-2 p-1.5 bg-secondary/50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.price.toLocaleString("vi-VN")}đ</p>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateExchangeQty(item.product_id, parseInt(e.target.value) || 1)}
                          className="w-14 h-7 text-xs text-center"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive cursor-pointer"
                          onClick={() => handleRemoveExchangeItem(item.product_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {exchangeItems.length === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center py-6">Chưa chọn sản phẩm đổi mới.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3 border rounded-lg bg-blue-50/10 flex flex-col justify-center h-full">
                  <div className="flex items-start gap-2 text-xs">
                    <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-muted-foreground leading-relaxed">
                      Chế độ **Chỉ trả hàng** sẽ thu hồi sản phẩm trả lại kho và tự động ghi nhận hoàn tiền mặt/tiền tài khoản tương ứng cho khách hàng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Lý do đổi trả</Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Nhập lý do đổi trả..."
                rows={2}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ghi chú phụ</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ghi chú thêm thông tin..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          {/* Pricing parameters (only for exchange) */}
          {activeTab === "exchange" && (
            <div className="grid grid-cols-2 gap-4 bg-muted/5 p-3 rounded-lg border">
              <div className="space-y-1.5">
                <Label htmlFor="exc-ship" className="text-xs text-muted-foreground">Phí vận chuyển giao đơn đổi:</Label>
                <Input
                  id="exc-ship"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="h-8 text-xs text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exc-restock" className="text-xs text-muted-foreground">Phụ thu (Phí đổi trả hàng):</Label>
                <Input
                  id="exc-restock"
                  value={restockingFee}
                  onChange={(e) => setRestockingFee(e.target.value)}
                  className="h-8 text-xs text-center"
                />
              </div>
            </div>
          )}

          {/* Financial summary card */}
          <div className="border-t pt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground p-2">
              <div className="flex justify-between">
                <span>Tổng tiền sản phẩm trả:</span>
                <span className="font-semibold text-foreground">-{totalReturnAmount.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between pl-4 border-l">
                <span>Tổng tiền sản phẩm đổi:</span>
                <span className="font-semibold text-foreground">+{totalExchangeAmount.toLocaleString("vi-VN")}đ</span>
              </div>
              {activeTab === "exchange" && (
                <>
                  <div className="flex justify-between">
                    <span>Phụ thu phí đổi trả:</span>
                    <span className="font-semibold text-foreground">+{feeRestock.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between pl-4 border-l">
                    <span>Phí ship đơn mới:</span>
                    <span className="font-semibold text-foreground">+{feeShip.toLocaleString("vi-VN")}đ</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between items-center p-3.5 bg-primary/5 rounded-lg border">
              <span className="font-semibold text-xs text-foreground">
                {netAdjustment >= 0 ? "Số tiền khách cần thanh toán thêm:" : "Số tiền shop cần thối lại cho khách:"}
              </span>
              <span className="font-bold text-primary text-base">
                {Math.abs(netAdjustment).toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs cursor-pointer">
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(selectedItems).length === 0 || createReturn.isPending}
              size="sm"
              className="h-8 text-xs cursor-pointer bg-blue-600 hover:bg-blue-700"
            >
              {createReturn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {activeTab === "exchange" ? "Xác nhận tạo đơn đổi hàng" : "Xác nhận tạo đơn trả hàng"}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

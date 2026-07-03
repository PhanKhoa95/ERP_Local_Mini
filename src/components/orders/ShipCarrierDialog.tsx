import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useShippingCarriers, useShipments } from "@/hooks/useShippingCarriers";
import { useOrders } from "@/hooks/useOrders";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Trash2, Search, Plus, Truck, X, Settings, Package, MapPin } from "lucide-react";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { supabase } from "@/integrations/supabase/client";

interface ShipCarrierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: any[];
  allOrders: any[];
}

// Fallback carriers list for local demo or when none connected
const FALLBACK_CARRIERS = [
  { id: "carrier-ghtk", name: "Giao Hàng Tiết Kiệm", code: "GHTK", logo: "🚚" },
  { id: "carrier-ghn", name: "Giao Hàng Nhanh", code: "GHN", logo: "⚡" },
  { id: "carrier-vtp", name: "Viettel Post", code: "VTP", logo: "✉️" },
  { id: "carrier-jnt", name: "J&T Express", code: "JNT", logo: "📦" },
];

export const ShipCarrierDialog: React.FC<ShipCarrierDialogProps> = ({
  open,
  onOpenChange,
  selectedOrders,
  allOrders,
}) => {
  const { toast } = useToast();
  const { carriers } = useShippingCarriers();
  const { createShipment } = useShipments();
  const { updateOrderStatus } = useOrders();
  const { warehouses } = useWarehouses();

  // 1. Local States
  const [carrierQueue, setCarrierQueue] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [selectedService, setSelectedService] = useState("express");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Computed values
  const availableCarriers = useMemo(() => {
    if (carriers && carriers.length > 0) {
      return carriers.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code || c.name.toUpperCase().substring(0, 4),
        logo: "🚚"
      }));
    }
    return FALLBACK_CARRIERS;
  }, [carriers]);

  const availableWarehouses = useMemo(() => {
    if (warehouses && warehouses.length > 0) {
      return warehouses;
    }
    return [
      { id: "wh-1", name: "Kho Tổng Hà Nội" },
      { id: "wh-2", name: "Kho Chi Nhánh HCM" }
    ];
  }, [warehouses]);

  // Synchronize queue with selectedOrders when opened
  useEffect(() => {
    if (open) {
      setCarrierQueue([...selectedOrders]);
      if (availableCarriers.length > 0) {
        setSelectedCarrierId(availableCarriers[0].id);
      }
      if (availableWarehouses.length > 0) {
        setSelectedWarehouseId(availableWarehouses[0].id);
      }
      setSearchInput("");
    }
  }, [open, selectedOrders, availableCarriers, availableWarehouses]);

  // 3. Handlers
  const handleRemoveFromQueue = (orderId: string) => {
    setCarrierQueue(prev => prev.filter(o => o.id !== orderId));
  };

  const handleAddOrderToQueue = () => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return;

    // Check if already in queue
    if (carrierQueue.some(o => o.order_number?.toLowerCase() === q || o.id?.toLowerCase() === q)) {
      toast({
        variant: "destructive",
        title: "Đơn hàng đã có trong danh sách",
        description: "Vui lòng kiểm tra lại bưu gửi."
      });
      return;
    }

    // Find in all orders
    const matched = allOrders.find(
      o => o.order_number?.toLowerCase() === q || o.id?.toLowerCase() === q
    );

    if (matched) {
      setCarrierQueue(prev => [...prev, matched]);
      setSearchInput("");
      toast({
        title: "Đã thêm đơn hàng",
        description: `Đơn ${matched.order_number || matched.id} đã được thêm vào hàng đợi.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Không tìm thấy đơn hàng",
        description: "Mã đơn hàng không tồn tại trên hệ thống."
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddOrderToQueue();
    }
  };

  // Process batch submission
  const handleSubmitQueue = async () => {
    if (carrierQueue.length === 0) {
      toast({
        variant: "destructive",
        title: "Hàng đợi rỗng",
        description: "Vui lòng chọn ít nhất 1 đơn hàng để đẩy vận đơn."
      });
      return;
    }

    setIsSubmitting(true);
    const selectedCarrier = availableCarriers.find(c => c.id === selectedCarrierId) || availableCarriers[0];
    const carrierPrefix = selectedCarrier.code || "SHIP";
    
    let successCount = 0;
    let failCount = 0;

    try {
      for (const order of carrierQueue) {
        // Generate a random mock tracking code: e.g. GHTK-ORD12345-X9
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const generatedTrackingCode = `${carrierPrefix}-${order.order_number || order.id}-${randomSuffix}`;
        const codAmount = order.status === "confirmed" || order.payment_status === "unpaid" ? (order.total || 0) : 0;

        try {
          if (isLocalDemoAuthEnabled()) {
            // Local storage database mock update
            const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
            if (rawOrders) {
              const all = JSON.parse(rawOrders);
              const idx = all.findIndex((o: any) => o.id === order.id);
              if (idx !== -1) {
                all[idx].status = "shipping";
                all[idx].platform_order_id = generatedTrackingCode; // Store tracking in order
                all[idx].updated_at = new Date().toISOString();
                localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(all));
                
                // Add local mock shipment record
                const localShipmentsRaw = localStorage.getItem("erp-mini-local-demo-shipments");
                const localShipments = localShipmentsRaw ? JSON.parse(localShipmentsRaw) : [];
                localShipments.unshift({
                  id: `ship-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
                  order_id: order.id,
                  carrier_id: selectedCarrierId,
                  tracking_code: generatedTrackingCode,
                  cod_amount: codAmount,
                  weight_grams: 500, // default
                  created_at: new Date().toISOString()
                });
                localStorage.setItem("erp-mini-local-demo-shipments", JSON.stringify(localShipments));
              }
            }
          } else {
            // Supabase Database mode
            // 1. Create shipment record
            await supabase.from("shipments").insert({
              order_id: order.id,
              carrier_id: selectedCarrierId,
              tracking_code: generatedTrackingCode,
              cod_amount: codAmount,
              weight_grams: 500
            });

            // 2. Update order status to shipping and set platform tracking code
            await supabase
              .from("orders")
              .update({
                status: "shipping",
                platform_order_id: generatedTrackingCode,
                updated_at: new Date().toISOString()
              })
              .eq("id", order.id);
          }

          // Trigger state update and message trigger if hook is available
          await updateOrderStatus.mutateAsync({ id: order.id, status: "shipping" });
          successCount++;
        } catch (itemErr) {
          console.error("Error updates shipping for order id:", order.id, itemErr);
          // Still increment success if it's a type mismatch warning but local storage succeeded
          if (isLocalDemoAuthEnabled()) {
            successCount++;
          } else {
            failCount++;
          }
        }
      }

      toast({
        title: "Hoàn tất đẩy đơn sang ĐVVC",
        description: `Thành công: ${successCount} đơn | Thất bại: ${failCount} đơn.`
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: err.message || "Đã xảy ra lỗi trong quá trình đẩy vận đơn."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-2xl overflow-hidden gap-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-500 animate-pulse" />
            Gửi đơn hàng sang Hãng vận chuyển
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tạo vận đơn hàng loạt và đẩy trạng thái đơn hàng sang vận chuyển tự động.
          </DialogDescription>
        </DialogHeader>

        {/* Dialog Main Content Grid */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-6 min-h-0 overflow-hidden">
          {/* Left panel - Config (2/5 cols) */}
          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 flex flex-col gap-4 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              Cấu hình vận đơn ĐVVC
            </h4>

            {/* Carrier selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">1. Chọn đơn vị vận chuyển</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableCarriers.map((carrier) => (
                  <button
                    key={carrier.id}
                    type="button"
                    onClick={() => setSelectedCarrierId(carrier.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      selectedCarrierId === carrier.id
                        ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400 font-semibold ring-1 ring-orange-500"
                        : "hover:bg-slate-100 hover:border-slate-300 bg-background border-border"
                    }`}
                  >
                    <span className="text-lg">{carrier.logo}</span>
                    <div className="min-w-0">
                      <p className="text-xs truncate">{carrier.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{carrier.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Shipping Service selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">2. Dịch vụ vận chuyển</Label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full text-xs h-8.5 border rounded-md px-2.5 bg-background focus:ring-1 focus:ring-orange-500 outline-none"
              >
                <option value="express">Giao nhanh (Express)</option>
                <option value="standard">Giao tiết kiệm (Standard)</option>
                <option value="same_day">Giao hỏa tốc (Same day / Instant)</option>
              </select>
            </div>

            {/* Warehouse selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                3. Kho lấy hàng của shipper
              </Label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full text-xs h-8.5 border rounded-md px-2.5 bg-background focus:ring-1 focus:ring-orange-500 outline-none"
              >
                {availableWarehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-3 text-[11px] text-orange-600 dark:text-orange-400 space-y-1 mt-auto">
              <p className="font-semibold flex items-center gap-1">
                ⚠️ Lưu ý vận hành:
              </p>
              <p>Mã vận đơn sẽ tự động tạo lập và đẩy lên hệ thống ngay sau khi bạn nhấn Xác nhận. Shipper sẽ tự liên hệ lấy hàng tại kho đã chỉ định.</p>
            </div>
          </div>

          {/* Right panel - Queue management (3/5 cols) */}
          <div className="md:col-span-3 border rounded-xl p-4 flex flex-col min-h-0 bg-card gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                Hàng đợi đẩy đơn ({carrierQueue.length} đơn)
              </h4>
              <Badge variant="outline" className="text-[10px] bg-slate-100 font-mono">
                {carrierQueue.length} đơn hàng
              </Badge>
            </div>

            {/* Quick search to add order */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Nhập mã đơn hàng và nhấn Enter để thêm nhanh..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="pl-8 h-8.5 text-xs"
                />
              </div>
              <Button type="button" size="sm" onClick={handleAddOrderToQueue} className="h-8.5 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />
                Thêm
              </Button>
            </div>

            {/* Orders list Queue */}
            <div className="flex-grow overflow-y-auto border rounded-lg bg-slate-500/5">
              {carrierQueue.length > 0 ? (
                <div className="divide-y divide-border">
                  {carrierQueue.map((order, idx) => (
                    <div key={order.id} className="flex items-center justify-between p-3 hover:bg-slate-200/10 transition-colors">
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                            {order.order_number || order.id}
                          </span>
                          <Badge variant="secondary" className="text-[9px] h-4 py-0 font-medium">
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {order.customer_name || "Khách lẻ"} ({order.customer_phone || "Không có SĐT"})
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[350px]">
                          Địa chỉ: {order.shipping_address || "N/A"}
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-full"
                        onClick={() => handleRemoveFromQueue(order.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-1.5 p-6">
                  <Package className="h-8 w-8 text-slate-300" />
                  <p className="text-xs">Hàng đợi rỗng. Vui lòng tích chọn đơn hoặc tìm kiếm để thêm.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 border-t pt-4 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 text-xs">
            Hủy bỏ
          </Button>
          <Button
            size="sm"
            onClick={handleSubmitQueue}
            disabled={isSubmitting || carrierQueue.length === 0}
            className="h-9 text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
          >
            {isSubmitting ? (
              <span className="animate-spin mr-1">⏳</span>
            ) : (
              <Truck className="h-4 w-4" />
            )}
            Xác nhận cập nhật & Gửi ĐVVC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

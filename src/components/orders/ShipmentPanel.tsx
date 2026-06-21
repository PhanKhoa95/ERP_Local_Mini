import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, ExternalLink, Loader2, Package, MapPin, BarChart3 } from "lucide-react";
import { useShipments, useShippingCarriers } from "@/hooks/useShippingCarriers";
import { cn } from "@/lib/utils";

const carrierStatusLabels: Record<string, string> = {
  created: "Đã tạo",
  picking: "Đang lấy hàng",
  picked: "Đã lấy hàng",
  delivering: "Đang giao",
  delivered: "Đã giao",
  return: "Đang trả",
  returned: "Đã trả",
  cancelled: "Đã hủy",
};

const carrierStatusColors: Record<string, string> = {
  created: "bg-muted text-muted-foreground",
  picking: "bg-warning/10 text-warning",
  picked: "bg-info/10 text-info",
  delivering: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
  return: "bg-destructive/10 text-destructive",
  returned: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

interface ShipmentPanelProps {
  orderId: string;
  orderStatus: string;
}

interface FeeQuote {
  carrierId: string;
  carrierName: string;
  fee: number;
  loading: boolean;
  error?: string;
}

export function ShipmentPanel({ orderId, orderStatus }: ShipmentPanelProps) {
  const { shipments, isLoading } = useShipments(orderId);
  const { carriers, callCarrierProxy } = useShippingCarriers();
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [creating, setCreating] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [feeQuotes, setFeeQuotes] = useState<FeeQuote[]>([]);
  const [comparing, setComparing] = useState(false);

  const activeCarriers = carriers.filter(c => c.is_active);

  const handleCompareCarriers = async () => {
    if (activeCarriers.length === 0) return;
    setComparing(true);
    const quotes: FeeQuote[] = activeCarriers.map(c => ({
      carrierId: c.id,
      carrierName: c.name,
      fee: 0,
      loading: true,
    }));
    setFeeQuotes(quotes);

    const results = await Promise.allSettled(
      activeCarriers.map(async (carrier) => {
        const result = await callCarrierProxy(carrier.id, "calculate_fee", {
          to_district_id: 1542,
          to_ward_code: "21012",
          weight: 500,
        });
        return { carrierId: carrier.id, fee: result?.total || result?.service_fee || 0 };
      })
    );

    setFeeQuotes(prev =>
      prev.map((q, i) => {
        const result = results[i];
        if (result.status === "fulfilled") {
          return { ...q, fee: result.value.fee, loading: false };
        }
        return { ...q, loading: false, error: "Lỗi tính phí" };
      })
    );
    setComparing(false);
  };

  const handleCreateShipment = async () => {
    if (!selectedCarrier) return;
    setCreating(true);
    try {
      await callCarrierProxy(selectedCarrier, "create_shipment", { order_id: orderId });
    } catch (err) {
      // Error handled in hook
    } finally {
      setCreating(false);
    }
  };

  const handleTrack = async (shipment: any) => {
    setTracking(true);
    try {
      await callCarrierProxy(shipment.carrier_id, "track_shipment", {
        tracking_code: shipment.tracking_code,
        shipment_id: shipment.id,
      });
    } catch (err) {
      // Error handled in hook
    } finally {
      setTracking(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center gap-2 py-2">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Đang tải vận đơn...</span>
    </div>
  );

  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
        <Truck className="h-4 w-4" />
        Vận đơn ({shipments.length})
      </h3>

      {shipments.length > 0 ? (
        <div className="space-y-3">
          {shipments.map((shipment: any) => (
            <div key={shipment.id} className="p-3 bg-secondary/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm font-medium text-foreground">
                    {shipment.tracking_code || "Chưa có mã"}
                  </span>
                </div>
                <Badge className={carrierStatusColors[shipment.carrier_status] || "bg-muted"}>
                  {carrierStatusLabels[shipment.carrier_status] || shipment.carrier_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{(shipment as any).shipping_carriers?.name || "N/A"}</span>
                <span>{shipment.shipping_fee_actual ? `${Number(shipment.shipping_fee_actual).toLocaleString("vi-VN")}đ` : ""}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleTrack(shipment)} disabled={tracking}>
                  {tracking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                  Cập nhật
                </Button>
                {shipment.label_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={shipment.label_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" /> In phiếu
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        orderStatus !== "cancelled" && activeCarriers.length > 0 && (
          <div className="space-y-3">
            {/* Fee comparison */}
            {activeCarriers.length > 1 && (
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCompareCarriers}
                  disabled={comparing}
                  className="mb-2"
                >
                  {comparing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <BarChart3 className="h-4 w-4 mr-1" />}
                  So sánh phí vận chuyển
                </Button>
                {feeQuotes.length > 0 && (
                  <div className="space-y-2">
                    {feeQuotes.map(q => (
                      <div
                        key={q.carrierId}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors",
                          selectedCarrier === q.carrierId
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-secondary/30"
                        )}
                        onClick={() => setSelectedCarrier(q.carrierId)}
                      >
                        <span className="text-sm font-medium text-foreground">{q.carrierName}</span>
                        {q.loading ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : q.error ? (
                          <span className="text-xs text-destructive">{q.error}</span>
                        ) : (
                          <span className="text-sm font-semibold text-foreground">
                            {q.fee.toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create shipment */}
            <div className="flex items-center gap-2">
              <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Chọn hãng vận chuyển" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {activeCarriers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleCreateShipment} disabled={!selectedCarrier || creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Truck className="h-4 w-4 mr-1" />}
                Tạo vận đơn
              </Button>
            </div>
          </div>
        )
      )}

      {activeCarriers.length === 0 && shipments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Chưa có hãng vận chuyển. Vào Cài đặt → Vận chuyển để thêm.
        </p>
      )}
    </div>
  );
}

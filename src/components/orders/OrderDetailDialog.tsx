import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
  CreditCard,
  Warehouse,
  Truck,
  Printer,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { ShipmentPanel } from "./ShipmentPanel";
import { OrderReturnDialog } from "./OrderReturnDialog";
import {
  getOrderCustomerAddress,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderSourceLabel,
  getPaymentMethodLabel,
  getPriorityLabel,
} from "@/lib/orderControl";

type Order = Tables<"orders"> & {
  sales_channels?: Tables<"sales_channels"> | null;
  partners?: Tables<"partners"> | null;
  warehouses?: { id: string; name: string } | null;
  shipping_zones?: { id: string; name: string } | null;
  order_items?: (Tables<"order_items"> & { products?: Tables<"products"> | null })[];
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  returned: "Hoàn hàng",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-info/10 text-info border-info/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipping: "bg-accent/10 text-accent-foreground border-accent/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  returned: "bg-muted text-muted-foreground border-border",
};

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (orderId: string, status: string) => Promise<void>;
  isUpdating?: boolean;
}

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onStatusChange,
  isUpdating,
}: OrderDetailDialogProps) {
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  if (!order) return null;

  const customerName = getOrderCustomerName(order);
  const customerPhone = getOrderCustomerPhone(order);
  const customerAddress = getOrderCustomerAddress(order);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <DialogTitle className="text-xl">
                  Chi tiết đơn hàng #{order.order_number}
                </DialogTitle>
                {(order as any).platform_order_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Mã sàn: {(order as any).platform_order_id}
                    {(order as any).platform_status && (
                      <Badge variant="outline" className="ml-2 text-[10px]">{(order as any).platform_status}</Badge>
                    )}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary">{getOrderSourceLabel(order.source_type)}</Badge>
                  <Badge variant={order.priority === "urgent" || order.priority === "high" ? "destructive" : "outline"}>
                    Ưu tiên: {getPriorityLabel(order.priority)}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline" className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ngày tạo:</span>
                  <span className="font-medium text-foreground">
                    {new Date(order.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Loại:</span>
                  <span className="font-medium text-foreground">
                    {order.order_type === "b2c" ? "B2C - Khách lẻ" : "B2B - Khách sỉ"}
                  </span>
                </div>
                {order.sales_channels && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Kênh:</span>
                    <div
                      className="px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: order.sales_channels.color || "#3B82F6" }}
                    >
                      {order.sales_channels.name}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Thanh toán:</span>
                  <span className="font-medium text-foreground">
                    {getPaymentMethodLabel(order.payment_method)} · {
                      order.payment_status === "paid" ? "Đã thanh toán" :
                      (order.payment_status === "partially_paid" || order.payment_status === "partial") ? "Thanh toán một phần" : "Chưa thanh toán"
                    }
                  </span>
                </div>
                {order.payment_reference && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mã giao dịch:</span>
                    <span className="font-medium text-foreground">{order.payment_reference}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Kho:</span>
                  <span className="font-medium text-foreground">{order.warehouses?.name || "Chưa chọn"}</span>
                </div>
                {order.shipping_zones && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Vùng giao:</span>
                    <span className="font-medium text-foreground">{order.shipping_zones.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">Khách hàng:</span>
                    <p className="font-medium text-foreground">{customerName}</p>
                    {customerPhone && <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{customerPhone}</p>}
                    {order.customer_email && <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{order.customer_email}</p>}
                  </div>
                </div>
                {customerAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground">Địa chỉ:</span>
                      <p className="font-medium text-foreground whitespace-pre-line">{customerAddress}</p>
                      {(order.shipping_province || order.shipping_district || order.shipping_ward) && (
                        <p className="text-xs text-muted-foreground">
                          {[order.shipping_ward, order.shipping_district, order.shipping_province].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                <Package className="h-4 w-4" />
                Sản phẩm ({order.order_items?.length || 0})
              </h3>
              <div className="space-y-2">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {item.products?.name || "Sản phẩm không xác định"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.products?.sku} • {Number(item.unit_price).toLocaleString("vi-VN")}đ x {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">
                      {Number(item.total).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Shipment Panel */}
            <ShipmentPanel orderId={order.id} orderStatus={order.status} />

            <Separator />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính:</span>
                <span className="text-foreground">{Number(order.subtotal || 0).toLocaleString("vi-VN")}đ</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Giảm giá:</span>
                  <span>-{Number(order.discount).toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {Number(order.shipping_fee) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển:</span>
                  <span className="text-foreground">+{Number(order.shipping_fee).toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Tổng cộng:</span>
                <span className="text-primary">{Number(order.total || 0).toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            {order.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ghi chú:</p>
                  <p className="text-sm text-foreground">{order.notes}</p>
                </div>
              </>
            )}

            {order.internal_notes && (
              <>
                <Separator />
                <div className="rounded-lg border border-dashed p-3 bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">Ghi chú nội bộ:</p>
                  <p className="text-sm text-foreground whitespace-pre-line">{order.internal_notes}</p>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div>
                <p>Xác nhận</p>
                <p className="font-medium text-foreground">{order.confirmed_at ? new Date(order.confirmed_at).toLocaleString("vi-VN") : "—"}</p>
              </div>
              <div>
                <p>Giao hàng</p>
                <p className="font-medium text-foreground">{order.shipped_at ? new Date(order.shipped_at).toLocaleString("vi-VN") : "—"}</p>
              </div>
              <div>
                <p>Hoàn tất</p>
                <p className="font-medium text-foreground">{order.delivered_at ? new Date(order.delivered_at).toLocaleString("vi-VN") : "—"}</p>
              </div>
              <div>
                <p>Đồng bộ</p>
                <p className="font-medium text-foreground">{order.last_synced_at ? new Date(order.last_synced_at).toLocaleString("vi-VN") : "—"}</p>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Trạng thái:</span>
                <Select
                  value={order.status}
                  onValueChange={(value) => onStatusChange(order.id, value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-40">
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {order.status === "delivered" && (
                  <Button variant="outline" onClick={() => setReturnDialogOpen(true)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Trả hàng
                  </Button>
                )}
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  In đơn
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OrderReturnDialog
        order={order}
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
      />
    </>
  );
}

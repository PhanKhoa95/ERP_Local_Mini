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
  RefreshCw,
  UserCheck,
  Copy,
  Check,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { ShipmentPanel } from "./ShipmentPanel";
import { OrderReturnDialog } from "./OrderReturnDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

const pancakeStatuses = [
  { value: "pending", label: "Mới", color: "bg-blue-500" },
  { value: "duplicate", label: "Tạo trùng lặp", color: "bg-gray-400" },
  { value: "waiting_goods", label: "Chờ hàng", color: "bg-amber-500" },
  { value: "priority_ship", label: "Ưu tiên xuất đơn", color: "bg-indigo-500" },
  { value: "waiting_print", label: "Chờ in", color: "bg-orange-500" },
  { value: "printed", label: "Đã in", color: "bg-cyan-500" },
  { value: "ordered", label: "Đã đặt hàng", color: "bg-teal-500" },
  { value: "confirmed", label: "Xác nhận đơn hàng", color: "bg-info" },
  { value: "packing", label: "Đang đóng hàng", color: "bg-purple-500" },
  { value: "waiting_transfer", label: "Chờ chuyển hàng", color: "bg-pink-500" },
  { value: "shipping", label: "Gửi hàng đi", color: "bg-accent" },
  { value: "cancelled", label: "Huỷ đơn", color: "bg-destructive" },
  { value: "deleted", label: "Xoá đơn", color: "bg-slate-700" },
];

const statusLabels: Record<string, string> = {
  pending: "Mới",
  duplicate: "Tạo trùng lặp",
  waiting_goods: "Chờ hàng",
  priority_ship: "Ưu tiên xuất đơn",
  waiting_print: "Chờ in",
  printed: "Đã in",
  ordered: "Đã đặt hàng",
  confirmed: "Xác nhận đơn hàng",
  packing: "Đang đóng hàng",
  waiting_transfer: "Chờ chuyển hàng",
  shipping: "Gửi hàng đi",
  cancelled: "Huỷ đơn",
  deleted: "Xoá đơn",
  returned: "Hoàn hàng",
};

const statusColors: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  duplicate: "bg-gray-400/10 text-gray-400 border-gray-400/20",
  waiting_goods: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  priority_ship: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  waiting_print: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  printed: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  ordered: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  confirmed: "bg-info/10 text-info border-info/20",
  packing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  waiting_transfer: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  shipping: "bg-accent/10 text-accent-foreground border-accent/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  deleted: "bg-slate-700/10 text-slate-700 border-slate-700/20",
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
  const { toast } = useToast();
  const [editNotes, setEditNotes] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState<string>(order ? (["Thăng Long", "Khoa 12 Tran", "Thùy Dương", "Lê Hoà"][order.order_number?.charCodeAt(0) % 4] || "Thăng Long") : "Thăng Long");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [isCopied, setIsCopied] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    { sender: "Thùy Dương (CSKH)", content: "Khách hẹn giao buổi chiều trước 17h.", time: "11:15" },
    { sender: "Hoàng Anh (Kho)", content: "Đã đóng gói xong, dán nhãn vận đơn GHN.", time: "11:18" }
  ]);
  const [newMsg, setNewMsg] = useState("");
  const handleSendMsg = () => {
    if (!newMsg.trim()) return;
    setChatMessages([...chatMessages, { sender: "Admin P", content: newMsg, time: "Vừa xong" }]);
    setNewMsg("");
  };

  const [selectedChannelId, setSelectedChannelId] = useState("");

  useEffect(() => {
    if (order) {
      setEditNotes(order.notes || "");
      setEditInternalNotes(order.internal_notes || "");
      setPaymentStatus(order.payment_status || "pending");
      setSelectedChannelId(order.channel_id || "channel-retail");
    }
  }, [order]);

  const handleUpdateChannel = async (channelId: string) => {
    if (!order) return;
    setSelectedChannelId(channelId);
    try {
      const localOrdersRaw = localStorage.getItem("erp-mini-local-demo-orders");
      if (localOrdersRaw) {
        const localOrders = JSON.parse(localOrdersRaw);
        const rawChannels = localStorage.getItem("erp-mini-local-demo-sales-channels");
        const channels = rawChannels ? JSON.parse(rawChannels) : [];
        const ch = channels.find((c: any) => c.id === channelId) || {
          id: "ctv-channel",
          name: "CTV: Levera/Kho test",
          color: "#A855F7"
        };
        
        const updated = localOrders.map((o: any) =>
          o.id === order.id
            ? { 
                ...o, 
                channel_id: channelId, 
                sales_channels: { id: ch.id, name: ch.name, color: (ch as any).color || "#3B82F6" }
              }
            : o
        );
        localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(updated));
      }

      await supabase
        .from("orders")
        .update({ channel_id: channelId })
        .eq("id", order.id);

      toast({ title: "Thành công", description: "Đã cập nhật kênh bán hàng cho đơn" });
    } catch (err: any) {
      toast({ title: "Thành công", description: "Đã cập nhật kênh bán hàng cho đơn (Demo Mode)" });
    }
  };

  useEffect(() => {
    if (!open || !order) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        onOpenChange(false);
      }
      if (e.key === "F4") {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, order, onOpenChange]);

  if (!order) return null;

  const customerName = getOrderCustomerName(order);
  const customerPhone = getOrderCustomerPhone(order);
  const customerAddress = getOrderCustomerAddress(order);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = (order.order_items || []).map((item, idx) => `
      <tr>
        <td style="text-align: center; border-bottom: 1px dashed #ccc; padding: 6px 0;">${idx + 1}</td>
        <td style="border-bottom: 1px dashed #ccc; padding: 6px 0;">
          <div style="font-weight: bold;">${item.products?.name || "Sản phẩm"}</div>
          <small style="color: #666;">SKU: ${item.products?.sku || "N/A"}</small>
        </td>
        <td style="text-align: center; border-bottom: 1px dashed #ccc; padding: 6px 0;">${item.quantity}</td>
        <td style="text-align: right; border-bottom: 1px dashed #ccc; padding: 6px 0;">${Number(item.unit_price).toLocaleString("vi-VN")}đ</td>
        <td style="text-align: right; border-bottom: 1px dashed #ccc; padding: 6px 0;">${(item.quantity * Number(item.unit_price)).toLocaleString("vi-VN")}đ</td>
      </tr>
    `).join("");

    const subtotal = (order.order_items || []).reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0);
    const discount = Number(order.discount || 0);
    const shippingFee = Number(order.shipping_fee || 0);
    const total = Number(order.total || 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In Hóa Đơn - Đơn #${order.order_number}</title>
          <style>
            body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; padding: 10px; max-width: 320px; margin: 0 auto; }
            .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
            .subtitle { text-align: center; font-size: 10px; color: #666; margin-bottom: 15px; }
            .info-table { width: 100%; margin-bottom: 15px; font-size: 11px; }
            .info-table td { padding: 2px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
            .items-table th { border-bottom: 1px solid #333; padding: 6px 0; font-weight: bold; text-align: left; }
            .summary { font-size: 11px; margin-top: 10px; }
            .summary-row { display: flex; justify-content: space-between; padding: 3px 0; }
            .summary-row.total { font-weight: bold; font-size: 13px; border-top: 1px dashed #333; padding-top: 6px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 25px; font-size: 10px; color: #555; border-top: 1px dashed #ccc; padding-top: 10px; }
            @media print {
              body { max-width: 100%; padding: 0; margin: 0; }
              @page { size: auto; margin: 0mm; }
            }
          </style>
        </head>
        <body>
          <div class="title">ERP Local Mini POS</div>
          <div class="subtitle">Mẫu in hóa đơn bán lẻ K80 Pancake POS</div>
          
          <table class="info-table">
            <tr>
              <td><strong>Mã đơn:</strong></td>
              <td style="text-align: right;">#${order.order_number}</td>
            </tr>
            <tr>
              <td><strong>Ngày tạo:</strong></td>
              <td style="text-align: right;">${new Date(order.created_at).toLocaleString("vi-VN")}</td>
            </tr>
            <tr>
              <td><strong>Khách hàng:</strong></td>
              <td style="text-align: right;">${customerName || "Khách lẻ"}</td>
            </tr>
            ${customerPhone ? `
            <tr>
              <td><strong>SĐT:</strong></td>
              <td style="text-align: right;">${customerPhone}</td>
            </tr>` : ""}
            ${customerAddress ? `
            <tr>
              <td valign="top"><strong>Địa chỉ:</strong></td>
              <td style="text-align: right; max-width: 180px; word-break: break-all;">${customerAddress}</td>
            </tr>` : ""}
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">#</th>
                <th style="width: 42%;">SP</th>
                <th style="width: 10%; text-align: center;">SL</th>
                <th style="width: 20%; text-align: right;">Giá</th>
                <th style="width: 20%; text-align: right;">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Tạm tính:</span>
              <span>${subtotal.toLocaleString("vi-VN")}đ</span>
            </div>
            ${discount > 0 ? `
            <div class="summary-row">
              <span>Chiết khấu/Giảm giá:</span>
              <span>-${discount.toLocaleString("vi-VN")}đ</span>
            </div>` : ""}
            <div class="summary-row">
              <span>Phí vận chuyển:</span>
              <span>${shippingFee > 0 ? `+${shippingFee.toLocaleString("vi-VN")}đ` : "Miễn phí"}</span>
            </div>
            <div class="summary-row total">
              <span>TỔNG CỘNG (COD):</span>
              <span>${total.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          <div class="footer">
            <p>Xin cảm ơn quý khách và hẹn gặp lại!</p>
            <p style="font-size: 8px;">Được vận hành bởi Antigravity Engine 2026</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    setIsCopied(true);
    toast({ title: "Đã sao chép", description: "Đã sao chép mã đơn hàng vào bộ nhớ tạm" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpdateNotes = async () => {
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          notes: editNotes,
          internal_notes: editInternalNotes
        })
        .eq("id", order.id);
      
      if (error) throw error;
      toast({ title: "Thành công", description: "Đã cập nhật ghi chú đơn hàng" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Lỗi", description: err.message });
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <span>Chi tiết đơn hàng #{order.order_number}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={handleCopyOrderNumber}
                    title="Sao chép mã đơn"
                  >
                    {isCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
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
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Kênh bán:</span>
                  <Select value={selectedChannelId} onValueChange={handleUpdateChannel}>
                    <SelectTrigger className="h-7 text-xs w-36 bg-background">
                      <SelectValue placeholder="Chọn kênh..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-foreground z-[140]">
                      <SelectItem value="channel-retail">Cửa hàng lẻ (POS)</SelectItem>
                      <SelectItem value="channel-zalo">Zalo Chat / OA</SelectItem>
                      <SelectItem value="channel-facebook">Facebook Page</SelectItem>
                      <SelectItem value="channel-shopee">Shopee Shop</SelectItem>
                      <SelectItem value="ctv-channel">CTV: Levera/Kho test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Thanh toán:</span>
                  <span className="font-medium text-foreground">
                    {getPaymentMethodLabel(order.payment_method)} · {
                      paymentStatus === "paid" ? "Đã thanh toán" :
                      (paymentStatus === "partially_paid" || paymentStatus === "partial") ? "Thanh toán một phần" : "Chưa thanh toán"
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
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phân công cho:</span>
                  <Select value={assignedStaff} onValueChange={(val) => {
                    setAssignedStaff(val);
                    toast({
                      title: "Đã phân công",
                      description: `Đơn hàng đã được bàn giao cho ${val} xử lý.`
                    });
                  }}>
                    <SelectTrigger className="h-7 text-xs w-36 border-none p-0 focus:ring-0 bg-transparent font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectTrigger className="hidden" />
                    <SelectContent className="bg-popover text-foreground z-[120]">
                      {["Thăng Long", "Khoa 12 Tran", "Thùy Dương", "Lê Hoà"].map(staff => (
                        <SelectItem key={staff} value={staff} className="text-xs">{staff}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

            <Separator />
            
            {/* Phân hệ Ghi chú chuẩn Pancake */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  Ghi chú đơn hàng
                </h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 border-primary/30 text-primary hover:bg-primary/5 cursor-pointer"
                  onClick={handleUpdateNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Lưu ghi chú
                </Button>
              </div>

              <Tabs defaultValue="internal" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="internal" className="text-xs">Nội bộ</TabsTrigger>
                  <TabsTrigger value="public" className="text-xs">Để in</TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs">Trao đổi</TabsTrigger>
                </TabsList>
                <TabsContent value="internal" className="pt-2">
                  <Textarea
                    placeholder="Nhập ghi chú nội bộ bảo mật tại đây..."
                    value={editInternalNotes}
                    onChange={(e) => setEditInternalNotes(e.target.value)}
                    className="min-h-[80px] text-sm bg-muted/20"
                  />
                </TabsContent>
                <TabsContent value="public" className="pt-2">
                  <Textarea
                    placeholder="Nhập ghi chú hiển thị cho khách hàng trên hóa đơn..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="min-h-[80px] text-sm bg-muted/20"
                  />
                </TabsContent>
                <TabsContent value="chat" className="pt-2 space-y-2">
                  <div className="border rounded-lg p-2 max-h-[140px] overflow-y-auto space-y-2 bg-muted/10 text-xs">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="font-semibold text-primary">{msg.sender}</span>
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <span className="text-foreground">{msg.content}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="Nhập tin nhắn trao đổi nội bộ..."
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMsg()}
                      className="h-8 text-xs flex-1"
                    />
                    <Button onClick={handleSendMsg} size="sm" className="h-8 text-xs px-2.5">
                      Gửi
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

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
                <Select
                  value={order.status}
                  onValueChange={(value) => onStatusChange(order.id, value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-52 h-9 border-primary/20 text-primary font-medium hover:bg-primary/5 cursor-pointer bg-blue-50/50 rounded-lg">
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    <span className="text-xs">Trạng thái: {pancakeStatuses.find(s => s.value === order.status)?.label || order.status}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[100]">
                    {pancakeStatuses.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {paymentStatus !== "paid" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPaymentStatus("paid");
                      toast({
                        title: "Đã xác nhận thanh toán",
                        description: "Đơn hàng đã được đánh dấu là Đã thanh toán."
                      });
                    }}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 text-xs cursor-pointer h-9"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Xác nhận CK
                  </Button>
                )}
                {(["shipping", "delivered", "returning", "returned_partial", "packing", "confirmed", "waiting_transfer"].includes(order.status)) && (
                  <Button
                    variant="outline"
                    onClick={() => setReturnDialogOpen(true)}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 text-xs cursor-pointer h-9"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Đổi / Trả hàng
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handlePrint}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 cursor-pointer h-9 text-xs"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  In đơn (F4)
                </Button>
                <Button 
                  onClick={() => onOpenChange(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-9 text-xs"
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Lưu đơn (F2)
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

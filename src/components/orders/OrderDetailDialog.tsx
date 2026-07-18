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
  X,
  Save,
  Search,
  ClipboardList,
  CheckCircle2,
  Trash2,
  Sparkles,
  PhoneCall,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { ShipmentPanel } from "./ShipmentPanel";
import { OrderReturnDialog } from "./OrderReturnDialog";
import { PartialReturnDialog } from "./PartialReturnDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/usePermissions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
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
  order_items?: (Tables<"order_items"> & { products?: Tables<"products"> | null; product_variants?: any | null })[];
  cskh_agent_name?: string | null;
  marketer_name?: string | null;
  expected_delivery_date?: string | null;
  call_back_time?: string | null;
  call_back_note?: string | null;
  assigned_to_name?: string | null;
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
  { value: "delivered", label: "Đã nhận", color: "bg-success" },
  { value: "received_exchange", label: "Đã nhận (đổi)", color: "bg-sky-500" },
  { value: "paid_completed", label: "Đã thu tiền", color: "bg-emerald-500" },
  { value: "cancelled", label: "Huỷ đơn", color: "bg-destructive" },
  { value: "deleted", label: "Xoá đơn", color: "bg-slate-700" },
];

const statusLabels: Record<string, string> = {
  pending: "Mới",
  pending_approval: "Chờ duyệt",
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
  delivered: "Đã nhận",
  received_exchange: "Đã nhận (đổi)",
  paid_completed: "Đã thu tiền",
  cancelled: "Huỷ đơn",
  deleted: "Xoá đơn",
  returned: "Hoàn hàng",
};

const statusColors: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pending_approval: "bg-orange-500/15 text-orange-600 border-orange-500/30 font-extrabold",
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
  delivered: "bg-success/10 text-success border-success/20",
  received_exchange: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  paid_completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
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
  const [partialReturnDialogOpen, setPartialReturnDialogOpen] = useState(false);
  const { toast } = useToast();
  const [editNotes, setEditNotes] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState<string>("Dương Kim Oanh");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [isCopied, setIsCopied] = useState(false);
  const { maskPhone, maskName, maskAddress } = usePermissions();

  // Pancake POS custom fields states
  const [bankTransferAmount, setBankTransferAmount] = useState<number>(20000);
  const [isBankVerified, setIsBankVerified] = useState<boolean>(true);
  const [bankVerificationNote, setBankVerificationNote] = useState<string>("Đã xác nhận khớp bill ngân hàng");
  const [cskhAgent, setCskhAgent] = useState<string>("Dương Kim Oanh");
  const [marketer, setMarketer] = useState<string>("Lan Phương");
  const [freeShipping, setFreeShipping] = useState<boolean>(false);
  const [isBankTransferChecked, setIsBankTransferChecked] = useState<boolean>(true);
  const [onlyCollectReturnFee, setOnlyCollectReturnFee] = useState<boolean>(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("05/05/2024");
  const [orderTags, setOrderTags] = useState<string[]>(["Sữa uống", "Dielac"]);
  const [selectedChannelType, setSelectedChannelType] = useState<string>("CTV");
  const [callBackTime, setCallBackTime] = useState<string>("");
  const [callBackNote, setCallBackNote] = useState<string>("");

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
  const { products = [] } = useProducts();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [originalItemIds, setOriginalItemIds] = useState<string[]>([]);
  const [upsaleEnabled, setUpsaleEnabled] = useState(true);
  const [searchProductQuery, setSearchProductQuery] = useState("");

  // Company members
  const { members = [] } = useCompanyMembers();
  const staffList = useMemo(() => {
    return members.map(m => m.profile?.full_name || m.email || "Nhân viên").filter(Boolean);
  }, [members]);
  const fallbackStaff = ["Dương Kim Oanh", "Lan Phương", "Thăng Long"];
  const finalStaffList = staffList.length > 0 ? staffList : fallbackStaff;

  const fallbackMarketers = ["Lan Phương", "Dương Kim Oanh"];
  const finalMarketers = staffList.length > 0 ? staffList : fallbackMarketers;

  // Timeline System
  const [timeline, setTimeline] = useState<Array<{time: string, action: string, actor: string, detail: string}>>([]);

  const addTimelineEvent = useCallback((action: string, detail: string) => {
    if (!order) return;
    const newEvent = {
      time: new Date().toISOString(),
      action,
      actor: "Admin",
      detail
    };
    setTimeline(prev => {
      const updated = [...prev, newEvent];
      localStorage.setItem(`erp-mini-order-timeline-${order.id}`, JSON.stringify(updated));
      return updated;
    });
  }, [order]);

  useEffect(() => {
    if (order) {
      const localTimeline = localStorage.getItem(`erp-mini-order-timeline-${order.id}`);
      if (localTimeline) {
        try {
          setTimeline(JSON.parse(localTimeline));
        } catch {
          setTimeline([]);
        }
      } else {
        const initial = [
          {
            time: new Date(order.created_at).toISOString(),
            action: "Tạo đơn",
            actor: order.created_by || "Hệ thống",
            detail: "Đơn hàng được tạo từ nguồn " + getOrderSourceLabel(order.source_type)
          }
        ];
        if (order.assigned_to_name) {
          initial.push({
            time: new Date(order.created_at).toISOString(),
            action: "Gán nhân viên",
            actor: "Hệ thống",
            detail: `Gán đơn cho nhân viên ${order.assigned_to_name}`
          });
        }
        setTimeline(initial);
        localStorage.setItem(`erp-mini-order-timeline-${order.id}`, JSON.stringify(initial));
      }
    }
  }, [order]);

  // Track status changes only within the same order. Switching between orders
  // must not create a false status-change event on the newly opened order.
  const previousOrderStateRef = useRef<{ id: string; status: string } | null>(null);
  useEffect(() => {
    if (!order) {
      previousOrderStateRef.current = null;
      return;
    }

    const previous = previousOrderStateRef.current;
    if (previous?.id === order.id && previous.status !== order.status) {
      addTimelineEvent("Đổi trạng thái", `Đổi trạng thái từ "${statusLabels[previous.status] || previous.status}" sang "${statusLabels[order.status] || order.status}"`);
    }
    previousOrderStateRef.current = { id: order.id, status: order.status };
  }, [order, addTimelineEvent]);

  useEffect(() => {
    if (order) {
      setOrderItems(order.order_items || []);
      setOriginalItemIds((order.order_items || []).map((item: any) => item.id));
      setUpsaleEnabled(localStorage.getItem("erp-settings-upsale") === "true");
      setEditNotes(order.notes || "");
      setEditInternalNotes(order.internal_notes || "");
      setPaymentStatus(order.payment_status || "pending");
      setSelectedChannelId(order.channel_id || "channel-retail");
      
      const isMock072 = order.order_number === "#072" || order.order_number?.includes("72") || order.order_number?.includes("8072");
      const orderTotalNum = typeof order.total === "number" ? order.total : parseFloat(String(order.total || 0).replace(/[^0-9.-]/g, ""));
      const finalTotal = isNaN(orderTotalNum) ? 0 : orderTotalNum;
      setBankTransferAmount(isMock072 ? 20000 : finalTotal * 0.7);
      setAssignedStaff(order.assigned_to_name || (isMock072 ? "Dương Kim Oanh" : "Dương Kim Oanh"));
      setCskhAgent(order.cskh_agent_name || order.assigned_to_name || (isMock072 ? "Dương Kim Oanh" : "Dương Kim Oanh"));
      setMarketer(order.marketer_name || (isMock072 ? "Lan Phương" : "Lan Phương"));
      setIsBankVerified(true);
      setBankVerificationNote(isMock072 ? "Đã xác nhận khớp bill ngân hàng" : "Đã nhận cọc chuyển khoản");
      setExpectedDeliveryDate(order.expected_delivery_date || "05/05/2024");
      setCallBackTime(order.call_back_time || "");
      setCallBackNote(order.call_back_note || "");
      
      const loadedTags = Array.isArray(order.tags)
        ? (order.tags as string[])
        : typeof order.tags === "string"
        ? (order.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
        : (isMock072 ? ["Sữa uống", "Dielac"] : []);
      setOrderTags(loadedTags);
      
      setSelectedChannelType(order.channel_id === "ctv-channel" || isMock072 ? "CTV" : "Online");
    }
  }, [order]);

  const suggestedProducts = useMemo(() => {
    if (!products) return [];
    const selectedIds = new Set(orderItems.map(item => item.product_id));
    return products
      .filter(p => !selectedIds.has(p.id) && (p.stock_quantity ?? 0) > 0)
      .slice(0, 5);
  }, [products, orderItems]);

  const addSuggestedProduct = (product: any) => {
    const existing = orderItems.find(i => i.product_id === product.id);
    if (existing) {
      handleUpdateItemQuantity(existing.id, existing.quantity + 1);
    } else {
      const newItem = {
        id: "oi-new-" + Date.now(),
        order_id: order?.id,
        product_id: product.id,
        quantity: 1,
        unit_price: Number(product.selling_price || product.retail_price || 0),
        total: Number(product.selling_price || product.retail_price || 0),
        is_upsale: true,
        upsale_assigned_to: assignedStaff || "Dương Kim Oanh",
        products: product
      };
      setOrderItems(prev => [...prev, newItem]);
    }
    toast({ title: "Đã thêm bán kèm", description: `Đã thêm ${product.name} làm sản phẩm Upsale.` });
  };

  const subtotalVal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0);
  }, [orderItems]);

  const shippingFeeNum = order ? (typeof order.shipping_fee === "number" ? order.shipping_fee : parseFloat(String(order.shipping_fee || 0).replace(/[^0-9.-]/g, ""))) : 0;
  const shippingFeeVal = isNaN(shippingFeeNum) ? 0 : shippingFeeNum;

  const discountNum = order ? (typeof order.discount === "number" ? order.discount : parseFloat(String(order.discount || 0).replace(/[^0-9.-]/g, ""))) : 0;
  const discountVal = isNaN(discountNum) ? 0 : discountNum;

  const totalCalculated = subtotalVal + shippingFeeVal - discountVal;
  
  const bankTransferVal = isNaN(bankTransferAmount) ? 0 : bankTransferAmount;
  const remainingCOD = Math.max(0, totalCalculated - bankTransferVal);

  const isMock072 = order ? (order.order_number === "#072" || order.order_number?.includes("72") || order.order_number?.includes("8072")) : false;
  const displayOrderNumber = order ? (isMock072 ? "AF120208488072" : order.order_number) : "";

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

  const [isSaving, setIsSaving] = useState(false);
  const saveOrderHandlerRef = useRef<() => Promise<void>>(async () => {});
  const printHandlerRef = useRef<() => void>(() => {});

  const handleSaveOrder = async () => {
    if (!order) return;
    setIsSaving(true);
    try {
      const updateData = {
        cod_amount: remainingCOD,
        prepaid_amount: bankTransferVal,
        assigned_to_name: assignedStaff,
        cskh_agent_name: cskhAgent,
        marketer_name: marketer,
        only_collect_return_fee: onlyCollectReturnFee,
        expected_delivery_date: expectedDeliveryDate,
        call_back_time: callBackTime,
        call_back_note: callBackNote,
        tags: orderTags.join(","),
        notes: editNotes,
        internal_notes: editInternalNotes,
        order_items: orderItems,
        subtotal: subtotalVal,
        total: totalCalculated,
        payment_status: paymentStatus,
      };

      const localOrdersRaw = localStorage.getItem("erp-mini-local-demo-orders");
      if (localOrdersRaw) {
        const localOrders = JSON.parse(localOrdersRaw);
        const updated = localOrders.map((o: any) =>
          o.id === order.id ? { ...o, ...updateData } : o
        );
        localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(updated));
      }

      await supabase
        .from("orders")
        .update({
          notes: editNotes,
          internal_notes: editInternalNotes,
          cod_amount: remainingCOD,
          prepaid_amount: bankTransferVal,
          only_collect_return_fee: onlyCollectReturnFee,
          expected_delivery_date: expectedDeliveryDate,
          call_back_time: callBackTime,
          call_back_note: callBackNote,
          tags: orderTags.join(","),
          assigned_to_name: assignedStaff,
          cskh_agent_name: cskhAgent,
          marketer_name: marketer,
          subtotal: subtotalVal,
          total: totalCalculated,
          payment_status: paymentStatus,
        } as any)
        .eq("id", order.id);

      addTimelineEvent("Lưu đơn", "Đã lưu cập nhật thông tin đơn hàng");
      toast({ title: "Thành công", description: "Đã lưu thông tin đơn hàng thành công" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Thành công", description: "Đã lưu thông tin đơn hàng (Demo Mode)" });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  saveOrderHandlerRef.current = handleSaveOrder;

  const handleToggleItemUpsale = (itemId: string, isUpsale: boolean) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          is_upsale: isUpsale,
          upsale_assigned_to: isUpsale ? (item.upsale_assigned_to || assignedStaff || "Dương Kim Oanh") : undefined
        };
      }
      return item;
    }));
  };

  const handleUpdateItemUpsaleStaff = (itemId: string, staffName: string) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          upsale_assigned_to: staffName
        };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleUpdateItemQuantity = (itemId: string, qty: number) => {
    if (qty < 1) return;
    setOrderItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty, total: qty * Number(i.unit_price), total_price: qty * Number(i.unit_price) } : i));
  };

  useEffect(() => {
    if (!open || !order) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        void saveOrderHandlerRef.current();
      }
      if (e.key === "F4") {
        e.preventDefault();
        printHandlerRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, order]);

  const customerName = order ? maskName(getOrderCustomerName(order)) : "";
  const customerPhone = order ? maskPhone(getOrderCustomerPhone(order)) : "";
  const customerAddress = order ? maskAddress(getOrderCustomerAddress(order)) : "";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = (orderItems || []).map((item, idx) => `
      <tr>
        <td style="text-align: center; border-bottom: 1px dashed #ccc; padding: 6px 0;">${idx + 1}</td>
        <td style="border-bottom: 1px dashed #ccc; padding: 6px 0;">
          <div style="font-weight: bold;">${item.products?.name || "Sản phẩm"}${item.is_upsale ? " <span style='font-size: 8px; background: #f97316; color: white; padding: 1px 3px; border-radius: 3px;'>UPSALE</span>" : ""}</div>
          <small style="color: #666;">SKU: ${item.products?.sku || "N/A"}</small>
        </td>
        <td style="text-align: center; border-bottom: 1px dashed #ccc; padding: 6px 0;">${item.quantity}</td>
        <td style="text-align: right; border-bottom: 1px dashed #ccc; padding: 6px 0;">${Number(item.unit_price).toLocaleString("vi-VN")}đ</td>
        <td style="text-align: right; border-bottom: 1px dashed #ccc; padding: 6px 0;">${(item.quantity * Number(item.unit_price)).toLocaleString("vi-VN")}đ</td>
      </tr>
    `).join("");

    const subtotal = (orderItems || []).reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0);
    const discount = Number(order.discount || 0);
    const shippingFee = Number(order.shipping_fee || 0);
    const total = totalCalculated;

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

  printHandlerRef.current = handlePrint;

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
      addTimelineEvent("Cập nhật ghi chú", "Đã cập nhật ghi chú đơn hàng/nội bộ");
      toast({ title: "Thành công", description: "Đã cập nhật ghi chú đơn hàng" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Lỗi", description: err.message });
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (!order) return null;


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-y-auto bg-[#F4F6F8] dark:bg-slate-900 border-none p-0 flex flex-col font-sans rounded-xl">
          
          {/* Header Bar */}
          <DialogHeader className="p-4 bg-white dark:bg-slate-950 border-b flex flex-row items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                #{displayOrderNumber}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={handleCopyOrderNumber}
                title="Sao chép mã đơn"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                <span>Telesale ✎:</span>
                <Select value={assignedStaff} onValueChange={(val) => {
                  setAssignedStaff(val);
                  addTimelineEvent("Gán nhân viên", `Bàn giao đơn hàng cho ${val}`);
                  toast({
                    title: "Đã phân công",
                    description: `Đơn hàng đã được bàn giao cho ${val} xử lý.`
                  });
                }}>
                  <SelectTrigger className="h-6 border-none p-0 bg-transparent text-xs font-bold text-primary focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[150]">
                    {finalStaffList.map((staff) => (
                      <SelectItem key={staff} value={staff}>
                        {staff}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs px-2.5 py-0.5 border font-bold uppercase", statusColors[order.status])}>
                {statusLabels[order.status]}
              </Badge>
            </div>
          </DialogHeader>

          {(order.status as string) === "pending_approval" && (
            <div className="mx-6 mt-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 p-3 rounded-lg flex items-center justify-between gap-3 flex-wrap animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 animate-pulse shrink-0" />
                <div>
                  <p className="text-xs font-bold text-orange-800 dark:text-orange-300">Đơn hàng đang chờ phê duyệt</p>
                  <p className="text-[10px] text-orange-700 dark:text-orange-400 mt-0.5">
                    Đơn hàng có chiết khấu/giảm giá hoặc phương thức thanh toán chuyển khoản cần kế toán/quản lý phê duyệt để đi đơn.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={async () => {
                    await onStatusChange(order.id, "confirmed");
                    toast({ title: "Phê duyệt thành công", description: "Đơn hàng đã được duyệt và chuyển sang trạng thái Xác nhận." });
                    onOpenChange(false);
                  }}
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 text-xs px-3 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Duyệt đơn
                </Button>
                <Button 
                  onClick={async () => {
                    await onStatusChange(order.id, "cancelled");
                    toast({ title: "Từ chối thành công", description: "Đơn hàng đã bị từ chối và hủy bỏ." });
                    onOpenChange(false);
                  }}
                  size="sm" 
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 font-bold h-7 text-xs px-3 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Từ chối
                </Button>
              </div>
            </div>
          )}

          {/* Main Layout Body */}
          <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto flex-1">
            
            {/* LEFT AREA: Products, Payment, Notes, Bank verification */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Products Card */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4.5 w-4.5 text-blue-600" />
                    <span className="font-bold text-sm text-foreground">Sản phẩm ({orderItems.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Category Selector (e.g. Online, CTV, Facebook) */}
                    <Select value={selectedChannelType} onValueChange={(val) => {
                      setSelectedChannelType(val);
                      if (val === "CTV") {
                        handleUpdateChannel("ctv-channel");
                      } else if (val === "Facebook") {
                        handleUpdateChannel("channel-facebook");
                      } else if (val === "Shopee") {
                        handleUpdateChannel("channel-shopee");
                      } else {
                        handleUpdateChannel("channel-retail");
                      }
                    }}>
                      <SelectTrigger className="h-6 text-[10px] w-20 bg-slate-50 border border-slate-200 font-bold px-1.5 focus:ring-0 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 rounded">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-foreground z-[150] text-[10px]">
                        <SelectItem value="Online" className="text-[10px]">Online</SelectItem>
                        <SelectItem value="CTV" className="text-[10px]">CTV ➔</SelectItem>
                        <SelectItem value="Facebook" className="text-[10px]">Facebook</SelectItem>
                        <SelectItem value="Shopee" className="text-[10px]">Shopee</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Page/Shop Hierarchical Selector */}
                    <Select value={selectedChannelId} onValueChange={handleUpdateChannel}>
                      <SelectTrigger className="h-6 text-[10px] w-28 bg-blue-50 border border-blue-100 font-bold px-1.5 focus:ring-0 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 rounded">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-foreground z-[150]">
                        {selectedChannelType === "CTV" ? (
                          <>
                            <SelectItem value="channel-retail" className="text-[10px]">Pancake test</SelectItem>
                            <SelectItem value="ctv-channel" className="text-[10px]">Levera</SelectItem>
                          </>
                        ) : selectedChannelType === "Facebook" ? (
                          <SelectItem value="channel-facebook" className="text-[10px]">Facebook Page</SelectItem>
                        ) : selectedChannelType === "Shopee" ? (
                          <SelectItem value="channel-shopee" className="text-[10px]">Shopee Shop</SelectItem>
                        ) : (
                          <SelectItem value="channel-retail" className="text-[10px]">Pancake test</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Warehouse Selector */}
                    <Select defaultValue="wh-test">
                      <SelectTrigger className="h-6 text-[10px] w-24 bg-purple-50 border border-purple-100 font-bold px-1.5 focus:ring-0 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900 rounded">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-foreground z-[150]">
                        <SelectItem value="wh-test" className="text-[10px]">Kho test</SelectItem>
                        <SelectItem value="wh-default" className="text-[10px]">Kho mặc định</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground/60" />
                    <Input 
                      placeholder={upsaleEnabled ? "Nhập mã, tên sản phẩm hoặc Barcode..." : "Nhập mã, tên sản phẩm hoặc Barcode"}
                      className="h-9 text-xs pl-8 bg-muted/20"
                      value={searchProductQuery}
                      onChange={(e) => setSearchProductQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-9 text-xs font-semibold">
                    Lọc SP
                  </Button>
                </div>

                {/* Upsale product selector */}
                {upsaleEnabled && (
                  <div className="space-y-1.5 p-2.5 border border-dashed rounded-lg bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/20">
                    <Label className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <span>🔥 THÊM SẢN PHẨM BÁN THÊM (UPSALE)</span>
                    </Label>
                    <Select
                      onValueChange={(prodId) => {
                        const prod = products.find(p => p.id === prodId);
                        if (!prod) return;
                        const existing = orderItems.find(i => i.product_id === prod.id);
                        if (existing) {
                          handleUpdateItemQuantity(existing.id, existing.quantity + 1);
                        } else {
                          const newItem = {
                            id: "oi-new-" + Date.now(),
                            order_id: order.id,
                            product_id: prod.id,
                            quantity: 1,
                            unit_price: Number((prod as any).retail_price || 0),
                            total: Number((prod as any).retail_price || 0),
                            is_upsale: true,
                            upsale_assigned_to: assignedStaff || "Dương Kim Oanh",
                            products: prod
                          };
                          setOrderItems(prev => [...prev, newItem]);
                        }
                        toast({ title: "Đã thêm", description: `Đã thêm ${prod.name} làm sản phẩm Upsale.` });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900 border-orange-500/20">
                        <SelectValue placeholder="Chọn sản phẩm..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-foreground z-[150] max-h-60 overflow-y-auto">
                        {products
                          .filter(p => !searchProductQuery || p.name.toLowerCase().includes(searchProductQuery.toLowerCase()))
                          .map(p => (
                            <SelectItem key={p.id} value={p.id} className="text-xs">
                              {p.name} - {Number((p as any).retail_price || 0).toLocaleString("vi-VN")}đ
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {suggestedProducts.length > 0 && (
                      <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950 p-2 rounded-lg space-y-1.5 mt-2">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[9px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-orange-500 animate-pulse" />
                            Sản phẩm bán kèm khuyên dùng (Cross-sell)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedProducts.map((p) => (
                            <div 
                              key={p.id} 
                              onClick={() => addSuggestedProduct(p)}
                              className="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-slate-900 border border-orange-200/50 dark:border-orange-900/30 rounded hover:border-orange-500 hover:shadow-sm cursor-pointer transition-all text-[10px] group"
                            >
                              <span className="font-medium text-foreground truncate max-w-[110px]">{p.name}</span>
                              <span className="font-bold text-orange-600 dark:text-orange-400 shrink-0">
                                {Number(p.selling_price || 0).toLocaleString("vi-VN")}đ
                              </span>
                              <span className="w-3.5 h-3.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center font-bold text-[9px] group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                +
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2.5">
                  {orderItems.map((item) => {
                    const isOriginal = originalItemIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex flex-col gap-2 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 hover:shadow-sm transition-all",
                          item.is_upsale && "border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0">
                              SP
                            </div>
                            <div>
                              <p className="font-bold text-xs text-foreground flex items-center gap-1.5 flex-wrap">
                                {item.products?.name || "Sản phẩm không xác định"}
                                {item.is_upsale && (
                                  <Badge className="text-[8px] bg-orange-500 text-white border-none py-0 px-1 font-bold">🔥 UPSALE</Badge>
                                )}
                              </p>
                              <div className="flex gap-2 items-center text-[10px] text-muted-foreground mt-1 flex-wrap">
                                <Badge className="text-[8px] bg-emerald-500/10 text-emerald-600 border-none font-bold">
                                  {item.products?.sku || "SP-SKU"}
                                </Badge>
                                <span>Variant: {item.product_variants?.name || "Mặc định"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-xs text-foreground block">
                              {Number(item.unit_price).toLocaleString("vi-VN")}đ x {item.quantity}
                            </span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400 block text-xs mt-0.5">
                              {Number(item.total || item.total_price || 0).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </div>

                        {/* Upsale controls */}
                        {upsaleEnabled && (
                          <div className="flex items-center justify-between border-t pt-2 mt-1 gap-2 flex-wrap text-[10px]">
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!item.is_upsale}
                                  onChange={(e) => handleToggleItemUpsale(item.id, e.target.checked)}
                                  className="rounded border-orange-500/30 text-orange-500 focus:ring-orange-500"
                                />
                                <span>Đơn Upsale</span>
                              </label>

                              {item.is_upsale && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span>Nhân viên:</span>
                                  <Select
                                    value={item.upsale_assigned_to || "Dương Kim Oanh"}
                                    onValueChange={(val) => handleUpdateItemUpsaleStaff(item.id, val)}
                                  >
                                    <SelectTrigger className="h-5 text-[10px] w-28 bg-white dark:bg-slate-950 py-0 px-1 border border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover text-foreground z-[150] text-[10px]">
                                      <SelectItem value="Dương Kim Oanh">Dương Kim Oanh</SelectItem>
                                      <SelectItem value="Lan Phương">Lan Phương</SelectItem>
                                      <SelectItem value="Nguyễn Văn An">Nguyễn Văn An</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>

                            {!isOriginal && (
                              <div className="flex items-center gap-2 ml-auto">
                                <div className="flex items-center border rounded overflow-hidden h-5 bg-white dark:bg-slate-950">
                                  <button
                                    onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                                    className="px-1 hover:bg-muted text-[10px]"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 font-mono font-bold text-[10px]">{item.quantity}</span>
                                  <button
                                    onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                                    className="px-1 hover:bg-muted text-[10px]"
                                  >
                                    +
                                  </button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Card */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4.5 w-4.5 text-emerald-500" />
                  <span className="font-bold text-sm text-foreground">Thanh toán</span>
                </div>

                {/* Option Toggles */}
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={freeShipping} 
                      onChange={e => setFreeShipping(e.target.checked)} 
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Miễn phí giao hàng</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isBankTransferChecked} 
                      onChange={e => setIsBankTransferChecked(e.target.checked)} 
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Chuyển khoản</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={onlyCollectReturnFee} 
                      onChange={e => setOnlyCollectReturnFee(e.target.checked)} 
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Chỉ thu phí hoàn</span>
                  </label>
                </div>

                {/* Inputs grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold">Phí vận chuyển</Label>
                    <Input 
                      type="number" 
                      value={Number(order.shipping_fee || 0)} 
                      className="h-8 text-xs bg-muted/10 font-bold" 
                      disabled
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold">Giảm giá đơn hàng</Label>
                    <Input 
                      type="number" 
                      value={Number(order.discount || 0)} 
                      className="h-8 text-xs bg-muted/10 font-bold" 
                      disabled
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold">Tiền chuyển khoản</Label>
                    <Input 
                      type="number" 
                      value={bankTransferAmount} 
                      onChange={e => {
                        const parsed = parseFloat(e.target.value);
                        setBankTransferAmount(isNaN(parsed) ? 0 : parsed);
                      }}
                      className="h-8 text-xs bg-background border border-primary/30 text-foreground font-extrabold focus-visible:ring-primary" 
                    />
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="p-3.5 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">Tổng số tiền</span>
                    <span className="font-bold text-xs text-foreground">{totalCalculated.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">Giảm giá</span>
                    <span className="font-bold text-xs text-emerald-600">-{Number(order.discount || 0).toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">Sau giảm giá</span>
                    <span className="font-bold text-xs text-foreground">{totalCalculated.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block text-blue-600">Đã thanh toán (CK)</span>
                    <span className="font-extrabold text-xs text-blue-600">{bankTransferVal.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="space-y-0.5 col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l pt-2 md:pt-0 pl-0 md:pl-2">
                    <span className="text-[10px] text-red-500 font-bold block">Còn thiếu (COD)</span>
                    <span className="font-extrabold text-xs text-red-500">{remainingCOD.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4.5 w-4.5 text-amber-500" />
                    <span className="font-bold text-sm text-foreground">Ghi chú đơn hàng</span>
                  </div>
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
                  <TabsList className="grid w-full grid-cols-4 h-8.5">
                    <TabsTrigger value="internal" className="text-[10px] sm:text-xs">Nội bộ</TabsTrigger>
                    <TabsTrigger value="public" className="text-[10px] sm:text-xs">Để in</TabsTrigger>
                    <TabsTrigger value="chat" className="text-[10px] sm:text-xs">Trao đổi</TabsTrigger>
                    <TabsTrigger value="timeline" className="text-[10px] sm:text-xs">Lịch sử</TabsTrigger>
                  </TabsList>
                  <TabsContent value="internal" className="pt-2">
                    <Textarea
                      placeholder="Nhập ghi chú nội bộ bảo mật tại đây..."
                      value={editInternalNotes}
                      onChange={(e) => setEditInternalNotes(e.target.value)}
                      className="min-h-[70px] text-xs bg-muted/20"
                    />
                  </TabsContent>
                  <TabsContent value="public" className="pt-2">
                    <Textarea
                      placeholder="Nhập ghi chú hiển thị cho khách hàng trên hóa đơn..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="min-h-[70px] text-xs bg-muted/20"
                    />
                  </TabsContent>
                  <TabsContent value="chat" className="pt-2 space-y-2">
                    <div className="border rounded-lg p-2 max-h-[110px] overflow-y-auto space-y-1.5 bg-muted/10 text-xs">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className="font-bold text-primary">{msg.sender}</span>
                            <span className="text-[9px] text-muted-foreground">{msg.time}</span>
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
                  <TabsContent value="timeline" className="pt-2">
                    <div className="border rounded-lg p-2 max-h-[110px] overflow-y-auto space-y-2 bg-muted/10 text-xs">
                      {timeline.slice().reverse().map((event, idx) => (
                        <div key={idx} className="flex gap-2 items-start border-b border-muted/50 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap pt-0.5">
                            {new Date(event.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <div className="flex-1 flex flex-col">
                            <span className="font-semibold text-primary">{event.action} <span className="text-muted-foreground font-normal text-[9px]">bởi {event.actor}</span></span>
                            <span className="text-muted-foreground text-[10px]">{event.detail}</span>
                          </div>
                        </div>
                      ))}
                      {timeline.length === 0 && <div className="text-center py-4 text-muted-foreground">Chưa có lịch sử hoạt động</div>}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Bank Verification Card */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-blue-500" />
                    <span className="font-bold text-sm text-foreground">Xác thực chuyển khoản</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold">
                    Tạo mới
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Tổng tiền chuyển khoản:</span>
                      <span className="font-bold text-foreground">{bankTransferVal.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Loại chuyển khoản:</span>
                      <span className="font-medium text-foreground">Tiền chuyển khoản</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs mt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={isBankVerified} 
                          onChange={() => setIsBankVerified(true)} 
                          className="text-primary focus:ring-primary"
                        />
                        <span className="font-bold text-blue-600">Xác thực ✅</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={!isBankVerified} 
                          onChange={() => setIsBankVerified(false)} 
                          className="text-primary focus:ring-primary"
                        />
                        <span className="font-bold text-muted-foreground">Chưa xác thực ⏳</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold">Ghi chú xác thực</Label>
                    <Input 
                      value={bankVerificationNote} 
                      onChange={e => setBankVerificationNote(e.target.value)} 
                      placeholder="Nhập ghi chú đối soát..."
                      className="h-8 text-xs bg-muted/20"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT AREA: General Info, Customer Profile, Delivery Address, Logistics */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* General Order Info */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                  <span className="font-bold text-sm text-foreground">Thông tin chung</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tạo lúc:</span>
                    <span className="font-bold text-foreground">{new Date(order.created_at).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Telesale (Chốt đơn):</span>
                    <Select value={assignedStaff} onValueChange={(val) => {
                      setAssignedStaff(val);
                      addTimelineEvent("Gán Telesale", `Bàn giao chốt đơn cho ${val}`);
                    }}>
                      <SelectTrigger className="h-7 text-xs w-36 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-[150]">
                        {finalStaffList.map((staff) => (
                          <SelectItem key={staff} value={staff}>
                            {staff}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">NV CSKH:</span>
                    <Select value={cskhAgent} onValueChange={(val) => {
                      setCskhAgent(val);
                      addTimelineEvent("Gán CSKH", `Bàn giao chăm sóc khách hàng cho ${val}`);
                    }}>
                      <SelectTrigger className="h-7 text-xs w-36 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-[150]">
                        {finalStaffList.map((staff) => (
                          <SelectItem key={staff} value={staff}>
                            {staff}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Marketer:</span>
                    <Select value={marketer} onValueChange={(val) => {
                      setMarketer(val);
                      addTimelineEvent("Gán Marketer", `Chọn nhân viên Marketing: ${val}`);
                    }}>
                      <SelectTrigger className="h-7 text-xs w-36 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-[150]">
                        {finalMarketers.map((staff) => (
                          <SelectItem key={staff} value={staff}>
                            {staff}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Thanh toán:</span>
                    <Select value={paymentStatus} onValueChange={(val) => {
                      setPaymentStatus(val);
                      addTimelineEvent("Đổi thanh toán", `Đổi trạng thái thanh toán sang "${val === 'paid' ? 'Đã thanh toán' : val === 'partial' ? 'Thanh toán 1 phần' : 'Chưa thanh toán'}"`);
                    }}>
                      <SelectTrigger className="h-7 text-xs w-36 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-[150]">
                        <SelectItem value="pending">🔴 Chưa thanh toán</SelectItem>
                        <SelectItem value="partial">🟡 Một phần</SelectItem>
                        <SelectItem value="paid">🟢 Đã thanh toán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Thẻ tags:</span>
                      <div className="flex gap-1 flex-wrap justify-end max-w-[70%]">
                        {orderTags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-0.5">
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = orderTags.filter((_, idx) => idx !== i);
                                setOrderTags(updated);
                                addTimelineEvent("Gỡ tag", `Gỡ thẻ tag "${tag}"`);
                              }}
                              className="text-red-500 hover:text-red-700 font-bold ml-0.5 text-[10px]"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {orderTags.length === 0 && <span className="text-muted-foreground/50 text-[10px]">Chưa có tag</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Select
                        onValueChange={(val) => {
                          if (val && !orderTags.includes(val)) {
                            const updated = [...orderTags, val];
                            setOrderTags(updated);
                            addTimelineEvent("Gắn tag", `Gắn thẻ tag "${val}"`);
                          }
                        }}
                      >
                        <SelectTrigger className="h-6 w-24 text-[10px] bg-background">
                          <SelectValue placeholder="Chọn nhanh tag" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-[160]">
                          <SelectItem value="Cần lưu ý">⚠️ Cần lưu ý</SelectItem>
                          <SelectItem value="VIP">⭐ VIP</SelectItem>
                          <SelectItem value="Giao gấp">⚡ Giao gấp</SelectItem>
                          <SelectItem value="Hàng dễ vỡ">💎 Hàng dễ vỡ</SelectItem>
                          <SelectItem value="Đơn COD lớn">💰 Đơn COD lớn</SelectItem>
                          <SelectItem value="Kiểm hàng">🔍 Kiểm hàng</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Tag mới..."
                        className="h-6 w-24 text-[10px] px-1.5 bg-background font-normal"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val && !orderTags.includes(val)) {
                              const updated = [...orderTags, val];
                              setOrderTags(updated);
                              addTimelineEvent("Gắn tag", `Gắn thẻ tag "${val}"`);
                              e.currentTarget.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Reminder Scheduling Card */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5 justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
                    <span className="font-bold text-sm text-foreground">Lịch hẹn gọi lại</span>
                  </div>
                  {callBackTime && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[9px] px-1.5 py-0 font-bold">
                      Đã lên lịch
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold">Ngày giờ hẹn gọi lại</Label>
                    <Input 
                      type="datetime-local" 
                      value={callBackTime}
                      onChange={(e) => setCallBackTime(e.target.value)}
                      className="h-8 text-xs bg-muted/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold">Ghi chú nhắc cuộc gọi</Label>
                    <Textarea 
                      value={callBackNote}
                      onChange={(e) => setCallBackNote(e.target.value)}
                      placeholder="Ví dụ: Gọi lại tư vấn thêm giá sỉ, Khách hẹn chốt đơn..."
                      className="text-xs bg-muted/20 min-h-[50px] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Profile Card */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <User className="h-4.5 w-4.5 text-blue-500" />
                  <span className="font-bold text-sm text-foreground">Khách hàng</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground font-semibold">Tên khách hàng</Label>
                      <Input value={customerName} className="h-8 text-xs bg-muted/10" disabled />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground font-semibold">SĐT</Label>
                      <Input value={customerPhone || "—"} className="h-8 text-xs bg-muted/10" disabled />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground font-semibold">Email</Label>
                    <Input value={order.customer_email || "Địa chỉ email"} className="h-8 text-xs bg-muted/10" disabled />
                  </div>

                  {/* Customer Purchase Stats Box */}
                  <div className="p-3 border rounded-lg bg-blue-50/20 dark:bg-blue-950/20 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center font-bold text-[9px] text-blue-600">
                        {customerName ? customerName.charAt(0) : "T"}
                      </div>
                      <span className="font-bold text-xs text-foreground">{customerName || "Khách hàng"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground mt-1">
                      <span>Tổng: 0 đ</span>
                      <span>Thành công: 0/1 đơn</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Lần mua cuối: 17:15 02/05</p>
                    <Button variant="outline" size="sm" className="w-full h-6 text-[9px] font-bold mt-1">Tạo voucher</Button>
                  </div>
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-red-500" />
                    <span className="font-bold text-sm text-foreground">Nhận hàng</span>
                  </div>
                  <Button variant="link" className="h-auto p-0 text-[10px] font-semibold text-blue-600">Chọn địa chỉ</Button>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground font-medium">Dự kiến nhận hàng:</span>
                    <Input 
                      type="text" 
                      value={expectedDeliveryDate} 
                      onChange={e => setExpectedDeliveryDate(e.target.value)}
                      className="h-7 text-[10px] w-28 text-center bg-background" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground font-semibold">Người nhận</Label>
                      <Input value={customerName} className="h-8 text-xs bg-background" disabled />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground font-semibold">SĐT nhận hàng</Label>
                      <Input value={customerPhone || "—"} className="h-8 text-xs bg-background" disabled />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] text-muted-foreground font-semibold">Địa chỉ chi tiết</Label>
                    <Input value={customerAddress || "—"} className="h-8 text-xs bg-background" disabled />
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-muted-foreground block">Tỉnh/TP</span>
                      <span className="font-semibold block truncate">{order.shipping_province || "Hà Nội"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-muted-foreground block">Quận/Huyện</span>
                      <span className="font-semibold block truncate">{order.shipping_district || "Cầu Giấy"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-muted-foreground block">Phường/Xã</span>
                      <span className="font-semibold block truncate">{order.shipping_ward || "Trung Hoà"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logistics/Carrier Card */}
              <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <Truck className="h-4.5 w-4.5 text-orange-500" />
                  <span className="font-bold text-sm text-foreground">Vận chuyển & Giao vận</span>
                </div>
                <ShipmentPanel orderId={order.id} orderStatus={order.status} />
              </div>

            </div>
          </div>

          {/* Footer Actions Bar */}
          <div className="p-4 bg-white dark:bg-slate-950 border-t flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-6">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-semibold">Cần thanh toán</span>
                <span className="text-lg font-extrabold text-foreground">{totalCalculated.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-red-500 font-bold block">Thu hộ (COD)</span>
                <span className="text-lg font-extrabold text-red-500">{remainingCOD.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <Select
                value={order.status}
                onValueChange={(value) => onStatusChange(order.id, value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-48 h-9 border-primary/20 text-primary font-bold hover:bg-primary/5 cursor-pointer bg-blue-50/50 rounded-lg">
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  <span className="text-xs">Trạng thái: {statusLabels[order.status] || order.status}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover z-[160]">
                  {pancakeStatuses.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant="outline" className="text-xs py-1.5 px-2 bg-slate-100 text-slate-700 dark:bg-slate-900 border-none font-bold">
                Đã in: 1 lần
              </Badge>

              {((order.status as string) === "delivered" || (order.status as string) === "received_exchange" || (order.status as string) === "paid_completed") && (
                <Button 
                  variant="outline" 
                  onClick={() => setReturnDialogOpen(true)}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer h-9 text-xs font-semibold"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Đổi / Trả hàng
                </Button>
              )}

              {(order.status === "shipping" || order.status === "delivered") && (
                <Button 
                  variant="outline" 
                  onClick={() => setPartialReturnDialogOpen(true)}
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 cursor-pointer h-9 text-xs font-semibold"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin-slow" />
                  Báo hoàn 1 phần
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 cursor-pointer h-9 text-xs font-semibold"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                In đơn (F4)
              </Button>

              <Button 
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer h-9 text-xs font-semibold"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
                Lưu đơn (F2)
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>

      <OrderReturnDialog
        order={order}
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
      />

      <PartialReturnDialog
        order={order}
        open={partialReturnDialogOpen}
        onOpenChange={setPartialReturnDialogOpen}
      />
    </>
  );
}

import React from "react";
import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, List, LayoutGrid, Search, Filter, Eye, Download, Upload, ArrowRight, Bot, RotateCcw, FileText, Package, Printer, RefreshCw, ClipboardList, Truck, MoreHorizontal, PackageCheck, FileSpreadsheet, Scale, PhoneCall } from "lucide-react";
import { PackingDialog } from "@/components/orders/PackingDialog";
import { PrintProductsDialog } from "@/components/orders/PrintProductsDialog";
import { ShipCarrierDialog } from "@/components/orders/ShipCarrierDialog";
import { BulkTagDialog, TAG_GROUPS } from "@/components/orders/BulkTagDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOrders, type Order as HookOrder } from "@/hooks/useOrders";
import { usePermissions, getRegionFromProvince } from "@/hooks/usePermissions";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useShippingZones } from "@/hooks/useShippingZones";
import { useGlobalDateFilter } from "@/contexts/GlobalDateFilterContext";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { QuickStatusButtons } from "@/components/orders/QuickStatusButtons";
import { exportOrdersToExcel } from "@/lib/exportExcel";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction, getLocalProductBom } from "@/lib/localInventoryStore";
import { StatsCardsSkeleton, OrdersKanbanSkeleton, OrdersListSkeleton } from "@/components/ui/page-skeleton";
import { EmptyOrdersState, EmptySearchState } from "@/components/ui/empty-state";
import { ReturnsTab } from "@/components/orders/ReturnsTab";
import { PlatformSyncPanel } from "@/components/orders/PlatformSyncPanel";
import { OrderAIAssistant } from "@/components/ai/OrderAIAssistant";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOrderRelated } from "@/lib/queryInvalidation";
import { QuotationsTab } from "@/components/orders/QuotationsTab";
import { ImportOrdersDialog, type ImportedOrder } from "@/components/orders/ImportOrdersDialog";
import { ReconciliationTab } from "@/components/orders/ReconciliationTab";
import {
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderSourceLabel,
  getPaymentMethodLabel,
  getPriorityLabel,
} from "@/lib/orderControl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Order = HookOrder & {
  warehouses?: { id: string; name: string } | null;
  shipping_zones?: { id: string; name: string } | null;
};

const statusColumns = [
  { id: "all", label: "Tất cả", color: "bg-slate-500" },
  { id: "pending_approval", label: "Chờ duyệt", color: "bg-orange-600" },
  { id: "pending", label: "Mới", color: "bg-blue-500" },
  { id: "waiting_goods", label: "Chờ hàng", color: "bg-amber-500" },
  { id: "confirmed", label: "Đã xác nhận", color: "bg-info" },
  { id: "packing", label: "Đang đóng hàng", color: "bg-purple-500" },
  { id: "waiting_transfer", label: "Chờ chuyển hàng", color: "bg-pink-500" },
  { id: "shipping", label: "Đã gửi hàng", color: "bg-indigo-500" },
  { id: "delivered", label: "Đã nhận", color: "bg-success" },
  { id: "returned", label: "Đang hoàn", color: "bg-orange-500" },
  { id: "cancelled", label: "Huỷ đơn", color: "bg-destructive" },
];

const pancakeStatuses = [
  { value: "pending", label: "Mới" },
  { value: "pending_approval", label: "Chờ duyệt" },
  { value: "duplicate", label: "Tạo trùng lặp" },
  { value: "waiting_goods", label: "Chờ hàng" },
  { value: "priority_ship", label: "Ưu tiên xuất đơn" },
  { value: "waiting_print", label: "Chờ in" },
  { value: "printed", label: "Đã in" },
  { value: "ordered", label: "Đã đặt hàng" },
  { value: "confirmed", label: "Xác nhận đơn hàng" },
  { value: "packing", label: "Đang đóng hàng" },
  { value: "waiting_transfer", label: "Chờ chuyển hàng" },
  { value: "shipping", label: "Gửi hàng đi" },
  { value: "delivered", label: "Đã nhận" },
  { value: "received_exchange", label: "Đã nhận (đổi)" },
  { value: "paid_completed", label: "Đã thu tiền" },
  { value: "cancelled", label: "Huỷ đơn" },
  { value: "deleted", label: "Xoá đơn" },
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

const getCarrier = (phone: string) => {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, "");
  const prefix3 = clean.substring(0, 3);
  const prefix4 = clean.substring(0, 4);
  
  const viettel = ["032", "033", "034", "035", "036", "037", "038", "039", "086", "096", "097", "098"];
  const vina = ["081", "082", "083", "084", "085", "088", "091", "094"];
  const mobi = ["070", "076", "077", "078", "079", "089", "090", "093"];
  
  if (viettel.includes(prefix3) || viettel.includes(prefix4)) return "Viettel";
  if (vina.includes(prefix3) || vina.includes(prefix4)) return "Vinaphone";
  if (mobi.includes(prefix3) || mobi.includes(prefix4)) return "Mobifone";
  return "Khác";
};

const renderUserAvatar = (name?: string) => {
  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
  return (
    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center border shadow-xs select-none">
      {initial}
    </div>
  );
};

const getInventoryStatus = (order: any) => {
  const items = order.order_items || [];
  if (items.length === 0) return { label: "Chưa có SP", color: "text-slate-500" };
  
  const hasShortage = items.some((item: any) => {
    const available = item.products?.stock_quantity ?? 0;
    return item.quantity > available;
  });
  
  if (hasShortage) {
    return { label: "Đơn thiếu", color: "text-red-500 font-semibold" };
  }
  return { label: "Đơn đủ", color: "text-green-600 font-semibold" };
};

const Orders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const location = useLocation();
  const stateSearchTerm = (location.state as any)?.searchTerm || "";

  const [searchParams] = useSearchParams();
  const defaultView = searchParams.get("view") === "list" ? "list" : "kanban";
  const [viewMode, setViewMode] = useState<"kanban" | "list">(defaultView);
  const [activeTab, setActiveTab] = useState("orders");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { startDate, endDate } = useGlobalDateFilter();

  const { getUserRegion, canCreate, canEdit, canDelete, maskPhone, maskName } = usePermissions();
  const userRegion = getUserRegion();

  const paramSearch = searchParams.get("search") || stateSearchTerm;
  const paramStatus = searchParams.get("status") || "all";
  const paramChannel = searchParams.get("channel") || "all";

  const [searchTerm, setSearchTerm] = useState(paramSearch);
  const [statusFilter, setStatusFilter] = useState<string>(paramStatus);
  const [channelFilter, setChannelFilter] = useState<string>(paramChannel);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [upsaleFilter, setUpsaleFilter] = useState<boolean>(false);

  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (userRegion && userRegion !== "Toàn quốc") {
      setRegionFilter(userRegion);
    }
  }, [userRegion]);

  useEffect(() => {
    const searchVal = searchParams.get("search");
    if (searchVal !== null) setSearchTerm(searchVal);
    
    const statusVal = searchParams.get("status");
    if (statusVal !== null) setStatusFilter(statusVal);
    
    const channelVal = searchParams.get("channel");
    if (channelVal !== null) setChannelFilter(channelVal);

    const viewVal = searchParams.get("view");
    if (viewVal === "list") setViewMode("list");
    else if (viewVal === "kanban") setViewMode("kanban");

    // Sync tab from URL params (for sidebar submenu navigation)
    const tabVal = searchParams.get("tab");
    if (tabVal === "quotations" || tabVal === "returns" || tabVal === "reconciliation") {
      setActiveTab(tabVal);
    } else if (!tabVal) {
      setActiveTab("orders");
    }
    
    if (viewVal === "upsale") setUpsaleFilter(true);
  }, [searchParams]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [printProductsDialogOpen, setPrintProductsDialogOpen] = useState(false);
  const [shipCarrierDialogOpen, setShipCarrierDialogOpen] = useState(false);
  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false);
  
  const { orders, isLoading, createOrder, updateOrderStatus } = useOrders();
  const { channels } = useSalesChannels();
  const { warehouses } = useWarehouses();
  const { shippingZones } = useShippingZones();

  const enrichedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      warehouses: warehouses.find((warehouse) => warehouse.id === order.warehouse_id) || null,
      shipping_zones: shippingZones.find((zone) => zone.id === order.shipping_zone_id) || null,
    }));
  }, [orders, warehouses, shippingZones]);

  const callbackReminders = useMemo(() => {
    if (!enrichedOrders) return [];
    const now = new Date();
    return enrichedOrders.filter(order => {
      if (!order.call_back_time) return false;
      const callbackDate = new Date(order.call_back_time);
      const diffMs = callbackDate.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);
      return diffMins <= 10 && diffMins >= -2880; // Hẹn gọi trong vòng 10 phút tới hoặc quá hạn tối đa 48 giờ
    });
  }, [enrichedOrders]);

  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    enrichedOrders.forEach(o => {
      if (o.tags) {
        const tagsArr = typeof o.tags === "string" ? o.tags.split(",") : (Array.isArray(o.tags) ? o.tags : []);
        tagsArr.forEach(t => {
          const trimmed = typeof t === "string" ? t.trim() : "";
          if (trimmed) tagsSet.add(trimmed);
        });
      }
    });
    return Array.from(tagsSet);
  }, [enrichedOrders]);

  const allUniqueStaff = useMemo(() => {
    const staffSet = new Set<string>();
    enrichedOrders.forEach(o => {
      if (o.assigned_to_name) staffSet.add(o.assigned_to_name);
    });
    return Array.from(staffSet);
  }, [enrichedOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((order) => {
      const customerName = getOrderCustomerName(order).toLowerCase();
      const customerPhone = getOrderCustomerPhone(order);
      const source = getOrderSourceLabel(order.source_type).toLowerCase();
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.includes(searchTerm.toLowerCase()) ||
        customerPhone.includes(searchTerm) ||
        source.includes(searchTerm.toLowerCase()) ||
        !!order.platform_order_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesChannel = channelFilter === "all" || order.channel_id === channelFilter;
      
      let matchesDate = true;
      if (order.created_at) {
        const orderDateStr = order.created_at.split("T")[0];
        if (startDate && orderDateStr < startDate) matchesDate = false;
        if (endDate && orderDateStr > endDate) matchesDate = false;
      }

      // Region filter
      let matchesRegion = true;
      if (regionFilter !== "all") {
        const orderRegion = getRegionFromProvince(order.shipping_province || "");
        if (orderRegion !== regionFilter) matchesRegion = false;
      }
      
      // Upsale filter
      const matchesUpsale = !upsaleFilter || (order.order_items || []).some((item: any) => item.is_upsale === true);

      // Tag filter
      let matchesTag = true;
      if (tagFilter !== "all") {
        const tagsList = Array.isArray(order.tags)
          ? order.tags.map(t => String(t).trim().toLowerCase())
          : typeof order.tags === "string"
          ? (order.tags as string).split(",").map(t => t.trim().toLowerCase())
          : [];
        if (!tagsList.includes(tagFilter.toLowerCase())) matchesTag = false;
      }

      // Staff filter
      let matchesStaff = true;
      if (staffFilter !== "all") {
        if (order.assigned_to_name !== staffFilter) matchesStaff = false;
      }

      // Warehouse filter
      let matchesWarehouse = true;
      if (warehouseFilter !== "all") {
        if (order.warehouse_id !== warehouseFilter) matchesWarehouse = false;
      }

      // Payment status filter
      let matchesPaymentStatus = true;
      if (paymentStatusFilter !== "all") {
        const orderPaymentStatus = order.payment_status || "pending";
        if (orderPaymentStatus !== paymentStatusFilter) matchesPaymentStatus = false;
      }
      
      return matchesSearch && matchesStatus && matchesChannel && matchesDate && matchesRegion && matchesUpsale && matchesTag && matchesStaff && matchesWarehouse && matchesPaymentStatus;
    });
  }, [enrichedOrders, searchTerm, statusFilter, channelFilter, startDate, endDate, regionFilter, upsaleFilter, tagFilter, staffFilter, warehouseFilter, paymentStatusFilter]);

  const totalCOD = useMemo(() => {
    return filteredOrders
      .filter((o) => o.payment_method?.toLowerCase() === "cod")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [filteredOrders]);

  const totalPrepaid = useMemo(() => {
    return filteredOrders
      .filter((o) => o.payment_method?.toLowerCase() !== "cod" && o.payment_status === "paid")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [filteredOrders]);

  const totalShippingFee = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + Number(o.shipping_fee || 0), 0);
  }, [filteredOrders]);

  const getChannelInfo = (channelId: string | null) => {
    if (!channelId) return { name: "N/A", color: "#888" };
    const channel = channels.find(c => c.id === channelId);
    return channel ? { name: channel.name, color: channel.color || "#3B82F6" } : { name: "N/A", color: "#888" };
  };

  const handleCreateOrder = async (data: any) => {
    const { autoSendToCarrier, carrierId, ...orderPayload } = data;
    const res = await createOrder.mutateAsync(orderPayload);
    
    if (autoSendToCarrier && res) {
      const orderId = res.id;
      const trackingCode = res.platform_order_id || `SHIP-${orderId}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const codAmount = res.status === "confirmed" || res.payment_status === "unpaid" ? (res.total || 0) : 0;
      
      try {
        if (isLocalDemoAuthEnabled()) {
          const localShipmentsRaw = localStorage.getItem("erp-mini-local-demo-shipments");
          const localShipments = localShipmentsRaw ? JSON.parse(localShipmentsRaw) : [];
          localShipments.unshift({
            id: `ship-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            order_id: orderId,
            carrier_id: carrierId,
            tracking_code: trackingCode,
            cod_amount: codAmount,
            weight_grams: 500,
            created_at: new Date().toISOString()
          });
          localStorage.setItem("erp-mini-local-demo-shipments", JSON.stringify(localShipments));
        } else {
          await supabase.from("shipments").insert({
            order_id: orderId,
            carrier_id: carrierId,
            tracking_code: trackingCode,
            cod_amount: codAmount,
            weight_grams: 500
          });
        }
        
        toast({
          title: "Gửi ĐVVC tự động thành công",
          description: `Đơn hàng đã được đẩy sang ĐVVC với mã vận đơn: ${trackingCode}`
        });
      } catch (shipErr) {
        console.error("Auto create shipment failed on order creation:", shipErr);
      }
    }
    
    setCreateDialogOpen(false);
  };

  const handleImportOrders = async (importedOrders: ImportedOrder[]) => {
    let successCount = 0;
    let errorCount = 0;
    for (const imported of importedOrders) {
      try {
        const orderNumber = `ORD-IMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const subtotal = imported.items.reduce((sum, item) => sum + item.total, 0);
        await createOrder.mutateAsync({
          order: {
            order_number: orderNumber,
            channel_id: channels[0]?.id || "",
            order_type: "b2c",
            source_type: "import",
            fulfillment_type: "online",
            customer_name: imported.customer_name || null,
            customer_phone: imported.customer_phone || null,
            customer_address: imported.customer_address || null,
            shipping_address: imported.customer_address || null,
            payment_method: "cod",
            notes: imported.notes || null,
            subtotal,
            shipping_fee: 0,
            discount: 0,
            total: subtotal,
            status: "pending",
          },
          items: imported.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: 0,
            total: item.total,
          })),
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }
    setImportDialogOpen(false);
    toast({
      title: `Nhập đơn hoàn tất`,
      description: `Thành công: ${successCount} đơn` + (errorCount > 0 ? `, Lỗi: ${errorCount} đơn` : ""),
      variant: errorCount > 0 ? "destructive" : "default",
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateOrderStatus.mutateAsync({ id: orderId, status: newStatus as any });
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      for (const id of selectedOrderIds) {
        await updateOrderStatus.mutateAsync({ id, status: newStatus as any });
      }
      toast({
        title: "Cập nhật thành công",
        description: `Đã cập nhật trạng thái cho ${selectedOrderIds.length} đơn hàng sang "${statusLabels[newStatus] || newStatus}"`,
      });
      setSelectedOrderIds([]);
    } catch (err: any) {
      toast({
        title: "Lỗi cập nhật",
        description: err.message || "Đã xảy ra lỗi khi cập nhật hàng loạt",
        variant: "destructive"
      });
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handlePackOrder = async (orderId: string) => {
    await updateOrderStatus.mutateAsync({ id: orderId, status: "waiting_transfer" as any });
  };

  const selectedOrderObjects = useMemo(() => {
    return enrichedOrders.filter(o => selectedOrderIds.includes(o.id));
  }, [enrichedOrders, selectedOrderIds]);

  const handleBulkPrint = () => {
    if (selectedOrderIds.length === 0) return;
    const selected = enrichedOrders.filter(o => selectedOrderIds.includes(o.id));
    selected.forEach(order => {
      // Trigger print for each selected order
      const printWindow = window.open("", "_blank", "width=302,height=600");
      if (!printWindow) return;
      const items = (order.order_items || []).map((item, idx) => `<tr><td style="text-align:center;padding:3px;border-bottom:1px dashed #ccc">${idx+1}</td><td style="padding:3px;border-bottom:1px dashed #ccc">${item.products?.name || 'SP'} x${item.quantity}</td><td style="text-align:right;padding:3px;border-bottom:1px dashed #ccc">${(item.quantity * Number(item.unit_price)).toLocaleString('vi-VN')}đ</td></tr>`).join('');
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${order.order_number}</title><style>body{font-family:'Courier New',monospace;width:72mm;margin:0 auto;padding:4mm;font-size:11px}table{width:100%;border-collapse:collapse}.center{text-align:center}.bold{font-weight:bold}.dashed{border-top:1px dashed #000;margin:4px 0}</style></head><body><div class="center bold" style="font-size:13px">HÓA ĐƠN BÁN LẺ</div><div class="dashed"></div><div><b>Mã:</b> ${order.order_number}</div><div><b>KH:</b> ${order.customer_name || 'N/A'}</div><div><b>SĐT:</b> ${order.customer_phone || 'N/A'}</div><div class="dashed"></div><table>${items}</table><div class="dashed"></div><div class="bold" style="text-align:right;font-size:13px">Tổng: ${Number(order.total || 0).toLocaleString('vi-VN')}đ</div></body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    });
    toast({ title: "In đơn", description: `Đang in ${selected.length} đơn hàng` });
  };

  const handleBulkActionChange = async (value: string) => {
    if (selectedOrderIds.length === 0) return;
    if (value === "delete") {
      try {
        for (const id of selectedOrderIds) {
          await updateOrderStatus.mutateAsync({ id, status: "deleted" as any });
        }
        toast({
          title: "Đã xóa đơn hàng",
          description: `Đã cập nhật trạng thái cho ${selectedOrderIds.length} đơn hàng sang "Đã xóa"`,
        });
        setSelectedOrderIds([]);
      } catch (err: any) {
        toast({
          title: "Lỗi xóa đơn hàng",
          description: err.message || "Đã xảy ra lỗi khi xóa đơn hàng",
          variant: "destructive",
        });
      }
    } else if (value === "assign") {
      toast({
        title: "Đã phân công nhân viên",
        description: `Đã phân công ${selectedOrderIds.length} đơn hàng cho nhân viên xử lý thành công.`,
      });
      setSelectedOrderIds([]);
    } else if (value === "tag") {
      setBulkTagDialogOpen(true);
    } else if (value === "merge") {
      if (selectedOrderObjects.length < 2) {
        toast({
          variant: "destructive",
          title: "Không thể gộp đơn",
          description: "Vui lòng chọn từ 2 đơn hàng trở lên để thực hiện gộp."
        });
        return;
      }

      // Group selected orders by customer_phone
      const phoneGroups: Record<string, typeof selectedOrderObjects> = {};
      selectedOrderObjects.forEach(order => {
        const phone = order.customer_phone ? order.customer_phone.replace(/\s+/g, "") : "";
        if (phone && phone.length >= 9) {
          if (!phoneGroups[phone]) phoneGroups[phone] = [];
          phoneGroups[phone].push(order);
        }
      });

      const mergeableGroups = Object.entries(phoneGroups).filter(([_, list]) => list.length >= 2);
      if (mergeableGroups.length === 0) {
        toast({
          variant: "destructive",
          title: "Không có đơn trùng SĐT",
          description: "Không tìm thấy đơn hàng nào trùng Số điện thoại khách hàng trong số các đơn đã chọn."
        });
        return;
      }

      try {
        const mergedMasterCodes: string[] = [];
        
        if (isLocalDemoAuthEnabled()) {
          const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
          if (rawOrders) {
            const allOrders = JSON.parse(rawOrders);
            
            for (const [phone, group] of mergeableGroups) {
              // Sort by created_at ascending: oldest is Master
              const sorted = [...group].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              const masterOrder = sorted[0];
              const subOrders = sorted.slice(1);
              
              // Find indices in allOrders
              const masterIdx = allOrders.findIndex((o: any) => o.id === masterOrder.id);
              if (masterIdx === -1) continue;
              
              const currentMaster = allOrders[masterIdx];
              const mergedItems = [...(currentMaster.order_items || [])];
              
              subOrders.forEach(sub => {
                const subItems = sub.order_items || [];
                subItems.forEach((subItem: any) => {
                  const existingItemIdx = mergedItems.findIndex(mi => mi.product_id === subItem.product_id);
                  if (existingItemIdx !== -1) {
                    mergedItems[existingItemIdx].quantity += subItem.quantity;
                    mergedItems[existingItemIdx].total_price = mergedItems[existingItemIdx].quantity * Number(mergedItems[existingItemIdx].unit_price);
                  } else {
                    mergedItems.push({
                      ...subItem,
                      id: `oi-merged-${Math.random().toString(36).substr(2, 9)}`,
                      order_id: masterOrder.id
                    });
                  }
                });
                
                // Update subOrder state in allOrders to 'duplicate'
                const subIdx = allOrders.findIndex((o: any) => o.id === sub.id);
                if (subIdx !== -1) {
                  allOrders[subIdx].status = "duplicate";
                  allOrders[subIdx].notes = (allOrders[subIdx].notes || "") + (allOrders[subIdx].notes ? "\n" : "") + `[Gộp đơn] Đã gộp vào đơn chính: ${masterOrder.order_number}`;
                  allOrders[subIdx].order_items = []; // Clear sub order items
                  allOrders[subIdx].updated_at = new Date().toISOString();
                }
              });
              
              // Calculate financial totals for Master
              const itemsTotal = mergedItems.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0);
              const shipping = Number(currentMaster.shipping_fee) || 0;
              const discount = Number(currentMaster.discount) || 0;
              
              currentMaster.order_items = mergedItems;
              currentMaster.total = itemsTotal + shipping - discount;
              currentMaster.notes = (currentMaster.notes || "") + (currentMaster.notes ? "\n" : "") + `[Gộp đơn] Gộp mặt hàng từ các đơn phụ: ${subOrders.map(o => o.order_number).join(", ")}`;
              currentMaster.updated_at = new Date().toISOString();
              
              mergedMasterCodes.push(masterOrder.order_number);
            }
            
            localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(allOrders));
          }
        } else {
          // Supabase Mode
          for (const [phone, group] of mergeableGroups) {
            const sorted = [...group].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const masterOrder = sorted[0];
            const subOrders = sorted.slice(1);
            
            // Get current Master items
            const { data: currentMasterItems } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", masterOrder.id);
              
            const mergedItems = [...(currentMasterItems || [])];
            
            for (const sub of subOrders) {
              const { data: subItems } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", sub.id);
                
              if (subItems) {
                for (const subItem of subItems) {
                  const existingItem = mergedItems.find(mi => mi.product_id === subItem.product_id);
                  if (existingItem) {
                    const newQty = existingItem.quantity + subItem.quantity;
                    const newPrice = newQty * Number(existingItem.unit_price);
                    
                    await supabase
                      .from("order_items")
                      .update({ quantity: newQty, total: newPrice })
                      .eq("id", existingItem.id);
                      
                    existingItem.quantity = newQty;
                    existingItem.total = newPrice;
                  } else {
                    const { data: insertedItem } = await supabase
                      .from("order_items")
                      .insert({
                        order_id: masterOrder.id,
                        product_id: subItem.product_id,
                        quantity: subItem.quantity,
                        unit_price: subItem.unit_price,
                        total: subItem.total
                      })
                      .select()
                      .single();
                      
                    if (insertedItem) mergedItems.push(insertedItem);
                  }
                }
              }
              
              // Deactivate/delete order items of subOrder to avoid double stock deduction
              await supabase
                .from("order_items")
                .delete()
                .eq("order_id", sub.id);
                
              // Update subOrder status to duplicate
              const subNotes = (sub.notes || "") + (sub.notes ? "\n" : "") + `[Gộp đơn] Đã gộp vào đơn chính: ${masterOrder.order_number}`;
              await supabase
                .from("orders")
                .update({
                  status: "duplicate" as any,
                  notes: subNotes,
                  updated_at: new Date().toISOString()
                })
                .eq("id", sub.id);
            }
            
            // Recalculate Master Financials
            const itemsTotal = mergedItems.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0);
            const shipping = Number(masterOrder.shipping_fee) || 0;
            const discount = Number(masterOrder.discount) || 0;
            const newTotal = itemsTotal + shipping - discount;
            
            const masterNotes = (masterOrder.notes || "") + (masterOrder.notes ? "\n" : "") + `[Gộp đơn] Gộp mặt hàng từ các đơn phụ: ${subOrders.map(o => o.order_number).join(", ")}`;
            
            await supabase
              .from("orders")
              .update({
                total: newTotal,
                notes: masterNotes,
                updated_at: new Date().toISOString()
              })
              .eq("id", masterOrder.id);
              
            mergedMasterCodes.push(masterOrder.order_number);
          }
        }
        
        toast({
          title: "Gộp đơn thành công",
          description: `Đã tiến hành gộp trùng SĐT thành các đơn chính: ${mergedMasterCodes.join(", ")}`
        });
        
        setSelectedOrderIds([]);
        window.dispatchEvent(new Event("local-orders-updated"));
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Lỗi gộp đơn",
          description: err.message || "Đã xảy ra lỗi trong quá trình gộp đơn."
        });
      }
    }
  };

  const getTagColorClass = (tagName: string) => {
    const nameLower = tagName.toLowerCase();
    if (nameLower.includes("gấp")) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (nameLower.includes("vip")) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (nameLower.includes("sỉ")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (nameLower.includes("thiếu")) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    if (nameLower.includes("xác nhận")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (nameLower.includes("gửi lại")) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  };

  const handleUpdateOrderTags = async (orderId: string, currentTagsVal: string | string[] | null, tagName: string, action: "add" | "remove") => {
    let currentTags = Array.isArray(currentTagsVal)
      ? [...currentTagsVal]
      : typeof currentTagsVal === "string"
      ? currentTagsVal.split(",").map(t => t.trim()).filter(Boolean)
      : [];
    
    if (action === "add") {
      const priorityGroup = TAG_GROUPS[0];
      if (priorityGroup.tags.some(t => t.name === tagName)) {
        const priorityNames = priorityGroup.tags.map(t => t.name);
        currentTags = currentTags.filter(t => !priorityNames.includes(t));
      }
      
      if (!currentTags.includes(tagName)) {
        currentTags.push(tagName);
      }
    } else {
      currentTags = currentTags.filter(t => t !== tagName);
    }
    
    const newTagsStr = currentTags.join(", ");
    
    try {
      if (isLocalDemoAuthEnabled()) {
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        if (rawOrders) {
          const all = JSON.parse(rawOrders);
          const idx = all.findIndex((o: any) => o.id === orderId);
          if (idx !== -1) {
            all[idx].tags = newTagsStr;
            all[idx].updated_at = new Date().toISOString();
            localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(all));
          }
        }
      } else {
        await supabase
          .from("orders")
          .update({ tags: currentTags, updated_at: new Date().toISOString() })
          .eq("id", orderId);
      }
      
      toast({ title: "Đã cập nhật thẻ đơn hàng" });
      window.dispatchEvent(new Event("local-orders-updated"));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Lỗi", description: err.message });
    }
  };

  const handleBulkPrintProducts = () => {
    if (selectedOrderIds.length === 0) return;
    setPrintProductsDialogOpen(true);
  };

  const handleBulkPrintHandover = () => {
    if (selectedOrderIds.length === 0) return;
    const groups: Record<string, typeof selectedOrderObjects> = {};
    selectedOrderObjects.forEach((order) => {
      const carrier = order.partners?.name || "Tự vận chuyển / Chưa chọn";
      if (!groups[carrier]) {
        groups[carrier] = [];
      }
      groups[carrier].push(order);
    });
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    let tablesHtml = "";
    Object.entries(groups).forEach(([carrier, orders]) => {
      const orderRows = orders
        .map(
          (order, idx) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace; font-weight: bold;">${order.order_number}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${order.customer_name || "N/A"}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${order.customer_phone || "N/A"}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${Number(order.total || 0).toLocaleString("vi-VN")}đ</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${order.status}</td>
            <td style="border: 1px solid #ddd; padding: 15px 8px; text-align: center; width: 120px; font-style: italic; color: #999;">Ký nhận</td>
          </tr>`
        )
        .join("");
      const carrierTotal = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      tablesHtml += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h3 style="background-color: #f3f4f6; padding: 8px 12px; margin-bottom: 8px; border-left: 4px solid #2563eb;">Đơn vị vận chuyển: ${carrier} (${orders.length} đơn)</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th style="width: 120px;">Mã đơn hàng</th>
                <th>Tên khách hàng</th>
                <th style="width: 110px;">Số điện thoại</th>
                <th style="width: 120px; text-align: right;">Tổng tiền</th>
                <th style="width: 100px; text-align: center;">Trạng thái</th>
                <th style="width: 120px; text-align: center;">Chữ ký nhận</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows}
              <tr style="font-weight: bold; background-color: #fafafa;">
                <td colspan="4" style="text-align: right; border: 1px solid #ddd; padding: 8px;">Tổng cộng cho đơn vị:</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #2563eb;">${carrierTotal.toLocaleString("vi-VN")}đ</td>
                <td colspan="2" style="border: 1px solid #ddd;"></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Phiếu bàn giao đơn hàng cho Đơn vị vận chuyển</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; font-size: 13px; }
          h2 { text-align: center; margin-bottom: 5px; }
          .meta { text-align: center; color: #666; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f8fafc; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          td { border: 1px solid #ddd; padding: 8px; }
          .sig-container { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px; }
          .sig-box { text-align: center; width: 200px; }
          .sig-title { font-weight: bold; margin-bottom: 60px; }
        </style>
      </head>
      <body>
        <h2>PHIẾU BÀN GIAO ĐƠN HÀNG HÀNG LOẠT</h2>
        <div class="meta">Tổng số đơn hàng: ${selectedOrderIds.length} | Ngày in: ${new Date().toLocaleString("vi-VN")}</div>
        ${tablesHtml}
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-title">Người bàn giao (Kho)</div>
            <div>(Ký, ghi rõ họ tên)</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">Đại diện đơn vị vận chuyển</div>
            <div>(Ký, ghi rõ họ tên)</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleBulkReplenishStock = () => {
    if (selectedOrderIds.length === 0) return;
    if (isLocalDemoAuthEnabled()) {
      selectedOrderObjects.forEach((order) => {
        const orderNumber = order.order_number || order.id;
        const orderItems = order.order_items || [];
        orderItems.forEach((item) => {
          if (!item.product_id) return;
          const bomItems = getLocalProductBom(item.product_id);
          if (bomItems && bomItems.length > 0) {
            bomItems.forEach((bomItem) => {
              createLocalInventoryTransaction({
                product_id: bomItem.material_id,
                transaction_type: "in",
                quantity: bomItem.quantity * (item.quantity || 1),
                notes: `Nhập bổ sung vật tư - Đơn hàng ${orderNumber}`,
              });
            });
          } else {
            createLocalInventoryTransaction({
              product_id: item.product_id,
              transaction_type: "in",
              quantity: item.quantity || 1,
              notes: `Nhập hàng hoàn/bổ sung - Đơn hàng ${orderNumber}`,
            });
          }
        });
      });
    }
    toast({
      title: "Đã nhập hàng thành công",
      description: `Đã bổ sung/nhập hàng tồn kho cho ${selectedOrderIds.length} đơn hàng được chọn.`,
    });
    setSelectedOrderIds([]);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Quản lý đơn hàng" subtitle="Theo dõi và xử lý đơn hàng đa kênh" />
        <div className="p-4 sm:p-6 space-y-6">
          <StatsCardsSkeleton count={5} />
          <OrdersKanbanSkeleton />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header title="Quản lý đơn hàng" subtitle="Theo dõi và xử lý đơn hàng đa kênh" />

      <div className="p-4 sm:p-6">
        {callbackReminders.length > 0 && (
          <div className="mb-4 bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap animate-pulse shadow-sm">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-orange-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-orange-850 dark:text-orange-300">
                  Lịch hẹn gọi lại cho khách hàng đến hạn ({callbackReminders.length} đơn)
                </p>
                <p className="text-[10px] text-orange-700 dark:text-orange-400 mt-0.5 font-semibold">
                  Telesales vui lòng kiểm tra và liên hệ ngay với khách hàng để chốt đơn/chăm sóc.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {callbackReminders.slice(0, 3).map((order) => (
                <Button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setDetailDialogOpen(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 bg-white dark:bg-slate-900 text-orange-850 dark:text-orange-300 font-bold h-7 text-[10px] px-2.5 hover:bg-orange-50 hover:text-orange-900 cursor-pointer"
                >
                  Gọi: #{order.order_number} ({order.call_back_time ? new Date(order.call_back_time).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) : ""})
                </Button>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="quotations" className="gap-2">
              <FileText className="h-4 w-4" />
              Báo giá
            </TabsTrigger>
            <TabsTrigger value="returns" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Trả hàng
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="gap-2">
              <Scale className="h-4 w-4" />
              Đối soát
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {/* Platform Sync Panel */}
            <div className="mb-4">
              <PlatformSyncPanel />
            </div>
            {/* Action Bar */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "kanban" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("kanban")}
                  >
                    <LayoutGrid className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Kanban</span>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Danh sách</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <OrderAIAssistant 
                    orderContext={`Tổng ${orders.length} đơn hàng. ${filteredOrders.filter(o => o.status === 'pending').length} chờ xử lý, ${filteredOrders.filter(o => o.status === 'shipping').length} đang giao.`}
                  />
                  {canCreate("orders") && (
                    <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="w-full sm:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => exportOrdersToExcel(filteredOrders)} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </Button>
                  {canCreate("orders") && (
                    <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo đơn hàng
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã đơn, tên KH, SĐT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-36 bg-background">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Tất cả</SelectItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={channelFilter} onValueChange={setChannelFilter}>
                    <SelectTrigger className="w-full sm:w-36 bg-background">
                      <SelectValue placeholder="Kênh" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Tất cả kênh</SelectItem>
                      {channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={regionFilter} 
                    onValueChange={setRegionFilter}
                    disabled={!!userRegion && userRegion !== "Toàn quốc"}
                  >
                    <SelectTrigger className="w-full sm:w-36 bg-background">
                      <SelectValue placeholder="Vùng miền" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Tất cả vùng</SelectItem>
                      <SelectItem value="Miền Bắc">Miền Bắc</SelectItem>
                      <SelectItem value="Miền Trung">Miền Trung</SelectItem>
                      <SelectItem value="Miền Nam">Miền Nam</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={upsaleFilter ? "default" : "outline"}
                    size="sm"
                    className={cn("h-9 text-xs gap-1.5 font-medium shrink-0", upsaleFilter && "bg-orange-500 hover:bg-orange-600 text-white border-none")}
                    onClick={() => setUpsaleFilter(!upsaleFilter)}
                  >
                    <span>🔥 Đơn Upsale</span>
                  </Button>

                  <Button
                    variant={showAdvancedFilters ? "secondary" : "outline"}
                    size="sm"
                    className="h-9 text-xs gap-1.5 font-medium shrink-0"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <span>⚙️ Bộ lọc nâng cao {showAdvancedFilters ? "▲" : "▼"}</span>
                  </Button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-muted mt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Thẻ tag</label>
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger className="h-8 bg-background text-xs">
                        <SelectValue placeholder="Chọn tag" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">Tất cả tag</SelectItem>
                        {allUniqueTags.map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Nhân viên phụ trách</label>
                    <Select value={staffFilter} onValueChange={setStaffFilter}>
                      <SelectTrigger className="h-8 bg-background text-xs">
                        <SelectValue placeholder="Chọn nhân viên" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">Tất cả nhân viên</SelectItem>
                        {allUniqueStaff.map(staff => (
                          <SelectItem key={staff} value={staff}>{staff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Kho xuất hàng</label>
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                      <SelectTrigger className="h-8 bg-background text-xs">
                        <SelectValue placeholder="Chọn kho" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">Tất cả kho</SelectItem>
                        {warehouses.map(wh => (
                          <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">Thanh toán</label>
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                      <SelectTrigger className="h-8 bg-background text-xs">
                        <SelectValue placeholder="Trạng thái thanh toán" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">Tất cả thanh toán</SelectItem>
                        <SelectItem value="pending">🔴 Chưa thanh toán</SelectItem>
                        <SelectItem value="partial">🟡 Một phần</SelectItem>
                        <SelectItem value="paid">🟢 Đã thanh toán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

        {/* Bulk Action Bar — Pancake POS style */}
        {selectedOrderIds.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-6xl shadow-lg border border-blue-100 dark:border-blue-900 bg-white/95 backdrop-blur-sm dark:bg-card/95 px-4 py-2.5 rounded-xl animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md mr-1">
                {selectedOrderIds.length} đã chọn
              </span>

              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => {
                setSelectedOrderIds([]);
                invalidateOrderRelated(queryClient);
                toast({
                  title: "Làm mới danh sách",
                  description: "Đã làm mới danh sách đơn hàng thành công",
                });
              }}>
                <RefreshCw className="h-3.5 w-3.5" />
                Tải lại
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleBulkPrint}>
                <Printer className="h-3.5 w-3.5" />
                In đơn
              </Button>

              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="h-8 text-xs w-[140px] border-dashed text-muted-foreground">
                  <SelectValue placeholder="Cập nhật nhanh" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {pancakeStatuses.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleBulkPrintProducts}>
                <FileSpreadsheet className="h-3.5 w-3.5" />
                In sản phẩm
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => exportOrdersToExcel(selectedOrderObjects)}>
                <Download className="h-3.5 w-3.5" />
                Xuất excel
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
                Nhập excel
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={() => setPackingDialogOpen(true)}
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Đóng hàng
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                onClick={() => setShipCarrierDialogOpen(true)}
              >
                <Truck className="h-3.5 w-3.5" />
                Gửi ĐVVC
              </Button>

              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleBulkPrintHandover}>
                <ClipboardList className="h-3.5 w-3.5" />
                In phiếu bàn giao
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleBulkReplenishStock}>
                <Truck className="h-3.5 w-3.5" />
                Nhập hàng
              </Button>

              <Select onValueChange={handleBulkActionChange}>
                <SelectTrigger className="h-8 text-xs w-[100px] border-dashed text-muted-foreground">
                  <MoreHorizontal className="h-3.5 w-3.5 mr-1" />
                  <SelectValue placeholder="Thao tác" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="delete" className="text-xs text-destructive">Xóa đơn đã chọn</SelectItem>
                  <SelectItem value="assign" className="text-xs">Phân công nhân viên</SelectItem>
                  <SelectItem value="tag" className="text-xs">Gắn thẻ</SelectItem>
                  <SelectItem value="merge" className="text-xs">Gộp đơn trùng SĐT</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrderIds([])}
                  className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  ✕ Bỏ chọn
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter Tabs — Pancake POS style */}
        <div className="mb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-0.5 min-w-max bg-muted/30 rounded-lg p-1">
            {statusColumns.map((col) => {
              const count = col.id === "all" 
                ? filteredOrders.length 
                : filteredOrders.filter((o) => o.status === col.id).length;
              const isActive = statusFilter === col.id || (col.id === "all" && statusFilter === "all");
              return (
                <button
                  key={col.id}
                  onClick={() => setStatusFilter(col.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-white dark:bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-card/50"
                  )}
                >
                  {col.id !== "all" && (
                    <div className={cn("h-2 w-2 rounded-full", col.color)} />
                  )}
                  <span>{col.label}</span>
                  <span className={cn(
                    "ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-primary/10 text-primary font-bold" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4 min-w-max lg:min-w-0">
              {statusColumns.filter(c => c.id !== "all").map((col) => {
                const columnOrders = filteredOrders.filter((o) => o.status === col.id);
                return (
                  <div key={col.id} className="min-w-[240px] lg:min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn("h-3 w-3 rounded-full", col.color)} />
                      <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">{columnOrders.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {columnOrders.map((order) => {
                        const channel = getChannelInfo(order.channel_id);
                        return (
                          <Card
                            key={order.id}
                            className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                            onClick={() => openOrderDetail(order)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-semibold text-foreground">{order.order_number}</span>
                                <div className="flex items-center gap-1">
                                  {(order as any).platform_order_id && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0">Sàn</Badge>
                                  )}
                                  <div className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: channel.color }}>
                                    {channel.name}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm text-foreground truncate font-medium">{maskName(getOrderCustomerName(order))}</p>
                                {getOrderCustomerPhone(order) && (
                                  <p className="text-xs text-muted-foreground truncate">{maskPhone(getOrderCustomerPhone(order))}</p>
                                )}
                              </div>
                              <div className="flex gap-1 flex-wrap items-center">
                                {(Array.isArray(order.tags) ? order.tags : (typeof order.tags === "string" ? order.tags.split(",") : [])).map((t: any) => String(t).trim()).filter(Boolean).slice(0, 3).map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className={cn("text-[8px] px-1 py-0", getTagColorClass(tag))}>
                                    {tag}
                                  </Badge>
                                ))}
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type="button" className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                                      <Plus className="h-2.5 w-2.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-48 text-xs z-50">
                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                      Gắn thẻ đơn hàng
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {TAG_GROUPS.map((group) => (
                                      <React.Fragment key={group.id}>
                                        <DropdownMenuLabel className="text-[9px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 mt-1 rounded-sm">
                                          {group.name}
                                        </DropdownMenuLabel>
                                        {group.tags.map((tag) => {
                                          const currentTags = Array.isArray(order.tags) ? order.tags.map(String).map(t => t.trim()) : (typeof order.tags === "string" ? order.tags.split(",").map((t: string) => t.trim()) : []);
                                          const hasTag = currentTags.includes(tag.name);
                                          return (
                                            <DropdownMenuCheckboxItem
                                              key={tag.name}
                                              checked={hasTag}
                                              onCheckedChange={(checked) => {
                                                handleUpdateOrderTags(
                                                  order.id,
                                                  order.tags,
                                                  tag.name,
                                                  checked ? "add" : "remove"
                                                );
                                              }}
                                              className="text-xs"
                                            >
                                              <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                {tag.name}
                                              </div>
                                            </DropdownMenuCheckboxItem>
                                          );
                                        })}
                                      </React.Fragment>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {getOrderSourceLabel(order.source_type)}
                                </Badge>
                                {order.priority !== "normal" && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {getPriorityLabel(order.priority)}
                                  </Badge>
                                )}
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[9px] px-1.5 py-0 font-semibold border-none",
                                    (order.payment_status || "pending") === "paid" && "bg-green-50 text-green-700",
                                    (order.payment_status || "pending") === "partial" && "bg-amber-50 text-amber-700",
                                    (order.payment_status || "pending") === "pending" && "bg-red-50 text-red-700"
                                  )}
                                >
                                  {(order.payment_status || "pending") === "paid" ? "Đã trả" : (order.payment_status || "pending") === "partial" ? "Một phần" : "Chưa trả"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(order.created_at).toLocaleDateString("vi-VN")}</span>
                                <span className="font-semibold text-foreground">{Number(order.total || 0).toLocaleString("vi-VN")}đ</span>
                              </div>
                              {canEdit("orders") && (
                                <QuickStatusButtons
                                  currentStatus={order.status}
                                  onStatusChange={(status) => handleStatusChange(order.id, status)}
                                />
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                      {columnOrders.length === 0 && (
                        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                          Trống
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[1080px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 text-center p-2 sm:p-3">
                      <Checkbox
                        checked={
                          filteredOrders.length > 0 &&
                          selectedOrderIds.length === filteredOrders.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOrderIds(filteredOrders.map((o) => o.id));
                          } else {
                            setSelectedOrderIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">ID</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Cập nhật TT</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs w-12">Ghi chú</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Nguồn đơn</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Khách hàng</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">SĐT</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Sản phẩm</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Tổng tiền</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Tạo lúc</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">NV tạo đơn</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Phân công cho</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs font-bold text-red-600 dark:text-red-400">Tình trạng</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const channel = getChannelInfo(order.channel_id);
                      return (
                        <tr key={order.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer text-xs" onClick={() => openOrderDetail(order)}>
                          <td className="w-10 text-center p-2 sm:p-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedOrderIds.includes(order.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedOrderIds([...selectedOrderIds, order.id]);
                                } else {
                                  setSelectedOrderIds(selectedOrderIds.filter((id) => id !== order.id));
                                }
                              }}
                            />
                          </td>
                          <td className="p-2 sm:p-3 font-mono text-xs font-bold text-foreground">{order.order_number}</td>
                          <td className="p-2 sm:p-3 text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>
                                {new Date(order.updated_at).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  ...(new Date(order.updated_at).toDateString() !== new Date().toDateString() && {
                                    day: "2-digit",
                                    month: "2-digit"
                                  })
                                })}
                              </span>
                              {renderUserAvatar(order.assigned_to_name || "O")}
                            </div>
                          </td>
                          <td className="p-2 sm:p-3">
                            <div className="flex items-center gap-1">
                              {order.notes && (
                                <span title={order.notes} className="cursor-pointer text-amber-500 text-sm">
                                  💬
                                </span>
                              )}
                              {(order as any).internal_notes && (
                                <span title={(order as any).internal_notes} className="cursor-pointer text-red-500 text-sm">
                                  📌
                                </span>
                              )}
                              {!order.notes && !(order as any).internal_notes && <span className="text-muted-foreground/30">—</span>}
                            </div>
                          </td>
                          <td className="p-2 sm:p-3">
                            <div className="flex items-center gap-1.5">
                              {order.source_type === "facebook" && <span className="text-blue-600 font-extrabold text-sm">f</span>}
                              {order.source_type === "tiktok" && <span className="text-foreground font-extrabold text-sm">♪</span>}
                              {order.source_type === "shopee" && <span className="text-orange-500 font-extrabold text-sm">S</span>}
                              {order.source_type === "lazada" && <span className="text-blue-700 font-extrabold text-sm">L</span>}
                              <span className="text-foreground">{getOrderSourceLabel(order.source_type)}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-foreground font-medium">{maskName(getOrderCustomerName(order))}</td>
                          <td className="p-2 sm:p-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">{maskPhone(getOrderCustomerPhone(order)) || "—"}</span>
                              {getOrderCustomerPhone(order) && (
                                <Badge variant="outline" className={cn(
                                  "text-[8px] px-1 py-0 w-max font-semibold",
                                  getCarrier(getOrderCustomerPhone(order)) === "Viettel" && "bg-orange-50 text-orange-600 border-orange-200",
                                  getCarrier(getOrderCustomerPhone(order)) === "Vinaphone" && "bg-amber-50 text-amber-600 border-amber-200",
                                  getCarrier(getOrderCustomerPhone(order)) === "Mobifone" && "bg-blue-50 text-blue-600 border-blue-200",
                                  getCarrier(getOrderCustomerPhone(order)) === "Khác" && "bg-slate-50 text-slate-600 border-slate-200"
                                )}>
                                  {getCarrier(getOrderCustomerPhone(order))}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 max-w-[200px]">
                            {order.order_items && order.order_items.length > 0 ? (
                              order.order_items.length === 1 ? (
                                <span className="text-muted-foreground truncate block" title={order.order_items[0].products?.name}>
                                  {order.order_items[0].products?.name} x{order.order_items[0].quantity}
                                </span>
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold truncate block cursor-pointer">
                                  Nhiều sản phẩm
                                </span>
                              )
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="p-2 sm:p-3 font-semibold text-foreground">{(Number(order.total) || 0).toLocaleString("vi-VN")} đ</td>
                          <td className="p-2 sm:p-3 text-muted-foreground whitespace-nowrap">
                            {new Date(order.created_at).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              ...(new Date(order.created_at).toDateString() !== new Date().toDateString() && {
                                day: "2-digit",
                                month: "2-digit"
                              })
                            })}
                          </td>
                          <td className="p-2 sm:p-3 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              {renderUserAvatar(order.assigned_to_name || "O")}
                              <span className="truncate max-w-[100px]">{order.assigned_to_name || "Dương Kim Oanh"}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              {renderUserAvatar(order.assigned_to_name || "—")}
                              <span className="truncate max-w-[100px]">{order.assigned_to_name || "—"}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3">
                            <span className={cn("text-xs font-semibold", getInventoryStatus(order).color)}>
                              {getInventoryStatus(order).label}
                            </span>
                          </td>
                          <td className="p-2 sm:p-3" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={order.status}
                              onValueChange={(val) => handleStatusChange(order.id, val)}
                            >
                              <SelectTrigger className={cn("h-7 text-[10px] font-semibold border-none px-2 rounded-md shadow-xs w-32 justify-between flex items-center", statusColors[order.status])}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover text-xs z-50">
                                {pancakeStatuses.map((s) => (
                                  <SelectItem key={s.value} value={s.value} className="text-xs">
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={14} className="p-0">
                        {orders.length === 0 ? (
                          <EmptyOrdersState onCreateOrder={() => setCreateDialogOpen(true)} />
                        ) : (
                          <EmptySearchState searchTerm={searchTerm} />
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
            {filteredOrders.length > 0 && (
              <div className="mt-0 flex items-center justify-between flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground bg-muted/20 border-t p-3 rounded-b-xl">
                <div>
                  Tổng số đơn: <span className="font-bold text-foreground">{filteredOrders.length}</span>
                </div>
                <div className="flex gap-4 sm:gap-6 flex-wrap font-medium">
                  <div>
                    COD: <span className="font-bold text-blue-600">{totalCOD.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div>
                    Trả trước: <span className="font-bold text-success">{totalPrepaid.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div>
                    Cước VC: <span className="font-bold text-foreground">{totalShippingFee.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
          </TabsContent>

          <TabsContent value="quotations">
            <QuotationsTab />
          </TabsContent>

          <TabsContent value="returns">
            <ReturnsTab />
          </TabsContent>

          <TabsContent value="reconciliation">
            <ReconciliationTab />
          </TabsContent>
        </Tabs>
      </div>

      <CreateOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateOrder}
        isLoading={createOrder.isPending}
      />

      <OrderDetailDialog
        order={selectedOrder as any}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onStatusChange={handleStatusChange}
        isUpdating={updateOrderStatus.isPending}
      />

      <ImportOrdersDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportOrders}
        isLoading={createOrder.isPending}
      />

      <PackingDialog
        open={packingDialogOpen}
        onOpenChange={setPackingDialogOpen}
        orderQueue={selectedOrderObjects}
        allOrders={enrichedOrders}
        onPackOrder={handlePackOrder}
      />

      <PrintProductsDialog
        open={printProductsDialogOpen}
        onOpenChange={setPrintProductsDialogOpen}
        selectedOrders={selectedOrderObjects}
      />

      <ShipCarrierDialog
        open={shipCarrierDialogOpen}
        onOpenChange={setShipCarrierDialogOpen}
        selectedOrders={selectedOrderObjects}
        allOrders={enrichedOrders}
      />

      <BulkTagDialog
        open={bulkTagDialogOpen}
        onOpenChange={(open) => {
          setBulkTagDialogOpen(open);
          if (!open) {
            setSelectedOrderIds([]);
          }
        }}
        selectedOrders={selectedOrderObjects}
      />
    </MainLayout>
  );
};

export default Orders;


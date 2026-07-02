import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, List, LayoutGrid, Search, Filter, Eye, Download, Upload, ArrowRight, Bot, RotateCcw, FileText, Package, Printer, RefreshCw, ClipboardList, Truck, MoreHorizontal, PackageCheck, FileSpreadsheet, Scale } from "lucide-react";
import { PackingDialog } from "@/components/orders/PackingDialog";
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
import { ImportOrdersDialog } from "@/components/orders/ImportOrdersDialog";
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
import type { Tables } from "@/integrations/supabase/types";

type Order = HookOrder & {
  warehouses?: { id: string; name: string } | null;
  shipping_zones?: { id: string; name: string } | null;
};

const statusColumns = [
  { id: "all", label: "Tất cả", color: "bg-slate-500" },
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
  { value: "cancelled", label: "Huỷ đơn" },
  { value: "deleted", label: "Xoá đơn" },
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

  const { getUserRegion, canCreate, canEdit, canDelete } = usePermissions();
  const userRegion = getUserRegion();

  const paramSearch = searchParams.get("search") || stateSearchTerm;
  const paramStatus = searchParams.get("status") || "all";
  const paramChannel = searchParams.get("channel") || "all";

  const [searchTerm, setSearchTerm] = useState(paramSearch);
  const [statusFilter, setStatusFilter] = useState<string>(paramStatus);
  const [channelFilter, setChannelFilter] = useState<string>(paramChannel);
  const [regionFilter, setRegionFilter] = useState<string>("all");

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
  }, [searchParams]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  
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
      
      return matchesSearch && matchesStatus && matchesChannel && matchesDate && matchesRegion;
    });
  }, [enrichedOrders, searchTerm, statusFilter, channelFilter, startDate, endDate, regionFilter]);

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
    await createOrder.mutateAsync(data);
    setCreateDialogOpen(false);
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
      toast({
        title: "Đã cập nhật thẻ",
        description: `Đã cập nhật thẻ (tags) cho ${selectedOrderIds.length} đơn hàng thành công.`,
      });
      setSelectedOrderIds([]);
    }
  };

  const handleBulkPrintProducts = () => {
    if (selectedOrderIds.length === 0) return;
    const productMap: Record<string, { sku: string; name: string; quantity: number }> = {};
    selectedOrderObjects.forEach((order) => {
      const items = order.order_items || [];
      items.forEach((item) => {
        const sku = item.products?.sku || "N/A";
        const name = item.products?.name || "Sản phẩm không tên";
        const qty = item.quantity || 0;
        if (productMap[sku]) {
          productMap[sku].quantity += qty;
        } else {
          productMap[sku] = { sku, name, quantity: qty };
        }
      });
    });
    const aggregatedProducts = Object.values(productMap);
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;
    const productRows = aggregatedProducts
      .map(
        (prod, idx) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${prod.sku}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${prod.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 14px; font-weight: bold; color: #2563eb;">${prod.quantity}</td>
        </tr>`
      )
      .join("");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Danh sách tổng hợp sản phẩm nhặt hàng</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
          h2 { text-align: center; margin-bottom: 5px; }
          .meta { text-align: center; color: #666; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          .footer { margin-top: 30px; text-align: right; font-style: italic; font-size: 12px; }
        </style>
      </head>
      <body>
        <h2>DANH SÁCH TỔNG HỢP SẢN PHẨM CẦN NHẶT</h2>
        <div class="meta">Tổng số đơn hàng chọn: ${selectedOrderIds.length} | Ngày in: ${new Date().toLocaleString("vi-VN")}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">STT</th>
              <th style="width: 150px;">Mã sản phẩm (SKU)</th>
              <th>Tên sản phẩm</th>
              <th style="width: 100px; text-align: center;">Số lượng tổng</th>
            </tr>
          </thead>
          <tbody>
            ${productRows.length > 0 ? productRows : '<tr><td colspan="4" style="text-align:center; padding: 20px;">Không có sản phẩm nào</td></tr>'}
          </tbody>
        </table>
        <div class="footer">Người in: Hệ thống ERP Local Mini</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
                </div>
              </div>
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
                                <p className="text-sm text-foreground truncate">{getOrderCustomerName(order)}</p>
                                {getOrderCustomerPhone(order) && (
                                  <p className="text-xs text-muted-foreground truncate">{getOrderCustomerPhone(order)}</p>
                                )}
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
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Nguồn đơn</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Mã vận đơn</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Mã vận đơn phụ</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">NV đang xem</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">VC</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Thẻ</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs w-16">Ghi chú</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Khách hàng</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">SĐT</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground text-xs">Nhận hàng</th>
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
                            {new Date(order.updated_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                          </td>
                          <td className="p-2 sm:p-3">
                            <div className="flex items-center gap-1.5">
                              {order.source_type === "facebook" && <span className="text-blue-600 font-bold">f</span>}
                              {order.source_type === "tiktok" && <span className="text-foreground">♪</span>}
                              {order.source_type === "shopee" && <span className="text-orange-500 font-bold">S</span>}
                              {order.source_type === "lazada" && <span className="text-blue-700 font-bold">L</span>}
                              <span className="text-foreground">{getOrderSourceLabel(order.source_type)}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 font-mono text-[10px] text-muted-foreground">
                            {(order as any).tracking_code || "—"}
                          </td>
                          <td className="p-2 sm:p-3 font-mono text-[10px] text-muted-foreground">
                            {(order as any).secondary_tracking_code || "—"}
                          </td>
                          <td className="p-2 sm:p-3 text-muted-foreground">
                            {(order as any).viewing_staff || "—"}
                          </td>
                          <td className="p-2 sm:p-3">
                            {order.shipping_zones?.name ? (
                              <Badge className={cn("text-[9px] px-1.5 py-0 font-bold text-white", 
                                order.shipping_zones.name.includes("GHTK") ? "bg-green-600" :
                                order.shipping_zones.name.includes("GHN") ? "bg-orange-500" :
                                order.shipping_zones.name.includes("VNP") ? "bg-blue-500" :
                                order.shipping_zones.name.includes("LZD") ? "bg-sky-500" :
                                "bg-slate-500"
                              )}>
                                {order.shipping_zones.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="p-2 sm:p-3">
                            {(order as any).tags ? (
                              <div className="flex gap-0.5 flex-wrap">
                                {String((order as any).tags).split(",").slice(0, 2).map((tag: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-[8px] px-1 py-0 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="p-2 sm:p-3 max-w-[100px]">
                            {order.notes ? (
                              <span className="text-amber-600 dark:text-amber-400 truncate block" title={order.notes}>
                                {order.notes.length > 15 ? order.notes.slice(0, 15) + "..." : order.notes}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="p-2 sm:p-3 text-foreground font-medium">{getOrderCustomerName(order)}</td>
                          <td className="p-2 sm:p-3 text-muted-foreground whitespace-nowrap">{getOrderCustomerPhone(order) || "—"}</td>
                          <td className="p-2 sm:p-3 max-w-[180px]">
                            <span className="text-muted-foreground truncate block text-[10px]" title={(order as any).shipping_address || ""}>
                              {(order as any).shipping_address ? (
                                (order as any).shipping_address.length > 30 
                                  ? (order as any).shipping_address.slice(0, 30) + "..." 
                                  : (order as any).shipping_address
                              ) : "—"}
                            </span>
                          </td>
                          <td className="p-2 sm:p-3">
                            <Badge className={cn("text-[10px] px-1.5 py-0.5", statusColors[order.status])}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
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
      />

      <PackingDialog
        open={packingDialogOpen}
        onOpenChange={setPackingDialogOpen}
        orderQueue={selectedOrderObjects}
        allOrders={enrichedOrders}
        onPackOrder={handlePackOrder}
      />
    </MainLayout>
  );
};

export default Orders;


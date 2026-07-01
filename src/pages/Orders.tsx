import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, LayoutGrid, Search, Filter, Eye, Download, Upload, ArrowRight, Bot, RotateCcw, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOrders, type Order as HookOrder } from "@/hooks/useOrders";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useShippingZones } from "@/hooks/useShippingZones";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { QuickStatusButtons } from "@/components/orders/QuickStatusButtons";
import { exportOrdersToExcel } from "@/lib/exportExcel";
import { StatsCardsSkeleton, OrdersKanbanSkeleton, OrdersListSkeleton } from "@/components/ui/page-skeleton";
import { EmptyOrdersState, EmptySearchState } from "@/components/ui/empty-state";
import { ReturnsTab } from "@/components/orders/ReturnsTab";
import { PlatformSyncPanel } from "@/components/orders/PlatformSyncPanel";
import { OrderAIAssistant } from "@/components/ai/OrderAIAssistant";
import { QuotationsTab } from "@/components/orders/QuotationsTab";
import { ImportOrdersDialog } from "@/components/orders/ImportOrdersDialog";
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
  { id: "pending", label: "Chờ xử lý", color: "bg-warning" },
  { id: "confirmed", label: "Đã xác nhận", color: "bg-info" },
  { id: "processing", label: "Đang xử lý", color: "bg-primary" },
  { id: "shipping", label: "Đang giao", color: "bg-purple-500" },
  { id: "delivered", label: "Đã giao", color: "bg-success" },
];

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-info/10 text-info border-info/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipping: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  returned: "Hoàn hàng",
  null: "N/A",
};

const Orders = () => {
  const location = useLocation();
  const stateSearchTerm = (location.state as any)?.searchTerm || "";

  const [searchParams] = useSearchParams();
  const defaultView = searchParams.get("view") === "list" ? "list" : "kanban";
  const [viewMode, setViewMode] = useState<"kanban" | "list">(defaultView);
  const [activeTab, setActiveTab] = useState("orders");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const paramSearch = searchParams.get("search") || stateSearchTerm;
  const paramStatus = searchParams.get("status") || "all";
  const paramChannel = searchParams.get("channel") || "all";

  const [searchTerm, setSearchTerm] = useState(paramSearch);
  const [statusFilter, setStatusFilter] = useState<string>(paramStatus);
  const [channelFilter, setChannelFilter] = useState<string>(paramChannel);

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
  }, [searchParams]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
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
      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [enrichedOrders, searchTerm, statusFilter, channelFilter]);

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

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
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

                <div className="flex items-center gap-2">
                  <OrderAIAssistant 
                    orderContext={`Tổng ${orders.length} đơn hàng. ${filteredOrders.filter(o => o.status === 'pending').length} chờ xử lý, ${filteredOrders.filter(o => o.status === 'shipping').length} đang giao.`}
                  />
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="w-full sm:w-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" onClick={() => exportOrdersToExcel(filteredOrders)} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo đơn hàng
                  </Button>
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
                </div>
              </div>
            </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
          {statusColumns.map((col) => {
            const count = filteredOrders.filter((o) => o.status === col.id).length;
            return (
              <Card key={col.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(col.id)}>
                <CardContent className="p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                  <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center", col.color)}>
                    <span className="text-white font-bold text-sm sm:text-base">{count}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground truncate">{col.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex lg:grid lg:grid-cols-5 gap-4 min-w-max lg:min-w-0">
              {statusColumns.map((col) => {
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
                              <QuickStatusButtons
                                currentStatus={order.status}
                                onStatusChange={(status) => handleStatusChange(order.id, status)}
                              />
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
                  <tr className="border-b border-border">
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Mã đơn</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Khách hàng</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Nguồn</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Kênh</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Trạng thái</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Thanh toán</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Kho</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Loại</th>
                    <th className="text-right p-3 sm:p-4 font-medium text-muted-foreground text-sm">Tổng tiền</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Ngày</th>
                    <th className="text-center p-3 sm:p-4 font-medium text-muted-foreground text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const channel = getChannelInfo(order.channel_id);
                      return (
                        <tr key={order.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => openOrderDetail(order)}>
                          <td className="p-3 sm:p-4 font-mono text-sm font-medium text-foreground">{order.order_number}</td>
                          <td className="p-3 sm:p-4 text-sm text-foreground">
                            <div className="font-medium">{getOrderCustomerName(order)}</div>
                            {getOrderCustomerPhone(order) && (
                              <div className="text-xs text-muted-foreground">{getOrderCustomerPhone(order)}</div>
                            )}
                          </td>
                          <td className="p-3 sm:p-4">
                            <Badge variant="secondary" className="text-xs">
                              {getOrderSourceLabel(order.source_type)}
                            </Badge>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="px-2 py-0.5 rounded text-xs font-medium text-white inline-block" style={{ backgroundColor: channel.color }}>
                              {channel.name}
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <Badge className={cn("text-xs", statusColors[order.status])}>
                              {statusLabels[order.status]}
                            </Badge>
                          </td>
                          <td className="p-3 sm:p-4 text-sm text-foreground">
                            <div>{getPaymentMethodLabel(order.payment_method)}</div>
                            <div className="text-xs text-muted-foreground">{order.payment_status || "unpaid"}</div>
                          </td>
                          <td className="p-3 sm:p-4 text-sm text-foreground">{order.warehouses?.name || "Chưa chọn"}</td>
                          <td className="p-3 sm:p-4 text-sm text-foreground">{order.order_type === "b2c" ? "B2C" : "B2B"}</td>
                          <td className="p-3 sm:p-4 text-sm font-semibold text-foreground text-right">{Number(order.total || 0).toLocaleString("vi-VN")}đ</td>
                          <td className="p-3 sm:p-4 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString("vi-VN")}</td>
                          <td className="p-3 sm:p-4 text-center">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-0">
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
          </Card>
        )}
          </TabsContent>

          <TabsContent value="quotations">
            <QuotationsTab />
          </TabsContent>

          <TabsContent value="returns">
            <ReturnsTab />
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
    </MainLayout>
  );
};

export default Orders;


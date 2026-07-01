import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVouchers, type Voucher } from "@/hooks/useVouchers";
import { useOrders } from "@/hooks/useOrders";
import { format } from "date-fns";
import {
  Ticket, Plus, Search, Trash2, Calendar, Sparkles, Percent, DollarSign,
  TrendingUp, Users, CheckCircle, Clock, AlertCircle, ShoppingCart, Eye, Edit2
} from "lucide-react";

export default function Promotions() {
  const { vouchers, isLoading, createVoucher, updateVoucher, deleteVoucher } = useVouchers();
  const { orders } = useOrders();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "scheduled" | "expired">("all");

  // Form State for Create/Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isAutoApply, setIsAutoApply] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [targetGroup, setTargetGroup] = useState<"all" | "loyalty" | "wholesale">("all");
  const [promoType, setPromoType] = useState<"order_discount" | "free_shipping" | "buy_x_get_y">("order_discount");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenCreate = () => {
    setIsEditing(false);
    setName("");
    setCode("");
    setIsAutoApply(false);
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderValue("");
    setMaxDiscount("");
    setUsageLimit("");
    setTargetGroup("all");
    setPromoType("order_discount");
    setStartDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setEndDate(format(new Date(Date.now() + 30 * 24 * 3600 * 1000), "yyyy-MM-dd'T'HH:mm"));
    setDescription("");
    setCreateOpen(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setIsEditing(true);
    setEditId(v.id);
    setName(v.name);
    setCode(v.code);
    setIsAutoApply(v.is_auto_apply ?? false);
    setDiscountType(v.discount_type);
    setDiscountValue(v.discount_value.toString());
    setMinOrderValue(v.min_order_value?.toString() || "");
    setMaxDiscount(v.max_discount?.toString() || "");
    setUsageLimit(v.usage_limit?.toString() || "");
    setTargetGroup(v.target_customer_group ?? "all");
    setPromoType(v.promo_type ?? "order_discount");
    setStartDate(v.start_date ? format(new Date(v.start_date), "yyyy-MM-dd'T'HH:mm") : "");
    setEndDate(v.end_date ? format(new Date(v.end_date), "yyyy-MM-dd'T'HH:mm") : "");
    setDescription(v.description || "");
    setCreateOpen(true);
  };

  const handleOpenDetail = (v: Voucher) => {
    setSelectedVoucher(v);
    setDetailOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const resolvedCode = isAutoApply ? `AUTO-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : code.trim().toUpperCase();
    if (!isAutoApply && !resolvedCode) return;

    const payload = {
      name: name.trim(),
      code: resolvedCode,
      discount_type: discountType,
      discount_value: Number(discountValue) || 0,
      min_order_value: minOrderValue ? Number(minOrderValue) : undefined,
      max_discount: maxDiscount ? Number(maxDiscount) : undefined,
      usage_limit: usageLimit ? Number(usageLimit) : undefined,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      is_active: true,
      description: description.trim(),
      is_auto_apply: isAutoApply,
      target_customer_group: targetGroup,
      promo_type: promoType,
    };

    if (isEditing) {
      updateVoucher.mutate({ id: editId, ...payload });
    } else {
      createVoucher.mutate(payload);
    }
    setCreateOpen(false);
  };

  // Usage history of selected voucher
  const voucherUsageHistory = useMemo(() => {
    if (!selectedVoucher) return [];
    return orders.filter(o => o.voucher_id === selectedVoucher.id);
  }, [orders, selectedVoucher]);

  // Dynamically compute the usage count of each voucher from orders list to ensure perfect sync
  const computedUsedCount = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.voucher_id) {
        counts[o.voucher_id] = (counts[o.voucher_id] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  // Helper to determine status dynamically based on current time
  const getPromoStatus = (v: Voucher): "active" | "scheduled" | "expired" => {
    if (!v.is_active) return "expired";
    const now = new Date();
    if (v.start_date && new Date(v.start_date) > now) return "scheduled";
    if (v.end_date && new Date(v.end_date) < now) return "expired";
    const actualUsed = computedUsedCount[v.id] || 0;
    if (v.usage_limit && actualUsed >= v.usage_limit) return "expired";
    return "active";
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const matchesSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.code.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      const status = getPromoStatus(v);
      if (activeTab === "active" && status !== "active") return false;
      if (activeTab === "scheduled" && status !== "scheduled") return false;
      if (activeTab === "expired" && status !== "expired") return false;

      return true;
    });
  }, [vouchers, search, activeTab, computedUsedCount]);

  // Statistics
  const stats = useMemo(() => {
    const activeCount = vouchers.filter(v => getPromoStatus(v) === "active").length;
    const scheduledCount = vouchers.filter(v => getPromoStatus(v) === "scheduled").length;
    
    // Calculate total discounts and aggregate usage
    let totalUsage = 0;
    let totalDiscounts = 0;
    
    orders.forEach(o => {
      if (o.voucher_id) {
        totalUsage += 1;
        totalDiscounts += Number(o.discount || 0);
      }
    });

    return { activeCount, scheduledCount, totalUsage, totalDiscounts };
  }, [vouchers, orders]);

  return (
    <MainLayout>
      <Header title="Khuyến mãi & Ưu đãi" subtitle="Thiết lập chiến dịch, mã giảm giá và bộ máy tự động chiết khấu 100%" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-xs border-border">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiến dịch đang chạy</p>
                <h3 className="text-2xl font-bold mt-1 text-green-500">{stats.activeCount}</h3>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10"><CheckCircle className="h-5 w-5 text-green-500" /></div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-xs border-border">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiến dịch chờ chạy</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-500">{stats.scheduledCount}</h3>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10"><Clock className="h-5 w-5 text-blue-500" /></div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-xs border-border">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng số lượt áp dụng thực tế</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">{stats.totalUsage}</h3>
              </div>
              <div className="p-3 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-xs border-border">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng chi phí giảm thực tế</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-500">{stats.totalDiscounts.toLocaleString()}đ</h3>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10"><DollarSign className="h-5 w-5 text-amber-500" /></div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and List */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                onClick={() => setActiveTab("all")}
                size="sm"
              >
                Tất cả ({vouchers.length})
              </Button>
              <Button
                variant={activeTab === "active" ? "default" : "outline"}
                onClick={() => setActiveTab("active")}
                size="sm"
              >
                Đang chạy ({vouchers.filter(v => getPromoStatus(v) === "active").length})
              </Button>
              <Button
                variant={activeTab === "scheduled" ? "default" : "outline"}
                onClick={() => setActiveTab("scheduled")}
                size="sm"
              >
                Chưa chạy ({vouchers.filter(v => getPromoStatus(v) === "scheduled").length})
              </Button>
              <Button
                variant={activeTab === "expired" ? "default" : "outline"}
                onClick={() => setActiveTab("expired")}
                size="sm"
              >
                Hết hạn ({vouchers.filter(v => getPromoStatus(v) === "expired").length})
              </Button>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Tìm kiếm khuyến mãi..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={handleOpenCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Tạo chiến dịch
              </Button>
            </div>
          </div>

          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã / Chương trình</TableHead>
                  <TableHead>Hình thức</TableHead>
                  <TableHead>Mức chiết khấu</TableHead>
                  <TableHead>Áp dụng từ</TableHead>
                  <TableHead>Lượt dùng</TableHead>
                  <TableHead>Thời gian chạy</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Đang tải chiến dịch khuyến mãi...
                    </TableCell>
                  </TableRow>
                ) : filteredVouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Chưa có chiến dịch nào được cấu hình
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVouchers.map(v => {
                    const status = getPromoStatus(v);
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                                {v.code}
                              </span>
                              {v.is_auto_apply && (
                                <Badge className="bg-primary/20 text-primary border-none">
                                  Tự động
                                </Badge>
                              )}
                            </div>
                            <div className="font-medium mt-1">{v.name}</div>
                            {v.description && <div className="text-xs text-muted-foreground max-w-[200px] truncate">{v.description}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {v.promo_type === "free_shipping" ? "Miễn phí ship" : "Giảm giá đơn hàng"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {v.discount_value.toLocaleString()}{v.discount_type === "percentage" ? "%" : "đ"}
                          {v.max_discount && <div className="text-xs font-normal text-muted-foreground">Tối đa {v.max_discount.toLocaleString()}đ</div>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {v.min_order_value ? `Đơn từ ${v.min_order_value.toLocaleString()}đ` : "Mọi đơn hàng"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium hover:underline text-primary"
                            onClick={() => handleOpenDetail(v)}
                          >
                            {v.used_count || 0} / {v.usage_limit || "∞"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {v.start_date ? format(new Date(v.start_date), "dd/MM/yyyy HH:mm") : "Bắt đầu ngay"}
                          </div>
                          <div>
                            Đến: {v.end_date ? format(new Date(v.end_date), "dd/MM/yyyy HH:mm") : "Không giới hạn"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {status === "active" && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                              Đang chạy
                            </Badge>
                          )}
                          {status === "scheduled" && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                              Chưa chạy
                            </Badge>
                          )}
                          {status === "expired" && (
                            <Badge className="bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400 border-none">
                              Hết hạn / Khóa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDetail(v)}
                              title="Xem chi tiết & Lịch sử sử dụng"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(v)}
                              title="Chỉnh sửa thiết lập"
                            >
                              <Edit2 className="h-4 w-4 text-primary" />
                            </Button>
                            <Switch
                              checked={v.is_active}
                              onCheckedChange={(checked) => updateVoucher.mutate({ id: v.id, is_active: checked })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteVoucher.mutate(v.id)}
                              title="Xóa khuyến mãi"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Creation & Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg bg-popover text-popover-foreground z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isEditing ? "Cập nhật Thiết lập Khuyến mãi" : "Thiết lập Chiến dịch Khuyến mãi"}
            </DialogTitle>
            <DialogDescription>Cấu hình các điều kiện áp dụng, chiết khấu và tự động kích hoạt chiến dịch.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Tên chiến dịch</Label>
              <Input
                placeholder="Ví dụ: Ưu đãi ngày hè, Giảm giá cuối tháng..."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label>Tự động áp dụng</Label>
                <p className="text-xs text-muted-foreground">Tự chiết khấu vào đơn hàng mà không cần khách nhập mã.</p>
              </div>
              <Switch checked={isAutoApply} onCheckedChange={setIsAutoApply} />
            </div>

            {!isAutoApply && (
              <div className="space-y-2">
                <Label>Mã khuyến mãi (Voucher Code)</Label>
                <Input
                  className="font-mono uppercase"
                  placeholder="Ví dụ: NHAPHA2026, VIP10..."
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  disabled={isEditing} // Code should be immutable once created
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Loại khuyến mãi</Label>
                <Select value={promoType} onValueChange={(val: any) => setPromoType(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order_discount">Giảm giá đơn hàng</SelectItem>
                    <SelectItem value="free_shipping">Miễn phí ship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Đối tượng khách hàng</Label>
                <Select value={targetGroup} onValueChange={(val: any) => setTargetGroup(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả khách hàng</SelectItem>
                    <SelectItem value="loyalty">Khách thiết lập Loyalty</SelectItem>
                    <SelectItem value="wholesale">Khách mua sỉ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Hình thức giảm</Label>
                <Select value={discountType} onValueChange={(val: any) => setDiscountType(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Giảm theo %</SelectItem>
                    <SelectItem value="fixed">Giảm số tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mức giảm giá ({discountType === "percentage" ? "%" : "đ"})</Label>
                <Input
                  type="number"
                  placeholder={discountType === "percentage" ? "10" : "50000"}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Đơn tối thiểu (đ)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minOrderValue}
                  onChange={e => setMinOrderValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Giảm tối đa (đ)</Label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  value={maxDiscount}
                  onChange={e => setMaxDiscount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Giới hạn lượt dùng</Label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Thời gian bắt đầu</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Thời gian kết thúc</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả chi tiết</Label>
              <Input
                placeholder="Ghi chú thêm về chương trình khuyến mãi..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={createVoucher.isPending || updateVoucher.isPending}>
              {isEditing ? "Cập nhật" : "Kích hoạt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details & History Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl bg-popover text-popover-foreground z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Ticket className="h-5.5 w-5.5 text-primary" /> Chi tiết & Lịch sử sử dụng
            </DialogTitle>
            <DialogDescription>
              Xem chi tiết thiết lập và thống kê khách hàng đã áp dụng mã khuyến mãi này.
            </DialogDescription>
          </DialogHeader>

          {selectedVoucher && (
            <Tabs defaultValue="history" className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Thiết lập chi tiết</TabsTrigger>
                <TabsTrigger value="history">Lịch sử khách mua ({voucherUsageHistory.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm bg-muted/20 p-4 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground block text-xs">Tên chiến dịch</span>
                    <span className="font-semibold text-foreground text-base">{selectedVoucher.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Mã ưu đãi / Voucher Code</span>
                    <span className="font-mono font-bold text-sm bg-secondary px-2 py-0.5 rounded text-secondary-foreground inline-block mt-0.5">
                      {selectedVoucher.code}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Phương thức áp dụng</span>
                    <span className="font-medium">
                      {selectedVoucher.is_auto_apply ? "Tự động áp dụng khi đủ điều kiện" : "Khách nhập mã thủ công"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Hình thức chiết khấu</span>
                    <span className="font-medium">
                      {selectedVoucher.promo_type === "free_shipping" ? "Miễn phí vận chuyển" : "Giảm giá trị đơn hàng"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Giá trị ưu đãi</span>
                    <span className="font-semibold text-primary text-base">
                      {selectedVoucher.discount_value.toLocaleString()}
                      {selectedVoucher.discount_type === "percentage" ? "%" : "đ"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Điều kiện đơn tối thiểu</span>
                    <span className="font-medium text-foreground">
                      {selectedVoucher.min_order_value ? `${selectedVoucher.min_order_value.toLocaleString()}đ` : "Không giới hạn"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Giới hạn số lần dùng</span>
                    <span className="font-medium text-foreground">
                      {selectedVoucher.used_count} đã dùng / {selectedVoucher.usage_limit || "Không giới hạn"} lượt
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Trạng thái thời gian</span>
                    <span className="font-medium text-foreground">
                      {selectedVoucher.start_date ? format(new Date(selectedVoucher.start_date), "dd/MM/yyyy HH:mm") : "Bắt đầu ngay"}{" - "}
                      {selectedVoucher.end_date ? format(new Date(selectedVoucher.end_date), "dd/MM/yyyy HH:mm") : "Không giới hạn"}
                    </span>
                  </div>
                  {selectedVoucher.description && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs">Mô tả</span>
                      <span className="text-muted-foreground">{selectedVoucher.description}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="py-4">
                <div className="border rounded-lg max-h-[40vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead className="text-right">Mức giảm</TableHead>
                        <TableHead className="text-right">Giá trị đơn</TableHead>
                        <TableHead>Ngày sử dụng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucherUsageHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                            Chưa có đơn hàng nào áp dụng khuyến mãi này.
                          </TableCell>
                        </TableRow>
                      ) : (
                        voucherUsageHistory.map(order => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs font-semibold">{order.order_number}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{order.customer_name || "Khách lẻ"}</div>
                                {order.customer_phone && <div className="text-[10px] text-muted-foreground">{order.customer_phone}</div>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-destructive text-sm">
                              -{order.discount?.toLocaleString() || 0}đ
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">
                              {order.total?.toLocaleString() || 0}đ
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

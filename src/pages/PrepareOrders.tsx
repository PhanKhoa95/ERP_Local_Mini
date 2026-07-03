import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  PackageCheck, Check, Clock, Search, RefreshCw, AlertTriangle, Settings, 
  Truck, Calendar, ShoppingCart, ShieldAlert, CheckSquare, Printer
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { toast } from "sonner";

interface MarketOrder {
  id: string;
  order_number: string;
  customer_name: string;
  platform: "shopee" | "tiktok" | "lazada";
  sku: string;
  qty: number;
  total_price: number;
  status: "pending" | "packing" | "shipped";
  created_at: string;
  tracking_code?: string;
}

export default function PrepareOrders() {
  const { orders = [] } = useOrders();
  
  // Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("manual");
  
  // Dialog State
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Form State
  const [pickupSlot, setPickupSlot] = useState("afternoon");
  const [shippingMethod, setShippingMethod] = useState("pickup");
  
  // Mock Marketplace Orders waiting for confirmation
  const [marketOrders, setMarketOrders] = useState<MarketOrder[]>([]);

  // Auto configuration states
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [autoConfirmTime, setAutoConfirmTime] = useState("14:00");
  const [autoPickupSlot, setAutoPickupSlot] = useState("afternoon");
  const [autoShippingMethod, setAutoShippingMethod] = useState("pickup");
  const [autoTiktokLabel, setAutoTiktokLabel] = useState(true);
  const [autoShopeeLabel, setAutoShopeeLabel] = useState(true);
  
  const [workdays, setWorkdays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  // Seed Data: Mock new marketplace orders
  useEffect(() => {
    const raw = localStorage.getItem("erp-mini-local-demo-new-market-orders");
    if (!raw) {
      const seed: MarketOrder[] = [
        {
          id: "m-ord-1",
          order_number: "SHP-7839210-90",
          customer_name: "Nguyễn Văn Tuấn",
          platform: "shopee",
          sku: "PRD-STICKER (15 cái)",
          qty: 1,
          total_price: 180000,
          status: "pending",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "m-ord-2",
          order_number: "TKT-3829103-11",
          customer_name: "Trần Thị Mai",
          platform: "tiktok",
          sku: "PRD-CARD (30 cái)",
          qty: 1,
          total_price: 85000,
          status: "pending",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: "m-ord-3",
          order_number: "LZD-1029482-77",
          customer_name: "Lê Hoàng Nam",
          platform: "lazada",
          sku: "PRD-COMBO-NEW",
          qty: 2,
          total_price: 700000,
          status: "pending",
          created_at: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      ];
      localStorage.setItem("erp-mini-local-demo-new-market-orders", JSON.stringify(seed));
      setMarketOrders(seed);
    } else {
      setMarketOrders(JSON.parse(raw));
    }
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(marketOrders.filter(o => o.status === "pending").map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds([...selectedOrderIds, id]);
    } else {
      setSelectedOrderIds(selectedOrderIds.filter(item => item !== id));
    }
  };

  const handleConfirmOrders = () => {
    // Confirm and generate tracking code
    const updated = marketOrders.map(o => {
      if (selectedOrderIds.includes(o.id)) {
        return {
          ...o,
          status: "packing" as const,
          tracking_code: `${o.platform === "shopee" ? "SPX" : o.platform === "tiktok" ? "JNT" : "LEX"}-${Math.floor(100000000 + Math.random() * 900000000)}`
        };
      }
      return o;
    });

    localStorage.setItem("erp-mini-local-demo-new-market-orders", JSON.stringify(updated));
    setMarketOrders(updated);
    toast.success(`Đã chuẩn bị hàng thành công cho ${selectedOrderIds.length} đơn hàng sàn. Mã vận đơn đã được đẩy lên sàn!`);
    setSelectedOrderIds([]);
    setConfirmDialogOpen(false);
  };

  const handleSaveAutoConfig = () => {
    toast.success("Đã cập nhật cấu hình tự động chuẩn bị hàng sàn thành công!");
  };

  return (
    <MainLayout>
      <Header 
        title="Chuẩn bị đơn hàng sàn TMĐT" 
        subtitle="Xác nhận đơn hàng Shopee, TikTok Shop, Lazada hàng loạt, cấp mã vận đơn gửi lên sàn và cấu hình tự động xác nhận đơn." 
      />

      <div className="p-4 sm:p-6 space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-muted/65 mb-4">
            <TabsTrigger value="manual" className="text-xs font-bold">⚡ Chuẩn bị hàng loạt</TabsTrigger>
            <TabsTrigger value="auto" className="text-xs font-bold">⚙️ Cấu hình tự động</TabsTrigger>
          </TabsList>

          {/* TAB 1: MANUAL BULK CONFIRMATION */}
          <TabsContent value="manual" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Button
                disabled={selectedOrderIds.length === 0}
                onClick={() => setConfirmDialogOpen(true)}
                className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold h-9 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PackageCheck className="h-4 w-4" /> Chuẩn bị hàng loạt {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length} đơn)` : ""}
              </Button>

              <div className="text-xs text-muted-foreground font-semibold">
                Đã chọn {selectedOrderIds.length} đơn hàng chờ xử lý
              </div>
            </div>

            <Card className="border-border">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedOrderIds.length === marketOrders.filter(o => o.status === "pending").length && marketOrders.filter(o => o.status === "pending").length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Mã đơn sàn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sàn</TableHead>
                    <TableHead>Sản phẩm (SKU)</TableHead>
                    <TableHead className="text-right">Tổng thanh toán</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Mã vận đơn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs italic">
                        Không có đơn hàng nào chờ chuẩn bị.
                      </TableCell>
                    </TableRow>
                  ) : (
                    marketOrders.map(ord => {
                      const isSelected = selectedOrderIds.includes(ord.id);

                      return (
                        <TableRow key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <TableCell>
                            {ord.status === "pending" ? (
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectOne(ord.id, !!checked)}
                              />
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <Check className="h-2.5 w-2.5" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-foreground">{ord.order_number}</TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">{ord.customer_name}</TableCell>
                          <TableCell>
                            <Badge className={
                              ord.platform === "shopee" ? "bg-orange-50 text-orange-700 border-none px-2 text-[9px] font-bold" :
                              ord.platform === "tiktok" ? "bg-slate-950 text-white border-none px-2 text-[9px] font-bold" :
                              "bg-blue-50 text-blue-700 border-none px-2 text-[9px] font-bold"
                            }>
                              {ord.platform === "shopee" ? "Shopee" : ord.platform === "tiktok" ? "TikTok Shop" : "Lazada"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-medium text-foreground">{ord.sku}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Số lượng: {ord.qty}</div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs text-foreground">
                            {ord.total_price.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              ord.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-250" : "bg-green-50 text-green-700 border border-green-200"
                            }>
                              {ord.status === "pending" ? "Chờ xác nhận" : "Đã xác nhận"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-indigo-600 font-bold">
                            {ord.tracking_code || <span className="text-muted-foreground italic">Chưa cấp</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: AUTOMATIC RUNNERS AND PRINT LABEL SETUPS */}
          <TabsContent value="auto" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Confirmation Schedule */}
              <div className="lg:col-span-8 space-y-4">
                <Card className="border-border">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Settings className="h-4.5 w-4.5 text-indigo-550" /> Cài đặt lịch tự động chuẩn bị hàng sàn
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Thiết lập giờ cố định để hệ thống tự động xác nhận đơn hàng từ sàn gửi về và cấp vận đơn, không cần nhân sự trực tuyến.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
                    
                    <div className="flex items-center justify-between pb-3 border-b">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Tự động chuẩn bị đơn sàn:</Label>
                        <p className="text-[10px] text-muted-foreground">Kích hoạt chế độ xác nhận tự động hàng ngày.</p>
                      </div>
                      <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
                    </div>

                    {autoConfirm && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Giờ chạy tự động hàng ngày:</Label>
                            <Input 
                              type="time" 
                              value={autoConfirmTime}
                              onChange={(e) => setAutoConfirmTime(e.target.value)}
                              className="h-9 text-xs bg-background" 
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Ca lấy hàng mặc định:</Label>
                            <Select value={autoPickupSlot} onValueChange={setAutoPickupSlot}>
                              <SelectTrigger className="h-9 text-xs bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover text-popover-foreground">
                                <SelectItem value="morning">Sáng (08:00 - 12:00)</SelectItem>
                                <SelectItem value="afternoon">Chiều (14:00 - 18:00)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Phương thức lấy hàng:</Label>
                            <Select value={autoShippingMethod} onValueChange={setAutoShippingMethod}>
                              <SelectTrigger className="h-9 text-xs bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover text-popover-foreground">
                                <SelectItem value="pickup">Bưu tá đến lấy</SelectItem>
                                <SelectItem value="dropoff">Tự mang ra bưu cục</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Working Days Selection */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Ngày áp dụng trong tuần:</Label>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                            <div className="flex items-center gap-1.5">
                              <Checkbox 
                                id="mon" 
                                checked={workdays.monday}
                                onCheckedChange={(val) => setWorkdays({ ...workdays, monday: !!val })}
                              />
                              <label htmlFor="mon" className="text-xs font-medium cursor-pointer">Thứ 2</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Checkbox 
                                id="tue" 
                                checked={workdays.tuesday}
                                onCheckedChange={(val) => setWorkdays({ ...workdays, tuesday: !!val })}
                              />
                              <label htmlFor="tue" className="text-xs font-medium cursor-pointer">Thứ 3</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Checkbox 
                                id="wed" 
                                checked={workdays.wednesday}
                                onCheckedChange={(val) => setWorkdays({ ...workdays, wednesday: !!val })}
                              />
                              <label htmlFor="wed" className="text-xs font-medium cursor-pointer">Thứ 4</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Checkbox 
                                id="thu" 
                                checked={workdays.thursday}
                                onCheckedChange={(val) => setWorkdays({ ...workdays, thursday: !!val })}
                              />
                              <label htmlFor="thu" className="text-xs font-medium cursor-pointer">Thứ 5</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Checkbox 
                                id="fri" 
                                checked={workdays.friday}
                                onCheckedChange={(val) => setWorkdays({ ...workdays, friday: !!val })}
                              />
                              <label htmlFor="fri" className="text-xs font-medium cursor-pointer">Thứ 6</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Checkbox 
                                id="sat" 
                                checked={workdays.saturday}
                                onCheckedChange={(val) => setWorkdays({ ...workdays, saturday: !!val })}
                              />
                              <label htmlFor="sat" className="text-xs font-medium cursor-pointer">Thứ 7</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Checkbox 
                                id="sun" 
                                checked={workdays.sunday}
                                onCheckedChange={(val) => setWorkdays({ ...workdays, sunday: !!val })}
                              />
                              <label htmlFor="sun" className="text-xs font-medium cursor-pointer">Chủ nhật</label>
                            </div>
                          </div>
                        </div>

                        {/* Exclusion Dates */}
                        <div className="space-y-1">
                          <Label className="text-xs font-bold">Ngoại trừ các ngày (Lễ, Tết):</Label>
                          <Input placeholder="Ví dụ: 01/01/2026, 30/04/2026..." className="h-9 text-xs bg-background" />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={handleSaveAutoConfig}
                        className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold h-9 text-xs cursor-pointer"
                      >
                        Lưu thiết lập
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Right Column: TikTok Shop & Shopee Label Fetcher */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="border-border">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Printer className="h-4.5 w-4.5 text-indigo-500" /> Tự động lấy nhãn vận chuyển (AWB)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      TikTok Shop chỉ cho phép lấy mẫu in nhãn vận chuyển tại thời điểm xác nhận. Kích hoạt tính năng này để tự động kéo file nhãn về POS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Tự động lấy mẫu in TikTok:</Label>
                        <p className="text-[9px] text-muted-foreground">Kéo nhãn AWB từ TikTok Shop về POS.</p>
                      </div>
                      <Switch checked={autoTiktokLabel} onCheckedChange={setAutoTiktokLabel} />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Tự động lấy mẫu in Shopee:</Label>
                        <p className="text-[9px] text-muted-foreground">Kéo nhãn AWB từ Shopee Mall về POS.</p>
                      </div>
                      <Switch checked={autoShopeeLabel} onCheckedChange={setAutoShopeeLabel} />
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-[9px] text-amber-700 leading-normal">
                        <strong>Lưu ý:</strong> Đảm bảo máy in nhãn (như KiotViet Xprinter) đã được kết nối và cấu hình mẫu in khổ K80/A6 trong Cài đặt Mẫu in.
                      </p>
                    </div>

                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* dialog: confirm pickup and arrange shipment */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background z-50">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <PackageCheck className="h-4.5 w-4.5 text-indigo-500" /> Xác nhận Chuẩn bị hàng loạt
            </DialogTitle>
            <DialogDescription className="text-xs">
              Đồng bộ yêu cầu chuẩn bị hàng lên sàn Shopee, TikTok Shop cho {selectedOrderIds.length} đơn hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ca lấy hàng mong muốn:</Label>
              <Select value={pickupSlot} onValueChange={setPickupSlot}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  <SelectItem value="morning">Ca Sáng (08:00 - 12:00)</SelectItem>
                  <SelectItem value="afternoon">Ca Chiều (14:00 - 18:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phương thức bàn giao cho bưu tá:</Label>
              <Select value={shippingMethod} onValueChange={setShippingMethod}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  <SelectItem value="pickup">Nhân viên vận chuyển đến lấy hàng</SelectItem>
                  <SelectItem value="dropoff">Shop tự mang ra bưu cục gửi hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-1.5">
              <CheckSquare className="h-4 w-4 text-indigo-650 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-indigo-700 leading-normal">
                Hệ thống sẽ đồng thời gửi yêu cầu **Mở mã vận đơn** lên Shopee/TikTok Shop API và tự động in AWB label của đơn vận nếu cấu hình in tự động được bật.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmDialogOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleConfirmOrders} className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold cursor-pointer">
              Xác nhận chuẩn bị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

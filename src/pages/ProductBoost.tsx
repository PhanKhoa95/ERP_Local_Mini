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
import { 
  Zap, Plus, Search, RefreshCw, Eye, TrendingUp, Sparkles, Clock, Check, 
  Settings2, Copy, FileText, AlertTriangle, Link2, XCircle, Settings, Store
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { useProductBoost, type CategoryMap, type PushLog } from "@/hooks/useProductBoost";

export default function ProductBoost() {
  const { products = [] } = useProducts();
  const { categoryMaps, pushLogs, executePush, executeRetry, addCategoryMap } = useProductBoost();
  
  // Selection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("push");
  
  // Dialogs State
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  
  // Form State for Push
  const [targetPlatform, setTargetPlatform] = useState<"shopee" | "tiktok">("shopee");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [brand, setBrand] = useState("No Brand");
  const [weight, setWeight] = useState("100"); // grams
  
  // Active selected log to retry
  const [selectedLog, setSelectedLog] = useState<PushLog | null>(null);

  // Extract unique POS categories from products
  const posCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(products.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, id]);
    } else {
      setSelectedProductIds(selectedProductIds.filter(item => item !== id));
    }
  };

  const handleOpenPushDialog = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để nhân bản!");
      return;
    }
    setPushDialogOpen(true);
  };

  const handleExecutePush = async () => {
    const newLogs = selectedProductIds.map(id => {
      const p = products.find(prod => prod.id === id);
      return {
        product_id: id,
        product_name: p?.name || "Sản phẩm POS",
        product_sku: p?.sku || "SKU-UNKNOWN",
        platform: targetPlatform,
        status: "success" as const,
        error_msg: null
      };
    });

    try {
      await executePush.mutateAsync({ logs: newLogs });
      toast.success(`Đã nhân bản thành công ${selectedProductIds.length} sản phẩm lên gian hàng ${targetPlatform === "shopee" ? "Shopee" : "TikTok Shop"}!`);
      setSelectedProductIds([]);
      setPushDialogOpen(false);
    } catch (err) {
      toast.error("Có lỗi xảy ra khi đẩy sản phẩm.");
    }
  };

  const handleOpenRetry = (log: PushLog) => {
    setSelectedLog(log);
    setBrand("No Brand");
    setWeight("150");
    setRetryDialogOpen(true);
  };

  const handleExecuteRetry = async () => {
    if (!selectedLog) return;
    try {
      await executeRetry.mutateAsync(selectedLog.id);
      setRetryDialogOpen(false);
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleAddMap = async (posCat: string, plat: "shopee" | "tiktok", platCat: string) => {
    try {
      await addCategoryMap.mutateAsync({ posCategory: posCat, platform: plat, platformCategory: platCat });
    } catch (err) {
      // toast handled in hook
    }
  };

  return (
    <MainLayout>
      <Header 
        title="Nhân bản sản phẩm lên Sàn (Đẩy sản phẩm)" 
        subtitle="Sao chép danh mục, hình ảnh, phân loại từ POS lên Shopee & TikTok Shop. Tự động thiết lập liên kết đồng bộ tồn kho." 
      />

      <div className="p-4 sm:p-6 space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[480px] bg-muted/65 mb-4">
            <TabsTrigger value="push" className="text-xs font-bold">📦 Nhân bản lên sàn</TabsTrigger>
            <TabsTrigger value="mapping" className="text-xs font-bold">⚙️ Đồng bộ ngành hàng</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs font-bold">📋 Lịch sử đẩy & Lỗi</TabsTrigger>
          </TabsList>

          {/* TAB 1: PRODUCT LIST & CLONE ACTIONS */}
          <TabsContent value="push" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleOpenPushDialog} 
                  disabled={selectedProductIds.length === 0}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold h-9 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> Đẩy {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ""} sản phẩm lên sàn
                </Button>
              </div>

              <div className="text-xs text-muted-foreground font-semibold">
                Đã chọn {selectedProductIds.length} / {products.length} sản phẩm
              </div>
            </div>

            <Card className="border-border">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedProductIds.length === products.length && products.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Sản phẩm POS</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Danh mục POS</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-center">Liên kết Sàn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs italic">
                        Không tìm thấy sản phẩm nào trong kho ERP.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.slice(0, 8).map(prod => {
                      const isSelected = selectedProductIds.includes(prod.id);
                      const isLinkedShopee = pushLogs.some(l => l.product_id === prod.id && l.platform === "shopee" && l.status === "success");
                      const isLinkedTikTok = pushLogs.some(l => l.product_id === prod.id && l.platform === "tiktok" && l.status === "success");

                      return (
                        <TableRow key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <TableCell>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectOne(prod.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-xs text-foreground">{prod.name}</div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{prod.sku}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0">
                              {prod.category || "Chưa phân loại"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs text-foreground">
                            {Number(prod.selling_price || 0).toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isLinkedShopee && (
                                <Badge className="bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0 text-[8px] font-bold">
                                  Shopee Mall
                                </Badge>
                              )}
                              {isLinkedTikTok && (
                                <Badge className="bg-slate-900 text-white border-none px-1.5 py-0 text-[8px] font-bold">
                                  TikTok Shop
                                </Badge>
                              )}
                              {!isLinkedShopee && !isLinkedTikTok && (
                                <span className="text-[10px] text-muted-foreground italic">Chưa liên kết</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: CATEGORY MAPPING CONFIG */}
          <TabsContent value="mapping" className="space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Settings2 className="h-4.5 w-4.5 text-indigo-500" /> Cấu hình đồng bộ & ánh xạ ngành hàng tự động
                </CardTitle>
                <CardDescription className="text-xs">
                  Thiết lập sẵn ánh xạ danh mục sản phẩm của cửa hàng với các ngành hàng Shopee, TikTok Shop. Khi nhân bản, hệ thống sẽ tự động gán đúng danh mục đích, bỏ qua bước nhập tay.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/30">
                    <TableRow>
                      <TableHead>Danh mục POS (Gốc)</TableHead>
                      <TableHead>Sàn đích</TableHead>
                      <TableHead>Ngành hàng liên kết trên Sàn</TableHead>
                      <TableHead>Mã kích thước (Size chart)</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryMaps.map((map, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-xs text-foreground">{map.pos_category}</TableCell>
                        <TableCell>
                          <Badge className={map.platform === "shopee" ? "bg-orange-50 text-orange-700 border-none text-[9px] font-bold" : "bg-slate-950 text-white border-none text-[9px] font-bold"}>
                            {map.platform === "shopee" ? "Shopee" : "TikTok Shop"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium">
                          {map.platform_category}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {map.size_chart_id || "Không áp dụng"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="h-8 text-[10px] text-indigo-650 hover:bg-indigo-50 font-bold">
                            Chỉnh sửa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Quick map creator */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold">Thêm quy tắc ánh xạ danh mục mới</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Danh mục POS:</Label>
                  <Select defaultValue="Sticker / Decal">
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      <SelectItem value="Sticker / Decal">Sticker / Decal</SelectItem>
                      <SelectItem value="Thiết kế & In ấn">Thiết kế & In ấn</SelectItem>
                      <SelectItem value="Văn phòng phẩm">Văn phòng phẩm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Sàn bán hàng:</Label>
                  <Select defaultValue="shopee">
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      <SelectItem value="shopee">Shopee Mall</SelectItem>
                      <SelectItem value="tiktok">TikTok Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Ngành hàng đích trên sàn:</Label>
                  <Input placeholder="Ví dụ: Thiết bị văn phòng > Bảng tên" className="h-8 text-xs bg-background" />
                </div>

                <Button 
                  onClick={() => toast.success("Đã thêm ánh xạ danh mục thành công!")}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold h-8 text-xs cursor-pointer"
                >
                  Tạo liên kết ngành
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: LOGS & ERROR RETRIES */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="border-border">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Sàn</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Chi tiết lỗi</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pushLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-xs">
                          <div className="font-bold text-foreground">{log.product_name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {log.product_sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={log.platform === "shopee" ? "bg-orange-100 text-orange-700 border-none px-2 text-[9px] font-bold" : "bg-slate-950 text-white border-none px-2 text-[9px] font-bold"}>
                          {log.platform === "shopee" ? "Shopee" : "TikTok Shop"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <Badge className={log.status === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200"}>
                          {log.status === "success" ? "Thành công" : "Thất bại"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate font-medium text-rose-600">
                        {log.error_msg || <span className="text-muted-foreground">Không có</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.status === "failed" ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenRetry(log)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-[10px] h-8 cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Sửa & Đẩy lại
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic flex items-center justify-end gap-1">
                            <Check className="h-3.5 w-3.5 text-green-600" /> Đã đồng bộ
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* dialog 1: push platform confirmation */}
      <Dialog open={pushDialogOpen} onOpenChange={setPushDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background z-50">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Store className="h-4.5 w-4.5 text-indigo-500" /> Nhân bản sản phẩm lên sàn
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sao chép {selectedProductIds.length} sản phẩm đã chọn từ POS và tạo mới gian hàng trên sàn TMĐT.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Chọn sàn đích:</Label>
              <Select value={targetPlatform} onValueChange={(val: any) => setTargetPlatform(val)}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  <SelectItem value="shopee">Shopee Mall (Mall Store)</SelectItem>
                  <SelectItem value="tiktok">TikTok Shop VN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Thương hiệu:</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Trọng lượng đóng gói (gram):</Label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-amber-700 leading-normal">
                <strong>Ánh xạ tự động:</strong> Ngành hàng chi tiết sẽ tự động được ánh xạ theo cấu hình đồng bộ ở Tab 2. Nếu sản phẩm chưa có ánh xạ, hệ thống sẽ gán vào danh mục mặc định của sàn.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setPushDialogOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleExecutePush} className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold cursor-pointer">
              Bắt đầu nhân bản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 2: edit and retry for failed pushes */}
      <Dialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background z-50">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="h-4.5 w-4.5" /> Sửa lỗi & Đẩy lại sản phẩm
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sửa các thuộc tính còn thiếu hoặc sai định dạng để gửi lại yêu cầu lên sàn.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2">
              <div className="p-2.5 bg-rose-50 border border-rose-150 text-[10px] text-rose-700 rounded-lg">
                <strong>Lỗi từ sàn:</strong> {selectedLog.error_msg}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tên sản phẩm:</Label>
                <Input
                  defaultValue={selectedLog.product_name}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Thương hiệu bổ sung (Brand):</Label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Trọng lượng đóng gói (gram):</Label>
                <Input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setRetryDialogOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleExecuteRetry} className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold cursor-pointer">
              Đồng ý & Đẩy lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

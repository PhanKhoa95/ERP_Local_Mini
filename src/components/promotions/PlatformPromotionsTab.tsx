import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Ticket, Plus, Search, Calendar, Lock, Unlock, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PlatformPromo {
  id: string;
  platform: "shopee" | "tiktok";
  name: string;
  start_date: string;
  end_date: string;
  status: "active" | "scheduled" | "expired";
  product_id: string;
  product_name: string;
  product_sku: string;
  locked_qty: number;
}

export function PlatformPromotionsTab() {
  const { products = [] } = useProducts();
  const queryClient = useQueryClient();
  const [promos, setPromos] = useState<PlatformPromo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Form State
  const [platform, setPlatform] = useState<"shopee" | "tiktok">("shopee");
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [lockQty, setLockQty] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("erp-mini-local-demo-platform-promotions");
    if (!raw) {
      const seed = [
        {
          id: "plat-1",
          platform: "shopee" as const,
          name: "Flash Sale 12.12 Shopee",
          start_date: new Date(Date.now() - 3600000 * 12).toISOString(),
          end_date: new Date(Date.now() + 3600000 * 24 * 2).toISOString(),
          status: "active" as const,
          product_id: products[0]?.id || "p-sticker",
          product_name: products[0]?.name || "Sticker logo decal giấy",
          product_sku: products[0]?.sku || "PRD-STICKER",
          locked_qty: 15
        },
        {
          id: "plat-2",
          platform: "tiktok" as const,
          name: "TikTok Shop Brand Day",
          start_date: new Date(Date.now() + 3600000 * 24 * 4).toISOString(),
          end_date: new Date(Date.now() + 3600000 * 24 * 7).toISOString(),
          status: "scheduled" as const,
          product_id: products[1]?.id || "p-card",
          product_name: products[1]?.name || "Card cảm ơn / Thank you card",
          product_sku: products[1]?.sku || "PRD-CARD",
          locked_qty: 30
        }
      ];
      localStorage.setItem("erp-mini-local-demo-platform-promotions", JSON.stringify(seed));
      setPromos(seed);
    } else {
      setPromos(JSON.parse(raw));
    }
  }, [products]);

  const savePromos = (newList: PlatformPromo[]) => {
    localStorage.setItem("erp-mini-local-demo-platform-promotions", JSON.stringify(newList));
    setPromos(newList);
  };

  const handleCreatePromo = () => {
    if (!name.trim() || !productId || !lockQty || !startDate || !endDate) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const qty = parseInt(lockQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Số lượng khóa kho phải lớn hơn 0");
      return;
    }

    const targetProd = products.find(p => p.id === productId);
    if (!targetProd) {
      toast.error("Sản phẩm không hợp lệ");
      return;
    }

    if ((targetProd.stock_quantity || 0) < qty) {
      toast.error(`Tồn kho khả dụng không đủ! Hiện có: ${targetProd.stock_quantity || 0}`);
      return;
    }

    // 1. Trừ kho khả dụng chung
    const productsRaw = localStorage.getItem("erp-mini-local-demo-products") || "[]";
    const localProducts = JSON.parse(productsRaw);
    const pIdx = localProducts.findIndex((p: any) => p.id === productId);
    if (pIdx >= 0) {
      localProducts[pIdx].stock_quantity = (localProducts[pIdx].stock_quantity || 0) - qty;
      localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(localProducts));
    }

    // 2. Thêm chương trình khuyến mãi sàn
    const newPromo: PlatformPromo = {
      id: `plat-${Date.now()}`,
      platform,
      name: name.trim(),
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      status: "active",
      product_id: productId,
      product_name: targetProd.name,
      product_sku: targetProd.sku,
      locked_qty: qty
    };

    const updated = [newPromo, ...promos];
    savePromos(updated);
    
    // Invalidate react-query cache to refresh products stock listing across ERP
    queryClient.invalidateQueries({ queryKey: ["products"] });

    // Reset Form
    setName("");
    setLockQty("");
    setCreateOpen(false);
    toast.success("Đã kích hoạt chương trình sàn và Khóa tồn kho thành công!");
  };

  const handleEndPromo = (id: string) => {
    const promo = promos.find(p => p.id === id);
    if (!promo) return;

    if (promo.status === "expired") {
      toast.error("Chương trình này đã kết thúc");
      return;
    }

    // 1. Cộng trả lại kho khả dụng chung
    const productsRaw = localStorage.getItem("erp-mini-local-demo-products") || "[]";
    const localProducts = JSON.parse(productsRaw);
    const pIdx = localProducts.findIndex((p: any) => p.id === promo.product_id);
    if (pIdx >= 0) {
      localProducts[pIdx].stock_quantity = (localProducts[pIdx].stock_quantity || 0) + promo.locked_qty;
      localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(localProducts));
    }

    // 2. Đổi status thành expired
    const updated = promos.map(p => {
      if (p.id === id) {
        return { ...p, status: "expired" as const };
      }
      return p;
    });

    savePromos(updated);
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success("Đã kết thúc chương trình khuyến mãi sàn và giải phóng tồn kho!");
  };

  const filtered = promos.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm chương trình, sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
          <Plus className="h-4 w-4" /> Tạo chiến dịch sàn & Khóa kho
        </Button>
      </div>

      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chương trình & Sàn</TableHead>
              <TableHead>Sản phẩm tham gia</TableHead>
              <TableHead className="text-center">Kho khóa (Locked)</TableHead>
              <TableHead>Thời gian chạy</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                  Chưa có chương trình khuyến mãi sàn nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-extrabold text-foreground text-sm">{promo.name}</div>
                      <Badge className={promo.platform === "shopee" ? "bg-orange-100 text-orange-700 border-none px-2 text-[9px] font-bold" : "bg-slate-900 text-white border-none px-2 text-[9px] font-bold"}>
                        {promo.platform === "shopee" ? "Shopee Mall" : "TikTok Shop"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div className="font-semibold text-foreground">{promo.product_name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {promo.product_sku}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-indigo-650 dark:text-indigo-400">
                    <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border text-xs">
                      <Lock className="h-3 w-3" /> {promo.locked_qty}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>Bắt đầu: {new Date(promo.start_date).toLocaleString("vi-VN")}</div>
                    <div className="mt-0.5">Kết thúc: {new Date(promo.end_date).toLocaleString("vi-VN")}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={
                        promo.status === "active" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20" :
                        promo.status === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20" :
                        "bg-slate-50 text-slate-500 border-slate-200"
                      }
                    >
                      {promo.status === "active" ? "Đang chạy" : promo.status === "scheduled" ? "Sắp chạy" : "Hết hạn"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {promo.status !== "expired" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndPromo(promo.id)}
                        className="h-8 text-[10px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                      >
                        <Unlock className="h-3 w-3 mr-1" /> Kết thúc sớm (Mở kho)
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic flex items-center justify-end gap-0.5">
                        ✓ Đã giải phóng kho
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create platform promo modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px] bg-background z-50">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Ticket className="h-4.5 w-4.5 text-indigo-500" /> Tạo chiến dịch Sàn & Khóa kho
            </DialogTitle>
            <DialogDescription className="text-xs">
              Đồng bộ và thiết lập khóa tồn kho cứng cho sản phẩm tham gia chiến dịch Shopee/TikTok Shop để tránh cháy hàng khả dụng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sàn bán hàng:</Label>
                <Select value={platform} onValueChange={(val: any) => setPlatform(val)}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="shopee">Shopee Mall</SelectItem>
                    <SelectItem value="tiktok">TikTok Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tên chương trình sàn:</Label>
                <Input
                  placeholder="Ví dụ: Flash Sale 12.12"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Chọn sản phẩm tham gia:</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.stock_quantity || 0} khả dụng)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Số lượng khóa kho (Locked Qty):</Label>
                <Input
                  type="number"
                  placeholder="Ví dụ: 10"
                  value={lockQty}
                  onChange={(e) => setLockQty(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Thời gian bắt đầu:</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Thời gian kết thúc:</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-indigo-700 leading-normal">
                <strong>Chú ý khóa kho:</strong> Lượng tồn kho bị khóa này sẽ lập tức được tách biệt khỏi kho khả dụng của cửa hàng trên ERP Mini. Thu ngân POS và Lazada sẽ không thể bán số lượng đã khóa này cho đến khi chương trình kết thúc.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleCreatePromo} className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold flex items-center gap-1 cursor-pointer">
              <Lock className="h-3.5 w-3.5" /> Lưu & Khóa tồn kho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

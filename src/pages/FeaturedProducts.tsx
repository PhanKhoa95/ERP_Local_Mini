import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Smartphone, Heart, Star, ShoppingCart } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";

interface FeaturedProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  image?: string;
  priority: number; // 1 to 8
  platform: "shopee" | "tiktok";
}

export default function FeaturedProducts() {
  const { products = [] } = useProducts();
  const [featuredList, setFeaturedList] = useState<FeaturedProduct[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<"shopee" | "tiktok">("shopee");

  // Initialize seed featured products
  useEffect(() => {
    if (products.length > 0 && featuredList.length === 0) {
      const seed: FeaturedProduct[] = [
        {
          id: products[0].id,
          name: products[0].name,
          sku: products[0].sku,
          price: products[0].selling_price || 120000,
          image: "https://images.unsplash.com/photo-1572375995501-4b0894dbe0d1?w=120&auto=format&fit=crop&q=60",
          priority: 1,
          platform: "shopee"
        },
        {
          id: products[1].id,
          name: products[1].name,
          sku: products[1].sku,
          price: products[1].selling_price || 85000,
          image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=60",
          priority: 2,
          platform: "shopee"
        },
        {
          id: products[2]?.id || "p3",
          name: products[2]?.name || "Combo Shop Mới Khởi Nghiệp",
          sku: products[2]?.sku || "PRD-COMBO-NEW",
          price: products[2]?.selling_price || 350000,
          image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=120&auto=format&fit=crop&q=60",
          priority: 3,
          platform: "shopee"
        }
      ];
      setFeaturedList(seed);
    }
  }, [products]);

  const handleAddFeatured = (prod: any) => {
    if (featuredList.filter(f => f.platform === selectedPlatform).length >= 8) {
      toast.error("Một gian hàng sàn chỉ được phép hiển thị tối đa 8 sản phẩm tiêu điểm!");
      return;
    }

    if (featuredList.some(f => f.id === prod.id && f.platform === selectedPlatform)) {
      toast.error("Sản phẩm này đã nằm trong danh sách tiêu điểm!");
      return;
    }

    const newItem: FeaturedProduct = {
      id: prod.id,
      name: prod.name,
      sku: prod.sku,
      price: prod.selling_price || 100000,
      image: prod.image || "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=120&auto=format&fit=crop&q=60",
      priority: featuredList.filter(f => f.platform === selectedPlatform).length + 1,
      platform: selectedPlatform
    };

    setFeaturedList([...featuredList, newItem]);
    toast.success(`Đã thêm ${prod.name} vào danh sách sản phẩm tiêu điểm!`);
  };

  const handleRemoveFeatured = (id: string) => {
    const updated = featuredList
      .filter(f => f.id !== id || f.platform !== selectedPlatform)
      .map((item, index) => ({ ...item, priority: index + 1 })); // reorder priorities
    setFeaturedList(updated);
    toast.info("Đã xóa khỏi danh sách sản phẩm tiêu điểm");
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const currentPlatformList = featuredList.filter(f => f.platform === selectedPlatform);
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === currentPlatformList.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = currentPlatformList[index];
    currentPlatformList[index] = currentPlatformList[targetIdx];
    currentPlatformList[targetIdx] = temp;

    // Recalculate priorities
    const updatedPlatformList = currentPlatformList.map((item, idx) => ({ ...item, priority: idx + 1 }));
    const otherPlatformList = featuredList.filter(f => f.platform !== selectedPlatform);

    setFeaturedList([...updatedPlatformList, ...otherPlatformList]);
  };

  const currentPlatformList = featuredList
    .filter(f => f.platform === selectedPlatform)
    .sort((a, b) => a.priority - b.priority);

  return (
    <MainLayout>
      <Header 
        title="Sản phẩm tiêu điểm sàn TMĐT" 
        subtitle="Thiết lập danh mục sản phẩm nổi bật hiển thị ở vị trí trung tâm, đẹp mắt trên trang chủ Shopee, TikTok Shop." 
      />

      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Platform selection bar */}
        <Card className="border-border/60 shadow-sm bg-[#F8FAFC]/50 dark:bg-slate-900/30">
          <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-bold text-foreground">Chọn sàn đồng bộ:</span>
              <Select value={selectedPlatform} onValueChange={(val: any) => setSelectedPlatform(val)}>
                <SelectTrigger className="h-8.5 w-36 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="shopee">Shopee Mall</SelectItem>
                  <SelectItem value="tiktok">TikTok Shop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="text-[10px] bg-indigo-50 border-indigo-200 text-indigo-700 px-3 py-1 font-bold">
              ⚡ Số sản phẩm tiêu điểm đã cài đặt: {currentPlatformList.length} / 8 sản phẩm
            </Badge>
          </CardContent>
        </Card>

        {/* Master Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: List and ordering */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-indigo-500" /> Danh sách sản phẩm tiêu điểm đang hiển thị
                </CardTitle>
                <CardDescription className="text-xs">
                  Sử dụng các nút mũi tên để thay đổi thứ tự hiển thị của sản phẩm trên trang chủ gian hàng sàn.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/30">
                    <TableRow>
                      <TableHead className="w-12 text-center">Thứ tự</TableHead>
                      <TableHead className="w-14"></TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-center w-24">Độ ưu tiên</TableHead>
                      <TableHead className="text-right w-24">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPlatformList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs italic">
                          Chưa cấu hình sản phẩm tiêu điểm nào. Chọn sản phẩm ở bảng bên dưới để thêm!
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPlatformList.map((item, idx) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <TableCell className="text-center font-bold text-slate-700 dark:text-slate-350">{idx + 1}</TableCell>
                          <TableCell>
                            {item.image && (
                              <img src={item.image} alt={item.name} className="h-10 w-10 object-cover rounded-lg border shadow-sm" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-bold text-foreground">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {item.sku}</div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs text-foreground">
                            {Number(item.price || 0).toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6 cursor-pointer"
                                disabled={idx === 0}
                                onClick={() => handleMove(idx, "up")}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6 cursor-pointer"
                                disabled={idx === currentPlatformList.length - 1}
                                onClick={() => handleMove(idx, "down")}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveFeatured(item.id)}
                              className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Select products from pool */}
            <Card className="border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  📦 Chọn sản phẩm từ kho ERP Mini
                </CardTitle>
                <CardDescription className="text-xs">
                  Thêm các sản phẩm bán chạy nhất vào danh sách tiêu điểm.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/30">
                    <TableRow>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.slice(0, 6).map(prod => {
                      const isFeatured = featuredList.some(f => f.id === prod.id && f.platform === selectedPlatform);

                      return (
                        <TableRow key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <TableCell className="font-semibold text-xs text-foreground">{prod.name}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{prod.sku}</TableCell>
                          <TableCell className="text-right font-semibold text-xs text-foreground">
                            {Number(prod.selling_price || 0).toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell className="text-right">
                            {isFeatured ? (
                              <Button
                                size="sm"
                                disabled
                                className="h-8 text-[10px] bg-slate-100 text-slate-500 border border-slate-200"
                              >
                                <Plus className="h-3 w-3" />
                                Đã làm tiêu điểm
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleAddFeatured(prod)}
                                className="h-8 text-[10px] bg-indigo-650 hover:bg-indigo-750 text-white font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                                Chọn tiêu điểm
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Phone Preview */}
          <div className="lg:col-span-4 flex justify-center">
            <Card className="border border-slate-300 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-3 bg-slate-900 dark:bg-slate-950 max-w-[280px] w-full h-[520px] flex flex-col justify-between overflow-hidden relative">
              {/* Speaker & camera slot */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 dark:bg-black rounded-full z-20 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Screen Area */}
              <div className="h-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden flex flex-col justify-between pt-5 z-10 border border-slate-100 dark:border-slate-800 relative bg-gradient-to-b from-indigo-50/20 to-white dark:from-slate-900 dark:to-slate-900">
                
                {/* Shop Header mockup */}
                <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-7 w-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-[10px]">ERP</div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black leading-tight">ERP Mini Mall</span>
                      <span className="text-[7px] text-white/80 leading-none">Online 5 phút trước</span>
                    </div>
                  </div>
                  <Badge className="text-[6px] px-1 bg-white/25 text-white border-none py-0">Theo dõi</Badge>
                </div>

                {/* Main preview scroll area */}
                <div className="flex-1 p-2.5 overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between text-[8px] font-extrabold text-slate-500 uppercase tracking-wide">
                    <span>🌟 SẢN PHẨM TIÊU ĐIỂM</span>
                    <span className="text-orange-500 text-[7px] hover:underline cursor-pointer">Xem tất cả</span>
                  </div>

                  {/* Grid of featured products */}
                  <div className="grid grid-cols-2 gap-2">
                    {currentPlatformList.length === 0 ? (
                      <div className="col-span-2 text-center text-[9px] text-muted-foreground py-10 italic">
                        Chưa chọn sản phẩm nổi bật
                      </div>
                    ) : (
                      currentPlatformList.slice(0, 4).map(item => (
                        <div key={item.id} className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between h-[130px]">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-16 w-full object-cover border-b" />
                          ) : (
                            <div className="h-16 w-full bg-slate-50 flex items-center justify-center text-[10px]">No image</div>
                          )}
                          
                          <div className="p-1.5 flex-1 flex flex-col justify-between">
                            <div className="text-[8px] font-bold text-foreground line-clamp-2 leading-tight">
                              {item.name}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[8px] font-black text-orange-600">
                                {Number(item.price || 0).toLocaleString("vi-VN")}đ
                              </span>
                              <span className="text-[6px] text-muted-foreground">Đã bán 12k</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer nav mockup */}
                <div className="p-2 border-t bg-slate-50 dark:bg-slate-950 flex justify-around text-muted-foreground text-[8px] font-bold">
                  <div className="text-orange-600 flex flex-col items-center gap-0.5"><Smartphone className="h-3.5 w-3.5" /><span>Cửa hàng</span></div>
                  <div className="flex flex-col items-center gap-0.5"><Star className="h-3.5 w-3.5" /><span>Đánh giá</span></div>
                  <div className="flex flex-col items-center gap-0.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Giỏ hàng</span></div>
                </div>
              </div>
            </Card>
          </div>

        </div>

      </div>
    </MainLayout>
  );
}

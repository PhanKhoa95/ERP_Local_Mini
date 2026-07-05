import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Star, MessageSquare, AlertCircle, Sparkles, Send, Check, Search, Trash2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProductReviews, type ProductReview } from "@/hooks/useProductReviews";

const SEED_REVIEWS: ProductReview[] = [
  {
    id: "rev-1",
    platform: "shopee",
    customer_name: "Nguyễn Minh Thuận",
    customer_phone: "0901122334",
    rating: 5,
    comment: "Sản phẩm chất lượng cực kỳ tốt, sticker in hình rất sắc nét, chống nước tốt. Đóng gói rất cẩn thận và giao hàng siêu nhanh. Sẽ tiếp tục ủng hộ shop lâu dài ạ!",
    reply_content: "Dạ cảm ơn anh Thuận đã ủng hộ shop ạ! Chúc anh một ngày tốt lành và hy vọng được phục vụ anh trong đơn hàng tiếp theo nhé ạ. ❤️",
    product_name: "Sticker logo decal giấy",
    product_sku: "PRD-STICKER",
    product_image: "https://images.unsplash.com/photo-1572375995501-4b0894dbe0d1?w=120&auto=format&fit=crop&q=60",
    order_number: "HIST-001",
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1589987607627-616cac5c2c5a?w=150&auto=format&fit=crop&q=60"
    ]
  },
  {
    id: "rev-2",
    platform: "lazada",
    customer_name: "Phạm Thúy Vy",
    customer_phone: "0933445566",
    rating: 2,
    comment: "Giao hàng thì lâu mà thẻ QR bị trầy xước khá nhiều ở mặt sau. Nhìn hơi mất thẩm mỹ xíu nhưng quét mã vẫn dùng được. Shop xem lại khâu đóng gói sản phẩm giùm nha.",
    reply_content: null,
    product_name: "Card cảm ơn / Thank you card",
    product_sku: "PRD-CARD",
    product_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=60",
    order_number: "HIST-002",
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=150&auto=format&fit=crop&q=60"
    ]
  },
  {
    id: "rev-3",
    platform: "tiktok",
    customer_name: "Vũ Hoàng Long",
    customer_phone: "0977889900",
    rating: 4,
    comment: "Bảng QR thiết kế rất đẹp, cứng cáp và sang trọng. Tuy nhiên góc dưới hơi bị móp nhẹ tí chắc do bên vận chuyển quăng quật mạnh quá. Quét mã nhạy, nên mua.",
    reply_content: null,
    product_name: "Combo Shop Mới Khởi Nghiệp",
    product_sku: "PRD-COMBO-NEW",
    product_image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=120&auto=format&fit=crop&q=60",
    order_number: "HIST-003",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "rev-4",
    platform: "shopee",
    customer_name: "Trần Thị Lan Anh",
    rating: 5,
    comment: "Nhận được hàng bất ngờ ghê, shop thiết kế QR đẹp lung linh, màu in tươi tắn đúng form thiết kế. Cám ơn bạn nhân viên hỗ trợ nhiệt tình tư vấn nhé. 5 sao không nói nhiều!",
    reply_content: "Dạ shop xin chân thành cảm ơn chị Lan Anh nhiều ạ! Sự hài lòng của chị là động lực to lớn giúp shop ngày càng hoàn thiện hơn. Mong được phục vụ chị lần tới nhé ạ!",
    product_name: "Dịch vụ thiết kế Avatar & QR",
    product_sku: "PRD-DESIGN-QR",
    product_image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=120&auto=format&fit=crop&q=60",
    order_number: "HIST-008",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "rev-5",
    platform: "shopee",
    customer_name: "Lê Quốc Khánh",
    customer_phone: "0912345678",
    rating: 1,
    comment: "Sản phẩm không giống mô tả, giao sai mẫu mã yêu cầu. Đặt mẫu sticker tròn lại giao sticker vuông. Liên hệ hỗ trợ không thấy ai phản hồi lại, quá thất vọng.",
    reply_content: null,
    product_name: "Sticker logo decal giấy",
    product_sku: "PRD-STICKER",
    product_image: "https://images.unsplash.com/photo-1572375995501-4b0894dbe0d1?w=120&auto=format&fit=crop&q=60",
    order_number: "HIST-009",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  }
];

const QUICK_TEMPLATES = [
  "Dạ cảm ơn quý khách đã mua sắm và dành thời gian đánh giá sản phẩm cho shop ạ! Chúc quý khách một ngày vui vẻ ạ. ❤️",
  "Dạ shop rất xin lỗi về trải nghiệm chưa tốt của quý khách ạ. Shop đã nhắn tin hỗ trợ đổi trả 1-1 miễn phí cho quý khách rồi ạ, rất mong quý khách kiểm tra tin nhắn nhé ạ.",
  "Dạ shop xin ghi nhận phản hồi của mình để nâng cao chất lượng đóng gói và vận chuyển sản phẩm tốt hơn. Cảm ơn quý khách ạ!",
];

export default function ProductReviews() {
  const { reviews, replyReview, deleteReview } = useProductReviews();
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
  
  // Filters state
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Reply text
  const [replyText, setReplyText] = useState("");

  // Select the first review when list loads
  useEffect(() => {
    if (reviews.length > 0 && !selectedReview) {
      setSelectedReview(reviews[0]);
      setReplyText(reviews[0].reply_content || "");
    }
  }, [reviews, selectedReview]);

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    if (platformFilter !== "all" && r.platform !== platformFilter) return false;
    if (ratingFilter !== "all" && r.rating !== parseInt(ratingFilter)) return false;
    if (statusFilter !== "all") {
      const isReplied = r.reply_content !== null;
      if (statusFilter === "replied" && !isReplied) return false;
      if (statusFilter === "unreplied" && isReplied) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = r.customer_name.toLowerCase().includes(query);
      const matchComment = r.comment.toLowerCase().includes(query);
      const matchProduct = r.product_name.toLowerCase().includes(query);
      if (!matchName && !matchComment && !matchProduct) return false;
    }
    return true;
  });

  const handleSelectReview = (review: ProductReview) => {
    setSelectedReview(review);
    setReplyText(review.reply_content || "");
  };

  const handleSendReply = async () => {
    if (!selectedReview) return;
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    try {
      await replyReview.mutateAsync({ id: selectedReview.id, replyContent: replyText.trim() });
      setSelectedReview({ ...selectedReview, reply_content: replyText.trim() });
    } catch (err) {
      // toast is handled inside the hook
    }
  };

  const handleGenerateAIReply = () => {
    if (!selectedReview) return;

    let aiText = "";
    const name = selectedReview.customer_name;
    const rating = selectedReview.rating;

    if (rating >= 4) {
      aiText = `Dạ shop xin chân thành cảm ơn ${name} đã mua sắm và dành tặng shop đánh giá ${rating} sao ngọt ngào ạ! Shop sẽ luôn nỗ lực cải tiến chất lượng và dịch vụ tốt hơn nữa. Tặng mình mã voucher [VIPGIFT50] giảm ngay 10% cho đơn hàng sau nhé ạ. Chúc mình luôn vui vẻ và may mắn! ✨`;
    } else if (rating === 3) {
      aiText = `Dạ shop rất xin lỗi ${name} về trải nghiệm sản phẩm chưa trọn vẹn lần này ạ. Shop xin ghi nhận ý kiến của mình về đóng gói/vận chuyển để hoàn thiện hơn. Shop đã nhắn tin gửi tặng mình voucher 20,000đ đền bù, rất mong mình kiểm tra inbox hỗ trợ nhé ạ.`;
    } else {
      aiText = `Dạ shop vô cùng xin lỗi ${name} vì sự cố giao sai mẫu/chất lượng chưa như ý lần này ạ. Shop cam kết bảo hành 1 đổi 1 và hỗ trợ thu hồi hoàn toàn miễn phí cho mình. Shop đã cho nhân viên CSKH liên hệ trực tiếp qua số điện thoại để xử lý ngay lập tức, mong mình thông cảm cho shop nhé ạ! 😭`;
    }

    setReplyText(aiText);
    toast.success("Đã tạo phản hồi bằng trợ lý AI!");
  };

  return (
    <MainLayout>
      <Header 
        title="Quản lý đánh giá sản phẩm" 
        subtitle="Theo dõi, quản lý và phản hồi trực tiếp các đánh giá sản phẩm từ các sàn Shopee, Lazada, Tiktok Shop." 
      />

      <div className="space-y-4 mt-4">
        {/* Filters */}
        <Card className="border-border/60 shadow-sm bg-[#F8FAFC]/50 dark:bg-slate-900/30">
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm sản phẩm, khách hàng, nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Sàn:</span>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs bg-background">
                    <SelectValue placeholder="Tất cả sàn" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover animate-in fade-in slide-in-from-top-1">
                    <SelectItem value="all">Tất cả sàn</SelectItem>
                    <SelectItem value="shopee">Shopee</SelectItem>
                    <SelectItem value="lazada">Lazada</SelectItem>
                    <SelectItem value="tiktok">Tiktok Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Sao:</span>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="h-8 w-24 text-xs bg-background">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover animate-in fade-in slide-in-from-top-1">
                    <SelectItem value="all">Tất cả sao</SelectItem>
                    <SelectItem value="5">5 sao ⭐</SelectItem>
                    <SelectItem value="4">4 sao ⭐</SelectItem>
                    <SelectItem value="3">3 sao ⭐</SelectItem>
                    <SelectItem value="2">2 sao ⭐</SelectItem>
                    <SelectItem value="1">1 sao ⭐</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Trả lời:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-32 text-xs bg-background">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover animate-in fade-in slide-in-from-top-1">
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="replied">Đã phản hồi</SelectItem>
                    <SelectItem value="unreplied">Chưa phản hồi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Master Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left panel: List */}
          <div className="lg:col-span-5 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredReviews.length === 0 ? (
              <Card className="border-dashed border-border py-12 text-center text-muted-foreground text-sm">
                Không tìm thấy đánh giá sản phẩm nào khớp với bộ lọc.
              </Card>
            ) : (
              filteredReviews.map((rev) => {
                const isSelected = selectedReview?.id === rev.id;
                const isReplied = rev.reply_content !== null;

                return (
                  <div
                    key={rev.id}
                    onClick={() => handleSelectReview(rev)}
                    className={cn(
                      "p-3.5 border rounded-xl cursor-pointer transition-all space-y-2 bg-card hover:bg-muted/10 relative shadow-sm",
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/60"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[8px] uppercase font-bold border-none px-1.5 py-0.5",
                            rev.platform === "shopee" ? "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" :
                            rev.platform === "lazada" ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" :
                            "bg-[#010101] text-white dark:bg-slate-800 dark:text-slate-200"
                          )}
                        >
                          {rev.platform === "shopee" ? "Shopee" : rev.platform === "lazada" ? "Lazada" : "Tiktok"}
                        </Badge>
                        <span className="text-[10px] font-bold text-foreground font-mono">{rev.customer_name}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn("h-3 w-3", i < rev.rating ? "fill-amber-500" : "text-slate-200 fill-slate-200 dark:text-slate-700 dark:fill-slate-700")} 
                        />
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      "{rev.comment}"
                    </p>

                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-border/60">
                      <span className="text-[10px] text-foreground font-medium truncate max-w-[200px] flex items-center gap-1">
                        📦 {rev.product_name}
                      </span>
                      {isReplied ? (
                        <Badge className="text-[8px] bg-green-500 text-white border-none py-0 px-1.5 rounded-full font-bold">
                          Đã phản hồi
                        </Badge>
                      ) : (
                        <Badge className="text-[8px] bg-red-500 text-white border-none py-0 px-1.5 rounded-full font-bold animate-pulse">
                          Chưa phản hồi
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right panel: Detail & Action */}
          <div className="lg:col-span-7">
            {selectedReview ? (
              <Card className="border border-border/80 shadow-md h-full flex flex-col justify-between">
                <div>
                  <CardHeader className="border-b pb-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <MessageSquare className="h-4.5 w-4.5 text-indigo-500" /> Chi tiết đánh giá của {selectedReview.customer_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Mã đơn sàn: <a href={`/orders?search=${selectedReview.order_number}`} className="underline text-indigo-600 font-bold hover:text-indigo-800">{selectedReview.order_number}</a>
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-1">
                        <Badge className="text-[9px] uppercase font-bold bg-[#F8FAFC] dark:bg-slate-800 border text-foreground py-0.5">
                          {selectedReview.platform === "shopee" ? "🧡 Shopee" : selectedReview.platform === "lazada" ? "💙 Lazada" : "🖤 Tiktok Shop"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {/* Product row */}
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 p-2.5 border rounded-xl shadow-inner">
                      {selectedReview.product_image && (
                        <img 
                          src={selectedReview.product_image} 
                          alt={selectedReview.product_name}
                          className="h-12 w-12 rounded-lg object-cover border animate-in fade-in duration-300" 
                        />
                      )}
                      <div className="flex flex-col text-xs">
                        <span className="font-extrabold text-foreground flex items-center gap-1">
                          <ShoppingBag className="h-3.5 w-3.5" /> {selectedReview.product_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {selectedReview.product_sku}</span>
                      </div>
                    </div>

                    {/* Customer Rating and Comment */}
                    <div className="space-y-2 bg-[#F8FAFC] dark:bg-slate-900/20 p-4 border border-dashed rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn("h-4.5 w-4.5", i < selectedReview.rating ? "fill-amber-500" : "text-slate-200 fill-slate-200 dark:text-slate-700 dark:fill-slate-700")} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Đánh giá lúc: {new Date(selectedReview.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>

                      <p className="text-xs text-foreground font-medium italic pl-2 border-l-2 border-primary/45 py-1">
                        "{selectedReview.comment}"
                      </p>

                      {/* Attachments */}
                      {selectedReview.images && selectedReview.images.length > 0 && (
                        <div className="pt-2">
                          <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Ảnh feedback đính kèm:</div>
                          <div className="flex gap-2">
                            {selectedReview.images.map((img, idx) => (
                              <img 
                                key={idx}
                                src={img} 
                                alt="feedback" 
                                className="h-16 w-16 object-cover rounded-lg border hover:scale-105 transition-all shadow-sm"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reply Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                          ✍️ NỘI DUNG PHẢN HỒI
                        </Label>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateAIReply}
                          className="h-7 text-[10px] font-bold text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/50 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3 fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" /> Phản hồi AI
                        </Button>
                      </div>

                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập nội dung phản hồi khách hàng tại đây..."
                        className="text-xs min-h-[90px] bg-background"
                      />

                      {/* Quick Templates */}
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase font-bold text-muted-foreground">Mẫu trả lời nhanh:</div>
                        <div className="flex flex-col gap-1">
                          {QUICK_TEMPLATES.map((tmpl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setReplyText(tmpl)}
                              className="text-left text-[10px] text-slate-600 dark:text-slate-350 hover:text-primary hover:bg-muted p-1 rounded border border-border/50 truncate transition-all bg-[#F8FAFC] dark:bg-slate-900/50"
                            >
                              {tmpl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="border-t p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                  <Button
                    type="button"
                    disabled={replyReview.isPending}
                    onClick={handleSendReply}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs flex items-center gap-1 px-4 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" /> Gửi phản hồi
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="h-full border border-dashed border-border rounded-xl flex flex-col items-center justify-center py-20 text-muted-foreground">
                <AlertCircle className="h-10 w-10 opacity-30 mb-2" />
                <span className="text-sm">Chọn một đánh giá từ danh sách bên trái để phản hồi</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </MainLayout>
  );
}

// Minimal Label helper
function Label({ children, className, ...props }: any) {
  return (
    <label className={cn("text-xs font-semibold text-foreground", className)} {...props}>
      {children}
    </label>
  );
}

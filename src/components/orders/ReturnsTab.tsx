import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RotateCcw, Loader2, AlertCircle, ShoppingBag, ArrowRightLeft, Send, Check, AlertTriangle, Image as ImageIcon, Eye } from "lucide-react";
import { useOrderReturns } from "@/hooks/useOrderReturns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  requested: "Yêu cầu hoàn",
  approved: "Đã duyệt hoàn",
  receiving: "Đang nhận hàng",
  received: "Đã nhận hàng",
  refunded: "Đã hoàn tiền",
  rejected: "Từ chối hoàn",
  disputed: "Đang khiếu nại"
};

const statusColors: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  approved: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  receiving: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900",
  received: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  refunded: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
  rejected: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900",
  disputed: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900"
};

const platformLabels: Record<string, string> = {
  manual: "Thủ công",
  shopee: "Shopee",
  lazada: "Lazada",
  tiktok: "TikTok",
};

interface SeedReturnItem {
  id: string;
  order_id: string;
  company_id: string;
  platform_source: "shopee" | "lazada" | "tiktok" | "manual";
  status: "requested" | "approved" | "received" | "refunded" | "rejected" | "disputed";
  reason: string;
  refund_amount: number;
  notes: string;
  created_at: string;
  customer_proof_images?: string[];
  shop_dispute_reason?: string;
  shop_proof_images?: string[];
  return_items?: {
    product_name: string;
    product_sku: string;
    quantity: number;
    price: number;
  }[];
}

const SEED_RETURNS: SeedReturnItem[] = [
  {
    id: "ret-shopee-1",
    order_id: "order-shopee-1",
    company_id: "company-1",
    platform_source: "shopee",
    status: "requested",
    reason: "Sản phẩm bị nứt vỡ góc cạnh trong quá trình vận chuyển. Shop đóng gói sơ sài không có xốp bong bóng.",
    refund_amount: 150000,
    notes: "Khách gửi kèm ảnh chụp vỏ hộp carton ngoài bị bóp méo, nứt vỡ sản phẩm bên trong.",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    customer_proof_images: [
      "https://images.unsplash.com/photo-1589987607627-616cac5c2c5a?w=300&auto=format&fit=crop&q=60"
    ],
    return_items: [
      { product_name: "Sticker logo decal giấy", product_sku: "PRD-STICKER", quantity: 2, price: 75000 }
    ]
  },
  {
    id: "ret-lazada-1",
    order_id: "order-lazada-1",
    company_id: "company-1",
    platform_source: "lazada",
    status: "disputed",
    reason: "Khách báo shop gửi thiếu hàng, đặt 5 card cảm ơn chỉ giao 2 card.",
    refund_amount: 240000,
    notes: "Shop đã gửi khiếu nại lên Lazada kèm video đóng gói cân nặng để đối chứng.",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    customer_proof_images: [
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&auto=format&fit=crop&q=60"
    ],
    shop_dispute_reason: "Video đóng gói của shop ghi nhận cân nặng kiện hàng là 250g, khớp với khối lượng của 5 card sản phẩm. Khách hàng cố tình báo thiếu để trục lợi hoàn tiền.",
    shop_proof_images: [
      "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=300&auto=format&fit=crop&q=60"
    ],
    return_items: [
      { product_name: "Card cảm ơn / Thank you card", product_sku: "PRD-CARD", quantity: 3, price: 80000 }
    ]
  },
  {
    id: "ret-tiktok-1",
    order_id: "order-tiktok-1",
    company_id: "company-1",
    platform_source: "tiktok",
    status: "refunded",
    reason: "Không thích sản phẩm nữa (Khách đổi ý).",
    refund_amount: 250000,
    notes: "TikTok đã duyệt hoàn tiền tự động do khách hàng trả hàng thành công về kho qua đơn vị vận chuyển của sàn.",
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    customer_proof_images: [],
    return_items: [
      { product_name: "Combo Shop Mới Khởi Nghiệp", product_sku: "PRD-COMBO-NEW", quantity: 1, price: 250000 }
    ]
  }
];

export function ReturnsTab() {
  const { returns: queryReturns, isLoading, updateReturnStatus } = useOrderReturns();
  const [localReturns, setLocalReturns] = useState<any[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  
  // Dispute Dialog
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  // Initialize and merge query returns with seed data for rich details
  useEffect(() => {
    const raw = localStorage.getItem("erp-mini-local-demo-order-returns");
    if (!raw) {
      localStorage.setItem("erp-mini-local-demo-order-returns", JSON.stringify(SEED_RETURNS));
      setLocalReturns(SEED_RETURNS);
      if (SEED_RETURNS.length > 0) setSelectedReturn(SEED_RETURNS[0]);
    } else {
      const parsed = JSON.parse(raw);
      // Ensure we merge data with any order details from hook
      const merged = parsed.map((item: any) => {
        const queryMatch = queryReturns.find((qr: any) => qr.id === item.id);
        return {
          ...item,
          orders: queryMatch?.orders || item.orders || { order_number: `ORD-${item.id.slice(-5).toUpperCase()}`, total: item.refund_amount }
        };
      });
      setLocalReturns(merged);
      if (merged.length > 0 && !selectedReturn) {
        setSelectedReturn(merged[0]);
      }
    }
  }, [queryReturns]);

  const saveReturns = (newList: any[]) => {
    localStorage.setItem("erp-mini-local-demo-order-returns", JSON.stringify(newList));
    setLocalReturns(newList);
  };

  // Filter returns
  const filtered = localReturns.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (platformFilter !== "all" && r.platform_source !== platformFilter) return false;
    return true;
  });

  const handleSelectReturn = (ret: any) => {
    setSelectedReturn(ret);
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedReturn) return;

    const updated = localReturns.map(r => {
      if (r.id === selectedReturn.id) {
        return { ...r, status, updated_at: new Date().toISOString() };
      }
      return r;
    });

    saveReturns(updated);
    setSelectedReturn({ ...selectedReviewDetails(selectedReturn), status });
    toast.success(`Đã cập nhật trạng thái yêu cầu thành: ${statusLabels[status]}`);
  };

  const handleSendDispute = () => {
    if (!selectedReturn) return;
    if (!disputeReason.trim()) {
      toast.error("Vui lòng nhập lý do khiếu nại lên sàn");
      return;
    }

    const updated = localReturns.map(r => {
      if (r.id === selectedReturn.id) {
        return { 
          ...r, 
          status: "disputed", 
          shop_dispute_reason: disputeReason.trim(),
          shop_proof_images: ["https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=300&auto=format&fit=crop&q=60"],
          updated_at: new Date().toISOString() 
        };
      }
      return r;
    });

    saveReturns(updated);
    setSelectedReturn({ 
      ...selectedReviewDetails(selectedReturn), 
      status: "disputed",
      shop_dispute_reason: disputeReason.trim(),
      shop_proof_images: ["https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=300&auto=format&fit=crop&q=60"]
    });
    
    setIsDisputeOpen(false);
    setDisputeReason("");
    toast.success("Đã gửi đơn khiếu nại lên bộ phận kiểm duyệt của Sàn!");
  };

  const selectedReviewDetails = (ret: any) => {
    return localReturns.find(r => r.id === ret.id) || ret;
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const currentDetails = selectedReturn ? selectedReviewDetails(selectedReturn) : null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-border/60 shadow-sm bg-[#F8FAFC]/50 dark:bg-slate-900/30">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-indigo-500" />
            <span className="text-sm font-bold text-foreground">Yêu cầu trả hàng & hoàn tiền sàn</span>
          </div>

          <div className="flex gap-2 w-full md:w-auto items-center justify-end">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Trạng thái:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-xs bg-background">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Sàn:</span>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-8 w-28 text-xs bg-background">
                  <SelectValue placeholder="Tất cả nguồn" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả nguồn</SelectItem>
                  {Object.entries(platformLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: List */}
        <div className="lg:col-span-5 space-y-2 max-h-[65vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <Card className="border-dashed border-border py-12 text-center text-muted-foreground text-sm">
              Chưa có yêu cầu trả hàng nào khớp với bộ lọc.
            </Card>
          ) : (
            filtered.map((ret: any) => {
              const isSelected = selectedReturn?.id === ret.id;
              
              return (
                <div
                  key={ret.id}
                  onClick={() => handleSelectReturn(ret)}
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
                          ret.platform_source === "shopee" ? "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" :
                          ret.platform_source === "lazada" ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" :
                          ret.platform_source === "tiktok" ? "bg-[#010101] text-white dark:bg-slate-800 dark:text-slate-200" :
                          "bg-slate-100 text-slate-700"
                        )}
                      >
                        {platformLabels[ret.platform_source] || ret.platform_source}
                      </Badge>
                      <span className="text-[10px] font-bold text-foreground font-mono">
                        {ret.orders?.order_number || `ORD-${ret.id.slice(-5).toUpperCase()}`}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(ret.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    "{ret.reason || "Không có lý do chi tiết"}"
                  </p>

                  <div className="flex justify-between items-center pt-1 border-t border-dashed border-border/60">
                    <span className="text-xs font-bold text-primary">
                      {Number(ret.refund_amount || 0).toLocaleString("vi-VN")}đ
                    </span>
                    <Badge variant="outline" className={cn("text-[9px] px-2 py-0 border-none font-bold rounded-full", statusColors[ret.status])}>
                      {statusLabels[ret.status] || ret.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Details & Actions */}
        <div className="lg:col-span-7">
          {currentDetails ? (
            <Card className="border border-border/80 shadow-md h-full flex flex-col justify-between">
              <div>
                <CardHeader className="border-b pb-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ArrowRightLeft className="h-4.5 w-4.5 text-indigo-500" /> Chi tiết đơn trả hàng #{currentDetails.id}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Liên kết đơn sàn: <a href={`/orders?search=${currentDetails.orders?.order_number}`} className="underline text-indigo-650 font-bold hover:text-indigo-850">{currentDetails.orders?.order_number}</a>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge className={cn("text-[9px] px-2.5 py-0.5 font-bold border rounded-full", statusColors[currentDetails.status])}>
                        {statusLabels[currentDetails.status]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Products being returned */}
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Sản phẩm trả lại:</div>
                    {currentDetails.return_items && currentDetails.return_items.length > 0 ? (
                      <div className="space-y-2">
                        {currentDetails.return_items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2.5 border rounded-xl shadow-inner">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 bg-indigo-50 dark:bg-slate-800 rounded-lg border flex items-center justify-center">
                                <ShoppingBag className="h-4 w-4 text-indigo-500" />
                              </div>
                              <div className="flex flex-col text-xs">
                                <span className="font-extrabold text-foreground">{item.product_name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {item.product_sku || "N/A"}</span>
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="font-bold text-foreground">x{item.quantity}</div>
                              <div className="text-[10px] text-muted-foreground">{Number(item.price || 0).toLocaleString("vi-VN")}đ</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs italic text-muted-foreground">Không có danh sách sản phẩm chi tiết</div>
                    )}
                  </div>

                  {/* Return details and amount */}
                  <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] dark:bg-slate-900/20 p-3.5 border rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold">TỔNG HOÀN TIỀN</span>
                      <div className="text-lg font-extrabold text-indigo-650 dark:text-indigo-400">
                        {Number(currentDetails.refund_amount || 0).toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold">PHƯƠNG THỨC</span>
                      <div className="text-xs font-bold text-foreground">
                        Hoàn tiền ví sàn ({platformLabels[currentDetails.platform_source]})
                      </div>
                    </div>
                  </div>

                  {/* Customer Reason and proof */}
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      ⚠️ Lý do hoàn từ khách hàng:
                    </div>
                    <p className="text-xs text-foreground bg-amber-50/50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40 p-3 rounded-xl italic">
                      "{currentDetails.reason || "Không cung cấp lý do chi tiết"}"
                    </p>

                    {currentDetails.customer_proof_images && currentDetails.customer_proof_images.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground">Ảnh bằng chứng của khách hàng:</span>
                        <div className="flex gap-2">
                          {currentDetails.customer_proof_images.map((img: string, i: number) => (
                            <div key={i} className="relative group border rounded-lg overflow-hidden h-20 w-28 shadow-sm">
                              <img src={img} alt="customer proof" className="h-full w-full object-cover group-hover:scale-105 transition-all" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => window.open(img, "_blank")}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dispute Details if any */}
                  {currentDetails.status === "disputed" && currentDetails.shop_dispute_reason && (
                    <div className="space-y-2 border-t pt-3">
                      <div className="text-[10px] uppercase font-bold text-purple-700 flex items-center gap-1">
                        💜 BẰNG CHỨNG ĐỐI CHỨNG CỦA SHOP (ĐANG KHIẾU NẠI)
                      </div>
                      <p className="text-xs text-foreground bg-purple-50/50 border border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/40 p-3 rounded-xl">
                        {currentDetails.shop_dispute_reason}
                      </p>
                      {currentDetails.shop_proof_images && currentDetails.shop_proof_images.length > 0 && (
                        <div className="flex gap-2">
                          {currentDetails.shop_proof_images.map((img: string, i: number) => (
                            <img key={i} src={img} alt="shop proof" className="h-16 w-24 object-cover rounded-lg border shadow-sm" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
              </div>

              {/* Actions footer */}
              <div className="border-t p-3.5 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-2 justify-end rounded-b-xl">
                {currentDetails.status === "requested" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus("rejected")}
                      className="text-xs h-9 font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Từ chối hoàn
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsDisputeOpen(true)}
                      className="text-xs h-9 font-semibold text-purple-600 border-purple-200 hover:bg-purple-50 flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Khiếu nại Sàn
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus("approved")}
                      className="text-xs h-9 font-bold bg-indigo-650 hover:bg-indigo-750 text-white flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Đồng ý hoàn tiền
                    </Button>
                  </>
                )}

                {currentDetails.status === "approved" && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus("received")}
                    className="text-xs h-9 font-bold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Đã nhận hàng hoàn (Nhập kho)
                  </Button>
                )}

                {currentDetails.status === "received" && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus("refunded")}
                    className="text-xs h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Xác nhận đã hoàn tiền ví
                  </Button>
                )}

                {currentDetails.status === "disputed" && (
                  <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-200">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Chờ phân xử từ bộ phận điều phối của Sàn TMĐT
                  </div>
                )}

                {currentDetails.status === "refunded" && (
                  <div className="text-[11px] text-green-700 font-bold flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-lg border border-green-200">
                    ✓ Yêu cầu hoàn tiền đã hoàn tất và kết thúc giao dịch
                  </div>
                )}

                {currentDetails.status === "rejected" && (
                  <div className="text-[11px] text-rose-700 font-bold flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-200">
                    ✗ Yêu cầu trả hàng hoàn tiền bị từ chối
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="h-full border border-dashed border-border rounded-xl flex flex-col items-center justify-center py-20 text-muted-foreground">
              <AlertCircle className="h-10 w-10 opacity-30 mb-2" />
              <span className="text-sm">Chọn một yêu cầu trả hàng ở cột trái để xử lý</span>
            </div>
          )}
        </div>

      </div>

      {/* Dispute Dialog */}
      <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-purple-700">
              <AlertTriangle className="h-4.5 w-4.5" /> Gửi đơn Khiếu nại lên Sàn
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nhập lý do đối chứng và đính kèm bằng chứng (video đóng gói, phiếu gửi hàng) để bộ phận hỗ trợ của Sàn làm trung gian phân xử.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Lý do khiếu nại của shop:</label>
              <Textarea
                placeholder="Ví dụ: Sản phẩm khi nhận về bị phá hỏng do lỗi vận hành của khách, không phải lỗi từ khâu vận chuyển..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="text-xs min-h-[100px]"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Ảnh bằng chứng đối chứng (Shop Proof):</span>
              <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/30 cursor-pointer">
                <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Đã đính kèm ảnh chụp gói hàng lúc gửi đi thành công</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsDisputeOpen(false)}>Thoát</Button>
            <Button size="sm" onClick={handleSendDispute} className="bg-purple-650 hover:bg-purple-750 text-white font-bold flex items-center gap-1">
              <Send className="h-3.5 w-3.5" /> Gửi khiếu nại sàn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

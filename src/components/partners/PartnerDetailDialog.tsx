import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePartnerDetail } from "@/hooks/usePartnerDetail";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useSalesPolicies, SEGMENT_COLORS, type PolicySegment } from "@/hooks/useSalesPolicies";
import { useMemberships } from "@/hooks/useMemberships";
import {
  User, ShoppingCart, CreditCard, Package, MessageSquare,
  Plus, Phone, Mail, MapPin, Star, Loader2, Check, Clock,
  Trash2, Calendar, FileText, Sparkles, ShieldCheck, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: any;
}

const NOTE_TYPES = [
  { value: "general", label: "Chung", color: "bg-muted text-muted-foreground" },
  { value: "call", label: "Gọi điện", color: "bg-primary/10 text-primary" },
  { value: "email", label: "Email", color: "bg-info/10 text-info" },
  { value: "meeting", label: "Gặp mặt", color: "bg-success/10 text-success" },
  { value: "complaint", label: "Khiếu nại", color: "bg-destructive/10 text-destructive" },
  { value: "follow_up", label: "Theo dõi", color: "bg-warning/10 text-warning" },
];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ xử lý", variant: "secondary" },
  confirmed: { label: "Đã xác nhận", variant: "default" },
  shipping: { label: "Đang giao", variant: "outline" },
  delivered: { label: "Đã giao", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const renderSimulatedQRCode = (code: string) => {
  return (
    <svg width="75" height="75" viewBox="0 0 29 29" className="bg-white p-1.5 rounded-md shrink-0 shadow-sm">
      <path d="M0 0h7v2H2v5H0V0zm22 0h7v7h-2V2h-5V0zM0 22h2v5h5v2H0v-7zm27 0h2v7h-7v-2h5v-5z" fill="#000" />
      <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm1 1h3v3H5V5z" fill="#000" />
      <path d="M19 3h7v7h-7V3zm1 1v5h5V4H20zm1 1h3v3H21V5z" fill="#000" />
      <path d="M3 19h7v7H3v-7zm1 1v5h5v-5H4zm1 1h3v3H5v-3z" fill="#000" />
      <path d="M12 4h1v1h-1zm2 0h1v1h-1zm1 2h1v1h-1zm-2 2h1v1h-1zm4 4h1v1h-1zm1 1h1v1h-1zm-3 2h1v1h-1zm2 2h1v1h-1zm-6 2h1v1h-1z" fill="#000" />
      <path d="M4 12h1v1H4zm2 0h1v1H6zm6 2h1v1h-1zm4 0h1v1h-1zm-2 2h1v1h-1zm4 2h1v1h-1zm1 1h1v1h-1zm-3 2h1v1h-1z" fill="#000" />
      <rect x="12" y="12" width="5" height="5" fill="#4f46e5" />
    </svg>
  );
};

export function PartnerDetailDialog({ open, onOpenChange, partner }: Props) {
  const { warehouses } = useWarehouses();
  const { categories } = useProductCategories();
  const { getPoliciesForSegment } = useSalesPolicies();
  const { orders, transactions, topProducts, purchasedItems = [], notes, stats, isLoading, createNote, updateNote, deleteNote } = usePartnerDetail(partner?.id || null);
  const { memberships = [] } = useMemberships();
  const partnerMemberships = useMemo(() => {
    if (!partner?.id) return [];
    return memberships.filter(m => m.partner_id === partner.id);
  }, [memberships, partner?.id]);

  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [followUpDate, setFollowUpDate] = useState("");

  const warranties = useMemo(() => {
    // Build a map: category name (lowercase) -> warranty_months, and category ID -> warranty_months
    const catWarrantyMap = new Map<string, number>();
    for (const cat of categories) {
      if (cat.warranty_months !== undefined && cat.warranty_months !== null) {
        catWarrantyMap.set((cat.name || "").toLowerCase(), cat.warranty_months);
        catWarrantyMap.set(cat.id, cat.warranty_months);
      }
    }

    return purchasedItems.map((item: any) => {
      // Try to resolve warranty from the product's category
      let months: number | null = null;
      const productCategory = item.category ? String(item.category).trim() : "";
      
      if (productCategory) {
        if (catWarrantyMap.has(productCategory.toLowerCase())) {
          months = catWarrantyMap.get(productCategory.toLowerCase())!;
        } else if (catWarrantyMap.has(productCategory)) {
          months = catWarrantyMap.get(productCategory)!;
        }
      }

      // Fallback: only if category warranty is not set or undefined
      if (months === null || months === undefined) {
        const sku = (item.sku || "").toUpperCase();
        const name = (item.name || "").toUpperCase();
        if (sku.includes("QR-CARD") || name.includes("THẺ QR")) {
          months = 12;
        } else if (sku.includes("BOARD") || name.includes("BẢNG QR")) {
          months = 6;
        } else {
          months = 3; // final fallback if keyword also doesn't match
        }
      }

      const pDate = new Date(item.order_date);
      const expDate = new Date(pDate.getTime());
      expDate.setMonth(expDate.getMonth() + months);
      
      const isActive = expDate.getTime() > Date.now();

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        purchaseDate: item.order_date,
        expirationDate: expDate.toISOString(),
        durationMonths: months,
        isActive,
      };
    });
  }, [purchasedItems, categories]);

  const frequencyText = useMemo(() => {
    if (orders.length <= 1) return "Chưa đủ dữ liệu tần suất (cần tối thiểu 2 đơn)";
    const dates = orders.map(o => new Date(o.order_date).getTime()).sort((a, b) => a - b);
    const diffDays = Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 3600 * 24));
    const avgDays = Math.round(diffDays / (orders.length - 1));
    return avgDays <= 1 ? "Mua hàng hằng ngày" : `Mua lại trung bình sau mỗi ${avgDays} ngày`;
  }, [orders]);

  const preferredChannel = useMemo(() => {
    if (orders.length === 0) return "Chưa xác định";
    const channelsCount: Record<string, number> = {};
    orders.forEach(o => {
      const channel = o.channel_id || "Cửa hàng bán lẻ";
      channelsCount[channel] = (channelsCount[channel] || 0) + 1;
    });
    const sorted = Object.entries(channelsCount).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }, [orders]);

  const favoriteCategory = useMemo(() => {
    if (topProducts.length === 0) return "Chưa xác định";
    const categoryCount: Record<string, number> = {};
    topProducts.forEach(item => {
      const cat = item.product?.category || "Chưa phân loại";
      categoryCount[cat] = (categoryCount[cat] || 0) + item.totalQty;
    });
    const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }, [topProducts]);

  const totalItemsPurchased = useMemo(() => {
    return topProducts.reduce((sum, item) => sum + item.totalQty, 0);
  }, [topProducts]);

  if (!partner) return null;

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    await createNote.mutateAsync({
      partner_id: partner.id,
      note_type: noteType,
      content: noteContent.trim(),
      follow_up_date: followUpDate || null,
    });
    setNoteContent("");
    setNoteType("general");
    setFollowUpDate("");
  };

  const fmtMoney = (v: number) => Number(v || 0).toLocaleString("vi-VN") + "đ";
  const fmtDate = (d: string) => { try { return format(new Date(d), "dd/MM/yyyy"); } catch { return d; } };
  const fmtDateTime = (d: string) => { try { return format(new Date(d), "dd/MM/yyyy HH:mm"); } catch { return d; } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">{partner.name.charAt(0)}</span>
            </div>
            <div>
              <div>{partner.name}</div>
              <div className="text-sm font-normal text-muted-foreground">{partner.code}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="w-full grid grid-cols-7">
              <TabsTrigger value="overview" className="gap-1 text-xs sm:text-sm"><User className="h-4 w-4" /><span className="hidden sm:inline">Tổng quan</span></TabsTrigger>
              <TabsTrigger value="behavior" className="gap-1 text-xs sm:text-sm"><Sparkles className="h-4 w-4" /><span className="hidden sm:inline">Hành vi & Phân tích</span></TabsTrigger>
              <TabsTrigger value="orders" className="gap-1 text-xs sm:text-sm"><ShoppingCart className="h-4 w-4" /><span className="hidden sm:inline">Đơn hàng</span></TabsTrigger>
              <TabsTrigger value="payments" className="gap-1 text-xs sm:text-sm"><CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Thanh toán</span></TabsTrigger>
              <TabsTrigger value="products" className="gap-1 text-xs sm:text-sm"><Package className="h-4 w-4" /><span className="hidden sm:inline">Sản phẩm</span></TabsTrigger>
              <TabsTrigger value="warranty" className="gap-1 text-xs sm:text-sm"><ShieldCheck className="h-4 w-4" /><span className="hidden sm:inline">Bảo hành & CS</span></TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">CSKH</span></TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Tổng đơn hàng</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{fmtMoney(partner.total_spent || 0)}</div>
                  <div className="text-xs text-muted-foreground">Tổng chi tiêu</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <div className={cn("text-2xl font-bold", (partner.debt_amount || 0) > 0 ? "text-destructive" : "text-success")}>{fmtMoney(partner.debt_amount || 0)}</div>
                  <div className="text-xs text-muted-foreground">Công nợ</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-warning flex items-center justify-center gap-1"><Star className="h-5 w-5" />{partner.loyalty_points || 0}</div>
                  <div className="text-xs text-muted-foreground">Điểm tích lũy</div>
                </CardContent></Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Contact Info (2 cols) */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Thông tin liên hệ</CardTitle></CardHeader>
                    <CardContent className="space-y-2.5">
                      {partner.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{partner.phone}</div>}
                      {partner.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{partner.email}</div>}
                      {partner.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{partner.address}</div>}
                      {partner.tax_id && <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" />MST: {partner.tax_id}</div>}
                      {partner.branch_id && <div className="flex items-center gap-2 text-sm"><strong>Chi nhánh:</strong> {partner.branch_id}</div>}
                      {partner.warehouse_id && (
                        <div className="flex items-center gap-2 text-sm">
                          <strong>Kho mặc định:</strong> {warehouses.find(w => w.id === partner.warehouse_id)?.name || partner.warehouse_id}
                        </div>
                      )}
                      {partner.promo_segment && (
                        <div className="flex items-center gap-2 text-sm flex-wrap items-center gap-1">
                          <strong>Tệp ưu đãi:</strong>
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {partner.promo_segment === "all" ? "Khách lẻ / Tất cả (retail)" : partner.promo_segment === "loyalty" ? "Thành viên VIP (loyalty)" : "Khách mua sỉ (wholesale)"}
                          </Badge>
                        </div>
                      )}
                      {partner.notes && <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">{partner.notes}</div>}
                    </CardContent>
                  </Card>
                </div>

                {/* Glassmorphic VIP Membership Cards (1 col) */}
                <div className="md:col-span-1 space-y-4">
                  <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                    Thẻ thành viên ({partnerMemberships.length})
                  </div>
                  {partnerMemberships.length === 0 ? (
                    <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Chưa phát hành thẻ thành viên</p>
                    </div>
                  ) : (
                    partnerMemberships.map((card) => (
                      <div 
                        key={card.id}
                        className={cn(
                          "relative overflow-hidden rounded-xl p-5 text-white shadow-xl border flex flex-col justify-between transition-all hover:scale-[1.02] min-h-[220px]",
                          card.card_image 
                            ? "bg-slate-900 text-white" 
                            : card.tier === "diamond"
                            ? "bg-gradient-to-br from-cyan-900 via-blue-955/70 to-indigo-950 border-cyan-500/30"
                            : card.tier === "gold"
                            ? "bg-gradient-to-br from-slate-900 via-amber-955/70 to-slate-900 border-amber-500/30"
                            : card.tier === "silver"
                            ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-slate-600/30"
                            : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border-white/10"
                        )}
                        style={card.card_image ? { backgroundImage: `url(${card.card_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                      >
                        {card.card_image && (
                          <div className="absolute inset-0 bg-black/45 rounded-xl pointer-events-none" />
                        )}
                        {/* Metallic glow accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* Header */}
                        <div className="flex items-start justify-between z-10">
                          <div>
                            <div className="text-[9px] font-bold tracking-widest text-white/80">VIETERP SMART CARD</div>
                            <div className="text-[7px] text-white/50">MEMBER CARD</div>
                          </div>
                          <Badge className={cn(
                            "text-[8px] px-1.5 py-0.5 leading-none uppercase font-mono border-none",
                            card.tier === "diamond"
                              ? "bg-cyan-500 text-cyan-950 hover:bg-cyan-400"
                              : card.tier === "gold"
                              ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                              : card.tier === "silver"
                              ? "bg-slate-300 text-slate-900 hover:bg-slate-200"
                              : "bg-orange-400 text-orange-950 hover:bg-orange-300"
                          )}>
                            {card.tier}
                          </Badge>
                        </div>

                        {/* Middle: QR & Code */}
                        <div className="flex items-center justify-between gap-4 mt-2 z-10">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold truncate max-w-[130px]">{partner.name}</div>
                            <div className="text-[10px] text-white/60 font-mono tracking-wider">{card.card_number}</div>
                          </div>
                          {renderSimulatedQRCode(card.card_number)}
                        </div>

                        {/* Footer: balance and points */}
                        <div className="flex items-end justify-between border-t border-white/10 pt-2 mt-2 z-10">
                          <div className="text-[9px] text-white/60">
                            Ví: <span className="font-semibold text-white">{card.balance.toLocaleString("vi-VN")}đ</span>
                          </div>
                          <div className="text-[9px] text-white/60 flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="font-semibold text-white">{card.points || 0} điểm</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Phân tích hành vi mua sắm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Tần suất mua sắm:</span>
                      <span className="text-sm font-medium">{frequencyText}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Giá trị đơn trung bình (AOV):</span>
                      <span className="text-sm font-medium">{fmtMoney(stats.totalSpent / (stats.totalOrders || 1))}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Kênh mua sắm ưu thích:</span>
                      <Badge variant="outline">{preferredChannel}</Badge>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-sm text-muted-foreground">Tổng số sản phẩm đã mua:</span>
                      <span className="text-sm font-medium">{totalItemsPurchased} sản phẩm</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4 text-warning" /> Tiến trình nâng hạng thành viên
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Phân khúc hiện tại:</span>
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {partner.promo_segment === "loyalty" ? "VIP Member" : partner.promo_segment === "wholesale" ? "Khách mua sỉ" : "Khách bán lẻ"}
                      </Badge>
                    </div>
                    {partner.promo_segment === "all" ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Chi tiêu tích lũy: {fmtMoney(partner.total_spent || 0)}</span>
                          <span>Mục tiêu VIP: 10.000.000đ</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all" 
                            style={{ width: `${Math.min(((partner.total_spent || 0) / 10000000) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Tích lũy thêm {fmtMoney(Math.max(10000000 - (partner.total_spent || 0), 0))} để tự động thăng hạng VIP.
                        </p>
                      </div>
                    ) : partner.promo_segment === "loyalty" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600 text-xs">
                          <Check className="h-4 w-4" />
                          <span>Đã đạt hạng Thành viên VIP tối đa</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Hưởng ưu đãi tự động trong các chiến dịch VIP Loyalty và tích lũy điểm thưởng.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 text-xs">
                          <Check className="h-4 w-4" />
                          <span>Đã áp dụng tệp khách hàng mua sỉ</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Hưởng chiết khấu tự động dành cho đối tác mua sỉ phân phối.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-500" /> Hồ sơ thu thập và sở thích ngành hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Ngành hàng yêu thích nhất:</span>
                      <Badge variant="secondary">{favoriteCategory}</Badge>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">Chi nhánh quản lý:</span>
                      <span className="text-sm font-medium">{partner.branch_id || "Hệ thống chung"}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-sm text-muted-foreground">Kho hàng mặc định:</span>
                      <span className="text-sm font-medium">
                        {warehouses.find(w => w.id === partner.warehouse_id)?.name || "Chưa thiết lập"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">Hành vi phản hồi và khiếu nại (CSKH)</div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>Tổng ghi chú: <span className="font-semibold">{notes.length}</span></div>
                      <div>Cần theo dõi: <span className="font-semibold">{notes.filter(n => n.follow_up_date).length}</span></div>
                      <div>Ý kiến khiếu nại: <span className="font-semibold text-destructive">{notes.filter(n => n.note_type === "complaint").length}</span></div>
                      <div>Gặp mặt trực tiếp: <span className="font-semibold text-success">{notes.filter(n => n.note_type === "meeting").length}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Chưa có đơn hàng nào</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Thanh toán</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.order_number}</TableCell>
                        <TableCell>{fmtDate(o.order_date)}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_MAP[o.status]?.variant || "secondary"}>
                            {STATUS_MAP[o.status]?.label || o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmtMoney(o.total || 0)}</TableCell>
                        <TableCell>
                          <Badge variant={o.payment_status === "paid" ? "default" : "outline"}>
                            {o.payment_status === "paid" ? "Đã TT" : (o.payment_status === "partial" || o.payment_status === "partially_paid") ? "TT một phần" : "Chưa TT"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Chưa có giao dịch thanh toán</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{fmtDate(t.transaction_date)}</TableCell>
                        <TableCell>
                          <Badge variant={t.transaction_type.includes("payment") ? "default" : "outline"}>
                            {t.transaction_type === "payment_in" ? "Thu" : t.transaction_type === "payment_out" ? "Chi" : t.transaction_type === "receivable" ? "Phải thu" : "Phải trả"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmtMoney(t.amount)}</TableCell>
                        <TableCell>{t.payment_method || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{t.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              {topProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Chưa có dữ liệu sản phẩm</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-right">Số lần mua</TableHead>
                      <TableHead className="text-right">Tổng SL</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.product?.name || "N/A"}</TableCell>
                        <TableCell className="text-right">{p.orderCount}</TableCell>
                        <TableCell className="text-right">{p.totalQty}</TableCell>
                        <TableCell className="text-right font-medium">{fmtMoney(p.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Warranty & Policies Tab */}
            <TabsContent value="warranty" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Policies (1 col) */}
                <div className="md:col-span-1 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Chính sách mua hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs text-muted-foreground pb-1">
                        Áp dụng dựa trên phân khúc đối tác hiện tại:
                      </div>
                      {(() => {
                        const segment: PolicySegment = partner.promo_segment === "loyalty" ? "loyalty" : partner.promo_segment === "wholesale" ? "wholesale" : "all";
                        const activePolicies = getPoliciesForSegment(segment);
                        const colorClass = SEGMENT_COLORS[segment];
                        
                        if (activePolicies.length === 0) {
                          return (
                            <div className="text-xs text-muted-foreground text-center py-4">
                              Chưa có chính sách nào cho phân khúc này.
                              <br />
                              <span className="text-[10px]">Thiết lập tại Cài đặt → Chính sách</span>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2.5">
                            {activePolicies.map((policy) => (
                              <div key={policy.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-muted/50 text-xs">
                                <Check className={cn("h-4 w-4 shrink-0 mt-0.5", colorClass)} />
                                <div className="space-y-0.5">
                                  <div className="flex items-center flex-wrap gap-1">
                                    <span className="font-semibold text-foreground">{policy.title}</span>
                                    {policy.value > 0 && policy.unit && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/5 text-primary border-primary/20">
                                        {policy.unit === "đ"
                                          ? `${policy.value.toLocaleString("vi-VN")}${policy.unit}`
                                          : `${policy.value} ${policy.unit}`}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{policy.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Warranties (2 cols) */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-primary" /> Theo dõi bảo hành sản phẩm
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {warranties.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-xs">
                          Chưa có lịch sử mua sản phẩm bảo hành.
                        </div>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto overflow-x-auto w-full">
                          <Table className="min-w-[500px] md:min-w-full">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Sản phẩm</TableHead>
                                <TableHead className="text-xs">Ngày mua</TableHead>
                                <TableHead className="text-xs text-center">Bảo hành</TableHead>
                                <TableHead className="text-xs text-right">Trạng thái</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {warranties.map((w, i) => (
                                <TableRow key={w.id || i}>
                                  <TableCell className="font-medium text-xs">
                                    <div>{w.name}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{w.sku}</div>
                                  </TableCell>
                                  <TableCell className="text-xs">{fmtDate(w.purchaseDate)}</TableCell>
                                  <TableCell className="text-xs text-center">{w.durationMonths} tháng</TableCell>
                                  <TableCell className="text-right">
                                    <Badge 
                                      variant={w.isActive ? "default" : "secondary"} 
                                      className={cn("text-[9px] uppercase px-1.5 py-0", w.isActive ? "bg-green-600 hover:bg-green-500" : "bg-muted text-muted-foreground")}
                                    >
                                      {w.isActive ? "Còn hạn" : "Hết hạn"}
                                    </Badge>
                                    <div className="text-[9px] text-muted-foreground mt-0.5">
                                      Hạn: {fmtDate(w.expirationDate)}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Select value={noteType} onValueChange={setNoteType}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-[160px]" placeholder="Follow-up" />
                  </div>
                  <Textarea placeholder="Nội dung ghi chú..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={2} />
                  <Button onClick={handleAddNote} disabled={!noteContent.trim() || createNote.isPending} size="sm">
                    <Plus className="h-4 w-4 mr-1" />Thêm ghi chú
                  </Button>
                </CardContent>
              </Card>

              {notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Chưa có ghi chú CSKH</div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => {
                    const typeInfo = NOTE_TYPES.find((t) => t.value === note.note_type) || NOTE_TYPES[0];
                    return (
                      <Card key={note.id} className={cn(note.is_resolved && "opacity-60")}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                                <span className="text-xs text-muted-foreground">{fmtDateTime(note.created_at)}</span>
                                {note.follow_up_date && (
                                  <span className="text-xs flex items-center gap-1 text-warning"><Calendar className="h-3 w-3" />{fmtDate(note.follow_up_date)}</span>
                                )}
                              </div>
                              <p className="text-sm">{note.content}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => updateNote.mutate({ id: note.id, is_resolved: !note.is_resolved })}>
                                {note.is_resolved ? <Clock className="h-4 w-4" /> : <Check className="h-4 w-4 text-success" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteNote.mutate(note.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

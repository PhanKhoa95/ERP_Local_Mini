import { type FormEvent, type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Package,
  RotateCcw,
  Search,
  Send,
  Store,
  Truck,
  XCircle,
  ShieldCheck,
  User,
  Phone,
  HelpCircle,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Order = Tables<"orders"> & {
  order_items?: (Tables<"order_items"> & { products?: Tables<"products"> | null })[];
};

type TrackingSearch = {
  orderNumber: string;
  phoneDigits: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: ReactNode; desc: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <Clock className="w-4 h-4 text-amber-500" />, desc: "Đơn hàng đang chờ nhân viên kiểm duyệt thông tin." },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <CheckCircle className="w-4 h-4 text-blue-500" />, desc: "Cửa hàng đã xác nhận đơn hàng và đang chuẩn bị đóng gói." },
  processing: { label: "Đang đóng gói", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: <Package className="w-4 h-4 text-purple-500" />, desc: "Sản phẩm đang được nhặt hàng và đóng gói tại kho." },
  shipping: { label: "Đang vận chuyển", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", icon: <Truck className="w-4 h-4 text-cyan-500" />, desc: "Đơn hàng đã giao cho đơn vị vận chuyển và đang trên đường tới bạn." },
  delivered: { label: "Đã giao hàng", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, desc: "Đơn hàng đã được giao thành công tới người nhận." },
  cancelled: { label: "Đã hủy", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: <XCircle className="w-4 h-4 text-rose-500" />, desc: "Đơn hàng đã bị hủy trên hệ thống." },
  returned: { label: "Đã hoàn trả", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: <RotateCcw className="w-4 h-4 text-orange-500" />, desc: "Đơn hàng đang được hoàn trả về kho của cửa hàng." },
};

const normalizeOrderNumber = (value: string) =>
  value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

const normalizePhone = (value: string) => value.replace(/\D/g, "");

export default function OrderTracking() {
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState<TrackingSearch | null>(null);
  const [aiQuery, setAiQuery] = useState("");
  
  // Chat dialogue state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: "Xin chào! Tôi là trợ lý AI tra cứu đơn hàng. Tôi có thể giải đáp các thông tin về lịch trình, đổi trả hoặc hỗ trợ xử lý sự cố giao hàng. Bạn muốn biết gì ạ?" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const {
    data: orders = [],
    error: trackingError,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["order-tracking", submittedSearch],
    queryFn: async () => {
      if (!submittedSearch) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(*, products(*))
        `)
        .eq("order_number", submittedSearch.orderNumber)
        .or(`customer_phone.eq.${submittedSearch.phoneDigits},shipping_address.ilike.%${submittedSearch.phoneDigits}%`)
        .maybeSingle();

      if (error) throw error;
      return data ? [data as Order] : [];
    },
    enabled: !!submittedSearch,
    retry: false,
  });

  const matchedOrder = orders[0] ?? null;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    const normalizedOrderNumber = normalizeOrderNumber(orderNumber);
    const phoneDigits = normalizePhone(phoneNumber);

    if (!normalizedOrderNumber || phoneDigits.length < 8) {
      setFormError("Vui lòng nhập mã đơn hàng và số điện thoại hợp lệ.");
      return;
    }

    setFormError("");
    setChatMessages([
      { sender: "bot", text: "Tôi đã tìm thấy đơn hàng của bạn. Bạn có câu hỏi nào thêm về lộ trình vận chuyển hay chính sách nhận hàng không?" }
    ]);
    setSubmittedSearch({ orderNumber: normalizedOrderNumber, phoneDigits });
  };

  const handleAIQuerySubmit = async (queryText: string) => {
    if (!queryText.trim() || aiLoading || !matchedOrder) return;

    if (!matchedOrder.company_id) {
      toast({
        variant: "destructive",
        title: "Chưa thể dùng AI",
        description: "Đơn hàng này chưa có thông tin cửa hàng để trợ lý tra cứu ngữ cảnh.",
      });
      return;
    }

    // Add user message to chat log
    setChatMessages(prev => [...prev, { sender: "user", text: queryText }]);
    setAiLoading(true);

    try {
      const status = statusConfig[matchedOrder.status]?.label || matchedOrder.status;
      const orderContext = `Đơn hàng ${matchedOrder.order_number}, trạng thái ${status}, tổng tiền ${formatPrice(matchedOrder.total || 0)}. Người nhận ở địa chỉ: ${matchedOrder.customer_address || matchedOrder.shipping_address || "Chưa rõ"}.`;

      const { data, error } = await supabase.functions.invoke("chat-with-docs", {
        body: {
          question: `[Ngữ cảnh: ${orderContext}]\n\nCâu hỏi: ${queryText}`,
          companyId: matchedOrder.company_id,
        },
      });

      if (error) throw error;
      setChatMessages(prev => [...prev, { sender: "bot", text: data.answer || "Không thể trả lời." }]);
    } catch (error) {
      console.error("AI error:", error);
      setChatMessages(prev => [...prev, { sender: "bot", text: "Xin lỗi, hiện tại tôi đang gặp sự cố kết nối với máy chủ AI. Vui lòng gửi lại câu hỏi sau ít phút." }]);
    } finally {
      setAiLoading(false);
      setAiQuery("");
    }
  };

  const handleQuickQuestion = (text: string) => {
    handleAIQuerySubmit(text);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-white">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3 max-w-4xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight sm:text-base bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Hệ Thống Tra Cứu Vận Đơn
            </span>
          </div>
          <Link to="/order">
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-800 hover:text-white transition-all gap-1.5 rounded-lg">
              <ArrowLeft className="w-3.5 h-3.5" />
              Đặt hàng
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl flex-grow space-y-6">
        {/* Banner banner image */}
        <div className="relative w-full h-[150px] sm:h-[180px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
          <img 
            src="/tracking_banner.png" 
            alt="Tracking Page Banner" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-center sm:text-left space-y-1">
            <Badge className="bg-indigo-600 text-white border-none font-bold uppercase text-[9px] tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
              Real-time tracking
            </Badge>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Cổng thông tin kiểm tra đơn hàng tự động</h2>
          </div>
        </div>

        <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-xl overflow-hidden">
          <CardHeader className="text-center p-6 pb-2">
            <CardTitle className="text-lg font-extrabold text-white">Tra cứu nhanh trạng thái đơn hàng</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Nhập mã đơn hàng và số điện thoại đặt hàng để cập nhật lộ trình giao hàng trực tiếp.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  aria-label="Mã đơn hàng"
                  placeholder="Mã đơn hàng: PO-123456"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className="pl-10 h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <Input
                aria-label="Số điện thoại"
                inputMode="tel"
                placeholder="Số điện thoại đặt hàng"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(normalizePhone(e.target.value))}
                maxLength={15}
                className="h-10 text-xs bg-slate-950 border-slate-800 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <Button type="submit" disabled={isFetching} className="h-10 px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-500/10 rounded-lg">
                {isFetching ? "Đang tìm..." : "Tìm kiếm"}
              </Button>
            </form>
            {formError && <p className="mt-3 text-xs text-rose-500 font-semibold flex items-center gap-1"><Info className="h-3.5 w-3.5" /> {formError}</p>}
          </CardContent>
        </Card>

        {submittedSearch && (
          <div className="space-y-6">
            {isLoading ? (
              <Card className="py-20 text-center border border-slate-800 bg-slate-900/40">
                <CardContent className="space-y-3">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Đang kết nối hệ thống tìm kiếm vận đơn...</p>
                </CardContent>
              </Card>
            ) : trackingError ? (
              <Card className="py-16 text-center border border-slate-850 bg-slate-900/30">
                <CardContent>
                  <XCircle className="w-12 h-12 mx-auto mb-3 text-rose-500/80 animate-bounce" />
                  <p className="font-extrabold text-sm text-white">Không tìm thấy thông tin vận đơn</p>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                    Vui lòng thử lại hoặc liên kết trực tiếp với bộ phận chăm sóc khách hàng qua Hotline của chúng tôi.
                  </p>
                </CardContent>
              </Card>
            ) : !matchedOrder ? (
              <Card className="py-16 text-center border border-slate-850 bg-slate-900/30">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="font-extrabold text-sm text-white">Không tìm thấy đơn hàng</p>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                    Hãy kiểm tra lại mã số đơn hoặc số điện thoại đăng ký mua hàng.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Result Section */}
                <OrderResult order={matchedOrder} formatDate={formatDate} formatPrice={formatPrice} />

                {/* Conversational AI Chat Assistant */}
                <Card className="border border-indigo-500/20 bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
                  <div className="p-4 bg-indigo-950/20 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          Trợ lý ảo AI tư vấn đơn hàng
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[9px] text-slate-400">Trực tuyến 24/7 • Đồng bộ từ cửa hàng</p>
                      </div>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </div>

                  <CardContent className="p-4 space-y-4">
                    {/* Chat logs */}
                    <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50"}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-700/30 text-xs text-slate-400 flex items-center gap-2 rounded-tl-none">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" /> Trợ lý đang kiểm tra cơ sở dữ liệu...
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick suggestion bubbles */}
                    {matchedOrder.company_id && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <HelpCircle className="h-3 w-3" /> Gợi ý câu hỏi nhanh:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickQuestion("Khi nào đơn hàng được giao?")}
                            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-indigo-350 border border-slate-850 hover:border-indigo-500/30 rounded-full transition-all"
                          >
                            🚚 Khi nào giao?
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickQuestion("Tôi muốn thay đổi địa chỉ nhận hàng")}
                            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-indigo-350 border border-slate-850 hover:border-indigo-500/30 rounded-full transition-all"
                          >
                            📍 Đổi địa chỉ nhận
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickQuestion("Chính sách trả hàng và hoàn tiền thế nào?")}
                            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-[10px] font-bold text-indigo-350 border border-slate-850 hover:border-indigo-500/30 rounded-full transition-all"
                          >
                            🔄 Đổi trả & Hoàn tiền
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Chat Input */}
                    <div className="flex gap-2 pt-2">
                      <Input
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAIQuerySubmit(aiQuery); }}
                        placeholder={
                          matchedOrder.company_id
                            ? "Nhập câu hỏi tại đây..."
                            : "Trợ lý ảo chưa được cấu hình cho đơn hàng này."
                        }
                        disabled={aiLoading || !matchedOrder.company_id}
                        className="h-9 text-xs bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => handleAIQuerySubmit(aiQuery)}
                        disabled={aiLoading || !aiQuery.trim() || !matchedOrder.company_id}
                        className="h-9 w-9 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function OrderResult({
  order,
  formatDate,
  formatPrice,
}: {
  order: Order;
  formatDate: (date: string) => string;
  formatPrice: (price: number) => string;
}) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const shippingAddress = order.customer_address || order.shipping_address;

  // Track map coordinates and points
  // 1: Warehouse point, 2: Courier hub, 3: Delivery point
  const mapPoints = [
    { name: "Kho xuất hàng (Hồ Chí Minh)", x: 45, y: 75, active: true },
    { name: "Bưu cục trung chuyển GHTK", x: 120, y: 55, active: ["confirmed", "processing", "shipping", "delivered"].includes(order.status) },
    { name: "Địa chỉ người nhận", x: 220, y: 35, active: ["delivered"].includes(order.status) }
  ];

  return (
    <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Đơn hàng của bạn</div>
            <CardTitle className="text-base font-extrabold text-white mt-0.5">{order.order_number}</CardTitle>
            <CardDescription className="text-[10px] text-slate-450">{formatDate(order.created_at)}</CardDescription>
          </div>
          <Badge className={cn("gap-1.5 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm select-none", status.color)}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Description message */}
        <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-start gap-2.5 text-xs">
          <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-white">Chi tiết trạng thái:</span>
            <p className="text-slate-400">{status.desc}</p>
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="py-2 bg-slate-950/40 rounded-2xl border border-slate-850 p-4">
          <OrderTimeline order={order} formatDate={formatDate} />
        </div>

        {/* Interactive SVG Route Map Mockup */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            🗺️ Lộ trình vận chuyển trực quan (Live Map Hub)
          </p>

          <div className="relative w-full h-[150px] bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden p-3 flex flex-col justify-between">
            {/* SVG Canvas drawing path */}
            <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 45,75 Q 82.5,65 120,55 T 220,35"
                fill="none"
                stroke={order.status === "delivered" ? "#10b981" : "#6366f1"}
                strokeWidth="2"
                strokeDasharray="6,4"
                className="animate-[dash_10s_linear_infinite]"
              />
            </svg>

            {/* Simulated Points */}
            <div className="relative flex-1">
              {mapPoints.map((pt, idx) => (
                <div
                  key={idx}
                  className="absolute"
                  style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center relative",
                    pt.active 
                      ? "bg-indigo-650 border-white shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
                      : "bg-slate-850 border-slate-700 text-slate-600"
                  )}>
                    {idx === 0 && <Store className="h-2 w-2 text-white" />}
                    {idx === 1 && <Truck className="h-2 w-2 text-white" />}
                    {idx === 2 && <MapPin className="h-2 w-2 text-white" />}

                    {/* Glow effect on current position */}
                    {pt.active && !mapPoints[idx + 1]?.active && (
                      <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-60" />
                    )}
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[8px] font-bold text-white px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-80 select-none">
                    {pt.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Courier driver badge */}
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex items-center justify-between text-[10px] w-fit gap-4 backdrop-blur shadow-md self-end z-10">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border text-slate-300">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white">Shipper: Nguyễn Văn Nam</div>
                  <p className="text-[8px] text-slate-400">Giao Hàng Tiết Kiệm (GHTK)</p>
                </div>
              </div>
              <a href="tel:0909000888" className="h-6 w-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                <Phone className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Address */}
        {shippingAddress && (
          <div className="flex items-start gap-2.5 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-850">
            <MapPin className="w-4.5 h-4.5 text-slate-450 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Địa chỉ giao hàng nhận hàng</p>
              <span className="whitespace-pre-line break-words text-white font-semibold">{shippingAddress}</span>
            </div>
          </div>
        )}

        {/* Items details */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Danh mục chi tiết sản phẩm mua</p>
          <div className="space-y-2">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-xs border-b border-slate-800/80 border-dashed pb-2.5 last:border-0 last:pb-0">
                <span className="min-w-0 flex-1 break-words font-semibold text-slate-200">
                  {item.products?.name || "Sản phẩm"} <span className="text-slate-500 font-bold ml-1">x{item.quantity}</span>
                </span>
                <span className="font-bold text-white whitespace-nowrap">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Total price */}
        <div className="flex justify-between gap-3 font-extrabold text-sm text-white">
          <span>Tổng tiền thanh toán (Đã bao gồm VAT & Ship):</span>
          <span className="text-indigo-400 whitespace-nowrap text-base">{formatPrice(order.total || 0)}</span>
        </div>

        {/* Customer notes */}
        {order.notes && (
          <div className="bg-amber-500/5 p-3 rounded-xl text-xs border border-amber-500/10">
            <p className="font-bold text-[9px] text-amber-500 uppercase tracking-widest mb-1">Ghi chú từ khách hàng</p>
            <p className="whitespace-pre-line break-words text-slate-400 font-medium">{order.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TimelineStep {
  label: string;
  description?: string;
  date?: string | null;
  status: "complete" | "current" | "upcoming" | "failed";
  icon: ReactNode;
}

function OrderTimeline({
  order,
  formatDate,
}: {
  order: Order;
  formatDate: (date: string) => string;
}) {
  const steps: TimelineStep[] = [];
  const isCancelled = order.status === "cancelled";
  const isReturned = order.status === "returned";

  if (isCancelled) {
    steps.push({
      label: "Đã đặt đơn",
      date: order.created_at,
      status: "complete",
      icon: <Clock className="w-4.5 h-4.5" />,
    });
    steps.push({
      label: "Yêu cầu đã hủy",
      description: order.cancelled_reason || "Hủy theo yêu cầu của hệ thống hoặc khách hàng.",
      date: order.cancelled_at || order.updated_at,
      status: "failed",
      icon: <XCircle className="w-4.5 h-4.5" />,
    });
  } else if (isReturned) {
    steps.push({
      label: "Đã đặt đơn",
      date: order.created_at,
      status: "complete",
      icon: <Clock className="w-4.5 h-4.5" />,
    });
    if (order.shipped_at) {
      steps.push({
        label: "Đã giao hàng",
        date: order.shipped_at,
        status: "complete",
        icon: <Truck className="w-4.5 h-4.5" />,
      });
    }
    steps.push({
      label: "Đã hoàn trả hàng",
      date: order.updated_at,
      status: "failed",
      icon: <RotateCcw className="w-4.5 h-4.5" />,
    });
  } else {
    // Normal Flow: Placed -> Confirmed -> Shipped -> Delivered
    steps.push({
      label: "Đã đặt đơn",
      date: order.created_at,
      status: "complete",
      icon: <Clock className="w-4.5 h-4.5" />,
    });

    const hasConfirmed = !!order.confirmed_at || ["confirmed", "processing", "shipping", "delivered"].includes(order.status);
    steps.push({
      label: "Đã xác nhận",
      date: order.confirmed_at,
      status: order.confirmed_at
        ? "complete"
        : order.status === "pending"
        ? "current"
        : hasConfirmed
        ? "complete"
        : "upcoming",
      icon: <CheckCircle className="w-4.5 h-4.5" />,
    });

    const hasShipped = !!order.shipped_at || ["shipping", "delivered"].includes(order.status);
    steps.push({
      label: "Đang giao hàng",
      date: order.shipped_at,
      status: order.shipped_at
        ? "complete"
        : order.status === "confirmed" || order.status === "processing"
        ? "current"
        : hasShipped
        ? "complete"
        : "upcoming",
      icon: <Truck className="w-4.5 h-4.5" />,
    });

    steps.push({
      label: "Đã nhận hàng",
      date: order.delivered_at,
      status: order.delivered_at
        ? "complete"
        : order.status === "shipping"
        ? "current"
        : "upcoming",
      icon: <CheckCircle className="w-4.5 h-4.5" />,
    });
  }

  return (
    <div className="w-full">
      {/* Mobile view (Vertical timeline) */}
      <div className="flex flex-col space-y-6 md:hidden px-1 py-1">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const statusColors = {
            complete: "bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.15)]",
            current: "bg-indigo-500 text-white border-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.35)]",
            upcoming: "bg-slate-900 text-slate-500 border-slate-800",
            failed: "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
          };

          return (
            <div key={idx} className="flex gap-4 relative">
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[16px] top-8 bottom-[-24px] w-[2px] transition-all duration-500",
                    step.status === "complete" ? "bg-green-500" : "bg-slate-850"
                  )}
                />
              )}
              <div
                className={cn(
                  "w-8 h-8 rounded-full border flex items-center justify-center z-10 flex-shrink-0 transition-all duration-300",
                  statusColors[step.status]
                )}
              >
                {step.icon}
              </div>
              <div className="flex-1 pt-0.5 min-w-0 text-left">
                <p className={cn(
                  "font-bold text-xs",
                  step.status === "upcoming" ? "text-slate-500" : "text-white"
                )}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatDate(step.date)}
                  </p>
                )}
                {step.description && (
                  <p className="text-[10px] text-rose-400 font-semibold mt-1.5 bg-rose-500/5 p-2 rounded border border-rose-500/10 max-w-full break-words">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop view (Horizontal timeline) */}
      <div className="hidden md:flex items-start justify-between relative px-2 w-full py-4">
        {/* Background Connecting Line */}
        <div className="absolute left-[12%] right-[12%] top-[30px] h-[2px] bg-slate-850 z-0" />
        
        {/* Dynamic completed line segments */}
        {steps.map((step, idx) => {
          if (idx === steps.length - 1) return null;
          const nextStep = steps[idx + 1];
          const isSegmentComplete = step.status === "complete" && nextStep.status !== "upcoming";
          const leftOffset = 12 + idx * (76 / (steps.length - 1));

          return (
            <div
              key={`line-${idx}`}
              className={cn(
                "absolute h-[2px] z-0 transition-all duration-500",
                isSegmentComplete ? "bg-green-500" : "bg-slate-800"
              )}
              style={{
                left: `${leftOffset}%`,
                width: `${76 / (steps.length - 1)}%`,
              }}
            />
          );
        })}

        {steps.map((step, idx) => {
          const statusColors = {
            complete: "bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.15)] hover:scale-105",
            current: "bg-indigo-650 text-white border-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.35)] hover:scale-105",
            upcoming: "bg-slate-900 text-slate-500 border-slate-800",
            failed: "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(239,68,68,0.15)] hover:scale-105",
          };

          return (
            <div
              key={idx}
              className="flex flex-col items-center text-center relative z-10 w-24 group animate-fade-in"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300",
                  statusColors[step.status]
                )}
              >
                {step.icon}
              </div>
              <p className={cn(
                "font-bold text-xs mt-3 max-w-[90px] truncate transition-colors duration-200",
                step.status === "upcoming" ? "text-slate-500" : "text-white"
              )}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                  {formatDate(step.date)}
                </p>
              )}
              {step.description && (
                <div className="absolute top-20 bg-slate-950 border border-slate-800 text-rose-455 text-[10px] font-bold p-2.5 rounded w-44 shadow-2xl pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                  {step.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

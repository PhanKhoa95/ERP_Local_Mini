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

const statusConfig: Record<string, { label: string; color: string; icon: ReactNode }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  processing: { label: "Đang xử lý", color: "bg-purple-100 text-purple-800", icon: <Package className="w-4 h-4" /> },
  shipping: { label: "Đang giao", color: "bg-cyan-100 text-cyan-800", icon: <Truck className="w-4 h-4" /> },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  returned: { label: "Hoàn trả", color: "bg-orange-100 text-orange-800", icon: <RotateCcw className="w-4 h-4" /> },
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
  const [aiAnswer, setAiAnswer] = useState("");
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
    setAiQuery("");
    setAiAnswer("");
    setSubmittedSearch({ orderNumber: normalizedOrderNumber, phoneDigits });
  };

  const handleAIQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiLoading || !matchedOrder) return;

    if (!matchedOrder.company_id) {
      toast({
        variant: "destructive",
        title: "Chưa thể dùng AI",
        description: "Đơn hàng này chưa có thông tin cửa hàng để trợ lý tra cứu ngữ cảnh.",
      });
      return;
    }

    setAiLoading(true);
    setAiAnswer("");

    try {
      const status = statusConfig[matchedOrder.status]?.label || matchedOrder.status;
      const orderContext = `Đơn hàng ${matchedOrder.order_number}, trạng thái ${status}, tổng tiền ${formatPrice(matchedOrder.total || 0)}.`;

      const { data, error } = await supabase.functions.invoke("chat-with-docs", {
        body: {
          question: `[Ngữ cảnh: ${orderContext}]\n\nCâu hỏi: ${aiQuery}`,
          companyId: matchedOrder.company_id,
        },
      });

      if (error) throw error;
      setAiAnswer(data.answer || "Không thể trả lời.");
    } catch (error) {
      console.error("AI error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể kết nối AI.",
      });
    } finally {
      setAiLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="w-6 h-6 text-primary flex-shrink-0" />
            <span className="font-bold text-base sm:text-lg truncate">Tra cứu đơn hàng</span>
          </div>
          <Link to="/order">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Đặt hàng
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="mb-6">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-2xl">Tra cứu đơn hàng</CardTitle>
            <CardDescription>
              Nhập mã đơn hàng và số điện thoại đã dùng khi đặt hàng.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  aria-label="Mã đơn hàng"
                  placeholder="Mã đơn: PO12345678"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className="pl-10"
                />
              </div>
              <Input
                aria-label="Số điện thoại"
                inputMode="tel"
                placeholder="SĐT: 0901234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(normalizePhone(e.target.value))}
                maxLength={15}
              />
              <Button type="submit" disabled={isFetching} className="w-full sm:w-auto">
                {isFetching ? "Đang tìm..." : "Tìm kiếm"}
              </Button>
            </form>
            {formError && <p className="mt-3 text-sm text-destructive">{formError}</p>}
          </CardContent>
        </Card>

        {submittedSearch && (
          <div className="space-y-4">
            {isLoading ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <p className="text-muted-foreground">Đang tìm kiếm...</p>
                </CardContent>
              </Card>
            ) : trackingError ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive/70" />
                  <p className="font-medium">Không thể tra cứu đơn hàng</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vui lòng thử lại hoặc liên hệ cửa hàng để được hỗ trợ.
                  </p>
                </CardContent>
              </Card>
            ) : !matchedOrder ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Không tìm thấy đơn hàng nào</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kiểm tra lại mã đơn hàng và số điện thoại đã dùng khi đặt hàng.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <OrderResult order={matchedOrder} formatDate={formatDate} formatPrice={formatPrice} />

                <Card className="border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Bot className="h-4 w-4 text-primary" />
                      Hỏi AI về đơn hàng này
                    </div>
                    <form onSubmit={handleAIQuery} className="flex gap-2">
                      <Input
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        placeholder={
                          matchedOrder.company_id
                            ? "VD: Khi nào đơn hàng được giao?"
                            : "Trợ lý chưa khả dụng cho đơn này"
                        }
                        disabled={aiLoading || !matchedOrder.company_id}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={aiLoading || !aiQuery.trim() || !matchedOrder.company_id}
                        aria-label="Gửi câu hỏi"
                      >
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                    {aiAnswer && (
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        <p className="whitespace-pre-wrap">{aiAnswer}</p>
                      </div>
                    )}
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">{order.order_number}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{formatDate(order.created_at)}</CardDescription>
          </div>
          <Badge className={`${status.color} gap-1.5 w-fit font-medium text-xs px-2.5 py-0.5 rounded-full border shadow-sm`}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Stepper Timeline */}
        <div className="py-2">
          <OrderTimeline order={order} formatDate={formatDate} />
        </div>

        <Separator />

        {shippingAddress && (
          <div className="flex items-start gap-2.5 text-sm bg-muted/30 p-3 rounded-lg border">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Địa chỉ giao hàng</p>
              <span className="whitespace-pre-line break-words text-foreground font-medium">{shippingAddress}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chi tiết sản phẩm</p>
          <div className="space-y-2.5">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm border-b border-dashed pb-2 last:border-0 last:pb-0">
                <span className="min-w-0 flex-1 break-words font-medium text-foreground">
                  {item.products?.name || "Sản phẩm"} <span className="text-muted-foreground font-normal">x{item.quantity}</span>
                </span>
                <span className="font-semibold text-foreground whitespace-nowrap">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex justify-between gap-3 font-bold text-base">
          <span>Tổng tiền thanh toán:</span>
          <span className="text-primary whitespace-nowrap">{formatPrice(order.total || 0)}</span>
        </div>

        {order.notes && (
          <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-lg text-sm border border-amber-100 dark:border-amber-900/20">
            <p className="font-semibold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">Ghi chú từ khách hàng</p>
            <p className="whitespace-pre-line break-words text-muted-foreground font-medium">{order.notes}</p>
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
      label: "Đã đặt hàng",
      date: order.created_at,
      status: "complete",
      icon: <Clock className="w-4 h-4" />,
    });
    steps.push({
      label: "Đơn hàng đã hủy",
      description: order.cancelled_reason || "Hủy theo yêu cầu của hệ thống hoặc khách hàng.",
      date: order.cancelled_at || order.updated_at,
      status: "failed",
      icon: <XCircle className="w-4 h-4" />,
    });
  } else if (isReturned) {
    steps.push({
      label: "Đã đặt hàng",
      date: order.created_at,
      status: "complete",
      icon: <Clock className="w-4 h-4" />,
    });
    if (order.shipped_at) {
      steps.push({
        label: "Đã giao hàng",
        date: order.shipped_at,
        status: "complete",
        icon: <Truck className="w-4 h-4" />,
      });
    }
    steps.push({
      label: "Đã hoàn trả",
      date: order.updated_at,
      status: "failed",
      icon: <RotateCcw className="w-4 h-4" />,
    });
  } else {
    // Normal Flow: Placed -> Confirmed -> Shipped -> Delivered
    steps.push({
      label: "Đã đặt hàng",
      date: order.created_at,
      status: "complete",
      icon: <Clock className="w-4 h-4" />,
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
      icon: <CheckCircle className="w-4 h-4" />,
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
      icon: <Truck className="w-4 h-4" />,
    });

    steps.push({
      label: "Đã nhận hàng",
      date: order.delivered_at,
      status: order.delivered_at
        ? "complete"
        : order.status === "shipping"
        ? "current"
        : "upcoming",
      icon: <CheckCircle className="w-4 h-4" />,
    });
  }

  return (
    <div className="w-full">
      {/* Mobile view (Vertical timeline) */}
      <div className="flex flex-col space-y-6 md:hidden px-2 py-1">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const statusColors = {
            complete: "bg-green-500 text-white border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.35)]",
            current: "bg-primary text-primary-foreground border-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.35)]",
            upcoming: "bg-muted text-muted-foreground border-muted-foreground/20",
            failed: "bg-red-500 text-white border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.35)]",
          };

          return (
            <div key={idx} className="flex gap-4 relative">
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[16px] top-8 bottom-[-24px] w-[2px] transition-all duration-500",
                    step.status === "complete" ? "bg-green-500" : "bg-border"
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
              <div className="flex-1 pt-0.5 min-w-0">
                <p className={cn(
                  "font-semibold text-xs sm:text-sm",
                  step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                )}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {formatDate(step.date)}
                  </p>
                )}
                {step.description && (
                  <p className="text-[10px] sm:text-xs text-red-500 font-medium mt-1.5 bg-red-50/50 dark:bg-red-950/10 p-2 rounded border border-red-100 dark:border-red-900/20 max-w-full break-words">
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
        <div className="absolute left-[12%] right-[12%] top-[30px] h-[2px] bg-border z-0" />
        
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
                isSegmentComplete ? "bg-green-500" : "bg-border"
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
            complete: "bg-green-500 text-white border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)] hover:scale-105",
            current: "bg-primary text-primary-foreground border-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.4)] hover:scale-105",
            upcoming: "bg-background text-muted-foreground border-border",
            failed: "bg-red-500 text-white border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)] hover:scale-105",
          };

          return (
            <div
              key={idx}
              className="flex flex-col items-center text-center relative z-10 w-24 group"
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
                "font-semibold text-xs mt-3 max-w-[90px] truncate transition-colors duration-200",
                step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
              )}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                  {formatDate(step.date)}
                </p>
              )}
              {step.description && (
                <div className="absolute top-20 bg-red-50 dark:bg-red-950/20 text-red-500 text-[10px] font-medium p-2 rounded border border-red-100 dark:border-red-900/20 w-44 shadow-lg pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
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

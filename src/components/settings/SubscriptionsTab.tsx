import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useOrders } from "@/hooks/useOrders";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  CreditCard,
  Zap,
  ShieldAlert,
  Loader2,
  Calendar,
  Layers,
  Infinity as InfinityIcon,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function SubscriptionsTab() {
  const { subscription, isLoading, upgradePlan } = useSubscriptions();
  const { orders = [] } = useOrders();
  const { warehouses = [] } = useWarehouses();
  const { channels = [] } = useSalesChannels();

  const currentMonthOrders = orders.filter(o => {
    const d = o.created_at ? new Date(o.created_at) : new Date();
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const plans = [
    {
      id: "starter",
      name: "Starter (Khởi Nghiệp)",
      price: "290,000 đ",
      period: "tháng",
      description: "Thích hợp cho cửa hàng nhỏ, hộ kinh doanh cá thể hoặc doanh nghiệp mới thành lập.",
      color: "bg-blue-500",
      gradient: "from-blue-500 to-indigo-600",
      features: [
        "Quản lý tối đa 1 kho hàng",
        "Giới hạn 100 đơn hàng / tháng",
        "Kết nối tối đa 2 kênh bán hàng đa sàn",
        "Báo cáo phân tích doanh thu cơ bản",
        "Hỗ trợ qua email trong 24h",
      ],
      limits: {
        warehouses: 1,
        orders: 100,
        channels: 2,
      }
    },
    {
      id: "growth",
      name: "Growth (Phát Triển)",
      price: "890,000 đ",
      period: "tháng",
      description: "Lựa chọn tối ưu cho doanh nghiệp bán lẻ đa kênh đang tăng trưởng doanh số nhanh.",
      color: "bg-purple-500",
      gradient: "from-purple-500 to-pink-600",
      isPopular: true,
      features: [
        "Quản lý tối đa 5 kho hàng",
        "Giới hạn 2,000 đơn hàng / tháng",
        "Hỗ trợ Fleet & Quản lý đội xe nội bộ",
        "Không giới hạn kết nối kênh bán hàng",
        "Báo cáo kế toán & tồn kho chuyên sâu",
        "Hỗ trợ kỹ thuật 24/7",
      ],
      limits: {
        warehouses: 5,
        orders: 2000,
        channels: 999,
      }
    },
    {
      id: "enterprise",
      name: "Enterprise (Tập Đoàn)",
      price: "2,490,000 đ",
      period: "tháng",
      description: "Giải pháp toàn diện hỗ trợ tùy biến sâu, ERP chuyên nghiệp và tích hợp chuỗi cung ứng.",
      color: "bg-slate-900",
      gradient: "from-slate-800 to-slate-950",
      features: [
        "Không giới hạn số kho hàng",
        "Không giới hạn đơn hàng",
        "Mở khóa toàn bộ tính năng Fleet & Logistics",
        "Phân quyền tổ chức đa chi nhánh, tenant con",
        "Cam kết SLA vận hành 99.9%",
        "Chuyên viên hỗ trợ tích hợp kỹ thuật riêng",
      ],
      limits: {
        warehouses: 999,
        orders: 999999,
        channels: 999,
      }
    }
  ];

  const getPlanDetails = (planType: string) => {
    return plans.find(p => p.id === planType) || plans[0];
  };

  const handleUpgrade = (planId: "starter" | "growth" | "enterprise") => {
    upgradePlan.mutate(planId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Đang kích hoạt</Badge>;
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Dùng thử miễn phí</Badge>;
      case "past_due":
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">Quá hạn thanh toán</Badge>;
      case "canceled":
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activePlan = getPlanDetails(subscription?.plan_type || "starter");

  // Dynamic usage statistics from database
  const usageStats = [
    {
      name: "Đơn hàng trong tháng",
      current: currentMonthOrders,
      limit: activePlan.limits.orders,
      unit: "đơn",
      isUnlimited: activePlan.id === "enterprise",
    },
    {
      name: "Số kho hoạt động",
      current: warehouses.length,
      limit: activePlan.limits.warehouses,
      unit: "kho",
      isUnlimited: activePlan.id === "enterprise",
    },
    {
      name: "Kênh bán hàng kết nối",
      current: channels.filter(c => c.is_active !== false).length,
      limit: activePlan.limits.channels,
      unit: "kênh",
      isUnlimited: activePlan.id === "enterprise" || activePlan.id === "growth",
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Gói Cước & Đăng Ký Dịch Vụ</h2>
        <p className="text-sm text-muted-foreground">
          Quản lý chu kỳ thanh toán, kiểm soát hạn mức tài nguyên và nâng cấp gói tính năng của hệ thống.
        </p>
      </div>

      {subscription && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Subscription Card */}
          <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Gói hiện tại</CardTitle>
                  <CardDescription>Chi tiết đăng ký của bạn</CardDescription>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-2xl font-bold uppercase text-primary">
                  {activePlan.name.split(" ")[0]}
                </span>
                <p className="text-xs text-muted-foreground italic">
                  {activePlan.description}
                </p>
              </div>

              <div className="pt-2 space-y-2 text-sm border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Bắt đầu kỳ cước:
                  </span>
                  <span className="font-medium">
                    {format(new Date(subscription.current_period_start), "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Hạn dùng tiếp theo:
                  </span>
                  <span className="font-semibold text-primary">
                    {format(new Date(subscription.current_period_end), "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-4 w-4" /> Cổng thanh toán:
                  </span>
                  <span className="font-medium capitalize">
                    {subscription.payment_gateway || "VietQR (PayOS)"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Limitations Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Hạn mức tài nguyên sử dụng</CardTitle>
              <CardDescription>Giám sát lượng tài nguyên hiện tại đối chiếu với giới hạn của gói.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageStats.map((stat, idx) => {
                const pct = stat.isUnlimited ? 0 : (stat.current / stat.limit) * 100;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stat.name}</span>
                      <span className="text-muted-foreground">
                        {stat.current} / {stat.isUnlimited ? <InfinityIcon className="inline h-3.5 w-3.5" /> : `${stat.limit} ${stat.unit}`}
                      </span>
                    </div>
                    {stat.isUnlimited ? (
                      <Progress value={10} className="h-2 bg-secondary" />
                    ) : (
                      <Progress value={pct} className={`h-2 ${pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-orange-500" : ""}`} />
                    )}
                  </div>
                );
              })}

              <div className="flex items-start gap-2 p-3 rounded bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Khi vượt quá giới hạn gói cước, một số thao tác đồng bộ tự động Shopee/Lazada và tạo đơn hàng mới có thể tạm thời bị gián đoạn. Vui lòng cân nhắc nâng cấp gói cước khi quy mô tăng trưởng.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pricing packages comparisons grid */}
      <div className="pt-4">
        <h3 className="text-lg font-bold text-center mb-6">Chọn Gói Cước Tối Ưu Cho Doanh Nghiệp Bạn</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = subscription?.plan_type === p.id;
            return (
              <Card 
                key={p.id} 
                className={`flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                  p.isPopular ? "ring-2 ring-primary scale-[1.02] shadow-xl md:-translate-y-1" : "hover:border-primary/50"
                }`}
              >
                {p.isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-lg">
                    Phổ biến nhất
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{p.name}</CardTitle>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight">{p.price}</span>
                    <span className="text-sm text-muted-foreground">/{p.period}</span>
                  </div>
                  <CardDescription className="mt-2 text-xs line-clamp-2">
                    {p.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 pb-4">
                  <ul className="space-y-2.5 text-sm">
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-xs leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button 
                    className="w-full" 
                    variant={isCurrent ? "secondary" : p.isPopular ? "default" : "outline"}
                    disabled={isCurrent || upgradePlan.isPending}
                    onClick={() => handleUpgrade(p.id as any)}
                  >
                    {upgradePlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrent ? "Đang sử dụng" : "Nâng cấp lên gói này"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

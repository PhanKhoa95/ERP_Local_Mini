import { lazy, Suspense, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { ExecutiveWarningsAlert } from "@/components/dashboard/ExecutiveWarningsAlert";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { CashFlowCard } from "@/components/dashboard/CashFlowCard";
import { SmartReplenishment } from "@/components/dashboard/SmartReplenishment";
import { ExpiringDocumentsWidget } from "@/components/documents/ExpiringDocumentsWidget";
import { DataIntegrityWidget } from "@/components/dashboard/DataIntegrityWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  Calendar as CalendarIcon, 
  Percent, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert,
  X,
  RefreshCw,
  SlidersHorizontal,
  Plus
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { CapitalBalancingWidget } from "@/components/dashboard/CapitalBalancingWidget";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { useGlobalDateFilter, DatePreset } from "@/contexts/GlobalDateFilterContext";

const RevenueChart = lazy(() => import("@/components/dashboard/RevenueChart").then(m => ({ default: m.RevenueChart })));
const ChannelPieChart = lazy(() => import("@/components/dashboard/ChannelPieChart").then(m => ({ default: m.ChannelPieChart })));
const CashFlowForecast = lazy(() => import("@/components/dashboard/CashFlowForecast").then(m => ({ default: m.CashFlowForecast })));
const SalesChatWidget = lazy(() => import("@/components/sales/SalesChatWidget").then(m => ({ default: m.SalesChatWidget })));

const ChartFallback = () => <Skeleton className="h-72 rounded-xl" />;

const Dashboard = () => {
  const navigate = useNavigate();
  const { startDate, endDate, activePreset, selectPreset, setCustomRange } = useGlobalDateFilter();
  const [showShopeeWarning, setShowShopeeWarning] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("tongquan");

  const activeRange = useMemo(() => {
    if (!startDate && !endDate) return null;
    return {
      from: startDate ? startOfDay(parseISO(startDate)) : startOfMonth(new Date()),
      to: endDate ? endOfDay(parseISO(endDate)) : endOfMonth(new Date()),
    };
  }, [startDate, endDate]);

  const calendarRange = useMemo(() => {
    return {
      from: startDate ? parseISO(startDate) : undefined,
      to: endDate ? parseISO(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const { stats, isLoading } = useDashboardStats(activeRange);

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Tổng quan" subtitle="Thống kê kinh doanh toàn hệ thống" />
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  // Exact figures from the Pancake POS screenshot
  const totalRevenueMock = stats?.totalRevenue || 121254583;
  const totalOrdersMock = stats?.totalOrders || 122;
  const totalProductsMock = stats?.totalProducts || 154;

  const totalHangChotMoney = 133887714;
  const totalHangChotQty = 154;
  const totalHangHoanMoney = 3750000;
  const totalHangHoanQty = 14;

  return (
    <MainLayout>
      <Header title="Tổng quan" subtitle="Thống kê hiệu năng bán hàng & đa kênh" />

      <div className="p-4 md:p-5 lg:p-6 space-y-4 md:space-y-5 lg:space-y-6 bg-slate-50 dark:bg-slate-900/40 min-h-screen">
        
        {/* Shopee Expiration Warning Alert Banner */}
        {showShopeeWarning && (
          <div className="bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-800/40 text-[#B45309] dark:text-amber-400 p-3 rounded-lg flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-[#D97706] shrink-0" />
              <span>
                Tài khoản Shopee <span className="font-extrabold underline cursor-pointer">vanvung123 (90918882)</span> đã hết hạn. Vui lòng kết nối lại để tránh gián đoạn đồng bộ!
              </span>
            </div>
            <button 
              onClick={() => setShowShopeeWarning(false)} 
              className="text-[#D97706] hover:text-[#B45309] p-1 rounded-full hover:bg-amber-100/50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Date Filter Toolbar & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-sm gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Khoảng thời gian:</span>
            <Badge variant="secondary" className="text-[10px] py-0.5">30 ngày qua</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={activePreset} onValueChange={(val) => selectPreset(val as DatePreset)}>
              <SelectTrigger className="w-[180px] h-8.5 bg-background text-xs font-medium">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-foreground">
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="this-month">Tháng này</SelectItem>
                <SelectItem value="last-30-days">30 ngày qua</SelectItem>
                <SelectItem value="last-90-days">90 ngày qua</SelectItem>
                <SelectItem value="this-year">Năm nay</SelectItem>
                <SelectItem value="custom">Tùy chọn khoảng...</SelectItem>
              </SelectContent>
            </Select>

            {activePreset === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8.5 text-xs">
                    <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                    {startDate && endDate ? (
                      `${format(parseISO(startDate), "dd/MM/yyyy")} - ${format(parseISO(endDate), "dd/MM/yyyy")}`
                    ) : (
                      "Chọn khoảng ngày"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={calendarRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setCustomRange(
                          format(range.from, "yyyy-MM-dd"),
                          format(range.to, "yyyy-MM-dd")
                        );
                      }
                    }}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button variant="outline" size="sm" className="h-8.5 text-xs font-semibold cursor-pointer">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Thêm lọc
            </Button>
            <Button variant="outline" size="icon" className="h-8.5 w-8.5 cursor-pointer" title="Tải lại">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* QUICK ACTIONS WIDGET */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">⚡ Thao tác nhanh</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/pos")}
              className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/30 text-xs font-semibold cursor-pointer group"
            >
              <ShoppingCart className="h-5 w-5 text-indigo-650 group-hover:scale-110 transition-transform" />
              <span>POS Bán Hàng</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/orders")}
              className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-xs font-semibold cursor-pointer group"
            >
              <Plus className="h-5 w-5 text-emerald-650 group-hover:scale-110 transition-transform" />
              <span>Lên Đơn Hàng</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/inventory?tab=transactions&type=in")}
              className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-sky-200 hover:border-sky-500 hover:bg-sky-50/30 text-xs font-semibold cursor-pointer group"
            >
              <Package className="h-5 w-5 text-sky-650 group-hover:scale-110 transition-transform" />
              <span>Nhập Kho Hàng</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/prepare-orders")}
              className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-amber-200 hover:border-amber-500 hover:bg-amber-50/30 text-xs font-semibold cursor-pointer group"
            >
              <RefreshCw className="h-5 w-5 text-amber-650 group-hover:scale-110 transition-transform" />
              <span>Xử Lý Đơn Sàn</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/finance")}
              className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-rose-200 hover:border-rose-500 hover:bg-rose-50/30 text-xs font-semibold cursor-pointer group"
            >
              <DollarSign className="h-5 w-5 text-rose-650 group-hover:scale-110 transition-transform" />
              <span>Báo Cáo Thu Chi</span>
            </Button>
          </div>
        </div>

        {/* TOP STATS CARDS (Pancake Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Tổng hàng chốt */}
          <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng hàng chốt</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Tổng tiền</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {totalHangChotMoney.toLocaleString("vi-VN")} đ
                </span>
                <span className="text-[10px] text-red-500 flex items-center gap-0.5 mt-0.5 font-bold">
                  <TrendingDown className="h-3 w-3" />
                  5.02%
                </span>
              </div>
              <div className="border-l pl-3">
                <span className="text-[10px] text-muted-foreground block font-medium">Số lượng</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {totalHangChotQty}
                </span>
                <span className="text-[10px] text-red-500 flex items-center gap-0.5 mt-0.5 font-bold">
                  <TrendingDown className="h-3 w-3" />
                  4.94%
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Tổng hàng hoàn */}
          <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng hàng hoàn</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Tổng tiền</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {totalHangHoanMoney.toLocaleString("vi-VN")} đ
                </span>
                <span className="text-[10px] text-emerald-500 flex items-center gap-0.5 mt-0.5 font-bold">
                  <TrendingUp className="h-3 w-3" />
                  28.02%
                </span>
              </div>
              <div className="border-l pl-3">
                <span className="text-[10px] text-muted-foreground block font-medium">Số lượng</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {totalHangHoanQty}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">
                  —
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Có thể bán */}
          <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-xs space-y-3">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Có thể bán (Tồn kho)</span>
              </div>
              <span className="text-xs font-extrabold text-blue-600">25.740.968</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-muted-foreground">
              <div>
                <span className="block font-medium">Giá nhập</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300 block text-xs">130.866.147.000 đ</span>
                <span className="text-[9px] text-amber-600 block mt-0.5 font-bold">Cần nhập thêm 679 ▾</span>
              </div>
              <div className="border-l pl-3">
                <span className="block font-medium">Giá bán</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300 block text-xs">31.426.116.342.000 đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Revenue Breakdown Chart & Today Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Middle Left: Revenue Summary Card & Graph (col-span-8) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-4">
            
            {/* Breakdown Header */}
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Tổng cộng</span>
                  <span className="text-base font-black text-slate-800 dark:text-slate-100">{totalRevenueMock.toLocaleString("vi-VN")} đ</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">Đơn chốt: {totalOrdersMock}</span>
                </div>
                <div className="border-l pl-4">
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Online</span>
                  <span className="text-base font-black text-slate-700 dark:text-slate-200">{(totalRevenueMock * 0.96).toLocaleString("vi-VN")} đ</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">Đơn chốt: {Math.round(totalOrdersMock * 0.81)}</span>
                </div>
                <div className="border-l pl-4">
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Tại quầy</span>
                  <span className="text-base font-black text-slate-700 dark:text-slate-200">{(totalRevenueMock * 0.04).toLocaleString("vi-VN")} đ</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">Đơn chốt: {Math.round(totalOrdersMock * 0.19)}</span>
                </div>
              </div>

              {/* Sub-Tabs selector */}
              <div className="flex border rounded-md p-0.5 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold">
                <button 
                  onClick={() => setActiveSubTab("tongquan")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeSubTab === "tongquan" ? "bg-white dark:bg-slate-850 shadow-xs text-blue-600" : "text-slate-500"}`}
                >
                  Tổng quan
                </button>
                <button 
                  onClick={() => setActiveSubTab("nguondon")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeSubTab === "nguondon" ? "bg-white dark:bg-slate-850 shadow-xs text-blue-600" : "text-slate-500"}`}
                >
                  Nguồn đơn
                </button>
                <button 
                  onClick={() => setActiveSubTab("trangthai")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeSubTab === "trangthai" ? "bg-white dark:bg-slate-850 shadow-xs text-blue-600" : "text-slate-500"}`}
                >
                  Trạng thái
                </button>
              </div>
            </div>

            {/* Metrics bar under the active subtab */}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-3 text-center bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-[9px] text-muted-foreground block font-semibold">Doanh thu</span>
                <span className="text-xs font-extrabold block text-slate-800 dark:text-slate-100">{(totalRevenueMock).toLocaleString("vi-VN")} đ</span>
                <span className="text-[9px] text-red-500 block font-bold">▼ 3.83%</span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-slate-800">
                <span className="text-[9px] text-muted-foreground block font-semibold">Lợi nhuận (71.8%)</span>
                <span className="text-xs font-extrabold block text-emerald-600">{(totalRevenueMock * 0.718).toLocaleString("vi-VN")} đ</span>
                <span className="text-[9px] text-red-500 block font-bold">▼ 12.63%</span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-slate-800">
                <span className="text-[9px] text-muted-foreground block font-semibold">Đơn chốt</span>
                <span className="text-xs font-extrabold block text-slate-800 dark:text-slate-100">{totalOrdersMock}</span>
                <span className="text-[9px] text-red-500 block font-bold">▼ 5.43%</span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-slate-800">
                <span className="text-[9px] text-muted-foreground block font-semibold">GTTB</span>
                <span className="text-xs font-extrabold block text-slate-800 dark:text-slate-100">1.892.901 đ</span>
                <span className="text-[9px] text-red-500 block font-bold">▼ 0.42%</span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-slate-800">
                <span className="text-[9px] text-muted-foreground block font-semibold">SL sản phẩm</span>
                <span className="text-xs font-extrabold block text-slate-800 dark:text-slate-100">140</span>
                <span className="text-[9px] text-red-500 block font-bold">▼ 5.41%</span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-slate-800">
                <span className="text-[9px] text-muted-foreground block font-semibold">SL SPTB</span>
                <span className="text-xs font-extrabold block text-slate-800 dark:text-slate-100">1.26</span>
                <span className="text-[9px] text-emerald-500 block font-bold">▲ 0.52%</span>
              </div>
              <div className="border-l border-slate-200/50 dark:border-slate-800">
                <span className="text-[9px] text-muted-foreground block font-semibold">LNTB</span>
                <span className="text-xs font-extrabold block text-slate-800 dark:text-slate-100">744.060 đ</span>
                <span className="text-[9px] text-red-500 block font-bold">▼ 10.39%</span>
              </div>
            </div>

            {/* Main Interactive Chart */}
            <div className="pt-2">
              <Suspense fallback={<ChartFallback />}><RevenueChart /></Suspense>
            </div>
          </div>

          {/* Middle Right: Today's Business Info (col-span-4) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Thông tin kinh doanh hôm nay</span>
              <div className="flex justify-between items-center mt-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[9px] text-muted-foreground block">Doanh thu</span>
                  <span className="text-sm font-black text-foreground">278.000 đ</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-muted-foreground block">Đơn chốt</span>
                  <span className="text-sm font-black text-foreground">1</span>
                </div>
              </div>
            </div>

            {/* Mini Hourly Trend Chart */}
            <div className="h-28 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg flex items-center justify-center border text-[10px] text-muted-foreground">
              [ Biểu đồ nhiệt độ đơn hàng theo giờ trong ngày ]
            </div>

            {/* Offline vs Online counts */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[9px] text-muted-foreground block">Tại quầy</span>
                <span className="text-foreground block font-extrabold">0 đ</span>
                <span className="text-[10px] text-slate-400 font-bold block">0 Đơn chốt</span>
              </div>
              <div className="space-y-0.5 border-l pl-3">
                <span className="text-[9px] text-muted-foreground block text-blue-600">Online</span>
                <span className="text-blue-600 block font-extrabold">278.000 đ</span>
                <span className="text-[10px] text-blue-600 font-bold block">1 Đơn chốt</span>
              </div>
            </div>

            {/* Business stats counter grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                <span className="text-[9px] text-muted-foreground block font-medium">Đơn tạo mới</span>
                <span className="font-extrabold text-foreground text-sm block mt-0.5">1</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                <span className="text-[9px] text-muted-foreground block font-medium">Đơn hủy</span>
                <span className="font-extrabold text-red-500 text-sm block mt-0.5">0</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                <span className="text-[9px] text-muted-foreground block font-medium">Đơn chốt</span>
                <span className="font-extrabold text-emerald-600 text-sm block mt-0.5">1</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                <span className="text-[9px] text-muted-foreground block font-medium">Đơn xóa</span>
                <span className="font-extrabold text-foreground text-sm block mt-0.5">0</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                <span className="text-[9px] text-muted-foreground block font-medium">Hàng bán ra</span>
                <span className="font-extrabold text-foreground text-sm block mt-0.5">1</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                <span className="text-[9px] text-muted-foreground block font-medium">Khách hàng</span>
                <span className="font-extrabold text-foreground text-sm block mt-0.5">1</span>
              </div>
            </div>

          </div>
        </div>

        {/* Channels Distribution Pie Chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <div className="md:col-span-2">
            <Suspense fallback={<ChartFallback />}><ChannelPieChart dateRange={activeRange} /></Suspense>
          </div>
          <div className="space-y-4">
            <CashFlowCard />
            <LowStockAlert />
          </div>
        </div>

        {/* Financial Simulator & Smart Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CapitalBalancingWidget />
          <SmartReplenishment />
          <ExpiringDocumentsWidget />
        </div>

        {/* Recent Orders & Database Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecentOrders dateRange={activeRange} />
          </div>
          <div className="space-y-4">
            <ExecutiveWarningsAlert />
            <DataIntegrityWidget />
          </div>
        </div>

      </div>
      <Suspense fallback={null}><SalesChatWidget /></Suspense>
    </MainLayout>
  );
};

export default Dashboard;

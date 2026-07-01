import { lazy, Suspense, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { ExecutiveWarningsAlert } from "@/components/dashboard/ExecutiveWarningsAlert";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { CashFlowCard } from "@/components/dashboard/CashFlowCard";
import { SmartReplenishment } from "@/components/dashboard/SmartReplenishment";
import { ExpiringDocumentsWidget } from "@/components/documents/ExpiringDocumentsWidget";
import { DataIntegrityWidget } from "@/components/dashboard/DataIntegrityWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, Package, Users, Calendar as CalendarIcon, Percent, TrendingUp, AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { CapitalBalancingWidget } from "@/components/dashboard/CapitalBalancingWidget";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useGlobalDateFilter, DatePreset } from "@/contexts/GlobalDateFilterContext";
import { useMemo } from "react";

const RevenueChart = lazy(() => import("@/components/dashboard/RevenueChart").then(m => ({ default: m.RevenueChart })));
const ChannelPieChart = lazy(() => import("@/components/dashboard/ChannelPieChart").then(m => ({ default: m.ChannelPieChart })));
const CashFlowForecast = lazy(() => import("@/components/dashboard/CashFlowForecast").then(m => ({ default: m.CashFlowForecast })));
const SalesChatWidget = lazy(() => import("@/components/sales/SalesChatWidget").then(m => ({ default: m.SalesChatWidget })));

const ChartFallback = () => <Skeleton className="h-72 rounded-xl" />;

const Dashboard = () => {
  const { startDate, endDate, activePreset, selectPreset, setCustomRange } = useGlobalDateFilter();

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
        <Header title="Dashboard" subtitle="Tổng quan hoạt động kinh doanh" />
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <MainLayout>
      <Header title="Dashboard" subtitle="Tổng quan hoạt động kinh doanh" />

      <div className="p-4 md:p-5 lg:p-6 space-y-4 md:space-y-5 lg:space-y-6">
        {/* Date Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border/60 shadow-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Bộ lọc thời gian:</span>
            <span className="text-xs text-muted-foreground hidden md:inline">(Áp dụng cho số liệu tổng quan & phân tích kênh)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={activePreset} onValueChange={(val) => selectPreset(val as DatePreset)}>
              <SelectTrigger className="w-[180px] h-9 bg-background border-border shadow-sm">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
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
                  <Button variant="outline" size="sm" className="h-9 border-border bg-background shadow-sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
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
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          <StatCard
            title="Doanh thu"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={DollarSign}
            iconColor="text-success"
            iconBgColor="bg-success/10"
          />
          <StatCard
            title="Đơn hàng"
            value={(stats?.totalOrders || 0).toString()}
            icon={ShoppingCart}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
          <StatCard
            title="Sản phẩm"
            value={(stats?.totalProducts || 0).toString()}
            icon={Package}
            iconColor="text-warning"
            iconBgColor="bg-warning/10"
          />
          <StatCard
            title="Khách hàng"
            value={(stats?.totalCustomers || 0).toString()}
            icon={Users}
            iconColor="text-info"
            iconBgColor="bg-info/10"
          />
        </div>

        {/* Executive Financial Indicators Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          <StatCard
            title="Lợi nhuận gộp"
            value={formatCurrency(stats?.grossProfit || 0)}
            icon={TrendingUp}
            iconColor="text-emerald-600 animate-pulse"
            iconBgColor="bg-emerald-50"
            description={`Tỷ suất: ${stats?.profitMargin?.toFixed(1) || 0}%`}
          />
          <StatCard
            title="Giá vốn (COGS)"
            value={formatCurrency(stats?.totalCOGS || 0)}
            icon={DollarSign}
            iconColor="text-rose-600"
            iconBgColor="bg-rose-50"
          />
          <StatCard
            title="Giá trị TB đơn (AOV)"
            value={formatCurrency(stats?.aov || 0)}
            icon={ShoppingCart}
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-50"
          />
          <StatCard
            title="Marketing / Doanh thu"
            value={`${stats?.mktToRevenue || 0}%`}
            icon={Percent}
            iconColor="text-violet-600"
            iconBgColor="bg-violet-50"
            description="Mức an toàn: < 20%"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <Suspense fallback={<ChartFallback />}><RevenueChart /></Suspense>
          </div>
          <Suspense fallback={<ChartFallback />}><ChannelPieChart dateRange={activeRange} /></Suspense>
        </div>

        {/* Capital Allocation & Balancing Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <CapitalBalancingWidget />
        </div>

        {/* Orders and Alerts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <RecentOrders dateRange={activeRange} />
          </div>
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            <ExecutiveWarningsAlert />
            <LowStockAlert />
            <CashFlowCard />
          </div>
        </div>

        {/* AI Intelligence Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <Suspense fallback={<ChartFallback />}><CashFlowForecast /></Suspense>
          <SmartReplenishment />
          <ExpiringDocumentsWidget />
        </div>

        {/* Data Integrity Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <DataIntegrityWidget />
        </div>
      </div>
      <Suspense fallback={null}><SalesChatWidget /></Suspense>
    </MainLayout>
  );
};

export default Dashboard;

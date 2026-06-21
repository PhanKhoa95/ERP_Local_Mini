import { lazy, Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { CashFlowCard } from "@/components/dashboard/CashFlowCard";
import { SmartReplenishment } from "@/components/dashboard/SmartReplenishment";
import { ExpiringDocumentsWidget } from "@/components/documents/ExpiringDocumentsWidget";
import { DataIntegrityWidget } from "@/components/dashboard/DataIntegrityWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";

const RevenueChart = lazy(() => import("@/components/dashboard/RevenueChart").then(m => ({ default: m.RevenueChart })));
const ChannelPieChart = lazy(() => import("@/components/dashboard/ChannelPieChart").then(m => ({ default: m.ChannelPieChart })));
const CashFlowForecast = lazy(() => import("@/components/dashboard/CashFlowForecast").then(m => ({ default: m.CashFlowForecast })));
const SalesChatWidget = lazy(() => import("@/components/sales/SalesChatWidget").then(m => ({ default: m.SalesChatWidget })));

const ChartFallback = () => <Skeleton className="h-72 rounded-xl" />;

const Dashboard = () => {
  const { stats, isLoading } = useDashboardStats();

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

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <Suspense fallback={<ChartFallback />}><RevenueChart /></Suspense>
          </div>
          <Suspense fallback={<ChartFallback />}><ChannelPieChart /></Suspense>
        </div>

        {/* Orders and Alerts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <RecentOrders />
          </div>
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
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

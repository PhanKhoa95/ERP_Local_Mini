import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  CalendarIcon,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Loader2,
  Download,
  BarChart3,
  PieChartIcon,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useGlobalDateFilter } from "@/contexts/GlobalDateFilterContext";
import { cn } from "@/lib/utils";
import {
  useRevenueReport,
  useProductReport,
  useInventoryReport,
  useOrderReport,
  usePartnerReport,
  type DateRange,
} from "@/hooks/useReportStats";
import { useOperationsMetrics } from "@/hooks/useOperationsMetrics";
import { useProjects } from "@/hooks/useProjects";
import { Users, Building, Clock, Target, MapPin, Store, Globe, Percent, Award, FolderKanban, Activity, Flame, ShieldAlert, CheckSquare, Sparkles } from "lucide-react";
import { PrintShopReportTab } from "@/components/reports/PrintShopReportTab";
import { exportAllReportsToExcel } from "@/lib/exportExcel";
import { printShopProducts, printShopMonthlyPlan } from "@/lib/printShopReportModel";


const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  returned: "Hoàn trả",
};

const statusColors: Record<string, string> = {
  pending: "#EAB308",
  confirmed: "#3B82F6",
  processing: "#8B5CF6",
  shipping: "#06B6D4",
  delivered: "#22C55E",
  cancelled: "#EF4444",
  returned: "#F97316",
};

const salesByTimeData = {
  day: [
    { name: "15/06", revenue: 1485000, orders: 8, growth: 18 },
    { name: "16/06", revenue: 693000, orders: 4, growth: -8 },
    { name: "17/06", revenue: 1188000, orders: 7, growth: -2 },
    { name: "18/06", revenue: 1386000, orders: 9, growth: 12 },
    { name: "19/06", revenue: 1980000, orders: 12, growth: 22 },
  ],
  week: [
    { name: "Tuần 21", revenue: 5940000, orders: 35, growth: 2 },
    { name: "Tuần 22", revenue: 5445000, orders: 32, growth: -3 },
    { name: "Tuần 23", revenue: 6930000, orders: 42, growth: 15 },
    { name: "Tuần 24", revenue: 7920000, orders: 48, growth: 18 },
  ],
  month: [
    { name: "T3/2026", revenue: 18480000, orders: 120, growth: -2 },
    { name: "T4/2026", revenue: 19800000, orders: 130, growth: 5 },
    { name: "T5/2026", revenue: 22440000, orders: 148, growth: 14 },
    { name: "T6/2026", revenue: 25740000, orders: 168, growth: 12 },
  ],
  quarter: [
    { name: "Q3/2025", revenue: 49500000, orders: 320, growth: 5 },
    { name: "Q4/2025", revenue: 61380000, orders: 405, growth: 15 },
    { name: "Q1/2026", revenue: 56100000, orders: 370, growth: 8 },
    { name: "Q2/2026", revenue: 67980000, orders: 446, growth: 12 },
  ],
  year: [
    { name: "Năm 2024", revenue: 178200000, orders: 1180, growth: 8 },
    { name: "Năm 2025", revenue: 210540000, orders: 1400, growth: 14 },
    { name: "Năm 2026", revenue: 124080000, orders: 816, growth: 11 },
  ],
};

const salesByProductData = [
  { name: "Sticker logo decal giấy", quantity: 320, revenue: 31680000, cogs: 14168000, margin: 55.3, strategy: "Sản phẩm chủ lực — đẩy Ads Shopee" },
  { name: "Card cảm ơn / Thank you card", quantity: 280, revenue: 33320000, cogs: 15925000, margin: 52.2, strategy: "Bán kèm combo, cross-sell Zalo" },
  { name: "Combo Shop Mới Khởi Nghiệp", quantity: 85, revenue: 29665000, cogs: 14748605, margin: 50.3, strategy: "Biên LN cao — AOV lớn nhất" },
  { name: "Bảng QR để bàn mica", quantity: 120, revenue: 13080000, cogs: 6069000, margin: 53.6, strategy: "Mở rộng phân phối địa phương" },
  { name: "Dịch vụ thiết kế Avatar & QR", quantity: 55, revenue: 8195000, cogs: 2200000, margin: 73.2, strategy: "Dịch vụ biên ròng cao nhất — upsell" },
];

const salesByEmployeeData = [
  { name: "Chủ shop (bạn)", department: "Vận hành chính", revenue: 42500000, orders: 280, rate: 84, kpi: 98, status: "Vượt chỉ tiêu" },
  { name: "Nhân viên part-time 1", department: "Sản xuất", revenue: 18200000, orders: 120, rate: 78, kpi: 92, status: "Đạt chỉ tiêu" },
  { name: "Nhân viên part-time 2", department: "Đóng gói & giao hàng", revenue: 14800000, orders: 100, rate: 72, kpi: 88, status: "Đạt chỉ tiêu" },
];

const salesByRegionData = [
  { name: "TP.HCM & Miền Nam", revenue: 42240000, orders: 280, share: 56.0 },
  { name: "Hà Nội & Miền Bắc", revenue: 22680000, orders: 150, share: 30.1 },
  { name: "Miền Trung", revenue: 10480000, orders: 70, share: 13.9 },
];

const salesByChannelData = [
  { name: "Zalo Chat / Zalo OA", revenue: 29700000, orders: 196, share: 39.4 },
  { name: "Facebook Page / Messenger", revenue: 21780000, orders: 144, share: 28.9 },
  { name: "Shopee Shop", revenue: 16500000, orders: 110, share: 21.9 },
  { name: "Cửa hàng POS", revenue: 7420000, orders: 50, share: 9.8 },
];

const salesByRegionColors = ["hsl(var(--primary))", "#3B82F6", "#10B981"];
const salesByChannelColors = ["hsl(var(--primary))", "#3B82F6", "#10B981", "#F59E0B"];

const Reports = () => {
  const navigate = useNavigate();
  const { startDate, endDate, setCustomRange, selectPreset } = useGlobalDateFilter();

  const dateRange = useMemo(() => {
    return {
      from: startDate ? startOfDay(parseISO(startDate)) : startOfMonth(new Date()),
      to: endDate ? endOfDay(parseISO(endDate)) : endOfMonth(new Date()),
    };
  }, [startDate, endDate]);

  const [calendarRange, setCalendarRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: dateRange.from,
    to: dateRange.to,
  });

  useEffect(() => {
    setCalendarRange({ from: dateRange.from, to: dateRange.to });
  }, [dateRange]);

  const [salesGroup, setSalesGroup] = useState<"time" | "product" | "employee" | "region">("time");
  const [opsGroup, setOpsGroup] = useState<"ops" | "project" | "marketing">("ops");
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month" | "quarter" | "year">("month");


  const { data: revenueData, isLoading: revenueLoading } = useRevenueReport(dateRange);
  const { data: productData, isLoading: productLoading } = useProductReport(dateRange);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryReport();
  const { data: orderData, isLoading: orderLoading } = useOrderReport(dateRange);
  const { data: partnerData, isLoading: partnerLoading } = usePartnerReport(dateRange);

  const startDateStr = format(dateRange.from, "yyyy-MM-dd");
  const endDateStr = format(dateRange.to, "yyyy-MM-dd");
  const { data: opsMetrics, isLoading: opsLoading } = useOperationsMetrics(startDateStr, endDateStr);
  const { projects, isLoading: projectsLoading } = useProjects();

  const filteredProjects = projects ? projects.filter(p => {
    if (!p.start_date && !p.end_date) return true;
    const start = p.start_date ? startOfDay(new Date(p.start_date)) : null;
    const end = p.end_date ? endOfDay(new Date(p.end_date)) : null;
    if (start && start > dateRange.to) return false;
    if (end && end < dateRange.from) return false;
    return true;
  }) : [];


  const totalRevenue = revenueData?.totalRevenue || 0;
  const totalOrders = revenueData?.orderCount || 0;

  const marketingRatio = totalRevenue > 0 ? totalRevenue / 190000000 : 1;
  const finalMarketingData = [
    { name: "Siêu Sale Shopee", "Chi phí": Math.round(18000000 * marketingRatio), "Doanh số": Math.round(82000000 * marketingRatio), spend: Math.round(18000000 * marketingRatio), leads: Math.round(520 * marketingRatio), cvr: "4.5%", roas: "4.6x", assets: "12 Videos, 35 Banners", quality: "9.5/10 (Xuất sắc)", qColor: "text-success" },
    { name: "BST Thu Đông", "Chi phí": Math.round(15000000 * marketingRatio), "Doanh số": Math.round(58000000 * marketingRatio), spend: Math.round(15000000 * marketingRatio), leads: Math.round(380 * marketingRatio), cvr: "3.8%", roas: "3.9x", assets: "8 Videos, 28 Banners", quality: "9.0/10 (Rất tốt)", qColor: "text-success" },
    { name: "TikTok Affiliate & Livestream", "Chi phí": Math.round(8000000 * marketingRatio), "Doanh số": Math.round(38000000 * marketingRatio), spend: Math.round(8000000 * marketingRatio), leads: Math.round(240 * marketingRatio), cvr: "5.2%", roas: "4.8x", assets: "42 Creator Videos", quality: "8.5/10 (Tốt)", qColor: "text-primary" },
    { name: "Google & SEO", "Chi phí": Math.round(4200000 * marketingRatio), "Doanh số": Math.round(12000000 * marketingRatio), spend: Math.round(4200000 * marketingRatio), leads: Math.round(114 * marketingRatio), cvr: "2.1%", roas: "2.8x", assets: "5 Landing Pages", quality: "7.8/10 (Khá)", qColor: "text-warning" }
  ];

  const totalMarketingSpend = finalMarketingData.reduce((sum, item) => sum + item.spend, 0);
  const totalMarketingRevenue = finalMarketingData.reduce((sum, item) => sum + item["Doanh số"], 0);
  const displayROAS = totalMarketingSpend > 0 ? (totalMarketingRevenue / totalMarketingSpend).toFixed(1) + "x" : "4.2x";
  const displayLeads = finalMarketingData.reduce((sum, item) => sum + item.leads, 0);

  const dailyChartData = revenueData?.dailyChart && revenueData.dailyChart.length > 0
    ? revenueData.dailyChart.map(d => ({
        name: d.date,
        revenue: d.revenue,
        orders: d.orders,
        growth: 0
      }))
    : [];

  const getFinalTimeData = () => {
    if (timePeriod === "day" && dailyChartData.length > 0) {
      return dailyChartData;
    }
    if (totalRevenue > 0) {
      const mockArr = salesByTimeData[timePeriod];
      const mockTotal = mockArr.reduce((sum, item) => sum + item.revenue, 0) || 1;
      const ratio = totalRevenue / mockTotal;
      const mockTotalOrders = mockArr.reduce((sum, item) => sum + item.orders, 0) || 1;
      const orderRatio = totalOrders / mockTotalOrders;
      return mockArr.map(item => ({
        ...item,
        revenue: Math.round(item.revenue * ratio),
        orders: Math.max(1, Math.round(item.orders * orderRatio))
      }));
    }
    return salesByTimeData[timePeriod];
  };

  const finalTimeData = getFinalTimeData();

  const [isExporting, setIsExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    revenueSummary: true,
    dailyRevenue: true,
    products: true,
    inventory: true,
    orders: true,
    partners: true,
    projects: true,
    printshop: true,
  });

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await exportAllReportsToExcel({
        revenue: revenueData,
        products: productData,
        inventory: inventoryData,
        orders: orderData,
        partners: partnerData,
        projects: filteredProjects,
        printshop: {
          products: printShopProducts,
          monthlyPlan: printShopMonthlyPlan,
        },
      }, exportOptions);
      setExportDialogOpen(false);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const liveProducts = productData?.topProfit && productData.topProfit.length > 0
    ? productData.topProfit.map(p => {
        const margin = p.revenue > 0 ? Math.round((p.profit / p.revenue) * 1000) / 10 : 0;
        let strategy = "Giữ mức tồn kho an toàn";
        if (margin >= 40) strategy = "Biên LN cao - Tăng ngân sách QC";
        else if (margin >= 30) strategy = "Đẩy mạnh marketing & chăm sóc VIP";
        else if (p.quantity > 10) strategy = "Sản phẩm bán chạy - Quay vòng nhanh";
        return {
          name: p.name,
          quantity: p.quantity,
          revenue: p.revenue,
          cogs: p.cost,
          margin: margin,
          strategy: strategy
        };
      })
    : [];

  const finalProducts = liveProducts.length > 0 ? liveProducts : salesByProductData;

  const finalEmployees = totalRevenue > 0
    ? [
        { name: "Chủ shop (bạn)", department: "Ban Quản trị", revenue: Math.round(totalRevenue * 0.45), orders: Math.round(totalOrders * 0.45), rate: 95, kpi: 98, status: "Vượt chỉ tiêu" },
        { name: "Nhân viên part-time 1", department: "Bộ phận Sản xuất", revenue: Math.round(totalRevenue * 0.25), orders: Math.round(totalOrders * 0.25), rate: 88, kpi: 92, status: "Đạt chỉ tiêu" },
        { name: "Nhân viên part-time 2", department: "Bộ phận Sản xuất", revenue: Math.round(totalRevenue * 0.15), orders: Math.round(totalOrders * 0.15), rate: 85, kpi: 90, status: "Đạt chỉ tiêu" },
        { name: "Cộng tác viên thiết kế", department: "Bộ phận Thiết kế", revenue: Math.round(totalRevenue * 0.15), orders: Math.round(totalOrders * 0.15), rate: 92, kpi: 95, status: "Vượt chỉ tiêu" },
      ].sort((a, b) => b.revenue - a.revenue)
    : salesByEmployeeData;

  const finalRegions = totalRevenue > 0
    ? [
        { name: "Miền Nam", revenue: Math.round(totalRevenue * 0.554), orders: Math.round(totalOrders * 0.55), share: 55.4 },
        { name: "Miền Bắc", revenue: Math.round(totalRevenue * 0.337), orders: Math.round(totalOrders * 0.35), share: 33.7 },
        { name: "Miền Trung", revenue: Math.round(totalRevenue * 0.109), orders: Math.round(totalOrders * 0.10), share: 10.9 },
      ]
    : salesByRegionData;

  const liveChannels = revenueData?.channelChart && revenueData.channelChart.length > 0
    ? revenueData.channelChart.map(c => {
        const totalRev = revenueData.totalRevenue || 1;
        const share = Math.round((c.revenue / totalRev) * 1000) / 10;
        return {
          name: c.name,
          revenue: c.revenue,
          orders: c.orders,
          share: share
        };
      })
    : [];

  const finalChannels = liveChannels.length > 0 ? liveChannels : salesByChannelData;

  const displayRevenue = totalRevenue > 0 ? totalRevenue : finalTimeData.reduce((sum, item) => sum + item.revenue, 0);
  const displayOrders = totalOrders > 0 ? totalOrders : finalTimeData.reduce((sum, item) => sum + item.orders, 0);
  const displayAvgValue = displayOrders > 0 ? displayRevenue / displayOrders : 0;
  const displayGrowth = finalTimeData.reduce((sum, item) => sum + item.growth, 0) / (finalTimeData.length || 1);


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString("vi-VN");
  };

  const presetRanges = [
    { label: "7 ngày", from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) },
    { label: "30 ngày", from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) },
    { label: "Tháng này", from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
  ];

  return (
    <MainLayout>
      <Header title="Báo cáo" subtitle="Phân tích dữ liệu kinh doanh" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Date Range Picker */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">Khoảng thời gian:</span>
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant={
                    format(dateRange.from, "yyyy-MM-dd") === format(preset.from, "yyyy-MM-dd") &&
                    format(dateRange.to, "yyyy-MM-dd") === format(preset.to, "yyyy-MM-dd")
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setCustomRange(format(preset.from, "yyyy-MM-dd"), format(preset.to, "yyyy-MM-dd"))}
                >
                  {preset.label}
                </Button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={calendarRange}
                    onSelect={(range) => {
                      setCalendarRange(range ? { from: range.from, to: range.to } : { from: undefined, to: undefined });
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

              <Button
                variant="outline"
                size="sm"
                className="ml-auto flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 shadow-sm"
                onClick={() => setExportDialogOpen(true)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Xuất báo cáo (Excel)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto w-full max-w-4xl justify-start gap-1 bg-muted p-1">
            <TabsTrigger value="sales">Bán hàng</TabsTrigger>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
            <TabsTrigger value="inventory">Kho hàng</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="partners">Đối tác</TabsTrigger>
            <TabsTrigger value="operations">Vận hành & Dự án</TabsTrigger>
            <TabsTrigger value="printshop">Chiết tính & Dòng tiền</TabsTrigger>
          </TabsList>


          {/* Sales Report Tab */}
          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Báo cáo Phân tích Bán hàng
                </CardTitle>
                <CardDescription>
                  Phân tích chi tiết hiệu quả bán hàng của doanh nghiệp theo các nhóm chỉ số cốt lõi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg w-fit">
                  <Button
                    variant={salesGroup === "time" ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setSalesGroup("time")}
                  >
                    <Clock className="w-4 h-4" />
                    Theo thời gian
                  </Button>
                  <Button
                    variant={salesGroup === "product" ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setSalesGroup("product")}
                  >
                    <Package className="w-4 h-4" />
                    Theo sản phẩm/dịch vụ
                  </Button>
                  <Button
                    variant={salesGroup === "employee" ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setSalesGroup("employee")}
                  >
                    <Target className="w-4 h-4" />
                    Theo nhân sự/KPI
                  </Button>
                  <Button
                    variant={salesGroup === "region" ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setSalesGroup("region")}
                  >
                    <MapPin className="w-4 h-4" />
                    Theo khu vực/kênh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sales sub-content by group */}
            {salesGroup === "time" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground font-medium">Doanh thu bán hàng</p>
                      <p className="text-xl font-bold text-success mt-1">
                        {formatCurrency(displayRevenue)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground font-medium">Tổng số đơn hàng</p>
                      <p className="text-xl font-bold text-primary mt-1">
                        {displayOrders.toLocaleString("vi-VN")} đơn
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground font-medium">Giá trị trung bình đơn</p>
                      <p className="text-xl font-bold text-info mt-1">
                        {formatCurrency(displayAvgValue)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground font-medium">Tăng trưởng TB</p>
                      <p className="text-xl font-bold text-success mt-1">
                        +{displayGrowth.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-lg">Biểu đồ xu hướng bán hàng</CardTitle>
                      <CardDescription>Theo dõi sự tăng trưởng doanh số và xu hướng thị trường</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {(["day", "week", "month", "quarter", "year"] as const).map((period) => (
                        <Button
                          key={period}
                          variant={timePeriod === period ? "default" : "outline"}
                          size="sm"
                          className="px-3 h-8 text-xs"
                          onClick={() => setTimePeriod(period)}
                        >
                          {period === "day" && "Ngày"}
                          {period === "week" && "Tuần"}
                          {period === "month" && "Tháng"}
                          {period === "quarter" && "Quý"}
                          {period === "year" && "Năm"}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={finalTimeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Doanh thu"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chi tiết số liệu bán hàng theo thời gian</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3">Thời gian</th>
                          <th className="text-right p-3">Doanh thu</th>
                          <th className="text-right p-3">Số đơn hàng</th>
                          <th className="text-right p-3">Tăng trưởng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalTimeData.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/orders?view=list")}>
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-right text-success font-semibold">{formatCurrency(item.revenue)}</td>
                            <td className="p-3 text-right">{item.orders}</td>
                            <td className={cn(
                              "p-3 text-right font-medium",
                              item.growth >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {item.growth >= 0 ? `+${item.growth}%` : `${item.growth}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}

            {salesGroup === "product" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sản phẩm bán chạy nhất</p>
                        <p className="text-base font-bold mt-1">{finalProducts[0]?.name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Đã bán {finalProducts[0]?.quantity || 0} chiếc</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-success/10 text-success">
                        <Percent className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Biên lợi nhuận cao nhất</p>
                        <p className="text-base font-bold mt-1">
                          {(() => {
                            const maxMarginProd = finalProducts.reduce((max, p) => p.margin > max.margin ? p : max, finalProducts[0] || { name: "N/A", margin: 0 });
                            return maxMarginProd?.name || "N/A";
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Biên LN: {(() => {
                            const maxMarginProd = finalProducts.reduce((max, p) => p.margin > max.margin ? p : max, finalProducts[0] || { name: "N/A", margin: 0 });
                            return maxMarginProd?.margin || 0;
                          })()}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-info/10 text-info">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Doanh số sản phẩm cao nhất</p>
                        <p className="text-base font-bold mt-1">
                          {(() => {
                            const maxRevProd = finalProducts.reduce((max, p) => p.revenue > max.revenue ? p : max, finalProducts[0] || { name: "N/A", revenue: 0 });
                            return maxRevProd?.name || "N/A";
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency((() => {
                            const maxRevProd = finalProducts.reduce((max, p) => p.revenue > max.revenue ? p : max, finalProducts[0] || { name: "N/A", revenue: 0 });
                            return maxRevProd?.revenue || 0;
                          })())}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">So sánh Doanh thu & Lợi nhuận sản phẩm</CardTitle>
                      <CardDescription>Đánh giá mặt hàng nào mang lại doanh thu tốt nhất</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={finalProducts.map(p => ({
                              name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
                              "Doanh thu": p.revenue,
                              "Lợi nhuận": p.revenue - p.cogs,
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatNumber(v)} />
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="Doanh thu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Lợi nhuận" fill="#10B981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Phân bổ Số lượng đã bán</CardTitle>
                      <CardDescription>So sánh số lượng tiêu thụ giữa các sản phẩm chính</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={finalProducts}
                              dataKey="quantity"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              label={({ name, value }) => `${name.substring(0, 8)}...: ${value}`}
                            >
                              {finalProducts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={salesByChannelColors[index % salesByChannelColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value} chiếc`, "Số lượng bán"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chiến lược & Biên độ lợi nhuận sản phẩm</CardTitle>
                    <CardDescription>Lập kế hoạch nhập hàng hoặc sản xuất dựa trên biên độ lợi nhuận</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3">Tên sản phẩm</th>
                          <th className="text-right p-3">Số lượng bán</th>
                          <th className="text-right p-3">Doanh thu</th>
                          <th className="text-right p-3">Biên lợi nhuận</th>
                          <th className="text-left p-3 pl-6">Chiến lược đề xuất</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalProducts.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/inventory")}>
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right text-success font-medium">{formatCurrency(item.revenue)}</td>
                            <td className="p-3 text-right text-info font-bold">{item.margin}%</td>
                            <td className="p-3 pl-6">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-medium",
                                  item.margin >= 40
                                    ? "border-success text-success bg-success/5"
                                    : item.margin >= 30
                                    ? "border-info text-info bg-info/5"
                                    : "border-warning text-warning bg-warning/5"
                                )}
                              >
                                {item.strategy}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}

            {salesGroup === "employee" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/performance")}>
                    <CardContent className="pt-6 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nhân viên xuất sắc nhất</p>
                        <p className="text-base font-bold mt-1">{finalEmployees[0]?.name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Doanh số: {formatCurrency(finalEmployees[0]?.revenue || 0)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/performance")}>
                    <CardContent className="pt-6 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-success/10 text-success">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tỷ lệ chốt đơn trung bình</p>
                        <p className="text-base font-bold mt-1">
                          {(finalEmployees.reduce((sum, item) => sum + item.rate, 0) / (finalEmployees.length || 1)).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Chỉ tiêu đề ra: 70%</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/performance")}>
                    <CardContent className="pt-6 flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Điểm KPI Trung Bình</p>
                        <p className="text-base font-bold mt-1">
                          {(finalEmployees.reduce((sum, item) => sum + item.kpi, 0) / (finalEmployees.length || 1)).toFixed(1)}/100
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Tất cả nhân sự đạt yêu cầu</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Doanh số chốt được của từng nhân sự</CardTitle>
                      <CardDescription>Đo lường doanh số đóng góp và hiệu suất chốt đơn</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={finalEmployees}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), "Doanh số"]} />
                            <Bar dataKey="revenue" name="Doanh số" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Xếp hạng tỷ lệ chốt đơn</CardTitle>
                      <CardDescription>Năng suất cuộc gọi và tỷ lệ chốt (%)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {finalEmployees.map((emp, idx) => (
                        <div key={idx} className="space-y-1 cursor-pointer hover:bg-muted/10 p-1.5 rounded transition-colors" onClick={() => navigate("/performance")}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{emp.name}</span>
                            <span className="text-muted-foreground font-semibold">{emp.rate}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full",
                                emp.rate >= 80 ? "bg-success" : emp.rate >= 70 ? "bg-info" : "bg-warning"
                              )}
                              style={{ width: `${emp.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bảng đánh giá KPI nhân sự bán hàng</CardTitle>
                    <CardDescription>Đo lường năng suất, số lượng đơn chốt và điểm đánh giá KPI</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3">Họ và tên</th>
                          <th className="text-left p-3">Phòng ban</th>
                          <th className="text-right p-3">Doanh số chốt</th>
                          <th className="text-right p-3">Số đơn hàng</th>
                          <th className="text-right p-3">Điểm KPI</th>
                          <th className="text-left p-3 pl-6">Đánh giá chung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalEmployees.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/performance")}>
                            <td className="p-3 font-semibold">{item.name}</td>
                            <td className="p-3 text-muted-foreground">{item.department}</td>
                            <td className="p-3 text-right text-success font-semibold">{formatCurrency(item.revenue)}</td>
                            <td className="p-3 text-right">{item.orders}</td>
                            <td className="p-3 text-right font-bold text-primary">{item.kpi}/100</td>
                            <td className="p-3 pl-6">
                              <Badge
                                className={cn(
                                  "font-medium text-white",
                                  item.status === "Vượt chỉ tiêu"
                                    ? "bg-success"
                                    : item.status === "Đạt chỉ tiêu"
                                    ? "bg-info"
                                    : "bg-warning text-black"
                                )}
                              >
                                {item.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}

            {salesGroup === "region" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Phân bổ Doanh thu theo Kênh phân phối</CardTitle>
                      <CardDescription>So sánh hiệu quả giữa các kênh online, trực tiếp (POS), TMĐT</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={finalChannels}
                              dataKey="revenue"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              label={({ name, percent }) => `${name.substring(0, 8)}...: ${(percent * 100).toFixed(0)}%`}
                            >
                              {finalChannels.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={salesByChannelColors[index % salesByChannelColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [formatCurrency(value), "Doanh thu"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Phân bổ Doanh thu theo Khu vực (Chi nhánh)</CardTitle>
                      <CardDescription>So sánh đóng góp doanh số giữa các vùng miền</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={finalRegions}
                              dataKey="revenue"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {finalRegions.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={salesByRegionColors[index % salesByRegionColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [formatCurrency(value), "Doanh thu"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hiệu quả theo Kênh bán hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3">Kênh bán</th>
                            <th className="text-right p-3">Doanh thu</th>
                            <th className="text-right p-3">Số đơn chốt</th>
                            <th className="text-right p-3">Tỷ trọng (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalChannels.map((channel, idx) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(channel.name.includes("POS") ? "/pos" : "/orders?view=list")}>
                              <td className="p-3 font-medium flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: salesByChannelColors[idx % salesByChannelColors.length] }}
                                />
                                {channel.name}
                              </td>
                              <td className="p-3 text-right text-success font-semibold">{formatCurrency(channel.revenue)}</td>
                              <td className="p-3 text-right">{channel.orders}</td>
                              <td className="p-3 text-right font-bold text-primary">{channel.share}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hiệu quả theo Khu vực thị trường</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3">Chi nhánh / Vùng</th>
                            <th className="text-right p-3">Doanh thu</th>
                            <th className="text-right p-3">Số đơn chốt</th>
                            <th className="text-right p-3">Tỷ trọng (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalRegions.map((region, idx) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/orders?view=list")}>
                              <td className="p-3 font-medium flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: salesByRegionColors[idx % salesByRegionColors.length] }}
                                />
                                {region.name}
                              </td>
                              <td className="p-3 text-right text-success font-semibold">{formatCurrency(region.revenue)}</td>
                              <td className="p-3 text-right">{region.orders}</td>
                              <td className="p-3 text-right font-bold text-primary">{region.share}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Revenue Report */}
          <TabsContent value="revenue" className="space-y-6">
            {revenueLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/accounting")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10">
                          <DollarSign className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Doanh thu</p>
                          <p className="text-xl font-bold">{formatNumber(revenueData?.totalRevenue || 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/accounting")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <TrendingUp className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Giá vốn</p>
                          <p className="text-xl font-bold">{formatNumber(revenueData?.totalCOGS || 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/accounting")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lợi nhuận gộp</p>
                          <p className="text-xl font-bold">{formatNumber(revenueData?.grossProfit || 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/accounting")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-info/10">
                          <BarChart3 className="w-5 h-5 text-info" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Biên LN</p>
                          <p className="text-xl font-bold">{(revenueData?.profitMargin || 0).toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Doanh thu theo ngày</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {revenueData?.dailyChart && revenueData.dailyChart.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData.dailyChart}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                                formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                              />
                              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            Chưa có dữ liệu
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Doanh thu theo kênh</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {revenueData?.channelChart && revenueData.channelChart.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={revenueData.channelChart}
                                dataKey="revenue"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {revenueData.channelChart.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            Chưa có dữ liệu
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Product Report */}
          <TabsContent value="products" className="space-y-6">
            {productLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Sản phẩm đã bán</p>
                      <p className="text-2xl font-bold">{productData?.totalProducts || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Tổng SL bán</p>
                      <p className="text-2xl font-bold">{productData?.totalQuantitySold || 0}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top 10 sản phẩm bán chạy</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sản phẩm</th>
                            <th className="text-right p-3">SL bán</th>
                            <th className="text-right p-3">Doanh thu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productData?.topSelling.map((p, idx) => (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/inventory")}>
                              <td className="p-3">
                                <span className="font-medium">{idx + 1}. {p.name}</span>
                                <br />
                                <span className="text-xs text-muted-foreground">{p.sku}</span>
                              </td>
                              <td className="p-3 text-right font-medium">{p.quantity}</td>
                              <td className="p-3 text-right text-success">{formatNumber(p.revenue)}</td>
                            </tr>
                          ))}
                          {(!productData?.topSelling || productData.topSelling.length === 0) && (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-muted-foreground">
                                Chưa có dữ liệu
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top 10 lợi nhuận cao nhất</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sản phẩm</th>
                            <th className="text-right p-3">Lợi nhuận</th>
                            <th className="text-right p-3">Biên LN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productData?.topProfit.map((p, idx) => (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/inventory")}>
                              <td className="p-3">
                                <span className="font-medium">{idx + 1}. {p.name}</span>
                              </td>
                              <td className="p-3 text-right font-medium text-success">{formatNumber(p.profit)}</td>
                              <td className="p-3 text-right">
                                {p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : 0}%
                              </td>
                            </tr>
                          ))}
                          {(!productData?.topProfit || productData.topProfit.length === 0) && (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-muted-foreground">
                                Chưa có dữ liệu
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="space-y-6">
            {inventoryLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Tổng SP</p>
                      <p className="text-2xl font-bold">{inventoryData?.totalProducts || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Tổng tồn kho</p>
                      <p className="text-2xl font-bold">{inventoryData?.totalStock || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Giá trị kho</p>
                      <p className="text-2xl font-bold">{formatNumber(inventoryData?.totalValue || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className={cn("cursor-pointer hover:border-warning/50 transition-all hover:bg-muted/5", inventoryData?.lowStockCount ? "border-warning" : "")} onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Sắp hết hàng</p>
                      <p className="text-2xl font-bold text-warning">{inventoryData?.lowStockCount || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className={cn("cursor-pointer hover:border-destructive/50 transition-all hover:bg-muted/5", inventoryData?.outOfStockCount ? "border-destructive" : "")} onClick={() => navigate("/inventory")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Hết hàng</p>
                      <p className="text-2xl font-bold text-destructive">{inventoryData?.outOfStockCount || 0}</p>
                    </CardContent>
                  </Card>
                </div>

                {(inventoryData?.lowStockProducts?.length || 0) > 0 && (
                  <Card className="border-warning">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        Sản phẩm sắp hết hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sản phẩm</th>
                            <th className="text-right p-3">Tồn kho</th>
                            <th className="text-right p-3">Tồn tối thiểu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryData?.lowStockProducts.map((p) => (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/inventory")}>
                              <td className="p-3">
                                <span className="font-medium">{p.name}</span>
                                <br />
                                <span className="text-xs text-muted-foreground">{p.sku}</span>
                              </td>
                              <td className="p-3 text-right font-medium text-warning">{p.stock_quantity}</td>
                              <td className="p-3 text-right">{p.min_stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Order Report */}
          <TabsContent value="orders" className="space-y-6">
            {orderLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                      <p className="text-2xl font-bold">{orderData?.totalOrders || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</p>
                      <p className="text-2xl font-bold text-success">{(orderData?.fulfillmentRate || 0).toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Tỷ lệ hủy</p>
                      <p className="text-2xl font-bold text-destructive">{(orderData?.cancelRate || 0).toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Giá trị TB/đơn</p>
                      <p className="text-2xl font-bold">{formatNumber(orderData?.avgOrderValue || 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Phân bổ trạng thái đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {orderData?.statusCounts && Object.keys(orderData.statusCounts).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(orderData.statusCounts).map(([status, count]) => ({
                                name: statusLabels[status] || status,
                                value: count,
                                color: statusColors[status] || "#6B7280",
                              }))}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {Object.entries(orderData.statusCounts).map(([status], index) => (
                                <Cell key={`cell-${index}`} fill={statusColors[status] || "#6B7280"} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Chưa có dữ liệu
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Partner Report */}
          <TabsContent value="partners" className="space-y-6">
            {partnerLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/partners")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Khách hàng</p>
                          <p className="text-xl font-bold">{partnerData?.totalCustomers || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/partners")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-info/10">
                          <Building className="w-5 h-5 text-info" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">NCC</p>
                          <p className="text-xl font-bold">{partnerData?.totalSuppliers || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/partners")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">KH hoạt động</p>
                      <p className="text-2xl font-bold text-success">{partnerData?.activeCustomers || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/partners")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Doanh thu từ KH</p>
                      <p className="text-2xl font-bold">{formatNumber(partnerData?.totalCustomerRevenue || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className={cn("cursor-pointer hover:border-warning/50 transition-all hover:bg-muted/5", partnerData?.totalCustomerDebt ? "border-warning" : "")} onClick={() => navigate("/debt-report")}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Công nợ KH</p>
                      <p className="text-2xl font-bold text-warning">{formatNumber(partnerData?.totalCustomerDebt || 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top 10 khách hàng theo doanh thu</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Khách hàng</th>
                            <th className="text-right p-3">Đơn hàng</th>
                            <th className="text-right p-3">Doanh thu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partnerData?.topCustomersByRevenue.map((c, idx) => (
                            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/partners")}>
                              <td className="p-3">
                                <span className="font-medium">{idx + 1}. {c.name}</span>
                                <br />
                                <span className="text-xs text-muted-foreground">{c.code}</span>
                              </td>
                              <td className="p-3 text-right">{c.orderCount}</td>
                              <td className="p-3 text-right text-success font-medium">{formatNumber(c.revenue)}</td>
                            </tr>
                          ))}
                          {(!partnerData?.topCustomersByRevenue || partnerData.topCustomersByRevenue.length === 0) && (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-muted-foreground">
                                Chưa có dữ liệu
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  <Card className={cn((partnerData?.customersWithDebt?.length || 0) > 0 ? "border-warning" : "")}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        Khách hàng còn công nợ
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Khách hàng</th>
                            <th className="text-right p-3">Doanh thu</th>
                            <th className="text-right p-3">Công nợ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partnerData?.customersWithDebt.slice(0, 10).map((c) => (
                            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/debt-report")}>
                              <td className="p-3">
                                <span className="font-medium">{c.name}</span>
                                <br />
                                <span className="text-xs text-muted-foreground">{c.code}</span>
                              </td>
                              <td className="p-3 text-right">{formatNumber(c.revenue)}</td>
                              <td className="p-3 text-right text-destructive font-medium">{formatNumber(c.debt)}</td>
                            </tr>
                          ))}
                          {(!partnerData?.customersWithDebt || partnerData.customersWithDebt.length === 0) && (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-muted-foreground">
                                Không có công nợ
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Operations & Projects Report */}
          <TabsContent value="operations" className="space-y-6">
            {opsLoading || projectsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Operations & Projects Sub-Tabs Selector */}
                <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg w-fit mb-6">
                  <Button
                    variant={opsGroup === "ops" ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setOpsGroup("ops")}
                  >
                    <Activity className="w-4 h-4" />
                    Khối Vận hành
                  </Button>
                  <Button
                    variant={opsGroup === "project" ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setOpsGroup("project")}
                  >
                    <FolderKanban className="w-4 h-4" />
                    Quản lý Dự án
                  </Button>
                  <Button
                    variant={opsGroup === "marketing" ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                    onClick={() => setOpsGroup("marketing")}
                  >
                    <Sparkles className="w-4 h-4" />
                    Marketing & Sáng tạo
                  </Button>
                </div>

                {/* Sub-tab Content 1: Khối Vận hành */}
                {opsGroup === "ops" && (
                  <div className="space-y-6">
                    {/* Operations Header */}
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Hiệu quả Hoạt động Khối Vận hành (Operations Performance)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Theo dõi năng suất đóng gói, vận chuyển, xử lý đơn hàng và tính chính xác của các quy trình tự động hóa.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/work-report")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Tỷ lệ hoàn thành công việc</p>
                          <p className="text-2xl font-bold text-success mt-1">
                            {opsMetrics?.task_completion_rate ? `${opsMetrics.task_completion_rate}%` : "88.5%"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Đã xử lý {opsMetrics?.completed_tasks || 142} / {(opsMetrics?.completed_tasks || 142) + (opsMetrics?.pending_tasks || 18)} công việc
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Giao hàng đúng hạn</p>
                          <p className="text-2xl font-bold text-primary mt-1">
                            {opsMetrics?.on_time_rate ? `${opsMetrics.on_time_rate}%` : "95.2%"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Trong tổng số {opsMetrics?.total_orders_processed || 120} đơn giao thành công
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/orders?view=list")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Thời gian xử lý TB / Đơn</p>
                          <p className="text-2xl font-bold text-info mt-1">
                            {opsMetrics?.avg_processing_time_hours ? `${opsMetrics.avg_processing_time_hours} giờ` : "1.8 giờ"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Từ lúc tạo đơn tới lúc đóng gói bàn giao
                          </p>
                        </CardContent>
                      </Card>
                      <Card className={cn("cursor-pointer hover:border-destructive/50 transition-all hover:bg-muted/5", opsMetrics?.orders_with_issues ? "border-destructive/30" : "")} onClick={() => navigate("/orders?view=list")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Số đơn gặp sự cố / Đổi trả</p>
                          <p className="text-2xl font-bold text-destructive mt-1">
                            {opsMetrics?.orders_with_issues || 2} đơn
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Tỷ lệ lỗi vận hành: {opsMetrics?.total_orders_processed ? ((opsMetrics.orders_with_issues / opsMetrics.total_orders_processed) * 100).toFixed(1) : "1.2"}%
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Chart of Ops Processing Speed */}
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Số lượng Đơn hàng Xử lý & Tỷ lệ Giao đúng hạn</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: "Đã xử lý", value: opsMetrics?.total_orders_processed || 120 },
                                { name: "Đúng hạn", value: opsMetrics?.orders_on_time || 114 },
                                { name: "Trễ hạn / Lỗi", value: opsMetrics?.orders_with_issues || 6 },
                                { name: "Cập nhật kho", value: opsMetrics?.stock_updates_count || 48 }
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                  }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                  <Cell fill="hsl(var(--primary))" />
                                  <Cell fill="#10B981" />
                                  <Cell fill="#EF4444" />
                                  <Cell fill="#F59E0B" />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Workflow stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Lượt chạy Tự động hóa (Workflows)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/30 font-medium">
                                <th className="text-left p-2.5">Workflow trigger</th>
                                <th className="text-center p-2.5">Số lần</th>
                                <th className="text-right p-2.5">Thành công</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { name: "Auto duyệt đơn lớn (>100M)", triggersCount: 14, successRate: 100 },
                                { name: "Cảnh báo tồn kho thấp (<5 SP)", triggersCount: 38, successRate: 100 },
                                { name: "Đồng bộ ngân hàng Casso", triggersCount: 82, successRate: 98.8 },
                                { name: "Chào mừng nhân sự mới", triggersCount: 15, successRate: 100 },
                              ].map((wf, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/10 cursor-pointer transition-colors" onClick={() => navigate("/workflows")}>
                                  <td className="p-2.5 font-medium">{wf.name}</td>
                                  <td className="p-2.5 text-center">{wf.triggersCount}</td>
                                  <td className="p-2.5 text-right text-success">{wf.successRate}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Sub-tab Content 2: Quản lý Dự án */}
                {opsGroup === "project" && (
                  <div className="space-y-6">
                    {/* Project Efficiency Section */}
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <FolderKanban className="w-5 h-5 text-primary" />
                        Báo cáo Phân tích Hiệu quả Dự án (Projects & Budgets Analysis)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Đo lường tiến độ công việc, tỷ lệ sử dụng ngân sách, hiệu năng nhân sự và điểm nghẽn (impediments) cản trở dự án.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/projects")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Số dự án đang chạy</p>
                          <p className="text-2xl font-bold text-primary mt-1">
                            {projects ? filteredProjects.filter(p => p.status === "active" || p.status === "planning").length : 5} dự án
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {projects ? filteredProjects.filter(p => p.status === "completed").length : 0} dự án đã hoàn thành
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/projects")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Tổng Ngân sách cam kết</p>
                          <p className="text-2xl font-bold text-success mt-1">
                            {formatCurrency(projects ? filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0) : 330000000)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Tổng quỹ đầu tư cho tất cả các dự án
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/projects")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Thực tế chi phí (Ước tính)</p>
                          <p className="text-2xl font-bold text-info mt-1">
                            {formatCurrency(projects ? filteredProjects.reduce((sum, p) => {
                              const statusFactor = p.status === "completed" ? 1.0 : p.status === "active" ? 0.6 : 0.05;
                              return sum + Math.round((p.budget || 0) * statusFactor);
                            }, 0) : 231500000)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Tỷ lệ sử dụng quỹ đầu tư: {projects ? Math.round((filteredProjects.reduce((sum, p) => {
                              const statusFactor = p.status === "completed" ? 1.0 : p.status === "active" ? 0.6 : 0.05;
                              return sum + Math.round((p.budget || 0) * statusFactor);
                            }, 0) / (filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0) || 1)) * 100) : "70"}%
                          </p>
                        </CardContent>
                      </Card>
                      <Card className={cn("cursor-pointer hover:border-red-500/50 transition-all hover:bg-muted/5", "border-red-200")} onClick={() => navigate("/projects")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Số điểm nghẽn cần tháo gỡ</p>
                          <p className="text-2xl font-bold text-red-600 mt-1">
                            {projects ? filteredProjects.filter(p => p.status === "active" && p.priority === "critical").length : 2} sự cố
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 text-red-500 font-medium">
                            ⚠️ Cần hành động khẩn cấp
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Chart of Budgets */}
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">So sánh Ngân sách và Thực tế Chi phí của Dự án</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={(projects && filteredProjects.length > 0 ? filteredProjects : [
                                { code: "SHP", name: "Shopee Integration", budget: 50000000, progress: 85, status: "active" },
                                { code: "SCM", name: "BOM & Supply Chain", budget: 35000000, progress: 65, status: "active" },
                                { code: "WHE", name: "Southern Warehouse", budget: 120000000, progress: 10, status: "planning" },
                                { code: "MKT", name: "Marketing Campaign", budget: 80000000, progress: 0, status: "planning" },
                                { code: "AIC", name: "AI Customer Assistant", budget: 45000000, progress: 40, status: "active" }
                              ]).map(p => {
                                const statusFactor = p.status === "completed" ? 1.0 : p.status === "active" ? 0.6 : 0.05;
                                return {
                                  name: p.code || p.name.substring(0, 12),
                                  "Ngân sách": p.budget || 0,
                                  "Thực chi": Math.round((p.budget || 0) * statusFactor)
                                };
                              })}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatNumber(v)} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(v: number) => [formatCurrency(v)]}
                                />
                                <Legend />
                                <Bar dataKey="Ngân sách" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Thực chi" fill="#10B981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Resource workload */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-primary" />
                            Tải Công việc & Phân bổ Nguồn lực
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {[
                            { name: "Nguyễn Văn A (Kỹ sư Cấp cao)", load: 85, status: "Tối ưu", count: 5 },
                            { name: "Trần Thị B (Sales Agent)", load: 120, status: "Quá tải", count: 8 },
                            { name: "Lê Văn C (Kế toán trưởng)", load: 50, status: "Dưới tải", count: 3 },
                            { name: "Phạm Thị D (Trưởng phòng HR)", load: 70, status: "Tối ưu", count: 4 },
                          ].map((res, idx) => (
                            <div key={idx} className="space-y-1.5 cursor-pointer hover:bg-muted/10 p-1.5 rounded transition-colors" onClick={() => navigate("/performance")}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold">{res.name}</span>
                                <Badge variant={res.load > 100 ? "destructive" : res.load >= 70 ? "default" : "secondary"} className="text-[9px] px-1 py-0">
                                  {res.status} ({res.count} việc)
                                </Badge>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div className={cn("h-1.5 rounded-full transition-all duration-300", 
                              res.load > 100 ? "bg-red-500" : res.load >= 70 ? "bg-yellow-500" : "bg-emerald-500"
                                )} style={{ width: `${Math.min(res.load, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Project Impediments & Blocker Analysis Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-red-600" />
                          Chi tiết Tiến độ Dự án & Điểm nghẽn Vận hành (Project Health Check)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/30 text-muted-foreground font-medium">
                                <th className="text-left p-3">Dự án</th>
                                <th className="text-center p-3">Độ ưu tiên</th>
                                <th className="text-left p-3" style={{ width: "15%" }}>Tiến độ</th>
                                <th className="text-left p-3" style={{ width: "20%" }}>Nhân sự / Điểm tắc nghẽn</th>
                                <th className="text-left p-3">Hành động khắc phục đề xuất</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(projects && filteredProjects.length > 0 ? filteredProjects.map(p => {
                                const mockDetails = [
                                    { code: "SHP", progress: 85, manager: "Nhân viên part-time 1", blocker: "Hình ảnh mô tả sản phẩm bị lỗi kích thước", action: "Nhờ thiết kế cập nhật ảnh chuẩn 800x800px" },
                                    { code: "BOM", progress: 65, manager: "Chủ shop (bạn)", blocker: "Giấy in decal cuộn bị kẹt khi bế decal tròn", action: "Điều chỉnh lại trục giữ giấy và lực cắt máy bế" },
                                    { code: "AIC", progress: 40, manager: "Cộng tác viên thiết kế", blocker: "API Zalo OA cần xác thực doanh nghiệp", action: "Chuẩn bị giấy phép đăng ký hộ kinh doanh để nộp" },
                                    { code: "MKT", progress: 0, manager: "Chủ shop (bạn)", blocker: "Chưa gom đủ danh sách địa chỉ shop", action: "Tìm kiếm thông tin shop trên các hội nhóm Facebook" }
                                  ].find(m => m.code === p.code) || { progress: p.status === "completed" ? 100 : p.status === "active" ? 50 : 10, manager: "Chủ shop", blocker: "Không có sự cố ghi nhận", action: "Không cần hành động khắc phục" };

                                return {
                                  ...p,
                                  progress: mockDetails.progress,
                                  manager: mockDetails.manager,
                                  blocker: mockDetails.blocker,
                                  action: mockDetails.action
                                };
                              }) : [
                                { code: "MKT", name: "Chiến dịch Marketing Thu Đông 2026", status: "planning", budget: 80000000, progress: 0, priority: "normal", manager: "Phạm Thanh Thủy (Sales 1)", blocker: "Thiếu thiết kế banner key-visual chính", action: "Tuyển thêm Designer freelancer thực hiện gấp" },
                                { code: "AIC", name: "Xây dựng Trợ lý ảo AI CSKH", status: "active", budget: 45000000, progress: 40, priority: "high", manager: "Hoàng Anh Tuấn (Sales 2)", blocker: "API Gemini quá tải lượt gọi miễn phí", action: "Nâng cấp lên token trả phí để ổn định dịch vụ" }
                              ]).map((p, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/10 cursor-pointer transition-colors" onClick={() => navigate("/projects")}>
                                  <td className="p-3">
                                    <span className="font-semibold block">{p.name}</span>
                                    <span className="font-mono text-[10px] text-muted-foreground">{p.code} - Ngân sách: {formatCurrency(p.budget || 0)}</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge variant={p.priority === "critical" ? "destructive" : p.priority === "high" ? "default" : "secondary"} className="text-[9px] uppercase px-1 py-0">
                                      {p.priority === "critical" ? "Khẩn cấp" : p.priority === "high" ? "Cao" : "Bình thường"}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Đã làm:</span>
                                        <span>{p.progress}%</span>
                                      </div>
                                      <div className="w-full bg-muted rounded-full h-1.5">
                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-semibold text-foreground block">{p.manager}</span>
                                    <span className="text-[10px] text-red-500 font-medium block mt-0.5">{p.blocker}</span>
                                  </td>
                                  <td className="p-3">
                                    <div className="bg-primary/5 border border-primary/10 text-primary p-2 rounded text-[11px] font-medium leading-relaxed">
                                      {p.action}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Sub-tab Content 3: Marketing & Sáng tạo */}
                {opsGroup === "marketing" && (
                  <div className="space-y-6">
                    {/* Marketing Header */}
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Hiệu quả Tiếp thị & Ấn phẩm Sáng tạo (Marketing & Creative Performance)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Đo lường chi phí tiếp thị đa kênh, số Leads mang lại, hiệu năng chuyển đổi chiến dịch và tiến độ sản xuất, chất lượng ấn phẩm sáng tạo.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/projects")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Chi phí tiếp thị (Campaign Spend)</p>
                          <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totalMarketingSpend)}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Ngân sách đã chi tiêu lũy kế</p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/partners")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Khách hàng tiềm năng (Leads)</p>
                          <p className="text-2xl font-bold text-primary mt-1">{displayLeads.toLocaleString("vi-VN")} Lead</p>
                          <p className="text-[10px] text-muted-foreground mt-1">CPL TB: {formatCurrency(Math.round(totalMarketingSpend / (displayLeads || 1)))} / Lead</p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/projects")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Hiệu quả Quảng cáo (ROAS)</p>
                          <p className="text-2xl font-bold text-info mt-1">{displayROAS}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 text-success font-medium">Mục tiêu: 4.0x (Đạt chỉ tiêu)</p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:bg-muted/5" onClick={() => navigate("/digital-assets")}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground font-medium">Chất lượng Sáng tạo (Creative Score)</p>
                          <p className="text-2xl font-bold text-primary mt-1">9.2 / 10</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{Math.round(128 * marketingRatio)} ấn phẩm (Banners, Videos) đã duyệt</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Campaign performance */}
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Hiệu quả Chiến dịch: Chi phí vs Doanh số mang lại</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={finalMarketingData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatNumber(v)} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(v: number) => [formatCurrency(v)]}
                                />
                                <Legend />
                                <Bar dataKey="Chi phí" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Doanh số" fill="#10B981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Creative assets structure */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Cơ cấu Ấn phẩm Sáng tạo đã sản xuất</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: "Video ngắn (TikTok/Reels)", value: Math.round(58 * marketingRatio) },
                                    { name: "Banner & Key-Visual", value: Math.round(38 * marketingRatio) },
                                    { name: "Landing Page", value: Math.round(19 * marketingRatio) },
                                    { name: "PR & SEO Article", value: Math.round(13 * marketingRatio) }
                                  ]}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={65}
                                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                  <Cell fill="hsl(var(--primary))" />
                                  <Cell fill="#3B82F6" />
                                  <Cell fill="#10B981" />
                                  <Cell fill="#F59E0B" />
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Video ({Math.round(58 * marketingRatio)})</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Banners ({Math.round(38 * marketingRatio)})</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Web ({Math.round(19 * marketingRatio)})</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> PR ({Math.round(13 * marketingRatio)})</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Marketing Campaigns & Quality table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Đánh giá Hiệu quả Tiếp thị Chiến dịch & Ấn phẩm (Campaign & Asset Quality Review)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/30 text-muted-foreground font-medium">
                                <th className="text-left p-3">Chiến dịch tiếp thị</th>
                                <th className="text-right p-3">Chi phí QC</th>
                                <th className="text-center p-3">Số Leads & Tỷ lệ CVR</th>
                                <th className="text-center p-3">ROAS</th>
                                <th className="text-left p-3">Ấn phẩm sáng tạo phân bổ</th>
                                <th className="text-right p-3">Đánh giá chất lượng</th>
                              </tr>
                            </thead>
                            <tbody>
                              {finalMarketingData.map((camp, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                  <td className="p-3 font-semibold cursor-pointer hover:underline hover:text-primary" onClick={() => navigate("/projects")}>{camp.name}</td>
                                  <td className="p-3 text-right text-destructive font-medium cursor-pointer hover:underline hover:text-primary" onClick={() => navigate("/projects")}>{formatCurrency(camp.spend)}</td>
                                  <td className="p-3 text-center cursor-pointer hover:underline hover:text-primary" onClick={() => navigate("/partners")}>
                                    <span className="font-semibold block">{camp.leads} Lead</span>
                                    <span className="text-[10px] text-muted-foreground">CVR: {camp.cvr}</span>
                                  </td>
                                  <td className="p-3 text-center font-bold text-success cursor-pointer hover:underline hover:text-primary" onClick={() => navigate("/projects")}>{camp.roas}</td>
                                  <td className="p-3 text-muted-foreground font-mono text-[10px] cursor-pointer hover:underline hover:text-primary" onClick={() => navigate("/digital-assets")}>{camp.assets}</td>
                                  <td className={`p-3 text-right font-semibold ${camp.qColor} cursor-pointer hover:underline hover:text-primary`} onClick={() => navigate("/digital-assets")}>{camp.quality}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Print Shop V5 Tab */}
          <TabsContent value="printshop" className="space-y-6">
            <PrintShopReportTab />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              Xuất dữ liệu báo cáo
            </DialogTitle>
            <DialogDescription>
              Chọn các phân hệ báo cáo bạn muốn kết xuất sang tệp Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-sm font-semibold">Tất cả báo cáo</span>
              <Checkbox
                id="select-all"
                checked={Object.values(exportOptions).every(Boolean)}
                onCheckedChange={(checked) => {
                  setExportOptions({
                    revenueSummary: !!checked,
                    dailyRevenue: !!checked,
                    products: !!checked,
                    inventory: !!checked,
                    orders: !!checked,
                    partners: !!checked,
                    projects: !!checked,
                    printshop: !!checked,
                  });
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="opt-rev-summary" className="text-sm cursor-pointer select-none">
                  Tổng quan Doanh thu
                </label>
                <Checkbox
                  id="opt-rev-summary"
                  checked={exportOptions.revenueSummary}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({ ...prev, revenueSummary: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="opt-daily-rev" className="text-sm cursor-pointer select-none">
                  Doanh thu theo ngày
                </label>
                <Checkbox
                  id="opt-daily-rev"
                  checked={exportOptions.dailyRevenue}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({ ...prev, dailyRevenue: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="opt-products" className="text-sm cursor-pointer select-none">
                  Báo cáo Sản phẩm
                </label>
                <Checkbox
                  id="opt-products"
                  checked={exportOptions.products}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({ ...prev, products: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="opt-inventory" className="text-sm cursor-pointer select-none">
                  Báo cáo Tồn kho
                </label>
                <Checkbox
                  id="opt-inventory"
                  checked={exportOptions.inventory}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({ ...prev, inventory: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="opt-orders" className="text-sm cursor-pointer select-none">
                  Danh sách Đơn hàng
                </label>
                <Checkbox
                  id="opt-orders"
                  checked={exportOptions.orders}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({ ...prev, orders: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="opt-partners" className="text-sm cursor-pointer select-none">
                  Danh sách Đối tác
                </label>
                <Checkbox
                  id="opt-partners"
                  checked={exportOptions.partners}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({ ...prev, partners: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="opt-projects" className="text-sm cursor-pointer select-none">
                  Vận hành & Dự án
                </label>
                <Checkbox
                  id="opt-projects"
                  checked={exportOptions.projects}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({ ...prev, projects: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="opt-printshop" className="text-sm cursor-pointer select-none">
                  Chiết tính & Dòng tiền
                </label>
                <Checkbox
                  id="opt-printshop"
                  checked={exportOptions.printshop}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({ ...prev, printshop: !!checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleExportAll}
              disabled={isExporting || !Object.values(exportOptions).some(Boolean)}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Xuất Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Reports;

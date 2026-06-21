import { useMemo, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDataHub, type DataSource, type RawEvent } from "@/hooks/useDataHub";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { seedTestDataFlow, seedComplexTestDataFlow, seedGrowthTestDataFlow } from "@/lib/testDataSeeder";
import { useToast } from "@/hooks/use-toast";
import {
  useChannelAttribution,
  useCustomerCLV,
  useCustomerCohorts,
  useRunDataQualityChecks,
  useApplyPiiMinimization,
  pivotCohortData,
} from "@/hooks/useAnalytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  ingestionStatusLabels,
  sourceTypeLabels,
  validationStatusLabels,
} from "@/lib/dataHub";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers3,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ServerCog,
  Wifi,
  WifiOff,
  Zap,
  RotateCcw,
  ArrowRightLeft,
  Clock,
  TrendingUp,
  BarChart3,
  Sparkles,
  ShieldAlert,
  Lock,
  Shield,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const statusClass: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  error: "bg-red-100 text-red-700 border-red-200",
  archived: "bg-muted text-muted-foreground",
  received: "bg-blue-100 text-blue-700 border-blue-200",
  processed: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  ignored: "bg-muted text-muted-foreground",
  open: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return format(new Date(value), "dd/MM/yyyy HH:mm");
}

function formatRelative(value?: string | null) {
  if (!value) return "Chưa bao giờ";
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: vi });
}

function formatCohortMonth(value?: string | null) {
  if (!value) return "Chưa rõ";
  try {
    return format(new Date(value), "MM/yyyy");
  } catch (e) {
    return value;
  }
}

function getCohortBg(pct: number) {
  if (pct >= 80) return "bg-indigo-600 text-indigo-50 dark:bg-indigo-700";
  if (pct >= 60) return "bg-indigo-500 text-indigo-50 dark:bg-indigo-600";
  if (pct >= 40) return "bg-indigo-400 text-indigo-950 dark:bg-indigo-500 dark:text-indigo-50";
  if (pct >= 20) return "bg-indigo-200 text-indigo-950 dark:bg-indigo-400 dark:text-indigo-950";
  if (pct >= 5) return "bg-indigo-50 text-indigo-900 dark:bg-indigo-100 dark:text-indigo-950";
  return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function getSourceName(event: RawEvent) {
  return event.data_sources?.name || sourceTypeLabels[event.source_type] || event.source_code || event.source_type;
}

function getSourceIcon(sourceType: string) {
  switch (sourceType) {
    case "manual": return "✍️";
    case "pos": return "🏪";
    case "public_store": return "🌐";
    case "marketplace": return "🛒";
    case "social": return "💬";
    case "webhook": return "🔗";
    case "api": return "⚡";
    case "file_import": return "📁";
    default: return "📊";
  }
}

function eventBelongsToSource(event: RawEvent, source: DataSource) {
  if (event.data_source_id) return event.data_source_id === source.id;
  if (event.source_code && event.source_code === source.code) return true;
  return event.source_type === source.source_type && !event.data_source_id;
}

function getHealthColor(source: DataSource): string {
  if (source.status === "error") return "#ef4444";
  if (source.status === "paused") return "#f59e0b";
  if (source.status === "archived") return "#6b7280";
  if (!source.last_ingested_at) return "#3b82f6";
  const hoursSinceIngestion = (Date.now() - new Date(source.last_ingested_at).getTime()) / 3600000;
  if (hoursSinceIngestion < 1) return "#22c55e";
  if (hoursSinceIngestion < 24) return "#3b82f6";
  return "#f59e0b";
}

const DataHub = () => {
  const {
    companyId,
    role,
    dataSources,
    rawEvents,
    qualityIssues,
    isLoading,
    error,
    upsertDataSources,
    updateDataSource,
    resolveQualityIssue,
    retryRawEvent,
    retryFailedEvents,
  } = useDataHub();
  const { channels } = useSalesChannels();
  const { toast } = useToast();
  const [sourceFilter, setSourceFilter] = useState("all");
  const canManageDataHub = role === "admin";

  const [inactiveDays, setInactiveDays] = useState(180);
  const [isPiiDialogOpen, setIsPiiDialogOpen] = useState(false);

  const { data: channelAttribution = [] } = useChannelAttribution();
  const { data: customerCLV = [] } = useCustomerCLV();
  const { data: customerCohorts = [] } = useCustomerCohorts();
  const runQualityChecks = useRunDataQualityChecks();
  const applyPiiMinimization = useApplyPiiMinimization();

  const pivotedCohorts = useMemo(() => {
    return pivotCohortData(customerCohorts);
  }, [customerCohorts]);

  const maxCohortIndex = useMemo(() => {
    if (customerCohorts.length === 0) return 5;
    const maxIndex = Math.max(...customerCohorts.map(c => c.cohort_index));
    return Math.min(11, Math.max(5, maxIndex));
  }, [customerCohorts]);

  const handleSeedTestData = async () => {
    if (!companyId) return;
    try {
      await seedTestDataFlow(companyId);
      toast({
        title: "Đã đổ dữ liệu test",
        description: "Dữ liệu mẫu đã được tạo thành công cho luồng Data Hub -> Báo cáo.",
      });
      if ((window as any).__forcePushLocalDemoSync) {
        await (window as any).__forcePushLocalDemoSync();
      }
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSeedComplexTestData = async () => {
    if (!companyId) return;
    try {
      await seedComplexTestDataFlow(companyId);
      toast({
        title: "Đã đổ dữ liệu kịch bản chuyên sâu",
        description: "Dữ liệu mẫu kịch bản chuyên sâu đã được tạo thành công.",
      });
      if ((window as any).__forcePushLocalDemoSync) {
        await (window as any).__forcePushLocalDemoSync();
      }
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSeedGrowthTestData = async () => {
    if (!companyId) return;
    try {
      await seedGrowthTestDataFlow(companyId);
      toast({
        title: "Đã đổ dữ liệu lịch sử phát triển",
        description: "Dữ liệu lịch sử 6 tháng phát triển doanh nghiệp, nhân sự và khách hàng đã được tạo thành công.",
      });
      if ((window as any).__forcePushLocalDemoSync) {
        await (window as any).__forcePushLocalDemoSync();
      }
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const stats = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentEvents = rawEvents.filter((event) => new Date(event.received_at).getTime() >= dayAgo);
    const normalized = rawEvents.filter((event) => event.validation_status !== "queued").length;
    const openIssues = qualityIssues.filter((issue) => issue.status === "open").length;
    const activeSources = dataSources.filter((source) => source.status === "active").length;
    const failedEvents = rawEvents.filter((event) => event.ingestion_status === "failed").length;
    const sourceAlerts = dataSources.filter((source) => source.status === "error" || !!source.last_error).length;
    const avgQuality = rawEvents.length
      ? Math.round(rawEvents.reduce((sum, event) => sum + Number(event.quality_score || 0), 0) / rawEvents.length)
      : 0;

    return {
      activeSources,
      recentEvents: recentEvents.length,
      normalizedRate: rawEvents.length ? Math.round((normalized / rawEvents.length) * 100) : 0,
      openIssues,
      failedEvents,
      sourceAlerts,
      avgQuality,
    };
  }, [dataSources, qualityIssues, rawEvents]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return rawEvents.filter((event) => {
      const matchesSource = sourceFilter === "all" || event.source_type === sourceFilter;
      const matchesStatus = statusFilter === "all" || event.ingestion_status === statusFilter || event.validation_status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        event.event_type.toLowerCase().includes(normalizedSearch) ||
        event.external_id?.toLowerCase().includes(normalizedSearch) ||
        event.entity_type?.toLowerCase().includes(normalizedSearch) ||
        getSourceName(event).toLowerCase().includes(normalizedSearch);
      return matchesSource && matchesStatus && matchesSearch;
    });
  }, [rawEvents, searchTerm, sourceFilter, statusFilter]);

  const retryQueue = useMemo(
    () => rawEvents.filter((event) => event.ingestion_status === "failed").slice(0, 10),
    [rawEvents],
  );

  const connectorAlerts = useMemo(
    () =>
      dataSources
        .map((source) => {
          const sourceEvents = rawEvents.filter((event) => eventBelongsToSource(event, source));
          const failedEvents = sourceEvents.filter((event) => event.ingestion_status === "failed");
          const queuedEvents = sourceEvents.filter((event) => event.validation_status === "queued");
          const latestEvent = sourceEvents[0];

          return {
            source,
            failedCount: failedEvents.length,
            queuedCount: queuedEvents.length,
            latestEventAt: latestEvent?.received_at || source.last_ingested_at,
            hasAlert: source.status === "error" || !!source.last_error || failedEvents.length > 0,
          };
        })
        .filter((item) => item.hasAlert),
    [dataSources, rawEvents],
  );

  const seedDefaultSources = () => {
    const baseSources: Omit<DataSource, "id" | "created_at" | "updated_at" | "company_id" | "last_ingested_at" | "last_error" | "created_by" | "sales_channels">[] = [
      {
        code: "manual",
        name: "Đơn nhập tay",
        source_type: "manual",
        status: "active",
        channel_id: null,
        config: { module: "orders" },
        mapping: { entity: "order" },
      },
      {
        code: "pos",
        name: "POS bán hàng",
        source_type: "pos",
        status: "active",
        channel_id: null,
        config: { module: "pos" },
        mapping: { entity: "order" },
      },
      {
        code: "public_store",
        name: "Cửa hàng public",
        source_type: "public_store",
        status: "active",
        channel_id: null,
        config: { route: "/order" },
        mapping: { entity: "order" },
      },
    ];

    const channelSources = channels
      .filter((channel) => channel.company_id === companyId)
      .map((channel) => ({
        code: `channel_${channel.code || channel.id}`,
        name: channel.name,
        source_type: "marketplace",
        status: channel.sync_enabled === false ? "paused" : "active",
        channel_id: channel.id,
        config: { platform_type: channel.platform_type, channel_code: channel.code },
        mapping: { entity: "order", external_id: "platform_order_id" },
      }));

    upsertDataSources.mutate([...baseSources, ...channelSources]);
  };

  const sourceTypeOptions = Array.from(new Set(rawEvents.map((event) => event.source_type)));

  return (
    <MainLayout>
      <Header
        title="Data Hub & BigData"
        subtitle="Thu thập dữ liệu thô đa kênh, chuẩn hóa và kiểm soát chất lượng dữ liệu"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Data Hub chưa sẵn sàng trên database</AlertTitle>
            <AlertDescription>
              Cần chạy migration mới nhất trước khi dùng màn hình này. Lỗi hiện tại: {(error as Error).message}
            </AlertDescription>
          </Alert>
        )}

        {/* Premium Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="stat-gradient-blue border-blue-200/50 dark:border-blue-900/50 overflow-hidden">
            <CardContent className="pt-6 relative">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/5" />
              <div className="flex items-center gap-3 relative">
                <div className="rounded-xl bg-primary/10 p-2.5 ring-1 ring-primary/20">
                  <ServerCog className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nguồn đang bật</p>
                  <p className="text-2xl font-bold animate-count-up">
                    {stats.activeSources}
                    <span className="text-sm font-normal text-muted-foreground">/{dataSources.length}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-gradient-purple border-purple-200/50 dark:border-purple-900/50 overflow-hidden">
            <CardContent className="pt-6 relative">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-purple-500/5" />
              <div className="flex items-center gap-3 relative">
                <div className="rounded-xl bg-purple-500/10 p-2.5 ring-1 ring-purple-500/20">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Event 24h</p>
                  <p className="text-2xl font-bold animate-count-up">{stats.recentEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-gradient-green border-green-200/50 dark:border-green-900/50">
            <CardContent className="pt-6">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chuẩn hóa</span>
                  </div>
                  <span className="text-lg font-bold text-green-700 dark:text-green-400 animate-count-up">{stats.normalizedRate}%</span>
                </div>
                <div className="shimmer-progress rounded-full">
                  <Progress value={stats.normalizedRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-gradient-blue border-blue-200/50 dark:border-blue-900/50">
            <CardContent className="pt-6">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chất lượng TB</span>
                  </div>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-400 animate-count-up">{stats.avgQuality}%</span>
                </div>
                <div className="shimmer-progress rounded-full">
                  <Progress value={stats.avgQuality} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`stat-gradient-amber border-amber-200/50 dark:border-amber-900/50 overflow-hidden ${stats.openIssues > 0 ? 'ring-1 ring-amber-300/50' : ''}`}>
            <CardContent className="pt-6 relative">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-500/5" />
              <div className="flex items-center gap-3 relative">
                <div className={`rounded-xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20 ${stats.openIssues > 0 ? 'sync-pulse rounded-xl' : ''}`}>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vấn đề mở</p>
                  <p className="text-2xl font-bold animate-count-up">{stats.openIssues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sources" className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between flex-wrap">
            <TabsList className="grid w-full grid-cols-5 xl:w-auto">
              <TabsTrigger value="sources" className="gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Nguồn</span>
              </TabsTrigger>
              <TabsTrigger value="connectors" className="gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Kết nối</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2">
                <Layers3 className="h-4 w-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="quality" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Chất lượng</span>
                {stats.openIssues > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{stats.openIssues}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">BigData & Analytics</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => {
                      // Trigger refetch on all queries
                      window.location.reload();
                    }}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Làm mới dữ liệu</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button onClick={seedDefaultSources} disabled={!canManageDataHub || upsertDataSources.isPending} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${upsertDataSources.isPending ? "animate-spin" : ""}`} />
                Khởi tạo nguồn
              </Button>
              <Button onClick={handleSeedTestData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Database className="mr-2 h-4 w-4" />
                Đổ Data Test
              </Button>
              <Button onClick={handleSeedComplexTestData} className="bg-purple-600 text-white hover:bg-purple-700">
                <Sparkles className="mr-2 h-4 w-4" />
                Đổ Data Test Chuyên Sâu
              </Button>
              <Button onClick={handleSeedGrowthTestData} className="bg-emerald-600 text-white hover:bg-emerald-700">
                <TrendingUp className="mr-2 h-4 w-4" />
                Đổ Data Phát Triển Doanh Nghiệp
              </Button>
            </div>
          </div>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Nguồn thu thập</CardTitle>
                <CardDescription>Quản trị POS, public store, nhập tay, sàn TMĐT và các kênh tích hợp sau này.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nguồn</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Kênh liên kết</TableHead>
                      <TableHead>Lần nhận cuối</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">Đang tải...</TableCell>
                      </TableRow>
                    ) : dataSources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Chưa có nguồn dữ liệu. Bấm “Khởi tạo nguồn” để tạo bộ mặc định.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dataSources.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{source.name}</p>
                              <p className="font-mono text-xs text-muted-foreground">{source.code}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sourceTypeLabels[source.source_type] || source.source_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusClass[source.status]}>
                              {source.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{source.sales_channels?.name || "Không"}</TableCell>
                          <TableCell>{formatDate(source.last_ingested_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canManageDataHub || updateDataSource.isPending}
                              onClick={() => updateDataSource.mutate({
                                id: source.id,
                                status: source.status === "active" ? "paused" : "active",
                              })}
                            >
                              {source.status === "active" ? (
                                <PauseCircle className="mr-1 h-4 w-4" />
                              ) : (
                                <PlayCircle className="mr-1 h-4 w-4" />
                              )}
                              {source.status === "active" ? "Tạm dừng" : "Bật"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connector Health Tab */}
          <TabsContent value="connectors" className="animate-fade-in">
            <div className="space-y-4">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Sức khỏe kết nối
                  </CardTitle>
                  <CardDescription>Theo dõi trạng thái real-time của tất cả nguồn dữ liệu và pipeline đồng bộ.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-xs font-medium text-muted-foreground">Connector cần xử lý</p>
                      <p className="mt-1 text-2xl font-bold">{stats.sourceAlerts}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="text-xs font-medium text-muted-foreground">Event lỗi trong hàng đợi</p>
                      <p className="mt-1 text-2xl font-bold">{stats.failedEvents}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Retry hàng loạt</p>
                        <p className="mt-1 text-sm text-muted-foreground">Đưa event lỗi về hàng đợi xử lý.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryFailedEvents.mutate({})}
                        disabled={!canManageDataHub || stats.failedEvents === 0 || retryFailedEvents.isPending}
                      >
                        <RotateCcw className={`mr-2 h-4 w-4 ${retryFailedEvents.isPending ? "animate-spin" : ""}`} />
                        Retry
                      </Button>
                    </div>
                  </div>

                  {!canManageDataHub && (
                    <Alert className="mb-5">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Cần quyền admin để thao tác connector</AlertTitle>
                      <AlertDescription>
                        Vai trò hiện tại có thể xem sức khỏe dữ liệu, nhưng thao tác retry, bật/tạm dừng nguồn và khởi tạo nguồn cần quyền admin.
                      </AlertDescription>
                    </Alert>
                  )}

                  {dataSources.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <WifiOff className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Chưa có nguồn dữ liệu nào. Bấm "Khởi tạo nguồn" để bắt đầu.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {dataSources.map((source) => {
                        const healthColor = getHealthColor(source);
                        const isActive = source.status === "active";
                        const lastIngested = source.last_ingested_at;
                        const sourceEvents = rawEvents.filter((event) => eventBelongsToSource(event, source));
                        const eventCount = sourceEvents.length;
                        const failedEventCount = sourceEvents.filter((event) => event.ingestion_status === "failed").length;

                        return (
                          <div
                            key={source.id}
                            className="connector-card group"
                            style={{ '--connector-color': healthColor } as React.CSSProperties}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{getSourceIcon(source.source_type)}</span>
                                <div>
                                  <p className="font-semibold text-sm text-foreground">{source.name}</p>
                                  <p className="text-[11px] text-muted-foreground font-mono">{source.code}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isActive && (
                                  <div className="h-2 w-2 rounded-full bg-green-500 live-dot" />
                                )}
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${statusClass[source.status]}`}
                                >
                                  {source.status === "active" ? "Live" : source.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Lần nhận cuối
                                </span>
                                <span className="font-medium text-foreground">
                                  {formatRelative(lastIngested)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  Events gần đây
                                </span>
                                <span className="font-medium text-foreground">{eventCount}</span>
                              </div>
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Event lỗi
                                </span>
                                <span className={failedEventCount > 0 ? "font-medium text-destructive" : "font-medium text-foreground"}>
                                  {failedEventCount}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Loại
                                </span>
                                <span className="font-medium text-foreground">
                                  {sourceTypeLabels[source.source_type] || source.source_type}
                                </span>
                              </div>
                              {source.sales_channels?.name && (
                                <div className="flex items-center justify-between text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Wifi className="h-3 w-3" />
                                    Kênh
                                  </span>
                                  <span className="font-medium text-foreground">{source.sales_channels.name}</span>
                                </div>
                              )}
                              {source.last_error && (
                                <div className="mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-[11px]">
                                  ⚠️ {source.last_error}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-border/50 flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => retryFailedEvents.mutate({ dataSourceId: source.id, sourceType: source.source_type })}
                                disabled={!canManageDataHub || failedEventCount === 0 || retryFailedEvents.isPending}
                              >
                                <RotateCcw className={`mr-1 h-3 w-3 ${retryFailedEvents.isPending ? "animate-spin" : ""}`} />
                                Retry lỗi
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={!canManageDataHub || updateDataSource.isPending}
                                onClick={() => updateDataSource.mutate({
                                  id: source.id,
                                  status: source.status === "active" ? "paused" : "active",
                                })}
                              >
                                {source.status === "active" ? (
                                  <><PauseCircle className="mr-1 h-3 w-3" /> Tạm dừng</>
                                ) : (
                                  <><PlayCircle className="mr-1 h-3 w-3" /> Bật lại</>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RotateCcw className="h-5 w-5 text-primary" />
                      Hàng đợi retry
                    </CardTitle>
                    <CardDescription>
                      Gom các event đồng bộ lỗi để đội vận hành đưa về hàng đợi xử lý lại mà không cần sửa dữ liệu thủ công.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => retryFailedEvents.mutate({})}
                    disabled={!canManageDataHub || retryQueue.length === 0 || retryFailedEvents.isPending}
                  >
                    <RotateCcw className={`mr-2 h-4 w-4 ${retryFailedEvents.isPending ? "animate-spin" : ""}`} />
                    Retry tất cả
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {connectorAlerts.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {connectorAlerts.map(({ source, failedCount, queuedCount, latestEventAt }) => (
                        <div key={source.id} className="rounded-lg border bg-background p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{source.name}</p>
                              <p className="font-mono text-xs text-muted-foreground">{source.code}</p>
                            </div>
                            <Badge variant="outline" className={statusClass[source.status]}>
                              {source.status}
                            </Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Lỗi</p>
                              <p className="font-semibold text-destructive">{failedCount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Chờ xử lý</p>
                              <p className="font-semibold">{queuedCount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Mới nhất</p>
                              <p className="font-semibold">{formatRelative(latestEventAt)}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 w-full"
                            onClick={() => retryFailedEvents.mutate({ dataSourceId: source.id, sourceType: source.source_type })}
                            disabled={!canManageDataHub || failedCount === 0 || retryFailedEvents.isPending}
                          >
                            <RotateCcw className={`mr-2 h-4 w-4 ${retryFailedEvents.isPending ? "animate-spin" : ""}`} />
                            Retry connector này
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Nguồn</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Lỗi</TableHead>
                        <TableHead>External ID</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retryQueue.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Không có event lỗi cần retry.
                          </TableCell>
                        </TableRow>
                      ) : (
                        retryQueue.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="whitespace-nowrap">{formatDate(event.received_at)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{getSourceName(event)}</p>
                                <p className="text-xs text-muted-foreground">{sourceTypeLabels[event.source_type] || event.source_type}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{event.event_type}</TableCell>
                            <TableCell className="max-w-[280px] truncate text-sm text-destructive">
                              {event.error_message || "Chưa có mô tả lỗi"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{event.external_id || event.dedupe_key || "-"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => retryRawEvent.mutate(event)}
                                disabled={!canManageDataHub || retryRawEvent.isPending}
                              >
                                <RotateCcw className={`mr-1 h-4 w-4 ${retryRawEvent.isPending ? "animate-spin" : ""}`} />
                                Retry
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Dòng dữ liệu thô</CardTitle>
                <CardDescription>100 sự kiện mới nhất dùng để audit, chuẩn hóa và xây pipeline phân tích.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Tìm event, external ID, entity, nguồn..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SelectValue placeholder="Nguồn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả nguồn</SelectItem>
                      {sourceTypeOptions.map((sourceType) => (
                        <SelectItem key={sourceType} value={sourceType}>
                          {sourceTypeLabels[sourceType] || sourceType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="received">Đã nhận</SelectItem>
                      <SelectItem value="processed">Đã xử lý</SelectItem>
                      <SelectItem value="failed">Lỗi</SelectItem>
                      <SelectItem value="queued">Chờ chuẩn hóa</SelectItem>
                      <SelectItem value="normalized">Đã chuẩn hóa</SelectItem>
                      <SelectItem value="linked">Đã liên kết</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Chất lượng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>External ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Chưa có sự kiện phù hợp.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(event.received_at)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{getSourceName(event)}</p>
                              <p className="text-xs text-muted-foreground">{sourceTypeLabels[event.source_type] || event.source_type}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{event.event_type}</TableCell>
                          <TableCell>
                            <span className="text-sm">{event.entity_type || "raw"}</span>
                            {event.entity_id && <p className="font-mono text-xs text-muted-foreground">{event.entity_id}</p>}
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-24 items-center gap-2">
                              <Progress value={Number(event.quality_score || 0)} className="h-2" />
                              <span className="w-9 text-xs">{Number(event.quality_score || 0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className={statusClass[event.ingestion_status]}>
                                {ingestionStatusLabels[event.ingestion_status] || event.ingestion_status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {validationStatusLabels[event.validation_status] || event.validation_status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{event.external_id || event.dedupe_key || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality">
            <Card>
              <CardHeader>
                <CardTitle>Vấn đề chất lượng dữ liệu</CardTitle>
                <CardDescription>Theo dõi thiếu số điện thoại, thiếu địa chỉ, trùng mã đơn, mapping lỗi hoặc payload không hợp lệ.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Loại lỗi</TableHead>
                      <TableHead>Trường</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualityIssues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Chưa có vấn đề chất lượng dữ liệu.
                        </TableCell>
                      </TableRow>
                    ) : (
                      qualityIssues.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(issue.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusClass[issue.severity]}>
                              {issue.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{issue.issue_type}</TableCell>
                          <TableCell>{issue.field_name || "-"}</TableCell>
                          <TableCell>{issue.message}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusClass[issue.status]}>
                              {issue.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {issue.status === "open" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resolveQualityIssue.mutate(issue.id)}
                                disabled={!canManageDataHub || resolveQualityIssue.isPending}
                              >
                                Đóng
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              {/* Channel Attribution Card */}
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    Hiệu suất & Doanh thu theo Kênh
                  </CardTitle>
                  <CardDescription>Ghi nhận doanh thu từ các nguồn POS, public store, sàn TMĐT.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {channelAttribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelAttribution}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="channel_name" className="text-xs" tickFormatter={(v) => v || "Vãng lai"} />
                          <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                          <RechartsTooltip formatter={(v: any) => formatCurrency(Number(v))} />
                          <Bar dataKey="total_revenue" name="Doanh thu" radius={[4, 4, 0, 0]}>
                            {channelAttribution.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.channel_color || `hsl(var(--chart-${(index % 5) + 1}))`}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Chưa có dữ liệu kênh bán hàng.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chi tiết hiệu suất kênh</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {channelAttribution.map((chan) => (
                        <div
                          key={`${chan.source_type}-${chan.channel_code}`}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: chan.channel_color || "hsl(var(--primary))" }}
                            />
                            <div>
                              <p className="text-sm font-semibold">{chan.channel_name || "Nhập tay / POS"}</p>
                              <p className="text-[11px] text-muted-foreground uppercase">{chan.source_type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(chan.completed_revenue)}</p>
                            <p className="text-xs text-muted-foreground">{chan.completed_orders} đơn thành công</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance & Governance Card */}
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    Quản trị dữ liệu & Tuân thủ GDPR
                  </CardTitle>
                  <CardDescription>Các công cụ kiểm soát chất lượng, an toàn thông tin và tối thiểu hóa thông tin cá nhân (PII).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-indigo-200/50 bg-indigo-50/20 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <div className="flex gap-3">
                      <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-indigo-950 dark:text-indigo-200">Tối thiểu hóa thông tin (PII Minimization)</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Hệ thống hỗ trợ ẩn danh hóa thông tin cá nhân (Họ tên, SĐT, Email, Địa chỉ) của khách hàng không phát sinh đơn hàng mới trong một khoảng thời gian cụ thể (mặc định 180 ngày).
                        </p>
                        <div className="flex items-center gap-2 pt-3">
                          <div className="w-24">
                            <Input
                              type="number"
                              value={inactiveDays}
                              onChange={(e) => setInactiveDays(Number(e.target.value))}
                              placeholder="180"
                              className="h-8 text-xs"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">ngày không hoạt động</span>
                        </div>
                        <div className="pt-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs"
                            disabled={!canManageDataHub || applyPiiMinimization.isPending}
                            onClick={() => setIsPiiDialogOpen(true)}
                          >
                            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                            Thực hiện ẩn danh PII
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200/50 bg-slate-50/20 p-4 dark:border-slate-800/50 dark:bg-slate-900/20">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-foreground">Quét chất lượng dữ liệu định kỳ</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Tìm đơn hàng trị giá 0đ bất thường, trùng lặp ID nền tảng bên ngoài, hoặc các đơn hàng đã hoàn thành nhưng thiếu SĐT của khách.
                        </p>
                        <div className="pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            disabled={!canManageDataHub || runQualityChecks.isPending}
                            onClick={() => runQualityChecks.mutate()}
                          >
                            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${runQualityChecks.isPending ? "animate-spin" : ""}`} />
                            Quét chất lượng ngay
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cohort Retention Grid Card */}
              <Card className="col-span-1 lg:col-span-5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    Phân tích Cohort giữ chân khách hàng (Tháng)
                  </CardTitle>
                  <CardDescription>Tỷ lệ % khách hàng quay lại mua hàng tính từ tháng có đơn hàng đầu tiên (Cohort Size).</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {pivotedCohorts.length > 0 ? (
                    <Table className="border-collapse border border-border">
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="border border-border font-bold">Tháng bắt đầu</TableHead>
                          <TableHead className="border border-border font-bold text-center">Khách hàng</TableHead>
                          {Array.from({ length: maxCohortIndex + 1 }).map((_, i) => (
                            <TableHead key={i} className="border border-border text-center font-bold">T+{i}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pivotedCohorts.map((row) => (
                          <TableRow key={row.signupMonth} className="hover:bg-transparent">
                            <TableCell className="border border-border font-medium whitespace-nowrap">
                              {formatCohortMonth(row.signupMonth)}
                            </TableCell>
                            <TableCell className="border border-border text-center font-semibold">
                              {row.cohortSize}
                            </TableCell>
                            {Array.from({ length: maxCohortIndex + 1 }).map((_, i) => {
                              const cell = row.retention[i];
                              if (!cell) {
                                return (
                                  <TableCell key={i} className="border border-border text-center text-muted-foreground/30 bg-slate-50/50 dark:bg-slate-900/30">
                                    -
                                  </TableCell>
                                );
                              }
                              return (
                                <TooltipProvider key={i}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <TableCell className={`border border-border text-center text-xs cursor-default transition-all duration-200 ${getCohortBg(cell.percentage)}`}>
                                        {cell.percentage}%
                                      </TableCell>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs space-y-1">
                                        <p className="font-bold">Tháng thứ {i}</p>
                                        <p>Khách mua: {cell.customers} người</p>
                                        <p>Doanh thu: {formatCurrency(cell.revenue)}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      Chưa có dữ liệu phân tích Cohort.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer CLV Leaderboard Card */}
              <Card className="col-span-1 lg:col-span-5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Top 20 khách hàng giá trị cao (CLV)
                  </CardTitle>
                  <CardDescription>Xếp hạng khách hàng dựa trên tần suất mua và tổng chi tiêu (Monetary).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead className="text-center">Số đơn hàng</TableHead>
                          <TableHead className="text-right">Tổng chi tiêu</TableHead>
                          <TableHead className="text-right">Giá trị đơn trung bình</TableHead>
                          <TableHead className="text-center">Vòng đời (ngày)</TableHead>
                          <TableHead className="text-center">Giao dịch đầu/cuối</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerCLV.length > 0 ? (
                          customerCLV.map((cust) => (
                            <TableRow key={cust.customer_phone}>
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-sm">{cust.customer_name || "Khách ẩn danh"}</p>
                                  <p className="text-xs font-mono text-muted-foreground">{cust.customer_phone}</p>
                                  {cust.customer_email && <p className="text-[11px] text-muted-foreground">{cust.customer_email}</p>}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">{cust.total_orders}</TableCell>
                              <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(cust.total_spent)}
                              </TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(cust.avg_order_value)}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{cust.customer_lifespan_days} ngày</TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground whitespace-nowrap">
                                {formatCohortMonth(cust.first_purchase_date)} - {formatCohortMonth(cust.last_purchase_date)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-6">
                              Chưa có dữ liệu khách hàng giá trị cao.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AlertDialog for PII Confirmation */}
          <AlertDialog open={isPiiDialogOpen} onOpenChange={setIsPiiDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  Xác nhận thực hiện ẩn danh hóa thông tin PII?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này sẽ mã hóa/ẩn danh toàn bộ tên, email, số điện thoại và địa chỉ giao hàng của những khách hàng không phát sinh đơn hàng mới trong vòng{" "}
                  <span className="font-bold text-foreground">{inactiveDays} ngày</span> qua.
                  <br />
                  <br />
                  <span className="text-destructive font-semibold">Cảnh báo: Hành động này là vĩnh viễn và không thể hoàn tác!</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    applyPiiMinimization.mutate(inactiveDays);
                    setIsPiiDialogOpen(false);
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-white"
                >
                  Xác nhận ẩn danh
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DataHub;

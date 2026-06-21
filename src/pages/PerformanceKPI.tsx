import { MainLayout } from "@/components/layout/MainLayout";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, History, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { KPIScoringTab } from "@/components/performance/KPIScoringTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const KPIHistoryTab = () => {
  const { companyId } = useCompanyContext();
  
  const { data: seasons, isLoading } = useQuery({
    queryKey: ["kpi-seasons-history", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("kpi_seasons")
        .select("*")
        .eq("company_id", companyId)
        .order("end_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!seasons?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-muted mb-4">
            <History className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Chưa có lịch sử đánh giá</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Sau khi hoàn thành kỳ đánh giá đầu tiên, lịch sử sẽ được hiển thị tại đây.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {seasons.map((season, index) => {
        const now = new Date();
        const endDate = new Date(season.end_date);
        const startDate = new Date(season.start_date);
        const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const progressPercent = season.is_active ? Math.min(100, (elapsedDays / totalDays) * 100) : 100;

        return (
          <Card 
            key={season.id} 
            className={`transition-all hover:shadow-md ${season.is_active ? "border-primary/30 bg-primary/[0.02]" : ""}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{season.name}</CardTitle>
                <Badge variant={season.is_active ? "default" : "secondary"}>
                  {season.is_active ? "Đang diễn ra" : season.is_locked ? "Đã khóa" : "Đã kết thúc"}
                </Badge>
              </div>
              <CardDescription>
                {format(new Date(season.start_date), "dd/MM/yyyy", { locale: vi })} → {format(new Date(season.end_date), "dd/MM/yyyy", { locale: vi })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {season.is_active && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Tiến độ kỳ đánh giá</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="capitalize">
                    {season.type === "monthly" ? "Hàng tháng" : 
                     season.type === "quarterly" ? "Hàng quý" : "Hàng năm"}
                  </span>
                  {season.description && <span>• {season.description}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const PerformanceKPI = () => {
  const { onboarding, isLoading, error } = usePerformanceOnboarding();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Đang tải dữ liệu KPI...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Lỗi tải dữ liệu</CardTitle>
                  <CardDescription>Không thể tải thông tin KPI</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error.message || "Đã xảy ra lỗi. Vui lòng thử lại."}
              </p>
              <Button onClick={() => window.location.reload()} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!onboarding?.is_completed) {
    return <Navigate to="/performance/setup" replace />;
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">KPI & Đánh giá</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi điểm số và kết quả đánh giá K.B.I.F
          </p>
        </div>

        <Tabs defaultValue="scoring" className="w-full animate-slide-up">
          <TabsList className="h-11">
            <TabsTrigger value="scoring" className="gap-2 px-4">
              <Target className="h-4 w-4" />
              Điểm số
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 px-4">
              <History className="h-4 w-4" />
              Lịch sử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scoring" className="mt-6">
            <KPIScoringTab />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <KPIHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PerformanceKPI;

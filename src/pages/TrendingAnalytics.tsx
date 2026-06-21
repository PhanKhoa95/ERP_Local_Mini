import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, MessageSquare, Download, Flame, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { exportRowsToExcel } from "@/lib/excel";

export default function TrendingAnalytics() {
  const { companyId } = useCompanyContext();

  const { data: trendingQuestions = [], isLoading } = useQuery({
    queryKey: ["trending-questions", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trending_questions")
        .select("*")
        .eq("company_id", companyId!)
        .order("count", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: searchQueries = [] } = useQuery({
    queryKey: ["search-queries-stats", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_queries")
        .select("created_at")
        .eq("company_id", companyId!)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Group queries by day for chart
  const dailyStats = searchQueries.reduce((acc: Record<string, number>, q) => {
    const day = new Date(q.created_at).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit" });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(dailyStats).map(([day, count]) => ({ day, count }));

  const topQuestions = trendingQuestions.slice(0, 10);
  const barChartData = topQuestions.map(q => ({
    question: q.question.substring(0, 30) + (q.question.length > 30 ? "..." : ""),
    count: q.count || 0,
  }));

  const exportToExcel = () => {
    const data = trendingQuestions.map((q, i) => ({
      "STT": i + 1,
      "Câu hỏi": q.question,
      "Số lần hỏi": q.count,
      "Tăng trưởng": `${(q.growth_rate || 0).toFixed(1)}%`,
      "Lần hỏi gần nhất": new Date(q.last_asked_at || q.created_at).toLocaleString("vi-VN"),
    }));
    void exportRowsToExcel(data, "Trending", `trending-questions-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const totalQueries = searchQueries.length;
  const avgPerDay = chartData.length ? (totalQueries / chartData.length).toFixed(1) : 0;
  const topGrowth = trendingQuestions.reduce((max, q) => Math.max(max, q.growth_rate || 0), 0);

  return (
    <MainLayout>
      <Header 
        title="Trending Analytics" 
        subtitle="Phân tích câu hỏi phổ biến và xu hướng tìm kiếm"
        actions={
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{totalQueries}</span>
              </div>
              <p className="text-muted-foreground text-sm">Lượt hỏi (7 ngày)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{avgPerDay}</span>
              </div>
              <p className="text-muted-foreground text-sm">Trung bình/ngày</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">{trendingQuestions.length}</span>
              </div>
              <p className="text-muted-foreground text-sm">Chủ đề trending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">+{topGrowth.toFixed(0)}%</span>
              </div>
              <p className="text-muted-foreground text-sm">Tăng trưởng cao nhất</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lượt tìm kiếm theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))" 
                        }}
                      />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
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
              <CardTitle>Top câu hỏi phổ biến</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="question" width={150} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))" 
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
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
        </div>

        {/* Trending Questions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Câu hỏi Trending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : trendingQuestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có dữ liệu trending</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trendingQuestions.map((q, idx) => (
                  <div 
                    key={q.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-muted-foreground w-8">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium">{q.question}</p>
                        <p className="text-sm text-muted-foreground">
                          {q.count} lần hỏi
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(q.growth_rate || 0) > 10 && (
                        <Badge variant="default" className="bg-orange-500">
                          <Flame className="h-3 w-3 mr-1" />
                          Hot
                        </Badge>
                      )}
                      <Badge variant={(q.growth_rate || 0) > 0 ? "default" : "secondary"}>
                        {(q.growth_rate || 0) > 0 ? "+" : ""}{(q.growth_rate || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

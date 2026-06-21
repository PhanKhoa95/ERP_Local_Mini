import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, RefreshCw, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";

interface ForecastWeek {
  week: string;
  expected_revenue: number;
  expected_expense: number;
  net_cashflow: number;
}

interface ForecastData {
  forecast: ForecastWeek[];
  insights: string[];
  risk_level: "low" | "medium" | "high";
  recommendations: string[];
  total_debt: number;
}

export function CashFlowForecast() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchForecast = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-cashflow-forecast", {
        body: { companyId },
      });
      if (error) throw error;
      setData(result);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tạo dự báo. Thử lại sau." });
    } finally {
      setIsLoading(false);
    }
  };

  const riskColors = {
    low: "bg-success/10 text-success border-success/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    high: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const riskLabels = { low: "Thấp", medium: "Trung bình", high: "Cao" };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString("vi-VN");
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Dự báo Dòng tiền AI
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchForecast} disabled={isLoading} className="gap-1">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {data ? "Cập nhật" : "Phân tích"}
        </Button>
      </CardHeader>
      <CardContent>
        {!data && !isLoading && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Nhấn "Phân tích" để AI dự báo dòng tiền 30 ngày tới
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">AI đang phân tích dữ liệu tài chính...</p>
            </div>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-4">
            {/* Risk Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("gap-1", riskColors[data.risk_level])}>
                <AlertTriangle className="h-3 w-3" />
                Rủi ro: {riskLabels[data.risk_level]}
              </Badge>
              {data.total_debt > 0 && (
                <Badge variant="outline" className="gap-1 bg-destructive/5 text-destructive">
                  Công nợ: {formatCurrency(data.total_debt)}đ
                </Badge>
              )}
            </div>

            {/* Chart */}
            {data.forecast?.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.forecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="week" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => `${formatCurrency(value)}đ`} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Bar dataKey="expected_revenue" fill="hsl(var(--success))" name="Thu" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="expected_expense" fill="hsl(var(--destructive))" name="Chi" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Insights */}
            {data.insights?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Nhận định:</p>
                {data.insights.slice(0, 3).map((insight, i) => (
                  <p key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span> {insight}
                  </p>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Đề xuất:
                </p>
                {data.recommendations.slice(0, 3).map((rec, i) => (
                  <p key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-warning mt-0.5">→</span> {rec}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

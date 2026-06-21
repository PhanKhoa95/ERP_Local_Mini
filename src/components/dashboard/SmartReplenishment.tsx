import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { Package, AlertTriangle, Loader2, RefreshCw, ShoppingCart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  avg_daily_sales: number;
  days_until_stockout: number;
  lead_time_days: number;
  recommended_quantity: number;
  estimated_cost: number;
  urgency: "critical" | "high" | "normal";
}

export function SmartReplenishment() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analyze = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-auto-replenishment", {
        body: { companyId, action: "analyze" },
      });
      if (error) throw error;
      setRecommendations(data.recommendations || []);
      setHasAnalyzed(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể phân tích tồn kho." });
    } finally {
      setIsLoading(false);
    }
  };

  const urgencyConfig = {
    critical: { label: "Khẩn cấp", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
    high: { label: "Cao", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
    normal: { label: "Bình thường", color: "bg-info/10 text-info border-info/20", icon: Package },
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString("vi-VN");
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Đề xuất Đặt hàng NCC
        </CardTitle>
        <Button variant="outline" size="sm" onClick={analyze} disabled={isLoading} className="gap-1">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Phân tích
        </Button>
      </CardHeader>
      <CardContent>
        {!hasAnalyzed && !isLoading && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Phân tích tốc độ bán để đề xuất đặt hàng tối ưu
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {hasAnalyzed && !isLoading && (
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-center py-4 text-sm text-success">
                ✅ Tất cả sản phẩm đều đủ hàng!
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  {["critical", "high", "normal"].map((u) => {
                    const count = recommendations.filter(r => r.urgency === u).length;
                    if (!count) return null;
                    const config = urgencyConfig[u as keyof typeof urgencyConfig];
                    return (
                      <Badge key={u} variant="outline" className={cn("gap-1 text-xs", config.color)}>
                        {count} {config.label}
                      </Badge>
                    );
                  })}
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {recommendations.slice(0, 8).map((rec) => {
                    const config = urgencyConfig[rec.urgency];
                    return (
                      <div key={rec.product_id} className={cn("p-3 rounded-lg border", config.color.replace("text-", "border-").split(" ")[2], "bg-card")}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{rec.product_name}</p>
                            <p className="text-xs text-muted-foreground">{rec.sku}</p>
                          </div>
                          <Badge variant="outline" className={cn("text-xs shrink-0", config.color)}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Tồn:</span>{" "}
                            <span className="font-medium">{rec.current_stock}/{rec.min_stock}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Còn:</span>{" "}
                            <span className="font-medium">{rec.days_until_stockout} ngày</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Đặt:</span>{" "}
                            <span className="font-bold text-primary">{rec.recommended_quantity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-muted-foreground text-right pt-1">
                  Tổng chi phí ước tính: {formatCurrency(recommendations.reduce((s, r) => s + r.estimated_cost, 0))}đ
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

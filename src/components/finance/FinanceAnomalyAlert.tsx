import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2, AlertTriangle, Info, XCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Anomaly {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  recommendation: string;
}

const severityConfig = {
  critical: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  warning: { color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  info: { color: "bg-info/10 text-info border-info/20", icon: Info },
};

export function FinanceAnomalyAlert() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-finance-anomaly");
      if (error) throw error;
      setAnomalies(data?.anomalies || []);
      setScanned(true);
      if (!data?.anomalies?.length) {
        toast.success("Không phát hiện bất thường nào!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi quét bất thường");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Phát hiện Bất thường
          </CardTitle>
          <Button size="sm" onClick={handleScan} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShieldAlert className="h-4 w-4 mr-2" />
            )}
            Quét bất thường
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!scanned ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nhấn "Quét bất thường" để AI phân tích dữ liệu tài chính 30 ngày gần nhất
          </p>
        ) : anomalies.length === 0 ? (
          <div className="text-center py-6">
            <ShieldAlert className="h-8 w-8 text-success mx-auto mb-2 opacity-40" />
            <p className="text-sm text-success font-medium">Không phát hiện bất thường</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly, i) => {
              const config = severityConfig[anomaly.severity] || severityConfig.info;
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className={cn("p-4 rounded-lg border", config.color)}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{anomaly.title}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-80">{anomaly.description}</p>
                      <p className="text-xs font-medium mt-1">💡 {anomaly.recommendation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

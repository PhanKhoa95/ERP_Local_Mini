import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IntegrityResult {
  module: string;
  status: "ok" | "warning" | "error";
  message: string;
  details?: string;
}

export function DataIntegrityWidget() {
  const [results, setResults] = useState<IntegrityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const { toast } = useToast();

  const runCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("data-integrity-check");
      if (error) throw error;
      setResults(data.results || []);
      setLastCheck(new Date().toLocaleString("vi-VN"));
      const hasIssues = data.results?.some((r: IntegrityResult) => r.status !== "ok");
      if (hasIssues) {
        toast({ title: "Phát hiện sự không nhất quán", description: "Kiểm tra chi tiết bên dưới", variant: "destructive" });
      } else {
        toast({ title: "Dữ liệu nhất quán", description: "Tất cả module đều hợp lệ" });
      }
    } catch (err) {
      toast({ title: "Lỗi kiểm tra", description: "Không thể chạy kiểm tra toàn vẹn", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const hasIssues = results.some(r => r.status !== "ok");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {hasIssues ? <ShieldAlert className="h-4 w-4 text-warning" /> : <ShieldCheck className="h-4 w-4 text-success" />}
            Toàn vẹn dữ liệu
          </CardTitle>
          <Button size="sm" variant="outline" onClick={runCheck} disabled={loading} className="h-7 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Kiểm tra
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {results.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nhấn "Kiểm tra" để quét tính nhất quán giữa các module</p>
        ) : (
          <>
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.module}</span>
                <Badge variant={r.status === "ok" ? "default" : r.status === "warning" ? "secondary" : "destructive"} className="text-xs">
                  {r.status === "ok" ? "✓" : r.status === "warning" ? "⚠" : "✗"} {r.message}
                </Badge>
              </div>
            ))}
            {lastCheck && <p className="text-xs text-muted-foreground pt-1">Lần kiểm tra: {lastCheck}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

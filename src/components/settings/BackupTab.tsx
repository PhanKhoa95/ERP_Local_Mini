import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, HardDrive, Loader2, Shield, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";

const EXPORT_TABLES = [
  { key: "products", label: "Sản phẩm", icon: "📦" },
  { key: "orders", label: "Đơn hàng", icon: "🛒" },
  { key: "partners", label: "Đối tác", icon: "🤝" },
  { key: "documents", label: "Tài liệu", icon: "📄" },
  { key: "perf_employees", label: "Nhân viên", icon: "👤" },
  { key: "inventory_transactions", label: "Giao dịch kho", icon: "📊" },
  { key: "payment_transactions", label: "Giao dịch thanh toán", icon: "💰" },
] as const;

export function BackupTab() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const { companyId } = useCompanyContext();
  const { toast } = useToast();

  const exportTable = async (tableName: string) => {
    if (!companyId) return;
    try {
      const query = (supabase.from(tableName as any) as any).select("*");
      // Most tables have company_id
      if (tableName !== "inventory_transactions" && tableName !== "payment_transactions") {
        query.eq("company_id", companyId);
      }
      const { data, error } = await query.limit(10000);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`Export ${tableName} failed:`, err);
      return [];
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSingle = async (tableName: string) => {
    setExporting(tableName);
    try {
      const data = await exportTable(tableName);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadJSON(data, `${tableName}_backup_${timestamp}.json`);
      toast({ title: "Xuất thành công", description: `Đã xuất ${data?.length || 0} bản ghi từ ${tableName}` });
    } catch {
      toast({ title: "Lỗi xuất dữ liệu", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const allData: Record<string, any> = {
        exported_at: new Date().toISOString(),
        company_id: companyId,
      };
      for (const table of EXPORT_TABLES) {
        allData[table.key] = await exportTable(table.key);
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadJSON(allData, `full_backup_${timestamp}.json`);
      toast({ title: "Xuất toàn bộ thành công", description: "Đã xuất tất cả dữ liệu công ty" });
    } catch {
      toast({ title: "Lỗi xuất dữ liệu", variant: "destructive" });
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sao lưu & Xuất dữ liệu
          </CardTitle>
          <CardDescription>
            Xuất toàn bộ dữ liệu công ty dưới dạng JSON. Dữ liệu trên cloud được tự động sao lưu hàng ngày.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExportAll} disabled={exportingAll} className="w-full">
            {exportingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HardDrive className="h-4 w-4 mr-2" />}
            Xuất toàn bộ dữ liệu
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPORT_TABLES.map(table => (
              <div key={table.key} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <span>{table.icon}</span>
                  <span className="text-sm font-medium">{table.label}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleExportSingle(table.key)}
                  disabled={exporting === table.key}
                >
                  {exporting === table.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5" />
            Tình trạng sao lưu Cloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-success/10 text-success border-success/30">Tự động</Badge>
            <span className="text-sm text-muted-foreground">
              Dữ liệu được tự động sao lưu liên tục trên Lovable Cloud với Point-in-Time Recovery.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

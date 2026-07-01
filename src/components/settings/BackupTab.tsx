import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, HardDrive, Loader2, Shield, Database, RotateCcw, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { isLocalDemoAuthEnabled, resetLocalDemoData } from "@/lib/localDemoAuth";
import { useQueryClient } from "@tanstack/react-query";
import { runSystemDataAudit } from "@/lib/systemDataAudit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EXPORT_TABLES = [
  { key: "partners", label: "Đối tác", icon: "🤝" },
  { key: "products", label: "Sản phẩm", icon: "📦" },
  { key: "warehouse_stock", label: "Tồn kho", icon: "🏢" },
  { key: "product_bom", label: "Định mức (BOM)", icon: "📋" },
  { key: "perf_employees", label: "Nhân viên", icon: "👤" },
  { key: "documents", label: "Tài liệu", icon: "📄" },
  { key: "orders", label: "Đơn hàng", icon: "🛒" },
  { key: "order_items", label: "Chi tiết đơn hàng", icon: "🛍️" },
  { key: "inventory_transactions", label: "Giao dịch kho", icon: "📊" },
  { key: "payment_transactions", label: "Giao dịch thanh toán", icon: "💰" },
  { key: "journal_entries", label: "Bút toán", icon: "📓" },
  { key: "journal_lines", label: "Chi tiết bút toán", icon: "📝" },
] as const;

const LOCAL_EXPORT_KEYS = [
  "products",
  "orders",
  "partners",
  "documents",
  "perf_employees",
  "inventory_transactions",
  "payment_transactions",
  "journal_entries",
  "journal_lines",
  "warehouse_stock",
  "product_bom"
] as const;

const SUPABASE_EXPORT_KEYS = [
  "partners",
  "products",
  "warehouse_stock",
  "product_bom",
  "perf_employees",
  "documents",
  "orders",
  "order_items",
  "inventory_transactions",
  "payment_transactions",
  "journal_entries",
  "journal_lines"
] as const;

export function BackupTab() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importStrategy, setImportStrategy] = useState<"merge" | "overwrite">("merge");
  
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleResetDemoData = () => {
    resetLocalDemoData();
    queryClient.invalidateQueries();
    toast({ title: "Đã reset dữ liệu demo", description: "Tải lại trang để thấy dữ liệu mới (Nhà In Nhỏ)." });
    setTimeout(() => window.location.reload(), 600);
  };

  const exportTable = async (tableName: string) => {
    if (isLocalDemoAuthEnabled()) {
      const localKey = `erp-mini-local-demo-${tableName}`;
      const raw = localStorage.getItem(localKey);
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(`Failed to parse local storage for ${tableName}:`, e);
        return [];
      }
    }

    if (!companyId) return [];

    try {
      const tablesWithCompanyId = [
        "partners",
        "products",
        "perf_employees",
        "documents",
        "orders",
        "payment_transactions",
        "journal_entries"
      ];

      if (tablesWithCompanyId.includes(tableName)) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select("*")
          .eq("company_id", companyId)
          .limit(10000);
        if (error) throw error;
        return data || [];
      }

      if (tableName === "order_items") {
        const { data: orders } = await supabase.from("orders").select("id").eq("company_id", companyId);
        const orderIds = orders?.map(o => o.id) || [];
        if (orderIds.length === 0) return [];
        const { data, error } = await supabase.from("order_items").select("*").in("order_id", orderIds).limit(10000);
        if (error) throw error;
        return data || [];
      }

      if (tableName === "warehouse_stock") {
        const { data: products } = await supabase.from("products").select("id").eq("company_id", companyId);
        const productIds = products?.map(p => p.id) || [];
        if (productIds.length === 0) return [];
        const { data, error } = await supabase.from("warehouse_stock").select("*").in("product_id", productIds).limit(10000);
        if (error) throw error;
        return data || [];
      }

      if (tableName === "product_bom") {
        const { data: products } = await supabase.from("products").select("id").eq("company_id", companyId);
        const productIds = products?.map(p => p.id) || [];
        if (productIds.length === 0) return [];
        const { data, error } = await supabase.from("product_bom").select("*").in("product_id", productIds).limit(10000);
        if (error) throw error;
        return data || [];
      }

      if (tableName === "inventory_transactions") {
        const { data: products } = await supabase.from("products").select("id").eq("company_id", companyId);
        const productIds = products?.map(p => p.id) || [];
        if (productIds.length === 0) return [];
        const { data, error } = await supabase.from("inventory_transactions").select("*").in("product_id", productIds).limit(10000);
        if (error) throw error;
        return data || [];
      }

      if (tableName === "journal_lines") {
        const { data: entries } = await supabase.from("journal_entries").select("id").eq("company_id", companyId);
        const entryIds = entries?.map(e => e.id) || [];
        if (entryIds.length === 0) return [];
        const { data, error } = await supabase.from("journal_lines").select("*").in("entry_id", entryIds).limit(10000);
        if (error) throw error;
        return data || [];
      }

      return [];
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
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const isDemo = isLocalDemoAuthEnabled();
      
      const tablesToExport = isDemo ? LOCAL_EXPORT_KEYS : SUPABASE_EXPORT_KEYS;
      const allData: Record<string, any> = {
        exported_at: new Date().toISOString(),
        company_id: companyId,
        is_demo: isDemo,
      };
      
      for (const key of tablesToExport) {
        allData[key] = await exportTable(key);
      }
      
      const prefix = isDemo ? "demo_backup" : "full_backup";
      downloadJSON(allData, `${prefix}_${timestamp}.json`);
      toast({ 
        title: "Xuất toàn bộ thành công", 
        description: isDemo 
          ? "Đã xuất tất cả dữ liệu demo từ localStorage" 
          : "Đã xuất tất cả dữ liệu công ty từ database Cloud" 
      });
    } catch (err) {
      console.error("Export all failed:", err);
      toast({ title: "Lỗi xuất dữ liệu", variant: "destructive" });
    } finally {
      setExportingAll(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (importing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        await processImportFile(file);
      } else {
        toast({ title: "Định dạng file không hợp lệ", description: "Vui lòng chọn file JSON.", variant: "destructive" });
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (importing) return;
    if (e.target.files && e.target.files[0]) {
      await processImportFile(e.target.files[0]);
    }
  };

  const processImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      if (isLocalDemoAuthEnabled()) {
        await handleLocalImport(backupData);
      } else {
        await handleSupabaseImport(backupData);
      }
    } catch (err: any) {
      console.error("Import failed:", err);
      toast({ 
        title: "Khôi phục thất bại", 
        description: err.message || "Không thể phân tích hoặc xử lý file sao lưu.", 
        variant: "destructive" 
      });
    } finally {
      setImporting(false);
    }
  };

  const runAuditAndPostRestore = async () => {
    try {
      const report = await runSystemDataAudit(companyId);
      toast({
        title: "Khôi phục dữ liệu thành công!",
        description: `Điểm sức khỏe dữ liệu: ${report.score}% (Cảnh báo: ${report.warningCount}, Lỗi: ${report.errorCount})`,
      });
    } catch (auditErr: any) {
      console.error("Audit failed after restore:", auditErr);
      toast({
        title: "Khôi phục dữ liệu thành công!",
        description: "Không thể đối soát tự động, nhưng dữ liệu đã được lưu.",
      });
    }
    
    queryClient.invalidateQueries();
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleLocalImport = async (backupData: any) => {
    if (importStrategy === "overwrite") {
      resetLocalDemoData();
    }
    
    let importedKeysCount = 0;
    for (const key of LOCAL_EXPORT_KEYS) {
      if (backupData[key] && Array.isArray(backupData[key])) {
        const incomingRows = backupData[key];
        const localKey = `erp-mini-local-demo-${key}`;
        
        let finalRows = incomingRows;
        if (importStrategy === "merge") {
          const rawExisting = localStorage.getItem(localKey);
          let existingRows: any[] = [];
          if (rawExisting) {
            try {
              existingRows = JSON.parse(rawExisting);
            } catch (e) {
              console.error(`Failed to parse existing local storage for ${key}`, e);
            }
          }
          
          const merged = [...existingRows];
          for (const row of incomingRows) {
            const index = merged.findIndex((r: any) => r.id === row.id);
            if (index !== -1) {
              merged[index] = row;
            } else {
              merged.push(row);
            }
          }
          finalRows = merged;
        }
        
        localStorage.setItem(localKey, JSON.stringify(finalRows));
        importedKeysCount++;
      }
    }
    
    if (importedKeysCount === 0) {
      throw new Error("File sao lưu không chứa các bảng dữ liệu demo hợp lệ.");
    }
    
    await runAuditAndPostRestore();
  };

  const handleSupabaseImport = async (backupData: any) => {
    if (!companyId) {
      throw new Error("Không có ngữ cảnh công ty hiện tại.");
    }
    
    if (importStrategy === "overwrite") {
      const [productsRes, ordersRes, entriesRes] = await Promise.all([
        supabase.from("products").select("id").eq("company_id", companyId),
        supabase.from("orders").select("id").eq("company_id", companyId),
        supabase.from("journal_entries").select("id").eq("company_id", companyId),
      ]);
      
      const productIds = productsRes.data?.map(p => p.id) || [];
      const orderIds = ordersRes.data?.map(o => o.id) || [];
      const entryIds = entriesRes.data?.map(e => e.id) || [];
      
      const checkError = (result: { error: any }) => {
        if (result.error) throw result.error;
      };
      
      // Delete in reverse dependency order:
      // 1. payment_transactions
      checkError(await supabase.from("payment_transactions").delete().eq("company_id", companyId));
      
      // 2. inventory_transactions
      if (productIds.length > 0) {
        checkError(await supabase.from("inventory_transactions").delete().in("product_id", productIds));
      }
      
      // 3. order_items
      if (orderIds.length > 0) {
        checkError(await supabase.from("order_items").delete().in("order_id", orderIds));
      }
      
      // 4. orders
      checkError(await supabase.from("orders").delete().eq("company_id", companyId));
      
      // 5. journal_lines
      if (entryIds.length > 0) {
        checkError(await supabase.from("journal_lines").delete().in("entry_id", entryIds));
      }
      
      // 6. journal_entries
      checkError(await supabase.from("journal_entries").delete().eq("company_id", companyId));
      
      // 7. product_bom
      if (productIds.length > 0) {
        checkError(await supabase.from("product_bom").delete().in("product_id", productIds));
      }
      
      // 8. warehouse_stock
      if (productIds.length > 0) {
        checkError(await supabase.from("warehouse_stock").delete().in("product_id", productIds));
      }
      
      // 9. products
      checkError(await supabase.from("products").delete().eq("company_id", companyId));
      
      // 10. partners
      checkError(await supabase.from("partners").delete().eq("company_id", companyId));
      
      // 11. perf_employees
      checkError(await supabase.from("perf_employees").delete().eq("company_id", companyId));
      
      // 12. documents
      checkError(await supabase.from("documents").delete().eq("company_id", companyId));
    }
    
    const partners = backupData.partners || [];
    const products = backupData.products || [];
    const warehouse_stock = backupData.warehouse_stock || [];
    const product_bom = backupData.product_bom || [];
    const perf_employees = backupData.perf_employees || [];
    const documents = backupData.documents || [];
    const orders = backupData.orders || [];
    
    const order_items = backupData.order_items || [];
    orders.forEach((order: any) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          if (!order_items.some((x: any) => x.id === item.id)) {
            order_items.push({
              ...item,
              order_id: order.id
            });
          }
        });
      }
    });
    
    const inventory_transactions = backupData.inventory_transactions || [];
    const payment_transactions = backupData.payment_transactions || [];
    const journal_entries = backupData.journal_entries || [];
    
    const journal_lines = backupData.journal_lines || [];
    journal_entries.forEach((entry: any) => {
      if (entry.journal_lines && Array.isArray(entry.journal_lines)) {
        entry.journal_lines.forEach((line: any) => {
          if (!journal_lines.some((x: any) => x.id === line.id)) {
            journal_lines.push({
              ...line,
              entry_id: entry.id
            });
          }
        });
      }
    });
    
    const tablesToInsert = [
      { name: "partners", rows: partners },
      { name: "products", rows: products },
      { name: "warehouse_stock", rows: warehouse_stock },
      { name: "product_bom", rows: product_bom },
      { name: "perf_employees", rows: perf_employees },
      { name: "documents", rows: documents },
      { name: "orders", rows: orders },
      { name: "order_items", rows: order_items },
      { name: "inventory_transactions", rows: inventory_transactions },
      { name: "payment_transactions", rows: payment_transactions },
      { name: "journal_entries", rows: journal_entries },
      { name: "journal_lines", rows: journal_lines },
    ];
    
    const tablesWithCompanyId = [
      "partners",
      "products",
      "perf_employees",
      "documents",
      "orders",
      "payment_transactions",
      "journal_entries"
    ];
    
    for (const table of tablesToInsert) {
      if (table.rows.length === 0) continue;
      
      const cleanedRows = table.rows.map((row: any) => {
        const cleaned = { ...row };
        for (const key of Object.keys(cleaned)) {
          if (cleaned[key] !== null && typeof cleaned[key] === "object") {
            delete cleaned[key];
          }
        }
        if (tablesWithCompanyId.includes(table.name)) {
          cleaned.company_id = companyId;
        } else {
          delete cleaned.company_id;
        }
        return cleaned;
      });
      
      const { error } = await supabase
        .from(table.name as any)
        .upsert(cleanedRows, { onConflict: "id" });
        
      if (error) {
        console.error(`Failed to upsert to ${table.name}:`, error);
        throw error;
      }
    }
    
    await runAuditAndPostRestore();
  };

  const tablesToShow = EXPORT_TABLES.filter(t => {
    if (isLocalDemoAuthEnabled()) {
      return t.key !== "order_items";
    }
    return true;
  });

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
            {tablesToShow.map(table => (
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
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Khôi phục & Nhập dữ liệu
          </CardTitle>
          <CardDescription>
            Khôi phục dữ liệu từ file JSON sao lưu. Chọn phương thức gộp hoặc ghi đè.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phương thức khôi phục</label>
            <Select
              value={importStrategy}
              onValueChange={(val: "merge" | "overwrite") => setImportStrategy(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">Gộp dữ liệu (Merge)</SelectItem>
                <SelectItem value="overwrite">Ghi đè hoàn toàn (Overwrite)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("backup-file-input")?.click()}
          >
            <input
              type="file"
              id="backup-file-input"
              className="hidden"
              accept=".json"
              onChange={handleFileChange}
              disabled={importing}
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              {importing ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-sm font-medium">
                {importing ? "Đang xử lý khôi phục dữ liệu..." : "Nhấp hoặc kéo thả file JSON vào đây để khôi phục"}
              </div>
              <p className="text-xs text-muted-foreground">Chỉ chấp nhận file .json</p>
            </div>
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

      {isLocalDemoAuthEnabled() && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <RotateCcw className="h-5 w-5" />
              Reset dữ liệu demo
            </CardTitle>
            <CardDescription>
              Xóa toàn bộ dữ liệu demo hiện tại và nạp lại dữ liệu mẫu &quot;Nhà In Nhỏ&quot; (sản phẩm, đơn hàng, kênh bán). Hành động này không thể hoàn tác.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleResetDemoData} className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset dữ liệu → Nhà In Nhỏ
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

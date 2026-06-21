import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Download, X, PackageSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/useOrders";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { resolveSkus, type SkuResolutionResult } from "@/lib/skuResolution";
import {
  type ParsedRow,
  autoMapHeaders,
  parseRowsWithMapping,
} from "@/lib/importUtils";

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportOrdersDialog({ open, onOpenChange }: ImportOrdersDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "result">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<number, keyof ParsedRow>>({});
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [skuResult, setSkuResult] = useState<SkuResolutionResult | null>(null);
  const [skuResolving, setSkuResolving] = useState(false);
  const { toast } = useToast();
  const { createOrder } = useOrders();
  const { channels } = useSalesChannels();
  const { warehouses } = useWarehouses();
  const { companyId } = useCompanyContext();

  const reset = useCallback(() => {
    setStep("upload");
    setParsedRows([]);
    setHeaderMapping({});
    setRawHeaders([]);
    setImportResult(null);
    setProgress(0);
    setFileName("");
    setSkuResult(null);
    setSkuResolving(false);
  }, []);

  // Resolve SKUs when preview step is entered
  const handleResolveSkus = async () => {
    if (!companyId || skuResolving) return;
    setSkuResolving(true);
    try {
      const skus = parsedRows
        .map((r) => r.product_sku)
        .filter((s): s is string => !!s);
      if (skus.length > 0) {
        const result = await resolveSkus(companyId, skus);
        setSkuResult(result);
        if (result.unresolved.length > 0) {
          toast({
            title: "SKU chưa khớp",
            description: `${result.unresolved.length} SKU không tìm thấy sản phẩm tương ứng`,
          });
        } else {
          toast({
            title: "SKU đã khớp hoàn toàn",
            description: `${result.resolved.length} SKU đã được ánh xạ thành công`,
          });
        }
      }
    } catch {
      toast({ variant: "destructive", title: "Lỗi phân giải SKU" });
    } finally {
      setSkuResolving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      // Dynamic import xlsx to avoid bundle bloat
      const XLSX = await import("@e965/xlsx");

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      if (jsonData.length < 2) {
        toast({ variant: "destructive", title: "File rỗng", description: "File cần ít nhất 1 dòng header và 1 dòng dữ liệu." });
        return;
      }

      const headers = (jsonData[0] as any[]).map(String);
      setRawHeaders(headers);

      // Auto-map columns
      const mapping = autoMapHeaders(headers);
      setHeaderMapping(mapping);

      // Parse rows
      const rows = parseRowsWithMapping(jsonData, mapping);

      setParsedRows(rows);
      setStep("preview");

      // Auto-resolve SKUs after parsing
      if (companyId) {
        const skusInFile = rows.map((r) => r.product_sku).filter(Boolean) as string[];
        if (skusInFile.length > 0) {
          resolveSkus(companyId, skusInFile)
            .then((result) => setSkuResult(result))
            .catch(() => {});
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Lỗi đọc file", description: String(err) });
    }

    // Reset input
    e.target.value = "";
  };

  const handleImport = async () => {
    setStep("importing");
    const result: ImportResult = { total: parsedRows.length, success: 0, failed: 0, errors: [] };

    // Group rows by order_number to batch items per order
    const orderGroups = new Map<string, ParsedRow[]>();
    parsedRows.forEach((row, idx) => {
      const key = row.order_number || `import-${Date.now()}-${idx}`;
      if (!orderGroups.has(key)) {
        orderGroups.set(key, []);
      }
      orderGroups.get(key)!.push(row);
    });

    const totalGroups = orderGroups.size;
    let processed = 0;

    for (const [orderKey, rows] of orderGroups) {
      try {
        const firstRow = rows[0];

        // Resolve channel
        let channelId = "";
        if (firstRow.channel_name) {
          const ch = channels.find(
            c => c.name.toLowerCase().includes(firstRow.channel_name!.toLowerCase())
          );
          if (ch) channelId = ch.id;
        }
        if (!channelId && channels.length > 0) {
          channelId = channels[0].id;
        }

        // Resolve warehouse
        let warehouseId = "";
        if (firstRow.warehouse_name) {
          const wh = warehouses.find(
            w => w.name.toLowerCase().includes(firstRow.warehouse_name!.toLowerCase())
          );
          if (wh) warehouseId = wh.id;
        }

        const orderNumber = firstRow.order_number || `IMP-${Date.now()}-${processed}`;

        await createOrder.mutateAsync({
          order: {
            order_number: orderNumber,
            platform_order_id: firstRow.platform_order_id || null,
            channel_id: channelId || null,
            source_type: firstRow.platform_order_id ? "platform" : "manual",
            order_type: "b2c",
            customer_name: firstRow.customer_name || null,
            customer_phone: firstRow.customer_phone || null,
            customer_address: firstRow.customer_address || null,
            shipping_address: firstRow.shipping_address || firstRow.customer_address || null,
            payment_method: firstRow.payment_method || "cod",
            warehouse_id: warehouseId || null,
            notes: firstRow.notes || `Import từ file: ${fileName}`,
            status: "pending",
            subtotal: rows.reduce((s, r) => s + (r.quantity || 1) * (r.unit_price || 0), 0),
            total: rows.reduce((s, r) => s + (r.quantity || 1) * (r.unit_price || 0), 0),
          },
          items: rows
            .filter(r => r.product_sku || r.product_name)
            .map(r => {
              // Resolve SKU to product_id using pre-computed resolution
              let productId = "";
              if (r.product_sku && skuResult) {
                const match = skuResult.resolved.find(
                  (m) => m.sku === r.product_sku || m.sku.toLowerCase() === r.product_sku!.toLowerCase()
                );
                if (match) productId = match.product_id;
              }
              return {
                product_id: productId,
                quantity: r.quantity || 1,
                unit_price: r.unit_price || 0,
                discount: 0,
                total: (r.quantity || 1) * (r.unit_price || 0),
              };
            }),
        });
        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push(`Đơn ${orderKey}: ${err instanceof Error ? err.message : String(err)}`);
      }

      processed++;
      setProgress(Math.round((processed / totalGroups) * 100));
    }

    setImportResult(result);
    setStep("result");
  };

  const downloadTemplate = () => {
    const headers = [
      "Mã đơn", "Tên khách", "Số điện thoại", "Địa chỉ",
      "Địa chỉ giao", "Mã sản phẩm", "Tên sản phẩm",
      "Số lượng", "Đơn giá", "Thanh toán", "Ghi chú",
      "Kênh", "Kho", "Mã đơn sàn"
    ];
    const sampleRow = [
      "ORD-001", "Nguyễn Văn A", "0901234567", "123 Nguyễn Huệ, Q1, TP.HCM",
      "123 Nguyễn Huệ, Q1, TP.HCM", "SKU001", "Áo thun trắng",
      "2", "150000", "cod", "Giao nhanh",
      "Shopee", "Kho chính", "SP-12345"
    ];

    const csv = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-lg shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Import đơn hàng từ file
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">Kéo thả file hoặc nhấn để chọn</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hỗ trợ: .csv, .xlsx, .xls
                </p>
              </div>
              <label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="default" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Chọn file
                  </span>
                </Button>
              </label>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Chưa có template?</p>
                <p className="text-xs text-muted-foreground">
                  Tải file mẫu để bắt đầu nhập liệu nhanh
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Tải template CSV
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{fileName}</Badge>
                <span className="text-sm text-muted-foreground">
                  {parsedRows.length} dòng dữ liệu
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4 mr-1" /> Chọn file khác
              </Button>
            </div>

            {/* Column mapping info */}
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Tự động nhận diện cột:</strong>{" "}
                {Object.values(headerMapping).length}/{rawHeaders.length} cột đã map.
                Các cột không nhận diện được sẽ bị bỏ qua.
              </AlertDescription>
            </Alert>

            {/* SKU Resolution Status */}
            {skuResult && (
              <Alert variant={skuResult.unresolved.length > 0 ? "destructive" : "default"}>
                <PackageSearch className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Phân giải SKU:</strong>{" "}
                  {skuResult.resolved.length} khớp
                  {skuResult.unresolved.length > 0 && (
                    <>, <span className="text-destructive font-medium">{skuResult.unresolved.length} không tìm thấy</span>
                    {" "}({skuResult.unresolved.slice(0, 5).join(", ")}{skuResult.unresolved.length > 5 ? "..." : ""})
                    </>
                  )}
                  {skuResult.resolved.filter((r) => r.match_type !== "exact_sku").length > 0 && (
                    <>, {skuResult.resolved.filter((r) => r.match_type !== "exact_sku").length} khớp gần đúng</>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {!skuResult && parsedRows.some((r) => r.product_sku) && (
              <Button variant="outline" size="sm" onClick={handleResolveSkus} disabled={skuResolving}>
                {skuResolving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PackageSearch className="h-4 w-4 mr-2" />}
                Phân giải SKU
              </Button>
            )}

            {/* Data preview */}
            <div className="border rounded-lg overflow-x-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    {rawHeaders.map((h, idx) => (
                      <TableHead key={idx} className="min-w-[120px]">
                        <div>
                          <span className="text-xs text-muted-foreground">{h}</span>
                          {headerMapping[idx] && (
                            <Badge variant="outline" className="ml-1 text-[10px]">
                              → {headerMapping[idx]}
                            </Badge>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 10).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                      {rawHeaders.map((_, colIdx) => {
                        const field = headerMapping[colIdx];
                        const value = field ? (row as any)[field] : undefined;
                        return (
                          <TableCell key={colIdx} className="text-sm">
                            {value !== undefined ? String(value) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRows.length > 10 && (
                <div className="text-center text-xs text-muted-foreground py-2 border-t">
                  ... và {parsedRows.length - 10} dòng nữa
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={reset}>Hủy</Button>
              <Button onClick={handleImport} disabled={parsedRows.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Import {parsedRows.length} dòng
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-6 py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium">Đang import đơn hàng...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vui lòng không đóng cửa sổ này
              </p>
            </div>
            <div className="w-full max-w-md">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && importResult && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              {importResult.failed === 0 ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-orange-500" />
              )}
              <div className="text-center">
                <p className="text-xl font-semibold">
                  Import hoàn tất
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importResult.success}/{importResult.total} đơn hàng thành công
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary/30 rounded-lg">
                <p className="text-2xl font-bold">{importResult.total}</p>
                <p className="text-xs text-muted-foreground">Tổng</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                <p className="text-xs text-muted-foreground">Thành công</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                <p className="text-xs text-muted-foreground">Lỗi</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {importResult.errors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>... và {importResult.errors.length - 10} lỗi khác</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={() => { reset(); onOpenChange(false); }}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

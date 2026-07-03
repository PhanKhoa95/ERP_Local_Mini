import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (orders: ImportedOrder[]) => void;
  isLoading?: boolean;
}

interface ParsedRow {
  row_number: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product_sku: string;
  quantity: number;
  notes: string;
  // validation
  errors: string[];
  product_id?: string;
  product_name?: string;
  unit_price?: number;
}

export interface ImportedOrder {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: Array<{
    product_id: string;
    product_sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  notes: string;
}

export function ImportOrdersDialog({ open, onOpenChange, onImport, isLoading }: ImportOrdersDialogProps) {
  const { products } = useProducts();
  const { toast } = useToast();

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const handleDownloadTemplate = () => {
    // Generate CSV template (Excel-compatible)
    const headers = ["Tên khách hàng", "Số điện thoại", "Địa chỉ giao hàng", "Mã sản phẩm (SKU)", "Số lượng", "Ghi chú"];
    const sampleData = [
      ["Nguyễn Văn A", "0901234567", "123 Nguyễn Huệ, Q.1, HCM", "SP-001", "2", "Giao trước 5h"],
      ["Trần Thị B", "0912345678", "456 Lê Lợi, Q.3, HCM", "SP-002", "1", ""],
    ];

    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "mau_nhap_don_hang.csv";
    link.click();
    URL.revokeObjectURL(link.href);

    toast({ title: "Đã tải file mẫu", description: "Mở file CSV bằng Excel, điền dữ liệu rồi upload lại." });
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      // Simple CSV parse (handles quoted fields)
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          cells.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      cells.push(current.trim());
      rows.push(cells);
    }
    return rows;
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);

      if (rows.length < 2) {
        toast({ title: "File rỗng", description: "File không có dữ liệu hoặc chỉ có header.", variant: "destructive" });
        return;
      }

      // Skip header row
      const dataRows = rows.slice(1);

      const parsed: ParsedRow[] = dataRows.map((cells, idx) => {
        const errors: string[] = [];

        const customerName = cells[0] || "";
        const customerPhone = cells[1] || "";
        const customerAddress = cells[2] || "";
        const productSku = cells[3] || "";
        const quantity = parseInt(cells[4] || "0", 10);
        const notes = cells[5] || "";

        if (!customerName && !customerPhone) {
          errors.push("Thiếu tên KH hoặc SĐT");
        }
        if (!productSku) {
          errors.push("Thiếu mã SKU");
        }
        if (!quantity || quantity <= 0) {
          errors.push("Số lượng không hợp lệ");
        }

        // Validate SKU
        let product_id: string | undefined;
        let product_name: string | undefined;
        let unit_price: number | undefined;

        if (productSku) {
          const found = products.find(
            p => p.sku?.toLowerCase() === productSku.toLowerCase()
          );
          if (found) {
            product_id = found.id;
            product_name = found.name;
            unit_price = Number(found.selling_price) || 0;
          } else {
            errors.push(`SKU "${productSku}" không tồn tại`);
          }
        }

        return {
          row_number: idx + 2,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          product_sku: productSku,
          quantity,
          notes,
          errors,
          product_id,
          product_name,
          unit_price,
        };
      });

      setParsedRows(parsed);
      setStep("preview");
    };

    reader.readAsText(file, "utf-8");
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }, [products, toast]);

  const validRows = parsedRows.filter(r => r.errors.length === 0);
  const errorRows = parsedRows.filter(r => r.errors.length > 0);

  const handleImport = () => {
    // Group valid rows by customer (name + phone)
    const grouped: Record<string, ImportedOrder> = {};

    validRows.forEach(row => {
      const key = `${row.customer_name}||${row.customer_phone}`;
      if (!grouped[key]) {
        grouped[key] = {
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          customer_address: row.customer_address,
          items: [],
          notes: row.notes,
        };
      }
      if (row.product_id) {
        grouped[key].items.push({
          product_id: row.product_id,
          product_sku: row.product_sku,
          product_name: row.product_name || "",
          quantity: row.quantity,
          unit_price: row.unit_price || 0,
          total: row.quantity * (row.unit_price || 0),
        });
      }
      if (row.notes && !grouped[key].notes.includes(row.notes)) {
        grouped[key].notes = [grouped[key].notes, row.notes].filter(Boolean).join("; ");
      }
    });

    const orders = Object.values(grouped);
    onImport(orders);
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName("");
    setStep("upload");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Nhập đơn hàng từ Excel / CSV
          </DialogTitle>
          <DialogDescription>
            Tải file mẫu, điền dữ liệu, sau đó upload lại để tạo đơn hàng hàng loạt.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            {/* Step 1: Download template */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">Bước 1: Tải file mẫu</h3>
              <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                <Download className="h-4 w-4" /> Tải file mẫu (.csv)
              </Button>
              <p className="text-xs text-muted-foreground">
                File mẫu gồm các cột: Tên KH, SĐT, Địa chỉ, SKU sản phẩm, Số lượng, Ghi chú.
                Mở bằng Excel hoặc Google Sheets để điền dữ liệu.
              </p>
            </div>

            {/* Step 2: Upload */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">Bước 2: Upload file đã điền</h3>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">
                  Kéo thả hoặc nhấn để chọn file CSV / Excel
                </span>
                <span className="text-xs text-muted-foreground mt-1">Hỗ trợ: .csv</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" /> {fileName}
                </Badge>
                <Badge variant="default" className="bg-emerald-600">
                  {validRows.length} dòng hợp lệ
                </Badge>
                {errorRows.length > 0 && (
                  <Badge variant="destructive">
                    {errorRows.length} lỗi
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
                <X className="h-3 w-3" /> Upload lại
              </Button>
            </div>

            {errorRows.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{errorRows.length} dòng có lỗi</strong> sẽ bị bỏ qua khi nhập.
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-[400px] overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs w-12">Dòng</TableHead>
                    <TableHead className="text-xs">Khách hàng</TableHead>
                    <TableHead className="text-xs">SĐT</TableHead>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">Sản phẩm</TableHead>
                    <TableHead className="text-xs text-right">SL</TableHead>
                    <TableHead className="text-xs text-right">Đơn giá</TableHead>
                    <TableHead className="text-xs w-16">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={row.errors.length > 0 ? "bg-red-50/50" : "hover:bg-muted/10"}
                    >
                      <TableCell className="text-xs text-muted-foreground">{row.row_number}</TableCell>
                      <TableCell className="text-xs font-medium">{row.customer_name || "—"}</TableCell>
                      <TableCell className="text-xs">{row.customer_phone || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{row.product_sku || "—"}</TableCell>
                      <TableCell className="text-xs">{row.product_name || "—"}</TableCell>
                      <TableCell className="text-xs text-right">{row.quantity}</TableCell>
                      <TableCell className="text-xs text-right">
                        {row.unit_price ? `${row.unit_price.toLocaleString("vi-VN")}đ` : "—"}
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {row.errors.map((err, eIdx) => (
                              <span key={eIdx} className="text-[10px] text-destructive">{err}</span>
                            ))}
                          </div>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === "preview" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || validRows.length === 0}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Nhập {validRows.length} đơn hàng
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

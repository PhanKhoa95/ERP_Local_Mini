import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { exportRowsToExcel, readFirstWorksheetRows } from "@/lib/excel";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { upsertLocalProducts } from "@/lib/localInventoryStore";

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportRow {
  sku: string;
  name: string;
  category?: string;
  unit?: string;
  cost_price?: number;
  selling_price?: number;
  stock_quantity?: number;
  min_stock?: number;
  description?: string;
  isValid: boolean;
  errors: string[];
}

function readImportValue(row: Record<string, unknown>, keys: string[], fallback: unknown = 0) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function parseImportNumber(row: Record<string, unknown>, keys: string[]) {
  return Number(readImportValue(row, keys, 0));
}

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

  const downloadTemplate = async () => {
    const template = [
      {
        SKU: "SP001",
        "Tên sản phẩm": "Sản phẩm mẫu 1",
        "Danh mục": "Danh mục A",
        "Đơn vị": "cái",
        "Giá nhập": 100000,
        "Giá bán": 150000,
        "Tồn kho": 50,
        "Tồn tối thiểu": 10,
        "Mô tả": "Mô tả sản phẩm",
      },
      {
        SKU: "SP002",
        "Tên sản phẩm": "Sản phẩm mẫu 2",
        "Danh mục": "Danh mục B",
        "Đơn vị": "hộp",
        "Giá nhập": 200000,
        "Giá bán": 280000,
        "Tồn kho": 30,
        "Tồn tối thiểu": 5,
        "Mô tả": "",
      },
    ];

    await exportRowsToExcel(template, "Sản phẩm", "mau_import_san_pham.xlsx", [
      { header: "SKU", width: 12 },
      { header: "Tên sản phẩm", width: 25 },
      { header: "Danh mục", width: 15 },
      { header: "Đơn vị", width: 10 },
      { header: "Giá nhập", width: 12 },
      { header: "Giá bán", width: 12 },
      { header: "Tồn kho", width: 10 },
      { header: "Tồn tối thiểu", width: 12 },
      { header: "Mô tả", width: 30 },
    ]);
    toast({ title: "Đã tải file mẫu" });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    void parseImportFile(file);
  };

  const parseImportFile = async (file: File) => {
    try {
      const jsonData = await readFirstWorksheetRows(file);

      const parsedData: ImportRow[] = jsonData.map((row: any) => {
        const errors: string[] = [];
        const sku = String(row["SKU"] || row["sku"] || "").trim();
        const name = String(row["Tên sản phẩm"] || row["name"] || "").trim();
        const cost_price = parseImportNumber(row, ["Giá nhập", "cost_price"]);
        const selling_price = parseImportNumber(row, ["Giá bán", "selling_price"]);
        const stock_quantity = parseImportNumber(row, ["Tồn kho", "stock_quantity"]);
        const min_stock = parseImportNumber(row, ["Tồn tối thiểu", "min_stock"]);

        if (!sku) errors.push("Thiếu SKU");
        if (!name) errors.push("Thiếu tên sản phẩm");
        [
          ["Giá nhập", cost_price],
          ["Giá bán", selling_price],
          ["Tồn kho", stock_quantity],
          ["Tồn tối thiểu", min_stock],
        ].forEach(([label, value]) => {
          if (!Number.isFinite(value as number)) errors.push(`${label} không hợp lệ`);
          else if ((value as number) < 0) errors.push(`${label} phải >= 0`);
        });

        return {
          sku,
          name,
          category: String(row["Danh mục"] || row["category"] || "").trim() || undefined,
          unit: String(row["Đơn vị"] || row["unit"] || "cái").trim(),
          cost_price,
          selling_price,
          stock_quantity,
          min_stock,
          description: String(row["Mô tả"] || row["description"] || "").trim() || undefined,
          isValid: errors.length === 0,
          errors,
        };
      });

      setImportData(parsedData);
      setStep("preview");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi đọc file",
        description: "Vui lòng kiểm tra định dạng file Excel",
      });
    }
  };

  const handleImport = async () => {
    const validRows = importData.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast({ variant: "destructive", title: "Không có dữ liệu hợp lệ để import" });
      return;
    }

    setIsImporting(true);
    try {
      if (!companyId) throw new Error("Khong tim thay cong ty");

      const products = validRows.map((row) => ({
        sku: row.sku,
        name: row.name,
        category: row.category,
        unit: row.unit || "cái",
        cost_price: row.cost_price || 0,
        selling_price: row.selling_price || 0,
        stock_quantity: row.stock_quantity || 0,
        min_stock: row.min_stock || 0,
        description: row.description,
        company_id: companyId,
      }));

      if (isLocalDemoAuthEnabled()) {
        const result = upsertLocalProducts(products, companyId);
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast({
          title: `Import local thanh cong ${result.total} san pham`,
          description: `${result.created} them moi, ${result.updated} cap nhat`,
        });
        setStep("done");
        return;
      }

      const { error } = await supabase.from("products").insert(products);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: `Import thành công ${validRows.length} sản phẩm` });
      setStep("done");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi import",
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setImportData([]);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const validCount = importData.filter((r) => r.isValid).length;
  const invalidCount = importData.filter((r) => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import sản phẩm từ Excel</DialogTitle>
          <DialogDescription>
            Tải lên file Excel để thêm nhiều sản phẩm cùng lúc
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Kéo thả file Excel hoặc click để chọn file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Chọn file
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Tải file mẫu</p>
                <p className="text-sm text-muted-foreground">
                  File Excel mẫu với đầy đủ các cột cần thiết
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Tải mẫu
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {validCount} hợp lệ
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {invalidCount} lỗi
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="p-2 text-left text-sm font-medium text-muted-foreground">Trạng thái</th>
                    <th className="p-2 text-left text-sm font-medium text-muted-foreground">SKU</th>
                    <th className="p-2 text-left text-sm font-medium text-muted-foreground">Tên</th>
                    <th className="p-2 text-left text-sm font-medium text-muted-foreground">Giá nhập</th>
                    <th className="p-2 text-left text-sm font-medium text-muted-foreground">Giá bán</th>
                    <th className="p-2 text-left text-sm font-medium text-muted-foreground">Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-secondary/30">
                      <td className="p-2">
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">{row.errors.join(", ")}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-sm font-mono">{row.sku}</td>
                      <td className="p-2 text-sm">{row.name}</td>
                      <td className="p-2 text-sm">{row.cost_price?.toLocaleString("vi-VN")}đ</td>
                      <td className="p-2 text-sm">{row.selling_price?.toLocaleString("vi-VN")}đ</td>
                      <td className="p-2 text-sm">{row.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0 || isImporting}>
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import {validCount} sản phẩm
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-success" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Import thành công!</h3>
            <p className="text-muted-foreground mb-6">
              Đã thêm {validCount} sản phẩm vào hệ thống
            </p>
            <Button onClick={handleClose}>Đóng</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

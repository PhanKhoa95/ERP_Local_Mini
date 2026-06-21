import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Users
} from "lucide-react";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

export function EmployeeImporter() {
  const { companyId } = useCompanyContext();
  const { onboarding, updateOnboarding } = usePerformanceOnboarding();
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, show a placeholder message
    toast.info("Chức năng import Excel đang được phát triển. Vui lòng thêm nhân viên thủ công sau khi hoàn tất thiết lập.");
  };

  const handleSkip = async () => {
    await updateOnboarding.mutateAsync({ imported_employees: 0 });
    toast.info("Bạn có thể thêm nhân viên sau trong phần Cài đặt");
  };

  const downloadTemplate = () => {
    const headers = ["Họ tên", "Email", "Số điện thoại", "Phòng ban", "Chức vụ", "Ngày vào làm (YYYY-MM-DD)"];
    const sample = [
      ["Nguyễn Văn A", "nguyenvana@example.com", "0901234567", "Kinh doanh", "Nhân viên", "2024-01-15"],
      ["Trần Thị B", "tranthib@example.com", "0907654321", "Kế toán", "Trưởng phòng", "2023-06-01"],
    ];
    const csv = [headers, ...sample]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    // BOM for Excel UTF-8
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_nhan_vien.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Đã tải template CSV");
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Import danh sách nhân viên từ file Excel hoặc bỏ qua để thêm thủ công sau.
      </p>

      {/* Template download */}
      <Card className="bg-muted/50">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium">Template nhập liệu</p>
              <p className="text-sm text-muted-foreground">
                Tải file mẫu Excel để nhập danh sách nhân viên
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Tải template
          </Button>
        </CardContent>
      </Card>

      {/* Upload area */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
        <input
          type="file"
          id="employee-file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="employee-file" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-medium mb-1">Kéo thả file hoặc click để chọn</p>
          <p className="text-sm text-muted-foreground">
            Hỗ trợ: .xlsx, .xls, .csv
          </p>
        </label>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="flex gap-4">
          <Badge variant="default" className="text-green-700 bg-green-100">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {importResult.success} thành công
          </Badge>
          {importResult.failed > 0 && (
            <Badge variant="destructive">
              <AlertCircle className="h-4 w-4 mr-1" />
              {importResult.failed} lỗi
            </Badge>
          )}
        </div>
      )}

      {/* Current imported count */}
      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">Nhân viên đã thêm</p>
              <p className="text-sm text-muted-foreground">
                Số lượng nhân viên trong hệ thống hiệu suất
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg">
            {onboarding?.imported_employees || 0}
          </Badge>
        </CardContent>
      </Card>

      {/* Skip option */}
      <div className="flex justify-center">
        <Button variant="ghost" onClick={handleSkip}>
          Bỏ qua bước này, thêm nhân viên sau
        </Button>
      </div>
    </div>
  );
}

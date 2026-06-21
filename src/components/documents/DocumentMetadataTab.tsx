import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Calendar, DollarSign, Building2, User, 
  Tag, Clock, Hash 
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Document } from "@/hooks/useDocuments";

const categoryLabels: Record<string, string> = {
  invoice: "Hóa đơn",
  contract: "Hợp đồng",
  drawing: "Bản vẽ kỹ thuật",
  report: "Báo cáo",
  other: "Khác",
};

const categoryColors: Record<string, string> = {
  invoice: "bg-blue-500/10 text-blue-600 border-blue-200",
  contract: "bg-purple-500/10 text-purple-600 border-purple-200",
  drawing: "bg-orange-500/10 text-orange-600 border-orange-200",
  report: "bg-green-500/10 text-green-600 border-green-200",
  other: "bg-muted text-muted-foreground",
};

interface Props {
  document: Document;
}

export function DocumentMetadataTab({ document }: Props) {
  const metadata = document.extracted_metadata;
  const category = document.category;

  if (!metadata && !category) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="font-medium">Chưa có metadata</p>
        <p className="text-sm">AI sẽ tự động trích xuất khi xử lý tài liệu</p>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency?: string) => {
    const cur = currency || "VND";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: cur }).format(amount);
  };

  return (
    <div className="space-y-4 p-1">
      {/* Category */}
      {category && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-24">Phân loại:</span>
          <Badge variant="outline" className={categoryColors[category] || categoryColors.other}>
            {categoryLabels[category] || category}
          </Badge>
        </div>
      )}

      {/* Expiry date */}
      {document.expiry_date && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Hạn:</span>
          <span className="text-sm font-medium">
            {format(new Date(document.expiry_date), "dd/MM/yyyy", { locale: vi })}
          </span>
          {new Date(document.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
            <Badge variant="destructive" className="text-xs">Sắp hết hạn</Badge>
          )}
        </div>
      )}

      <Separator />

      {/* Extracted metadata */}
      {metadata && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metadata.invoice_number && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Số hóa đơn/chứng từ</p>
                  <p className="font-medium text-sm">{metadata.invoice_number}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {metadata.document_date && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Ngày chứng từ</p>
                  <p className="font-medium text-sm">{metadata.document_date}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {metadata.total_amount != null && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tổng tiền</p>
                  <p className="font-medium text-sm">{formatCurrency(metadata.total_amount, metadata.currency)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {metadata.vendor_name && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Nhà cung cấp</p>
                  <p className="font-medium text-sm">{metadata.vendor_name}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {metadata.customer_name && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Khách hàng</p>
                  <p className="font-medium text-sm">{metadata.customer_name}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary */}
      {metadata?.summary && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Tóm tắt</p>
          <p className="text-sm bg-muted/50 p-3 rounded-lg">{metadata.summary}</p>
        </div>
      )}

      {/* Tags */}
      {metadata?.tags && metadata.tags.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {metadata.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

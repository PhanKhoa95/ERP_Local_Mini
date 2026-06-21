import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, FileText, Clock } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const categoryLabels: Record<string, string> = {
  invoice: "Hóa đơn",
  contract: "Hợp đồng",
  drawing: "Bản vẽ",
  report: "Báo cáo",
  other: "Khác",
};

export function ExpiringDocumentsWidget() {
  const { companyId } = useCompanyContext();
  const { expiringDocuments } = useDocuments(companyId || undefined);

  if (!expiringDocuments || expiringDocuments.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Tài liệu sắp hết hạn ({expiringDocuments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            {expiringDocuments.map((doc) => {
              const daysLeft = Math.ceil(
                (new Date(doc.expiry_date!).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
              );
              const isUrgent = daysLeft <= 7;

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <FileText className={`h-4 w-4 flex-shrink-0 ${isUrgent ? "text-destructive" : "text-warning"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {categoryLabels[doc.category || "other"]}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(doc.expiry_date!), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                  </div>
                  {isUrgent && (
                    <Badge variant="destructive" className="text-xs flex-shrink-0">
                      {daysLeft}d
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

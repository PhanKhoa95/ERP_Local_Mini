import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StrategicReportForm } from "@/components/performance/StrategicReportForm";
import { StrategicReportView } from "@/components/performance/StrategicReportView";
import { useStrategicReports, StrategicReport as SR } from "@/hooks/useStrategicReports";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { FileText, Eye, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Nháp", variant: "secondary" },
  submitted: { label: "Đã gửi", variant: "default" },
  approved: { label: "Phê duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

function ReportRow({ report, onView }: { report: SR; onView: (r: SR) => void }) {
  const status = STATUS_BADGE[report.status] || STATUS_BADGE.draft;
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{report.title}</span>
          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(report.report_date), "dd/MM/yyyy", { locale: vi })}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onView(report)}>
        <Eye className="h-4 w-4 mr-1" /> Xem
      </Button>
    </div>
  );
}

export default function StrategicReportPage() {
  const { role } = useCompanyContext();
  const { myReports, reports, myLoading, isLoading, reviewReport } = useStrategicReports("submitted");
  const [selectedReport, setSelectedReport] = useState<SR | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const isManager = role === "admin" || role === "manager";

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedReport) return;
    setReviewing(true);
    try {
      await reviewReport.mutateAsync({ id: selectedReport.id, status, comment: reviewComment });
      setSelectedReport(null);
      setReviewComment("");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Báo cáo Chiến lược</h1>
        <p className="text-muted-foreground">Soạn và quản lý báo cáo chiến lược theo template chuẩn 5 phần</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Tạo báo cáo</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
          {isManager && <TabsTrigger value="review">Đánh giá</TabsTrigger>}
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <StrategicReportForm />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {myLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : myReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Chưa có báo cáo chiến lược nào</p>
                <p className="text-sm">Chuyển sang tab "Tạo báo cáo" để bắt đầu</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {myReports.map(r => <ReportRow key={r.id} report={r} onView={setSelectedReport} />)}
            </div>
          )}
        </TabsContent>

        {isManager && (
          <TabsContent value="review" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Không có báo cáo nào cần đánh giá</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {reports.map(r => <ReportRow key={r.id} report={r} onView={setSelectedReport} />)}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <StrategicReportView report={selectedReport} />
              {isManager && selectedReport.status === "submitted" && (
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Nhận xét (tùy chọn)..."
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="destructive" onClick={() => handleReview("rejected")} disabled={reviewing}>
                      <XCircle className="h-4 w-4 mr-1" /> Từ chối
                    </Button>
                    <Button onClick={() => handleReview("approved")} disabled={reviewing}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Phê duyệt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

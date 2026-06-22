import { useState } from "react";
import { useWorkReports } from "@/hooks/useWorkReports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, CheckCircle, Clock, AlertTriangle, Eye, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";

export function WorkReportTab() {
  const { reports = [], isLoading } = useWorkReports();
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Đã duyệt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Từ chối</Badge>;
      case "submitted":
        return <Badge variant="default">Chờ duyệt</Badge>;
      case "draft":
      default:
        return <Badge variant="secondary">Bản nháp</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Báo cáo công việc hàng ngày
          </h2>
          <p className="text-muted-foreground text-sm">
            Xem danh sách các báo cáo ngày, báo cáo tuần của bạn và gửi phê duyệt
          </p>
        </div>

        <Link to="/work-report">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Viết báo cáo mới
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Chưa có báo cáo công việc nào</p>
              <p className="text-sm">Hãy nhấn nút "Viết báo cáo mới" để bắt đầu</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày báo cáo</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Số việc hoàn thành</TableHead>
                    <TableHead>Số việc tồn đọng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-muted/30 transition-colors text-sm">
                      <TableCell className="font-semibold flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(r.report_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="capitalize">{r.report_type === "daily" ? "Hàng ngày" : r.report_type}</TableCell>
                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {r.completed_tasks?.length || 0} việc
                      </TableCell>
                      <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                        {r.pending_tasks?.length || 0} việc
                      </TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedReport(r)} className="gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo công việc</DialogTitle>
            <DialogDescription>
              {selectedReport && `Ngày: ${format(new Date(selectedReport.report_date), "dd/MM/yyyy")}`}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-semibold">Trạng thái:</span>
                {getStatusBadge(selectedReport.status)}
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Đã hoàn thành ({selectedReport.completed_tasks?.length || 0})
                  </h4>
                  {(!selectedReport.completed_tasks || selectedReport.completed_tasks.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic pl-5">Không có công việc nào</p>
                  ) : (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {selectedReport.completed_tasks.map((t: any, idx: number) => (
                        <li key={idx}>
                          <span>{t.task}</span>
                          {t.project && (
                            <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">
                              {t.project}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-2">
                  <h4 className="font-semibold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Tồn đọng / Đang làm ({selectedReport.pending_tasks?.length || 0})
                  </h4>
                  {(!selectedReport.pending_tasks || selectedReport.pending_tasks.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic pl-5">Không có công việc nào</p>
                  ) : (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {selectedReport.pending_tasks.map((t: any, idx: number) => (
                        <li key={idx}>
                          <span className={t.isBlocker ? "text-destructive font-medium" : ""}>
                            {t.task}
                          </span>
                          {t.isBlocker && (
                            <Badge variant="destructive" className="ml-1 text-[9px] py-0 px-1">
                              Bị tắc nghẽn
                            </Badge>
                          )}
                          {t.project && (
                            <Badge variant="outline" className="ml-1 text-[9px] py-0 px-1">
                              {t.project}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {selectedReport.review_comment && (
                <div className="p-3 bg-muted/30 border rounded-lg mt-4 text-sm">
                  <div className="font-semibold text-xs text-muted-foreground uppercase mb-1">Ý kiến người duyệt:</div>
                  <div className="italic text-foreground">"{selectedReport.review_comment}"</div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button size="sm" onClick={() => setSelectedReport(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

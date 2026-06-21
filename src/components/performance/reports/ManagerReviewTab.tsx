import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare,
  User,
  CalendarDays,
  Eye,
  Send,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";
import { useReportClassifier } from "@/hooks/useReportClassifier";
import { WbsCheckPanel } from "./WbsCheckPanel";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TeamReport {
  id: string;
  employee_id: string;
  report_type: string;
  report_date: string;
  period_start: string | null;
  period_end: string | null;
  summary: string | null;
  completed_tasks: any[];
  pending_tasks: any[];
  blockers: any[];
  auto_metrics: any;
  status: string;
  submitted_at: string | null;
  review_comment: string | null;
  org_unit_id: string | null;
  wbs_classification?: {
    matched_count: number;
    unmatched_count: number;
    coverage_rate: number;
  } | null;
  perf_employees: {
    id: string;
    title: string | null;
    org_unit_id: string | null;
    profiles: {
      full_name: string | null;
    } | null;
    perf_org_units: {
      evaluation_mode: string;
      name: string;
    } | null;
  } | null;
}

export function ManagerReviewTab() {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("submitted");
  const [filterEvalMode, setFilterEvalMode] = useState("all");
  const [selectedReport, setSelectedReport] = useState<TeamReport | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const { result: wbsResult, classify, acceptSuggestion, clearResult, isClassifying } = useReportClassifier();

  // Fetch team reports for manager
  const { data: teamReports, isLoading } = useQuery({
    queryKey: ["team-reports", employee?.org_unit_id, filterStatus],
    queryFn: async () => {
      if (!employee?.org_unit_id) return [];

      const { data, error } = await supabase
        .from("work_reports")
        .select(`
          *,
          perf_employees!inner(
            id,
            title,
            user_id,
            org_unit_id,
            perf_org_units(evaluation_mode, name)
          )
        `)
        .eq("org_unit_id", employee.org_unit_id)
        .eq("status", filterStatus)
        .order("submitted_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = data?.map(r => r.perf_employees?.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data?.map(report => ({
        ...report,
        perf_employees: report.perf_employees ? {
          ...report.perf_employees,
          profiles: profileMap.get(report.perf_employees.user_id) || null
        } : null
      })) as TeamReport[];
    },
    enabled: !!employee?.org_unit_id,
  });

  // Review mutation
  const reviewReport = useMutation({
    mutationFn: async ({ 
      reportId, 
      status, 
      comment 
    }: { 
      reportId: string; 
      status: "approved" | "rejected"; 
      comment: string;
    }) => {
      const { data, error } = await supabase
        .from("work_reports")
        .update({
          status,
          review_comment: comment,
          reviewed_by: employee?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .select()
        .single();

      if (error) throw error;

      // Send notification to the report owner
      const report = teamReports?.find(r => r.id === reportId);
      if (report?.perf_employees) {
        const empData = report.perf_employees as any;
        const userId = empData.user_id;
        if (userId) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const companyIdVal = companyId;
          
          await supabase.from("rag_notifications").insert({
            user_id: userId,
            company_id: companyIdVal,
            type: status === "approved" ? "report_approved" : "report_rejected",
            title: status === "approved" ? "Báo cáo được duyệt" : "Báo cáo bị từ chối",
            message: comment || (status === "approved" ? "Báo cáo của bạn đã được manager duyệt" : "Báo cáo của bạn cần chỉnh sửa"),
            data: { report_id: reportId, reviewer_id: currentUser?.id },
          });

          // Audit log
          await supabase.from("audit_logs").insert({
            user_id: currentUser?.id,
            action: `report_${status}`,
            table_name: "work_reports",
            record_id: reportId,
            new_data: { status, comment },
          });
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-reports"] });
      toast.success(variables.status === "approved" ? "Đã duyệt báo cáo" : "Đã từ chối báo cáo");
      setSelectedReport(null);
      setReviewComment("");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      submitted: { label: "Chờ duyệt", variant: "secondary" },
      approved: { label: "Đã duyệt", variant: "default" },
      rejected: { label: "Từ chối", variant: "destructive" },
      draft: { label: "Nháp", variant: "outline" },
    };
    const cfg = config[status] || { label: status, variant: "outline" as const };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      monthly: "Hàng tháng",
      seasonal: "Theo kỳ",
    };
    return labels[type] || type;
  };

  if (!employee?.org_unit_id) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Chưa phân công đơn vị</h3>
          <p className="text-muted-foreground text-center">
            Bạn cần được phân công vào đơn vị để quản lý báo cáo team
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duyệt báo cáo Team</h2>
          <p className="text-muted-foreground">
            Xem xét và đánh giá báo cáo của nhân viên
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="submitted" className="gap-2">
            <Clock className="h-4 w-4" />
            Chờ duyệt
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Đã duyệt
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Từ chối
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : teamReports?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {filterStatus === "submitted" 
                ? "Không có báo cáo chờ duyệt" 
                : filterStatus === "approved"
                ? "Chưa có báo cáo đã duyệt"
                : "Không có báo cáo bị từ chối"}
            </h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teamReports?.map((report) => (
            <Card 
              key={report.id} 
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {report.perf_employees?.profiles?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {report.perf_employees?.profiles?.full_name || "N/A"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getReportTypeLabel(report.report_type)}
                        </Badge>
                        {report.perf_employees?.perf_org_units?.evaluation_mode && 
                         report.perf_employees.perf_org_units.evaluation_mode !== "kbif_standard" && (
                          <Badge variant="secondary" className="text-xs">
                            {report.perf_employees.perf_org_units.evaluation_mode === "kbif_qualitative" ? "Định tính" :
                             report.perf_employees.perf_org_units.evaluation_mode === "okr" ? "OKR" : "Kết hợp"}
                          </Badge>
                        )}
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {format(parseISO(report.report_date), "dd/MM/yyyy", { locale: vi })}
                        </span>
                        {report.submitted_at && (
                          <span>
                            Gửi lúc {format(parseISO(report.submitted_at), "HH:mm dd/MM", { locale: vi })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Xem
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {selectedReport.perf_employees?.profiles?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedReport.perf_employees?.profiles?.full_name}</span>
                  {getStatusBadge(selectedReport.status)}
                </DialogTitle>
                <DialogDescription>
                  {getReportTypeLabel(selectedReport.report_type)} - {format(parseISO(selectedReport.report_date), "dd/MM/yyyy", { locale: vi })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Summary */}
                {selectedReport.summary && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tổng quan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedReport.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Auto Metrics */}
                {selectedReport.auto_metrics && Object.keys(selectedReport.auto_metrics).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Số liệu tự động</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 grid-cols-4 text-sm">
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Đơn hàng</p>
                          <p className="font-semibold">{selectedReport.auto_metrics.total_orders || 0}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Hoàn thành</p>
                          <p className="font-semibold">{selectedReport.auto_metrics.completed_orders || 0}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Doanh thu</p>
                          <p className="font-semibold">{(selectedReport.auto_metrics.total_revenue || 0).toLocaleString()}đ</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground">Tỷ lệ</p>
                          <p className="font-semibold">{selectedReport.auto_metrics.conversion_rate || 0}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Completed Tasks */}
                {selectedReport.completed_tasks?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Hoàn thành ({selectedReport.completed_tasks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {selectedReport.completed_tasks.map((task: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 p-1">
                            <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                            {task.text || task}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Pending Tasks */}
                {selectedReport.pending_tasks?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-info" />
                        Đang làm ({selectedReport.pending_tasks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {selectedReport.pending_tasks.map((task: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 p-1">
                            <Clock className="h-3 w-3 text-info shrink-0" />
                            {task.text || task}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Blockers */}
                {selectedReport.blockers?.length > 0 && (
                  <Card className="border-warning/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-warning">
                        ⚠️ Vấn đề ({selectedReport.blockers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {selectedReport.blockers.map((blocker: any, idx: number) => (
                          <li key={idx} className="p-1">
                            {blocker.text || blocker}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* WBS Classification */}
                {selectedReport.completed_tasks?.length > 0 && (
                  <div className="space-y-2">
                    {!wbsResult && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => classify.mutate(selectedReport.completed_tasks)}
                        disabled={isClassifying}
                      >
                        {isClassifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        AI Kiểm tra WBS
                      </Button>
                    )}
                    {wbsResult && (
                      <WbsCheckPanel
                        result={wbsResult}
                        onAcceptSuggestion={(item, directiveId) => acceptSuggestion.mutate({ reportItem: item, directiveId })}
                        isAccepting={acceptSuggestion.isPending}
                      />
                    )}
                  </div>
                )}

                {/* Review Section */}
                {selectedReport.status === "submitted" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Nhận xét của bạn</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Nhập nhận xét, góp ý cho nhân viên..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => reviewReport.mutate({
                            reportId: selectedReport.id,
                            status: "rejected",
                            comment: reviewComment,
                          })}
                          disabled={reviewReport.isPending}
                          className="text-destructive border-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Từ chối
                        </Button>
                        <Button
                          onClick={() => reviewReport.mutate({
                            reportId: selectedReport.id,
                            status: "approved",
                            comment: reviewComment,
                          })}
                          disabled={reviewReport.isPending}
                          className="bg-success hover:bg-success/90 text-success-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Duyệt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Previous Review Comment */}
                {selectedReport.review_comment && selectedReport.status !== "submitted" && (
                  <Card className="border-info/30 bg-info/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Nhận xét đã gửi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedReport.review_comment}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

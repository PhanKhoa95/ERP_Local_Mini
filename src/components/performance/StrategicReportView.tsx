import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Printer, AlertTriangle, Target, Lightbulb, MessageSquare, ArrowRight, ClipboardList, Users } from "lucide-react";
import { StrategicReport } from "@/hooks/useStrategicReports";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Nháp", variant: "secondary" },
  submitted: { label: "Đã gửi", variant: "default" },
  approved: { label: "Phê duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
  on_track: { label: "Đang tiến triển", variant: "default" },
  delayed: { label: "Chậm tiến độ", variant: "destructive" },
  achieved: { label: "Đạt mục tiêu", variant: "default" },
};

const TASK_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ", variant: "secondary" },
  in_progress: { label: "Đang làm", variant: "default" },
  done: { label: "Hoàn thành", variant: "outline" },
};

export function StrategicReportView({ report }: { report: StrategicReport }) {
  const summary = report.executive_summary || {};
  const keyResults = (report.key_results || []) as Array<{ name: string; actual: number; target: number; unit?: string }>;
  const barriers = (report.barriers || []) as Array<{ description: string; cause: string }>;
  const nextSteps = (report.next_steps || []) as Array<{ priority: number; action: string; deadline?: string }>;
  const requests = (report.requests || []) as Array<{ type: string; description: string; deadline?: string }>;
  const projectTasksSummary = (report.project_tasks_summary || {}) as any;
  const resourcesSummary = (report.resources_summary || []) as Array<{ name: string; role: string; allocated_hours: number | null }>;

  const statusInfo = STATUS_MAP[report.status] || STATUS_MAP.draft;
  const currentStatusInfo = STATUS_MAP[summary.current_status || "on_track"] || STATUS_MAP.on_track;

  const hasProjectTasks = projectTasksSummary.total > 0;
  const hasResources = resourcesSummary.length > 0;

  return (
    <div className="space-y-6 max-w-4xl print:max-w-none print:space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <h2 className="text-xl font-bold text-foreground">{report.title}</h2>
          <p className="text-sm text-muted-foreground">
            Ngày: {format(new Date(report.report_date), "dd/MM/yyyy", { locale: vi })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> In
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center border-b pb-4">
        <h1 className="text-2xl font-bold">BÁO CÁO CHIẾN LƯỢC: {report.title.toUpperCase()}</h1>
        <p className="text-sm mt-1">Ngày: {format(new Date(report.report_date), "dd/MM/yyyy")}</p>
      </div>

      {/* Section 1 */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            1. Tóm tắt điều hành
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium">Mục tiêu cốt lõi:</span>
            <p className="text-sm text-muted-foreground">{summary.objective || "—"}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <span><strong>Thời gian:</strong> {summary.timeline || "—"}</span>
            <Badge variant={currentStatusInfo.variant}>{currentStatusInfo.label}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2. Kết quả then chốt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {keyResults.map((kr, i) => {
            const pct = kr.target > 0 ? Math.round((kr.actual / kr.target) * 100) : 0;
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{kr.name}</span>
                  <span className="text-muted-foreground">{kr.actual} / {kr.target} {kr.unit} ({pct}%)</span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2" />
              </div>
            );
          })}
          {report.highlight && (
            <>
              <Separator />
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm"><strong>Điểm sáng:</strong> {report.highlight}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Project Tasks Section */}
      {hasProjectTasks && (
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Công việc Dự án
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Tiến độ:</span>
              <Progress value={projectTasksSummary.total > 0 ? Math.round((projectTasksSummary.done / projectTasksSummary.total) * 100) : 0} className="h-2 flex-1" />
              <span className="text-sm text-muted-foreground">
                {projectTasksSummary.total > 0 ? Math.round((projectTasksSummary.done / projectTasksSummary.total) * 100) : 0}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center text-sm">
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="font-bold text-foreground">{projectTasksSummary.total}</div>
                <div className="text-xs text-muted-foreground">Tổng</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="font-bold text-amber-600">{projectTasksSummary.pending}</div>
                <div className="text-xs text-muted-foreground">Chờ</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="font-bold text-blue-600">{projectTasksSummary.in_progress}</div>
                <div className="text-xs text-muted-foreground">Đang làm</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="font-bold text-emerald-600">{projectTasksSummary.done}</div>
                <div className="text-xs text-muted-foreground">Xong</div>
              </div>
            </div>
            {projectTasksSummary.overdue > 0 && (
              <p className="text-sm text-destructive">⚠ {projectTasksSummary.overdue} task quá hạn</p>
            )}
            {(projectTasksSummary.tasks || []).length > 0 && (
              <div className="space-y-1">
                {(projectTasksSummary.tasks as any[]).slice(0, 10).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                    <span className="truncate flex-1">{t.title}</span>
                    <div className="flex items-center gap-2 ml-2">
                      {t.assignee && <span className="text-xs text-muted-foreground">{t.assignee}</span>}
                      <Badge variant={TASK_STATUS_MAP[t.status]?.variant || "secondary"} className="text-xs">
                        {TASK_STATUS_MAP[t.status]?.label || t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resources Section */}
      {hasResources && (
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Nguồn lực Dự án
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="font-bold text-foreground">{resourcesSummary.length}</div>
                <div className="text-xs text-muted-foreground">Thành viên</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="font-bold text-foreground">
                  {resourcesSummary.reduce((s, m) => s + (m.allocated_hours || 0), 0)}h
                </div>
                <div className="text-xs text-muted-foreground">Tổng giờ phân bổ</div>
              </div>
            </div>
            <div className="space-y-1">
              {resourcesSummary.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                  <span>{m.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{m.role}</Badge>
                    {m.allocated_hours && <span className="text-xs text-muted-foreground">{m.allocated_hours}h</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3 */}
      {barriers.length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              3. Phân tích & Vấn đề tồn đọng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {barriers.map((b, i) => (
              <div key={i} className="text-sm p-3 rounded-lg bg-muted/50">
                <p><strong>Rào cản:</strong> {b.description}</p>
                <p className="text-muted-foreground mt-1"><strong>Nguyên nhân:</strong> {b.cause}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Section 4 */}
      {nextSteps.length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              4. Chiến lược thực thi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nextSteps.map((ns, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Badge variant="outline" className="mt-0.5 flex-shrink-0">Ưu tiên {i + 1}</Badge>
                  <div>
                    <p>{ns.action}</p>
                    {ns.deadline && <p className="text-muted-foreground text-xs">Hạn: {format(new Date(ns.deadline), "dd/MM/yyyy")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5 */}
      {requests.length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              5. Đề xuất & Kiến nghị
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requests.map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Badge variant="secondary" className="flex-shrink-0">{r.type}</Badge>
                  <div>
                    <p>{r.description}</p>
                    {r.deadline && <p className="text-muted-foreground text-xs">Trước ngày: {format(new Date(r.deadline), "dd/MM/yyyy")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review comment */}
      {report.review_comment && (
        <Card className="border-primary/20 print:shadow-none">
          <CardContent className="pt-4">
            <p className="text-sm"><strong>Nhận xét của quản lý:</strong> {report.review_comment}</p>
            {report.reviewed_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Ngày đánh giá: {format(new Date(report.reviewed_at), "dd/MM/yyyy HH:mm")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

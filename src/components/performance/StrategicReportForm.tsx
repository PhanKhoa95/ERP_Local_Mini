import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Download, Send, Save, FileText, Database, FolderKanban, Users, ClipboardList, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStrategicReports, StrategicReport } from "@/hooks/useStrategicReports";
import { useErpMetrics, erpMetricsToKeyResults } from "@/hooks/useErpMetrics";
import { useProjects } from "@/hooks/useProjects";
import { ErpDashboardPanel } from "./ErpDashboardPanel";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "on_track", label: "Đang tiến triển", color: "bg-emerald-100 text-emerald-700" },
  { value: "delayed", label: "Chậm tiến độ", color: "bg-amber-100 text-amber-700" },
  { value: "achieved", label: "Đạt mục tiêu", color: "bg-blue-100 text-blue-700" },
];

const CAUSE_OPTIONS = ["Thị trường", "Nguồn lực", "Quy trình", "Khác"];
const REQUEST_TYPES = ["Ngân sách", "Nhân sự", "Quyết sách"];

const TASK_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ", variant: "secondary" },
  in_progress: { label: "Đang làm", variant: "default" },
  done: { label: "Hoàn thành", variant: "outline" },
};

interface Props {
  editingReport?: StrategicReport | null;
  onSaved?: () => void;
}

export function StrategicReportForm({ editingReport, onSaved }: Props) {
  const { user } = useAuth();
  const { seasons, createReport, updateReport, submitReport, fetchKpiData } = useStrategicReports();
  const { projects } = useProjects();

  const [title, setTitle] = useState(editingReport?.title || "");
  const [seasonId, setSeasonId] = useState(editingReport?.season_id || "");
  const [projectId, setProjectId] = useState(editingReport?.project_id || "");
  const [reportDate, setReportDate] = useState(editingReport?.report_date || format(new Date(), "yyyy-MM-dd"));

  const { data: erpMetrics } = useErpMetrics(true, projectId || undefined);

  const [objective, setObjective] = useState(editingReport?.executive_summary?.objective || "");
  const [timeline, setTimeline] = useState(editingReport?.executive_summary?.timeline || "");
  const [currentStatus, setCurrentStatus] = useState(editingReport?.executive_summary?.current_status || "on_track");

  const [keyResults, setKeyResults] = useState<Array<{ name: string; actual: number; target: number; unit: string }>>(
    (editingReport?.key_results as any) || [{ name: "", actual: 0, target: 100, unit: "" }]
  );
  const [highlight, setHighlight] = useState(editingReport?.highlight || "");

  const [barriers, setBarriers] = useState<Array<{ description: string; cause: string }>>(
    (editingReport?.barriers as any) || [{ description: "", cause: "Nguồn lực" }]
  );

  const [nextSteps, setNextSteps] = useState<Array<{ priority: number; action: string; deadline: string }>>(
    (editingReport?.next_steps as any) || [{ priority: 1, action: "", deadline: "" }]
  );

  const [requests, setRequests] = useState<Array<{ type: string; description: string; deadline: string }>>(
    (editingReport?.requests as any) || [{ type: "Ngân sách", description: "", deadline: "" }]
  );

  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAiGenerate = async () => {
    setAiGenerating(true);
    try {
      const selectedSeason = seasons.find(s => s.id === seasonId);
      const { data, error } = await supabase.functions.invoke("ai-strategic-report", {
        body: {
          erpMetrics,
          keyResults: keyResults.filter(kr => kr.name),
          projectTasks: erpMetrics?.projectTasks || null,
          projectResources: erpMetrics?.projectResources || null,
          seasonName: selectedSeason?.name || "",
          title: title || "Báo cáo chiến lược",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Auto-fill all 5 sections
      if (data.executive_summary) {
        setObjective(data.executive_summary.objective || "");
        setTimeline(data.executive_summary.timeline || "");
        setCurrentStatus(data.executive_summary.current_status || "on_track");
      }
      if (data.highlight) setHighlight(data.highlight);
      if (data.barriers?.length) setBarriers(data.barriers);
      if (data.next_steps?.length) setNextSteps(data.next_steps);
      if (data.requests?.length) setRequests(data.requests.map((r: any) => ({ ...r, deadline: r.deadline || "" })));

      toast({ title: "AI đã soạn xong báo cáo", description: "Bạn có thể chỉnh sửa trước khi gửi" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Lỗi AI", description: err.message || "Không thể tạo nội dung" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleImportKpi = async () => {
    if (!seasonId) return;
    const kpiData = await fetchKpiData(seasonId);
    if (kpiData.length > 0) setKeyResults(kpiData);
  };

  const handleImportErp = () => {
    if (!erpMetrics) return;
    setKeyResults(erpMetricsToKeyResults(erpMetrics));
  };

  const buildPayload = () => ({
    title,
    season_id: seasonId || null,
    project_id: projectId || null,
    report_date: reportDate,
    executive_summary: { objective, timeline, current_status: currentStatus },
    key_results: keyResults.filter(kr => kr.name),
    highlight: highlight || null,
    barriers: barriers.filter(b => b.description),
    next_steps: nextSteps.filter(ns => ns.action),
    requests: requests.filter(r => r.description),
    project_tasks_summary: erpMetrics?.projectTasks || {},
    resources_summary: erpMetrics?.projectResources?.members || [],
  });

  const handleSave = async (submit = false) => {
    setSaving(true);
    try {
      if (editingReport?.id) {
        await updateReport.mutateAsync({ id: editingReport.id, ...buildPayload() } as any);
        if (submit) await submitReport.mutateAsync(editingReport.id);
      } else {
        const created = await createReport.mutateAsync({
          ...buildPayload(),
          status: submit ? "submitted" : "draft",
        } as any);
        if (submit && created?.id) await submitReport.mutateAsync(created.id);
      }
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const projectTasks = erpMetrics?.projectTasks;
  const projectResources = erpMetrics?.projectResources;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ERP Dashboard */}
      <ErpDashboardPanel />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Báo cáo chiến lược
            </CardTitle>
            <Button
              variant="default"
              size="sm"
              onClick={handleAiGenerate}
              disabled={aiGenerating}
              className="gap-2"
            >
              {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiGenerating ? "AI đang phân tích..." : "🤖 AI Soạn báo cáo"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Tiêu đề báo cáo</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Q1 2026 Sales Strategy" />
          </div>
          <div className="space-y-2">
            <Label>Kỳ KPI liên kết</Label>
            <Select value={seasonId} onValueChange={setSeasonId}>
              <SelectTrigger><SelectValue placeholder="Chọn kỳ..." /></SelectTrigger>
              <SelectContent>
                {seasons.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dự án liên kết</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Chọn dự án..." /></SelectTrigger>
              <SelectContent>
                {(projects || []).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" /> {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ngày báo cáo</Label>
            <Input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Tóm tắt điều hành</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mục tiêu cốt lõi</Label>
            <Textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="Đạt được [Con số/Kết quả] trong vòng [Thời gian]" rows={2} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Thời gian thực hiện</Label>
              <Input value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="VD: Q1 2026" />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái hiện tại</Label>
              <Select value={currentStatus} onValueChange={setCurrentStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Key Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">2. Kết quả then chốt (KPIs)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImportErp}>
                <Database className="h-4 w-4 mr-1" /> Nhập từ ERP
              </Button>
              {seasonId && (
                <Button variant="outline" size="sm" onClick={handleImportKpi}>
                  <Download className="h-4 w-4 mr-1" /> Nhập từ KPI
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {keyResults.map((kr, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-5 items-end">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Chỉ số</Label>
                <Input value={kr.name} onChange={e => {
                  const next = [...keyResults]; next[i] = { ...kr, name: e.target.value }; setKeyResults(next);
                }} placeholder="Tên chỉ số" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Thực tế</Label>
                <Input type="number" value={kr.actual} onChange={e => {
                  const next = [...keyResults]; next[i] = { ...kr, actual: +e.target.value }; setKeyResults(next);
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mục tiêu</Label>
                <Input type="number" value={kr.target} onChange={e => {
                  const next = [...keyResults]; next[i] = { ...kr, target: +e.target.value }; setKeyResults(next);
                }} />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {kr.target > 0 ? Math.round((kr.actual / kr.target) * 100) : 0}%
                </Badge>
                {keyResults.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setKeyResults(keyResults.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setKeyResults([...keyResults, { name: "", actual: 0, target: 100, unit: "" }])}>
            <Plus className="h-4 w-4 mr-1" /> Thêm chỉ số
          </Button>
          <Separator />
          <div className="space-y-2">
            <Label>Điểm sáng nổi bật</Label>
            <Input value={highlight} onChange={e => setHighlight(e.target.value)} placeholder="Nêu 1 thành tựu nổi bật nhất" />
          </div>
        </CardContent>
      </Card>

      {/* Section 2b: Project Tasks */}
      {projectId && projectTasks && projectTasks.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Công việc Dự án ({projectResources?.projectName})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Tiến độ:</span>
              <Progress value={projectResources?.projectProgress || 0} className="h-2 flex-1" />
              <span className="text-sm text-muted-foreground">{projectResources?.projectProgress || 0}%</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-lg font-bold text-foreground">{projectTasks.total}</div>
                <div className="text-xs text-muted-foreground">Tổng</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-lg font-bold text-amber-600">{projectTasks.pending}</div>
                <div className="text-xs text-muted-foreground">Chờ</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-lg font-bold text-blue-600">{projectTasks.in_progress}</div>
                <div className="text-xs text-muted-foreground">Đang làm</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-lg font-bold text-emerald-600">{projectTasks.done}</div>
                <div className="text-xs text-muted-foreground">Xong</div>
              </div>
            </div>
            {projectTasks.overdue > 0 && (
              <p className="text-sm text-destructive">⚠ {projectTasks.overdue} task quá hạn</p>
            )}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {projectTasks.tasks.slice(0, 10).map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                  <span className="truncate flex-1">{t.title}</span>
                  <div className="flex items-center gap-2 ml-2">
                    {t.assignee && <span className="text-xs text-muted-foreground">{t.assignee}</span>}
                    <Badge variant={TASK_STATUS_MAP[t.status]?.variant || "secondary"} className="text-xs">
                      {TASK_STATUS_MAP[t.status]?.label || t.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {projectTasks.tasks.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-1">+{projectTasks.tasks.length - 10} tasks khác</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2c: Resources */}
      {projectId && projectResources && projectResources.members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Nguồn lực Dự án
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-lg font-bold text-foreground">{projectResources.members.length}</div>
                <div className="text-xs text-muted-foreground">Thành viên</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-lg font-bold text-foreground">{projectResources.totalAllocatedHours}h</div>
                <div className="text-xs text-muted-foreground">Giờ phân bổ</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-lg font-bold text-foreground">
                  {projectResources.budget > 0 ? `${Math.round(projectResources.budget / 1_000_000)}tr` : "—"}
                </div>
                <div className="text-xs text-muted-foreground">Ngân sách</div>
              </div>
            </div>
            <div className="space-y-1">
              {projectResources.members.map((m, i) => (
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

      {/* Section 3: Barriers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Phân tích & Vấn đề tồn đọng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {barriers.map((b, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-3 items-end">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Rào cản {i + 1}</Label>
                <Input value={b.description} onChange={e => {
                  const next = [...barriers]; next[i] = { ...b, description: e.target.value }; setBarriers(next);
                }} placeholder="Mô tả khó khăn..." />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Nguyên nhân</Label>
                  <Select value={b.cause} onValueChange={v => {
                    const next = [...barriers]; next[i] = { ...b, cause: v }; setBarriers(next);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CAUSE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {barriers.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBarriers(barriers.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {barriers.length < 2 && (
            <Button variant="outline" size="sm" onClick={() => setBarriers([...barriers, { description: "", cause: "Nguồn lực" }])}>
              <Plus className="h-4 w-4 mr-1" /> Thêm rào cản
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Chiến lược thực thi giai đoạn tới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {nextSteps.map((ns, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Ưu tiên</Label>
                <Badge variant="outline" className="w-full justify-center">{i + 1}</Badge>
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Hành động</Label>
                <Input value={ns.action} onChange={e => {
                  const next = [...nextSteps]; next[i] = { ...ns, action: e.target.value }; setNextSteps(next);
                }} placeholder="Hành động cụ thể..." />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Deadline</Label>
                  <Input type="date" value={ns.deadline} onChange={e => {
                    const next = [...nextSteps]; next[i] = { ...ns, deadline: e.target.value }; setNextSteps(next);
                  }} />
                </div>
                {nextSteps.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNextSteps(nextSteps.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setNextSteps([...nextSteps, { priority: nextSteps.length + 1, action: "", deadline: "" }])}>
            <Plus className="h-4 w-4 mr-1" /> Thêm ưu tiên
          </Button>
        </CardContent>
      </Card>

      {/* Section 5: Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">5. Đề xuất & Kiến nghị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.map((r, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Loại</Label>
                <Select value={r.type} onValueChange={v => {
                  const next = [...requests]; next[i] = { ...r, type: v }; setRequests(next);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Mô tả</Label>
                <Input value={r.description} onChange={e => {
                  const next = [...requests]; next[i] = { ...r, description: e.target.value }; setRequests(next);
                }} placeholder="Cần thêm [Số lượng] để [Mục đích]" />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Hạn</Label>
                  <Input type="date" value={r.deadline} onChange={e => {
                    const next = [...requests]; next[i] = { ...r, deadline: e.target.value }; setRequests(next);
                  }} />
                </div>
                {requests.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRequests(requests.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setRequests([...requests, { type: "Ngân sách", description: "", deadline: "" }])}>
            <Plus className="h-4 w-4 mr-1" /> Thêm đề xuất
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || !title}>
          <Save className="h-4 w-4 mr-1" /> Lưu nháp
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving || !title}>
          <Send className="h-4 w-4 mr-1" /> Gửi báo cáo
        </Button>
      </div>
    </div>
  );
}

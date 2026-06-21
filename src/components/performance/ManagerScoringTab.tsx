import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Save, Loader2, User, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = { K: "KPI", B: "Behavior", I: "Innovation", F: "Foundation" };

export function ManagerScoringTab() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Fetch active season
  const { data: activeSeason } = useQuery({
    queryKey: ["active-kpi-season", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase.from("kpi_seasons").select("*").eq("company_id", companyId).eq("is_active", true).maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["perf-employees-scoring", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("perf_employees")
        .select("id, user_id, title, org_unit_id")
        .eq("company_id", companyId)
        .eq("is_active", true);
      const emps = data || [];
      // Fetch profiles separately since perf_employees has no FK to profiles
      if (emps.length === 0) return [];
      const userIds = emps.map((e: any) => e.user_id).filter(Boolean);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
      return emps.map((e: any) => ({ ...e, profile_name: profileMap.get(e.user_id) || null }));
    },
    enabled: !!companyId,
  });

  // Fetch metrics for season
  const { data: metrics = [] } = useQuery({
    queryKey: ["kpi-metrics-scoring", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return [];
      const { data } = await supabase.from("kpi_metrics").select("*").eq("season_id", activeSeason.id).order("category").order("sort_order");
      return data || [];
    },
    enabled: !!activeSeason?.id,
  });

  // Fetch scores for selected employee
  const { data: scores = [] } = useQuery({
    queryKey: ["staff-scores-manager", selectedEmployeeId, activeSeason?.id],
    queryFn: async () => {
      if (!selectedEmployeeId || !metrics.length) return [];
      const { data } = await supabase
        .from("staff_scores")
        .select("*")
        .eq("employee_id", selectedEmployeeId)
        .in("metric_id", metrics.map(m => m.id));
      return data || [];
    },
    enabled: !!selectedEmployeeId && !!metrics.length,
  });

  const saveScore = useMutation({
    mutationFn: async ({ metricId, managerScore, finalScore, managerComment }: {
      metricId: string; managerScore: number; finalScore: number; managerComment: string;
    }) => {
      if (!selectedEmployeeId || !activeSeason?.id) throw new Error("Missing context");
      const existing = scores.find(s => s.metric_id === metricId);
      if (existing) {
        const { error } = await supabase.from("staff_scores")
          .update({ manager_score: managerScore, final_score: finalScore, manager_comment: managerComment || null, status: "finalized" })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_scores")
          .insert({
            employee_id: selectedEmployeeId, metric_id: metricId,
            manager_score: managerScore, final_score: finalScore, manager_comment: managerComment || null, status: "finalized",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-scores-manager"] });
      toast.success("Đã lưu điểm");
    },
    onError: (e: Error) => toast.error("Lỗi: " + e.message),
  });

  if (!activeSeason) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Chưa có mùa đánh giá</h3>
          <p className="text-muted-foreground text-center">Tạo kỳ KPI tại trang Quản lý Dự án trước</p>
        </CardContent>
      </Card>
    );
  }

  const selectedEmployee = employees.find((e: any) => e.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Chấm điểm KPI cho nhân viên
          </CardTitle>
          <CardDescription>Kỳ: {activeSeason.name} — Chọn nhân viên để chấm điểm</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Chọn nhân viên..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.profile_name || emp.title || "Nhân viên"} {emp.title ? `(${emp.title})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEmployeeId && metrics.length > 0 && (
        <div className="space-y-4">
          {Object.entries(categoryLabels).map(([cat, label]) => {
            const catMetrics = metrics.filter(m => m.category === cat);
            if (catMetrics.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{label} ({cat})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {catMetrics.map(metric => (
                    <MetricScoringRow
                      key={metric.id}
                      metric={metric}
                      score={scores.find(s => s.metric_id === metric.id)}
                      onSave={(managerScore, finalScore, comment) =>
                        saveScore.mutate({ metricId: metric.id, managerScore, finalScore, managerComment: comment })
                      }
                      isSaving={saveScore.isPending}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedEmployeeId && metrics.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chưa có chỉ tiêu KPI cho kỳ này</p>
            <p className="text-sm">Hãy tạo chỉ tiêu tại trang Quản lý Dự án → Kỳ KPI</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricScoringRow({ metric, score, onSave, isSaving }: {
  metric: any; score: any; onSave: (ms: number, fs: number, c: string) => void; isSaving: boolean;
}) {
  const [managerScore, setManagerScore] = useState(score?.manager_score?.toString() || "");
  const [finalScore, setFinalScore] = useState(score?.final_score?.toString() || "");
  const [comment, setComment] = useState(score?.manager_comment || "");
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    const ms = parseFloat(managerScore);
    const fs = parseFloat(finalScore || managerScore);
    if (isNaN(ms) || ms < 0 || ms > 100) { toast.error("Điểm phải từ 0-100"); return; }
    onSave(ms, isNaN(fs) ? ms : fs, comment);
    setEditing(false);
  };

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium">{metric.name}</p>
          {metric.description && <p className="text-xs text-muted-foreground">{metric.description}</p>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">W: {metric.weight}</span>
          {metric.target_value != null && <span className="text-muted-foreground">Target: {metric.target_value}{metric.unit || ""}</span>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div className="p-2 bg-muted rounded">
          <p className="text-xs text-muted-foreground">Tự chấm</p>
          <p className="font-medium">{score?.self_score != null ? `${score.self_score}` : "—"}</p>
          {score?.self_comment && <p className="text-xs text-muted-foreground mt-1">{score.self_comment}</p>}
        </div>
        <div className="p-2 bg-muted rounded">
          <p className="text-xs text-muted-foreground">Manager chấm</p>
          <p className="font-medium">{score?.manager_score != null ? `${score.manager_score}` : "—"}</p>
        </div>
        <div className="p-2 bg-muted rounded">
          <p className="text-xs text-muted-foreground">Điểm cuối</p>
          <p className="font-bold">{score?.final_score != null ? `${score.final_score}` : "—"}</p>
        </div>
        <div className="flex items-center justify-end">
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {score?.manager_score != null ? "Sửa điểm" : "Chấm điểm"}
            </Button>
          ) : (
            <Badge variant="secondary">Đang chấm</Badge>
          )}
        </div>
      </div>
      {editing && (
        <div className="mt-3 p-3 border rounded bg-primary/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Điểm Manager (0-100)</label>
              <Input type="number" min={0} max={100} value={managerScore} onChange={e => { setManagerScore(e.target.value); if (!finalScore) setFinalScore(e.target.value); }} className="h-8" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Điểm cuối cùng (0-100)</label>
              <Input type="number" min={0} max={100} value={finalScore} onChange={e => setFinalScore(e.target.value)} className="h-8" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nhận xét</label>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Nhận xét cho nhân viên..." />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Hủy</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Lưu điểm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

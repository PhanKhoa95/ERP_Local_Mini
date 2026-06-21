import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Eye,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  Lightbulb,
  Heart,
  Save,
  Download,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";

interface KPIMetric {
  id: string;
  category: string;
  name: string;
  description: string | null;
  weight: number;
  target_value: number | null;
  unit: string | null;
  evaluation_type: string;
  rubric: any;
}

const RUBRIC_LEVELS = [
  { level: 1, label: "Chưa đạt", score: 20 },
  { level: 2, label: "Cần cải thiện", score: 40 },
  { level: 3, label: "Đạt yêu cầu", score: 60 },
  { level: 4, label: "Tốt", score: 80 },
  { level: 5, label: "Xuất sắc", score: 100 },
];

interface StaffScore {
  id: string;
  metric_id: string;
  self_score: number | null;
  manager_score: number | null;
  final_score: number | null;
  actual_value: number | null;
  status: string;
  self_comment: string | null;
  manager_comment: string | null;
}

const categoryConfig: Record<string, { label: string; color: string; textColor: string; bgLight: string; icon: any; description: string }> = {
  K: { 
    label: "KPI", 
    color: "bg-info", 
    textColor: "text-info",
    bgLight: "bg-info/10",
    icon: Target,
    description: "Chỉ tiêu kinh doanh và vận hành"
  },
  B: { 
    label: "Behavior", 
    color: "bg-success", 
    textColor: "text-success",
    bgLight: "bg-success/10",
    icon: Heart,
    description: "Hành vi và thái độ làm việc"
  },
  I: { 
    label: "Innovation", 
    color: "bg-primary", 
    textColor: "text-primary",
    bgLight: "bg-primary/10",
    icon: Lightbulb,
    description: "Sáng tạo và cải tiến"
  },
  F: { 
    label: "Foundation", 
    color: "bg-warning", 
    textColor: "text-warning",
    bgLight: "bg-warning/10",
    icon: Users,
    description: "Nền tảng và tuân thủ quy trình"
  },
};

export function KPIScoringTab() {
  const { employee } = usePerformanceEmployee();
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [selfScore, setSelfScore] = useState<string>("");
  const [selfComment, setSelfComment] = useState<string>("");

  // Fetch active season
  const { data: activeSeason, isLoading: seasonLoading } = useQuery({
    queryKey: ["active-kpi-season", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("kpi_seasons")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch metrics for this season
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["kpi-metrics", activeSeason?.id, employee?.org_unit_id],
    queryFn: async () => {
      if (!activeSeason?.id) return [];
      let query = supabase
        .from("kpi_metrics")
        .select("*")
        .eq("season_id", activeSeason.id)
        .order("category")
        .order("sort_order");
      if (employee?.org_unit_id) {
        query = query.or(`org_unit_id.eq.${employee.org_unit_id},org_unit_id.is.null`);
      } else {
        query = query.is("org_unit_id", null);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as KPIMetric[];
    },
    enabled: !!activeSeason?.id,
  });

  // Fetch scores for employee
  const { data: scores, isLoading: scoresLoading } = useQuery({
    queryKey: ["staff-scores", employee?.id, activeSeason?.id],
    queryFn: async () => {
      if (!employee?.id || !metrics?.length) return [];
      const { data, error } = await supabase
        .from("staff_scores")
        .select("*")
        .eq("employee_id", employee.id)
        .in("metric_id", metrics.map(m => m.id));
      if (error) throw error;
      return data as StaffScore[];
    },
    enabled: !!employee?.id && !!metrics?.length,
  });

  // Fetch season results
  const { data: seasonResult } = useQuery({
    queryKey: ["season-result", employee?.id, activeSeason?.id],
    queryFn: async () => {
      if (!employee?.id || !activeSeason?.id) return null;
      const { data, error } = await supabase
        .from("season_results")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("season_id", activeSeason.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!employee?.id && !!activeSeason?.id,
  });

  // Self-score mutation
  const saveSelfScore = useMutation({
    mutationFn: async ({ metricId, score, comment }: { metricId: string; score: number; comment: string }) => {
      if (!employee?.id || !activeSeason?.id) throw new Error("Missing context");
      
      const existingScore = scores?.find(s => s.metric_id === metricId);
      
      if (existingScore) {
        const { error } = await supabase
          .from("staff_scores")
          .update({ 
            self_score: score, 
            self_comment: comment || null,
            status: "self_scored"
          })
          .eq("id", existingScore.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("staff_scores")
          .insert({
            employee_id: employee.id,
            metric_id: metricId,
            self_score: score,
            self_comment: comment || null,
            status: "self_scored",
          });
        if (error) throw error;
      }

      // Log audit
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: "kpi_self_score",
        table_name: "staff_scores",
        record_id: metricId,
        new_data: { self_score: score, self_comment: comment },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-scores"] });
      toast.success("Đã lưu điểm tự đánh giá");
      setEditingMetricId(null);
      setSelfScore("");
      setSelfComment("");
    },
    onError: () => {
      toast.error("Lỗi khi lưu điểm");
    },
  });

  const handleStartEdit = (metric: KPIMetric) => {
    const existingScore = scores?.find(s => s.metric_id === metric.id);
    setEditingMetricId(metric.id);
    setSelfScore(existingScore?.self_score?.toString() || "");
    setSelfComment(existingScore?.self_comment || "");
  };

  const handleSave = (metricId: string) => {
    const score = parseFloat(selfScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Điểm phải từ 0 đến 100");
      return;
    }
    saveSelfScore.mutate({ metricId, score, comment: selfComment });
  };

  const handleExport = () => {
    if (!metrics?.length) return;
    const exportData = metrics.map(m => {
      const score = scores?.find(s => s.metric_id === m.id);
      const config = categoryConfig[m.category];
      return {
        category: config?.label || m.category,
        name: m.name,
        weight: m.weight,
        target: m.target_value,
        self_score: score?.self_score,
        manager_score: score?.manager_score,
        final_score: score?.final_score,
        manager_comment: score?.manager_comment || "",
      };
    });
    exportToExcel(exportData, [
      { key: "category", header: "Nhóm", width: 12 },
      { key: "name", header: "Chỉ tiêu", width: 30 },
      { key: "weight", header: "Trọng số", width: 10 },
      { key: "target", header: "Mục tiêu", width: 12 },
      { key: "self_score", header: "Tự chấm", width: 10 },
      { key: "manager_score", header: "Manager", width: 10 },
      { key: "final_score", header: "Điểm cuối", width: 10 },
      { key: "manager_comment", header: "Nhận xét", width: 30 },
    ], `KPI_${activeSeason?.name || "report"}`);
    toast.success("Đã xuất file Excel");
  };

  const isLoading = seasonLoading || metricsLoading || scoresLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!activeSeason) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Chưa có mùa đánh giá</h3>
          <p className="text-muted-foreground text-center">
            Quản trị viên cần tạo mùa KPI để bắt đầu đánh giá
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreForMetric = (metricId: string) => scores?.find(s => s.metric_id === metricId);

  const getCategoryScore = (category: string) => {
    const categoryMetrics = metrics?.filter(m => m.category === category) || [];
    if (categoryMetrics.length === 0) return null;
    const scoredMetrics = categoryMetrics.filter(m => {
      const score = getScoreForMetric(m.id);
      return score?.final_score != null;
    });
    if (scoredMetrics.length === 0) return null;
    const totalWeight = scoredMetrics.reduce((sum, m) => sum + m.weight, 0);
    const weightedScore = scoredMetrics.reduce((sum, m) => {
      const score = getScoreForMetric(m.id);
      return sum + (score?.final_score || 0) * m.weight;
    }, 0);
    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : null;
  };

  const filteredMetrics = selectedCategory === "all" 
    ? metrics 
    : metrics?.filter(m => m.category === selectedCategory);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreIcon = (score: number | null, target: number | null) => {
    if (score === null || target === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (score >= target) return <TrendingUp className="h-4 w-4 text-success" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const canSelfScore = (score: StaffScore | undefined) => {
    return !score || score.status === "pending" || score.self_score === null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Đánh giá KPI</h2>
          <p className="text-muted-foreground">
            {activeSeason.name} • {activeSeason.type === "monthly" ? "Hàng tháng" : 
             activeSeason.type === "quarterly" ? "Hàng quý" : "Hàng năm"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Xuất Excel
          </Button>
          <Badge variant="outline" className="text-sm">
            <Eye className="h-3 w-3 mr-1" />
            Minh bạch
          </Badge>
        </div>
      </div>

      {/* Overall KBIF Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Điểm tổng hợp K.B.I.F
          </CardTitle>
          <CardDescription>
            Điểm đánh giá theo 4 tiêu chí: KPI, Behavior, Innovation, Foundation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const score = getCategoryScore(key);
              const CategoryIcon = config.icon;
              return (
                <div 
                  key={key}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedCategory === key ? "ring-2 ring-primary" : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === key ? "all" : key)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded ${config.color} text-white`}>
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                    {score !== null ? `${score}%` : "—"}
                  </div>
                  <Progress value={score || 0} className="h-1.5 mt-2" />
                </div>
              );
            })}
          </div>

          {seasonResult && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Điểm tổng kết</p>
                <p className="text-3xl font-bold text-primary">
                  {seasonResult.total_score?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Xếp hạng trong công ty</p>
                <p className="text-2xl font-bold">#{seasonResult.rank_in_company || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">XP kiếm được</p>
                <p className="text-2xl font-bold text-success">+{seasonResult.xp_earned || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết đánh giá</CardTitle>
          <CardDescription>
            Nhấn "Tự chấm" để nhập điểm tự đánh giá cho từng chỉ tiêu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!filteredMetrics?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Chưa có chỉ tiêu KPI nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMetrics.map((metric) => {
                const score = getScoreForMetric(metric.id);
                const config = categoryConfig[metric.category];
                const isEditing = editingMetricId === metric.id;
                
                return (
                  <div key={metric.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={config.color}>
                          {config.label}
                        </Badge>
                        {metric.evaluation_type === "qualitative" && (
                          <Badge variant="outline" className="text-xs">Định tính</Badge>
                        )}
                        {metric.evaluation_type === "peer_review" && (
                          <Badge variant="outline" className="text-xs">Peer Review</Badge>
                        )}
                        <div>
                          <h4 className="font-medium">{metric.name}</h4>
                          {metric.description && (
                            <p className="text-sm text-muted-foreground">{metric.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getScoreIcon(score?.final_score || null, metric.target_value)}
                        <span className={`text-lg font-bold ${getScoreColor(score?.final_score || null)}`}>
                          {score?.final_score !== null && score?.final_score !== undefined
                            ? `${score.final_score}%`
                            : "—"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-3 text-sm">
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground mb-1">Tự đánh giá</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {score?.self_score != null ? `${score.self_score}%` : "Chưa chấm"}
                          </span>
                          {!isEditing && canSelfScore(score) && !activeSeason.is_locked && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs"
                              onClick={() => handleStartEdit(metric)}
                            >
                              Tự chấm
                            </Button>
                          )}
                          {score?.status === "self_scored" && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Chờ duyệt
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground mb-1">Manager đánh giá</p>
                        <span className="font-medium">
                          {score?.manager_score != null ? `${score.manager_score}%` : "Chưa chấm"}
                        </span>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground mb-1">Target</p>
                        <span className="font-medium">
                          {metric.target_value != null 
                            ? `${metric.target_value}${metric.unit || ""}`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Self-scoring inline form */}
                    {isEditing && (
                      <div className="mt-3 p-3 border rounded-lg bg-primary/5 space-y-3">
                        {metric.evaluation_type === "qualitative" ? (
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">Chọn mức đánh giá (Rubric)</label>
                            <div className="grid grid-cols-5 gap-1.5">
                              {(metric.rubric || RUBRIC_LEVELS).map((r: any) => {
                                const level = r.level || r.score;
                                const isSelected = selfScore === String(r.score || r.level * 20);
                                return (
                                  <button
                                    key={level}
                                    type="button"
                                    className={`p-2 rounded-lg border text-center text-xs transition-all ${
                                      isSelected
                                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                                        : "hover:border-primary/50"
                                    }`}
                                    onClick={() => setSelfScore(String(r.score || r.level * 20))}
                                  >
                                    <div className="font-bold text-primary">{r.level}</div>
                                    <div className="font-medium">{r.label}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-xs text-muted-foreground mb-1 block">Điểm (0-100)</label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={selfScore}
                                onChange={(e) => setSelfScore(e.target.value)}
                                placeholder="Nhập điểm..."
                                className="h-8"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Ghi chú / Minh chứng</label>
                          <Textarea
                            value={selfComment}
                            onChange={(e) => setSelfComment(e.target.value)}
                            placeholder={metric.evaluation_type === "qualitative" 
                              ? "Mô tả kết quả, đính kèm link minh chứng..." 
                              : "Mô tả kết quả đạt được..."}
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setEditingMetricId(null)}>
                            Hủy
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleSave(metric.id)}
                            disabled={saveSelfScore.isPending}
                          >
                            {saveSelfScore.isPending ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-1" />
                            )}
                            Lưu điểm
                          </Button>
                        </div>
                      </div>
                    )}

                    {score?.manager_comment && (
                      <div className="mt-3 p-2 bg-info/10 rounded text-sm">
                        <p className="text-muted-foreground mb-1">Nhận xét từ Manager:</p>
                        <p>{score.manager_comment}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

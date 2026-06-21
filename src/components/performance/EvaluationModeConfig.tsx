import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Settings2, Plus, Trash2, GripVertical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

interface OrgUnit {
  id: string;
  name: string;
  evaluation_mode: string;
  qualitative_criteria: any[];
  kbif_weights: any;
}

interface RubricLevel {
  level: number;
  label: string;
  description: string;
}

const EVALUATION_MODES = [
  { value: "kbif_standard", label: "KBIF Chuẩn", description: "KPI định lượng truyền thống" },
  { value: "kbif_qualitative", label: "KBIF Định tính", description: "Đánh giá chuyên môn bằng rubric" },
  { value: "okr", label: "OKR", description: "Mục tiêu & Kết quả then chốt" },
  { value: "hybrid", label: "Kết hợp", description: "Định lượng + Định tính" },
];

const DEFAULT_RUBRIC: RubricLevel[] = [
  { level: 1, label: "Chưa đạt", description: "Không đáp ứng yêu cầu cơ bản" },
  { level: 2, label: "Cần cải thiện", description: "Đáp ứng một phần yêu cầu" },
  { level: 3, label: "Đạt yêu cầu", description: "Hoàn thành đúng tiêu chuẩn" },
  { level: 4, label: "Tốt", description: "Vượt kỳ vọng ở một số khía cạnh" },
  { level: 5, label: "Xuất sắc", description: "Vượt trội toàn diện" },
];

export function EvaluationModeConfig() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<Array<{ name: string; description: string }>>([]);

  const { data: orgUnits, isLoading } = useQuery({
    queryKey: ["org-units-eval-config", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("perf_org_units")
        .select("id, name, evaluation_mode, qualitative_criteria, kbif_weights")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as OrgUnit[];
    },
    enabled: !!companyId,
  });

  const updateMode = useMutation({
    mutationFn: async ({ unitId, mode, qualCriteria }: { unitId: string; mode: string; qualCriteria?: any[] }) => {
      const updateData: any = { evaluation_mode: mode };
      if (qualCriteria !== undefined) {
        updateData.qualitative_criteria = qualCriteria;
      }
      const { error } = await supabase
        .from("perf_org_units")
        .update(updateData)
        .eq("id", unitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-units-eval-config"] });
      toast.success("Đã cập nhật mô hình đánh giá");
      setEditingUnit(null);
    },
    onError: () => toast.error("Lỗi cập nhật"),
  });

  const handleEditCriteria = (unit: OrgUnit) => {
    setEditingUnit(unit.id);
    const existing = Array.isArray(unit.qualitative_criteria) ? unit.qualitative_criteria : [];
    setCriteria(existing.length > 0 ? existing : [
      { name: "Chất lượng chuyên môn", description: "Mức độ chính xác và sâu sắc trong công việc" },
      { name: "Giải quyết vấn đề", description: "Khả năng phân tích và xử lý tình huống phức tạp" },
    ]);
  };

  const handleSaveCriteria = (unitId: string, mode: string) => {
    updateMode.mutate({ unitId, mode, qualCriteria: criteria });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Phân luồng đánh giá theo đơn vị
        </CardTitle>
        <CardDescription>
          Cấu hình mô hình đánh giá riêng cho từng phòng ban. Chuyên môn dùng rubric định tính, vận hành dùng KPI định lượng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!orgUnits?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">Chưa có đơn vị tổ chức nào.</p>
        ) : (
          orgUnits.map((unit) => {
            const modeConfig = EVALUATION_MODES.find(m => m.value === unit.evaluation_mode) || EVALUATION_MODES[0];
            const isEditing = editingUnit === unit.id;

            return (
              <div key={unit.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{unit.name}</span>
                    <Badge variant="outline" className="text-xs">{modeConfig.label}</Badge>
                  </div>
                  <Select
                    value={unit.evaluation_mode}
                    onValueChange={(val) => updateMode.mutate({ unitId: unit.id, mode: val })}
                  >
                    <SelectTrigger className="w-44 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVALUATION_MODES.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          <div>
                            <span>{m.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{m.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(unit.evaluation_mode === "kbif_qualitative" || unit.evaluation_mode === "hybrid") && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Tiêu chí đánh giá định tính</p>
                      {!isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditCriteria(unit)}>
                          Chỉnh sửa
                        </Button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        {criteria.map((c, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 mt-2.5 text-muted-foreground" />
                            <div className="flex-1 space-y-1">
                              <Input
                                value={c.name}
                                onChange={(e) => {
                                  const next = [...criteria];
                                  next[idx].name = e.target.value;
                                  setCriteria(next);
                                }}
                                placeholder="Tên tiêu chí"
                                className="h-8"
                              />
                              <Input
                                value={c.description}
                                onChange={(e) => {
                                  const next = [...criteria];
                                  next[idx].description = e.target.value;
                                  setCriteria(next);
                                }}
                                placeholder="Mô tả"
                                className="h-8 text-sm"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCriteria([...criteria, { name: "", description: "" }])}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Thêm tiêu chí
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveCriteria(unit.id, unit.evaluation_mode)}
                            disabled={updateMode.isPending}
                          >
                            {updateMode.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                            Lưu
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingUnit(null)}>
                            Hủy
                          </Button>
                        </div>

                        {/* Rubric preview */}
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium mb-2">Thang đánh giá Rubric mặc định</p>
                          <div className="grid grid-cols-5 gap-1">
                            {DEFAULT_RUBRIC.map(r => (
                              <div key={r.level} className="text-center p-2 bg-background rounded text-xs">
                                <div className="font-bold text-primary">{r.level}</div>
                                <div className="font-medium">{r.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(Array.isArray(unit.qualitative_criteria) && unit.qualitative_criteria.length > 0)
                          ? unit.qualitative_criteria.map((c: any, i: number) => (
                              <div key={i} className="text-sm flex items-center gap-2">
                                <span className="text-muted-foreground">{i + 1}.</span>
                                <span className="font-medium">{c.name}</span>
                                {c.description && <span className="text-muted-foreground">— {c.description}</span>}
                              </div>
                            ))
                          : <p className="text-xs text-muted-foreground italic">Chưa cấu hình tiêu chí</p>
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Target, Heart, Lightbulb, Users, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

interface KpiMetricForm {
  name: string;
  category: string;
  description: string;
  weight: number;
  target_value: number | null;
  unit: string;
  evaluation_type: string;
  is_required: boolean;
  sort_order: number;
  org_unit_id: string | null;
}

const defaultForm: KpiMetricForm = {
  name: "", category: "K", description: "", weight: 1, target_value: null,
  unit: "", evaluation_type: "quantitative", is_required: true, sort_order: 0, org_unit_id: null,
};

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  K: { label: "KPI", icon: Target, color: "bg-info" },
  B: { label: "Behavior", icon: Heart, color: "bg-success" },
  I: { label: "Innovation", icon: Lightbulb, color: "bg-primary" },
  F: { label: "Foundation", icon: Users, color: "bg-warning" },
};

interface KpiMetricsManagerProps {
  seasonId: string;
  seasonName: string;
}

export function KpiMetricsManager({ seasonId, seasonName }: KpiMetricsManagerProps) {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<KpiMetricForm>(defaultForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["kpi-metrics-admin", seasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kpi_metrics")
        .select("*")
        .eq("season_id", seasonId)
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!seasonId,
  });

  const { data: orgUnits = [] } = useQuery({
    queryKey: ["perf-org-units-select", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("perf_org_units").select("id, name").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: KpiMetricForm & { id?: string }) => {
      const payload = {
        ...data,
        season_id: seasonId,
        target_value: data.target_value || null,
        org_unit_id: data.org_unit_id || null,
      };
      if (data.id) {
        const { error } = await supabase.from("kpi_metrics").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kpi_metrics").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-metrics-admin", seasonId] });
      queryClient.invalidateQueries({ queryKey: ["kpi-metrics"] });
      toast.success(editingId ? "Đã cập nhật chỉ tiêu" : "Đã tạo chỉ tiêu");
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error("Lỗi: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kpi_metrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-metrics-admin", seasonId] });
      queryClient.invalidateQueries({ queryKey: ["kpi-metrics"] });
      toast.success("Đã xóa chỉ tiêu");
    },
    onError: (e: Error) => toast.error("Lỗi: " + e.message),
  });

  const resetForm = () => { setForm(defaultForm); setEditingId(null); };

  const handleEdit = (metric: any) => {
    setEditingId(metric.id);
    setForm({
      name: metric.name, category: metric.category, description: metric.description || "",
      weight: metric.weight, target_value: metric.target_value, unit: metric.unit || "",
      evaluation_type: metric.evaluation_type, is_required: metric.is_required,
      sort_order: metric.sort_order, org_unit_id: metric.org_unit_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Tên chỉ tiêu là bắt buộc"); return; }
    saveMutation.mutate({ ...form, id: editingId || undefined });
  };

  const filtered = filterCategory === "all" ? metrics : metrics.filter(m => m.category === filterCategory);

  const getCategoryStats = () => {
    const stats: Record<string, { count: number; totalWeight: number }> = {};
    for (const m of metrics) {
      if (!stats[m.category]) stats[m.category] = { count: 0, totalWeight: 0 };
      stats[m.category].count++;
      stats[m.category].totalWeight += m.weight;
    }
    return stats;
  };
  const stats = getCategoryStats();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Chỉ tiêu KPI — {seasonName}</h3>
          <p className="text-sm text-muted-foreground">{metrics.length} chỉ tiêu</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Thêm chỉ tiêu
        </Button>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const s = stats[key] || { count: 0, totalWeight: 0 };
          const Icon = config.icon;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${filterCategory === key ? "ring-2 ring-primary" : "hover:border-primary/50"}`}
              onClick={() => setFilterCategory(filterCategory === key ? "all" : key)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`p-2 rounded ${config.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{s.count} chỉ tiêu • W:{s.totalWeight}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Metrics Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Chưa có chỉ tiêu KPI nào</p>
              <p className="text-sm">Nhấn "Thêm chỉ tiêu" để bắt đầu cấu hình</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhóm</TableHead>
                  <TableHead>Tên chỉ tiêu</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-center">Trọng số</TableHead>
                  <TableHead className="text-center">Mục tiêu</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const config = categoryConfig[m.category];
                  const orgUnit = orgUnits.find(u => u.id === m.org_unit_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge className={config?.color || "bg-muted"}>{config?.label || m.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{m.name}</p>
                          {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {m.evaluation_type === "quantitative" ? "Định lượng" : m.evaluation_type === "qualitative" ? "Định tính" : "Peer Review"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{m.weight}</TableCell>
                      <TableCell className="text-center">
                        {m.target_value != null ? `${m.target_value}${m.unit || ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {orgUnit?.name || "Tất cả"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(m)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(m.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa chỉ tiêu KPI" : "Tạo chỉ tiêu KPI"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Tên chỉ tiêu *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Doanh thu bán hàng" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nhóm KBIF *</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label} ({k})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loại đánh giá</Label>
                <Select value={form.evaluation_type} onValueChange={v => setForm({ ...form, evaluation_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantitative">Định lượng</SelectItem>
                    <SelectItem value="qualitative">Định tính (Rubric)</SelectItem>
                    <SelectItem value="peer_review">Peer Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả chi tiết cách đánh giá..." rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Trọng số</Label>
                <Input type="number" min={1} value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Mục tiêu</Label>
                <Input type="number" value={form.target_value ?? ""} onChange={e => setForm({ ...form, target_value: e.target.value ? Number(e.target.value) : null })} placeholder="VD: 100" />
              </div>
              <div>
                <Label>Đơn vị</Label>
                <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="%, đ, đơn" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phòng ban áp dụng</Label>
                <Select value={form.org_unit_id || "all"} onValueChange={v => setForm({ ...form, org_unit_id: v === "all" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phòng ban</SelectItem>
                    {orgUnits.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thứ tự hiển thị</Label>
                <Input type="number" min={0} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo chỉ tiêu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

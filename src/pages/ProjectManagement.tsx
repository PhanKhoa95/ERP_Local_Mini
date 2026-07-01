import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, FolderKanban, Target, BarChart3, AlertTriangle, TrendingUp, Activity, Flame, Users2, ShieldAlert, Play, Sparkles, RefreshCw } from "lucide-react";
import { useProjects, Project } from "@/hooks/useProjects";
import { useKpiSeasons, KpiSeason } from "@/hooks/useKpiSeasons";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { KpiSeasonDialog } from "@/components/projects/KpiSeasonDialog";
import { KpiMetricsManager } from "@/components/performance/KpiMetricsManager";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const statusLabels: Record<string, string> = {
  planning: "Lên kế hoạch",
  active: "Đang chạy",
  completed: "Hoàn thành",
  on_hold: "Tạm dừng",
  cancelled: "Hủy",
};

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  completed: "bg-green-500/10 text-green-600",
  on_hold: "bg-yellow-500/10 text-yellow-600",
  cancelled: "bg-destructive/10 text-destructive",
};

const priorityLabels: Record<string, string> = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
  critical: "Khẩn cấp",
};

const SIMULATION_SCENARIOS = [
  {
    id: "all",
    name: "Tất cả điểm nghẽn",
    icon: Activity,
    description: "Tổng hợp tất cả các khó khăn và tải công việc hiện tại của toàn doanh nghiệp.",
    workload: [
      { name: "Nguyễn Văn A", role: "Kỹ sư Cấp cao", workload: 85, tasksCount: 5, status: "optimal" },
      { name: "Trần Thị B", role: "Sales Agent", workload: 120, tasksCount: 8, status: "overloaded" },
      { name: "Lê Văn C", role: "Kế toán trưởng", workload: 50, tasksCount: 3, status: "underloaded" },
      { name: "Phạm Thị D", role: "Trưởng phòng Nhân sự", workload: 70, tasksCount: 4, status: "optimal" }
    ],
    impediments: [
      {
        id: "imp-1",
        project: "Tích hợp Kênh Bán Hàng Shopee",
        code: "SHP",
        bottleneck: "Trần Thị B (Sales Agent)",
        issue: "API Shopee liên tục gặp lỗi timeout 504 trong khung giờ vàng 12h-13h, gây nghẽn luồng đồng bộ đơn hàng.",
        impact: "critical",
        action: "Chuyển cấu hình kết nối sang hệ thống API Gateway dự phòng, phân luồng sync bất đồng bộ."
      },
      {
        id: "imp-2",
        project: "Tối ưu hóa Định mức BOM & Cung ứng",
        code: "SCM",
        bottleneck: "Nguyễn Văn A (Kỹ sư Cấp cao)",
        issue: "Dữ liệu định mức BOM thực tế bị hao hụt 15% so với thiết kế lý thuyết, chưa xác định rõ nguyên nhân do chất lượng Vải hay quy trình Cắt.",
        impact: "high",
        action: "Tổ chức audit quy trình QC đầu vào của Vải dệt và chạy mẻ sản xuất mẫu có camera giám sát."
      }
    ],
    metrics: { bottleneck: "Trần Thị B", bottleneckWorkload: "120%", status: "Khá (78%)", statusColor: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50/50", impedimentsCount: "2 Điểm nghẽn" }
  },
  {
    id: "shopee_peak",
    name: "Quá tải Shopee 6.6",
    icon: Flame,
    description: "Chiến dịch siêu sale 6.6 làm lượng đơn hàng Shopee tăng vọt 300% gây nghẽn API đồng bộ.",
    workload: [
      { name: "Nguyễn Văn A", role: "Kỹ sư Cấp cao", workload: 95, tasksCount: 7, status: "optimal" },
      { name: "Trần Thị B", role: "Sales Agent", workload: 150, tasksCount: 14, status: "overloaded" },
      { name: "Lê Văn C", role: "Kế toán trưởng", workload: 75, tasksCount: 5, status: "optimal" },
      { name: "Phạm Thị D", role: "Trưởng phòng Nhân sự", workload: 80, tasksCount: 5, status: "optimal" }
    ],
    impediments: [
      {
        id: "imp-1",
        project: "Tích hợp Kênh Bán Hàng Shopee",
        code: "SHP",
        bottleneck: "Trần Thị B (Sales Agent)",
        issue: "API Shopee quá tải phản hồi chậm (>10s) gây nghẽn luồng sync, làm lệch số lượng tồn kho thực tế giữa các kho.",
        impact: "critical",
        action: "Tạm thời giới hạn tần suất sync tồn kho xuống 15 phút/lần thay vì realtime để giảm tải, đồng thời tự động bù tồn kho ảo."
      },
      {
        id: "imp-3",
        project: "Tích hợp Kênh Tiktok Shop",
        code: "TTS",
        bottleneck: "Trần Thị B (Sales Agent)",
        issue: "Lỗi đồng bộ sản phẩm bị từ chối do mô tả chứa từ khóa cấm, Trần Thị B phải sửa tay hàng loạt SKU.",
        impact: "high",
        action: "Chạy script auto-filter lọc từ khóa cấm trong danh mục sản phẩm trước khi đẩy API sang Tiktok Shop."
      }
    ],
    metrics: { bottleneck: "Trần Thị B", bottleneckWorkload: "150%", status: "Khẩn cấp (45%)", statusColor: "text-red-600 animate-pulse", border: "border-red-200", bg: "bg-red-50/50", impedimentsCount: "2 Điểm nghẽn" }
  },
  {
    id: "bom_defect",
    name: "Lỗi Định mức BOM & QC",
    icon: AlertTriangle,
    description: "Phát hiện hao hụt vải lớn và lỗi QC tại xưởng dệt buộc phải dừng chuyền may để kiểm tra quy trình.",
    workload: [
      { name: "Nguyễn Văn A", role: "Kỹ sư Cấp cao", workload: 130, tasksCount: 9, status: "overloaded" },
      { name: "Trần Thị B", role: "Sales Agent", workload: 60, tasksCount: 4, status: "optimal" },
      { name: "Lê Văn C", role: "Kế toán trưởng", workload: 90, tasksCount: 6, status: "optimal" },
      { name: "Phạm Thị D", role: "Trưởng phòng Nhân sự", workload: 70, tasksCount: 4, status: "optimal" }
    ],
    impediments: [
      {
        id: "imp-2",
        project: "Tối ưu hóa Định mức BOM & Cung ứng",
        code: "SCM",
        bottleneck: "Nguyễn Văn A (Kỹ sư Cấp cao)",
        issue: "Vải thun cotton bị co rút vượt định mức cho phép (15% vs 3% lý thuyết). Quy trình cắt và giác sơ đồ phải tính toán lại.",
        impact: "critical",
        action: "Tạm dừng sản xuất mã hàng hiện tại, kiểm tra mẫu vải của nhà cung cấp mới và setup máy giặt co rút trước khi cắt."
      },
      {
        id: "imp-4",
        project: "Đảm bảo chất lượng QC nhà xưởng",
        code: "QCM",
        bottleneck: "Lê Văn C (Kế toán trưởng)",
        issue: "Hạch toán chi phí phế phẩm vượt 5% ngân sách dự phòng, cần phê duyệt ngân quỹ đột xuất mua máy đo độ giãn vải.",
        impact: "high",
        action: "Gửi tờ trình E-Office duyệt mua khẩn cấp máy đo dệt kỹ thuật số từ quỹ dự phòng phát sinh."
      }
    ],
    metrics: { bottleneck: "Nguyễn Văn A", bottleneckWorkload: "130%", status: "Báo động (62%)", statusColor: "text-yellow-600", border: "border-yellow-200", bg: "bg-yellow-50/50", impedimentsCount: "2 Điểm nghẽn" }
  },
  {
    id: "key_person_leave",
    name: "Nhân sự chủ chốt nghỉ phép",
    icon: Users2,
    description: "Kỹ sư trưởng Nguyễn Văn A nghỉ ốm đột xuất, bàn giao task hạ tầng dồn cho các nhân sự khác.",
    workload: [
      { name: "Nguyễn Văn A", role: "Kỹ sư Cấp cao", workload: 0, tasksCount: 0, status: "underloaded" },
      { name: "Trần Thị B", role: "Sales Agent", workload: 140, tasksCount: 12, status: "overloaded" },
      { name: "Lê Văn C", role: "Kế toán trưởng", workload: 60, tasksCount: 4, status: "optimal" },
      { name: "Phạm Thị D", role: "Trưởng phòng Nhân sự", workload: 110, tasksCount: 8, status: "overloaded" }
    ],
    impediments: [
      {
        id: "imp-5",
        project: "Tối ưu hóa Định mức BOM & Cung ứng",
        code: "SCM",
        bottleneck: "Phạm Thị D (Trưởng phòng Nhân sự)",
        issue: "Không có người ký duyệt kỹ thuật giác sơ đồ sản xuất do Nguyễn Văn A vắng mặt. Lệnh sản xuất MRP bị kẹt.",
        impact: "critical",
        action: "Phân quyền tạm thời cho Kỹ sư phó nhóm thay thế Nguyễn Văn A duyệt bản vẽ BOM thông qua E-Office."
      },
      {
        id: "imp-6",
        project: "Di cư Hạ tầng Cloud AWS",
        code: "AWS",
        bottleneck: "Trần Thị B (Sales Agent)",
        issue: "Việc chuyển đổi server Webhook POS sang AWS bị chậm tiến độ do thiếu nhân lực có chứng chỉ SysOps.",
        impact: "high",
        action: "Phạm Thị D liên hệ khẩn cấp đối tác outsourcing để thuê tạm thời 1 DevOps làm việc part-time 3 ngày."
      }
    ],
    metrics: { bottleneck: "Trần Thị B", bottleneckWorkload: "140%", status: "Nghiêm trọng (55%)", statusColor: "text-red-500", border: "border-red-300", bg: "bg-red-50/70", impedimentsCount: "2 Điểm nghẽn" }
  },
  {
    id: "budget_crisis",
    name: "Kiểm soát dòng tiền âm",
    icon: ShieldAlert,
    description: "Doanh thu công nợ thu hồi chậm gây thiếu hụt dòng tiền thanh toán cho nhà cung cấp nguyên vật liệu.",
    workload: [
      { name: "Nguyễn Văn A", role: "Kỹ sư Cấp cao", workload: 60, tasksCount: 4, status: "optimal" },
      { name: "Trần Thị B", role: "Sales Agent", workload: 90, tasksCount: 6, status: "optimal" },
      { name: "Lê Văn C", role: "Kế toán trưởng", workload: 140, tasksCount: 11, status: "overloaded" },
      { name: "Phạm Thị D", role: "Trưởng phòng Nhân sự", workload: 60, tasksCount: 3, status: "optimal" }
    ],
    impediments: [
      {
        id: "imp-7",
        project: "Mở rộng Kho bãi Khu vực Miền Nam",
        code: "WHE",
        bottleneck: "Lê Văn C (Kế toán trưởng)",
        issue: "Chủ đầu tư kho Bình Dương yêu cầu đặt cọc 3 tháng (120M) ngay trong tuần này, tuy nhiên số dư Tiền gửi đang ưu tiên trả lương.",
        impact: "critical",
        action: "Đàm phán trả trước 1 tháng cọc và 2 tháng còn lại thanh toán bằng thư bảo lãnh ngân hàng hoặc trả góp."
      },
      {
        id: "imp-8",
        project: "Thanh toán đối tác Vải dệt",
        code: "BOM",
        bottleneck: "Lê Văn C (Kế toán trưởng)",
        issue: "Nhà cung cấp Vải dệt dọa dừng giao hàng đợt 2 nếu không thanh toán dứt điểm 8.5M tiền nợ hóa đơn cũ.",
        impact: "high",
        action: "Thu xếp chi tiền mặt khẩn cấp 5M và làm việc với ngân hàng phát hành lệnh chi trả 3.5M đối trừ công nợ."
      }
    ],
    metrics: { bottleneck: "Lê Văn C", bottleneckWorkload: "140%", status: "Đáng lo ngại (60%)", statusColor: "text-yellow-600", border: "border-yellow-300", bg: "bg-yellow-50/70", impedimentsCount: "2 Điểm nghẽn" }
  }
];

export default function ProjectManagement() {
  const { projects, isLoading: loadingProjects } = useProjects();
  const { seasons, isLoading: loadingSeasons, deleteSeason } = useKpiSeasons();
  const queryClient = useQueryClient();

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingSeason, setEditingSeason] = useState<KpiSeason | null>(null);
  const [managingMetricsSeasonId, setManagingMetricsSeasonId] = useState<string | null>(null);
  const managingMetricsSeason = seasons?.find(s => s.id === managingMetricsSeasonId);

  const [selectedScenarioId, setSelectedScenarioId] = useState("all");
  const activeScenario = SIMULATION_SCENARIOS.find(s => s.id === selectedScenarioId) || SIMULATION_SCENARIOS[0];

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Lỗi: " + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Đã xóa dự án");
    }
  };

  const formatDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy") : "—";
  const formatMoney = (n: number | null) => n ? n.toLocaleString("vi-VN") + " ₫" : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Dự án & Kỳ KPI</h1>
        <p className="text-muted-foreground">Tạo và quản lý dự án, kỳ đánh giá KPI</p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" /> Dự án
          </TabsTrigger>
          <TabsTrigger value="seasons" className="gap-2">
            <Target className="h-4 w-4" /> Kỳ KPI
          </TabsTrigger>
          <TabsTrigger value="progress_resources" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Tiến độ & Nguồn lực
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Danh sách dự án</CardTitle>
              <Button size="sm" onClick={() => { setEditingProject(null); setProjectDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Tạo dự án
              </Button>
            </CardHeader>
            <CardContent>
              {loadingProjects ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Đang tải...</p>
              ) : !projects?.length ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Chưa có dự án nào. Nhấn "Tạo dự án" để bắt đầu.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã</TableHead>
                        <TableHead>Tên dự án / Phụ trách</TableHead>
                        <TableHead>Trạng thái / Tiến độ</TableHead>
                        <TableHead>Ưu tiên / Thời gian</TableHead>
                        <TableHead>Ngân sách / Thực chi</TableHead>
                        <TableHead>Chi tiết công việc & Chậm trễ</TableHead>
                        <TableHead className="w-24" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map(p => {
                        const isOverdue = p.status !== "completed" && p.end_date && new Date(p.end_date) < new Date();
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs align-top pt-4">{p.code}</TableCell>
                            <TableCell className="align-top pt-4">
                              <div className="font-medium">{p.name}</div>
                              {p.owner_name && (
                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Users2 className="h-3 w-3" /> Phụ trách: {p.owner_name}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="align-top pt-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={statusColors[p.status]}>
                                  {statusLabels[p.status]}
                                </Badge>
                                {isOverdue && (
                                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Quá hạn
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-2 w-32">
                                <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                                  <span>Tiến độ</span>
                                  <span>{p.progress || 0}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-primary h-full rounded-full transition-all" 
                                    style={{ width: `${p.progress || 0}%` }} 
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top pt-4">
                              <div className="text-xs font-semibold">{priorityLabels[p.priority]}</div>
                              <div className="text-[11px] text-muted-foreground mt-1">
                                {formatDate(p.start_date)} → {formatDate(p.end_date)}
                              </div>
                            </TableCell>
                            <TableCell className="align-top pt-4">
                              <div className="text-xs font-medium text-muted-foreground">Kế hoạch:</div>
                              <div className="text-xs">{formatMoney(p.budget)}</div>
                              <div className="text-xs font-medium text-muted-foreground mt-1.5">Thực chi:</div>
                              <div className="text-xs font-semibold text-primary">{formatMoney(p.actual_cost ?? 0)}</div>
                            </TableCell>
                            <TableCell className="align-top pt-4 max-w-[280px]">
                              {p.milestones && (
                                <div className="text-xs">
                                  <span className="font-medium text-muted-foreground">Mốc CV: </span>
                                  <span className="text-muted-foreground">{p.milestones}</span>
                                </div>
                              )}
                              {p.deliverables && (
                                <div className="text-xs mt-1">
                                  <span className="font-medium text-muted-foreground">Đầu ra: </span>
                                  <span>{p.deliverables}</span>
                                </div>
                              )}
                              {p.cost_documents && (
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  Chứng từ: <code className="bg-muted px-1 py-0.2 rounded font-mono">{p.cost_documents}</code>
                                </div>
                              )}
                              {p.delay_reason && (
                                <div className="text-xs mt-1.5 p-1 bg-yellow-50 rounded border border-yellow-100 text-yellow-800 flex items-start gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-[10px]">Lý do chậm trễ:</div>
                                    <div className="text-[11px] leading-tight">{p.delay_reason}</div>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="align-top pt-3">
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingProject(p); setProjectDialogOpen(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(p.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasons">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Danh sách kỳ KPI</CardTitle>
              <Button size="sm" onClick={() => { setEditingSeason(null); setSeasonDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Tạo kỳ KPI
              </Button>
            </CardHeader>
            <CardContent>
              {loadingSeasons ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Đang tải...</p>
              ) : !seasons?.length ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Chưa có kỳ KPI nào. Nhấn "Tạo kỳ KPI" để bắt đầu.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên kỳ</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Chỉ tiêu</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="capitalize">{s.type === "half_year" ? "Nửa năm" : s.type === "quarter" ? "Quý" : s.type === "month" ? "Tháng" : "Năm"}</TableCell>
                        <TableCell className="text-xs">{formatDate(s.start_date)} → {formatDate(s.end_date)}</TableCell>
                        <TableCell>
                          <Badge variant={s.is_active ? "default" : "secondary"}>
                            {s.is_active ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setManagingMetricsSeasonId(s.id)} className="gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Chỉ tiêu
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingSeason(s); setSeasonDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteSeason.mutate(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress_resources" className="mt-4 space-y-6">
            {/* Bộ Giả Lập Kịch Bản */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <CardTitle className="text-base font-bold">Bộ Giả Lập Tình Huống Dự Án & Quy Trình ERP (Interactive Simulator)</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Chọn các tình huống vận hành doanh nghiệp thực tế dưới đây để theo dõi sự thay đổi về điểm nghẽn nhân sự và khó khăn của các dự án.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SIMULATION_SCENARIOS.map((scenario) => {
                    const IconComp = scenario.icon;
                    const isSelected = selectedScenarioId === scenario.id;
                    return (
                      <Button
                        key={scenario.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5 transition-all text-xs"
                        onClick={() => setSelectedScenarioId(scenario.id)}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        {scenario.name}
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-3 p-3 rounded bg-card border border-muted text-xs text-muted-foreground">
                  <strong className="text-foreground">Mô tả tình huống:</strong> {activeScenario.description}
                </div>
              </CardContent>
            </Card>

            {/* Card Tổng quan Nút thắt nóng */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={`border-red-200 transition-all duration-300 ${activeScenario.metrics.bg}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-destructive/10 text-destructive animate-pulse">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase">Nút thắt nóng (Bottleneck)</h3>
                      <p className="text-2xl font-bold text-red-600 mt-1">{activeScenario.metrics.bottleneck}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Mức độ quá tải công việc: {activeScenario.metrics.bottleneckWorkload}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-600">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase">Sự cố / Khó khăn</h3>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{activeScenario.metrics.impedimentsCount}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Cập nhật theo thời gian thực</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`transition-all duration-300 ${activeScenario.metrics.border} ${activeScenario.metrics.bg}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase">Sức khỏe Dự án</h3>
                      <p className={`text-2xl font-bold mt-1 ${activeScenario.metrics.statusColor}`}>{activeScenario.metrics.status}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Chỉ số cân đối nguồn lực</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Phân bổ nguồn lực & Trạng thái tải */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-semibold">Tải Làm Việc & Phân Bổ Nguồn Lực</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeScenario.workload.map((res, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold block">{res.name}</span>
                          <span className="text-[10px] text-muted-foreground">{res.role} ({res.tasksCount} việc)</span>
                        </div>
                        <Badge variant={res.status === "overloaded" ? "destructive" : res.status === "optimal" ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                          {res.status === "overloaded" ? "Quá tải" : res.status === "optimal" ? "Tối ưu" : "Dưới tải"}
                        </Badge>
                      </div>
                      {/* Progress Bar Custom */}
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-500 ${
                          res.workload > 100 ? "bg-red-500 animate-pulse" :
                          res.workload >= 80 ? "bg-yellow-500" : "bg-emerald-500"
                        }`} style={{ width: `${Math.min(res.workload, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Tải công việc</span>
                        <span className="font-semibold">{res.workload}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Danh sách khó khăn & Điểm tắc nghẽn */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-semibold">Điểm Nghẽn & Khó Khăn Của Dự Án</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeScenario.impediments.map((imp, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-muted bg-card text-card-foreground space-y-2 transition-all duration-300 hover:shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">{imp.code}</span>
                          <span className="text-xs font-bold text-foreground">{imp.project}</span>
                        </div>
                        <Badge variant={imp.impact === "critical" ? "destructive" : "secondary"} className="text-[8px] uppercase px-1 py-0">
                          {imp.impact === "critical" ? "Nghiêm trọng" : "Cao"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground"><strong className="text-foreground">Khó khăn:</strong> {imp.issue}</p>
                        <p className="text-muted-foreground"><strong className="text-foreground">Nhân sự tắc nghẽn:</strong> <span className="text-red-500 font-medium">{imp.bottleneck}</span></p>
                        <div className="mt-2 bg-primary/5 p-2 rounded border border-primary/10 text-[11px]">
                          <strong className="text-primary block">Hành động khắc phục đề xuất:</strong>
                          <p className="text-muted-foreground mt-0.5">{imp.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

      {/* KPI Metrics Manager */}
      {managingMetricsSeason && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Quản lý chỉ tiêu KPI</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setManagingMetricsSeasonId(null)}>Đóng</Button>
          </CardHeader>
          <CardContent>
            <KpiMetricsManager seasonId={managingMetricsSeason.id} seasonName={managingMetricsSeason.name} />
          </CardContent>
        </Card>
      )}

      <ProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} project={editingProject} />
      <KpiSeasonDialog open={seasonDialogOpen} onOpenChange={setSeasonDialogOpen} season={editingSeason} />
    </div>
  );
}

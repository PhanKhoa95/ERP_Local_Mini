import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, FolderKanban, Target, BarChart3, AlertTriangle, TrendingUp, Activity, Flame, Users2, ShieldAlert, Play, Sparkles, RefreshCw, ClipboardList, CheckSquare, Clock, ArrowRight, Trash, Award } from "lucide-react";
import { useProjects, Project } from "@/hooks/useProjects";
import { useKpiSeasons, KpiSeason } from "@/hooks/useKpiSeasons";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { KpiSeasonDialog } from "@/components/projects/KpiSeasonDialog";
import { KpiMetricsManager } from "@/components/performance/KpiMetricsManager";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // Tasks state
  const [taskViewMode, setTaskViewMode] = useState<"my" | "team">("my");
  const [taskViewLayout, setTaskViewLayout] = useState<"kanban" | "list">("kanban");
  const { 
    myTasks = [], 
    teamTasks = [], 
    createTask, 
    updateTask, 
    acceptTask, 
    startTask, 
    completeTask 
  } = useTasks();
  const { members = [] } = useCompanyMembers();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [completionNotesOpen, setCompletionNotesOpen] = useState(false);
  const [selectedTaskIdForComplete, setSelectedTaskIdForComplete] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>("none");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string>("none");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const tasksToDisplay = taskViewMode === "my" ? myTasks : teamTasks;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createTask.mutateAsync({
      title: newTaskTitle,
      description: newTaskDesc || null,
      priority: newTaskPriority,
      project_id: newTaskProjectId === "none" ? null : newTaskProjectId,
      assigned_to: newTaskAssignedTo === "none" ? null : newTaskAssignedTo,
      due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
      source_type: "project"
    });

    // Reset form
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPriority("normal");
    setNewTaskProjectId("none");
    setNewTaskAssignedTo("none");
    setNewTaskDueDate("");
    setTaskDialogOpen(false);
  };

  const handleOpenCompleteDialog = (taskId: string) => {
    setSelectedTaskIdForComplete(taskId);
    setCompletionNotes("");
    setCompletionNotesOpen(true);
  };

  const handleCompleteTaskSubmit = async () => {
    if (!selectedTaskIdForComplete) return;
    await completeTask.mutateAsync({
      taskId: selectedTaskIdForComplete,
      notes: completionNotes
    });
    setCompletionNotesOpen(false);
    setSelectedTaskIdForComplete(null);
  };

  // Task Details Modal (Pancake Work Style)
  const [activeDetailTaskId, setActiveDetailTaskId] = useState<string | null>(null);
  const [detailChecklist, setDetailChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [detailComments, setDetailComments] = useState<{ id: string; author: string; text: string; createdAt: string }[]>([]);
  const [detailActivities, setDetailActivities] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [newSubtaskText, setNewSubtaskText] = useState("");

  const activeDetailTask = tasksToDisplay.find(t => t.id === activeDetailTaskId);

  // Load task details from localStorage
  useEffect(() => {
    if (!activeDetailTaskId) return;
    const key = `erp-mini-task-details-${activeDetailTaskId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setDetailChecklist(parsed.checklist || []);
        setDetailComments(parsed.comments || []);
        setDetailActivities(parsed.activities || []);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default checklist/comments for demo
      let defaultChecklist: any[] = [];
      let defaultComments: any[] = [];
      let defaultActivities = [
        { id: `act-1`, text: "Công việc đã được khởi tạo bởi hệ thống", createdAt: new Date().toISOString() }
      ];

      if (activeDetailTaskId === "task-local-1") {
        defaultChecklist = [
          { id: "sub-1", text: "Kiểm tra bình mực Epson L8050", done: true },
          { id: "sub-2", text: "In test tem nhãn decal nhám", done: false },
          { id: "sub-3", text: "Gia công bế đứt tem tròn 5cm", done: false }
        ];
        defaultComments = [
          { id: "com-1", author: "Hệ thống", text: "Vui lòng hoàn thành trước thời hạn của đơn hàng.", createdAt: new Date().toISOString() }
        ];
      } else if (activeDetailTaskId === "task-local-2") {
        defaultChecklist = [
          { id: "sub-1", text: "Thiết kế logo combo shop", done: true },
          { id: "sub-2", text: "Gửi market thiết kế cho khách duyệt", done: true }
        ];
        defaultActivities.push({ id: "act-2", text: "Trạng thái đổi sang Hoàn thành", createdAt: new Date().toISOString() });
      }

      setDetailChecklist(defaultChecklist);
      setDetailComments(defaultComments);
      setDetailActivities(defaultActivities);

      localStorage.setItem(key, JSON.stringify({
        checklist: defaultChecklist,
        comments: defaultComments,
        activities: defaultActivities
      }));
    }
  }, [activeDetailTaskId]);

  const saveTaskDetails = (checklist: any[], comments: any[], activities: any[]) => {
    if (!activeDetailTaskId) return;
    const key = `erp-mini-task-details-${activeDetailTaskId}`;
    localStorage.setItem(key, JSON.stringify({ checklist, comments, activities }));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newItem = { id: `sub-${Date.now()}`, text: newSubtaskText, done: false };
    const updated = [...detailChecklist, newItem];
    setDetailChecklist(updated);
    setNewSubtaskText("");

    const newActivity = { id: `act-${Date.now()}`, text: `Đã thêm checklist: "${newItem.text}"`, createdAt: new Date().toISOString() };
    const updatedActivities = [...detailActivities, newActivity];
    setDetailActivities(updatedActivities);

    saveTaskDetails(updated, detailComments, updatedActivities);
    updateTaskProgress(updated);
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = detailChecklist.map(item => {
      if (item.id === subId) {
        const nextDone = !item.done;
        // Log activity
        const newActivity = { 
          id: `act-${Date.now()}`, 
          text: `Đã ${nextDone ? 'đánh dấu xong' : 'hủy đánh dấu'} checklist: "${item.text}"`, 
          createdAt: new Date().toISOString() 
        };
        const updatedActivities = [...detailActivities, newActivity];
        setDetailActivities(updatedActivities);
        saveTaskDetails(detailChecklist, detailComments, updatedActivities);
        return { ...item, done: nextDone };
      }
      return item;
    });
    setDetailChecklist(updated);
    saveTaskDetails(updated, detailComments, detailActivities);
    updateTaskProgress(updated);
  };

  const handleDeleteSubtask = (subId: string) => {
    const target = detailChecklist.find(i => i.id === subId);
    if (!target) return;
    const updated = detailChecklist.filter(item => item.id !== subId);
    setDetailChecklist(updated);

    const newActivity = { id: `act-${Date.now()}`, text: `Đã xóa checklist: "${target.text}"`, createdAt: new Date().toISOString() };
    const updatedActivities = [...detailActivities, newActivity];
    setDetailActivities(updatedActivities);

    saveTaskDetails(updated, detailComments, updatedActivities);
    updateTaskProgress(updated);
  };

  const updateTaskProgress = (checklist: any[]) => {
    if (!activeDetailTaskId || checklist.length === 0) return;
    const doneCount = checklist.filter(c => c.done).length;
    const progress = Math.round((doneCount / checklist.length) * 100);
    updateTask.mutate({ id: activeDetailTaskId, progress });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment = {
      id: `com-${Date.now()}`,
      author: "Bạn (Quản lý/Admin)",
      text: newCommentText,
      createdAt: new Date().toISOString()
    };
    const updatedComments = [...detailComments, newComment];
    setDetailComments(updatedComments);
    setNewCommentText("");

    const newActivity = { id: `act-${Date.now()}`, text: "Đã thêm bình luận mới", createdAt: new Date().toISOString() };
    const updatedActivities = [...detailActivities, newActivity];
    setDetailActivities(updatedActivities);

    saveTaskDetails(detailChecklist, updatedComments, updatedActivities);
  };

  const columns = [
    { id: "pending", title: "Chờ nhận", color: "border-slate-500/20 bg-slate-500/5 text-slate-400" },
    { id: "in_progress", title: "Đang làm", color: "border-sky-500/20 bg-sky-500/5 text-sky-400" },
    { id: "done", title: "Hoàn thành", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
    { id: "cancelled", title: "Đã hủy", color: "border-rose-500/20 bg-rose-500/5 text-rose-400" }
  ];

  const renderKanbanCard = (task: Task) => {
    const isOverdue = task.status !== "done" && task.status !== "cancelled" && task.due_date && new Date(task.due_date) < new Date();
    
    return (
      <Card 
        key={task.id} 
        className="border-border/60 bg-muted/40 hover:bg-muted/75 transition-all shadow-xs p-3 space-y-2.5 text-xs cursor-pointer hover:border-primary/40 group/card"
        onClick={() => setActiveDetailTaskId(task.id)}
      >
        <div className="flex items-start justify-between gap-1.5">
          <span className="font-semibold text-foreground group-hover/card:text-primary transition-all line-clamp-2 leading-snug">{task.title}</span>
          <Badge className={cn(
            "text-[9px] px-1 py-0 capitalize border shrink-0",
            task.priority === "urgent" ? "bg-red-500/10 text-red-500 border-red-500/20" :
            task.priority === "high" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
            task.priority === "normal" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
            "bg-slate-500/10 text-slate-500 border-slate-500/20"
          )}>
            {priorityLabels[task.priority] || task.priority}
          </Badge>
        </div>

        {task.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
        )}

        {task.project_id && projects && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-primary/80">
            <FolderKanban className="h-3 w-3" />
            <span>{projects.find(p => p.id === task.project_id)?.name || "Dự án liên kết"}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users2 className="h-3 w-3" />
            <span>{members.find(m => m.id === task.assigned_to)?.name || "Chưa giao"}</span>
          </div>
          {task.due_date && (
            <div className={cn("flex items-center gap-1 font-medium", isOverdue && "text-red-500 animate-pulse")}>
              <Clock className="h-3 w-3" />
              <span>{format(new Date(task.due_date), "dd/MM/yyyy")}</span>
            </div>
          )}
        </div>

        {task.status === "done" && task.completion_notes && (
          <div className="mt-1.5 p-1.5 bg-emerald-500/5 rounded border border-emerald-500/10 text-[10px] text-emerald-400">
            <strong>Ghi chú hoàn thành:</strong> {task.completion_notes}
          </div>
        )}

        <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-border/20">
          {task.status === "pending" && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                type="button" 
                onClick={(e) => { e.stopPropagation(); acceptTask.mutate(task.id); }}
                className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10 gap-0.5"
              >
                Nhận việc
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                type="button" 
                onClick={(e) => { e.stopPropagation(); startTask.mutate(task.id); }}
                className="h-6 px-1.5 text-[10px] text-sky-500 hover:bg-sky-500/10 gap-0.5"
              >
                <Play className="h-2.5 w-2.5" /> Bắt đầu
              </Button>
            </>
          )}

          {task.status === "accepted" && (
            <Button 
              variant="ghost" 
              size="sm" 
              type="button" 
              onClick={(e) => { e.stopPropagation(); startTask.mutate(task.id); }}
              className="h-6 px-1.5 text-[10px] text-sky-500 hover:bg-sky-500/10 gap-0.5"
            >
              <Play className="h-2.5 w-2.5" /> Bắt đầu
            </Button>
          )}

          {(task.status === "in_progress" || task.status === "accepted" || task.status === "pending") && (
            <Button 
              variant="ghost" 
              size="sm" 
              type="button" 
              onClick={(e) => { e.stopPropagation(); updateTask.mutate({ id: task.id, status: "cancelled" }); }}
              className="h-6 px-1.5 text-[10px] text-red-500 hover:bg-red-500/10"
            >
              Hủy
            </Button>
          )}

          {task.status === "in_progress" && (
            <Button 
              variant="ghost" 
              size="sm" 
              type="button" 
              onClick={(e) => { e.stopPropagation(); handleOpenCompleteDialog(task.id); }}
              className="h-6 px-1.5 text-[10px] text-emerald-500 hover:bg-emerald-500/10 gap-0.5"
            >
              <CheckSquare className="h-2.5 w-2.5" /> Hoàn thành
            </Button>
          )}
        </div>
      </Card>
    );
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
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Công việc
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

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ClipboardList className="h-4.5 w-4.5 text-primary" /> Bảng phân công công việc (Pancake Work)
                </CardTitle>
                <p className="text-xs text-muted-foreground">Theo dõi và cập nhật tiến độ công việc dự án của phòng ban</p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Kanban vs Table List */}
                <div className="flex bg-muted p-0.5 rounded-md border border-border mr-1.5 shrink-0">
                  <Button 
                    variant={taskViewLayout === "kanban" ? "secondary" : "ghost"}
                    size="sm"
                    type="button"
                    className="h-7 text-[11px] px-2.5 font-medium"
                    onClick={() => setTaskViewLayout("kanban")}
                  >
                    Kanban
                  </Button>
                  <Button 
                    variant={taskViewLayout === "list" ? "secondary" : "ghost"}
                    size="sm"
                    type="button"
                    className="h-7 text-[11px] px-2.5 font-medium"
                    onClick={() => setTaskViewLayout("list")}
                  >
                    Danh sách chi tiết
                  </Button>
                </div>

                <Select value={taskViewMode} onValueChange={(val: any) => setTaskViewMode(val)}>
                  <SelectTrigger className="h-8.5 text-xs w-[150px] bg-background">
                    <SelectValue placeholder="Chế độ xem" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="my">Công việc của tôi</SelectItem>
                    <SelectItem value="team">Công việc của Team</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" type="button" onClick={() => setTaskDialogOpen(true)} className="h-8.5 text-xs gap-1">
                  <Plus className="h-4 w-4" /> Giao việc mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {/* Task Analytics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <Card className="border-border/50 bg-muted/25 p-3 space-y-1 hover:bg-muted/40 transition-all">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tổng công việc</div>
                  <div className="text-xl font-bold text-foreground">{tasksToDisplay.length}</div>
                  <div className="text-[9px] text-muted-foreground">Nhiệm vụ được phân bổ</div>
                </Card>
                <Card className="border-border/50 bg-muted/25 p-3 space-y-1 hover:bg-muted/40 transition-all">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Đang thực hiện</div>
                  <div className="text-xl font-bold text-sky-500">
                    {tasksToDisplay.filter(t => t.status === "in_progress" || t.status === "accepted").length}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Công việc đang chạy</div>
                </Card>
                <Card className="border-border/50 bg-muted/25 p-3 space-y-1 hover:bg-muted/40 transition-all">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Đã hoàn thành</div>
                  <div className="text-xl font-bold text-emerald-500">
                    {tasksToDisplay.filter(t => t.status === "done").length}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    Đúng hạn: {tasksToDisplay.filter(t => t.status === "done").length > 0
                      ? Math.round((tasksToDisplay.filter(t => t.status === "done" && (!t.due_date || !t.completed_at || new Date(t.completed_at) <= new Date(t.due_date))).length / tasksToDisplay.filter(t => t.status === "done").length) * 100)
                      : 100}%
                  </div>
                </Card>
                <Card className="border-border/50 bg-muted/25 p-3 space-y-1 hover:bg-muted/40 transition-all">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trễ hạn</div>
                  <div className={cn(
                    "text-xl font-bold", 
                    tasksToDisplay.filter(t => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < new Date()).length > 0 
                      ? "text-rose-500 animate-pulse font-extrabold" 
                      : "text-foreground"
                  )}>
                    {tasksToDisplay.filter(t => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < new Date()).length}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Cần ưu tiên xử lý</div>
                </Card>
              </div>

              {taskViewLayout === "kanban" ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {columns.map(col => {
                    const colTasks = tasksToDisplay.filter(t => {
                      if (col.id === "pending") return t.status === "pending";
                      if (col.id === "in_progress") return t.status === "in_progress" || t.status === "accepted";
                      if (col.id === "done") return t.status === "done";
                      if (col.id === "cancelled") return t.status === "cancelled";
                      return false;
                    });

                    return (
                      <div key={col.id} className="flex flex-col space-y-3 bg-muted/20 border border-border/40 rounded-xl p-3 h-[600px] overflow-hidden">
                        <div className="flex items-center justify-between border-b pb-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", 
                              col.id === 'pending' ? 'bg-slate-400' :
                              col.id === 'in_progress' ? 'bg-sky-500' :
                              col.id === 'done' ? 'bg-emerald-500' : 'bg-rose-500'
                            )} />
                            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">{col.title}</h3>
                          </div>
                          <Badge variant="secondary" className="h-4.5 px-1.5 py-0 text-[10px] rounded-full shrink-0 font-mono">
                            {colTasks.length}
                          </Badge>
                        </div>

                        <ScrollArea className="flex-1 pr-1 overflow-y-auto">
                          <div className="space-y-2.5 pb-4">
                            {colTasks.map(renderKanbanCard)}
                            {colTasks.length === 0 && (
                              <div className="text-center py-10 text-muted-foreground text-[10px] border border-dashed border-border/40 rounded-lg">
                                Trống
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl bg-background/50">
                  <Table className="min-w-[1200px]">
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-16 pl-4">Mã việc</TableHead>
                        <TableHead className="min-w-[180px]">Tiêu đề</TableHead>
                        <TableHead>Dự án</TableHead>
                        <TableHead>Phụ trách</TableHead>
                        <TableHead>Người giao</TableHead>
                        <TableHead className="w-20">Ưu tiên</TableHead>
                        <TableHead className="w-24">Trạng thái</TableHead>
                        <TableHead className="w-24">Tiến độ</TableHead>
                        <TableHead className="w-24">Bắt đầu</TableHead>
                        <TableHead className="w-24">Hạn nộp</TableHead>
                        <TableHead className="w-24">Hoàn thành</TableHead>
                        <TableHead className="w-20">Điểm QC</TableHead>
                        <TableHead className="max-w-[200px]">Ghi chú bàn giao</TableHead>
                        <TableHead className="w-24 text-right pr-4">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasksToDisplay.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center py-8 text-muted-foreground text-xs">
                            Không có công việc nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasksToDisplay.map((task) => {
                          const isOverdue = task.status !== "done" && task.status !== "cancelled" && task.due_date && new Date(task.due_date) < new Date();
                          return (
                            <TableRow 
                              key={task.id} 
                              className="text-xs hover:bg-muted/20 transition-all cursor-pointer group/row"
                              onClick={() => setActiveDetailTaskId(task.id)}
                            >
                              <TableCell className="font-mono text-[10px] text-muted-foreground pl-4">{task.id}</TableCell>
                              <TableCell className="font-semibold text-foreground group-hover/row:text-primary transition-all">
                                <div>{task.title}</div>
                                {task.description && (
                                  <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 font-normal">{task.description}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                {task.project_id && projects ? (
                                  <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary font-medium">
                                    {projects.find(p => p.id === task.project_id)?.code || "PRJ"}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-foreground">
                                {members.find(m => m.id === task.assigned_to)?.name || "Chưa giao"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {task.assigned_by === "local-demo-user" || task.assigned_by === "system" ? "Quản lý / Admin" : task.assigned_by || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "text-[9px] px-1 py-0 capitalize border",
                                  task.priority === "urgent" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                  task.priority === "high" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                  task.priority === "normal" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                  "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                )}>
                                  {priorityLabels[task.priority] || task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={cn(
                                  "text-[9px] px-1.5 py-0 border font-medium",
                                  task.status === "pending" ? "bg-slate-500/10 text-slate-500 border-slate-500/20" :
                                  task.status === "in_progress" || task.status === "accepted" ? "bg-sky-500/10 text-sky-500 border-sky-500/20" :
                                  task.status === "done" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                  "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                )}>
                                  {task.status === "pending" ? "Chờ nhận" :
                                   task.status === "accepted" ? "Đã nhận" :
                                   task.status === "in_progress" ? "Đang làm" :
                                   task.status === "done" ? "Hoàn thành" : "Đã hủy"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-12 bg-muted rounded-full h-1 overflow-hidden shrink-0">
                                    <div className="bg-primary h-full rounded-full" style={{ width: `${task.progress || 0}%` }} />
                                  </div>
                                  <span className="font-mono text-[9px] font-semibold text-foreground">{task.progress || 0}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{task.started_at ? format(new Date(task.started_at), "dd/MM/yyyy") : "—"}</TableCell>
                              <TableCell className={cn("text-muted-foreground", isOverdue && "text-red-500 font-semibold animate-pulse")}>
                                {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{task.completed_at ? format(new Date(task.completed_at), "dd/MM/yyyy") : "—"}</TableCell>
                              <TableCell className="font-mono font-bold text-center text-foreground">
                                {task.quality_score ? `${task.quality_score}/100` : "—"}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-muted-foreground" title={task.completion_notes || undefined}>
                                {task.completion_notes || <span className="text-muted-foreground/50">—</span>}
                              </TableCell>
                              <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-1 justify-end">
                                  {task.status === "pending" && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); acceptTask.mutate(task.id); }}
                                        title="Nhận việc"
                                        className="h-7 w-7 text-primary hover:bg-primary/10"
                                      >
                                        <CheckSquare className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); startTask.mutate(task.id); }}
                                        title="Bắt đầu"
                                        className="h-7 w-7 text-sky-500 hover:bg-sky-500/10"
                                      >
                                        <Play className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  )}
                                  {task.status === "accepted" && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); startTask.mutate(task.id); }}
                                      title="Bắt đầu"
                                      className="h-7 w-7 text-sky-500 hover:bg-sky-500/10"
                                    >
                                      <Play className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {task.status === "in_progress" && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); handleOpenCompleteDialog(task.id); }}
                                      title="Hoàn thành"
                                      className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10"
                                    >
                                      <CheckSquare className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {(task.status === "in_progress" || task.status === "accepted" || task.status === "pending") && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); updateTask.mutate({ id: task.id, status: "cancelled" }); }}
                                      title="Hủy"
                                      className="h-7 w-7 text-red-500 hover:bg-red-500/10"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
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

      {/* Task Creation Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs z-50">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <ClipboardList className="h-4.5 w-4.5 text-primary" /> Phân công công việc mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Giao việc và thiết lập thời hạn cho nhân sự trong công ty.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="font-semibold text-xs">Tiêu đề công việc *</Label>
              <Input 
                className="h-8.5 text-xs bg-background" 
                placeholder="Nhập tiêu đề công việc..." 
                value={newTaskTitle} 
                onChange={e => setNewTaskTitle(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-xs">Mô tả công việc</Label>
              <Textarea 
                className="min-h-16 text-xs bg-background" 
                placeholder="Nhập chi tiết yêu cầu công việc..." 
                value={newTaskDesc} 
                onChange={e => setNewTaskDesc(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="font-semibold text-xs">Mức độ ưu tiên</Label>
                <Select value={newTaskPriority} onValueChange={(val: any) => setNewTaskPriority(val)}>
                  <SelectTrigger className="h-8.5 text-xs bg-background">
                    <SelectValue placeholder="Chọn mức ưu tiên..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[60]">
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="normal">Bình thường</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                    <SelectItem value="urgent">Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-xs">Hạn hoàn thành</Label>
                <Input 
                  type="date"
                  className="h-8.5 text-xs bg-background" 
                  value={newTaskDueDate} 
                  onChange={e => setNewTaskDueDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-xs">Dự án liên kết</Label>
              <Select value={newTaskProjectId} onValueChange={setNewTaskProjectId}>
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Chọn dự án liên kết..." />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60] max-h-52">
                  <SelectItem value="none">Không liên kết dự án</SelectItem>
                  {projects?.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      <span className="text-xs">[{proj.code}] {proj.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-xs">Giao cho nhân viên *</Label>
              <Select value={newTaskAssignedTo} onValueChange={setNewTaskAssignedTo}>
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Chọn nhân sự thực hiện..." />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60] max-h-52">
                  <SelectItem value="none">Chưa giao (Để trống)</SelectItem>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <span className="text-xs">{member.name} ({member.email})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setTaskDialogOpen(false)}>Hủy</Button>
              <Button type="submit" size="sm" className="bg-primary text-white hover:bg-primary/90">Tạo công việc</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Completion Notes Dialog */}
      <Dialog open={completionNotesOpen} onOpenChange={setCompletionNotesOpen}>
        <DialogContent className="sm:max-w-[380px] bg-background text-foreground text-xs z-50">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-emerald-500">
              <CheckSquare className="h-4.5 w-4.5" /> Báo cáo hoàn thành công việc
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ghi nhận ghi chú kết quả hoàn thành hoặc kết quả bàn giao.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="font-semibold text-xs">Ghi chú kết quả hoàn thành *</Label>
              <Textarea 
                className="min-h-16 text-xs bg-background" 
                placeholder="Nhập ghi chú hoặc liên kết tài liệu bàn giao..." 
                value={completionNotes} 
                onChange={e => setCompletionNotes(e.target.value)} 
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setCompletionNotesOpen(false)}>Hủy</Button>
              <Button type="button" size="sm" onClick={handleCompleteTaskSubmit} className="bg-emerald-600 text-white hover:bg-emerald-500">
                Xác nhận hoàn thành
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pancake Work Style Task Details Dialog */}
      <Dialog open={!!activeDetailTaskId} onOpenChange={(open) => !open && setActiveDetailTaskId(null)}>
        {activeDetailTask && (
          <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-hidden flex flex-col bg-background text-foreground text-xs p-0 border border-border/80 shadow-2xl z-50 rounded-xl">
            {/* Top Workspace Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <ClipboardList className="h-3 w-3 text-primary" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Không gian làm việc</span>
                  <span>/</span>
                  <span className="text-foreground">{projects?.find(p => p.id === activeDetailTask.project_id)?.name || "Công việc chung"}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] uppercase font-mono tracking-wider border-primary/20 bg-primary/5 text-primary">
                {activeDetailTask.id}
              </Badge>
            </div>

            {/* Main Pane (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Pane - Title, Description, Checklists, Comments */}
              <div className="md:col-span-2 space-y-5">
                <div className="space-y-1.5">
                  <h2 className="text-base font-bold text-foreground leading-snug">{activeDetailTask.title}</h2>
                  {activeDetailTask.description && (
                    <div className="p-3 bg-muted/20 border rounded-lg text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {activeDetailTask.description}
                    </div>
                  )}
                </div>

                {/* Subtask Checklist (Pancake Work standard) */}
                <div className="space-y-3.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4 text-primary" /> Checklist công việc phụ ({detailChecklist.filter(c => c.done).length}/{detailChecklist.length})
                    </h3>
                    {detailChecklist.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-primary">
                        {Math.round((detailChecklist.filter(c => c.done).length / detailChecklist.length) * 100)}% hoàn thành
                      </span>
                    )}
                  </div>

                  {/* Checklist Items list */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {detailChecklist.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/10 border border-border/20 group hover:bg-muted/20 transition-all">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input 
                            type="checkbox" 
                            checked={item.done} 
                            onChange={() => handleToggleSubtask(item.id)}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5" 
                          />
                          <span className={cn("text-[11px]", item.done && "line-through text-muted-foreground")}>{item.text}</span>
                        </label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteSubtask(item.id)}
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {detailChecklist.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic pl-6">Chưa có checklist phụ nào.</p>
                    )}
                  </div>

                  {/* Add Subtask Input Form */}
                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <Input 
                      placeholder="Thêm mục checklist mới..." 
                      className="h-8 text-xs bg-background flex-1" 
                      value={newSubtaskText}
                      onChange={e => setNewSubtaskText(e.target.value)}
                    />
                    <Button type="submit" size="sm" className="h-8 text-xs px-3">Thêm</Button>
                  </form>
                </div>

                {/* Discussion & Comments */}
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    Thảo luận nhóm ({detailComments.length})
                  </h3>

                  {/* Comments Timeline */}
                  <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                    {detailComments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5 items-start text-[11px] leading-relaxed">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 font-bold text-primary text-[10px]">
                          {comment.author.substring(0, 2)}
                        </div>
                        <div className="flex-1 bg-muted/10 border p-2.5 rounded-lg space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span className="font-bold text-foreground">{comment.author}</span>
                            <span>{format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}</span>
                          </div>
                          <p className="text-foreground/90">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    {detailComments.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic text-center py-4">Chưa có bình luận nào.</p>
                    )}
                  </div>

                  {/* Comment Input Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2 items-end">
                    <Textarea 
                      placeholder="Viết bình luận công việc..." 
                      className="min-h-12 text-xs bg-background flex-1 resize-none" 
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                    />
                    <Button type="submit" size="sm" className="h-8.5 text-xs px-4">Gửi</Button>
                  </form>
                </div>
              </div>

              {/* Right Pane - Metadata Side panel */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-4 space-y-4 h-fit">
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider border-b pb-1.5">Thuộc tính</h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">Trạng thái</span>
                    <Badge variant="secondary" className={cn(
                      "text-[10px] px-2 py-0.5 border font-semibold capitalize",
                      activeDetailTask.status === "pending" ? "bg-slate-500/10 text-slate-500 border-slate-500/20" :
                      activeDetailTask.status === "in_progress" || activeDetailTask.status === "accepted" ? "bg-sky-500/10 text-sky-500 border-sky-500/20" :
                      activeDetailTask.status === "done" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                      {activeDetailTask.status === "pending" ? "Chờ nhận" :
                       activeDetailTask.status === "accepted" ? "Đã nhận" :
                       activeDetailTask.status === "in_progress" ? "Đang làm" :
                       activeDetailTask.status === "done" ? "Hoàn thành" : "Đã hủy"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">Độ ưu tiên</span>
                    <Badge className={cn(
                      "text-[10px] px-2 py-0.5 capitalize border",
                      activeDetailTask.priority === "urgent" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      activeDetailTask.priority === "high" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                      activeDetailTask.priority === "normal" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      "bg-slate-500/10 text-slate-500 border-slate-500/20"
                    )}>
                      {priorityLabels[activeDetailTask.priority] || activeDetailTask.priority}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">Người thực hiện</span>
                    <span className="font-semibold text-foreground text-xs">
                      {members.find(m => m.id === activeDetailTask.assigned_to)?.name || "Chưa giao"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">Thời hạn</span>
                    <div className="flex items-center gap-1 text-xs text-foreground font-semibold">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{activeDetailTask.due_date ? format(new Date(activeDetailTask.due_date), "dd/MM/yyyy") : "—"}</span>
                    </div>
                  </div>

                  {activeDetailTask.started_at && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground block font-medium">Bắt đầu lúc</span>
                      <span className="text-foreground text-[11px] font-mono">{format(new Date(activeDetailTask.started_at), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                  )}

                  {activeDetailTask.completed_at && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground block font-medium">Hoàn thành lúc</span>
                      <span className="text-foreground text-[11px] font-mono">{format(new Date(activeDetailTask.completed_at), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                  )}

                  {activeDetailTask.quality_score && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground block font-medium">Điểm đánh giá QC</span>
                      <Badge variant="outline" className="text-emerald-500 font-bold border-emerald-500/20 bg-emerald-500/5 font-mono text-[10px]">
                        {activeDetailTask.quality_score}/100
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Activity Feed */}
                <div className="space-y-2 pt-3.5 border-t border-border/40">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Lịch sử thay đổi</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto text-[10px] pr-1">
                    {detailActivities.slice().reverse().map(act => (
                      <div key={act.id} className="space-y-0.5 border-l-2 border-primary/20 pl-2 py-0.5">
                        <p className="text-foreground/90">{act.text}</p>
                        <span className="text-[8px] text-muted-foreground block font-mono">
                          {format(new Date(act.createdAt), "dd/MM HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="px-5 py-3.5 bg-muted/30 border-t border-border/60 shrink-0">
              <Button type="button" size="sm" variant="outline" onClick={() => setActiveDetailTaskId(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  FolderKanban, 
  Activity, 
  Sparkles, 
  ChevronLeft, 
  Printer, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  User, 
  TrendingDown, 
  Star,
  CheckSquare,
  FileText,
  AlertCircle,
  Check,
  Clock,
  ExternalLink,
  ChevronRight,
  Edit3,
  Paperclip,
  MessageSquare,
  Download,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Interface definitions
interface ProjectSummary {
  id: number;
  name: string;
  manager: string;
  stage: string;
  plannedProgress: number;
  actualProgress: number;
  diff: number;
  customersCount: number;
  revenue: number; // in Million VND
  partnersCount: number;
  debt: number; // in Million VND
  requiredStaff: number;
  currentStaff: number;
  risk: "Thấp" | "Trung bình" | "Cao";
  health: "Tốt" | "Ổn định" | "Cần theo dõi" | "Cảnh báo";
  priority: "Cao" | "Trung bình" | "Thấp";
  lastActionDate: string;
}

// Data for 9 projects matching the dashboard image
const PROJECTS_DATA: ProjectSummary[] = [
  {
    id: 1,
    name: "Bảo vệ Nam Thiên Long",
    manager: "Anh Minh",
    stage: "Triển khai",
    plannedProgress: 85,
    actualProgress: 78,
    diff: -7,
    customersCount: 12,
    revenue: 1250,
    partnersCount: 6,
    debt: 320,
    requiredStaff: 45,
    currentStaff: 39,
    risk: "Trung bình",
    health: "Cần theo dõi",
    priority: "Cao",
    lastActionDate: "18/07/2026"
  },
  {
    id: 2,
    name: "An ninh Công nghệ",
    manager: "Chị Lan",
    stage: "Setup hệ thống",
    plannedProgress: 80,
    actualProgress: 74,
    diff: -6,
    customersCount: 8,
    revenue: 980,
    partnersCount: 5,
    debt: 210,
    requiredStaff: 22,
    currentStaff: 20,
    risk: "Trung bình",
    health: "Ổn định",
    priority: "Cao",
    lastActionDate: "17/07/2026"
  },
  {
    id: 3,
    name: "Spa Queency",
    manager: "Chị Hương",
    stage: "Khai trương pilot",
    plannedProgress: 70,
    actualProgress: 68,
    diff: -2,
    customersCount: 15,
    revenue: 1420,
    partnersCount: 7,
    debt: 280,
    requiredStaff: 30,
    currentStaff: 28,
    risk: "Thấp",
    health: "Tốt",
    priority: "Trung bình",
    lastActionDate: "20/07/2026"
  },
  {
    id: 4,
    name: "Life Care",
    manager: "Anh Phúc",
    stage: "Chuẩn hóa vận hành",
    plannedProgress: 75,
    actualProgress: 71,
    diff: -4,
    customersCount: 10,
    revenue: 1080,
    partnersCount: 4,
    debt: 260,
    requiredStaff: 26,
    currentStaff: 22,
    risk: "Trung bình",
    health: "Cần theo dõi",
    priority: "Trung bình",
    lastActionDate: "19/07/2026"
  },
  {
    id: 5,
    name: "Phở Cô Ba Sài Gòn",
    manager: "Anh Dũng",
    stage: "Mở điểm mới",
    plannedProgress: 88,
    actualProgress: 82,
    diff: -6,
    customersCount: 20,
    revenue: 1860,
    partnersCount: 9,
    debt: 450,
    requiredStaff: 38,
    currentStaff: 34,
    risk: "Cao",
    health: "Cảnh báo",
    priority: "Cao",
    lastActionDate: "16/07/2026"
  },
  {
    id: 6,
    name: "Cà phê Aroma",
    manager: "Chị Vy",
    stage: "Tối ưu mô hình",
    plannedProgress: 82,
    actualProgress: 79,
    diff: -3,
    customersCount: 18,
    revenue: 1540,
    partnersCount: 8,
    debt: 390,
    requiredStaff: 32,
    currentStaff: 30,
    risk: "Thấp",
    health: "Tốt",
    priority: "Trung bình",
    lastActionDate: "22/07/2026"
  },
  {
    id: 7,
    name: "Silver Ion",
    manager: "Anh Khoa",
    stage: "Phát triển đại lý",
    plannedProgress: 76,
    actualProgress: 69,
    diff: -7,
    customersCount: 11,
    revenue: 920,
    partnersCount: 12,
    debt: 510,
    requiredStaff: 20,
    currentStaff: 17,
    risk: "Cao",
    health: "Cảnh báo",
    priority: "Cao",
    lastActionDate: "15/07/2026"
  },
  {
    id: 8,
    name: "Queency KLT",
    manager: "Chị Mai",
    stage: "Mở rộng khu vực",
    plannedProgress: 72,
    actualProgress: 70,
    diff: -2,
    customersCount: 9,
    revenue: 760,
    partnersCount: 10,
    debt: 360,
    requiredStaff: 18,
    currentStaff: 16,
    risk: "Trung bình",
    health: "Ổn định",
    priority: "Trung bình",
    lastActionDate: "21/07/2026"
  },
  {
    id: 9,
    name: "Bách Hóa Thông Minh",
    manager: "Anh Nam",
    stage: "Chuẩn bị khai trương",
    plannedProgress: 65,
    actualProgress: 58,
    diff: -7,
    customersCount: 6,
    revenue: 2670,
    partnersCount: 14,
    debt: 480,
    requiredStaff: 54,
    currentStaff: 47,
    risk: "Cao",
    health: "Cảnh báo",
    priority: "Cao",
    lastActionDate: "14/07/2026"
  }
];

// Interface for Detailed Report Data
interface DetailedReport {
  week: string;
  dateRange: string;
  creator: string;
  createdDate: string;
  projectFullName: string;
  projectOwner: string;
  reportedBy: string;
  role: string;
  plannedProgress: number;
  actualProgress: number;
  diff: number;
  completedTasksCount: number;
  totalTasksCount: number;
  tasksList: Array<{
    id: number;
    name: string;
    planned: number;
    actual: number;
    diff: number;
    status: string;
    notes: string;
  }>;
  businessResults: {
    revenue: number;
    cost: number;
    profit: number;
    receivable: number;
    payable: number;
    cashflow: number;
  };
  staffing: {
    required: number;
    current: number;
    diff: number;
    departments: Array<{
      name: string;
      required: number;
      current: number;
      diff: number;
    }>;
  };
  completedHighlights: string[];
  nextWeekPlan: string[];
  risksList: Array<{
    id: number;
    issue: string;
    level: "Thấp" | "Trung bình" | "Cao";
    impact: string;
    mitigation: string;
    owner: string;
    deadline: string;
  }>;
  boardApprovals: string[];
  evaluation: {
    status: "Chưa đạt" | "Đạt kế hoạch" | "Vượt kế hoạch";
    score: number; // stars out of 5
  };
  milestones: Array<{
    id: number;
    event: string;
    time: string;
    notes: string;
  }>;
  approvals: {
    creator: string;
    supervisor: string;
    owner: string;
    board: string;
  };
}

// Generate Detailed Report for each project
const getDetailedReport = (projectId: number): DetailedReport => {
  const p = PROJECTS_DATA.find(item => item.id === projectId) || PROJECTS_DATA[5];
  
  // Specific data for "Cà phê Aroma" (Aroma Coffee)
  if (p.id === 6) {
    return {
      week: "29/2026",
      dateRange: "14/07/2026 đến 20/07/2026",
      creator: "Nguyễn Minh Khoa",
      createdDate: "20/07/2026",
      projectFullName: "Chuỗi Cà phê Aroma - Mô hình Trung",
      projectOwner: "Trần Quốc Huy",
      reportedBy: "Nguyễn Minh Khoa",
      role: "PM Vận hành",
      plannedProgress: 78,
      actualProgress: 72,
      diff: -6,
      completedTasksCount: 8,
      totalTasksCount: 11,
      tasksList: [
        { id: 1, name: "Hoàn thiện layout cửa hàng", planned: 100, actual: 100, diff: 0, status: "Đã hoàn tất", notes: "Đã nghiệm thu phần thô" },
        { id: 2, name: "Tuyển dụng nhân sự", planned: 80, actual: 70, diff: -10, status: "Thiếu 3 vị trí", notes: "Thiếu 1 Barista, 2 Phục vụ" },
        { id: 3, name: "Đào tạo barista & phục vụ", planned: 60, actual: 50, diff: -10, status: "Chưa đủ ca mẫu", notes: "Cần thêm 3 ngày ca chạy thử" },
        { id: 4, name: "Setup POS / QR / máy in", planned: 90, actual: 85, diff: -5, status: "Chờ test cuối", notes: "Chờ kết nối API ngân hàng" },
        { id: 5, name: "Chuẩn hóa menu & giá bán", planned: 70, actual: 55, diff: -15, status: "Chờ duyệt cuối", notes: "Chờ duyệt chiết khấu combo" }
      ],
      businessResults: {
        revenue: 485,
        cost: 372,
        profit: 113,
        receivable: 28,
        payable: 46,
        cashflow: 22
      },
      staffing: {
        required: 12,
        current: 9,
        diff: -3,
        departments: [
          { name: "Quản lý", required: 1, current: 1, diff: 0 },
          { name: "Pha chế", required: 4, current: 3, diff: -1 },
          { name: "Phục vụ", required: 5, current: 4, diff: -1 },
          { name: "Thu ngân / Kho", required: 2, current: 1, diff: -1 }
        ]
      },
      completedHighlights: [
        "Hoàn thiện thiết kế khu quầy và biển menu.",
        "Nhập 80% thiết bị quầy pha chế.",
        "Chốt danh mục nguyên liệu chính.",
        "Hoàn tất checklist mặt bằng giai đoạn 1."
      ],
      nextWeekPlan: [
        "Tuyển đủ 3 nhân sự còn thiếu.",
        "Test POS, QR và quy trình bán hàng.",
        "Đào tạo ca mẫu cho barista và phục vụ.",
        "Duyệt cuối biển hiệu và lịch khai trương mềm."
      ],
      risksList: [
        { id: 1, issue: "Chậm tuyển barista", level: "Trung bình", impact: "Ảnh hưởng tiến độ đào tạo", mitigation: "Mở thêm nguồn tuyển tuyển dụng gấp", owner: "HR / Vận hành", deadline: "18/07" },
        { id: 2, issue: "POS chưa kết nối ví QR", level: "Cao", impact: "Ảnh hưởng thanh toán", mitigation: "Làm việc với NCC để test lại API", owner: "IT / POS", deadline: "17/07" },
        { id: 3, issue: "Chưa chốt biển hiệu mặt tiền", level: "Thấp", impact: "Ảnh hưởng hình ảnh khai trương", mitigation: "Duyệt mẫu thiết kế cuối cùng", owner: "Marketing", deadline: "19/07" }
      ],
      boardApprovals: [
        "Phê duyệt ngân sách biển hiệu 35 Tr.",
        "Chốt chương trình khai trương mềm.",
        "Hỗ trợ đàm phán NCC cà phê hạt.",
        "Xác nhận KPI cửa hàng pilot."
      ],
      evaluation: {
        status: "Chưa đạt",
        score: 3
      },
      milestones: [
        { id: 1, event: "Test POS và in hóa đơn mẫu", time: "17/07/2026", notes: "Chờ nhà cung cấp xác nhận" },
        { id: 2, event: "Phỏng vấn barista vòng 2", time: "18/07/2026", notes: "HR phối hợp bộ phận vận hành" },
        { id: 3, event: "Soft opening nội bộ", time: "20/07/2026", notes: "Dự kiến đón 30 khách mời thử" }
      ],
      approvals: {
        creator: "Nguyễn Minh Khoa",
        supervisor: "Lê Anh Tuấn",
        owner: "Trần Quốc Huy",
        board: "Chờ duyệt"
      }
    };
  }

  // Generative default detailed data for other projects
  return {
    week: "29/2026",
    dateRange: "14/07/2026 đến 20/07/2026",
    creator: "Nguyễn Minh Khoa",
    createdDate: "20/07/2026",
    projectFullName: `${p.name} - Phân khúc ${p.stage}`,
    projectOwner: p.manager,
    reportedBy: "Nguyễn Minh Khoa",
    role: "PM Dự án",
    plannedProgress: p.plannedProgress,
    actualProgress: p.actualProgress,
    diff: p.diff,
    completedTasksCount: Math.round(10 * (p.actualProgress / 100)),
    totalTasksCount: 10,
    tasksList: [
      { id: 1, name: "Khảo sát và lập quy hoạch", planned: 100, actual: 100, diff: 0, status: "Đã hoàn tất", notes: "Đầy đủ tài liệu bàn giao" },
      { id: 2, name: "Thiết kế kiến trúc chi tiết", planned: 100, actual: 95, diff: -5, status: "Gần hoàn thành", notes: "Đang sửa đổi bản vẽ cuối" },
      { id: 3, name: "Mua sắm trang thiết bị", planned: 80, actual: 70, diff: -10, status: "Chậm tiến độ", notes: "Do khâu logistics chậm" },
      { id: 4, name: "Triển khai lắp đặt thử nghiệm", planned: p.plannedProgress, actual: p.actualProgress, diff: p.diff, status: "Đang tiến hành", notes: "Theo sát thực tế" }
    ],
    businessResults: {
      revenue: p.revenue,
      cost: Math.round(p.revenue * 0.8),
      profit: Math.round(p.revenue * 0.2),
      receivable: Math.round(p.debt * 0.4),
      payable: Math.round(p.debt * 0.6),
      cashflow: Math.round(p.revenue * 0.15)
    },
    staffing: {
      required: p.requiredStaff,
      current: p.currentStaff,
      diff: p.currentStaff - p.requiredStaff,
      departments: [
        { name: "Vận hành", required: Math.round(p.requiredStaff * 0.5), current: Math.round(p.currentStaff * 0.5), diff: Math.round(p.currentStaff * 0.5) - Math.round(p.requiredStaff * 0.5) },
        { name: "Kỹ thuật", required: Math.round(p.requiredStaff * 0.3), current: Math.round(p.currentStaff * 0.3), diff: Math.round(p.currentStaff * 0.3) - Math.round(p.requiredStaff * 0.3) },
        { name: "Kinh doanh", required: Math.round(p.requiredStaff * 0.2), current: Math.round(p.currentStaff * 0.2), diff: Math.round(p.currentStaff * 0.2) - Math.round(p.requiredStaff * 0.2) }
      ]
    },
    completedHighlights: [
      "Khảo sát thực địa và phê duyệt thiết kế cơ sở.",
      "Thống nhất danh mục ngân sách và kế hoạch sử dụng vốn.",
      "Ký kết hợp đồng nguyên tắc với nhà cung cấp chính."
    ],
    nextWeekPlan: [
      "Giải quyết điểm nghẽn về nhân sự triển khai dự án.",
      "Thực hiện chạy thử nghiệm hệ thống giai đoạn 1.",
      "Báo cáo sơ bộ hiệu quả và tối ưu chi phí."
    ],
    risksList: [
      { id: 1, issue: "Chậm tiến độ nhân sự", level: p.risk, impact: "Trễ hạn bàn giao", mitigation: "Điều động nhân sự nội bộ hỗ trợ chéo", owner: p.manager, deadline: "20/07" }
    ],
    boardApprovals: [
      "Phê duyệt tăng ngân sách dự phòng 10%.",
      "Chốt thời hạn kiểm toán giai đoạn 1."
    ],
    evaluation: {
      status: p.health === "Tốt" ? "Vượt kế hoạch" : p.health === "Cảnh báo" ? "Chưa đạt" : "Đạt kế hoạch",
      score: p.health === "Tốt" ? 5 : p.health === "Cảnh báo" ? 2 : 4
    },
    milestones: [
      { id: 1, event: "Kiểm tra nghiệm thu giai đoạn 1", time: p.lastActionDate, notes: "Đại diện ban giám đốc tham gia" }
    ],
    approvals: {
      creator: "Nguyễn Minh Khoa",
      supervisor: "Lê Anh Tuấn",
      owner: p.manager,
      board: p.health === "Tốt" ? "Đã duyệt" : "Chờ duyệt"
    }
  };
};

interface Subtask {
  label: string;
  done: boolean;
  priority: "Cao" | "Trung bình" | "Thấp";
  assignee: string;
  date?: string;
}

interface ActivityLog {
  time: string;
  user: string;
  action: "complete" | "update" | "attach" | "comment";
  text: string;
}

interface TaskDeepDetail {
  name: string;
  owner: string;
  duration: string;
  daysPassed: number;
  totalDays: number;
  budget: number;
  spent: number;
  subtasks: Subtask[];
  logs: ActivityLog[];
  wikiLink?: string;
  wikiName?: string;
  attachments?: Array<{ name: string; size: string; type: string }>;
}

const getTaskDeepDetails = (taskName: string): TaskDeepDetail => {
  switch (taskName) {
    case "Hoàn thiện layout cửa hàng":
      return {
        name: "Hoàn thiện layout cửa hàng",
        owner: "Trần Quốc Huy",
        duration: "05/07/2026 - 15/07/2026",
        daysPassed: 10,
        totalDays: 10,
        budget: 150,
        spent: 142,
        subtasks: [
          { label: "Khảo sát hiện trạng mặt bằng", done: true, priority: "Cao", assignee: "Trần Quốc Huy", date: "06/07" },
          { label: "Thiết kế phối cảnh 3D nội ngoại thất", done: true, priority: "Cao", assignee: "Nguyễn Thu Thảo", date: "09/07" },
          { label: "Lắp đặt hệ thống điện nước quầy bar", done: true, priority: "Cao", assignee: "Trần Quốc Huy", date: "12/07" },
          { label: "Sơn sửa tường, lắp ráp khung gỗ", done: true, priority: "Trung bình", assignee: "Nguyễn Văn Hùng", date: "14/07" },
          { label: "Nghiệm thu bàn giao phần thô & vệ sinh công nghiệp", done: true, priority: "Thấp", assignee: "Trần Quốc Huy", date: "15/07" }
        ],
        logs: [
          { time: "15/07/2026 16:30", user: "Trần Quốc Huy", action: "complete", text: "Đã duyệt biên bản nghiệm thu bàn giao mặt bằng phần thô." },
          { time: "14/07/2026 11:00", user: "Nguyễn Minh Khoa", action: "attach", text: "Tải lên tài liệu thiết kế và ảnh bàn giao thực địa." },
          { time: "12/07/2026 09:30", user: "Trần Quốc Huy", action: "update", text: "Cập nhật tiến độ thi công điện nước bar đạt 100%." }
        ],
        wikiLink: "/docs/wiki/03_Technical_Docs/TECH-003-dynamic-warranty.md",
        wikiName: "TECH-003-dynamic-warranty.md",
        attachments: [
          { name: "phoi_canh_3d_aroma.pdf", size: "4.8 MB", type: "pdf" },
          { name: "bien_ban_nghiem_thu_tho.docx", size: "1.2 MB", type: "doc" }
        ]
      };
    case "Tuyển dụng nhân sự":
      return {
        name: "Tuyển dụng nhân sự",
        owner: "Lê Minh Anh",
        duration: "08/07/2026 - 18/07/2026",
        daysPassed: 8,
        totalDays: 10,
        budget: 15,
        spent: 12,
        subtasks: [
          { label: "Đăng tin tuyển dụng trên các hội nhóm & fanpage", done: true, priority: "Cao", assignee: "Lê Minh Anh", date: "09/07" },
          { label: "Lọc hồ sơ và xếp lịch phỏng vấn sơ loại", done: true, priority: "Cao", assignee: "Lê Minh Anh", date: "12/07" },
          { label: "Phỏng vấn Barista vòng 2 (Tuyển 3/4)", done: false, priority: "Cao", assignee: "Nguyễn Minh Khoa" },
          { label: "Phỏng vấn Phục vụ (Tuyển 3/5)", done: false, priority: "Trung bình", assignee: "Lê Minh Anh" },
          { label: "Phỏng vấn Thu ngân / Kho (Tuyển 1/2)", done: false, priority: "Trung bình", assignee: "Lê Minh Anh" }
        ],
        logs: [
          { time: "16/07/2026 14:20", user: "Lê Minh Anh", action: "comment", text: "Hồ sơ barista chất lượng cao hơi ít, đã mở thêm nguồn tin tuyển dụng trả phí." },
          { time: "12/07/2026 09:00", user: "Lê Minh Anh", action: "complete", text: "Hoàn tất chọn lọc 15 hồ sơ ứng viên vòng 1." }
        ],
        wikiLink: "/docs/wiki/02_Refined_Specs/SPEC-001-memberships-wallet.md",
        wikiName: "SPEC-001-memberships-wallet.md",
        attachments: [
          { name: "danh_sach_ung_vien_loc_v1.xlsx", size: "2.4 MB", type: "xlsx" }
        ]
      };
    case "Đào tạo barista & phục vụ":
      return {
        name: "Đào tạo barista & phục vụ",
        owner: "Nguyễn Minh Khoa",
        duration: "12/07/2026 - 20/07/2026",
        daysPassed: 4,
        totalDays: 8,
        budget: 20,
        spent: 8,
        subtasks: [
          { label: "Soạn giáo trình đào tạo menu đồ uống", done: true, priority: "Cao", assignee: "Nguyễn Minh Khoa", date: "12/07" },
          { label: "Đào tạo lý thuyết nội quy & quy chuẩn phục vụ", done: true, priority: "Trung bình", assignee: "Nguyễn Minh Khoa", date: "14/07" },
          { label: "Thực hành pha chế công thức chuẩn (Đạt 80%)", done: false, priority: "Cao", assignee: "Trần Quốc Huy" },
          { label: "Chạy ca thử nghiệm mô phỏng (Soft-run)", done: false, priority: "Cao", assignee: "Nguyễn Minh Khoa" }
        ],
        logs: [
          { time: "16/07/2026 10:00", user: "Nguyễn Minh Khoa", action: "update", text: "Trì hoãn buổi soft-run do chưa tuyển đủ nhân sự barista đứng quầy." },
          { time: "14/07/2026 15:30", user: "Nguyễn Minh Khoa", action: "complete", text: "Đã hoàn thành đào tạo lý thuyết phục vụ cho 4 nhân sự phục vụ." }
        ],
        wikiLink: "/docs/wiki/03_Technical_Docs/TECH-001-memberships-wallet.md",
        wikiName: "TECH-001-memberships-wallet.md",
        attachments: [
          { name: "giao_trinh_pha_che_aroma_v2.pdf", size: "8.5 MB", type: "pdf" }
        ]
      };
    case "Setup POS / QR / máy in":
      return {
        name: "Setup POS / QR / máy in",
        owner: "Nguyễn Hoàng Long",
        duration: "10/07/2026 - 17/07/2026",
        daysPassed: 7,
        totalDays: 7,
        budget: 35,
        spent: 34,
        subtasks: [
          { label: "Khảo sát vị trí, đi dây mạng LAN & cấp nguồn quầy", done: true, priority: "Cao", assignee: "Nguyễn Hoàng Long", date: "11/07" },
          { label: "Lắp đặt phần cứng máy POS và cài đặt phần mềm ERP Mini", done: true, priority: "Cao", assignee: "Nguyễn Hoàng Long", date: "13/07" },
          { label: "Lắp đặt và test kết nối máy in hóa đơn/máy in tem", done: true, priority: "Trung bình", assignee: "Nguyễn Hoàng Long", date: "14/07" },
          { label: "Cấu hình cổng QR thanh toán động tích hợp Casso", done: false, priority: "Cao", assignee: "Nguyễn Hoàng Long" },
          { label: "Kiểm tra in thử hóa đơn thực tế và chốt ca", done: false, priority: "Trung bình", assignee: "Nguyễn Hoàng Long" }
        ],
        logs: [
          { time: "17/07/2026 08:30", user: "Nguyễn Hoàng Long", action: "comment", text: "Đã cài đặt xong app. Đang chờ kết nối API ví thành viên và ngân hàng." },
          { time: "14/07/2026 16:00", user: "Nguyễn Hoàng Long", action: "complete", text: "Máy in tem nhiệt đã được bàn giao và hoạt động tốt." }
        ],
        wikiLink: "/docs/wiki/03_Technical_Docs/TECH-002-event-bus.md",
        wikiName: "TECH-002-event-bus.md",
        attachments: [
          { name: "huong_dan_su_dung_pos_mini.pdf", size: "1.8 MB", type: "pdf" }
        ]
      };
    case "Chuẩn hóa menu & giá bán":
      return {
        name: "Chuẩn hóa menu & giá bán",
        owner: "Trần Quốc Huy",
        duration: "05/07/2026 - 16/07/2026",
        daysPassed: 11,
        totalDays: 11,
        budget: 10,
        spent: 9.5,
        subtasks: [
          { label: "Xác định danh mục đồ uống và định lượng pha chế", done: true, priority: "Cao", assignee: "Trần Quốc Huy", date: "06/07" },
          { label: "Tính toán giá vốn nguyên liệu và biên lợi nhuận gộp", done: true, priority: "Cao", assignee: "Nguyễn Thu Thảo", date: "08/07" },
          { label: "Dự thảo bảng giá bán lẻ đề xuất", done: true, priority: "Cao", assignee: "Trần Quốc Huy", date: "10/07" },
          { label: "Thiết lập cơ chế combo giá sỉ & chiết khấu", done: false, priority: "Trung bình", assignee: "Trần Quốc Huy" },
          { label: "Trình duyệt bảng giá chính thức lên BLĐ", done: false, priority: "Cao", assignee: "Trần Quốc Huy" }
        ],
        logs: [
          { time: "16/07/2026 15:00", user: "Trần Quốc Huy", action: "comment", text: "Đã hoàn thành đề xuất combo ưu đãi kèm bảng chiết khấu." },
          { time: "10/07/2026 09:30", user: "Trần Quốc Huy", action: "complete", text: "Hoàn tất lập biểu giá mẫu thử nghiệm." }
        ],
        wikiLink: "/docs/wiki/02_Refined_Specs/SPEC-004-packing-workflow.md",
        wikiName: "SPEC-004-packing-workflow.md",
        attachments: [
          { name: "bang_gia_de_xuat_combo.xlsx", size: "1.5 MB", type: "xlsx" }
        ]
      };
    default:
      return {
        name: taskName,
        owner: "Nguyễn Minh Khoa",
        duration: "14/07/2026 - 20/07/2026",
        daysPassed: 5,
        totalDays: 10,
        budget: 50,
        spent: 25,
        subtasks: [
          { label: "Khảo sát và lập quy hoạch ban đầu", done: true, priority: "Cao", assignee: "Nguyễn Minh Khoa", date: "14/07" },
          { label: "Triển khai lắp đặt chi tiết", done: false, priority: "Trung bình", assignee: "Nguyễn Minh Khoa" }
        ],
        logs: [
          { time: "15/07/2026 09:00", user: "Nguyễn Minh Khoa", action: "update", text: "Bắt đầu triển khai phân tích và tích hợp." }
        ]
      };
  }
};

interface MetricBreakdownItem {
  name: string;
  value: number;
  percentage: number;
  status?: string;
}

interface MetricListItem {
  code: string;
  name: string;
  value: number | string;
  date: string;
  details: string;
  activities?: Array<{ 
    task: string; 
    progress: number; 
    status: string; 
    log: string;
    duration?: string;
  }>;
  paymentMethod?: string;
  accountOffset?: string;
  reconciler?: string;
  invoiceFile?: string;
  totalHours?: number;
  attendanceToday?: string;
  kpiRating?: string;
  certifications?: string;
}

interface MetricDetail {
  title: string;
  unit: string;
  totalValue: number;
  breakdown: MetricBreakdownItem[];
  list: MetricListItem[];
}

const getMetricDetails = (metricType: string, report: DetailedReport): MetricDetail => {
  switch (metricType) {
    case "revenue":
      return {
        title: "Chi tiết Doanh thu Lũy kế",
        unit: "Tr",
        totalValue: report.businessResults.revenue,
        breakdown: [
          { name: "Doanh thu lẻ quầy", value: Math.round(report.businessResults.revenue * 0.6), percentage: 60 },
          { name: "Doanh thu trực tuyến", value: Math.round(report.businessResults.revenue * 0.35), percentage: 35 },
          { name: "Doanh thu dịch vụ khác", value: Math.round(report.businessResults.revenue * 0.05), percentage: 5 }
        ],
        list: [
          { 
            code: "REV-202607-001", 
            name: "Doanh số bán lẻ quầy (POS Aroma)", 
            value: Math.round(report.businessResults.revenue * 0.6), 
            date: "17/07/2026", 
            details: "Doanh số POS đối soát thực tế",
            paymentMethod: "Tiền mặt & Cà thẻ",
            accountOffset: "Nợ 111 / Có 511",
            reconciler: "Lê Thu Trang (Kế toán)",
            invoiceFile: "INV-POS-0982.pdf"
          },
          { 
            code: "REV-202607-002", 
            name: "Đơn đặt hàng trực tuyến (App/Web)", 
            value: Math.round(report.businessResults.revenue * 0.35), 
            date: "17/07/2026", 
            details: "Thanh toán qua cổng QR động",
            paymentMethod: "VietQR Cổng Casso",
            accountOffset: "Nợ 112 / Có 511",
            reconciler: "Nguyễn Hoàng Long (Thu ngân)",
            invoiceFile: "INV-QR-8871.pdf"
          }
        ]
      };
    case "cost":
      return {
        title: "Chi tiết Chi phí Hoạt động",
        unit: "Tr",
        totalValue: report.businessResults.cost,
        breakdown: [
          { name: "Giá vốn hàng bán (BOM COGS)", value: Math.round(report.businessResults.cost * 0.55), percentage: 55 },
          { name: "Chi phí nhân sự", value: Math.round(report.businessResults.cost * 0.25), percentage: 25 },
          { name: "Chi phí mặt bằng & Khác", value: Math.round(report.businessResults.cost * 0.2), percentage: 20 }
        ],
        list: [
          { 
            code: "COST-202607-001", 
            name: "Mua hạt cà phê Robusta & Arabica", 
            value: Math.round(report.businessResults.cost * 0.55), 
            date: "15/07/2026", 
            details: "Nhập kho nguyên liệu đợt 1",
            paymentMethod: "Chuyển khoản Vietcombank",
            accountOffset: "Nợ 152 / Có 331",
            reconciler: "Lê Thu Trang (Kế toán)",
            invoiceFile: "PNK-CF-0012.pdf"
          },
          { 
            code: "COST-202607-002", 
            name: "Chi phí lương tuần nhân viên", 
            value: Math.round(report.businessResults.cost * 0.25), 
            date: "15/07/2026", 
            details: "Lương tuần ca mẫu & part-time",
            paymentMethod: "Chuyển khoản ngân hàng",
            accountOffset: "Nợ 642 / Có 334",
            reconciler: "Lê Minh Anh (Trưởng nhóm)",
            invoiceFile: "PAYROLL-W3.pdf"
          }
        ]
      };
    case "profit":
      return {
        title: "Chi tiết Lợi nhuận Ròng",
        unit: "Tr",
        totalValue: report.businessResults.profit,
        breakdown: [
          { name: "Biên lợi nhuận gộp", value: Math.round(report.businessResults.revenue - report.businessResults.cost), percentage: 100 },
          { name: "Lợi nhuận ròng thực tế", value: report.businessResults.profit, percentage: 100 }
        ],
        list: [
          { 
            code: "PRF-202607-001", 
            name: "Biên lợi nhuận gộp tạm tính", 
            value: `${Math.round((report.businessResults.profit / (report.businessResults.revenue || 1)) * 100)}%`, 
            date: "17/07/2026", 
            details: "Tính toán dựa trên doanh thu trừ chi phí thực tế",
            paymentMethod: "Đối soát tự động",
            accountOffset: "Tài khoản 911",
            reconciler: "Hệ thống ERP AI",
            invoiceFile: "PROFIT-REPORT.pdf"
          }
        ]
      };
    case "receivable":
      return {
        title: "Chi tiết Công nợ Phải thu",
        unit: "Tr",
        totalValue: report.businessResults.receivable,
        breakdown: [
          { name: "Nợ trong hạn", value: Math.round(report.businessResults.receivable * 0.8), percentage: 80 },
          { name: "Nợ quá hạn", value: Math.round(report.businessResults.receivable * 0.2), percentage: 20 }
        ],
        list: [
          { 
            code: "REC-202607-001", 
            name: "Nợ mua sỉ hạt cafe Aroma", 
            value: Math.round(report.businessResults.receivable * 0.8), 
            date: "16/07/2026", 
            details: "Hóa đơn mua sỉ đại lý Hà Nội",
            paymentMethod: "Chờ thanh toán (30 ngày)",
            accountOffset: "Nợ 131 / Có 511",
            reconciler: "Lê Thu Trang (Kế toán)",
            invoiceFile: "REC-AROMA-001.pdf"
          }
        ]
      };
    case "payable":
      return {
        title: "Chi tiết Công nợ Phải trả",
        unit: "Tr",
        totalValue: report.businessResults.payable,
        breakdown: [
          { name: "Nợ nhà cung cấp thiết bị quầy bar", value: Math.round(report.businessResults.payable * 0.7), percentage: 70 },
          { name: "Nợ nhà cung cấp bao bì, ly cốc", value: Math.round(report.businessResults.payable * 0.3), percentage: 30 }
        ],
        list: [
          { 
            code: "PAY-202607-001", 
            name: "Nhà cung cấp thiết bị bar Tiến Phát", 
            value: Math.round(report.businessResults.payable * 0.7), 
            date: "12/07/2026", 
            details: "Lô máy pha Espresso 2 group",
            paymentMethod: "Chờ thanh toán (Gối đầu)",
            accountOffset: "Nợ 211 / Có 331",
            reconciler: "Lê Thu Trang (Kế toán)",
            invoiceFile: "PAY-TIENPHAT.pdf"
          }
        ]
      };
    case "cashflow":
      return {
        title: "Chi tiết Nhật ký Dòng tiền",
        unit: "Tr",
        totalValue: report.businessResults.cashflow,
        breakdown: [
          { name: "Dòng tiền vào", value: Math.round(report.businessResults.revenue * 0.95), percentage: 95 },
          { name: "Dòng tiền ra", value: -Math.round(report.businessResults.cost * 0.9), percentage: 90 }
        ],
        list: [
          { 
            code: "CASH-IN-01", 
            name: "Tổng dòng tiền mặt & QR chuyển khoản", 
            value: Math.round(report.businessResults.revenue * 0.95), 
            date: "17/07/2026", 
            details: "Đối soát dòng tiền thu từ quầy lẻ",
            paymentMethod: "VietQR & Tiền mặt",
            accountOffset: "Nợ 112 / Có 111",
            reconciler: "Nguyễn Hoàng Long (Thu ngân)",
            invoiceFile: "CASHFLOW-IN.pdf"
          },
          { 
            code: "CASH-OUT-01", 
            name: "Tổng chi thanh toán mua sắm vận hành", 
            value: -Math.round(report.businessResults.cost * 0.9), 
            date: "17/07/2026", 
            details: "Chi tiền nhập hàng và chi phí hành chính",
            paymentMethod: "Chuyển khoản Vietcombank",
            accountOffset: "Nợ 331 / Có 112",
            reconciler: "Lê Thu Trang (Kế toán)",
            invoiceFile: "CASHFLOW-OUT.pdf"
          }
        ]
      };
    case "staffing":
      return {
        title: "Chi tiết Nhân sự & Công việc đang báo cáo",
        unit: "Người",
        totalValue: report.staffing.current,
        breakdown: report.staffing.departments.map(d => ({
          name: `Bộ phận ${d.name}`,
          value: d.current,
          percentage: Math.round((d.current / (report.staffing.current || 1)) * 100)
        })),
        list: [
          {
            code: "NS-001",
            name: "Nguyễn Minh Khoa",
            value: "Quản lý",
            date: "PM Vận hành",
            details: "3 việc tuần này",
            totalHours: 44,
            attendanceToday: "Có mặt (07:55)",
            kpiRating: "4.9/5.0 (Xuất sắc)",
            certifications: "PMP Certified, Quản lý Vận hành F&B Cao cấp",
            activities: [
              { task: "Lập kế hoạch & phối hợp NCC thiết bị", progress: 100, status: "Đã xong", log: "Đã chốt danh sách máy Bar và lịch lắp đặt", duration: "16 giờ" },
              { task: "Nghiệm thu mặt bằng phần thô", progress: 100, status: "Đã xong", log: "Ký nghiệm thu bàn giao với tổng thầu Nam Thiên", duration: "12 giờ" },
              { task: "Giám sát chi phí mua sắm ban đầu", progress: 80, status: "Đang làm", log: "Đang rà soát chi phí phát sinh đường ống nước", duration: "16 giờ" }
            ]
          },
          {
            code: "NS-002",
            name: "Trần Quốc Huy",
            value: "Pha chế",
            date: "Barista chính",
            details: "2 việc tuần này",
            totalHours: 40,
            attendanceToday: "Có mặt (08:00)",
            kpiRating: "4.8/5.0 (Xuất sắc)",
            certifications: "Barista Pro Level 2, Food Safety Cert",
            activities: [
              { task: "Chuẩn hóa menu đồ uống & giá bán lẻ", progress: 90, status: "Đang làm", log: "Đang chốt giá vốn combo sỉ", duration: "20 giờ" },
              { task: "Đào tạo kỹ năng pha chế cho barista mới", progress: 50, status: "Đang làm", log: "Đã xong buổi test lý thuyết công thức", duration: "20 giờ" }
            ]
          },
          {
            code: "NS-003",
            name: "Nguyễn Văn Hùng",
            value: "Pha chế",
            date: "Barista ca chiều",
            details: "2 việc tuần này",
            totalHours: 38,
            attendanceToday: "Vắng mặt (Có phép)",
            kpiRating: "4.2/5.0 (Tốt)",
            certifications: "Barista Basic Certificate",
            activities: [
              { task: "Setup điện nước quầy bar", progress: 100, status: "Đã xong", log: "Đã test thử áp lực đường nước xả và cấp", duration: "18 giờ" },
              { task: "Vệ sinh thiết bị máy pha cà phê", progress: 80, status: "Đang làm", log: "Đang lắp ráp cối xay hạt tự động", duration: "20 giờ" }
            ]
          },
          {
            code: "NS-004",
            name: "Nguyễn Thu Thảo",
            value: "Pha chế",
            date: "Pha chế ca sáng",
            details: "1 việc tuần này",
            totalHours: 40,
            attendanceToday: "Có mặt (07:50)",
            kpiRating: "4.6/5.0 (Tốt)",
            certifications: "An toàn Vệ sinh Thực phẩm Bộ Y Tế",
            activities: [
              { task: "Tính định lượng nguyên vật liệu (BOM)", progress: 100, status: "Đã xong", log: "Đã xuất bảng định lượng nguyên vật liệu mẫu cho 15 món nước uống", duration: "40 giờ" }
            ]
          },
          {
            code: "NS-005",
            name: "Lê Minh Anh",
            value: "Phục vụ",
            date: "Trưởng nhóm phục vụ",
            details: "2 việc tuần này",
            totalHours: 42,
            attendanceToday: "Có mặt (08:05 - Muộn 5p)",
            kpiRating: "4.5/5.0 (Tốt)",
            certifications: "Quản trị Khách sạn & Dịch vụ",
            activities: [
              { task: "Tuyển dụng nhân sự phục vụ", progress: 75, status: "Đang làm", log: "Đã nhận 4 hồ sơ phỏng vấn đạt yêu cầu", duration: "22 giờ" },
              { task: "Soạn nội quy và quy chuẩn phục vụ", progress: 100, status: "Đã xong", log: "Đã in và dán bảng quy trình phục vụ tại phòng nghỉ nhân viên", duration: "20 giờ" }
            ]
          },
          {
            code: "NS-006",
            name: "Phạm Thanh Hải",
            value: "Phục vụ",
            date: "Phục vụ ca chiều",
            details: "1 việc tuần này",
            totalHours: 20,
            attendanceToday: "Có mặt (13:00)",
            kpiRating: "4.0/5.0 (Khá)",
            certifications: "Giao tiếp cơ bản",
            activities: [
              { task: "Lắp ráp bàn ghế khu vực ngoài trời", progress: 100, status: "Đã xong", log: "Đã bày biện đủ 8 bộ bàn ghế theo sơ đồ 3D", duration: "20 giờ" }
            ]
          },
          {
            code: "NS-007",
            name: "Bùi Thị Xuân",
            value: "Phục vụ",
            date: "Phục vụ ca sáng",
            details: "1 việc tuần này",
            totalHours: 24,
            attendanceToday: "Có mặt (07:58)",
            kpiRating: "4.3/5.0 (Tốt)",
            certifications: "Kỹ năng CSKH thực tế",
            activities: [
              { task: "Vệ sinh công nghiệp khu vực đón khách", progress: 100, status: "Đã xong", log: "Đã quét dọn bụi bẩn thi công tầng 1", duration: "24 giờ" }
            ]
          },
          {
            code: "NS-008",
            name: "Hoàng Văn Cường",
            value: "Phục vụ",
            date: "Phục vụ part-time",
            details: "1 việc tuần này",
            totalHours: 16,
            attendanceToday: "Có mặt (08:00)",
            kpiRating: "4.1/5.0 (Khá)",
            certifications: "N/A",
            activities: [
              { task: "Setup khay trà, ly cốc và menu bàn", progress: 90, status: "Đang làm", log: "Đã bày khay trà lên 12 bàn, đang dán mã QR số bàn", duration: "16 giờ" }
            ]
          },
          {
            code: "NS-009",
            name: "Nguyễn Hoàng Long",
            value: "Thu ngân / Kho",
            date: "Thu ngân & Kho",
            details: "2 việc tuần này",
            totalHours: 40,
            attendanceToday: "Có mặt (07:45)",
            kpiRating: "4.7/5.0 (Tốt)",
            certifications: "Chứng chỉ Kế toán Sơ cấp",
            activities: [
              { task: "Lắp đặt máy in hóa đơn và máy POS", progress: 85, status: "Đang làm", log: "Chờ test in thử hóa đơn trên hệ thống ERP Mini", duration: "20 giờ" },
              { task: "Nhập kho nguyên liệu đợt 1", progress: 100, status: "Đã xong", log: "Đã kiểm đếm và xếp kho 50kg cafe Robusta", duration: "20 giờ" }
            ]
          }
        ]
      };
  }
};

interface RiskDetail {
  id: number;
  issue: string;
  level: string;
  impact: string;
  mitigation: string;
  owner: string;
  deadline: string;
  history: Array<{ time: string; status: string; detail: string }>;
}

interface MilestoneDetail {
  id: number;
  event: string;
  time: string;
  notes: string;
  criteria: string[];
  signOffBy: string;
  status: "Chưa đạt" | "Đang tiến hành" | "Đã nghiệm thu";
}

interface SignatureCertificate {
  role: string;
  signee: string;
  time: string;
  ip: string;
  certificateHash: string;
  status: string;
}

const getRiskDetail = (risk: any): RiskDetail => {
  return {
    ...risk,
    history: [
      { time: "16/07/2026 14:00", status: "Cập nhật", detail: `Đã triển khai phương án giảm thiểu: ${risk.mitigation}` },
      { time: "14/07/2026 09:00", status: "Khai báo", detail: `Phát hiện rủi ro: ${risk.issue}. Phân tích mức độ tác động: ${risk.impact}` }
    ]
  };
};

const getMilestoneDetail = (m: any): MilestoneDetail => {
  return {
    ...m,
    criteria: [
      "Kiểm tra tính nhất quán giữa UI và cơ sở dữ liệu",
      "Xác thực qua bộ test Vitest (100% PASS)",
      "Được phê duyệt bởi đại diện bộ phận chuyên môn"
    ],
    signOffBy: "Ban giám đốc ERP",
    status: m.event.includes("Test") || m.event.includes("nghiệm thu") ? "Đã nghiệm thu" : "Đang tiến hành"
  };
};

const getSignatureCert = (role: string, name: string, date: string): SignatureCertificate => {
  return {
    role,
    signee: name,
    time: `${date} 17:30:12 GMT+7`,
    ip: "192.168.1.105",
    certificateHash: `SHA-256: ${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    status: name === "Chờ duyệt" ? "Đang chờ ký số" : "Đã ký số hợp lệ"
  };
};

export function WeeklyReportTab() {
  const [viewMode, setViewMode] = useState<"strategic" | "detailed">("strategic");
  const [selectedProjectId, setSelectedProjectId] = useState<number>(6); // Default: Cà phê Aroma (ID: 6)
  const [activeDetailTask, setActiveDetailTask] = useState<TaskDeepDetail | null>(null);
  const [activeMetricDetail, setActiveMetricDetail] = useState<MetricDetail | null>(null);
  const [activeRiskDetail, setActiveRiskDetail] = useState<RiskDetail | null>(null);
  const [activeMilestoneDetail, setActiveMilestoneDetail] = useState<MilestoneDetail | null>(null);
  const [activeSignatureCert, setActiveSignatureCert] = useState<SignatureCertificate | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  // Store task details in state so users can interactively add logs/comments
  const [tasksDetailsStore, setTasksDetailsStore] = useState<Record<string, TaskDeepDetail>>({});

  const selectedReport = getDetailedReport(selectedProjectId);

  // Retrieve or initialise task detail from store
  const getTaskDetail = (taskName: string): TaskDeepDetail => {
    if (!tasksDetailsStore[taskName]) {
      const initialDetail = getTaskDeepDetails(taskName);
      setTasksDetailsStore(prev => ({ ...prev, [taskName]: initialDetail }));
      return initialDetail;
    }
    return tasksDetailsStore[taskName];
  };

  const handleAddComment = () => {
    if (!newCommentText.trim() || !activeDetailTask) return;

    const timeStr = format(new Date(), "dd/MM/yyyy HH:mm");
    const newLog: ActivityLog = {
      time: timeStr,
      user: "Nguyễn Minh Khoa (PM)",
      action: "comment",
      text: newCommentText.trim()
    };

    const updatedTask = {
      ...activeDetailTask,
      logs: [newLog, ...activeDetailTask.logs]
    };

    setTasksDetailsStore(prev => ({
      ...prev,
      [activeDetailTask.name]: updatedTask
    }));
    setActiveDetailTask(updatedTask);
    setNewCommentText("");
  };

  // Strategic statistics calculated from 9 projects
  const totalProjects = PROJECTS_DATA.length;
  const avgProgress = Math.round(PROJECTS_DATA.reduce((sum, p) => sum + p.actualProgress, 0) / totalProjects);
  const totalRevenue = PROJECTS_DATA.reduce((sum, p) => sum + p.revenue, 0);
  const totalDebt = PROJECTS_DATA.reduce((sum, p) => sum + p.debt, 0);
  const missingStaff = PROJECTS_DATA.reduce((sum, p) => sum + (p.requiredStaff - p.currentStaff), 0);
  const highPriorityCount = PROJECTS_DATA.filter(p => p.priority === "Cao").length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card/65 backdrop-blur-md border rounded-xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            Hệ thống Báo cáo Dự án Hàng tuần
          </h2>
          <p className="text-xs text-muted-foreground">
            {viewMode === "strategic" 
              ? "Dashboard tổng quan chiến lược đa dự án, theo dõi tiến độ, doanh thu và công nợ." 
              : `Chi tiết biểu mẫu báo cáo hàng tuần: ${selectedReport.projectFullName}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "detailed" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("strategic")}
              className="gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại Dashboard
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" /> In Báo Cáo
          </Button>
        </div>
      </div>

      {/* Main Chế độ 1: Dashboard Chiến lược Dự án */}
      {viewMode === "strategic" ? (
        <div className="space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-4 pt-6 text-center space-y-1.5">
                <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-primary" />
                </div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tổng dự án</p>
                <p className="text-2xl font-black text-foreground">{totalProjects}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
              <CardContent className="p-4 pt-6 text-center space-y-1.5">
                <div className="mx-auto w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tiến độ TB</p>
                <p className="text-2xl font-black text-emerald-600">{avgProgress}%</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-sky-500/20 hover:border-sky-500/50 transition-colors">
              <CardContent className="p-4 pt-6 text-center space-y-1.5">
                <div className="mx-auto w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-sky-500" />
                </div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Doanh thu</p>
                <p className="text-2xl font-black text-sky-600">{(totalRevenue / 1000).toFixed(3)} Tr</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-indigo-500/20 hover:border-indigo-500/50 transition-colors">
              <CardContent className="p-4 pt-6 text-center space-y-1.5">
                <div className="mx-auto w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Công nợ</p>
                <p className="text-2xl font-black text-indigo-600">{(totalDebt / 1000).toFixed(3)} Tr</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-rose-500/20 hover:border-rose-500/50 transition-colors">
              <CardContent className="p-4 pt-6 text-center space-y-1.5">
                <div className="mx-auto w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-rose-500" />
                </div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Thiếu nhân sự</p>
                <p className="text-2xl font-black text-rose-600">{missingStaff}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-amber-500/20 hover:border-amber-500/50 transition-colors">
              <CardContent className="p-4 pt-6 text-center space-y-1.5">
                <div className="mx-auto w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ưu tiên cao</p>
                <p className="text-2xl font-black text-amber-600">{highPriorityCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Strategic Projects Table */}
          <Card className="shadow-md bg-card/45 backdrop-blur-sm border-border/80">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    DASHBOARD CHIẾN LƯỢC DỰ ÁN
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Danh sách theo dõi tiến độ chi tiết của tất cả các dự án. Click vào dự án để xem báo cáo tuần cụ thể.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 font-semibold text-muted-foreground/90 select-none">
                      <th className="p-3 text-center w-10">STT</th>
                      <th className="p-3 text-left min-w-[140px]">Tên dự án</th>
                      <th className="p-3 text-left">Chủ dự án</th>
                      <th className="p-3 text-left">Giai đoạn hiện tại</th>
                      <th className="p-3 text-center">Tiến độ KH</th>
                      <th className="p-3 text-center">Tiến độ thực</th>
                      <th className="p-3 text-center">Chênh lệch</th>
                      <th className="p-3 text-center">KH</th>
                      <th className="p-3 text-right">Doanh thu (Tr)</th>
                      <th className="p-3 text-center">Đối tác</th>
                      <th className="p-3 text-right">Công nợ (Tr)</th>
                      <th className="p-3 text-center">NS Cần</th>
                      <th className="p-3 text-center">NS Có</th>
                      <th className="p-3 text-center">Rủi ro</th>
                      <th className="p-3 text-center">Sức khỏe</th>
                      <th className="p-3 text-center">Ưu tiên</th>
                      <th className="p-3 text-center">Mốc xử lý</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROJECTS_DATA.map((p, idx) => (
                      <tr 
                        key={p.id} 
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setViewMode("detailed");
                        }}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="p-3 text-center font-medium text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 font-bold text-foreground hover:text-primary transition-colors">{p.name}</td>
                        <td className="p-3 text-muted-foreground font-medium">{p.manager}</td>
                        <td className="p-3 text-muted-foreground">{p.stage}</td>
                        <td className="p-3 text-center font-semibold text-muted-foreground">{p.plannedProgress}%</td>
                        <td className="p-3">
                          <div className="flex flex-col items-center justify-center gap-1 min-w-[70px]">
                            <span className="font-semibold text-emerald-600">{p.actualProgress}%</span>
                            <div className="w-16 bg-muted rounded-full h-1">
                              <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${p.actualProgress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1 py-0",
                              p.diff >= 0 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                                : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                            )}
                          >
                            {p.diff > 0 ? `+${p.diff}%` : `${p.diff}%`}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-medium text-muted-foreground">{p.customersCount}</td>
                        <td className="p-3 text-right font-semibold text-foreground">{p.revenue.toLocaleString("vi-VN")}</td>
                        <td className="p-3 text-center font-medium text-muted-foreground">{p.partnersCount}</td>
                        <td className="p-3 text-right font-semibold text-foreground">{p.debt.toLocaleString("vi-VN")}</td>
                        <td className="p-3 text-center font-medium text-muted-foreground">{p.requiredStaff}</td>
                        <td className="p-3 text-center font-medium text-muted-foreground">{p.currentStaff}</td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "text-[9px] px-1.5 py-0 font-bold",
                              p.risk === "Cao" && "bg-rose-500/15 text-rose-600 border border-rose-500/20",
                              p.risk === "Trung bình" && "bg-amber-500/15 text-amber-600 border border-amber-500/20",
                              p.risk === "Thấp" && "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                            )}
                          >
                            {p.risk}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <span className="flex items-center justify-center gap-1.5">
                            <span 
                              className={cn(
                                "w-2 h-2 rounded-full",
                                p.health === "Tốt" && "bg-emerald-500",
                                p.health === "Ổn định" && "bg-emerald-500",
                                p.health === "Cần theo dõi" && "bg-amber-500",
                                p.health === "Cảnh báo" && "bg-rose-500"
                              )} 
                            />
                            <span className="font-semibold text-muted-foreground">{p.health}</span>
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0",
                              p.priority === "Cao" && "bg-rose-500/10 text-rose-600 border-rose-500/30",
                              p.priority === "Trung bình" && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                              p.priority === "Thấp" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            )}
                          >
                            {p.priority}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-mono text-[10px] text-muted-foreground">{p.lastActionDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Main Chế độ 2: Biểu mẫu Báo cáo Hàng tuần chi tiết */
        <Card className="shadow-lg bg-card/65 backdrop-blur border-border/80 max-w-6xl mx-auto overflow-hidden">
          {/* Header Báo Cáo */}
          <div className="bg-primary/95 text-primary-foreground p-5 border-b flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5" />
                BIỂU MẪU BÁO CÁO HÀNG TUẦN
              </h2>
              <p className="text-xs text-primary-foreground/80 font-medium">
                Dự án: <span className="underline font-bold">{selectedReport.projectFullName}</span>
              </p>
            </div>
            
            <div className="text-right text-xs space-y-1 min-w-[200px] border-l border-primary-foreground/20 pl-4">
              <p><strong>Tuần:</strong> {selectedReport.week} (Từ {selectedReport.dateRange})</p>
              <p><strong>Người lập:</strong> {selectedReport.creator}</p>
              <p><strong>Ngày lập:</strong> {selectedReport.createdDate}</p>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* I. THÔNG TIN CHUNG */}
              <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
                <h3 className="text-xs font-black uppercase text-primary border-b pb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  I. THÔNG TIN CHUNG
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-muted-foreground">Dự án:</span>
                  <span className="font-semibold">{selectedReport.projectFullName}</span>

                  <span className="text-muted-foreground">Chủ dự án:</span>
                  <span className="font-semibold">{selectedReport.projectOwner}</span>

                  <span className="text-muted-foreground">Báo cáo bởi:</span>
                  <span className="font-semibold">{selectedReport.reportedBy}</span>

                  <span className="text-muted-foreground">Chức danh:</span>
                  <span className="font-semibold">{selectedReport.role}</span>
                </div>
              </div>

              {/* II. TỔNG QUAN TUẦN */}
              <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
                <h3 className="text-xs font-black uppercase text-primary border-b pb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  II. TỔNG QUAN TUẦN
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-muted-foreground">Tiến độ kế hoạch:</span>
                  <span className="font-semibold">{selectedReport.plannedProgress}%</span>

                  <span className="text-muted-foreground">Tiến độ thực tế:</span>
                  <span className="font-semibold text-emerald-600">{selectedReport.actualProgress}%</span>

                  <span className="text-muted-foreground">Chênh lệch:</span>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-bold py-0 w-fit",
                    selectedReport.diff >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                  )}>
                    {selectedReport.diff > 0 ? `+${selectedReport.diff}%` : `${selectedReport.diff}%`}
                  </Badge>

                  <span className="text-muted-foreground">Nhiệm vụ hoàn thành:</span>
                  <span className="font-semibold text-emerald-600">{selectedReport.completedTasksCount} / {selectedReport.totalTasksCount}</span>
                </div>
              </div>
            </div>

            {/* III. TIẾN ĐỘ CÔNG VIỆC */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-primary border-b pb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                III. TIẾN ĐỘ CÔNG VIỆC
              </h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted border-b font-semibold text-muted-foreground">
                      <th className="p-2.5 text-center w-10">STT</th>
                      <th className="p-2.5">Hạng mục / Công việc</th>
                      <th className="p-2.5 text-center">Kế hoạch tuần (%)</th>
                      <th className="p-2.5 text-center">Thực tế tuần (%)</th>
                      <th className="p-2.5 text-center">Chênh lệch</th>
                      <th className="p-2.5 text-center">Trạng thái</th>
                      <th className="p-2.5">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.tasksList.map((task, idx) => (
                      <tr 
                        key={task.id} 
                        onClick={() => setActiveDetailTask(getTaskDetail(task.name))}
                        className="border-b last:border-0 hover:bg-primary/5 cursor-pointer transition-all hover:translate-x-0.5"
                      >
                        <td className="p-2.5 text-center">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-primary flex items-center gap-1.5 hover:underline">
                          {task.name}
                          <ChevronRight className="w-3 h-3 opacity-60" />
                        </td>
                        <td className="p-2.5 text-center">{task.planned}%</td>
                        <td className="p-2.5 text-center font-semibold">{task.actual}%</td>
                        <td className={cn(
                          "p-2.5 text-center font-bold",
                          task.diff >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {task.diff > 0 ? `+${task.diff}%` : `${task.diff}%`}
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0",
                              task.status === "Đã hoàn tất" 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {task.status}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{task.notes}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20 font-bold border-t border-border">
                      <td className="p-2.5 text-center"></td>
                      <td className="p-2.5 text-right">TỔNG CỘNG:</td>
                      <td className="p-2.5 text-center">100%</td>
                      <td className="p-2.5 text-center text-emerald-600">{selectedReport.actualProgress}%</td>
                      <td className="p-2.5 text-center text-rose-600">{selectedReport.diff}%</td>
                      <td className="p-2.5 text-center"></td>
                      <td className="p-2.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* IV. KẾT QUẢ KINH DOANH (LŨY KẾ) */}
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-xs font-black uppercase text-primary border-b pb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  IV. KẾT QUẢ KINH DOANH (LŨY KẾ)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div 
                    className="p-3 bg-muted/20 hover:bg-muted/40 cursor-pointer border rounded-lg flex flex-col justify-center transition-all hover:border-primary/40"
                    onClick={() => setActiveMetricDetail(getMetricDetails("revenue", selectedReport))}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Doanh thu</span>
                    <span className="text-lg font-bold text-foreground">{selectedReport.businessResults.revenue} Tr</span>
                  </div>
                  <div 
                    className="p-3 bg-muted/20 hover:bg-muted/40 cursor-pointer border rounded-lg flex flex-col justify-center transition-all hover:border-primary/40"
                    onClick={() => setActiveMetricDetail(getMetricDetails("cost", selectedReport))}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Chi phí</span>
                    <span className="text-lg font-bold text-rose-600">{selectedReport.businessResults.cost} Tr</span>
                  </div>
                  <div 
                    className="p-3 bg-muted/20 hover:bg-muted/40 cursor-pointer border rounded-lg flex flex-col justify-center transition-all hover:border-primary/40"
                    onClick={() => setActiveMetricDetail(getMetricDetails("profit", selectedReport))}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Lợi nhuận</span>
                    <span className="text-lg font-bold text-emerald-600">{selectedReport.businessResults.profit} Tr</span>
                  </div>
                  <div 
                    className="p-3 bg-muted/20 hover:bg-muted/40 cursor-pointer border rounded-lg flex flex-col justify-center transition-all hover:border-primary/40"
                    onClick={() => setActiveMetricDetail(getMetricDetails("receivable", selectedReport))}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Nợ phải thu</span>
                    <span className="text-lg font-bold text-amber-600">{selectedReport.businessResults.receivable} Tr</span>
                  </div>
                  <div 
                    className="p-3 bg-muted/20 hover:bg-muted/40 cursor-pointer border rounded-lg flex flex-col justify-center transition-all hover:border-primary/40"
                    onClick={() => setActiveMetricDetail(getMetricDetails("payable", selectedReport))}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Nợ phải trả</span>
                    <span className="text-lg font-bold text-rose-600">{selectedReport.businessResults.payable} Tr</span>
                  </div>
                  <div 
                    className="p-3 bg-muted/20 hover:bg-muted/40 cursor-pointer border rounded-lg flex flex-col justify-center transition-all hover:border-primary/40"
                    onClick={() => setActiveMetricDetail(getMetricDetails("cashflow", selectedReport))}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Dòng tiền</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {selectedReport.businessResults.cashflow >= 0 ? `+${selectedReport.businessResults.cashflow}` : selectedReport.businessResults.cashflow} Tr
                    </span>
                  </div>
                </div>
              </div>

              {/* V. NHÂN SỰ */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-primary border-b pb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  V. NHÂN SỰ
                </h3>
                <div 
                  className="space-y-3 bg-muted/10 hover:bg-muted/20 cursor-pointer border rounded-lg p-3 text-xs transition-all hover:border-primary/40"
                  onClick={() => setActiveMetricDetail(getMetricDetails("staffing", selectedReport))}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nhân sự cần có:</span>
                    <span className="font-bold">{selectedReport.staffing.required}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nhân sự hiện có:</span>
                    <span className="font-bold text-primary">{selectedReport.staffing.current}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Thiếu / Thừa:</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-bold px-1.5",
                      selectedReport.staffing.diff >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    )}>
                      {selectedReport.staffing.diff >= 0 ? `Thừa ${selectedReport.staffing.diff}` : `Thiếu ${Math.abs(selectedReport.staffing.diff)}`}
                    </Badge>
                  </div>
                  
                  {/* Department distribution */}
                  <div className="border-t pt-2 space-y-1 text-[11px]">
                    <div className="grid grid-cols-3 font-semibold text-muted-foreground">
                      <span>Bộ phận</span>
                      <span className="text-center">Cần có</span>
                      <span className="text-right">Hiện có</span>
                    </div>
                    {selectedReport.staffing.departments.map((dept, i) => (
                      <div key={i} className="grid grid-cols-3 border-b border-muted last:border-0 py-1">
                        <span className="font-medium text-foreground">{dept.name}</span>
                        <span className="text-center">{dept.required}</span>
                        <span className={cn(
                          "text-right font-bold",
                          dept.diff < 0 ? "text-rose-500" : "text-foreground"
                        )}>{dept.current}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* VI & VII: WORK HIGHLIGHTS AND NEXT PLAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VI. CÔNG VIỆC ĐÃ HOÀN THÀNH */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-emerald-600 border-b pb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  VI. CÔNG VIỆC ĐÃ HOÀN THÀNH
                </h3>
                <ul className="text-xs list-disc list-inside space-y-1.5 text-muted-foreground p-2 pl-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  {selectedReport.completedHighlights.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>

              {/* VII. CÔNG VIỆC CÒN LẠI / KẾ HOẠCH TUẦN TỚI */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-primary border-b pb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  VII. CÔNG VIỆC CÒN LẠI / KẾ HOẠCH TUẦN TỚI
                </h3>
                <ul className="text-xs list-disc list-inside space-y-1.5 text-muted-foreground p-2 pl-3 bg-primary/5 rounded-lg border border-primary/10">
                  {selectedReport.nextWeekPlan.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* VIII. VẤN ĐỀ & RỦI RO */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-rose-600 border-b pb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                VIII. VẤN ĐỀ & RỦI RO
              </h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted border-b font-semibold text-muted-foreground">
                      <th className="p-2.5 text-center w-10">STT</th>
                      <th className="p-2.5">Vấn đề / Rủi ro</th>
                      <th className="p-2.5 text-center">Mức độ</th>
                      <th className="p-2.5">Tác động</th>
                      <th className="p-2.5">Hướng xử lý</th>
                      <th className="p-2.5">Người phụ trách</th>
                      <th className="p-2.5 text-center">Hạn xử lý</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.risksList.map((risk, idx) => (
                      <tr 
                        key={risk.id} 
                        className="border-b last:border-0 hover:bg-primary/5 cursor-pointer transition-all hover:translate-x-0.5"
                        onClick={() => setActiveRiskDetail(getRiskDetail(risk))}
                      >
                        <td className="p-2.5 text-center">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-foreground">{risk.issue}</td>
                        <td className="p-2.5 text-center">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "text-[9px] px-1.5 py-0 font-bold",
                              risk.level === "Cao" && "bg-rose-500/15 text-rose-600 border border-rose-500/20",
                              risk.level === "Trung bình" && "bg-amber-500/15 text-amber-600 border border-amber-500/20",
                              risk.level === "Thấp" && "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                            )}
                          >
                            {risk.level}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{risk.impact}</td>
                        <td className="p-2.5">
                          <div className="bg-primary/5 text-primary p-1.5 rounded text-[10px] font-medium leading-normal border border-primary/10">
                            {risk.mitigation}
                          </div>
                        </td>
                        <td className="p-2.5 font-medium">{risk.owner}</td>
                        <td className="p-2.5 text-center text-muted-foreground font-mono">{risk.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IX & X: APPROVALS NEEDED AND WEEKLY EVALUATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* IX. HỖ TRỢ / PHÊ DUYỆT CẦN TỪ BAN LÃNH ĐẠO */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-amber-600 border-b pb-1.5 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  IX. HỖ TRỢ / PHÊ DUYỆT CẦN TỪ BAN LÃNH ĐẠO
                </h3>
                <ul className="text-xs list-disc list-inside space-y-1.5 text-muted-foreground p-2 pl-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                  {selectedReport.boardApprovals.map((item, idx) => (
                    <li key={idx} className="leading-relaxed font-semibold text-foreground/80">{item}</li>
                  ))}
                </ul>
              </div>

              {/* X. ĐÁNH GIÁ TUẦN */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-primary border-b pb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  X. ĐÁNH GIÁ TUẦN
                </h3>
                <div className="p-4 bg-muted/10 border rounded-lg flex flex-col justify-center items-center space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Kết quả tuần:</span>
                    <Badge className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5",
                      selectedReport.evaluation.status === "Chưa đạt" && "bg-rose-500 text-white",
                      selectedReport.evaluation.status === "Đạt kế hoạch" && "bg-emerald-500 text-white",
                      selectedReport.evaluation.status === "Vượt kế hoạch" && "bg-primary text-white"
                    )}>
                      {selectedReport.evaluation.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Đánh giá chung:</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={cn(
                            "w-4.5 h-4.5",
                            star <= selectedReport.evaluation.score ? "text-amber-500 fill-amber-500" : "text-muted border-muted"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* XI. MỐC & SỰ KIỆN QUAN TRỌNG */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-primary border-b pb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                XI. MỐC & SỰ KIỆN QUAN TRỌNG
              </h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted border-b font-semibold text-muted-foreground">
                      <th className="p-2.5 text-center w-10">STT</th>
                      <th className="p-2.5">Mốc / Sự kiện quan trọng</th>
                      <th className="p-2.5 text-center">Thời gian</th>
                      <th className="p-2.5">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.milestones.map((m, idx) => (
                      <tr 
                        key={m.id} 
                        className="border-b last:border-0 hover:bg-primary/5 cursor-pointer transition-all hover:translate-x-0.5"
                        onClick={() => setActiveMilestoneDetail(getMilestoneDetail(m))}
                      >
                        <td className="p-2.5 text-center">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-foreground">{m.event}</td>
                        <td className="p-2.5 text-center font-semibold text-muted-foreground font-mono">{m.time}</td>
                        <td className="p-2.5 text-muted-foreground italic">{m.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures block */}
            <div className="border-t pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
              <div 
                className="space-y-12 cursor-pointer hover:bg-primary/5 p-2 rounded-xl transition-all border border-transparent hover:border-primary/20"
                onClick={() => setActiveSignatureCert(getSignatureCert("Người lập báo cáo", selectedReport.approvals.creator, selectedReport.createdDate))}
              >
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Người lập báo cáo</p>
                <div className="space-y-0.5">
                  <p className="font-mono text-[10px] text-muted-foreground">20/07/2026</p>
                  <p className="font-bold text-foreground underline decoration-dotted">{selectedReport.approvals.creator}</p>
                </div>
              </div>
              <div 
                className="space-y-12 cursor-pointer hover:bg-primary/5 p-2 rounded-xl transition-all border border-transparent hover:border-primary/20"
                onClick={() => setActiveSignatureCert(getSignatureCert("Quản lý trực tiếp", selectedReport.approvals.supervisor, selectedReport.createdDate))}
              >
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Quản lý trực tiếp</p>
                <div className="space-y-0.5">
                  <p className="font-mono text-[10px] text-muted-foreground">20/07/2026</p>
                  <p className="font-bold text-foreground underline decoration-dotted">{selectedReport.approvals.supervisor}</p>
                </div>
              </div>
              <div 
                className="space-y-12 cursor-pointer hover:bg-primary/5 p-2 rounded-xl transition-all border border-transparent hover:border-primary/20"
                onClick={() => setActiveSignatureCert(getSignatureCert("Chủ dự án", selectedReport.approvals.owner, selectedReport.createdDate))}
              >
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Chủ dự án</p>
                <div className="space-y-0.5">
                  <p className="font-mono text-[10px] text-muted-foreground">20/07/2026</p>
                  <p className="font-bold text-foreground underline decoration-dotted">{selectedReport.approvals.owner}</p>
                </div>
              </div>
              <div 
                className="space-y-12 cursor-pointer hover:bg-primary/5 p-2 rounded-xl transition-all border border-transparent hover:border-primary/20"
                onClick={() => setActiveSignatureCert(getSignatureCert("Ban lãnh đạo", selectedReport.approvals.board, selectedReport.createdDate))}
              >
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Ban lãnh đạo</p>
                <div className="space-y-0.5">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5",
                      selectedReport.approvals.board === "Chờ duyệt" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    )}
                  >
                    {selectedReport.approvals.board}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deep-level Task Details Dialog (M.A.T.R.I.X Premium Feature) */}
      <Dialog open={!!activeDetailTask} onOpenChange={(open) => !open && setActiveDetailTask(null)}>
        {activeDetailTask && (
          <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl p-6">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary font-black uppercase text-[9px] border-primary/20">
                      Task ID: {activeDetailTask.name.replace(/\s+/g, '-').toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border border-amber-500/20 text-[9px] font-bold">
                      Đang xử lý
                    </Badge>
                  </div>
                  <DialogTitle className="text-lg font-black text-foreground uppercase tracking-wide mt-1">
                    {activeDetailTask.name}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            {/* Two-Panel Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
              {/* Left Panel - 70% width */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Subtask Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-muted-foreground">Tiến độ công việc con:</span>
                    <span className="text-primary font-mono">{activeDetailTask.subtasks.filter((s: any) => s.done).length} / {activeDetailTask.subtasks.length} ({Math.round((activeDetailTask.subtasks.filter((s: any) => s.done).length / activeDetailTask.subtasks.length) * 100)}%)</span>
                  </div>
                  <Progress value={Math.round((activeDetailTask.subtasks.filter((s: any) => s.done).length / activeDetailTask.subtasks.length) * 100)} className="h-1.5" />
                </div>

                {/* Subtasks List */}
                <div className="space-y-2">
                  <p className="font-bold text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    Danh sách việc thành phần (Sub-checklist)
                  </p>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {activeDetailTask.subtasks.map((sub: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 bg-muted/20 border border-border/60 rounded-lg hover:bg-muted/30 transition-all">
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center border mt-0.5 shrink-0",
                          sub.done ? "bg-emerald-500 border-emerald-600 text-white" : "border-muted-foreground/30 bg-background"
                        )}>
                          {sub.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className={cn("font-semibold text-foreground", sub.done && "text-muted-foreground line-through")}>
                              {sub.label}
                            </span>
                            {sub.date && (
                              <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 bg-emerald-500/10 text-emerald-600">
                                Hoàn tất {sub.date}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Phụ trách: <strong className="text-foreground/80">{sub.assignee}</strong></span>
                            <span>•</span>
                            <Badge variant="outline" className={cn(
                              "text-[8px] font-bold px-1 py-0",
                              sub.priority === "Cao" ? "border-rose-500/30 text-rose-500 bg-rose-500/5" :
                              sub.priority === "Trung bình" ? "border-amber-500/30 text-amber-500 bg-amber-500/5" :
                              "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                            )}>
                              {sub.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vertical Timeline / Activity Logs */}
                <div className="space-y-3">
                  <p className="font-bold text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Lịch sử hoạt động & Cập nhật kiểm toán
                  </p>
                  <div className="space-y-4 border-l-2 border-indigo-200/50 pl-4 py-1.5 max-h-[180px] overflow-y-auto">
                    {activeDetailTask.logs.map((log: any, i: number) => (
                      <div key={i} className="space-y-1 relative">
                        <span className={cn(
                          "absolute -left-[23.5px] top-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white border border-background",
                          log.action === "complete" ? "bg-emerald-500" :
                          log.action === "update" ? "bg-blue-500" :
                          log.action === "attach" ? "bg-purple-500" : "bg-amber-500"
                        )}>
                          {log.action === "complete" ? <Check className="w-2 h-2" /> :
                           log.action === "update" ? <Edit3 className="w-2 h-2" /> :
                           log.action === "attach" ? <Paperclip className="w-2 h-2" /> :
                           <MessageSquare className="w-2 h-2" />}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span className="font-bold text-foreground/80">{log.user}</span>
                          <span>•</span>
                          <span>{log.time}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{log.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Comment Input */}
                  <div className="flex gap-2 items-center bg-muted/30 border p-2 rounded-lg mt-3">
                    <input 
                      type="text" 
                      placeholder="Viết bình luận hoặc ghi chú kiểm toán..." 
                      className="flex-1 bg-background border px-2.5 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <Button size="sm" onClick={handleAddComment} className="h-7 text-[10px]">
                      Gửi
                    </Button>
                  </div>
                </div>

              </div>

              {/* Right Panel - 30% width */}
              <div className="space-y-5 bg-muted/30 border rounded-xl p-4">
                
                {/* Meta details */}
                <div className="space-y-3 pb-3 border-b border-border/80">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Người phụ trách</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {activeDetailTask.owner.charAt(0)}
                      </div>
                      <span className="font-bold text-foreground">{activeDetailTask.owner}</span>
                    </div>
                  </div>

                  <div className="border-t pt-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Quỹ thời gian</span>
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Đã dùng: {activeDetailTask.daysPassed} / {activeDetailTask.totalDays} ngày</span>
                        <span>{Math.round((activeDetailTask.daysPassed / activeDetailTask.totalDays) * 100)}%</span>
                      </div>
                      <Progress value={Math.round((activeDetailTask.daysPassed / activeDetailTask.totalDays) * 100)} className="h-1 bg-muted" />
                    </div>
                  </div>

                  <div className="border-t pt-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ngân sách dự kiến</span>
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Đã chi: {activeDetailTask.spent} / {activeDetailTask.budget} Tr</span>
                        <span>{Math.round((activeDetailTask.spent / activeDetailTask.budget) * 100)}%</span>
                      </div>
                      <Progress value={Math.round((activeDetailTask.spent / activeDetailTask.budget) * 100)} className="h-1 bg-muted" />
                    </div>
                  </div>
                </div>

                {/* Attachments Section */}
                {activeDetailTask.attachments && activeDetailTask.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-bold text-primary uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Tài liệu đính kèm ({activeDetailTask.attachments.length})
                    </p>
                    <div className="space-y-1.5">
                      {activeDetailTask.attachments.map((file: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-background border rounded-lg hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <div className="overflow-hidden">
                              <p className="font-semibold text-foreground truncate text-[10px]">{file.name}</p>
                              <p className="text-[8px] text-muted-foreground font-mono">{file.size}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Specs & Wiki links */}
                {activeDetailTask.wikiLink && (
                  <div className="border-t pt-3 space-y-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Tài liệu Wiki thiết kế</span>
                    <a 
                      href={activeDetailTask.wikiLink} 
                      className="flex items-center gap-1.5 p-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-primary font-bold transition-all text-left"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span className="truncate">{activeDetailTask.wikiName}</span>
                    </a>
                  </div>
                )}

              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog truy xuất thông tin chi tiết con số (KPI / Kết quả kinh doanh / Nhân sự) */}
      <Dialog open={!!activeMetricDetail} onOpenChange={(open) => !open && setActiveMetricDetail(null)}>
        {activeMetricDetail && (
          <DialogContent className={cn(
            "bg-background/95 backdrop-blur-lg border shadow-2xl rounded-2xl p-6 transition-all duration-300 w-[95vw] md:w-full",
            activeMetricDetail.list.some(item => item.activities) ? "max-w-5xl" : "max-w-2xl"
          )}>
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-lg font-black text-primary flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary animate-pulse" />
                {activeMetricDetail.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Truy xuất chi tiết dữ liệu thời gian thực và các tài liệu chứng từ/tham số liên quan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4 w-full overflow-hidden">
              {/* Thẻ chỉ số tổng */}
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Tổng chỉ số lũy kế</span>
                  <span className="text-3xl font-black text-primary">{activeMetricDetail.totalValue} <span className="text-sm font-medium text-muted-foreground">{activeMetricDetail.unit}</span></span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2.5 py-1 text-xs">
                  Hoạt động ổn định
                </Badge>
              </div>

              {/* Danh sách phân bổ chi tiết (Breakdown) */}
              <div className="space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Phân bổ tỷ trọng / Thành phần</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeMetricDetail.breakdown.map((item, idx) => (
                    <div key={idx} className="p-3 bg-muted/20 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{item.name}</span>
                        <span className="font-bold text-primary">{item.value >= 0 ? `${item.value} ${activeMetricDetail.unit}` : `${item.value} ${activeMetricDetail.unit}`} ({item.percentage}%)</span>
                      </div>
                      <Progress value={Math.abs(item.percentage)} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng chi tiết chứng từ / tham chiếu nguồn */}
              <div className="space-y-2 w-full overflow-hidden">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  {activeMetricDetail.list.some(item => item.activities) ? "Danh sách nhân sự và báo cáo công việc" : "Danh sách chứng từ / Đối tượng gốc"}
                </span>

                {activeMetricDetail.list.some(item => item.activities) ? (
                  <div className="overflow-x-auto border rounded-xl max-h-[50vh] overflow-y-auto w-full max-w-full block">
                    <table className="w-full text-xs text-left min-w-[950px] border-collapse">
                      <thead>
                        <tr className="bg-muted border-b font-semibold text-muted-foreground sticky top-0 z-10 shadow-sm">
                          <th className="p-2.5 bg-muted">Mã NV</th>
                          <th className="p-2.5 bg-muted">Họ tên & Vai trò</th>
                          <th className="p-2.5 bg-muted text-center">Bộ phận</th>
                          <th className="p-2.5 bg-muted text-center">Hôm nay</th>
                          <th className="p-2.5 bg-muted text-center">Tổng giờ</th>
                          <th className="p-2.5 bg-muted text-center">KPI Tuần</th>
                          <th className="p-2.5 bg-muted">Công việc đã báo cáo</th>
                          <th className="p-2.5 bg-muted text-center">Thời lượng</th>
                          <th className="p-2.5 bg-muted text-center">Tiến độ</th>
                          <th className="p-2.5 bg-muted">Nhật ký chi tiết</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeMetricDetail.list.map((item) => {
                          const hasActs = item.activities && item.activities.length > 0;
                          const rowCount = hasActs ? item.activities.length : 1;
                          
                          if (!hasActs) {
                            return (
                              <tr key={item.code} className="border-b hover:bg-muted/5 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-primary">{item.code}</td>
                                <td className="p-2.5 font-semibold text-foreground">
                                  <div>{item.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{item.date}</div>
                                </td>
                                <td className="p-2.5 text-center font-medium text-foreground/80">{item.value}</td>
                                <td className="p-2.5 text-center">
                                  <Badge className={cn(
                                    "text-[8px] font-black px-1.5 py-0",
                                    item.attendanceToday?.includes("Vắng") ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                                  )}>
                                    {item.attendanceToday || "N/A"}
                                  </Badge>
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-foreground">{item.totalHours || 0}h</td>
                                <td className="p-2.5 text-center font-mono font-medium text-foreground/80">{item.kpiRating || "N/A"}</td>
                                <td className="p-2.5 text-muted-foreground italic" colSpan={4}>Không có báo cáo công việc nào được ghi nhận</td>
                              </tr>
                            );
                          }
                          
                          return item.activities.map((act, actIdx) => (
                            <tr key={`${item.code}-${actIdx}`} className="border-b hover:bg-muted/5 transition-colors">
                              {actIdx === 0 && (
                                <>
                                  <td className="p-2.5 font-mono font-bold text-primary align-middle animate-fade-in" rowSpan={rowCount}>{item.code}</td>
                                  <td className="p-2.5 font-semibold text-foreground align-middle" rowSpan={rowCount}>
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-[10px] text-muted-foreground font-normal">{item.date}</div>
                                  </td>
                                  <td className="p-2.5 text-center font-medium text-foreground/80 align-middle" rowSpan={rowCount}>
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-bold">
                                      {item.value}
                                    </Badge>
                                  </td>
                                  <td className="p-2.5 text-center align-middle" rowSpan={rowCount}>
                                    <Badge className={cn(
                                      "text-[8px] font-black px-1.5 py-0",
                                      item.attendanceToday?.includes("Vắng") ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                                    )}>
                                      {item.attendanceToday || "N/A"}
                                    </Badge>
                                  </td>
                                  <td className="p-2.5 text-center font-mono font-bold text-foreground align-middle" rowSpan={rowCount}>{item.totalHours || 0}h</td>
                                  <td className="p-2.5 text-center font-mono font-medium text-primary align-middle" rowSpan={rowCount}>{item.kpiRating || "N/A"}</td>
                                </>
                              )}
                              <td className="p-2.5 font-medium text-foreground/90">{act.task}</td>
                              <td className="p-2.5 text-center font-mono text-muted-foreground">{act.duration}</td>
                              <td className="p-2.5 text-center">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[9px] px-1.5 py-0 font-bold",
                                    act.status === "Đã xong" 
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  )}
                                >
                                  {act.status} ({act.progress}%)
                                </Badge>
                              </td>
                              <td className="p-2.5 text-muted-foreground italic leading-normal font-medium max-w-[280px] break-words">&ldquo;{act.log}&rdquo;</td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg w-full max-w-full block">
                    <table className="w-full text-xs text-left min-w-[750px]">
                      <thead>
                        <tr className="bg-muted border-b font-semibold text-muted-foreground">
                          <th className="p-2.5">Mã đối soát</th>
                          <th className="p-2.5">Nội dung đối soát nguồn</th>
                          <th className="p-2.5 text-center">Phương thức</th>
                          <th className="p-2.5 text-center">TK đối ứng</th>
                          <th className="p-2.5 text-center">Đối soát viên</th>
                          <th className="p-2.5 text-center">Giá trị thực tế</th>
                          <th className="p-2.5 text-center">Ngày ghi nhận</th>
                          <th className="p-2.5 text-center">Tài liệu gốc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeMetricDetail.list.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="p-2.5 font-mono font-bold text-primary">{item.code}</td>
                            <td className="p-2.5">
                              <div className="font-medium text-foreground">{item.name}</div>
                              <div className="text-[10px] text-muted-foreground">{item.details}</div>
                            </td>
                            <td className="p-2.5 text-center font-medium text-foreground/80">{item.paymentMethod || "N/A"}</td>
                            <td className="p-2.5 text-center font-mono text-foreground/75 bg-muted/30 text-[10px]">{item.accountOffset || "N/A"}</td>
                            <td className="p-2.5 text-center font-semibold text-muted-foreground">{item.reconciler || "Hệ thống ERP"}</td>
                            <td className="p-2.5 text-center font-bold text-foreground">
                              {typeof item.value === "number" ? `${item.value} ${activeMetricDetail.unit}` : item.value}
                            </td>
                            <td className="p-2.5 text-center text-muted-foreground font-mono">{item.date}</td>
                            <td className="p-2.5 text-center">
                              {item.invoiceFile ? (
                                <a 
                                  href={`/assets/docs/${item.invoiceFile}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    alert(`Đang truy xuất tệp chứng từ gốc: ${item.invoiceFile}`);
                                  }}
                                  className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-[10px] bg-primary/5 px-2 py-0.5 rounded border border-primary/10"
                                >
                                  <FileText className="w-3 h-3" />
                                  PDF
                                </a>
                              ) : (
                                <span className="text-muted-foreground/45">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog truy xuất chi tiết Vấn đề & Rủi ro */}
      <Dialog open={!!activeRiskDetail} onOpenChange={(open) => !open && setActiveRiskDetail(null)}>
        {activeRiskDetail && (
          <DialogContent className="max-w-md bg-background/95 backdrop-blur-lg border shadow-2xl rounded-2xl p-6">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-lg font-black text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500 animate-bounce" />
                Chi tiết Rủi ro: {activeRiskDetail.issue}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Theo dõi tình trạng rủi ro, phân tích tác động và lịch trình xử lý.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Mức độ rủi ro</span>
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold mt-1">
                    {activeRiskDetail.level}
                  </Badge>
                </div>
                <div className="p-2.5 bg-muted/20 border rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Hạn xử lý</span>
                  <span className="font-mono font-bold block mt-1 text-foreground">{activeRiskDetail.deadline}</span>
                </div>
              </div>

              <div className="p-3 bg-muted/10 border rounded-lg space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Tác động dự án</span>
                <p className="text-foreground font-medium leading-relaxed">{activeRiskDetail.impact}</p>
              </div>

              <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg space-y-1">
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider block">Phương án giảm thiểu</span>
                <p className="text-foreground font-semibold leading-relaxed">{activeRiskDetail.mitigation}</p>
              </div>

              {/* Lịch sử nhật ký cập nhật */}
              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Nhật ký xử lý</span>
                <div className="space-y-2 border-l pl-3 ml-1.5 border-muted">
                  {activeRiskDetail.history.map((h, i) => (
                    <div key={i} className="relative space-y-1">
                      <div className="absolute w-2 h-2 rounded-full bg-rose-500 -left-[16.5px] top-1 border border-background" />
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="font-mono">{h.time}</span>
                        <Badge variant="secondary" className="px-1 py-0 text-[8px]">{h.status}</Badge>
                      </div>
                      <p className="text-foreground leading-relaxed font-medium">{h.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog truy xuất chi tiết Mốc sự kiện quan trọng */}
      <Dialog open={!!activeMilestoneDetail} onOpenChange={(open) => !open && setActiveMilestoneDetail(null)}>
        {activeMilestoneDetail && (
          <DialogContent className="max-w-md bg-background/95 backdrop-blur-lg border shadow-2xl rounded-2xl p-6">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-lg font-black text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Mốc quan trọng: {activeMilestoneDetail.event}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mốc sự kiện kiểm soát chất lượng bàn giao.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Trạng thái</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold mt-1">
                    {activeMilestoneDetail.status}
                  </Badge>
                </div>
                <div className="p-2.5 bg-muted/20 border rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Thời hạn sự kiện</span>
                  <span className="font-mono font-bold block mt-1 text-foreground">{activeMilestoneDetail.time}</span>
                </div>
              </div>

              <div className="p-3 bg-muted/10 border rounded-lg space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Ghi chú vận hành</span>
                <p className="text-foreground italic leading-relaxed">{activeMilestoneDetail.notes}</p>
              </div>

              {/* Tiêu chí nghiệm thu */}
              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Tiêu chí nghiệm thu (Acceptance Criteria)</span>
                <div className="space-y-2 bg-muted/5 border rounded-lg p-3">
                  {activeMilestoneDetail.criteria.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-foreground leading-relaxed">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog hiển thị Chứng thư chữ ký số (Signature Certificate) */}
      <Dialog open={!!activeSignatureCert} onOpenChange={(open) => !open && setActiveSignatureCert(null)}>
        {activeSignatureCert && (
          <DialogContent className="max-w-md bg-background/95 backdrop-blur-lg border shadow-2xl rounded-2xl p-6">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-lg font-black text-primary flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-pulse" />
                Chứng thư Chữ ký số
              </DialogTitle>
              <DialogDescription className="text-xs">
                Thông tin xác thực danh tính phê duyệt báo cáo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-2 text-center">
                <span className="text-[10px] text-emerald-600 uppercase font-black tracking-widest block">Trạng thái phê duyệt</span>
                <span className="text-xl font-bold text-foreground">{activeSignatureCert.signee}</span>
                <p className="text-muted-foreground text-[10px] font-mono">{activeSignatureCert.role}</p>
              </div>

              <div className="space-y-2 border rounded-lg p-3 bg-muted/10">
                <div className="flex items-center justify-between py-1 border-b last:border-0 border-muted">
                  <span className="text-muted-foreground">Thời gian ký:</span>
                  <span className="font-semibold text-foreground font-mono">{activeSignatureCert.time}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b last:border-0 border-muted">
                  <span className="text-muted-foreground">Địa chỉ IP:</span>
                  <span className="font-semibold text-foreground font-mono">{activeSignatureCert.ip}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b last:border-0 border-muted">
                  <span className="text-muted-foreground">Định danh chứng thư:</span>
                  <span className="font-semibold text-emerald-600 font-mono text-[9px] truncate max-w-[180px]">{activeSignatureCert.status}</span>
                </div>
              </div>

              {/* Cryptographic hash */}
              <div className="p-3 bg-muted/20 border rounded-lg space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Mã Hash chứng chỉ (SHA-256)</span>
                <p className="font-mono text-[9px] text-muted-foreground leading-normal break-all select-all">{activeSignatureCert.certificateHash}</p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TaskDeepDetail {
  name: string;
  owner: string;
  duration: string;
  subtasks: Array<{ label: string; done: boolean; date?: string }>;
  logs: Array<{ time: string; user: string; text: string }>;
  wikiLink?: string;
  wikiName?: string;
}

const getTaskDeepDetails = (taskName: string): TaskDeepDetail => {
  switch (taskName) {
    case "Hoàn thiện layout cửa hàng":
      return {
        name: "Hoàn thiện layout cửa hàng",
        owner: "Trần Quốc Huy (PM Thiết kế)",
        duration: "05/07/2026 - 15/07/2026",
        subtasks: [
          { label: "Khảo sát hiện trạng mặt bằng", done: true, date: "06/07" },
          { label: "Thiết kế phối cảnh 3D nội ngoại thất", done: true, date: "09/07" },
          { label: "Lắp đặt hệ thống điện nước quầy bar", done: true, date: "12/07" },
          { label: "Sơn sửa tường, lắp ráp khung gỗ", done: true, date: "14/07" },
          { label: "Nghiệm thu bàn giao phần thô & vệ sinh công nghiệp", done: true, date: "15/07" }
        ],
        logs: [
          { time: "15/07/2026 16:30", user: "Trần Quốc Huy", text: "Đã duyệt biên bản nghiệm thu bàn giao mặt bằng phần thô." },
          { time: "14/07/2026 11:00", user: "Nguyễn Minh Khoa", text: "Tải lên tài liệu thiết kế và ảnh bàn giao thực địa." }
        ],
        wikiLink: "/docs/wiki/03_Technical_Docs/TECH-003-dynamic-warranty.md",
        wikiName: "TECH-003-dynamic-warranty.md"
      };
    case "Tuyển dụng nhân sự":
      return {
        name: "Tuyển dụng nhân sự",
        owner: "Lê Minh Anh (HR Specialist)",
        duration: "08/07/2026 - 18/07/2026",
        subtasks: [
          { label: "Đăng tin tuyển dụng trên các hội nhóm & fanpage", done: true, date: "09/07" },
          { label: "Lọc hồ sơ và xếp lịch phỏng vấn sơ loại", done: true, date: "12/07" },
          { label: "Phỏng vấn Barista vòng 2 (Đã tuyển 3/4)", done: false },
          { label: "Phỏng vấn Phục vụ (Đã tuyển 3/5)", done: false },
          { label: "Phỏng vấn Thu ngân / Kho (Đã tuyển 1/2)", done: false }
        ],
        logs: [
          { time: "16/07/2026 14:20", user: "Lê Minh Anh", text: "Hồ sơ barista chất lượng cao hơi ít, đã mở thêm nguồn tin tuyển dụng trả phí." },
          { time: "12/07/2026 09:00", user: "Lê Minh Anh", text: "Hoàn tất chọn lọc 15 hồ sơ ứng viên vòng 1." }
        ],
        wikiLink: "/docs/wiki/02_Refined_Specs/SPEC-001-memberships-wallet.md",
        wikiName: "SPEC-001-memberships-wallet.md"
      };
    case "Đào tạo barista & phục vụ":
      return {
        name: "Đào tạo barista & phục vụ",
        owner: "Nguyễn Minh Khoa (PM Vận hành)",
        duration: "12/07/2026 - 20/07/2026",
        subtasks: [
          { label: "Soạn giáo trình đào tạo menu đồ uống", done: true, date: "12/07" },
          { label: "Đào tạo lý thuyết nội quy & quy chuẩn phục vụ", done: true, date: "14/07" },
          { label: "Thực hành pha chế công thức chuẩn (Đạt 80%)", done: false },
          { label: "Chạy ca thử nghiệm mô phỏng (Soft-run)", done: false }
        ],
        logs: [
          { time: "16/07/2026 10:00", user: "Nguyễn Minh Khoa", text: "Trì hoãn buổi soft-run do chưa tuyển đủ nhân sự barista đứng quầy." },
          { time: "14/07/2026 15:30", user: "Nguyễn Minh Khoa", text: "Hoàn thành bài kiểm tra lý thuyết phục vụ khách hàng của nhóm nhân viên mới." }
        ],
        wikiLink: "/docs/wiki/03_Technical_Docs/TECH-001-memberships-wallet.md",
        wikiName: "TECH-001-memberships-wallet.md"
      };
    case "Setup POS / QR / máy in":
      return {
        name: "Setup POS / QR / máy in",
        owner: "Nguyễn Hoàng Long (IT Support)",
        duration: "10/07/2026 - 17/07/2026",
        subtasks: [
          { label: "Khảo sát vị trí, đi dây mạng LAN & cấp nguồn quầy", done: true, date: "11/07" },
          { label: "Lắp đặt phần cứng máy POS và cài đặt phần mềm ERP Mini", done: true, date: "13/07" },
          { label: "Lắp đặt và test kết nối máy in hóa đơn/máy in tem", done: true, date: "14/07" },
          { label: "Cấu hình cổng QR thanh toán động tích hợp Casso", done: false },
          { label: "Kiểm tra in thử hóa đơn thực tế và chốt ca", done: false }
        ],
        logs: [
          { time: "17/07/2026 08:30", user: "Nguyễn Hoàng Long", text: "Đã cài đặt xong app. Đang chờ kết nối API ví thành viên và ngân hàng." },
          { time: "14/07/2026 16:00", user: "Nguyễn Hoàng Long", text: "Máy in tem nhiệt đã được bàn giao và hoạt động tốt." }
        ],
        wikiLink: "/docs/wiki/03_Technical_Docs/TECH-002-event-bus.md",
        wikiName: "TECH-002-event-bus.md"
      };
    case "Chuẩn hóa menu & giá bán":
      return {
        name: "Chuẩn hóa menu & giá bán",
        owner: "Trần Quốc Huy (PM Thiết kế)",
        duration: "05/07/2026 - 16/07/2026",
        subtasks: [
          { label: "Xác định danh mục đồ uống và định lượng pha chế", done: true, date: "06/07" },
          { label: "Tính toán giá vốn nguyên liệu và biên lợi nhuận gộp", done: true, date: "08/07" },
          { label: "Dự thảo bảng giá bán lẻ đề xuất", done: true, date: "10/07" },
          { label: "Thiết lập cơ chế combo giá sỉ & chiết khấu", done: false },
          { label: "Trình duyệt bảng giá chính thức lên BLĐ", done: false }
        ],
        logs: [
          { time: "16/07/2026 15:00", user: "Trần Quốc Huy", text: "Đã hoàn thành đề xuất combo ưu đãi kèm bảng chiết khấu." },
          { time: "10/07/2026 09:30", user: "Trần Quốc Huy", text: "Hoàn tất lập biểu giá mẫu thử nghiệm." }
        ],
        wikiLink: "/docs/wiki/02_Refined_Specs/SPEC-004-packing-workflow.md",
        wikiName: "SPEC-004-packing-workflow.md"
      };
    default:
      return {
        name: taskName,
        owner: "Nguyễn Minh Khoa (PM)",
        duration: "14/07/2026 - 20/07/2026",
        subtasks: [
          { label: "Khảo sát và lập quy hoạch ban đầu", done: true, date: "14/07" },
          { label: "Triển khai lắp đặt chi tiết", done: false }
        ],
        logs: [
          { time: "15/07/2026 09:00", user: "Nguyễn Minh Khoa", text: "Bắt đầu triển khai phân tích và tích hợp." }
        ]
      };
  }
};

export function WeeklyReportTab() {
  const [viewMode, setViewMode] = useState<"strategic" | "detailed">("strategic");
  const [selectedProjectId, setSelectedProjectId] = useState<number>(6); // Default: Cà phê Aroma (ID: 6)
  const [activeDetailTask, setActiveDetailTask] = useState<TaskDeepDetail | null>(null);

  const selectedReport = getDetailedReport(selectedProjectId);

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
                        onClick={() => setActiveDetailTask(getTaskDeepDetails(task.name))}
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
                  <div className="p-3 bg-muted/20 border rounded-lg flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Doanh thu</span>
                    <span className="text-lg font-bold text-foreground">{selectedReport.businessResults.revenue} Tr</span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-lg flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Chi phí</span>
                    <span className="text-lg font-bold text-rose-600">{selectedReport.businessResults.cost} Tr</span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-lg flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Lợi nhuận</span>
                    <span className="text-lg font-bold text-emerald-600">{selectedReport.businessResults.profit} Tr</span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-lg flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Nợ phải thu</span>
                    <span className="text-lg font-bold text-amber-600">{selectedReport.businessResults.receivable} Tr</span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-lg flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Nợ phải trả</span>
                    <span className="text-lg font-bold text-rose-600">{selectedReport.businessResults.payable} Tr</span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-lg flex flex-col justify-center">
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
                <div className="space-y-3 bg-muted/10 border rounded-lg p-3 text-xs">
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
                      <tr key={risk.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
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
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
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
              <div className="space-y-12">
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Người lập báo cáo</p>
                <div className="space-y-0.5">
                  <p className="font-mono text-[10px] text-muted-foreground">20/07/2026</p>
                  <p className="font-bold text-foreground underline decoration-dotted">{selectedReport.approvals.creator}</p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Quản lý trực tiếp</p>
                <div className="space-y-0.5">
                  <p className="font-mono text-[10px] text-muted-foreground">20/07/2026</p>
                  <p className="font-bold text-foreground underline decoration-dotted">{selectedReport.approvals.supervisor}</p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Chủ dự án</p>
                <div className="space-y-0.5">
                  <p className="font-mono text-[10px] text-muted-foreground">20/07/2026</p>
                  <p className="font-bold text-foreground underline decoration-dotted">{selectedReport.approvals.owner}</p>
                </div>
              </div>
              <div className="space-y-12">
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
          <DialogContent className="sm:max-w-[550px] bg-card/90 backdrop-blur-xl border border-primary/20">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-base font-black text-primary uppercase flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                CHI TIẾT NHIỆM VỤ TẦNG SÂU
              </DialogTitle>
              <DialogDescription className="text-xs">
                Truy xuất chi tiết hạng mục, lịch trình và hoạt động kiểm tra chéo.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-5 text-xs">
              {/* Task Core Info */}
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-lg border">
                <div>
                  <p className="text-muted-foreground font-semibold">Tên công việc:</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">{activeDetailTask.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Người phụ trách chính:</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">{activeDetailTask.owner}</p>
                </div>
                <div className="col-span-2 border-t pt-2 mt-1">
                  <p className="text-muted-foreground font-semibold">Thời gian thực hiện:</p>
                  <p className="font-medium text-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> {activeDetailTask.duration}
                  </p>
                </div>
              </div>

              {/* Subtasks Checklist */}
              <div className="space-y-2">
                <p className="font-bold text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Danh sách việc thành phần (Sub-checklist)
                </p>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {activeDetailTask.subtasks.map((sub, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 bg-muted/10 border rounded hover:bg-muted/20 transition-all">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center border mt-0.5",
                        sub.done ? "bg-emerald-500 border-emerald-600 text-white" : "border-muted-foreground/30 bg-background"
                      )}>
                        {sub.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 flex justify-between items-center gap-2">
                        <span className={cn("font-medium", sub.done ? "text-muted-foreground line-through" : "text-foreground")}>
                          {sub.label}
                        </span>
                        {sub.date && (
                          <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0 bg-emerald-500/10 text-emerald-600">
                            Xong {sub.date}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Activity Logs */}
              <div className="space-y-2">
                <p className="font-bold text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Nhật ký cập nhật & Kiểm toán (Audit Logs)
                </p>
                <div className="space-y-2 border-l-2 border-indigo-200 pl-3.5 py-1">
                  {activeDetailTask.logs.map((log, i) => (
                    <div key={i} className="space-y-1 relative">
                      <span className="absolute -left-[19.5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-background" />
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        <span>{log.time}</span>
                        <span>•</span>
                        <span className="font-bold text-foreground">{log.user}</span>
                      </div>
                      <p className="text-muted-foreground leading-normal">{log.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Spec & Wiki Links */}
              {activeDetailTask.wikiLink && (
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Tài liệu kỹ thuật liên kết:</span>
                  <a 
                    href={activeDetailTask.wikiLink} 
                    className="flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    {activeDetailTask.wikiName}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

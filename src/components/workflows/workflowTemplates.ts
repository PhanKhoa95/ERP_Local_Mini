import { WorkflowFlowData } from "@/hooks/useWorkflows";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  category: "sales" | "inventory" | "hr" | "general";
  flowData: WorkflowFlowData;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "auto-approve-small",
    name: "Auto duyệt đơn nhỏ",
    description: "Tự động xác nhận đơn hàng dưới 2 triệu",
    trigger_type: "order_created",
    category: "sales",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "order_created", position: { x: 100, y: 200 }, config: {}, label: "Đơn hàng mới" },
        { id: "n2", type: "condition", condition_type: "compare", position: { x: 380, y: 200 }, config: { field: "total", operator: "<", value: 2000000 }, label: "Giá trị < 2M" },
        { id: "n3", type: "action", action_type: "update_status", position: { x: 660, y: 150 }, config: { new_status: "confirmed" }, label: "Xác nhận ĐH" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3", label: "Đúng" },
      ],
    },
  },
  {
    id: "large-order-approval",
    name: "Đơn lớn cần duyệt",
    description: "Tạo yêu cầu phê duyệt cho đơn trên 5 triệu",
    trigger_type: "order_created",
    category: "sales",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "order_created", position: { x: 100, y: 200 }, config: {}, label: "Đơn hàng mới" },
        { id: "n2", type: "condition", condition_type: "compare", position: { x: 380, y: 200 }, config: { field: "total", operator: ">", value: 5000000 }, label: "Giá trị > 5M" },
        { id: "n3", type: "action", action_type: "create_approval", position: { x: 660, y: 150 }, config: { approval_title: "Duyệt đơn hàng lớn" }, label: "Tạo phê duyệt" },
        { id: "n4", type: "action", action_type: "send_notification", position: { x: 660, y: 300 }, config: { message: "Đơn hàng lớn cần phê duyệt" }, label: "Thông báo Manager" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3", label: "Đúng" },
        { source: "n2", target: "n4", label: "Đúng" },
      ],
    },
  },
  {
    id: "low-stock-alert",
    name: "Cảnh báo tồn kho",
    description: "Gửi thông báo và tạo task khi tồn kho thấp",
    trigger_type: "low_stock",
    category: "inventory",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "low_stock", position: { x: 100, y: 200 }, config: { threshold: 10 }, label: "Tồn kho thấp" },
        { id: "n2", type: "action", action_type: "send_notification", position: { x: 400, y: 150 }, config: { message: "Cảnh báo: Sản phẩm sắp hết hàng!" }, label: "Gửi cảnh báo" },
        { id: "n3", type: "action", action_type: "create_task", position: { x: 400, y: 300 }, config: { task_title: "Kiểm tra và đặt hàng bổ sung" }, label: "Tạo task mua hàng" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n1", target: "n3" },
      ],
    },
  },
  {
    id: "welcome-employee",
    name: "Chào mừng nhân viên mới",
    description: "Gửi thông báo chào mừng + ghi danh đào tạo onboarding",
    trigger_type: "employee_onboarded",
    category: "hr",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "employee_onboarded", position: { x: 100, y: 200 }, config: {}, label: "NV mới onboard" },
        { id: "n2", type: "action", action_type: "send_notification", position: { x: 400, y: 150 }, config: { message: "Chào mừng bạn đến với công ty! 🎉" }, label: "Gửi chào mừng" },
        { id: "n3", type: "action", action_type: "enroll_training", position: { x: 400, y: 300 }, config: { program_category: "onboarding" }, label: "Ghi danh Onboarding" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n1", target: "n3" },
      ],
    },
  },
  {
    id: "auto-task-order",
    name: "Auto giao task đơn hàng",
    description: "Tự động tạo task xử lý khi có đơn hàng mới",
    trigger_type: "order_created",
    category: "sales",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "order_created", position: { x: 100, y: 200 }, config: {}, label: "Đơn hàng mới" },
        { id: "n2", type: "action", action_type: "create_task", position: { x: 400, y: 200 }, config: { task_title: "Xử lý đơn hàng mới" }, label: "Tạo task" },
      ],
      edges: [
        { source: "n1", target: "n2" },
      ],
    },
  },
  {
    id: "report-reminder",
    name: "Nhắc nhở báo cáo",
    description: "Nhắc nhân viên nộp báo cáo hàng ngày",
    trigger_type: "schedule",
    category: "hr",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "schedule", position: { x: 100, y: 200 }, config: { cron: "daily" }, label: "Hàng ngày 17:00" },
        { id: "n2", type: "action", action_type: "send_notification", position: { x: 400, y: 200 }, config: { message: "Nhắc nhở: Vui lòng nộp báo cáo công việc hôm nay 📝" }, label: "Nhắc nộp báo cáo" },
      ],
      edges: [
        { source: "n1", target: "n2" },
      ],
    },
  },
  // ===== 3-Level Dispatch Templates =====
  {
    id: "three-level-dispatch",
    name: "Luồng giao việc 3 cấp",
    description: "Chỉ thị lãnh đạo → AI bóc tách → Phân phối quản lý → Giao nhân viên",
    trigger_type: "directive_created",
    category: "hr",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "directive_created", position: { x: 60, y: 200 }, config: {}, label: "Chỉ thị mới" },
        { id: "n2", type: "action", action_type: "ai_transcriber", position: { x: 300, y: 200 }, config: { source_type: "meeting" }, label: "AI Bóc tách" },
        { id: "n3", type: "action", action_type: "kpi_mapper", position: { x: 540, y: 140 }, config: {}, label: "Áp KPI" },
        { id: "n4", type: "action", action_type: "auto_dispatch", position: { x: 540, y: 280 }, config: {}, label: "Phân phối 3 cấp" },
        { id: "n5", type: "action", action_type: "send_notification", position: { x: 780, y: 200 }, config: { message: "Chỉ thị mới đã được phân phối! 📋" }, label: "Thông báo" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n2", target: "n4" },
        { source: "n4", target: "n5" },
      ],
    },
  },
  {
    id: "auto-escalation",
    name: "Escalation tự động",
    description: "Kiểm tra chỉ thị/task quá hạn mỗi 2 giờ và gửi nhắc nhở",
    trigger_type: "schedule",
    category: "hr",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "schedule", position: { x: 60, y: 200 }, config: { cron: "daily" }, label: "Mỗi 2 giờ" },
        { id: "n2", type: "action", action_type: "escalation_alert", position: { x: 300, y: 200 }, config: {}, label: "Kiểm tra tắc nghẽn" },
        { id: "n3", type: "action", action_type: "audit_trail", position: { x: 540, y: 200 }, config: { audit_action: "ESCALATION_CHECK", audit_message: "Kiểm tra escalation tự động" }, label: "Ghi Audit" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
      ],
    },
  },
  {
    id: "task-kpi-token",
    name: "Task → KPI → Token thưởng",
    description: "Khi nhân viên hoàn thành task vượt KPI → tự động thưởng Token",
    trigger_type: "task_completed_kpi",
    category: "hr",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "task_completed_kpi", position: { x: 60, y: 200 }, config: {}, label: "Task hoàn thành" },
        { id: "n2", type: "action", action_type: "kpi_mapper", position: { x: 300, y: 200 }, config: {}, label: "Cập nhật KPI" },
        { id: "n3", type: "condition", condition_type: "compare", position: { x: 540, y: 200 }, config: { field: "kpi_score", operator: ">=", value: 90 }, label: "KPI ≥ 90?" },
        { id: "n4", type: "action", action_type: "issue_tokens", position: { x: 780, y: 140 }, config: { amount: 50, token_type: "reward" }, label: "Thưởng Token" },
        { id: "n5", type: "action", action_type: "send_notification", position: { x: 780, y: 280 }, config: { message: "Xuất sắc! Bạn đã nhận Token thưởng vì vượt KPI 🎉" }, label: "Thông báo" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3" },
        { source: "n3", target: "n4", label: "Đúng" },
        { source: "n3", target: "n5", label: "Đúng" },
      ],
    },
  },
  // ===== Industry Pack Templates =====
  {
    id: "pack-real-estate",
    name: "Pack BĐS: Cọc → VNeID → Token → Xem nhà",
    description: "HĐ cọc → Xác thực VNeID → Phát Token dự án → Đặt lịch xem nhà → Voucher",
    trigger_type: "contract_signed",
    category: "sales",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "contract_signed", position: { x: 60, y: 200 }, config: {}, label: "HĐ cọc được ký" },
        { id: "n2", type: "condition", condition_type: "check_vneid_verified", position: { x: 300, y: 200 }, config: {}, label: "Kiểm tra VNeID" },
        { id: "n3", type: "action", action_type: "issue_tokens", position: { x: 540, y: 130 }, config: { amount: 100, token_type: "reward" }, label: "Phát Token dự án" },
        { id: "n4", type: "action", action_type: "create_booking", position: { x: 540, y: 280 }, config: { resource_type: "property", duration_hours: 1 }, label: "Đặt lịch xem nhà" },
        { id: "n5", type: "action", action_type: "issue_voucher_reward", position: { x: 780, y: 280 }, config: { discount_percent: 5, voucher_name: "Voucher khách cọc BĐS" }, label: "Tặng Voucher" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3", label: "Đã xác thực" },
        { source: "n2", target: "n4", label: "Đã xác thực" },
        { source: "n4", target: "n5" },
      ],
    },
  },
  {
    id: "pack-manufacturing",
    name: "Pack Sản xuất: Cung ứng → Giao hàng → Token",
    description: "HĐ cung ứng → Lịch giao hàng → Milestone tiến độ → Token thưởng đạt mốc",
    trigger_type: "contract_signed",
    category: "inventory",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "contract_signed", position: { x: 60, y: 200 }, config: {}, label: "HĐ cung ứng ký" },
        { id: "n2", type: "action", action_type: "create_booking", position: { x: 300, y: 140 }, config: { resource_type: "vehicle", duration_hours: 2 }, label: "Lịch giao hàng" },
        { id: "n3", type: "action", action_type: "create_task", position: { x: 300, y: 280 }, config: { task_title: "Theo dõi tiến độ cung ứng" }, label: "Tạo task giám sát" },
        { id: "n4", type: "trigger", trigger_type: "milestone_due", position: { x: 560, y: 200 }, config: { days_before: 3 }, label: "Milestone đến hạn" },
        { id: "n5", type: "action", action_type: "issue_tokens", position: { x: 780, y: 200 }, config: { amount: 50, token_type: "reward" }, label: "Token thưởng tiến độ" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n1", target: "n3" },
        { source: "n4", target: "n5" },
      ],
    },
  },
  {
    id: "pack-services",
    name: "Pack Dịch vụ: Đặt lịch → Check-in → Voucher",
    description: "Đặt lịch tư vấn → Check-in → Hoàn thành dịch vụ → Voucher giảm giá lần sau",
    trigger_type: "booking_completed",
    category: "sales",
    flowData: {
      nodes: [
        { id: "n1", type: "trigger", trigger_type: "booking_completed", position: { x: 60, y: 200 }, config: {}, label: "Đặt lịch hoàn thành" },
        { id: "n2", type: "condition", condition_type: "check_industry", position: { x: 300, y: 200 }, config: { industry: "services" }, label: "Ngành dịch vụ?" },
        { id: "n3", type: "action", action_type: "issue_voucher_reward", position: { x: 540, y: 140 }, config: { discount_percent: 10, voucher_name: "Voucher khách hàng thân thiết" }, label: "Tặng Voucher 10%" },
        { id: "n4", type: "action", action_type: "send_notification", position: { x: 540, y: 280 }, config: { message: "Cảm ơn bạn đã sử dụng dịch vụ! Mã giảm giá đã được gửi 🎁" }, label: "Gửi thông báo" },
      ],
      edges: [
        { source: "n1", target: "n2" },
        { source: "n2", target: "n3", label: "Đúng" },
        { source: "n2", target: "n4", label: "Đúng" },
      ],
    },
  },
];

import {
  Zap, ShoppingCart, CreditCard, Package, CheckCircle, Clock,
  GitBranch, Filter, UserCheck,
  Bell, ClipboardList, RefreshCw, Bot, Globe, Edit3, ArrowRightLeft,
  UserPlus, CalendarDays, GraduationCap, BarChart3, BookOpen, Users, Star,
  FileText, FileCheck, AlertTriangle, Receipt, Wallet,
  Cloud, History, ShieldCheck, Coins, PieChart, Milestone, Scale,
  FileSignature, Building2, Gift, Calendar, Shield, Fingerprint,
} from "lucide-react";

export interface ModuleDefinition {
  type: "trigger" | "condition" | "action";
  subtype: string;
  label: string;
  icon: any;
  color: string;
  description: string;
  configFields?: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "status";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export const TRIGGER_MODULES: ModuleDefinition[] = [
  {
    type: "trigger", subtype: "order_created", label: "Đơn hàng mới", icon: ShoppingCart,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi có đơn hàng mới",
  },
  {
    type: "trigger", subtype: "order_status_changed", label: "Đổi trạng thái ĐH", icon: RefreshCw,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi đơn hàng đổi trạng thái",
    configFields: [{ key: "from_status", label: "Từ trạng thái", type: "text" }, { key: "to_status", label: "Sang trạng thái", type: "text" }],
  },
  {
    type: "trigger", subtype: "payment_received", label: "Nhận thanh toán", icon: CreditCard,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi nhận được thanh toán",
  },
  {
    type: "trigger", subtype: "low_stock", label: "Tồn kho thấp", icon: Package,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi tồn kho dưới ngưỡng",
    configFields: [{ key: "threshold", label: "Ngưỡng tối thiểu", type: "number", placeholder: "10" }],
  },
  {
    type: "trigger", subtype: "approval_completed", label: "Duyệt hoàn tất", icon: CheckCircle,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi phê duyệt hoàn tất",
  },
  {
    type: "trigger", subtype: "schedule", label: "Theo lịch", icon: Clock,
    color: "hsl(142 76% 36%)", description: "Chạy tự động theo lịch",
    configFields: [{ key: "cron", label: "Tần suất", type: "select", options: [{ label: "Hàng ngày", value: "daily" }, { label: "Hàng tuần", value: "weekly" }, { label: "Hàng tháng", value: "monthly" }] }],
  },
  // HR Triggers
  {
    type: "trigger", subtype: "employee_onboarded", label: "NV mới onboard", icon: UserPlus,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi nhân viên mới được thêm vào hệ thống",
  },
  {
    type: "trigger", subtype: "leave_requested", label: "Yêu cầu nghỉ phép", icon: CalendarDays,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi có yêu cầu nghỉ phép mới",
  },
  {
    type: "trigger", subtype: "training_completed", label: "Hoàn thành đào tạo", icon: GraduationCap,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi nhân viên hoàn thành khóa đào tạo",
  },
  {
    type: "trigger", subtype: "kpi_score_finalized", label: "Chốt điểm KPI", icon: BarChart3,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi điểm KPI được chốt cuối kỳ",
  },
  // Document Triggers
  {
    type: "trigger", subtype: "document_uploaded", label: "Tài liệu mới", icon: FileText,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi có tài liệu mới được upload",
    configFields: [{ key: "category", label: "Loại tài liệu", type: "select", options: [{ label: "Tất cả", value: "all" }, { label: "Hóa đơn", value: "invoice" }, { label: "Hợp đồng", value: "contract" }, { label: "Bản vẽ", value: "drawing" }, { label: "Báo cáo", value: "report" }] }],
  },
  {
    type: "trigger", subtype: "document_processed", label: "Xử lý tài liệu xong", icon: FileCheck,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi tài liệu đã được AI phân loại và trích xuất xong",
  },
  {
    type: "trigger", subtype: "contract_expiring", label: "HĐ sắp hết hạn", icon: AlertTriangle,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi hợp đồng/tài liệu sắp hết hạn",
    configFields: [{ key: "days_before", label: "Số ngày trước hạn", type: "number", placeholder: "30" }],
  },
  // Recruitment & HR Triggers
  {
    type: "trigger", subtype: "candidate_accepted", label: "Ứng viên nhận việc", icon: UserPlus,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi ứng viên chấp nhận offer",
  },
  {
    type: "trigger", subtype: "contract_expiring_hr", label: "HĐ lao động sắp hết", icon: AlertTriangle,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi hợp đồng lao động sắp hết hạn",
    configFields: [{ key: "days_before", label: "Số ngày trước hạn", type: "number", placeholder: "30" }],
  },
  {
    type: "trigger", subtype: "payroll_calculated", label: "Tính lương xong", icon: CreditCard,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi bảng lương được tính xong",
  },
  // Digital Asset Triggers
  {
    type: "trigger", subtype: "milestone_completed", label: "Hoàn thành Milestone", icon: Milestone,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi dự án đạt milestone",
    configFields: [{ key: "milestone_name", label: "Tên milestone", type: "text", placeholder: "Phase 1 Complete" }],
  },
  // Multi-industry Triggers
  {
    type: "trigger", subtype: "contract_signed", label: "Hợp đồng được ký", icon: FileSignature,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi hợp đồng thông minh được ký số",
  },
  {
    type: "trigger", subtype: "booking_completed", label: "Đặt lịch hoàn thành", icon: Calendar,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi đặt lịch được hoàn thành (check-in → done)",
  },
  {
    type: "trigger", subtype: "milestone_due", label: "Milestone đến hạn", icon: Milestone,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi milestone hợp đồng đến hạn thanh toán",
    configFields: [{ key: "days_before", label: "Ngày trước hạn", type: "number", placeholder: "3" }],
  },
  // 3-Level Dispatch Triggers
  {
    type: "trigger", subtype: "directive_created", label: "Chỉ thị mới", icon: FileText,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi lãnh đạo tạo chỉ thị mới",
  },
  {
    type: "trigger", subtype: "task_completed_kpi", label: "Task hoàn thành (KPI)", icon: CheckCircle,
    color: "hsl(142 76% 36%)", description: "Kích hoạt khi task hoàn thành và cần đánh giá KPI",
  },
];

export const CONDITION_MODULES: ModuleDefinition[] = [
  {
    type: "condition", subtype: "ai_router", label: "AI Phân loại", icon: Bot,
    color: "hsl(280 70% 50%)", description: "AI đọc dữ liệu đầu vào và tự quyết định rẽ nhánh nào",
    configFields: [
      { key: "classification_prompt", label: "Prompt phân loại", type: "text", placeholder: "Phân loại chứng từ: hợp lệ hay cần trả lại?" },
      { key: "branches", label: "Các nhánh (cách dấu phẩy)", type: "text", placeholder: "hợp lệ, không hợp lệ, cần bổ sung" },
    ],
  },
  {
    type: "condition", subtype: "compare", label: "So sánh giá trị", icon: GitBranch,
    color: "hsl(45 93% 47%)", description: "Rẽ nhánh dựa trên giá trị",
    configFields: [
      { key: "field", label: "Trường", type: "text", placeholder: "total" },
      { key: "operator", label: "Phép so", type: "select", options: [{ label: ">", value: ">" }, { label: "<", value: "<" }, { label: "=", value: "=" }, { label: ">=", value: ">=" }, { label: "<=", value: "<=" }] },
      { key: "value", label: "Giá trị", type: "number" },
    ],
  },
  {
    type: "condition", subtype: "status_check", label: "Kiểm tra trạng thái", icon: Filter,
    color: "hsl(45 93% 47%)", description: "Kiểm tra trạng thái hiện tại",
    configFields: [{ key: "expected_status", label: "Trạng thái", type: "text", placeholder: "confirmed" }],
  },
  {
    type: "condition", subtype: "role_check", label: "Kiểm tra quyền", icon: UserCheck,
    color: "hsl(45 93% 47%)", description: "Kiểm tra role người dùng",
    configFields: [{ key: "required_role", label: "Role yêu cầu", type: "select", options: [{ label: "Admin", value: "admin" }, { label: "Manager", value: "manager" }, { label: "Staff", value: "staff" }] }],
  },
  {
    type: "condition", subtype: "condition_guard", label: "Kiểm tra hợp lệ", icon: ShieldCheck,
    color: "hsl(160 70% 40%)", description: "Kiểm tra dữ liệu đầu vào có hợp lệ trước khi tiếp tục (required fields, format, range)",
    configFields: [
      { key: "required_fields", label: "Trường bắt buộc (phân cách dấu phẩy)", type: "text", placeholder: "name,email,amount" },
      { key: "min_value_field", label: "Trường kiểm tra giá trị tối thiểu", type: "text", placeholder: "amount" },
      { key: "min_value", label: "Giá trị tối thiểu", type: "number", placeholder: "0" },
    ],
  },
  {
    type: "condition", subtype: "check_token_balance", label: "Kiểm tra số dư Token", icon: Scale,
    color: "hsl(45 93% 47%)", description: "Kiểm tra số dư token của người dùng",
    configFields: [
      { key: "min_balance", label: "Số dư tối thiểu", type: "number", placeholder: "100" },
    ],
  },
  {
    type: "condition", subtype: "check_industry", label: "Rẽ nhánh theo ngành", icon: Building2,
    color: "hsl(45 93% 47%)", description: "Rẽ nhánh workflow theo ngành nghề (BĐS, Sản xuất, Dịch vụ...)",
    configFields: [
      { key: "industry", label: "Ngành", type: "select", options: [{ label: "BĐS", value: "real_estate" }, { label: "Sản xuất", value: "manufacturing" }, { label: "Dịch vụ", value: "services" }, { label: "Xây dựng", value: "construction" }] },
    ],
  },
  {
    type: "condition", subtype: "check_vneid_verified", label: "Kiểm tra VNeID", icon: ShieldCheck,
    color: "hsl(45 93% 47%)", description: "Kiểm tra người dùng đã xác thực VNeID chưa",
  },
  {
    type: "condition", subtype: "permission_guard", label: "Kiểm tra phân quyền", icon: Shield,
    color: "hsl(0 72% 51%)", description: "Kiểm tra User.Role + VNeID + quyền dự án trước khi tiếp tục.",
    configFields: [
      { key: "required_role", label: "Vai trò tối thiểu", type: "select", options: [{ label: "Admin", value: "admin" }, { label: "Manager", value: "manager" }, { label: "Staff", value: "staff" }] },
      { key: "requires_vneid", label: "Yêu cầu VNeID", type: "select", options: [{ label: "Có", value: "true" }, { label: "Không", value: "false" }] },
      { key: "action_type", label: "Loại thao tác", type: "text", placeholder: "token_issue, share_transfer" },
    ],
  },
  // 3-Level Dispatch Conditions
  {
    type: "condition", subtype: "check_workload", label: "Kiểm tra workload", icon: Users,
    color: "hsl(45 93% 47%)", description: "Kiểm tra số lượng task hiện tại của nhân viên trước khi gán thêm",
    configFields: [
      { key: "max_tasks", label: "Tối đa task", type: "number", placeholder: "10" },
    ],
  },
];

export const ACTION_MODULES: ModuleDefinition[] = [
  {
    type: "action", subtype: "update_status", label: "Cập nhật trạng thái", icon: RefreshCw,
    color: "hsl(217 91% 60%)", description: "Cập nhật trạng thái đối tượng",
    configFields: [{ key: "new_status", label: "Trạng thái mới", type: "text" }],
  },
  {
    type: "action", subtype: "create_approval", label: "Tạo phê duyệt", icon: ClipboardList,
    color: "hsl(217 91% 60%)", description: "Tạo yêu cầu phê duyệt E-Office",
    configFields: [{ key: "approval_title", label: "Tiêu đề", type: "text" }],
  },
  {
    type: "action", subtype: "send_notification", label: "Gửi thông báo", icon: Bell,
    color: "hsl(217 91% 60%)", description: "Gửi thông báo cho nhân viên",
    configFields: [{ key: "message", label: "Nội dung", type: "text" }],
  },
  {
    type: "action", subtype: "create_task", label: "Tạo task", icon: ClipboardList,
    color: "hsl(217 91% 60%)", description: "Tạo task cho nhân viên",
    configFields: [{ key: "task_title", label: "Tiêu đề task", type: "text" }],
  },
  {
    type: "action", subtype: "call_ai", label: "Gọi AI", icon: Bot,
    color: "hsl(217 91% 60%)", description: "Gọi AI phân tích dữ liệu",
    configFields: [{ key: "prompt", label: "Prompt", type: "text" }],
  },
  {
    type: "action", subtype: "webhook", label: "Webhook", icon: Globe,
    color: "hsl(217 91% 60%)", description: "Gọi API bên ngoài",
    configFields: [{ key: "url", label: "URL", type: "text" }, { key: "method", label: "Method", type: "select", options: [{ label: "POST", value: "POST" }, { label: "GET", value: "GET" }] }],
  },
  {
    type: "action", subtype: "update_field", label: "Cập nhật trường", icon: Edit3,
    color: "hsl(217 91% 60%)", description: "Cập nhật trường dữ liệu",
    configFields: [{ key: "field_name", label: "Tên trường", type: "text" }, { key: "field_value", label: "Giá trị", type: "text" }],
  },
  // HR Actions
  {
    type: "action", subtype: "enroll_training", label: "Ghi danh đào tạo", icon: BookOpen,
    color: "hsl(217 91% 60%)", description: "Tự động ghi danh nhân viên vào khóa đào tạo",
    configFields: [{ key: "program_category", label: "Loại chương trình", type: "select", options: [{ label: "Onboarding", value: "onboarding" }, { label: "Kỹ thuật", value: "technical" }, { label: "Kỹ năng mềm", value: "soft_skill" }, { label: "Tuân thủ", value: "compliance" }] }],
  },
  {
    type: "action", subtype: "assign_mentor", label: "Giao mentor", icon: Users,
    color: "hsl(217 91% 60%)", description: "Giao mentor cho nhân viên mới",
    configFields: [{ key: "mentor_criteria", label: "Tiêu chí mentor", type: "text", placeholder: "Cùng phòng ban, cấp senior" }],
  },
  {
    type: "action", subtype: "update_xp", label: "Cộng XP", icon: Star,
    color: "hsl(217 91% 60%)", description: "Cộng điểm kinh nghiệm cho nhân viên",
    configFields: [{ key: "xp_amount", label: "Số XP", type: "number", placeholder: "100" }],
  },
  // AI Agent Actions
  {
    type: "action", subtype: "ai_agent", label: "AI Agent", icon: Bot,
    color: "hsl(280 70% 50%)", description: "AI tự chọn tool và thực thi dựa trên yêu cầu ngôn ngữ tự nhiên",
    configFields: [
      { key: "prompt", label: "Yêu cầu cho AI", type: "text", placeholder: "Kiểm tra ngân sách dự án và tạo đề xuất mua hàng nếu còn đủ" },
      { key: "max_rounds", label: "Số vòng tối đa", type: "number", placeholder: "5" },
    ],
  },
  {
    type: "action", subtype: "human_approval", label: "Chờ phê duyệt", icon: UserCheck,
    color: "hsl(30 90% 50%)", description: "Tạm dừng workflow, gửi thông báo cho người duyệt và đợi phản hồi",
    configFields: [
      { key: "approver_role", label: "Vai trò duyệt", type: "select", options: [{ label: "Admin", value: "admin" }, { label: "Manager", value: "manager" }] },
      { key: "message", label: "Nội dung thông báo", type: "text", placeholder: "Vui lòng duyệt chứng từ #{{doc_id}}" },
      { key: "timeout_hours", label: "Hết hạn (giờ)", type: "number", placeholder: "24" },
    ],
  },
  {
    type: "action", subtype: "ai_self_correct", label: "AI Tự sửa lỗi", icon: RefreshCw,
    color: "hsl(280 70% 50%)", description: "Khi bước trước lỗi, AI phân tích và tự sửa dữ liệu rồi thử lại",
    configFields: [
      { key: "max_retries", label: "Số lần thử lại tối đa", type: "number", placeholder: "3" },
    ],
  },
  // Document Actions
  {
    type: "action", subtype: "create_approval_from_doc", label: "Tạo phê duyệt chứng từ", icon: Receipt,
    color: "hsl(217 91% 60%)", description: "Tạo phiếu phê duyệt E-Office từ tài liệu đã trích xuất",
    configFields: [{ key: "approval_title_template", label: "Mẫu tiêu đề", type: "text", placeholder: "Phê duyệt {{category}} - {{vendor_name}}" }],
  },
  {
    type: "action", subtype: "update_budget", label: "Cập nhật ngân sách", icon: Wallet,
    color: "hsl(217 91% 60%)", description: "Cập nhật ngân sách dự án từ chứng từ đã duyệt",
  },
  // Data Resilience Nodes
  {
    type: "action", subtype: "sync_point", label: "Điểm đồng bộ", icon: Cloud,
    color: "hsl(200 80% 50%)", description: "Xác nhận dữ liệu đã lưu cả Local và Cloud, ghi log đồng bộ",
    configFields: [
      { key: "sync_message", label: "Thông điệp đồng bộ", type: "text", placeholder: "Dữ liệu đã đồng bộ thành công" },
    ],
  },
  {
    type: "action", subtype: "audit_trail", label: "Ghi Audit", icon: History,
    color: "hsl(45 90% 50%)", description: "Tự động ghi log thao tác vào audit_logs",
    configFields: [
      { key: "audit_action", label: "Hành động", type: "text", placeholder: "WORKFLOW_ACTION" },
      { key: "audit_table", label: "Bảng liên quan", type: "text", placeholder: "orders" },
      { key: "audit_message", label: "Nội dung", type: "text", placeholder: "Workflow đã thực thi {{action}}" },
    ],
  },
  // Digital Asset Actions
  {
    type: "action", subtype: "issue_tokens", label: "Phát hành Token", icon: Coins,
    color: "hsl(280 70% 50%)", description: "Phát hành token thưởng cho người dùng",
    configFields: [
      { key: "amount", label: "Số lượng", type: "number", placeholder: "100" },
      { key: "token_type", label: "Loại token", type: "select", options: [{ label: "Thưởng", value: "reward" }, { label: "Cổ tức", value: "dividend" }] },
    ],
  },
  {
    type: "action", subtype: "issue_esop", label: "Phát hành ESOP", icon: PieChart,
    color: "hsl(280 70% 50%)", description: "Phát hành cổ phiếu ESOP tự động dựa trên KPI",
    configFields: [
      { key: "shares_per_point", label: "Cổ phần / điểm KPI", type: "number", placeholder: "10" },
    ],
  },
  // Multi-industry Actions
  {
    type: "action", subtype: "generate_contract", label: "AI sinh Hợp đồng", icon: FileSignature,
    color: "hsl(280 70% 50%)", description: "AI tự động sinh mẫu hợp đồng theo ngành nghề và loại HĐ",
    configFields: [
      { key: "contract_type", label: "Loại HĐ", type: "select", options: [{ label: "Dịch vụ", value: "service" }, { label: "Cung ứng", value: "supply" }, { label: "Đặt cọc", value: "deposit" }, { label: "Thi công", value: "construction" }] },
    ],
  },
  {
    type: "action", subtype: "create_booking", label: "Tạo đặt lịch", icon: Calendar,
    color: "hsl(217 91% 60%)", description: "Tự động tạo lịch hẹn cho khách hàng/đối tác",
    configFields: [
      { key: "resource_type", label: "Loại tài nguyên", type: "text", placeholder: "room, doctor, machine" },
      { key: "duration_hours", label: "Thời lượng (giờ)", type: "number", placeholder: "1" },
    ],
  },
  {
    type: "action", subtype: "issue_voucher_reward", label: "Phát voucher thưởng", icon: Gift,
    color: "hsl(217 91% 60%)", description: "Tự động tạo voucher giảm giá cho khách hàng",
    configFields: [
      { key: "discount_percent", label: "Giảm giá (%)", type: "number", placeholder: "10" },
      { key: "voucher_name", label: "Tên voucher", type: "text", placeholder: "Voucher hoàn thành dịch vụ" },
    ],
  },
  // 3-Level Dispatch Actions
  {
    type: "action", subtype: "ai_transcriber", label: "AI Bóc tách", icon: Bot,
    color: "hsl(280 70% 50%)", description: "AI chuyển biên bản họp/văn bản thành danh sách công việc JSON",
    configFields: [
      { key: "source_type", label: "Nguồn", type: "select", options: [{ label: "Họp", value: "meeting" }, { label: "Văn bản", value: "document" }] },
    ],
  },
  {
    type: "action", subtype: "kpi_mapper", label: "Áp chỉ số KPI", icon: BarChart3,
    color: "hsl(280 70% 50%)", description: "Áp chỉ số KPI từ task vào khung đánh giá và cổ phiếu dự án",
  },
  {
    type: "action", subtype: "auto_dispatch", label: "AI Phân phối 3 cấp", icon: ArrowRightLeft,
    color: "hsl(280 70% 50%)", description: "AI tự động phân phối task xuống 3 cấp: Lãnh đạo → Quản lý → Thực hiện",
    configFields: [
      { key: "suggestions", label: "Gợi ý chia nhỏ", type: "text", placeholder: "Chia theo nhóm/phòng ban" },
    ],
  },
  {
    type: "action", subtype: "escalation_alert", label: "Cảnh báo tắc nghẽn", icon: AlertTriangle,
    color: "hsl(0 72% 51%)", description: "Gửi cảnh báo khi chỉ thị/task quá hạn hoặc chưa xử lý",
  },
  {
    type: "action", subtype: "vneid_validator", label: "Xác thực VNeID", icon: ShieldCheck,
    color: "hsl(280 70% 50%)", description: "Kiểm tra VNeID + quyền hạn trước khi gán việc nhạy cảm",
    configFields: [
      { key: "action_type", label: "Loại thao tác", type: "text", placeholder: "token_issue, approve_expense" },
    ],
  },
];

// === API Gateway / Integration Bridge Nodes ===

export const INTEGRATION_TRIGGER_MODULES: ModuleDefinition[] = [
  {
    type: "trigger", subtype: "partner_data_received",
    label: "Nhận dữ liệu đối tác", icon: Globe, color: "bg-indigo-500",
    description: "Khi nhận webhook từ Sapo/KiotViet/Custom",
    configFields: [
      { key: "partner_type", label: "Nguồn", type: "select", options: [
        { label: "Sapo", value: "sapo" }, { label: "KiotViet", value: "kiotviet" }, { label: "Custom", value: "custom" }
      ]},
    ],
  },
  {
    type: "trigger", subtype: "sync_scheduled",
    label: "Lịch đồng bộ", icon: RefreshCw, color: "bg-teal-500",
    description: "Trigger đồng bộ theo lịch trình",
    configFields: [
      { key: "interval_minutes", label: "Chu kỳ (phút)", type: "number", placeholder: "15" },
    ],
  },
];

export const INTEGRATION_ACTION_MODULES: ModuleDefinition[] = [
  {
    type: "action", subtype: "sapo_connector",
    label: "Sapo Connector", icon: ShoppingCart, color: "bg-blue-500",
    description: "Đồng bộ đơn hàng/sản phẩm từ Sapo POS",
    configFields: [
      { key: "sync_type", label: "Loại", type: "select", options: [
        { label: "Đơn hàng", value: "orders" }, { label: "Sản phẩm", value: "products" }, { label: "Khách hàng", value: "customers" }
      ]},
    ],
  },
  {
    type: "action", subtype: "kiotviet_connector",
    label: "KiotViet Connector", icon: ShoppingCart, color: "bg-green-500",
    description: "Đồng bộ dữ liệu từ KiotViet",
    configFields: [
      { key: "sync_type", label: "Loại", type: "select", options: [
        { label: "Đơn hàng", value: "orders" }, { label: "Tồn kho", value: "inventory" }
      ]},
    ],
  },
  {
    type: "action", subtype: "universal_mapper",
    label: "AI Mapping", icon: ArrowRightLeft, color: "bg-purple-500",
    description: "AI tự động ánh xạ dữ liệu giữa các hệ thống",
    configFields: [
      { key: "from_system", label: "Từ hệ thống", type: "text", placeholder: "sapo" },
      { key: "to_system", label: "Sang hệ thống", type: "text", placeholder: "erp" },
    ],
  },
  {
    type: "action", subtype: "anti_duplicate_check",
    label: "Chống trùng lặp", icon: ShieldCheck, color: "bg-red-500",
    description: "Kiểm tra mã giao dịch đã xử lý chưa để chống gian lận",
    configFields: [
      { key: "check_field", label: "Trường kiểm tra", type: "text", placeholder: "order_id" },
    ],
  },
];

export const INTEGRATION_CONDITION_MODULES: ModuleDefinition[] = [
  {
    type: "condition", subtype: "api_key_valid",
    label: "Xác thực API Key", icon: Shield, color: "bg-amber-500",
    description: "Kiểm tra API Key hợp lệ và đúng scope",
    configFields: [
      { key: "required_scope", label: "Scope yêu cầu", type: "text", placeholder: "read" },
    ],
  },
  {
    type: "condition", subtype: "vneid_signature_check",
    label: "Kiểm tra VNeID Signature", icon: Fingerprint, color: "bg-cyan-500",
    description: "Xác thực chữ ký VNeID cho thao tác nhạy cảm",
  },
];


// === Accounting Nodes ===

export const ACCOUNTING_TRIGGER_MODULES: ModuleDefinition[] = [
  {
    type: "trigger", subtype: "journal_entry_posted",
    label: "Bút toán được ghi sổ", icon: BookOpen, color: "hsl(142 76% 36%)",
    description: "Kích hoạt khi bút toán kế toán được ghi sổ chính thức",
  },
];

export const ACCOUNTING_ACTION_MODULES: ModuleDefinition[] = [
  {
    type: "action", subtype: "account_mapper",
    label: "Hạch toán tự động", icon: BookOpen, color: "hsl(217 91% 60%)",
    description: "Tự động tạo bút toán kép từ sự kiện hệ thống (đơn hàng, KPI, Token)",
    configFields: [
      { key: "event_type", label: "Loại sự kiện", type: "select", options: [
        { label: "Đơn hàng giao", value: "order_delivered" },
        { label: "Phát Token", value: "token_issued" },
        { label: "Đổi Token", value: "token_exchanged" },
        { label: "Tạo cổ phần", value: "share_created" },
        { label: "KPI hoàn thành", value: "kpi_completed" },
        { label: "Nhận thanh toán", value: "payment_received" },
      ]},
    ],
  },
  {
    type: "action", subtype: "tax_calculator",
    label: "Tính thuế tự động", icon: Receipt, color: "hsl(217 91% 60%)",
    description: "Tính VAT/TNCN dựa trên loại hình ngành nghề",
    configFields: [
      { key: "tax_type", label: "Loại thuế", type: "select", options: [
        { label: "VAT 8%", value: "vat_8" }, { label: "VAT 10%", value: "vat_10" },
        { label: "TNCN", value: "pit" },
      ]},
    ],
  },
];

export const ACCOUNTING_CONDITION_MODULES: ModuleDefinition[] = [
  {
    type: "condition", subtype: "balance_check",
    label: "Kiểm tra số dư TK", icon: Scale, color: "hsl(45 93% 47%)",
    description: "Kiểm tra số dư tài khoản kế toán trước khi thực hiện",
    configFields: [
      { key: "account_code", label: "Mã TK", type: "text", placeholder: "112" },
      { key: "min_balance", label: "Số dư tối thiểu", type: "number", placeholder: "0" },
    ],
  },
];

TRIGGER_MODULES.push(...INTEGRATION_TRIGGER_MODULES, ...ACCOUNTING_TRIGGER_MODULES);
ACTION_MODULES.push(...INTEGRATION_ACTION_MODULES, ...ACCOUNTING_ACTION_MODULES);
CONDITION_MODULES.push(...INTEGRATION_CONDITION_MODULES, ...ACCOUNTING_CONDITION_MODULES);

export const ALL_MODULES = [...TRIGGER_MODULES, ...CONDITION_MODULES, ...ACTION_MODULES];

export function getModuleDefinition(type: string, subtype: string): ModuleDefinition | undefined {
  return ALL_MODULES.find(m => m.type === type && m.subtype === subtype);
}

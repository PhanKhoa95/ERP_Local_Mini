import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_email?: string;
}

const AUDIT_LOGS_KEY = "erp-mini-local-demo-audit-logs";

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    user_id: "demo-user-1",
    action: "Cập nhật định mức BOM",
    table_name: "product_bom",
    record_id: "local-bom-1",
    old_data: { quantity: 1.2 },
    new_data: { quantity: 1.5 },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    user_email: "manager@erplocal.vn",
  },
  {
    id: "log-2",
    user_id: "demo-user-2",
    action: "Sửa giá bán sản phẩm",
    table_name: "products",
    record_id: "local-prod-sticker",
    old_data: { selling_price: 95000 },
    new_data: { selling_price: 99000 },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    user_email: "manager@erplocal.vn",
  },
  {
    id: "log-3",
    user_id: "demo-user-3",
    action: "Điều chỉnh tồn kho vật tư decal",
    table_name: "inventory_transactions",
    record_id: "local-tx-101",
    old_data: { stock_quantity: 800 },
    new_data: { stock_quantity: 1000 },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    user_email: "staff@erplocal.vn",
  },
  {
    id: "log-4",
    user_id: "demo-user-1",
    action: "Cấp phát thiết bị CCDC-001 (MacBook Pro M2)",
    table_name: "ccdc_register",
    record_id: "ccdc-1",
    old_data: { assignedToId: "", status: "in_stock" },
    new_data: { assignedToId: "member-1", status: "in_use" },
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    user_email: "admin@erplocal.vn",
  },
  {
    id: "log-5",
    user_id: "demo-user-1",
    action: "Phê duyệt Đề xuất chi tiêu mua sắm thiết bị phụ trợ",
    table_name: "approval_requests",
    record_id: "req-eoffice-948",
    old_data: { status: "submitted" },
    new_data: { status: "approved" },
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    user_email: "director@erplocal.vn",
  },
  {
    id: "log-6",
    user_id: "demo-user-2",
    action: "Thay đổi ca chấm công - Cấu hình ca làm việc văn phòng",
    table_name: "attendance_shifts",
    record_id: "shift-office-hq",
    old_data: { start_time: "08:30", end_time: "17:30" },
    new_data: { start_time: "08:00", end_time: "17:00" },
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    user_email: "hr-manager@erplocal.vn",
  },
  {
    id: "log-7",
    user_id: "demo-user-1",
    action: "Kích hoạt Quy trình tự động hóa Botcake Chatbot",
    table_name: "workflows",
    record_id: "wf-botcake-09",
    old_data: { is_active: false },
    new_data: { is_active: true },
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    user_email: "admin@erplocal.vn",
  },
  {
    id: "log-8",
    user_id: "demo-user-3",
    action: "Hủy đơn hàng POS do khách đổi phương thức thanh toán",
    table_name: "orders",
    record_id: "ord-pos-904",
    old_data: { status: "pending" },
    new_data: { status: "cancelled", cancel_reason: "Đổi sang chuyển khoản ngân hàng" },
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    user_email: "cashier@erplocal.vn",
  },
  {
    id: "log-9",
    user_id: "demo-user-1",
    action: "Tạo Bút toán ghi nhận Doanh thu dự án NAMTHIEN đợt 1",
    table_name: "accounting_entries",
    record_id: "entry-90412",
    old_data: null,
    new_data: { amount: 150000000, debit_acc: "1121", credit_acc: "511" },
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    user_email: "accountant@erplocal.vn",
  },
  {
    id: "log-10",
    user_id: "demo-user-1",
    action: "Cập nhật vai trò phân quyền nhân viên",
    table_name: "company_members",
    record_id: "member-5",
    old_data: { role: "member" },
    new_data: { role: "manager" },
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    user_email: "admin@erplocal.vn",
  },
  {
    id: "log-11",
    user_id: "demo-user-2",
    action: "Cấu hình liên kết API Gateway Pancake Fintab",
    table_name: "integration_settings",
    record_id: "gateway-fintab",
    old_data: { sync_enabled: false },
    new_data: { sync_enabled: true, endpoint: "https://api.pancake.vn/fintab/v1" },
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    user_email: "admin@erplocal.vn",
  },
  {
    id: "log-12",
    user_id: "demo-user-1",
    action: "Nghiệm thu và đóng dự án JUNO (Summer Collection 2026)",
    table_name: "projects",
    record_id: "proj-15",
    old_data: { status: "active" },
    new_data: { status: "completed" },
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    user_email: "manager@erplocal.vn",
  },
  {
    id: "log-13",
    user_id: "demo-user-3",
    action: "Nhập excel bảng lương tháng 6 lên hệ thống CRM",
    table_name: "crm_salary_tables",
    record_id: "salary-june-2026",
    old_data: null,
    new_data: { total_records: 48, net_payroll: 428000000 },
    created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
    user_email: "hr-staff@erplocal.vn",
  },
  {
    id: "log-14",
    user_id: "demo-user-1",
    action: "Thanh lý thiết bị gỗ cũ hư hỏng CCDC-012",
    table_name: "ccdc_register",
    record_id: "ccdc-12",
    old_data: { status: "in_stock" },
    new_data: { status: "liquidated", liquidation_price: 350000 },
    created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    user_email: "accountant@erplocal.vn",
  },
  {
    id: "log-15",
    user_id: "demo-user-2",
    action: "Tạo phiếu Đề nghị mua sắm máy chủ Cloud Backup",
    table_name: "approval_requests",
    record_id: "req-eoffice-989",
    old_data: null,
    new_data: { title: "Mua máy chủ sao lưu tự động", cost: 12500000 },
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    user_email: "it-support@erplocal.vn",
  }
];

function generate1000AuditLogs(): AuditLog[] {
  const actions = [
    { action: "Cập nhật định mức BOM", table_name: "product_bom", getOldNew: () => ({ old: { qty: 1.2 }, new: { qty: 1.5 } }) },
    { action: "Sửa giá bán sản phẩm", table_name: "products", getOldNew: () => ({ old: { price: 95000 }, new: { price: 99000 } }) },
    { action: "Điều chỉnh tồn kho vật tư decal", table_name: "inventory_transactions", getOldNew: () => ({ old: { stock: 800 }, new: { stock: 1000 } }) },
    { action: "Cấp phát thiết bị CCDC-001 (MacBook Pro M2)", table_name: "ccdc_register", getOldNew: () => ({ old: { status: "in_stock" }, new: { status: "in_use", user: "member-1" } }) },
    { action: "Phê duyệt Đề xuất chi tiêu mua sắm thiết bị", table_name: "approval_requests", getOldNew: () => ({ old: { status: "submitted" }, new: { status: "approved" } }) },
    { action: "Thay đổi ca chấm công - Cấu hình ca văn phòng", table_name: "attendance_shifts", getOldNew: () => ({ old: { start: "08:30" }, new: { start: "08:00" } }) },
    { action: "Kích hoạt Quy trình tự động hóa Botcake Chatbot", table_name: "workflows", getOldNew: () => ({ old: { is_active: false }, new: { is_active: true } }) },
    { action: "Hủy đơn hàng POS do khách đổi phương thức thanh toán", table_name: "orders", getOldNew: () => ({ old: { status: "pending" }, new: { status: "cancelled" } }) },
    { action: "Tạo Bút toán ghi nhận Doanh thu dự án NAMTHIEN đợt 1", table_name: "accounting_entries", getOldNew: () => ({ old: null, new: { amount: 150000000 } }) },
    { action: "Cập nhật vai trò phân quyền nhân viên", table_name: "company_members", getOldNew: () => ({ old: { role: "member" }, new: { role: "manager" } }) },
    { action: "Cấu hình liên kết API Gateway Pancake Fintab", table_name: "integration_settings", getOldNew: () => ({ old: { sync: false }, new: { sync: true } }) },
    { action: "Nghiệm thu và đóng dự án JUNO (Summer Collection 2026)", table_name: "projects", getOldNew: () => ({ old: { status: "active" }, new: { status: "completed" } }) },
    { action: "Nhập excel bảng lương tháng 6 lên hệ thống CRM", table_name: "crm_salary_tables", getOldNew: () => ({ old: null, new: { total: 48, net: 428000000 } }) },
    { action: "Thanh lý thiết bị gỗ cũ hư hỏng CCDC-012", table_name: "ccdc_register", getOldNew: () => ({ old: { status: "in_stock" }, new: { status: "liquidated" } }) },
    { action: "Tạo phiếu Đề nghị mua sắm máy chủ Cloud Backup", table_name: "approval_requests", getOldNew: () => ({ old: null, new: { title: "Mua máy chủ sao lưu tự động", cost: 12500000 } }) },
    { action: "Xác thực VNeID cho nhân viên mới", table_name: "vneid_verification", getOldNew: () => ({ old: null, new: { status: "verified", id: "037105001xxx" } }) },
    { action: "Tạo liên kết chi nhánh bán sỉ POS", table_name: "partners", getOldNew: () => ({ old: null, new: { name: "Tổng đại lý miền Nam", rate: 0.12 } }) },
    { action: "Đẩy thông báo chi tiết bảng lương về Pancake Work", table_name: "workflows_execution", getOldNew: () => ({ old: null, new: { channel: "#thong-bao-luong", status: "sent" } }) }
  ];

  const emails = [
    "admin@erplocal.vn", "manager@erplocal.vn", "hr-manager@erplocal.vn",
    "accountant@erplocal.vn", "staff@erplocal.vn", "cashier@erplocal.vn",
    "it-support@erplocal.vn", "hr-staff@erplocal.vn"
  ];

  const logs: AuditLog[] = [];
  let baseTime = Date.now();

  for (let i = 1; i <= 1000; i++) {
    const act = actions[Math.floor(Math.random() * actions.length)];
    const email = emails[Math.floor(Math.random() * emails.length)];
    const data = act.getOldNew();
    baseTime -= (Math.floor(Math.random() * 15) + 5) * 60000;

    logs.push({
      id: `log-gen-${1000 - i}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: `demo-user-${Math.floor(Math.random() * 10) + 1}`,
      action: act.action,
      table_name: act.table_name,
      record_id: `rec-id-${Math.floor(Math.random() * 500) + 1}`,
      old_data: data.old,
      new_data: data.new,
      created_at: new Date(baseTime).toISOString(),
      user_email: email,
      ip_address: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    });
  }
  return logs;
}

function getLocalAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(AUDIT_LOGS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length < 1000) {
        const fullLogs = generate1000AuditLogs();
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(fullLogs));
        return fullLogs;
      }
      return parsed;
    } catch {
      const fullLogs = generate1000AuditLogs();
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(fullLogs));
      return fullLogs;
    }
  }
  const fullLogs = generate1000AuditLogs();
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(fullLogs));
  return fullLogs;
}

export function useAuditLogs(limit = 100) {
  const queryClient = useQueryClient();

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", limit],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalAuditLogs().slice(0, limit);
      }
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const logAction = async (
    action: string,
    tableName: string,
    recordId?: string,
    oldData?: Record<string, any> | null,
    newData?: Record<string, any> | null
  ) => {
    if (isLocalDemoAuthEnabled()) {
      const logs = getLocalAuditLogs();
      const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        new_data: newData,
        created_at: new Date().toISOString(),
        user_email: "manager@erplocal.vn",
      };
      logs.unshift(newLog);
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      user_id: user?.id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
    });
  };

  // Real-time generator simulator
  useEffect(() => {
    if (!isLocalDemoAuthEnabled()) return;

    const interval = setInterval(() => {
      const logs = getLocalAuditLogs();
      const actions = [
        { action: "Cập nhật định mức BOM", table_name: "product_bom", getOldNew: () => ({ old: { qty: 1.2 }, new: { qty: 1.5 } }) },
        { action: "Sửa giá bán sản phẩm", table_name: "products", getOldNew: () => ({ old: { price: 95000 }, new: { price: 99000 } }) },
        { action: "Điều chỉnh tồn kho vật tư decal", table_name: "inventory_transactions", getOldNew: () => ({ old: { stock: 800 }, new: { stock: 1000 } }) },
        { action: "Cập nhật trạng thái CCDC", table_name: "ccdc_register", getOldNew: () => ({ old: { status: "in_stock" }, new: { status: "in_use" } }) },
        { action: "Tạo mới đơn hàng POS", table_name: "orders", getOldNew: () => ({ old: null, new: { id: "new-pos-ord", total: 450000 } }) }
      ];
      const emails = ["staff@erplocal.vn", "cashier@erplocal.vn", "accountant@erplocal.vn"];
      const act = actions[Math.floor(Math.random() * actions.length)];
      const email = emails[Math.floor(Math.random() * emails.length)];
      const data = act.getOldNew();

      const newLog: AuditLog = {
        id: `log-realtime-${Date.now()}`,
        user_id: "demo-user-realtime",
        action: act.action + " (Thời gian thực)",
        table_name: act.table_name,
        record_id: `rec-id-${Math.floor(Math.random() * 500) + 1}`,
        old_data: data.old,
        new_data: data.new,
        created_at: new Date().toISOString(),
        user_email: email,
        ip_address: "127.0.0.1",
        user_agent: "Browser Client Simulator"
      };

      logs.unshift(newLog);
      const limitedLogs = logs.slice(0, 1100);
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(limitedLogs));
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    }, 10000); // Sinh ngẫu nhiên mỗi 10 giây

    return () => clearInterval(interval);
  }, [queryClient]);

  return {
    auditLogs,
    isLoading,
    logAction,
  };
}

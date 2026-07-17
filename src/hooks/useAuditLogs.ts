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

function getLocalAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(AUDIT_LOGS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length < 10) {
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
        return DEFAULT_AUDIT_LOGS;
      }
      return parsed;
    } catch {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return DEFAULT_AUDIT_LOGS;
    }
  }
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
  return DEFAULT_AUDIT_LOGS;
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

  return {
    auditLogs,
    isLoading,
    logAction,
  };
}

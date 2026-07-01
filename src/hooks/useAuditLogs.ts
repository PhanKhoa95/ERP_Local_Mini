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
    action: "Sửa giá bán",
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
    action: "Điều chỉnh tồn kho vật tư",
    table_name: "inventory_transactions",
    record_id: "local-tx-101",
    old_data: { stock_quantity: 800 },
    new_data: { stock_quantity: 1000 },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    user_email: "staff@erplocal.vn",
  }
];

function getLocalAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(AUDIT_LOGS_KEY);
  if (!raw) {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
    return DEFAULT_AUDIT_LOGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
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

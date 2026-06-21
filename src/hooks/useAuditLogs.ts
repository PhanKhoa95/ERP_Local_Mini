import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export function useAuditLogs(limit = 100) {
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", limit],
    queryFn: async () => {
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
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ) => {
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

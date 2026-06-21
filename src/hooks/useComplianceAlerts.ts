import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

export function useComplianceAlerts() {
  const { companyId } = useCompanyContext();
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["compliance-alerts", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("compliance_alerts")
        .select("*, perf_employees(user_id, title)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("compliance_alerts").update({
        status: "resolved",
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compliance-alerts"] }); toast.success("Đã xử lý cảnh báo"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const scanContractExpiry = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      // Get contracts expiring within 30 days
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: contracts } = await supabase
        .from("employee_contracts")
        .select("id, employee_id, contract_type, end_date, contract_number")
        .eq("company_id", companyId)
        .eq("status", "active")
        .not("end_date", "is", null)
        .lte("end_date", in30Days.toISOString().split("T")[0])
        .gte("end_date", now.toISOString().split("T")[0]);

      if (!contracts?.length) {
        toast.info("Không có hợp đồng nào sắp hết hạn");
        return;
      }

      // Check existing alerts to avoid duplicates
      const { data: existingAlerts } = await supabase
        .from("compliance_alerts")
        .select("reference_id")
        .eq("company_id", companyId)
        .eq("alert_type", "contract_expiry")
        .eq("status", "pending");

      const existingIds = new Set((existingAlerts || []).map((a: any) => a.reference_id));

      const newAlerts = contracts
        .filter((c: any) => !existingIds.has(c.id))
        .map((c: any) => {
          const daysLeft = Math.ceil((new Date(c.end_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          return {
            company_id: companyId,
            alert_type: "contract_expiry",
            employee_id: c.employee_id,
            title: `Hợp đồng sắp hết hạn (${daysLeft} ngày)`,
            message: `HĐ ${c.contract_number || c.contract_type} hết hạn ngày ${c.end_date}`,
            due_date: c.end_date,
            reference_type: "employee_contract",
            reference_id: c.id,
          };
        });

      if (newAlerts.length) {
        const { error } = await supabase.from("compliance_alerts").insert(newAlerts);
        if (error) throw error;
        toast.success(`Phát hiện ${newAlerts.length} cảnh báo mới`);
      } else {
        toast.info("Không có cảnh báo mới");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance-alerts"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return { alerts, isLoading, resolveAlert, scanContractExpiry };
}

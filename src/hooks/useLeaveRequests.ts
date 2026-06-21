import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useApprovalRequests } from "@/hooks/useApprovalRequests";

export function useLeaveRequests() {
  const { companyId } = useCompanyContext();
  const { user } = useAuthContext();
  const { requests, isLoading: requestsLoading, createRequest, approveRequest, rejectRequest } = useApprovalRequests();

  const leaveRequests = requests.filter(r => r.request_type === "leave");
  const myLeaveRequests = leaveRequests.filter(r => r.requested_by === user?.id);

  // Calculate leave balance (12 days/year default)
  const { data: hireDate } = useQuery({
    queryKey: ["hire-date", user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return null;
      const { data } = await supabase
        .from("perf_employees")
        .select("hire_date")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .single();
      return data?.hire_date;
    },
    enabled: !!user?.id && !!companyId,
  });

  const approvedDays = myLeaveRequests
    .filter(r => r.status === "approved")
    .reduce((sum, r) => {
      try {
        const data = r.description ? JSON.parse(r.description) : {};
        return sum + (data.days || 1);
      } catch {
        return sum + 1;
      }
    }, 0);

  // Dynamic leave balance based on seniority
  const calculateAllowance = () => {
    if (!hireDate) return 12;
    const years = Math.floor((Date.now() - new Date(hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    // 12 base + 1 per year of seniority, max 20
    return Math.min(20, 12 + years);
  };
  const annualAllowance = calculateAllowance();
  const remainingDays = annualAllowance - approvedDays;

  const submitLeave = async (leaveData: {
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    days: number;
  }) => {
    return createRequest.mutateAsync({
      request_type: "leave",
      title: `Nghỉ phép: ${leaveData.leave_type} (${leaveData.days} ngày)`,
      description: JSON.stringify(leaveData),
      amount: leaveData.days,
    });
  };

  return {
    leaveRequests,
    myLeaveRequests,
    isLoading: requestsLoading,
    approvedDays,
    remainingDays,
    annualAllowance,
    hireDate,
    submitLeave,
    approveRequest,
    rejectRequest,
  };
}

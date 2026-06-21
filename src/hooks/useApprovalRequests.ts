import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";

import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

const APPROVALS_KEY = "erp-mini-local-demo-approval-requests";

const DEFAULT_APPROVALS = (companyId: string) => [
  {
    id: "app-1",
    company_id: companyId,
    request_type: "purchase",
    title: "Đề xuất mua sắm màn hình Dell UltraSharp cho phòng Kỹ thuật",
    description: "Cần mua thêm 1 màn hình Dell UltraSharp 27 inch để thiết kế hệ thống và sơ đồ WBS.",
    amount: 8500000,
    requested_by: "emp-a",
    status: "submitted",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "app-2",
    company_id: companyId,
    request_type: "expense",
    title: "Đề xuất tạm ứng chi phí đi công tác miền Nam",
    description: "Chi phí vé máy bay và lưu trú cho chuyến công tác đối soát dữ liệu với nhà phân phối miền Nam.",
    amount: 3000000,
    requested_by: "emp-b",
    status: "approved",
    approved_by: "user-admin",
    approved_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

function getLocalApprovals(companyId: string): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(APPROVALS_KEY);
  if (!raw) {
    const seeded = DEFAULT_APPROVALS(companyId);
    localStorage.setItem(APPROVALS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_APPROVALS(companyId);
  }
}

function saveLocalApprovals(apps: any[]) {
  localStorage.setItem(APPROVALS_KEY, JSON.stringify(apps));
}

export function useApprovalRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();
  const { user } = useAuthContext();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["approval-requests", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      if (isLocalDemoAuthEnabled()) {
        return getLocalApprovals(companyId);
      }

      const { data, error } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createRequest = useMutation({
    mutationFn: async (request: {
      request_type: string;
      title: string;
      description?: string;
      amount?: number;
      reference_type?: string;
      reference_id?: string;
    }) => {
      if (!companyId || !user?.id) throw new Error("Missing approval context");

      if (isLocalDemoAuthEnabled()) {
        const apps = getLocalApprovals(companyId);
        const newApp = {
          id: `app-${Date.now()}`,
          company_id: companyId,
          ...request,
          requested_by: user.id,
          status: "submitted",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        saveLocalApprovals([newApp, ...apps]);
        return newApp;
      }

      const { data, error } = await supabase
        .from("approval_requests")
        .insert({
          company_id: companyId,
          ...request,
          requested_by: user.id,
          status: "submitted",
        })
        .select()
        .single();
      if (error) throw error;

      // Send notification to admins/managers
      const { data: managers } = await supabase
        .from("company_members")
        .select("user_id")
        .eq("company_id", companyId)
        .in("role", ["admin", "manager"]);

      if (managers?.length) {
        const notifications = managers.map((m) => ({
          user_id: m.user_id,
          company_id: companyId,
          type: "approval_request",
          title: "Yêu cầu phê duyệt mới",
          message: `${request.title} - ${request.request_type}`,
          data: { request_id: data.id, request_type: request.request_type },
        }));
        await supabase.from("rag_notifications").insert(notifications);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      toast({ title: "Gửi yêu cầu phê duyệt thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const approveRequest = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const apps = getLocalApprovals(companyId || "");
        const idx = apps.findIndex(a => a.id === id);
        if (idx === -1) throw new Error("Không tìm thấy yêu cầu");
        
        apps[idx].status = "approved";
        apps[idx].approved_by = user?.id || "user-admin";
        apps[idx].approved_at = new Date().toISOString();
        apps[idx].updated_at = new Date().toISOString();
        saveLocalApprovals(apps);
        return apps[idx];
      }

      // C1 fix: Prevent self-approval
      const { data: request } = await supabase.from("approval_requests").select("requested_by").eq("id", id).single();
      if (request?.requested_by === user?.id) throw new Error("Không thể tự duyệt yêu cầu của chính mình");
      const { data, error } = await supabase
        .from("approval_requests")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Notify requester
      await supabase.from("rag_notifications").insert({
        user_id: data.requested_by,
        company_id: companyId!,
        type: "approval_result",
        title: "Yêu cầu đã được duyệt ✅",
        message: data.title,
        data: { request_id: data.id, status: "approved" },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      toast({ title: "Đã phê duyệt yêu cầu" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const apps = getLocalApprovals(companyId || "");
        const idx = apps.findIndex(a => a.id === id);
        if (idx === -1) throw new Error("Không tìm thấy yêu cầu");
        
        apps[idx].status = "rejected";
        apps[idx].approved_by = user?.id || "user-admin";
        apps[idx].approved_at = new Date().toISOString();
        apps[idx].rejection_reason = reason;
        apps[idx].updated_at = new Date().toISOString();
        saveLocalApprovals(apps);
        return apps[idx];
      }

      // C1 fix: Prevent self-rejection
      const { data: request } = await supabase.from("approval_requests").select("requested_by").eq("id", id).single();
      if (request?.requested_by === user?.id) throw new Error("Không thể tự từ chối yêu cầu của chính mình");
      const { data, error } = await supabase
        .from("approval_requests")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("rag_notifications").insert({
        user_id: data.requested_by,
        company_id: companyId!,
        type: "approval_result",
        title: "Yêu cầu bị từ chối ❌",
        message: `${data.title} - Lý do: ${reason}`,
        data: { request_id: data.id, status: "rejected", reason },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      toast({ title: "Đã từ chối yêu cầu" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return { requests, isLoading, createRequest, approveRequest, rejectRequest };
}


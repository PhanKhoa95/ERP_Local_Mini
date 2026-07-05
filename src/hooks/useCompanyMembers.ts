import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "./useCompanyContext";
import { isLocalDemoAuthEnabled, LOCAL_DEMO_USER_ID, LOCAL_DEMO_AUTH_EVENT } from "@/lib/localDemoAuth";
import { getLocalCompanyMembers } from "./usePermissions";

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  region: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  email?: string;
}

const LOCAL_MEMBERS_KEY = "erp-mini-local-demo-company-members";

export function useCompanyMembers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { companyId } = useCompanyContext();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["company-members", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalCompanyMembers() as CompanyMember[];
      }
      const { data, error } = await supabase
        .from("company_members")
        .select("*, profiles:user_id(full_name, phone, avatar_url)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        profile: m.profiles || null,
      })) as CompanyMember[];
    },
    enabled: !!companyId,
  });

  const { data: customRoles = [] } = useQuery({
    queryKey: ["custom-roles", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-custom-roles");
        if (!raw) return [];
        try { return JSON.parse(raw); } catch { return []; }
      }
      const { data, error } = await (supabase as any)
        .from("custom_roles")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const membersList = getLocalCompanyMembers();
        const oldMember = membersList.find((m: any) => m.id === memberId);
        const updated = membersList.map((m: any) => m.id === memberId ? { ...m, role } : m);
        localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(updated));

        // Log to local audit logs
        const localAuditLogsKey = "erp-mini-local-demo-audit-logs";
        const logs = (() => {
          try {
            return JSON.parse(localStorage.getItem(localAuditLogsKey) || "[]");
          } catch {
            return [];
          }
        })();
        logs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          action: `Cập nhật vai trò nhân viên thành ${role}`,
          table_name: "company_members",
          record_id: memberId,
          old_data: oldMember,
          new_data: { ...oldMember, role },
          created_at: new Date().toISOString(),
          user_email: "admin@local.test"
        });
        localStorage.setItem(localAuditLogsKey, JSON.stringify(logs));

        if (oldMember?.user_id === LOCAL_DEMO_USER_ID) {
          localStorage.setItem("erp-mini-local-demo-role", role);
          window.dispatchEvent(new Event(LOCAL_DEMO_AUTH_EVENT));
        }
        return;
      }

      const { data: oldMember } = await supabase
        .from("company_members")
        .select("*")
        .eq("id", memberId)
        .single();

      const { error } = await supabase
        .from("company_members")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("audit_logs").insert({
        user_id: user?.id,
        action: `Cập nhật vai trò nhân viên thành ${role}`,
        table_name: "company_members",
        record_id: memberId,
        old_data: oldMember as any,
        new_data: { ...oldMember, role } as any
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-members"] });
      toast({ title: "Đã cập nhật vai trò" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    },
  });

  const updateRegion = useMutation({
    mutationFn: async ({ memberId, region }: { memberId: string; region: string | null }) => {
      if (isLocalDemoAuthEnabled()) {
        const membersList = getLocalCompanyMembers();
        const oldMember = membersList.find((m: any) => m.id === memberId);
        const updated = membersList.map((m: any) => m.id === memberId ? { ...m, region } : m);
        localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(updated));

        // Log to local audit logs
        const localAuditLogsKey = "erp-mini-local-demo-audit-logs";
        const logs = (() => {
          try {
            return JSON.parse(localStorage.getItem(localAuditLogsKey) || "[]");
          } catch {
            return [];
          }
        })();
        logs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          action: `Cập nhật vùng miền nhân viên thành ${region || "Toàn quốc"}`,
          table_name: "company_members",
          record_id: memberId,
          old_data: oldMember,
          new_data: { ...oldMember, region },
          created_at: new Date().toISOString(),
          user_email: "admin@local.test"
        });
        localStorage.setItem(localAuditLogsKey, JSON.stringify(logs));
        return;
      }

      const { data: oldMember } = await supabase
        .from("company_members")
        .select("*")
        .eq("id", memberId)
        .single();

      const { error } = await (supabase as any)
        .from("company_members")
        .update({ region })
        .eq("id", memberId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("audit_logs").insert({
        user_id: user?.id,
        action: `Cập nhật vùng miền nhân viên thành ${region || "Toàn quốc"}`,
        table_name: "company_members",
        record_id: memberId,
        old_data: oldMember as any,
        new_data: { ...oldMember, region } as any
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-members"] });
      toast({ title: "Đã cập nhật vùng miền" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (isLocalDemoAuthEnabled()) {
        const membersList = getLocalCompanyMembers();
        const updated = membersList.filter((m: any) => m.id !== memberId);
        localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(updated));
        return;
      }
      const { error } = await supabase
        .from("company_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-members"] });
      toast({ title: "Đã xóa thành viên" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    },
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data: allProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name");
      
      if (profileError) throw new Error("Không thể tìm kiếm người dùng");
      throw new Error("Vui lòng sử dụng User ID để thêm thành viên. Người dùng cần đăng ký tài khoản trước.");
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    },
  });

  const addMemberById = useMutation({
    mutationFn: async ({ 
      userId, 
      role,
      method = "uuid",
      inputValue = ""
    }: { 
      userId: string; 
      role: string;
      method?: "uuid" | "email" | "phone" | "facebook_id" | "username";
      inputValue?: string;
    }) => {
      if (!companyId) throw new Error("Không tìm thấy công ty");
      
      let targetUserId = userId;
      let targetEmail = `${userId}@local.test`;
      let targetPhone: string | null = null;
      let targetFullName = `Demo User (${userId.substring(0, 4)})`;

      if (method !== "uuid" && inputValue) {
        targetUserId = `demo-u-${Date.now()}`;
        if (method === "email") {
          targetEmail = inputValue;
          targetFullName = inputValue.split("@")[0];
        } else if (method === "phone") {
          targetPhone = inputValue;
          targetFullName = `SĐT ${inputValue}`;
          targetEmail = `phone-${inputValue}@local.test`;
        } else if (method === "facebook_id") {
          targetFullName = `FB User ${inputValue}`;
          targetEmail = `fb-${inputValue}@local.test`;
        } else if (method === "username") {
          targetFullName = inputValue;
          targetEmail = `${inputValue}@local.test`;
        }
      }

      if (isLocalDemoAuthEnabled()) {
        const membersList = getLocalCompanyMembers();
        const existing = membersList.find((m: any) => m.user_id === (method === "uuid" ? userId : targetUserId));
        if (existing) throw new Error("Người dùng đã là thành viên");

        const newMemberId = `demo-member-${Date.now()}`;
        const newMember = {
          id: newMemberId,
          user_id: method === "uuid" ? userId : targetUserId,
          company_id: companyId,
          role,
          region: null,
          created_at: new Date().toISOString(),
          profile: {
            full_name: targetFullName,
            phone: targetPhone,
            avatar_url: null
          },
          email: targetEmail
        };
        membersList.push(newMember);
        localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(membersList));

        // Auto assign default department if set
        const rawDept = localStorage.getItem("erp-mini-local-demo-departments");
        if (rawDept) {
          try {
            const depts = JSON.parse(rawDept);
            const defaultDept = depts.find((d: any) => d.is_default);
            if (defaultDept) {
              defaultDept.member_ids.push(newMemberId);
              localStorage.setItem("erp-mini-local-demo-departments", JSON.stringify(depts));
            }
          } catch (e) {
            console.error("Auto assign default department error:", e);
          }
        }
        return;
      }

      // Supabase Mode
      let foundUserId = userId;
      if (method !== "uuid" && inputValue) {
        if (method === "phone") {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone", inputValue)
            .maybeSingle();
          if (error || !prof) throw new Error("Không tìm thấy profile với số điện thoại này");
          foundUserId = prof.id;
        } else {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .or(`full_name.eq.${inputValue},id.eq.${inputValue}`)
            .maybeSingle();
          if (!prof) throw new Error(`Không tìm thấy người dùng phù hợp với ${inputValue}`);
          foundUserId = prof.id;
        }
      }

      const { data: existing } = await supabase
        .from("company_members")
        .select("id")
        .eq("company_id", companyId)
        .eq("user_id", foundUserId)
        .maybeSingle();
      
      if (existing) throw new Error("Người dùng đã là thành viên");

      const { error } = await supabase
        .from("company_members")
        .insert({ company_id: companyId, user_id: foundUserId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-members"] });
      toast({ title: "Đã thêm thành viên" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    },
  });

  return { members, customRoles, isLoading, updateRole, updateRegion, removeMember, addMemberById };
}

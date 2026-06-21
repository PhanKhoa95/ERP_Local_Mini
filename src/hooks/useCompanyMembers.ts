import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "./useCompanyContext";

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  email?: string;
}

export function useCompanyMembers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { companyId } = useCompanyContext();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["company-members", companyId],
    queryFn: async () => {
      if (!companyId) return [];
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

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("company_members")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-members"] });
      toast({ title: "Đã cập nhật vai trò" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
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
      // Look up user by email in profiles via a workaround: query auth users isn't possible
      // Instead we look for the user by checking if a profile exists with matching auth email
      // We'll use a different approach: try to find the user_id from existing data
      const { data: existingMembers } = await supabase
        .from("company_members")
        .select("user_id")
        .eq("company_id", companyId!);

      // We need to find the user by email - use supabase admin or RPC
      // For now, inform user this requires the user to have signed up first
      // Use the profiles table to find users
      const { data: allProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name");
      
      if (profileError) throw new Error("Không thể tìm kiếm người dùng");

      // Since we can't query by email from profiles, we'll accept user_id directly
      // This is a simplified version - in production you'd use an edge function
      throw new Error("Vui lòng sử dụng User ID để thêm thành viên. Người dùng cần đăng ký tài khoản trước.");
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    },
  });

  const addMemberById = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!companyId) throw new Error("Không tìm thấy công ty");
      
      // Check if already a member
      const { data: existing } = await supabase
        .from("company_members")
        .select("id")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (existing) throw new Error("Người dùng đã là thành viên");

      const { error } = await supabase
        .from("company_members")
        .insert({ company_id: companyId, user_id: userId, role });
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

  return { members, isLoading, updateRole, removeMember, addMemberById };
}

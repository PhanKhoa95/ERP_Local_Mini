import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "manager" | "staff" | "viewer";

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  user_email?: string;
}

export function useUserRoles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const { data: currentUserRole } = useQuery({
    queryKey: ["current-user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (error) return "viewer" as AppRole;
      return data?.role as AppRole;
    },
    enabled: !!user?.id,
  });

  const assignRole = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .upsert({ user_id, role }, { onConflict: "user_id,role" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Phân quyền thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Xóa quyền thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const hasRole = (role: AppRole): boolean => {
    if (!currentUserRole) return false;
    const roleHierarchy: Record<AppRole, number> = {
      admin: 4,
      manager: 3,
      staff: 2,
      viewer: 1,
    };
    return roleHierarchy[currentUserRole] >= roleHierarchy[role];
  };

  const isAdmin = currentUserRole === "admin";

  return {
    userRoles,
    currentUserRole,
    isLoading,
    assignRole,
    removeRole,
    hasRole,
    isAdmin,
  };
}

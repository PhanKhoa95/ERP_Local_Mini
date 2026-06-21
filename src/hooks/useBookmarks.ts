import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export interface Bookmark {
  id: string;
  user_id: string;
  company_id: string;
  question: string;
  answer: string;
  citations: any;
  tags: string[];
  folder: string | null;
  notes: string | null;
  is_shared: boolean;
  created_at: string;
}

export function useBookmarks(companyId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["bookmarks", companyId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Bookmark[];
    },
    enabled: !!user?.id,
  });

  const addBookmark = useMutation({
    mutationFn: async (bookmark: Omit<Bookmark, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("bookmarks")
        .insert({ ...bookmark, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast({ title: "Đã lưu bookmark" });
    },
  });

  const removeBookmark = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookmarks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast({ title: "Đã xóa bookmark" });
    },
  });

  return { bookmarks, isLoading, addBookmark, removeBookmark };
}

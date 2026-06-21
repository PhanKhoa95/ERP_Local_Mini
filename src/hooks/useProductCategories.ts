import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import {
  createLocalProductCategory,
  deleteLocalProductCategory,
  getLocalProductCategories,
  updateLocalProductCategory,
} from "@/lib/localInventoryStore";

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryInsert {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parent_id?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
}

export function useProductCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalProductCategories() as ProductCategory[];
      }

      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as ProductCategory[];
    },
  });

  const activeCategories = categories.filter(c => c.is_active !== false);

  const createCategory = useMutation({
    mutationFn: async (category: ProductCategoryInsert & { name: string }) => {
      if (isLocalDemoAuthEnabled()) {
        return createLocalProductCategory(category) as ProductCategory;
      }

      const { data, error } = await supabase
        .from("product_categories")
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast({ title: "Thêm danh mục thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: ProductCategoryInsert & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        return updateLocalProductCategory({ id, ...updates }) as ProductCategory;
      }

      const { data, error } = await supabase
        .from("product_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast({ title: "Cập nhật danh mục thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        deleteLocalProductCategory(id);
        return;
      }

      const { error } = await supabase.from("product_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast({ title: "Xóa danh mục thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return {
    categories,
    activeCategories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

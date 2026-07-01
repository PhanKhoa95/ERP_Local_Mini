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
  warranty_months?: number;
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

export function parseCategoryMetadata(cat: any): ProductCategory {
  if (!cat) return cat;
  const desc = cat.description || "";
  let warrantyMonths = 3;
  
  const nameUpper = (cat.name || "").toUpperCase();
  if (nameUpper.includes("THANH PHAM") || nameUpper.includes("THÀNH PHẨM") || nameUpper.includes("THẺ QR")) {
    warrantyMonths = 12;
  } else if (nameUpper.includes("VAT TU") || nameUpper.includes("VẬT TƯ") || nameUpper.includes("BẢNG QR")) {
    warrantyMonths = 6;
  }

  if (desc.startsWith("{")) {
    try {
      const parsed = JSON.parse(desc);
      return {
        ...cat,
        description: parsed.desc || "",
        warranty_months: parsed.warranty_months !== undefined ? parsed.warranty_months : warrantyMonths,
      };
    } catch {
      // Ignore
    }
  }

  return {
    ...cat,
    warranty_months: warrantyMonths,
  };
}

export function serializeCategoryMetadata(desc: string, warrantyMonths: number): string {
  return JSON.stringify({
    desc: desc || "",
    warranty_months: warrantyMonths,
  });
}

export function useProductCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const raw = getLocalProductCategories();
        return (raw || []).map(parseCategoryMetadata) as ProductCategory[];
      }

      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []).map(parseCategoryMetadata) as ProductCategory[];
    },
  });

  const activeCategories = categories.filter(c => c.is_active !== false);

  const createCategory = useMutation({
    mutationFn: async (category: ProductCategoryInsert & { name: string; warranty_months?: number }) => {
      const { warranty_months, description, ...rest } = category;
      const serializedDesc = serializeCategoryMetadata(description || "", warranty_months !== undefined ? warranty_months : 3);
      
      const payload = {
        ...rest,
        description: serializedDesc,
      };

      if (isLocalDemoAuthEnabled()) {
        const created = createLocalProductCategory(payload as any);
        return parseCategoryMetadata(created) as ProductCategory;
      }

      const { data, error } = await supabase
        .from("product_categories")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return parseCategoryMetadata(data);
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
    mutationFn: async ({ id, warranty_months, description, ...updates }: ProductCategoryInsert & { id: string; warranty_months?: number }) => {
      const serializedDesc = serializeCategoryMetadata(description || "", warranty_months !== undefined ? warranty_months : 3);
      
      const payload = {
        ...updates,
        description: serializedDesc,
      };

      if (isLocalDemoAuthEnabled()) {
        const updated = updateLocalProductCategory({ id, ...payload } as any);
        return parseCategoryMetadata(updated) as ProductCategory;
      }

      const { data, error } = await supabase
        .from("product_categories")
        .update(payload as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return parseCategoryMetadata(data);
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

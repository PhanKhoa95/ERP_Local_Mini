import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export function useProductVariants(productId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      let query = supabase.from("product_variants").select("*").order("name");
      if (productId) query = query.eq("product_id", productId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId || productId === undefined,
  });

  const createVariant = useMutation({
    mutationFn: async (variant: Omit<ProductVariant, "id" | "created_at">) => {
      const { data, error } = await supabase.from("product_variants").insert(variant).select().single();
      if (error) throw error;
      // Update product has_variants flag
      await supabase.from("products").update({ has_variants: true }).eq("id", variant.product_id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Tạo biến thể thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateVariant = useMutation({
    mutationFn: async ({ id, ...variant }: Partial<ProductVariant> & { id: string }) => {
      const { data, error } = await supabase.from("product_variants").update(variant).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      toast({ title: "Cập nhật biến thể thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteVariant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      toast({ title: "Xóa biến thể thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return {
    variants,
    isLoading,
    createVariant,
    updateVariant,
    deleteVariant,
  };
}

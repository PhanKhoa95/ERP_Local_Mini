import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import {
  addLocalBomItem,
  deleteLocalBomItem,
  getLocalProductBom,
  getLocalProductsWithBom,
  updateLocalBomItem,
} from "@/lib/localInventoryStore";
import { isPositiveQuantity } from "@/lib/productionBom";

type Product = Tables<"products">;

export interface ProductBomItem {
  id: string;
  product_id: string;
  material_id: string;
  quantity: number;
  unit: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  material?: Product;
}

interface BomInsert {
  product_id: string;
  material_id: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

interface BomUpdate {
  quantity?: number;
  unit?: string;
  notes?: string;
  is_active?: boolean;
}

export function useProductBom(productId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch BOM for a specific product
  const { data: bomItems = [], isLoading: isBomLoading } = useQuery({
    queryKey: ["product-bom", productId],
    queryFn: async () => {
      if (!productId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalProductBom(productId) as ProductBomItem[];
      }

      const { data, error } = await supabase
        .from("product_bom")
        .select(`
          *,
          material:products!product_bom_material_id_fkey(*)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ProductBomItem[];
    },
    enabled: !!productId,
  });

  // Fetch all products that have BOM
  const { data: productsWithBom = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["products-with-bom"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalProductsWithBom();
      }

      const { data, error } = await supabase
        .from("product_bom")
        .select("product_id")
        .eq("is_active", true);
      if (error) throw error;
      return [...new Set(data.map(item => item.product_id))];
    },
  });

  // Add BOM item
  const addBomItem = useMutation({
    mutationFn: async (item: BomInsert) => {
      if (!isPositiveQuantity(Number(item.quantity))) {
        throw new Error("Định mức BOM phải lớn hơn 0");
      }

      if (isLocalDemoAuthEnabled()) {
        return addLocalBomItem(item);
      }

      const { data, error } = await supabase
        .from("product_bom")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-bom"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-bom"] });
      toast({ title: "Thêm nguyên vật liệu thành công" });
    },
    onError: (error: Error) => {
      if (error.message.includes("product_bom_unique")) {
        toast({ variant: "destructive", title: "Lỗi", description: "Nguyên vật liệu này đã tồn tại trong BOM" });
      } else if (error.message.includes("product_bom_no_self_reference")) {
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm sản phẩm làm NVL của chính nó" });
      } else {
        toast({ variant: "destructive", title: "Lỗi", description: error.message });
      }
    },
  });

  // Update BOM item
  const updateBomItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BomUpdate }) => {
      if (updates.quantity !== undefined && !isPositiveQuantity(Number(updates.quantity))) {
        throw new Error("Định mức BOM phải lớn hơn 0");
      }

      if (isLocalDemoAuthEnabled()) {
        return updateLocalBomItem(id, updates);
      }

      const { data, error } = await supabase
        .from("product_bom")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-bom"] });
      toast({ title: "Cập nhật thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  // Delete BOM item
  const deleteBomItem = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        deleteLocalBomItem(id);
        return;
      }

      const { error } = await supabase
        .from("product_bom")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-bom"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-bom"] });
      toast({ title: "Xóa nguyên vật liệu thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  // Calculate material consumption for a quantity
  const calculateConsumption = (quantity: number) => {
    return bomItems.map(item => ({
      material: item.material,
      materialId: item.material_id,
      bomQuantity: item.quantity,
      consumption: quantity * item.quantity,
      unit: item.unit || item.material?.unit || "cái",
    }));
  };

  // Check if materials are sufficient for a quantity
  const checkMaterialAvailability = (quantity: number) => {
    const consumption = calculateConsumption(quantity);
    return consumption.map(item => ({
      ...item,
      currentStock: item.material?.stock_quantity || 0,
      isAvailable: (item.material?.stock_quantity || 0) >= item.consumption,
      shortage: Math.max(0, item.consumption - (item.material?.stock_quantity || 0)),
    }));
  };

  return {
    bomItems,
    isBomLoading,
    productsWithBom,
    isProductsLoading,
    addBomItem,
    updateBomItem,
    deleteBomItem,
    calculateConsumption,
    checkMaterialAvailability,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { invalidateProductRelated, invalidateWarehouseRelated } from "@/lib/queryInvalidation";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import {
  createLocalProduct,
  deleteLocalProduct,
  getLocalProducts,
  updateLocalProduct,
} from "@/lib/localInventoryStore";

type Product = Tables<"products">;
type ProductInsert = TablesInsert<"products">;
type ProductUpdate = TablesUpdate<"products">;

export function useProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalProducts(companyId);
      }
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!companyId,
  });

  const createProduct = useMutation({
    mutationFn: async (product: ProductInsert) => {
      if (isLocalDemoAuthEnabled()) {
        if (!companyId) throw new Error("Missing local company context");
        return createLocalProduct(product, companyId);
      }

      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      if (isLocalDemoAuthEnabled()) {
        invalidateProductRelated(queryClient);
        invalidateWarehouseRelated(queryClient);
        toast({ title: "Them san pham local thanh cong" });
        return;
      }

      // Auto-create warehouse_stock record for default warehouse
      if (companyId && data) {
        try {
          const { data: defaultWarehouse } = await supabase
            .from("warehouses")
            .select("id")
            .eq("company_id", companyId)
            .eq("is_default", true)
            .single();
          if (defaultWarehouse) {
            await supabase.from("warehouse_stock").insert({
              warehouse_id: defaultWarehouse.id,
              product_id: data.id,
              quantity: data.stock_quantity || 0,
              min_stock: 0,
            });
          }
        } catch {
          // Non-critical: warehouse_stock creation failure should not block product creation
        }
      }
      invalidateProductRelated(queryClient);
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["product-bom"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-bom"] });
      invalidateWarehouseRelated(queryClient);
      toast({ title: "Thêm sản phẩm thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        return updateLocalProduct({ id, ...updates });
      }

      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateProductRelated(queryClient);
      toast({ title: "Cập nhật sản phẩm thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        deleteLocalProduct(id);
        return;
      }

      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        if (error.code === "23503") {
          throw new Error("Không thể xóa sản phẩm này vì đã có giao dịch, đơn hàng hoặc hóa đơn liên kết. Hãy tắt kích hoạt sản phẩm thay vì xóa để bảo toàn dữ liệu lịch sử.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      invalidateProductRelated(queryClient);
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["product-bom"] });
      queryClient.invalidateQueries({ queryKey: ["products-with-bom"] });
      toast({ title: "Xóa sản phẩm thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

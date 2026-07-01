import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

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

const LOCAL_VARIANTS_KEY = "erp-mini-local-demo-product-variants";
const LOCAL_PRODUCTS_KEY = "erp-mini-local-demo-products";

const DEFAULT_VARIANTS: ProductVariant[] = [
  {
    id: "local-var-sticker-red",
    product_id: "local-prod-sticker",
    sku: "PRD-STICKER-RED",
    name: "Sticker logo decal giấy - Đỏ",
    attributes: { "Màu sắc": "Đỏ" },
    cost_price: 45000,
    selling_price: 99000,
    stock_quantity: 200,
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-var-sticker-blue",
    product_id: "local-prod-sticker",
    sku: "PRD-STICKER-BLUE",
    name: "Sticker logo decal giấy - Xanh",
    attributes: { "Màu sắc": "Xanh" },
    cost_price: 45000,
    selling_price: 99000,
    stock_quantity: 250,
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z"
  }
];

function getLocalVariantsRaw(): ProductVariant[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_VARIANTS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_VARIANTS_KEY, JSON.stringify(DEFAULT_VARIANTS));
    // Seed has_variants = true for local-prod-sticker
    const products = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");
    const idx = products.findIndex((p: any) => p.id === "local-prod-sticker");
    if (idx !== -1) {
      products[idx].has_variants = true;
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
    }
    return DEFAULT_VARIANTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_VARIANTS;
  }
}

export function useProductVariants(productId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalVariantsRaw();
        if (productId) {
          return all.filter(v => v.product_id === productId);
        }
        return all;
      }

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
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalVariantsRaw();
        const duplicate = all.find(v => v.sku.trim().toLowerCase() === variant.sku.trim().toLowerCase());
        if (duplicate) throw new Error(`SKU biến thể "${variant.sku}" đã tồn tại.`);

        const newVar: ProductVariant = {
          ...variant,
          id: `local-var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          created_at: new Date().toISOString()
        };
        all.push(newVar);
        localStorage.setItem(LOCAL_VARIANTS_KEY, JSON.stringify(all));

        // Update product has_variants flag in local products
        const products = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");
        const idx = products.findIndex((p: any) => p.id === variant.product_id);
        if (idx !== -1) {
          products[idx].has_variants = true;
          localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
        }
        return newVar;
      }

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
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalVariantsRaw();
        const idx = all.findIndex(v => v.id === id);
        if (idx === -1) throw new Error("Không tìm thấy biến thể");

        if (variant.sku) {
          const duplicate = all.find(v => v.id !== id && v.sku.trim().toLowerCase() === variant.sku!.trim().toLowerCase());
          if (duplicate) throw new Error(`SKU biến thể "${variant.sku}" đã tồn tại.`);
        }

        all[idx] = { ...all[idx], ...variant } as ProductVariant;
        localStorage.setItem(LOCAL_VARIANTS_KEY, JSON.stringify(all));
        return all[idx];
      }

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
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalVariantsRaw();
        const target = all.find(v => v.id === id);
        if (!target) return;

        const updated = all.filter(v => v.id !== id);
        localStorage.setItem(LOCAL_VARIANTS_KEY, JSON.stringify(updated));

        // If no variants left for this product, update has_variants = false
        const hasMore = updated.some(v => v.product_id === target.product_id);
        if (!hasMore) {
          const products = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");
          const idx = products.findIndex((p: any) => p.id === target.product_id);
          if (idx !== -1) {
            products[idx].has_variants = false;
            localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
          }
        }
        return;
      }

      // Online delete
      const { data: targetVar } = await supabase.from("product_variants").select("product_id").eq("id", id).single();
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;

      if (targetVar) {
        const { data: remaining } = await supabase.from("product_variants").select("id").eq("product_id", targetVar.product_id).limit(1);
        if (!remaining || remaining.length === 0) {
          await supabase.from("products").update({ has_variants: false }).eq("id", targetVar.product_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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

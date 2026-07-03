import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface WholesaleSettings {
  id: string;
  company_id: string;
  apply_by_order_qty_enabled: boolean;
  apply_by_order_qty_threshold: number;
  apply_by_product_qty_enabled: boolean;
  apply_by_product_qty_threshold: number;
  apply_by_variant_qty_enabled: boolean;
  apply_by_order_tags_enabled: boolean;
  apply_by_order_tags: string[];
  apply_by_customer_tags_enabled: boolean;
  apply_by_customer_tags: string[];
  no_other_discounts: boolean;
}

export interface ProductWholesalePrice {
  id: string;
  product_id: string;
  variant_id: string | null;
  min_quantity: number;
  wholesale_price: number;
}

const LOCAL_WHOLESALE_SETTINGS_KEY = "erp-mini-local-demo-wholesale-settings";
const LOCAL_WHOLESALE_PRICES_KEY = "erp-mini-local-demo-product-wholesale-prices";

const DEFAULT_SETTINGS: WholesaleSettings = {
  id: "local-wholesale-settings",
  company_id: "local-company",
  apply_by_order_qty_enabled: false,
  apply_by_order_qty_threshold: 10,
  apply_by_product_qty_enabled: false,
  apply_by_product_qty_threshold: 5,
  apply_by_variant_qty_enabled: true,
  apply_by_order_tags_enabled: false,
  apply_by_order_tags: [],
  apply_by_customer_tags_enabled: false,
  apply_by_customer_tags: [],
  no_other_discounts: false
};

const DEFAULT_PRICES: ProductWholesalePrice[] = [];

export function useWholesaleSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: settings = DEFAULT_SETTINGS, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["wholesale-settings", companyId],
    queryFn: async () => {
      if (!companyId) return DEFAULT_SETTINGS;
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(LOCAL_WHOLESALE_SETTINGS_KEY);
        if (!raw) {
          localStorage.setItem(LOCAL_WHOLESALE_SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, company_id: companyId }));
          return { ...DEFAULT_SETTINGS, company_id: companyId };
        }
        return JSON.parse(raw) as WholesaleSettings;
      }

      // Supabase fetch
      const { data, error } = await supabase
        .from("wholesale_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        // Seed initial settings
        const { data: seeded, error: seedError } = await supabase
          .from("wholesale_settings")
          .insert({ company_id: companyId })
          .select()
          .single();
        if (seedError) throw seedError;
        return seeded as unknown as WholesaleSettings;
      }
      return data as unknown as WholesaleSettings;
    },
    enabled: !!companyId
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<WholesaleSettings>) => {
      if (isLocalDemoAuthEnabled()) {
        const newSettings = { ...settings, ...updates };
        localStorage.setItem(LOCAL_WHOLESALE_SETTINGS_KEY, JSON.stringify(newSettings));
        return newSettings;
      }

      const { data, error } = await supabase
        .from("wholesale_settings")
        .update(updates)
        .eq("company_id", companyId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wholesale-settings", companyId] });
      toast({ title: "Cập nhật cấu hình bán sỉ thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    }
  });

  return {
    settings,
    isLoadingSettings,
    updateSettings
  };
}

export function useProductWholesalePrices(productId?: string, variantId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wholesalePrices = [], isLoading: isLoadingPrices } = useQuery({
    queryKey: ["product-wholesale-prices", productId, variantId],
    queryFn: async () => {
      if (!productId) return [];
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(LOCAL_WHOLESALE_PRICES_KEY);
        const all = raw ? (JSON.parse(raw) as ProductWholesalePrice[]) : DEFAULT_PRICES;
        return all.filter(p => p.product_id === productId && (variantId === undefined || p.variant_id === variantId));
      }

      let query = supabase
        .from("product_wholesale_prices")
        .select("*")
        .eq("product_id", productId);

      if (variantId !== undefined) {
        if (variantId === null) {
          query = query.is("variant_id", null);
        } else {
          query = query.eq("variant_id", variantId);
        }
      }

      const { data, error } = await query.order("min_quantity", { ascending: true });
      if (error) throw error;
      return data as unknown as ProductWholesalePrice[];
    },
    enabled: !!productId
  });

  const saveWholesalePrices = useMutation({
    mutationFn: async (prices: Omit<ProductWholesalePrice, "id">[]) => {
      if (!productId) throw new Error("Missing product_id");
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(LOCAL_WHOLESALE_PRICES_KEY);
        const all = raw ? (JSON.parse(raw) as ProductWholesalePrice[]) : DEFAULT_PRICES;
        
        // Filter out existing prices for this product and variant
        const remaining = all.filter(p => !(p.product_id === productId && (variantId === undefined ? p.variant_id === null : p.variant_id === variantId)));
        
        const newPrices: ProductWholesalePrice[] = prices.map((p, idx) => ({
          ...p,
          id: `local-wp-${Date.now()}-${idx}`
        }));
        
        const updated = [...remaining, ...newPrices];
        localStorage.setItem(LOCAL_WHOLESALE_PRICES_KEY, JSON.stringify(updated));
        return newPrices;
      }

      // Delete existing
      let deleteQuery = supabase
        .from("product_wholesale_prices")
        .delete()
        .eq("product_id", productId);
      
      if (variantId !== undefined) {
        if (variantId === null) {
          deleteQuery = deleteQuery.is("variant_id", null);
        } else {
          deleteQuery = deleteQuery.eq("variant_id", variantId);
        }
      }

      const { error: deleteError } = await deleteQuery;
      if (deleteError) throw deleteError;

      if (prices.length === 0) return [];

      const { data, error: insertError } = await supabase
        .from("product_wholesale_prices")
        .insert(prices)
        .select();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-wholesale-prices", productId, variantId] });
      toast({ title: "Cấu hình bậc giá sỉ thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    }
  });

  return {
    wholesalePrices,
    isLoadingPrices,
    saveWholesalePrices
  };
}

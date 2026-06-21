import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface PriceList {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  items?: PriceListItem[];
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  variant_id: string | null;
  custom_price: number;
  min_quantity: number;
  created_at: string;
  updated_at: string;
  products?: {
    sku: string;
    name: string;
  };
  product_variants?: {
    sku: string;
    name: string | null;
  };
}

export function usePriceLists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: priceLists = [], isLoading } = useQuery({
    queryKey: ["price_lists", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("price_lists" as any)
        .select(`
          *,
          items:price_list_items(
            id,
            price_list_id,
            product_id,
            variant_id,
            custom_price,
            min_quantity,
            products(sku, name),
            product_variants(sku, name)
          )
        `)
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;
      return data as unknown as PriceList[];
    },
    enabled: !!companyId,
  });

  const createPriceList = useMutation({
    mutationFn: async (priceList: Omit<PriceList, "id" | "company_id" | "created_at" | "updated_at" | "items">) => {
      const { data, error } = await supabase
        .from("price_lists" as any)
        .insert({ ...priceList, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price_lists", companyId] });
      toast({ title: "Tạo bảng giá thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updatePriceList = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PriceList> & { id: string }) => {
      const { data, error } = await supabase
        .from("price_lists" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price_lists", companyId] });
      toast({ title: "Cập nhật bảng giá thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const deletePriceList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_lists" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price_lists", companyId] });
      toast({ title: "Xóa bảng giá thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const savePriceListItems = useMutation({
    mutationFn: async ({
      priceListId,
      items,
    }: {
      priceListId: string;
      items: Array<{ product_id: string; variant_id?: string | null; custom_price: number; min_quantity?: number }>;
    }) => {
      // Clear old items first
      const { error: deleteError } = await supabase
        .from("price_list_items" as any)
        .delete()
        .eq("price_list_id", priceListId);
      
      if (deleteError) throw deleteError;

      if (items.length === 0) return;

      // Insert new items
      const insertPayload = items.map(i => ({
        price_list_id: priceListId,
        product_id: i.product_id,
        variant_id: i.variant_id || null,
        custom_price: i.custom_price,
        min_quantity: i.min_quantity || 1,
      }));

      const { error: insertError } = await supabase
        .from("price_list_items" as any)
        .insert(insertPayload);
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price_lists", companyId] });
      toast({ title: "Lưu chi tiết bảng giá thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { priceLists, isLoading, createPriceList, updatePriceList, deletePriceList, savePriceListItems };
}

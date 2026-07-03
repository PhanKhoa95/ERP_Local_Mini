import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface VariantComponent {
  id: string;
  parent_variant_id: string;
  child_variant_id: string;
  quantity: number;
}

const LOCAL_COMPONENTS_KEY = "erp-mini-local-demo-product-variant-components";

export function useProductVariantComponents(parentVariantId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: components = [], isLoading } = useQuery({
    queryKey: ["product-variant-components", parentVariantId],
    queryFn: async () => {
      if (!parentVariantId) return [];
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(LOCAL_COMPONENTS_KEY);
        const all = raw ? (JSON.parse(raw) as VariantComponent[]) : [];
        return all.filter(c => c.parent_variant_id === parentVariantId);
      }

      const { data, error } = await supabase
        .from("product_variant_components")
        .select("*")
        .eq("parent_variant_id", parentVariantId);

      if (error) throw error;
      return data as unknown as VariantComponent[];
    },
    enabled: !!parentVariantId
  });

  const saveComponents = useMutation({
    mutationFn: async (componentsToSave: Omit<VariantComponent, "id">[]) => {
      if (!parentVariantId) throw new Error("Missing parent_variant_id");
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(LOCAL_COMPONENTS_KEY);
        const all = raw ? (JSON.parse(raw) as VariantComponent[]) : [];
        
        // Remove existing
        const remaining = all.filter(c => c.parent_variant_id !== parentVariantId);
        
        const newComponents: VariantComponent[] = componentsToSave.map((c, idx) => ({
          ...c,
          id: `local-pvc-${Date.now()}-${idx}`
        }));
        
        const updated = [...remaining, ...newComponents];
        localStorage.setItem(LOCAL_COMPONENTS_KEY, JSON.stringify(updated));
        return newComponents;
      }

      // Supabase transaction
      const { error: deleteError } = await supabase
        .from("product_variant_components")
        .delete()
        .eq("parent_variant_id", parentVariantId);
        
      if (deleteError) throw deleteError;

      if (componentsToSave.length === 0) return [];

      const { data, error: insertError } = await supabase
        .from("product_variant_components")
        .insert(componentsToSave)
        .select();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variant-components", parentVariantId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Cấu hình thành phần cấu thành thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    }
  });

  return {
    components,
    isLoading,
    saveComponents
  };
}

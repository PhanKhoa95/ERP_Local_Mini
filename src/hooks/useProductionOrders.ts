import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { toast } from "sonner";
import { invalidateProductionRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { applyLocalProductionCompletion } from "@/lib/localInventoryStore";

const PRODUCTION_ORDERS_KEY = "erp-mini-local-demo-production-orders";

function getLocalProductionOrders(companyId: string): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PRODUCTION_ORDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLocalProductionOrders(pos: any[]) {
  localStorage.setItem(PRODUCTION_ORDERS_KEY, JSON.stringify(pos));
}

export function useProductionOrders() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: productionOrders = [], isLoading } = useQuery({
    queryKey: ["production-orders", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalProductionOrders(companyId);
        const productsRaw = localStorage.getItem("erp-mini-local-demo-products") || "[]";
        const products = JSON.parse(productsRaw);
        return local.map(po => {
          const prod = products.find((p: any) => p.id === po.product_id);
          return {
            ...po,
            products: prod ? { name: prod.name, sku: prod.sku, stock_quantity: prod.stock_quantity } : null,
            orders: null
          };
        });
      }
      const { data, error } = await supabase
        .from("production_orders")
        .select("*, products(name, sku, stock_quantity), orders(order_number)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createProductionOrder = useMutation({
    mutationFn: async (params: {
      product_id: string;
      quantity: number;
      order_id?: string;
      notes?: string;
      planned_start?: string;
      planned_end?: string;
    }) => {
      if (!companyId) throw new Error("No company");
      const productionNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

      if (isLocalDemoAuthEnabled()) {
        const local = getLocalProductionOrders(companyId);
        const newPO = {
          id: `po-${Date.now()}`,
          company_id: companyId,
          product_id: params.product_id,
          quantity: params.quantity,
          order_id: params.order_id || null,
          notes: params.notes || null,
          planned_start: params.planned_start || null,
          planned_end: params.planned_end || null,
          production_number: productionNumber,
          created_by: "local-demo-user",
          status: "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveLocalProductionOrders([newPO, ...local]);
        return newPO;
      }

      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("production_orders")
        .insert({
          company_id: companyId,
          product_id: params.product_id,
          quantity: params.quantity,
          order_id: params.order_id || null,
          notes: params.notes || null,
          planned_start: params.planned_start || null,
          planned_end: params.planned_end || null,
          production_number: productionNumber,
          created_by: user.user?.id || null,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Đã tạo lệnh sản xuất");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalProductionOrders(companyId || "");
        const idx = local.findIndex(po => po.id === id);
        if (idx >= 0) {
          const updates: any = { status };
          if (status === "in_progress") updates.actual_start = new Date().toISOString();
          if (status === "completed") {
            updates.actual_end = new Date().toISOString();
            const po = local[idx];
            applyLocalProductionCompletion({
              productionOrderId: po.id,
              productionNumber: po.production_number,
              productId: po.product_id,
              quantity: Number(po.quantity) || 0,
            });
          }
          local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
          saveLocalProductionOrders(local);
          return;
        }
        throw new Error("Không tìm thấy lệnh sản xuất local");
      }

      const updates: any = { status };
      if (status === "in_progress") updates.actual_start = new Date().toISOString();
      if (status === "completed") {
        const { error } = await supabase.rpc("complete_production_order" as any, {
          p_production_order_id: id,
        });
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("production_orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateProductionRelated(queryClient);
      toast.success("Đã cập nhật trạng thái");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { productionOrders, isLoading, createProductionOrder, updateStatus };
}

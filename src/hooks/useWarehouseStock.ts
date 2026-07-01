import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { invalidateWarehouseRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { getLocalProducts } from "@/lib/localInventoryStore";

interface WarehouseStockInfo {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  quantity: number;
  is_default: boolean;
}

interface ProductStockInfo {
  product_id: string;
  product_name: string;
  product_sku: string;
  total_stock: number;
  warehouses: WarehouseStockInfo[];
}

interface StockAvailability {
  product_id: string;
  required: number;
  available: boolean;
  recommended_warehouse_id: string | null;
  recommended_warehouse_name: string | null;
  alternative_warehouses: WarehouseStockInfo[];
  shortage: number;
}

export function useWarehouseStock() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  // Fetch all warehouse stock with details
  const { data: allStock = [], isLoading } = useQuery({
    queryKey: ["warehouse-stock-full", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const localProducts = getLocalProducts(companyId);
        return localProducts
          .filter(p => !p.is_service && (p.stock_quantity ?? 0) > 0)
          .map(p => ({
            id: `stock-${p.id}`,
            warehouse_id: "local-warehouse-default",
            product_id: p.id,
            quantity: p.stock_quantity ?? 0,
            min_stock: p.min_stock ?? 0,
            created_at: p.created_at,
            updated_at: p.updated_at,
            products: {
              id: p.id,
              sku: p.sku,
              name: p.name,
              stock_quantity: p.stock_quantity ?? 0,
              is_service: p.is_service ?? false,
              company_id: companyId,
            },
            warehouses: {
              id: "local-warehouse-default",
              code: "KHO-CHINH",
              name: "Kho chính",
              is_default: true,
              is_active: true,
              company_id: companyId,
            }
          })) as any[];
      }
      const { data, error } = await supabase
        .from("warehouse_stock")
        .select(`
          *,
          products!inner(id, sku, name, stock_quantity, is_service, company_id),
          warehouses!inner(id, code, name, is_default, is_active, company_id)
        `)
        .eq("warehouses.company_id", companyId)
        .gt("quantity", 0);
      if (error) throw error;
      return data;
    },
  });

  // Get stock info for a product across all warehouses
  const getProductStockInfo = (productId: string): ProductStockInfo | null => {
    const productStock = allStock.filter(s => s.product_id === productId);
    if (productStock.length === 0) return null;

    const product = productStock[0]?.products as any;
    if (!product) return null;

    return {
      product_id: productId,
      product_name: product.name,
      product_sku: product.sku,
      total_stock: productStock.reduce((sum, s) => sum + s.quantity, 0),
      warehouses: productStock
        .filter(s => s.warehouses && (s.warehouses as any).is_active)
        .map(s => ({
          warehouse_id: s.warehouse_id,
          warehouse_name: (s.warehouses as any).name,
          warehouse_code: (s.warehouses as any).code,
          quantity: s.quantity,
          is_default: (s.warehouses as any).is_default,
        }))
        .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0)),
    };
  };

  // Check stock availability for an order item
  const checkStockAvailability = (
    productId: string, 
    requiredQty: number,
    preferredWarehouseId?: string
  ): StockAvailability => {
    const stockInfo = getProductStockInfo(productId);
    
    if (!stockInfo) {
      return {
        product_id: productId,
        required: requiredQty,
        available: false,
        recommended_warehouse_id: null,
        recommended_warehouse_name: null,
        alternative_warehouses: [],
        shortage: requiredQty,
      };
    }

    // Check if preferred warehouse has enough stock
    if (preferredWarehouseId) {
      const preferredStock = stockInfo.warehouses.find(w => w.warehouse_id === preferredWarehouseId);
      if (preferredStock && preferredStock.quantity >= requiredQty) {
        return {
          product_id: productId,
          required: requiredQty,
          available: true,
          recommended_warehouse_id: preferredWarehouseId,
          recommended_warehouse_name: preferredStock.warehouse_name,
          alternative_warehouses: stockInfo.warehouses.filter(w => w.warehouse_id !== preferredWarehouseId && w.quantity >= requiredQty),
          shortage: 0,
        };
      }
    }

    // Find warehouse with enough stock (prioritize default warehouse)
    const warehouseWithStock = stockInfo.warehouses.find(w => w.quantity >= requiredQty);
    
    if (warehouseWithStock) {
      return {
        product_id: productId,
        required: requiredQty,
        available: true,
        recommended_warehouse_id: warehouseWithStock.warehouse_id,
        recommended_warehouse_name: warehouseWithStock.warehouse_name,
        alternative_warehouses: stockInfo.warehouses.filter(w => w.warehouse_id !== warehouseWithStock.warehouse_id && w.quantity >= requiredQty),
        shortage: 0,
      };
    }

    // Not enough stock in any single warehouse
    const totalAvailable = stockInfo.total_stock;
    return {
      product_id: productId,
      required: requiredQty,
      available: totalAvailable >= requiredQty,
      recommended_warehouse_id: stockInfo.warehouses[0]?.warehouse_id || null,
      recommended_warehouse_name: stockInfo.warehouses[0]?.warehouse_name || null,
      alternative_warehouses: stockInfo.warehouses,
      shortage: Math.max(0, requiredQty - totalAvailable),
    };
  };

  // Auto-select best warehouse for multiple items
  const autoSelectWarehouse = (
    items: Array<{ product_id: string; quantity: number }>
  ): {
    warehouse_id: string | null;
    warehouse_name: string | null;
    all_available: boolean;
    issues: Array<{
      product_id: string;
      product_name: string;
      required: number;
      available: number;
      shortage: number;
    }>;
  } => {
    if (items.length === 0) {
      return { warehouse_id: null, warehouse_name: null, all_available: true, issues: [] };
    }

    // Get all active warehouses
    const warehouses = new Map<string, { name: string; is_default: boolean; score: number }>();
    
    allStock.forEach(s => {
      const wh = s.warehouses as any;
      if (wh && wh.is_active && !warehouses.has(s.warehouse_id)) {
        warehouses.set(s.warehouse_id, {
          name: wh.name,
          is_default: wh.is_default,
          score: wh.is_default ? 1000 : 0, // Prioritize default warehouse
        });
      }
    });

    // Score each warehouse based on how many items it can fulfill
    items.forEach(item => {
      const productStock = allStock.filter(s => s.product_id === item.product_id);
      productStock.forEach(ps => {
        const wh = warehouses.get(ps.warehouse_id);
        if (wh && ps.quantity >= item.quantity) {
          wh.score += 10; // Can fulfill this item
        }
      });
    });

    // Find best warehouse
    let bestWarehouseId: string | null = null;
    let bestScore = -1;
    
    warehouses.forEach((wh, id) => {
      if (wh.score > bestScore) {
        bestScore = wh.score;
        bestWarehouseId = id;
      }
    });

    // Check issues with selected warehouse
    const issues: Array<{
      product_id: string;
      product_name: string;
      required: number;
      available: number;
      shortage: number;
    }> = [];

    let allAvailable = true;

    items.forEach(item => {
      const stockInfo = getProductStockInfo(item.product_id);
      const warehouseStock = bestWarehouseId 
        ? (stockInfo?.warehouses.find(w => w.warehouse_id === bestWarehouseId)?.quantity || 0)
        : 0;
      
      if (warehouseStock < item.quantity) {
        allAvailable = false;
        issues.push({
          product_id: item.product_id,
          product_name: stockInfo?.product_name || "Unknown",
          required: item.quantity,
          available: warehouseStock,
          shortage: item.quantity - warehouseStock,
        });
      }
    });

    return {
      warehouse_id: bestWarehouseId,
      warehouse_name: bestWarehouseId ? warehouses.get(bestWarehouseId)?.name || null : null,
      all_available: allAvailable,
      issues,
    };
  };

  // Update warehouse stock
  const updateWarehouseStock = useMutation({
    mutationFn: async (params: {
      warehouse_id: string;
      product_id: string;
      quantity: number;
      operation: 'set' | 'add' | 'subtract';
    }) => {
      const { warehouse_id, product_id, quantity, operation } = params;
      
      // Check if stock record exists
      const { data: existing } = await supabase
        .from("warehouse_stock")
        .select("*")
        .eq("warehouse_id", warehouse_id)
        .eq("product_id", product_id)
        .maybeSingle();

      let newQty = quantity;
      if (existing) {
        if (operation === 'add') newQty = existing.quantity + quantity;
        else if (operation === 'subtract') newQty = Math.max(0, existing.quantity - quantity);
        
        const { error } = await supabase
          .from("warehouse_stock")
          .update({ quantity: newQty })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("warehouse_stock")
          .insert({ warehouse_id, product_id, quantity: newQty });
        if (error) throw error;
      }

      // Sync total stock quantity back to products table
      const { data: allStocks } = await supabase
        .from("warehouse_stock")
        .select("quantity")
        .eq("product_id", product_id);
      
      const totalStock = (allStocks || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

      await supabase
        .from("products")
        .update({ stock_quantity: totalStock })
        .eq("id", product_id);
    },
    onSuccess: () => {
      invalidateWarehouseRelated(queryClient);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  return {
    allStock,
    isLoading,
    getProductStockInfo,
    checkStockAvailability,
    autoSelectWarehouse,
    updateWarehouseStock,
  };
}

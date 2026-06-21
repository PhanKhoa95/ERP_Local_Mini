import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { invalidateWarehouseRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { getLocalProducts } from "@/lib/localInventoryStore";

const WAREHOUSES_KEY = "erp-mini-local-demo-warehouses";

function getLocalWarehouses(companyId: string): Warehouse[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(WAREHOUSES_KEY);
  if (!raw) {
    const defaultWarehouse: Warehouse = {
      id: "local-warehouse-default",
      code: "KHO-CHINH",
      name: "Kho chính",
      address: "Địa chỉ mặc định",
      phone: null,
      manager_name: "Quản lý Demo",
      is_active: true,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(WAREHOUSES_KEY, JSON.stringify([defaultWarehouse]));
    return [defaultWarehouse];
  }
  try {
    return JSON.parse(raw) as Warehouse[];
  } catch {
    return [];
  }
}

function saveLocalWarehouses(warehouses: Warehouse[]) {
  localStorage.setItem(WAREHOUSES_KEY, JSON.stringify(warehouses));
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
    unit: string | null;
    image_url: string | null;
  };
  warehouses?: {
    id: string;
    code: string;
    name: string;
  };
}

interface StockTransfer {
  id: string;
  transfer_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  items?: StockTransferItem[];
}

interface StockTransferItem {
  id: string;
  transfer_id?: string;
  product_id: string;
  quantity: number;
  created_at?: string;
  products?: {
    id: string;
    sku: string;
    name: string;
  };
}

interface WarehouseInsert {
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  manager_name?: string | null;
  is_active?: boolean;
  is_default?: boolean;
}

interface StockTransferInsert {
  from_warehouse_id: string;
  to_warehouse_id: string;
  notes?: string | null;
  items: { product_id: string; quantity: number }[];
}

export function useWarehouses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  // Fetch all warehouses
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ["warehouses", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalWarehouses(companyId);
      }
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("company_id", companyId)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      
      // If no default warehouse exists, create one
      if (data.length === 0) {
        const { data: newWarehouse, error: createError } = await supabase
          .from("warehouses")
          .insert({
            code: "KHO-CHINH",
            name: "Kho chính",
            is_default: true,
            is_active: true,
            company_id: companyId,
          })
          .select()
          .single();
        
        if (!createError && newWarehouse) {
          return [newWarehouse] as Warehouse[];
        }
      }
      
      return data as Warehouse[];
    },
    enabled: !!companyId,
  });

  // Fetch warehouse stock with product details
  const { data: warehouseStock = [], isLoading: stockLoading } = useQuery({
    queryKey: ["warehouse-stock", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const localProducts = getLocalProducts(companyId);
        return localProducts.map(p => ({
          id: `stock-${p.id}`,
          warehouse_id: "local-warehouse-default",
          product_id: p.id,
          quantity: p.stock_quantity,
          min_stock: p.min_stock,
          created_at: p.created_at,
          updated_at: p.updated_at,
          products: {
            id: p.id,
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            image_url: p.image_url,
          },
          warehouses: {
            id: "local-warehouse-default",
            code: "KHO-CHINH",
            name: "Kho chính",
          }
        })) as WarehouseStock[];
      }
      const { data, error } = await supabase
        .from("warehouse_stock")
        .select(`
          *,
          products!inner(id, sku, name, unit, image_url, company_id),
          warehouses!inner(id, code, name, company_id)
        `)
        .eq("warehouses.company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WarehouseStock[];
    },
    enabled: !!companyId,
  });

  // Fetch stock transfers
  const { data: transfers = [], isLoading: transfersLoading } = useQuery({
    queryKey: ["stock-transfers", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("stock_transfers")
        .select(`
          *,
          stock_transfer_items(
            id,
            product_id,
            quantity,
            products(id, sku, name)
          )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch warehouse details separately
      const warehouseIds = new Set<string>();
      data?.forEach(t => {
        warehouseIds.add(t.from_warehouse_id);
        warehouseIds.add(t.to_warehouse_id);
      });
      
      const { data: warehouseData } = await supabase
        .from("warehouses")
        .select("*")
        .in("id", Array.from(warehouseIds));
      
      const warehouseMap = new Map(warehouseData?.map(w => [w.id, w]) || []);
      
      return data?.map(t => ({
        ...t,
        from_warehouse: warehouseMap.get(t.from_warehouse_id),
        to_warehouse: warehouseMap.get(t.to_warehouse_id),
        items: t.stock_transfer_items,
      })) as StockTransfer[];
    },
  });

  // Create warehouse
  const createWarehouse = useMutation({
    mutationFn: async (warehouse: WarehouseInsert) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalWarehouses(companyId || "");
        const newWarehouse: Warehouse = {
          id: `warehouse-${Date.now()}`,
          code: warehouse.code,
          name: warehouse.name,
          address: warehouse.address ?? null,
          phone: warehouse.phone ?? null,
          manager_name: warehouse.manager_name ?? null,
          is_active: warehouse.is_active ?? true,
          is_default: warehouse.is_default ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (newWarehouse.is_default) {
          local.forEach(w => w.is_default = false);
        }
        saveLocalWarehouses([...local, newWarehouse]);
        return newWarehouse;
      }

      const { data, error } = await supabase
        .from("warehouses")
        .insert({ ...warehouse, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({ title: "Tạo kho hàng thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  // Update warehouse
  const updateWarehouse = useMutation({
    mutationFn: async ({ id, ...data }: WarehouseInsert & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalWarehouses(companyId || "");
        const idx = local.findIndex(w => w.id === id);
        if (idx >= 0) {
          if (data.is_default) {
            local.forEach(w => w.is_default = false);
          }
          local[idx] = {
            ...local[idx],
            ...data,
            updated_at: new Date().toISOString(),
          } as Warehouse;
          saveLocalWarehouses(local);
          return;
        }
        throw new Error("Không tìm thấy kho local");
      }

      const { error } = await supabase
        .from("warehouses")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({ title: "Cập nhật kho hàng thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  // Create stock transfer
  const createTransfer = useMutation({
    mutationFn: async (transfer: StockTransferInsert) => {
      const transferNumber = `TRF-${Date.now()}`;
      
      // Create transfer record
      const { data: transferData, error: transferError } = await supabase
        .from("stock_transfers")
        .insert({
          transfer_number: transferNumber,
          from_warehouse_id: transfer.from_warehouse_id,
          to_warehouse_id: transfer.to_warehouse_id,
          notes: transfer.notes,
          status: 'pending',
          company_id: companyId,
        })
        .select()
        .single();
      
      if (transferError) throw transferError;
      
      // Create transfer items
      const items = transfer.items.map(item => ({
        transfer_id: transferData.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      
      const { error: itemsError } = await supabase
        .from("stock_transfer_items")
        .insert(items);
      
      if (itemsError) throw itemsError;
      
      return transferData;
    },
    onSuccess: () => {
      invalidateWarehouseRelated(queryClient);
      toast({ title: "Tạo phiếu luân chuyển thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  // Complete stock transfer (atomic operations)
  const completeTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      // Get transfer with items
      const { data: transfer, error: fetchError } = await supabase
        .from("stock_transfers")
        .select(`
          *,
          stock_transfer_items(product_id, quantity)
        `)
        .eq("id", transferId)
        .single();
      
      if (fetchError) throw fetchError;
      if (transfer.status !== 'pending' && transfer.status !== 'in_transit') {
        throw new Error("Phiếu luân chuyển không ở trạng thái hợp lệ để hoàn thành");
      }

      // Determine which warehouse is default (transfers within warehouses don't change products total)
      const { data: fromWh } = await supabase.from("warehouses").select("is_default").eq("id", transfer.from_warehouse_id).single();
      const { data: toWh } = await supabase.from("warehouses").select("is_default").eq("id", transfer.to_warehouse_id).single();
      
      // Update stock in warehouses using atomic upsert pattern
      for (const item of transfer.stock_transfer_items) {
        // Decrease from source warehouse — check existence first
        const { data: fromStock } = await supabase
          .from("warehouse_stock")
          .select("id, quantity")
          .eq("warehouse_id", transfer.from_warehouse_id)
          .eq("product_id", item.product_id)
          .single();
        
        if (fromStock) {
          if (fromStock.quantity < item.quantity) {
            throw new Error(`Kho nguồn không đủ tồn kho cho sản phẩm (có ${fromStock.quantity}, cần ${item.quantity})`);
          }
          await supabase
            .from("warehouse_stock")
            .update({ quantity: fromStock.quantity - item.quantity })
            .eq("id", fromStock.id);
        } else {
          throw new Error("Sản phẩm không tồn tại trong kho nguồn");
        }
        
        // Increase in destination warehouse — upsert
        const { data: toStock } = await supabase
          .from("warehouse_stock")
          .select("id, quantity")
          .eq("warehouse_id", transfer.to_warehouse_id)
          .eq("product_id", item.product_id)
          .single();
        
        if (toStock) {
          await supabase
            .from("warehouse_stock")
            .update({ quantity: toStock.quantity + item.quantity })
            .eq("id", toStock.id);
        } else {
          await supabase
            .from("warehouse_stock")
            .insert({
              warehouse_id: transfer.to_warehouse_id,
              product_id: item.product_id,
              quantity: item.quantity,
            });
        }

        // Sync products.stock_quantity if transfer involves default warehouse
        // Transfer from default → other: decrease products total
        // Transfer from other → default: increase products total
        // Transfer between non-default: no change to products total
        if (fromWh?.is_default && !toWh?.is_default) {
          await supabase.rpc("increment_stock_quantity", { p_product_id: item.product_id, p_quantity: -item.quantity });
        } else if (!fromWh?.is_default && toWh?.is_default) {
          await supabase.rpc("increment_stock_quantity", { p_product_id: item.product_id, p_quantity: item.quantity });
        }
      }
      
      // Update transfer status
      const { error: updateError } = await supabase
        .from("stock_transfers")
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq("id", transferId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      invalidateWarehouseRelated(queryClient);
      toast({ title: "Hoàn thành luân chuyển kho" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  // Cancel transfer
  const cancelTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("stock_transfers")
        .update({ status: 'cancelled' })
        .eq("id", transferId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateWarehouseRelated(queryClient);
      toast({ title: "Đã hủy phiếu luân chuyển" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  // Get stock by warehouse
  const getStockByWarehouse = (warehouseId: string) => {
    return warehouseStock.filter(s => s.warehouse_id === warehouseId);
  };

  // Get stock summary by product
  const getStockSummaryByProduct = (productId: string) => {
    return warehouseStock.filter(s => s.product_id === productId);
  };

  return {
    warehouses,
    warehouseStock,
    transfers,
    isLoading: warehousesLoading || stockLoading || transfersLoading,
    createWarehouse,
    updateWarehouse,
    createTransfer,
    completeTransfer,
    cancelTransfer,
    getStockByWarehouse,
    getStockSummaryByProduct,
  };
}

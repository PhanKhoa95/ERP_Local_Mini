import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction } from "@/lib/localInventoryStore";
import { invalidateOrderRelated } from "@/lib/queryInvalidation";
import { toast } from "sonner";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_price?: number;
  total?: number;
  products?: {
    id: string;
    name: string;
    sku: string | null;
    price?: number;
    is_service?: boolean;
  } | null;
}

export interface Order {
  id: string;
  company_id?: string | null;
  order_number: string;
  status: "pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned";
  total?: number | null;
  discount?: number | null;
  shipping_fee?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  shipping_address?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  priority?: string;
  source_type: string;
  order_type?: string | null;
  platform_order_id?: string | null;
  partner_id?: string | null;
  channel_id?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  subtotal?: number | null;
  paid_amount?: number | null;
  warehouse_id?: string | null;
  shipping_zone_id?: string | null;
  created_at: string;
  updated_at: string;
  sales_channels?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  partners?: {
    id: string;
    name: string;
  } | null;
  order_items?: OrderItem[];
}

const LOCAL_ORDERS_KEY = "erp-mini-local-demo-orders";

function getLocalOrders(companyId: string): Order[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
  if (!raw) {
    const defaultOrders: Order[] = [
      {
        id: "ord-1",
        company_id: companyId,
        order_number: "DH001",
        status: "delivered",
        total: 250000,
        discount: 0,
        shipping_fee: 30000,
        customer_name: "Nguyễn Văn An",
        customer_phone: "0912345678",
        customer_email: "an.nguyen@gmail.com",
        customer_address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        shipping_address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP9812739812",
        channel_id: "shopee-channel",
        warehouse_id: "wh-1",
        shipping_zone_id: "sz-1",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        order_items: [
          {
            id: "oi-1",
            order_id: "ord-1",
            product_id: "prod-1",
            quantity: 1,
            unit_price: 220000,
            total_price: 220000,
            products: { id: "prod-1", name: "Sản phẩm A", sku: "SKU-A" }
          }
        ]
      },
      {
        id: "ord-2",
        company_id: companyId,
        order_number: "DH002",
        status: "processing",
        total: 1200000,
        discount: 50000,
        shipping_fee: 45000,
        customer_name: "Phan Văn Khoa",
        customer_phone: "0987654321",
        customer_email: "khoa.phan@gmail.com",
        customer_address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        shipping_address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        payment_method: "cod",
        payment_status: "unpaid",
        priority: "high",
        source_type: "lazada",
        platform_order_id: "LZD8823719823",
        channel_id: "lazada-channel",
        warehouse_id: "wh-1",
        shipping_zone_id: "sz-1",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        order_items: [
          {
            id: "oi-2",
            order_id: "ord-2",
            product_id: "prod-2",
            quantity: 2,
            unit_price: 600000,
            total_price: 1200000,
            products: { id: "prod-2", name: "Sản phẩm B", sku: "SKU-B" }
          }
        ]
      },
      {
        id: "ord-3",
        company_id: companyId,
        order_number: "DH003",
        status: "pending",
        total: 540000,
        discount: 0,
        shipping_fee: 20000,
        customer_name: "Trần Thị Bé",
        customer_phone: "0905123456",
        customer_email: "be.tran@gmail.com",
        customer_address: "789 Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        shipping_address: "789 Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        payment_method: "vietqr",
        payment_status: "unpaid",
        priority: "medium",
        source_type: "tiktok",
        platform_order_id: "TKT7732894729",
        channel_id: "tiktok-channel",
        warehouse_id: "wh-1",
        shipping_zone_id: "sz-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_items: [
          {
            id: "oi-3",
            order_id: "ord-3",
            product_id: "prod-3",
            quantity: 1,
            unit_price: 520000,
            total_price: 520000,
            products: { id: "prod-3", name: "Sản phẩm C", sku: "SKU-C" }
          }
        ]
      }
    ];
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(defaultOrders));
    return defaultOrders;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

/** Deduct stock for order items (local demo mode) */
function deductLocalStock(items: any[], orderNumber: string) {
  for (const item of items) {
    if (!item.product_id) continue;
    try {
      createLocalInventoryTransaction({
        product_id: item.product_id,
        transaction_type: "out",
        quantity: item.quantity || 1,
        notes: `Trừ tồn kho - Đơn hàng ${orderNumber}`,
      });
    } catch (err) {
      // Log but don't block order creation for stock errors
      console.warn(`[Stock] Không thể trừ tồn kho cho ${item.product_id}:`, err);
    }
  }
}

/** Restore stock for order items (local demo mode) */
function restoreLocalStock(items: OrderItem[], orderNumber: string, reason: string) {
  for (const item of items) {
    if (!item.product_id) continue;
    try {
      createLocalInventoryTransaction({
        product_id: item.product_id,
        transaction_type: "in",
        quantity: item.quantity || 1,
        notes: `Hoàn tồn kho (${reason}) - Đơn hàng ${orderNumber}`,
      });
    } catch (err) {
      console.warn(`[Stock] Không thể hoàn tồn kho cho ${item.product_id}:`, err);
    }
  }
}

/** Deduct stock for order items (Supabase mode) */
async function deductSupabaseStock(items: any[], orderNumber: string) {
  for (const item of items) {
    if (!item.product_id) continue;
    try {
      // Atomic stock deduction via RPC
      await supabase.rpc("increment_stock_quantity" as any, {
        p_product_id: item.product_id,
        p_quantity: -(item.quantity || 1),
      });
      // Record inventory transaction
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("inventory_transactions").insert({
        product_id: item.product_id,
        transaction_type: "out",
        quantity: -(item.quantity || 1),
        reference_type: "order",
        reference_id: orderNumber,
        notes: `Trừ tồn kho - Đơn hàng ${orderNumber}`,
        created_by: user?.id,
      });
    } catch (err) {
      console.warn(`[Stock] Không thể trừ tồn kho cho ${item.product_id}:`, err);
    }
  }
}

/** Restore stock for order items (Supabase mode) */
async function restoreSupabaseStock(items: OrderItem[], orderNumber: string, reason: string) {
  for (const item of items) {
    if (!item.product_id) continue;
    try {
      await supabase.rpc("increment_stock_quantity" as any, {
        p_product_id: item.product_id,
        p_quantity: item.quantity || 1,
      });
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("inventory_transactions").insert({
        product_id: item.product_id,
        transaction_type: "in",
        quantity: item.quantity || 1,
        reference_type: `order-${reason}`,
        reference_id: orderNumber,
        notes: `Hoàn tồn kho (${reason}) - Đơn hàng ${orderNumber}`,
        created_by: user?.id,
      });
    } catch (err) {
      console.warn(`[Stock] Không thể hoàn tồn kho cho ${item.product_id}:`, err);
    }
  }
}

export function useOrders() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalOrders(companyId);
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          sales_channels(*),
          partners(*),
          order_items(*, products(*))
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!companyId,
  });

  const createOrder = useMutation({
    mutationFn: async (payload: { order: Omit<Order, "id" | "created_at" | "updated_at">; items?: any[] }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      
      const { items, order: orderData } = payload;
      
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalOrders(companyId);
        const orderId = `ord-${Date.now()}`;
        const orderNumber = orderData.order_number || orderId;
        const newOrder: Order = {
          ...orderData,
          id: orderId,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          order_items: (items || []).map((item, idx) => ({
            id: `oi-${Date.now()}-${idx}`,
            order_id: orderId,
            product_id: item.product_id || null,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total_price: (item.quantity || 1) * (item.unit_price || 0),
            products: item.product_name ? { id: item.product_id, name: item.product_name, sku: item.sku || null } : null
          }))
        } as any;
        
        all.unshift(newOrder);
        saveLocalOrders(all);

        // Deduct stock for local demo
        if (items && items.length > 0) {
          deductLocalStock(items, orderNumber);
        }

        return newOrder;
      }

      // Create Order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          ...orderData,
          company_id: companyId,
        } as any)
        .select()
        .single();
      
      if (orderErr) throw orderErr;

      // Create Order Items if present
      if (items && items.length > 0) {
        const itemsPayload = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: item.total ?? ((item.quantity || 1) * (item.unit_price || 0)),
        }));
        
        const { error: itemsErr } = await supabase
          .from("order_items")
          .insert(itemsPayload);
        
        if (itemsErr) throw itemsErr;

        // Deduct stock for Supabase mode
        await deductSupabaseStock(items, order.order_number || order.id);
      }

      return order;
    },
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      toast.success("Tạo đơn hàng thành công");
    },
    onError: (e: any) => {
      toast.error("Lỗi tạo đơn hàng: " + e.message);
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order["status"] }) => {
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalOrders(companyId || "");
        const idx = all.findIndex(o => o.id === id);
        if (idx !== -1) {
          const order = all[idx];
          const prevStatus = order.status;

          // Restore stock when cancelling or returning (if previously deducted)
          if ((status === "cancelled" || status === "returned") && prevStatus !== "cancelled" && prevStatus !== "returned") {
            if (order.order_items && order.order_items.length > 0) {
              restoreLocalStock(order.order_items, order.order_number, status === "cancelled" ? "hủy đơn" : "trả hàng");
            }
          }

          all[idx].status = status;
          all[idx].updated_at = new Date().toISOString();
          saveLocalOrders(all);
        }
        return;
      }

      // Fetch order with items to handle stock restoration
      const { data: order, error: fetchErr } = await supabase
        .from("orders")
        .select("*, order_items(*, products(id, name, is_service))")
        .eq("id", id)
        .single();

      if (fetchErr) throw fetchErr;

      const prevStatus = order.status;

      // Restore stock when cancelling or returning
      if ((status === "cancelled" || status === "returned") && prevStatus !== "cancelled" && prevStatus !== "returned") {
        const orderItems = (order.order_items || []) as OrderItem[];
        if (orderItems.length > 0) {
          await restoreSupabaseStock(orderItems, order.order_number, status === "cancelled" ? "cancel" : "return");
        }
      }

      const { error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      toast.success("Cập nhật trạng thái đơn hàng thành công");
    },
    onError: (e: any) => {
      toast.error("Lỗi cập nhật: " + e.message);
    }
  });

  return {
    orders,
    isLoading,
    createOrder,
    updateOrderStatus
  };
}



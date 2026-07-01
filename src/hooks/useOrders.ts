import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction, logLocalAction } from "@/lib/localInventoryStore";
import { invalidateOrderRelated } from "@/lib/queryInvalidation";
import { toast } from "sonner";
import { erpEventBus } from "@/lib/erpEventBus";
import { getLocalPartners, saveLocalPartners, serializePartnerMetadata, type Partner } from "./usePartners";

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
  voucher_id?: string | null;
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
    const subMonthsDate = (months: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d.toISOString();
    };

    const defaultOrders: Order[] = [
      {
        id: "ord-1",
        company_id: companyId,
        order_number: "POS-ORD-001",
        status: "delivered",
        total: 198000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 198000,
        customer_name: "Nguyễn Văn An",
        customer_phone: "0912345678",
        customer_email: "an.nguyen@gmail.com",
        customer_address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        shipping_address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "pos",
        platform_order_id: null,
        channel_id: "channel-retail",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        order_items: [
          {
            id: "oi-1",
            order_id: "ord-1",
            product_id: "local-prod-sticker",
            quantity: 2,
            unit_price: 99000,
            total_price: 198000,
            products: { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" }
          }
        ]
      },
      {
        id: "ord-2",
        company_id: companyId,
        order_number: "ORD-WS-002",
        status: "processing",
        total: 349000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 0,
        customer_name: "Phan Văn Khoa",
        customer_phone: "0987654321",
        customer_email: "khoa.phan@gmail.com",
        customer_address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        shipping_address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
        payment_method: "cod",
        payment_status: "unpaid",
        priority: "high",
        source_type: "facebook",
        platform_order_id: null,
        channel_id: "channel-facebook",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        order_items: [
          {
            id: "oi-2",
            order_id: "ord-2",
            product_id: "local-prod-combo-new",
            quantity: 1,
            unit_price: 349000,
            total_price: 349000,
            products: { id: "local-prod-combo-new", name: "Combo Shop Mới Khởi Nghiệp", sku: "PRD-COMBO-NEW" }
          }
        ]
      },
      {
        id: "ord-3",
        company_id: companyId,
        order_number: "ORD-WS-003",
        status: "pending",
        total: 540000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 0,
        customer_name: "Trần Thị Bé",
        customer_phone: "0905123456",
        customer_email: "be.tran@gmail.com",
        customer_address: "789 Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        shipping_address: "789 Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        payment_method: "vietqr",
        payment_status: "unpaid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP7732894729",
        channel_id: "channel-shopee",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_items: [
          {
            id: "oi-3",
            order_id: "ord-3",
            product_id: "local-prod-card",
            quantity: 4,
            unit_price: 135000,
            total_price: 540000,
            products: { id: "local-prod-card", name: "Card cảm ơn / Thank you card", sku: "PRD-CARD" }
          }
        ]
      },
      // Historical Orders
      {
        id: "ord-h1",
        company_id: companyId,
        order_number: "HIST-001",
        status: "delivered",
        total: 198000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 198000,
        customer_name: "Nguyễn Văn Hùng",
        customer_phone: "0911222333",
        customer_email: "hung@gmail.com",
        customer_address: "Q1, TP.HCM",
        shipping_address: "Q1, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "pos",
        platform_order_id: null,
        channel_id: "channel-retail",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(5),
        updated_at: subMonthsDate(5),
        order_items: [
          {
            id: "oi-h1",
            order_id: "ord-h1",
            product_id: "local-prod-sticker",
            quantity: 2,
            unit_price: 99000,
            total_price: 198000,
            products: { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" }
          }
        ]
      },
      {
        id: "ord-h2",
        company_id: companyId,
        order_number: "HIST-002",
        status: "delivered",
        total: 349000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 349000,
        customer_name: "Trần Thị Lan",
        customer_phone: "0922333444",
        customer_email: "lan@gmail.com",
        customer_address: "Q3, TP.HCM",
        shipping_address: "Q3, TP.HCM",
        payment_method: "cod",
        payment_status: "paid",
        priority: "medium",
        source_type: "zalo",
        platform_order_id: null,
        channel_id: "channel-zalo",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(5),
        updated_at: subMonthsDate(5),
        order_items: [
          {
            id: "oi-h2",
            order_id: "ord-h2",
            product_id: "local-prod-combo-new",
            quantity: 1,
            unit_price: 349000,
            total_price: 349000,
            products: { id: "local-prod-combo-new", name: "Combo Shop Mới Khởi Nghiệp", sku: "PRD-COMBO-NEW" }
          }
        ]
      },
      {
        id: "ord-h3",
        company_id: companyId,
        order_number: "HIST-003",
        status: "delivered",
        total: 540000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 540000,
        customer_name: "Phan Văn Minh",
        customer_phone: "0933444555",
        customer_email: "minh@gmail.com",
        customer_address: "Cầu Giấy, Hà Nội",
        shipping_address: "Cầu Giấy, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP001",
        channel_id: "channel-shopee",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(4),
        updated_at: subMonthsDate(4),
        order_items: [
          {
            id: "oi-h3",
            order_id: "ord-h3",
            product_id: "local-prod-card",
            quantity: 4,
            unit_price: 135000,
            total_price: 540000,
            products: { id: "local-prod-card", name: "Card cảm ơn / Thank you card", sku: "PRD-CARD" }
          }
        ]
      },
      {
        id: "ord-h4",
        company_id: companyId,
        order_number: "HIST-004",
        status: "delivered",
        total: 109000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 109000,
        customer_name: "Lê Thị Thảo",
        customer_phone: "0944555666",
        customer_email: "thao@gmail.com",
        customer_address: "Đống Đa, Hà Nội",
        shipping_address: "Đống Đa, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "low",
        source_type: "facebook",
        platform_order_id: null,
        channel_id: "channel-facebook",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(4),
        updated_at: subMonthsDate(4),
        order_items: [
          {
            id: "oi-h4",
            order_id: "ord-h4",
            product_id: "local-prod-qr-board",
            quantity: 1,
            unit_price: 109000,
            total_price: 109000,
            products: { id: "local-prod-qr-board", name: "Bảng QR để bàn mica", sku: "PRD-QR-BOARD" }
          }
        ]
      },
      {
        id: "ord-h5",
        company_id: companyId,
        order_number: "HIST-005",
        status: "delivered",
        total: 396000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 396000,
        customer_name: "Hoàng Văn Tuấn",
        customer_phone: "0955666777",
        customer_email: "tuan@gmail.com",
        customer_address: "Q10, TP.HCM",
        shipping_address: "Q10, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "pos",
        platform_order_id: null,
        channel_id: "channel-retail",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(3),
        updated_at: subMonthsDate(3),
        order_items: [
          {
            id: "oi-h5",
            order_id: "ord-h5",
            product_id: "local-prod-sticker",
            quantity: 4,
            unit_price: 99000,
            total_price: 396000,
            products: { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" }
          }
        ]
      },
      {
        id: "ord-h6",
        company_id: companyId,
        order_number: "HIST-006",
        status: "delivered",
        total: 698000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 698000,
        customer_name: "Ngô Thị Vân",
        customer_phone: "0966777888",
        customer_email: "van@gmail.com",
        customer_address: "Q5, TP.HCM",
        shipping_address: "Q5, TP.HCM",
        payment_method: "cod",
        payment_status: "paid",
        priority: "medium",
        source_type: "zalo",
        platform_order_id: null,
        channel_id: "channel-zalo",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(3),
        updated_at: subMonthsDate(3),
        order_items: [
          {
            id: "oi-h6",
            order_id: "ord-h6",
            product_id: "local-prod-combo-new",
            quantity: 2,
            unit_price: 349000,
            total_price: 698000,
            products: { id: "local-prod-combo-new", name: "Combo Shop Mới Khởi Nghiệp", sku: "PRD-COMBO-NEW" }
          }
        ]
      },
      {
        id: "ord-h7",
        company_id: companyId,
        order_number: "HIST-007",
        status: "delivered",
        total: 1080000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 1080000,
        customer_name: "Vũ Văn Hải",
        customer_phone: "0977888999",
        customer_email: "hai@gmail.com",
        customer_address: "Thanh Xuân, Hà Nội",
        shipping_address: "Thanh Xuân, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP002",
        channel_id: "channel-shopee",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(2),
        updated_at: subMonthsDate(2),
        order_items: [
          {
            id: "oi-h7",
            order_id: "ord-h7",
            product_id: "local-prod-card",
            quantity: 8,
            unit_price: 135000,
            total_price: 1080000,
            products: { id: "local-prod-card", name: "Card cảm ơn / Thank you card", sku: "PRD-CARD" }
          }
        ]
      },
      {
        id: "ord-h8",
        company_id: companyId,
        order_number: "HIST-008",
        status: "delivered",
        total: 218000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 218000,
        customer_name: "Đỗ Thị Quỳnh",
        customer_phone: "0988999000",
        customer_email: "quynh@gmail.com",
        customer_address: "Hai Bà Trưng, Hà Nội",
        shipping_address: "Hai Bà Trưng, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "low",
        source_type: "facebook",
        platform_order_id: null,
        channel_id: "channel-facebook",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(2),
        updated_at: subMonthsDate(2),
        order_items: [
          {
            id: "oi-h8",
            order_id: "ord-h8",
            product_id: "local-prod-qr-board",
            quantity: 2,
            unit_price: 109000,
            total_price: 218000,
            products: { id: "local-prod-qr-board", name: "Bảng QR để bàn mica", sku: "PRD-QR-BOARD" }
          }
        ]
      },
      {
        id: "ord-h9",
        company_id: companyId,
        order_number: "HIST-009",
        status: "delivered",
        total: 792000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 792000,
        customer_name: "Bùi Văn Nam",
        customer_phone: "0999000111",
        customer_email: "nam@gmail.com",
        customer_address: "Q7, TP.HCM",
        shipping_address: "Q7, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "pos",
        platform_order_id: null,
        channel_id: "channel-retail",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(1),
        updated_at: subMonthsDate(1),
        order_items: [
          {
            id: "oi-h9",
            order_id: "ord-h9",
            product_id: "local-prod-sticker",
            quantity: 8,
            unit_price: 99000,
            total_price: 792000,
            products: { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" }
          }
        ]
      },
      {
        id: "ord-h10",
        company_id: companyId,
        order_number: "HIST-010",
        status: "delivered",
        total: 1047000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 1047000,
        customer_name: "Đặng Thị Hoa",
        customer_phone: "0911333555",
        customer_email: "hoa@gmail.com",
        customer_address: "Q2, TP.HCM",
        shipping_address: "Q2, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "high",
        source_type: "zalo",
        platform_order_id: null,
        channel_id: "channel-zalo",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(1),
        updated_at: subMonthsDate(1),
        order_items: [
          {
            id: "oi-h10",
            order_id: "ord-h10",
            product_id: "local-prod-combo-new",
            quantity: 3,
            unit_price: 349000,
            total_price: 1047000,
            products: { id: "local-prod-combo-new", name: "Combo Shop Mới Khởi Nghiệp", sku: "PRD-COMBO-NEW" }
          }
        ]
      },
      {
        id: "ord-h11",
        company_id: companyId,
        order_number: "HIST-011",
        status: "delivered",
        total: 540000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 540000,
        customer_name: "Lâm Văn Tuấn",
        customer_phone: "0922444666",
        customer_email: "lamtuan@gmail.com",
        customer_address: "Tây Hồ, Hà Nội",
        shipping_address: "Tây Hồ, Hà Nội",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "medium",
        source_type: "shopee",
        platform_order_id: "SHP003",
        channel_id: "channel-shopee",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(1),
        updated_at: subMonthsDate(1),
        order_items: [
          {
            id: "oi-h11",
            order_id: "ord-h11",
            product_id: "local-prod-card",
            quantity: 4,
            unit_price: 135000,
            total_price: 540000,
            products: { id: "local-prod-card", name: "Card cảm ơn / Thank you card", sku: "PRD-CARD" }
          }
        ]
      },
      {
        id: "ord-h12",
        company_id: companyId,
        order_number: "HIST-012",
        status: "delivered",
        total: 149000,
        discount: 0,
        shipping_fee: 0,
        paid_amount: 149000,
        customer_name: "Nguyễn Thị Hương",
        customer_phone: "0933555777",
        customer_email: "huong@gmail.com",
        customer_address: "Q Bình Thạnh, TP.HCM",
        shipping_address: "Q Bình Thạnh, TP.HCM",
        payment_method: "vietqr",
        payment_status: "paid",
        priority: "low",
        source_type: "zalo",
        platform_order_id: null,
        channel_id: "channel-zalo",
        warehouse_id: "wh-1",
        shipping_zone_id: null,
        created_at: subMonthsDate(1),
        updated_at: subMonthsDate(1),
        order_items: [
          {
            id: "oi-h12",
            order_id: "ord-h12",
            product_id: "local-prod-design-qr",
            quantity: 1,
            unit_price: 149000,
            total_price: 149000,
            products: { id: "local-prod-design-qr", name: "Dịch vụ thiết kế Avatar & QR", sku: "PRD-DESIGN-QR" }
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

      // Background Customer Auto-Profiling & Omni-channel Resolution
      let resolvedPartnerId = orderData.partner_id;

      if (!resolvedPartnerId && (orderData.customer_phone || orderData.customer_email)) {
        const phone = orderData.customer_phone?.trim();
        const email = orderData.customer_email?.trim();
        
        if (isLocalDemoAuthEnabled()) {
          const localPartners = getLocalPartners(companyId);
          const existing = localPartners.find(p => 
            (phone && p.phone === phone) || 
            (email && p.email?.toLowerCase() === email.toLowerCase())
          );
          
          if (existing) {
            resolvedPartnerId = existing.id;
          } else if (orderData.customer_name) {
            // Auto-create partner profile in background!
            const newPartner: Partner = {
              id: `partner-${Date.now()}`,
              company_id: companyId,
              name: orderData.customer_name,
              phone: phone || "",
              email: email || "",
              partner_type: "customer",
              code: phone ? `KH-${phone}` : `KH-${Date.now().toString().slice(-6)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              debt_amount: 0,
              loyalty_points: 0,
              total_spent: 0,
              promo_segment: "all",
              address: "",
              tax_id: "",
              notes: "",
              is_active: true,
              group_id: null
            };
            localPartners.unshift(newPartner);
            saveLocalPartners(localPartners);
            resolvedPartnerId = newPartner.id;
            logLocalAction("Tạo đối tác tự động (Đa kênh)", "partners", newPartner.id, newPartner, null);
          }
        } else {
          // Supabase mode lookup
          let query = supabase.from("partners").select("id");
          if (phone && email) {
            query = query.or(`phone.eq.${phone},email.eq.${email}`);
          } else if (phone) {
            query = query.eq("phone", phone);
          } else {
            query = query.eq("email", email);
          }
          const { data: existing } = await query.limit(1);
          if (existing && existing.length > 0) {
            resolvedPartnerId = existing[0].id;
          } else if (orderData.customer_name) {
            // Auto-create partner profile in background
            const serialized = serializePartnerMetadata({
              name: orderData.customer_name,
              phone: phone || "",
              email: email || "",
              partner_type: "customer",
              code: phone ? `KH-${phone}` : `KH-${Date.now().toString().slice(-6)}`,
              promo_segment: "all"
            });
            const { data: newP, error: pErr } = await supabase
              .from("partners")
              .insert({
                ...serialized,
                company_id: companyId,
              })
              .select()
              .single();
            if (!pErr && newP) {
              resolvedPartnerId = newP.id;
            }
          }
        }
      }

      const totalAmount = orderData.total || 0;
      const paidAmt = orderData.paid_amount || 0;
      let finalPaymentStatus = orderData.payment_status || "unpaid";

      if (finalPaymentStatus === "paid" && paidAmt < totalAmount) {
        finalPaymentStatus = paidAmt === 0 ? "unpaid" : "partial";
      } else if (paidAmt >= totalAmount && totalAmount > 0) {
        finalPaymentStatus = "paid";
      }

      const resolvedOrderData = {
        ...orderData,
        partner_id: resolvedPartnerId,
        payment_status: finalPaymentStatus,
      };
      
      if (isLocalDemoAuthEnabled()) {
        const all = getLocalOrders(companyId);
        const orderId = `ord-${Date.now()}`;
        const orderNumber = resolvedOrderData.order_number || orderId;
        
        const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
        const productsList = rawProducts ? JSON.parse(rawProducts) : [];

        const newOrder: Order = {
          ...resolvedOrderData,
          id: orderId,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          order_items: (items || []).map((item, idx) => {
            const prod = productsList.find((p: any) => p.id === item.product_id);
            return {
              id: `oi-${Date.now()}-${idx}`,
              order_id: orderId,
              product_id: item.product_id || null,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              total_price: (item.quantity || 1) * (item.unit_price || 0),
              category: prod?.category || null,
              products: prod 
                ? { id: prod.id, name: prod.name, sku: prod.sku } 
                : item.product_name 
                ? { id: item.product_id, name: item.product_name, sku: item.sku || null } 
                : null
            };
          })
        } as any;
        
        all.unshift(newOrder);
        saveLocalOrders(all);

        // Audit log
        logLocalAction("Tạo đơn hàng mới", "orders", orderId, null, {
          order_number: newOrder.order_number,
          total: newOrder.total,
          items_count: (items || []).length,
          customer: newOrder.customer_name,
        });

        // Publish event instead of direct local deduction
        erpEventBus.publish("ORDER_CREATED", { order: newOrder, items: items });

        return newOrder;
      }

      // Create Order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          ...resolvedOrderData,
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

          // Status transition guard
          const allowedTransitions: Record<string, string[]> = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["processing", "cancelled"],
            processing: ["shipping", "cancelled"],
            shipping: ["delivered", "returned"],
            delivered: ["returned"],
            cancelled: [],
            returned: [],
          };
          const allowed = allowedTransitions[prevStatus] || [];
          if (!allowed.includes(status)) {
            throw new Error(`Không thể chuyển trạng thái từ "${prevStatus}" sang "${status}"`);
          }

          // Restore stock when cancelling or returning (if previously deducted)
          if ((status === "cancelled" || status === "returned") && prevStatus !== "cancelled" && prevStatus !== "returned") {
            if (order.order_items && order.order_items.length > 0) {
              restoreLocalStock(order.order_items, order.order_number, status === "cancelled" ? "hủy đơn" : "trả hàng");
            }
          }

          all[idx].status = status;
          all[idx].updated_at = new Date().toISOString();
          saveLocalOrders(all);

          // Log all order status changes
          logLocalAction(
            `Chuyển trạng thái đơn hàng: ${prevStatus} → ${status}`,
            "orders",
            id,
            { status: prevStatus },
            { status }
          );

          // Log order cancellation or return
          if (status === "cancelled" || status === "returned") {
            logLocalAction(
              status === "cancelled" ? "Hủy đơn hàng" : "Trả hàng",
              "orders",
              id,
              { status: prevStatus },
              { status }
            );
          }
        }
        return;
      }

      // Fetch order with items to handle stock restoration
      const { data: order, error: fetchErr } = await supabase
        .from("orders")
        .select("*, order_items(*, products(id, name, sku, is_service))")
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


import type { Tables } from "@/integrations/supabase/types";

export type OrderWithControl = Tables<"orders"> & {
  sales_channels?: Tables<"sales_channels"> | null;
  partners?: Tables<"partners"> | null;
  warehouses?: { id: string; name: string } | null;
  shipping_zones?: { id: string; name: string } | null;
};

export const sourceLabels: Record<string, string> = {
  manual: "Thủ công",
  pos: "POS",
  public_store: "Public",
  platform: "Sàn",
};

export const priorityLabels: Record<string, string> = {
  low: "Thấp",
  normal: "Thường",
  high: "Cao",
  urgent: "Gấp",
};

export const paymentMethodLabels: Record<string, string> = {
  cash: "Tiền mặt",
  cod: "COD",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
  ewallet: "Ví điện tử",
  platform: "Thanh toán sàn",
};

export function normalizePhone(value: string | null | undefined) {
  return (value || "").replace(/\D/g, "");
}

export function getOrderCustomerName(order: OrderWithControl) {
  return order.customer_name || order.partners?.name || "Khách lẻ";
}

export function getOrderCustomerPhone(order: OrderWithControl) {
  return order.customer_phone || order.partners?.phone || "";
}

export function getOrderCustomerAddress(order: OrderWithControl) {
  return order.shipping_address || order.customer_address || order.partners?.address || "";
}

export function getOrderSourceLabel(sourceType?: string | null) {
  return sourceLabels[sourceType || "manual"] || sourceType || "Thủ công";
}

export function getPaymentMethodLabel(method?: string | null) {
  return paymentMethodLabels[method || ""] || method || "Chưa ghi nhận";
}

export function getPriorityLabel(priority?: string | null) {
  return priorityLabels[priority || "normal"] || priority || "Thường";
}

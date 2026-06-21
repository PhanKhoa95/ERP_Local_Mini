export interface OrderFormData {
  channel_id?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  shipping_address?: string | null;
  warehouse_id?: string | null;
  payment_method?: string | null;
  platform_order_id?: string | null;
  [key: string]: any;
}

export function validateOrderPayload(formData: OrderFormData, itemsLength: number): string[] {
  const errors: string[] = [];

  if (!formData.channel_id) errors.push("Vui lòng chọn kênh bán hàng");
  if (!formData.customer_phone) errors.push("Số điện thoại khách hàng là bắt buộc");
  if (!formData.shipping_address && !formData.customer_address) errors.push("Địa chỉ giao hàng là bắt buộc");
  if (!formData.warehouse_id) errors.push("Vui lòng chọn kho xuất hàng");
  if (!formData.payment_method) errors.push("Vui lòng chọn phương thức thanh toán");
  if (itemsLength === 0) errors.push("Vui lòng thêm ít nhất một sản phẩm");

  return errors;
}

export function getMissingOrderFields(orderData: OrderFormData): string[] {
  const missingFields: string[] = [];
  
  if (!orderData.customer_phone) missingFields.push("Số điện thoại khách hàng");
  if (!orderData.customer_address && !orderData.shipping_address) missingFields.push("Địa chỉ giao hàng");
  if (!orderData.warehouse_id) missingFields.push("Kho xuất hàng");
  if (!orderData.payment_method) missingFields.push("Phương thức thanh toán");
  
  return missingFields;
}

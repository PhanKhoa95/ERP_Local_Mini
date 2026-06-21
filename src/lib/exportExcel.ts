import { exportRowsToExcel, type ExcelRow } from "./excel";
import {
  getOrderCustomerAddress,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderSourceLabel,
  getPaymentMethodLabel,
  getPriorityLabel,
} from "./orderControl";

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string
) {
  // Transform data to match column headers
  const exportData = data.map((row) => {
    const newRow: ExcelRow = {};
    columns.forEach((col) => {
      newRow[col.header] = row[col.key];
    });
    return newRow;
  });

  return exportRowsToExcel(
    exportData,
    "Data",
    `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`,
    columns.map((col) => ({ header: col.header, width: col.width }))
  );
}

export function exportOrdersToExcel(orders: any[]) {
  const columns: ExportColumn[] = [
    { key: "order_number", header: "Mã đơn", width: 15 },
    { key: "order_date", header: "Ngày đặt", width: 12 },
    { key: "partner_name", header: "Khách hàng", width: 25 },
    { key: "customer_phone", header: "SĐT", width: 15 },
    { key: "source_label", header: "Nguồn", width: 14 },
    { key: "status", header: "Trạng thái", width: 12 },
    { key: "payment_method_label", header: "PT thanh toán", width: 16 },
    { key: "payment_status", header: "TT thanh toán", width: 14 },
    { key: "priority_label", header: "Ưu tiên", width: 12 },
    { key: "subtotal", header: "Tạm tính", width: 15 },
    { key: "discount", header: "Giảm giá", width: 12 },
    { key: "shipping_fee", header: "Phí ship", width: 12 },
    { key: "total", header: "Tổng tiền", width: 15 },
    { key: "channel_name", header: "Kênh bán", width: 12 },
    { key: "shipping_address", header: "Địa chỉ", width: 35 },
    { key: "warehouse_name", header: "Kho", width: 20 },
    { key: "shipping_zone_name", header: "Vùng giao", width: 20 },
    { key: "platform_order_id", header: "Mã sàn", width: 20 },
    { key: "internal_notes", header: "Ghi chú nội bộ", width: 30 },
  ];

  const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    returned: "Hoàn trả",
  };

  const formattedData = orders.map((order) => ({
    ...order,
    order_date: new Date(order.order_date).toLocaleDateString("vi-VN"),
    partner_name: getOrderCustomerName(order),
    customer_phone: getOrderCustomerPhone(order),
    source_label: getOrderSourceLabel(order.source_type),
    channel_name: order.sales_channels?.name || "",
    payment_method_label: getPaymentMethodLabel(order.payment_method),
    priority_label: getPriorityLabel(order.priority),
    shipping_address: getOrderCustomerAddress(order),
    warehouse_name: order.warehouses?.name || "",
    shipping_zone_name: order.shipping_zones?.name || "",
    status: statusLabels[order.status] || order.status,
  }));

  exportToExcel(formattedData, columns, "don_hang");
}

export function exportProductsToExcel(products: any[]) {
  const columns: ExportColumn[] = [
    { key: "sku", header: "SKU", width: 15 },
    { key: "name", header: "Tên sản phẩm", width: 30 },
    { key: "category", header: "Danh mục", width: 15 },
    { key: "unit", header: "Đơn vị", width: 10 },
    { key: "cost_price", header: "Giá nhập", width: 15 },
    { key: "selling_price", header: "Giá bán", width: 15 },
    { key: "stock_quantity", header: "Tồn kho", width: 10 },
    { key: "min_stock", header: "Tồn tối thiểu", width: 12 },
  ];

  exportToExcel(products, columns, "san_pham");
}

export function exportInventoryToExcel(transactions: any[]) {
  const columns: ExportColumn[] = [
    { key: "created_at", header: "Ngày", width: 15 },
    { key: "product_name", header: "Sản phẩm", width: 30 },
    { key: "transaction_type", header: "Loại", width: 10 },
    { key: "quantity", header: "Số lượng", width: 10 },
    { key: "notes", header: "Ghi chú", width: 30 },
  ];

  const typeLabels: Record<string, string> = {
    in: "Nhập",
    out: "Xuất",
    adjust: "Điều chỉnh",
  };

  const formattedData = transactions.map((t) => ({
    ...t,
    created_at: new Date(t.created_at).toLocaleDateString("vi-VN"),
    product_name: t.products?.name || "",
    transaction_type: typeLabels[t.transaction_type] || t.transaction_type,
  }));

  exportToExcel(formattedData, columns, "kho_hang");
}

export function exportPartnersToExcel(partners: any[]) {
  const columns: ExportColumn[] = [
    { key: "code", header: "Mã", width: 12 },
    { key: "name", header: "Tên", width: 25 },
    { key: "phone", header: "Điện thoại", width: 15 },
    { key: "email", header: "Email", width: 25 },
    { key: "address", header: "Địa chỉ", width: 35 },
    { key: "partner_type", header: "Loại", width: 12 },
    { key: "total_spent", header: "Tổng chi tiêu", width: 15 },
    { key: "loyalty_points", header: "Điểm tích lũy", width: 12 },
  ];

  const typeLabels: Record<string, string> = {
    customer: "Khách hàng",
    supplier: "Nhà cung cấp",
    both: "KH & NCC",
  };

  const formattedData = partners.map((p) => ({
    ...p,
    partner_type: typeLabels[p.partner_type] || p.partner_type,
  }));

  exportToExcel(formattedData, columns, "doi_tac");
}

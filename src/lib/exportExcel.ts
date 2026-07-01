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

export async function exportAllReportsToExcel(
  data: {
    revenue: any;
    products: any;
    inventory: any;
    orders: any;
    partners: any;
    projects: any;
    printshop: any;
  },
  options: {
    revenueSummary: boolean;
    dailyRevenue: boolean;
    products: boolean;
    inventory: boolean;
    orders: boolean;
    partners: boolean;
    projects: boolean;
    printshop: boolean;
  } = {
    revenueSummary: true,
    dailyRevenue: true,
    products: true,
    inventory: true,
    orders: true,
    partners: true,
    projects: true,
    printshop: true,
  }
) {
  const XLSX = await import("@e965/xlsx");
  const workbook = XLSX.utils.book_new();

  // 1. Sheet Doanh thu
  if (options.revenueSummary) {
    const revenueSummary = [
      { "Chỉ số": "Tổng doanh thu", "Giá trị": data.revenue?.totalRevenue || 0 },
      { "Chỉ số": "Tổng giá vốn", "Giá trị": data.revenue?.totalCOGS || 0 },
      { "Chỉ số": "Lợi nhuận gộp", "Giá trị": data.revenue?.grossProfit || 0 },
      { "Chỉ số": "Tỷ suất lợi nhuận (%)", "Giá trị": (data.revenue?.profitMargin || 0).toFixed(1) },
      { "Chỉ số": "Số lượng đơn hàng", "Giá trị": data.revenue?.orderCount || 0 },
    ];
    const wsRevenue = XLSX.utils.json_to_sheet(revenueSummary);
    XLSX.utils.book_append_sheet(workbook, wsRevenue, "Tổng quan Doanh thu");
  }

  // Daily Chart
  if (options.dailyRevenue && data.revenue?.dailyChart) {
    const wsDaily = XLSX.utils.json_to_sheet(
      data.revenue.dailyChart.map((d: any) => ({
        "Ngày": d.date,
        "Doanh thu": d.revenue,
        "Số đơn hàng": d.orders,
        "Lợi nhuận": d.profit
      }))
    );
    XLSX.utils.book_append_sheet(workbook, wsDaily, "Doanh thu theo ngày");
  }

  // 2. Sheet Sản phẩm
  if (options.products && data.products?.topProducts) {
    const wsProducts = XLSX.utils.json_to_sheet(
      data.products.topProducts.map((p: any) => ({
        "Tên sản phẩm": p.name,
        "Số lượng bán": p.quantity,
        "Doanh thu": p.revenue,
        "Giá vốn": p.cogs,
        "Lợi nhuận gộp": p.profit,
        "Tỷ suất (%)": p.margin
      }))
    );
    XLSX.utils.book_append_sheet(workbook, wsProducts, "Báo cáo Sản phẩm");
  }

  // 3. Sheet Tồn kho
  if (options.inventory && data.inventory?.products) {
    const wsInventory = XLSX.utils.json_to_sheet(
      data.inventory.products.map((p: any) => ({
        "SKU": p.sku,
        "Tên sản phẩm": p.name,
        "Đơn vị": p.unit || "Cái",
        "Giá nhập": p.cost_price,
        "Giá bán": p.selling_price,
        "Tồn kho thực tế": p.stock_quantity,
        "Tồn kho tối thiểu": p.min_stock,
        "Trạng thái": p.stock_quantity <= p.min_stock ? "Cảnh báo thấp" : "An toàn"
      }))
    );
    XLSX.utils.book_append_sheet(workbook, wsInventory, "Báo cáo Tồn kho");
  }

  // 4. Sheet Đơn hàng
  if (options.orders && data.orders?.orders) {
    const statusLabels: Record<string, string> = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipping: "Đang giao",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
      returned: "Hoàn trả",
    };
    const wsOrders = XLSX.utils.json_to_sheet(
      data.orders.orders.map((o: any) => ({
        "Mã đơn hàng": o.order_number,
        "Ngày tạo": new Date(o.order_date || o.created_at).toLocaleDateString("vi-VN"),
        "Khách hàng": getOrderCustomerName(o),
        "Số điện thoại": getOrderCustomerPhone(o),
        "Trạng thái": statusLabels[o.status] || o.status,
        "PT Thanh toán": getPaymentMethodLabel(o.payment_method),
        "TT Thanh toán": o.payment_status === "paid" ? "Đã thanh toán" : "Chờ thanh toán",
        "Tổng tiền": o.total
      }))
    );
    XLSX.utils.book_append_sheet(workbook, wsOrders, "Danh sách Đơn hàng");
  }

  // 5. Sheet Đối tác
  if (options.partners && data.partners?.partners) {
    const partnerTypeLabels: Record<string, string> = {
      customer: "Khách hàng",
      supplier: "Nhà cung cấp",
      both: "Cả hai",
    };
    const wsPartners = XLSX.utils.json_to_sheet(
      data.partners.partners.map((p: any) => ({
        "Mã": p.code,
        "Tên đối tác": p.name,
        "Điện thoại": p.phone || "",
        "Email": p.email || "",
        "Địa chỉ": p.address || "",
        "Phân loại": partnerTypeLabels[p.partner_type] || p.partner_type,
        "Tổng chi tiêu": p.total_spent || 0,
        "Công nợ hiện tại": p.debt_amount || 0,
        "Điểm tích lũy": p.loyalty_points || 0
      }))
    );
    XLSX.utils.book_append_sheet(workbook, wsPartners, "Danh sách Đối tác");
  }

  // 6. Sheet Vận hành & Dự án
  if (options.projects && data.projects) {
    const wsProjects = XLSX.utils.json_to_sheet(
      data.projects.map((p: any) => ({
        "Tên dự án": p.name || "",
        "Mô tả": p.description || "",
        "Ngày bắt đầu": p.start_date ? new Date(p.start_date).toLocaleDateString("vi-VN") : "",
        "Ngày kết thúc": p.end_date ? new Date(p.end_date).toLocaleDateString("vi-VN") : "",
        "Ngân sách (VNĐ)": p.budget || 0,
        "Thực chi (VNĐ)": p.actual_cost || 0,
        "Tiến độ (%)": p.progress || 0,
        "Trạng thái": p.status || ""
      }))
    );
    XLSX.utils.book_append_sheet(workbook, wsProjects, "Vận hành & Dự án");
  }

  // 7. Sheet Chiết tính & Dòng tiền
  if (options.printshop && data.printshop) {
    // 7.1. Sheet Monthly Plan (Kế hoạch Tháng)
    if (data.printshop.monthlyPlan) {
      const wsCF = XLSX.utils.json_to_sheet(
        data.printshop.monthlyPlan.map((m: any) => ({
          "Tháng": m.month,
          "Đơn/Ngày": m.ordersPerDay,
          "Tổng Đơn": m.orders,
          "Doanh thu": m.revenue,
          "Lợi nhuận gộp": m.grossProfit,
          "Chi phí MKT": m.marketing,
          "Chi phí vận hành": m.operatingCashCost,
          "Dòng tiền thuần": m.operatingCashFlow,
          "Số dư cuối kỳ": m.endingCash,
          "Hiệu suất công suất (%)": m.capacityUse
        }))
      );
      XLSX.utils.book_append_sheet(workbook, wsCF, "Kế hoạch Dòng tiền");
    }

    // 7.2. Sheet Pricing (Chiết tính giá)
    if (data.printshop.products) {
      const wsPricing = XLSX.utils.json_to_sheet(
        data.printshop.products.map((p: any) => ({
          "Tên sản phẩm": p.name,
          "Thông số": p.spec,
          "Tỷ lệ bán lẻ (%)": p.mix,
          "Giá trực tiếp": p.directPrice,
          "Giá Shopee": p.shopeePrice,
          "Biến phí": p.variableCost,
          "Lợi nhuận gộp": p.grossProfit,
          "Tỷ suất LN (%)": p.grossMargin,
          "Giá sàn tối thiểu": p.minPrice,
          "Khuyến nghị": p.note
        }))
      );
      XLSX.utils.book_append_sheet(workbook, wsPricing, "Chiết tính Giá SP");
    }
  }

  if (workbook.SheetNames.length === 0) {
    // Add empty sheet to prevent crash if nothing selected
    const wsEmpty = XLSX.utils.json_to_sheet([{ "Thông tin": "Không có báo cáo nào được chọn" }]);
    XLSX.utils.book_append_sheet(workbook, wsEmpty, "Rỗng");
  }

  XLSX.writeFile(workbook, `Bao_cao_tong_hop_${new Date().toISOString().split("T")[0]}.xlsx`);
}


import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export type SystemAuditSeverity = "warning" | "error";

export interface SystemDataAuditIssue {
  id: string;
  module: string;
  entityType: string;
  entityId: string;
  title: string;
  severity: SystemAuditSeverity;
  expectedLabel: string;
  expectedValue: number;
  actualLabel: string;
  actualValue: number;
  delta: number;
  detail: string;
  recommendation: string;
}

export interface SystemDataAuditReport {
  scannedAt: string;
  score: number;
  totalChecks: number;
  okChecks: number;
  warningCount: number;
  errorCount: number;
  issues: SystemDataAuditIssue[];
}

interface ProductLike {
  id: string;
  company_id?: string | null;
  sku?: string | null;
  name?: string | null;
  stock_quantity?: number | null;
  min_stock?: number | null;
  cost_price?: number | null;
  selling_price?: number | null;
  is_service?: boolean | null;
}

interface WarehouseStockLike {
  id?: string;
  product_id: string;
  warehouse_id?: string | null;
  quantity?: number | null;
}

interface OrderItemLike {
  id?: string;
  product_id?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total?: number | null;
  total_price?: number | null;
}

interface OrderLike {
  id: string;
  order_number?: string | null;
  total?: number | null;
  subtotal?: number | null;
  discount?: number | null;
  shipping_fee?: number | null;
  paid_amount?: number | null;
  payment_status?: string | null;
  status?: string | null;
  order_items?: OrderItemLike[] | null;
}

interface PaymentLike {
  id?: string;
  order_id?: string | null;
  partner_id?: string | null;
  transaction_type?: string | null;
  amount?: number | null;
  payment_method?: string | null;
  reference_number?: string | null;
  transaction_date?: string | null;
  created_at?: string | null;
}

interface JournalEntryLike {
  id: string;
  description?: string | null;
  status?: string | null;
  journal_lines?: JournalLineLike[] | null;
}

interface JournalLineLike {
  id?: string;
  entry_id?: string;
  debit?: number | null;
  credit?: number | null;
}

interface ProductBomLike {
  id?: string;
  product_id: string;
  material_id: string;
  quantity?: number | null;
  is_active?: boolean | null;
  product?: ProductLike | null;
  material?: ProductLike | null;
}

export interface SystemAuditSnapshot {
  products: ProductLike[];
  warehouseStock: WarehouseStockLike[];
  orders: OrderLike[];
  payments: PaymentLike[];
  journalEntries: JournalEntryLike[];
  journalLines: JournalLineLike[];
  productBom: ProductBomLike[];
}

const MONEY_TOLERANCE = 1;
const STOCK_TOLERANCE = 0.0001;

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function productLabel(product?: ProductLike | null) {
  if (!product) return "Không xác định";
  return product.sku ? `${product.sku} - ${product.name || product.id}` : product.name || product.id;
}

function pushIssue(
  issues: SystemDataAuditIssue[],
  input: Omit<SystemDataAuditIssue, "id" | "delta">
) {
  const delta = round(input.actualValue - input.expectedValue, 4);
  issues.push({
    ...input,
    id: `${input.module}:${input.entityType}:${input.entityId}:${issues.length}`,
    delta,
  });
}

function compareValues(params: {
  issues: SystemDataAuditIssue[];
  module: string;
  entityType: string;
  entityId: string;
  title: string;
  expectedLabel: string;
  expectedValue: number;
  actualLabel: string;
  actualValue: number;
  tolerance: number;
  detail: string;
  recommendation: string;
  severity?: SystemAuditSeverity;
}) {
  const delta = Math.abs(params.actualValue - params.expectedValue);
  if (delta <= params.tolerance) return false;

  pushIssue(params.issues, {
    module: params.module,
    entityType: params.entityType,
    entityId: params.entityId,
    title: params.title,
    severity: params.severity || "error",
    expectedLabel: params.expectedLabel,
    expectedValue: round(params.expectedValue, 4),
    actualLabel: params.actualLabel,
    actualValue: round(params.actualValue, 4),
    detail: params.detail,
    recommendation: params.recommendation,
  });
  return true;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadLocalSnapshot(): SystemAuditSnapshot {
  const products = readJson<ProductLike[]>("erp-mini-local-demo-products", []);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const orders = readJson<OrderLike[]>("erp-mini-local-demo-orders", []);
  const payments = readJson<PaymentLike[]>("erp-mini-local-demo-payment-transactions", []);
  const rawEntries = readJson<JournalEntryLike[]>("erp-mini-local-demo-journal-entries", []);
  const journalLines = readJson<JournalLineLike[]>("erp-mini-local-demo-journal-lines", []);
  const storedWarehouseStock = readJson<WarehouseStockLike[]>("erp-mini-local-demo-warehouse-stock", []);
  const productBom = readJson<ProductBomLike[]>("erp-mini-local-demo-product-bom", []).map((item) => ({
    ...item,
    product: productMap.get(item.product_id) || null,
    material: productMap.get(item.material_id) || null,
  }));

  const journalEntries = rawEntries.map((entry) => ({
    ...entry,
    journal_lines: journalLines.filter((line) => line.entry_id === entry.id),
  }));

  return {
    products,
    warehouseStock: storedWarehouseStock.length > 0
      ? storedWarehouseStock
      : products
        .filter((product) => !product.is_service)
        .map((product) => ({
          id: `local-stock-${product.id}`,
          product_id: product.id,
          warehouse_id: "local-warehouse-default",
          quantity: product.stock_quantity || 0,
        })),
    orders,
    payments,
    journalEntries,
    journalLines,
    productBom,
  };
}

async function loadSupabaseSnapshot(companyId: string): Promise<SystemAuditSnapshot> {
  const [
    productsResult,
    warehouseResult,
    ordersResult,
    paymentsResult,
    entriesResult,
    linesResult,
    bomResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, company_id, sku, name, stock_quantity, min_stock, cost_price, selling_price, is_service")
      .eq("company_id", companyId),
    supabase
      .from("warehouse_stock")
      .select("id, product_id, warehouse_id, quantity, warehouses!inner(company_id)")
      .eq("warehouses.company_id", companyId),
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("company_id", companyId),
    supabase
      .from("payment_transactions")
      .select("id, order_id, transaction_type, amount")
      .eq("company_id", companyId),
    supabase
      .from("journal_entries")
      .select("id, description, status")
      .eq("company_id", companyId),
    supabase
      .from("journal_lines")
      .select("id, entry_id, debit, credit"),
    supabase
      .from("product_bom")
      .select(`
        id,
        product_id,
        material_id,
        quantity,
        is_active,
        product:products!product_bom_product_id_fkey(id, company_id, sku, name, cost_price, is_service),
        material:products!product_bom_material_id_fkey(id, company_id, sku, name, cost_price, stock_quantity, is_service)
      `),
  ]);

  const firstError =
    productsResult.error ||
    warehouseResult.error ||
    ordersResult.error ||
    paymentsResult.error ||
    entriesResult.error ||
    linesResult.error ||
    bomResult.error;

  if (firstError) throw firstError;

  const entries = (entriesResult.data || []) as JournalEntryLike[];
  const lines = (linesResult.data || []) as JournalLineLike[];

  return {
    products: (productsResult.data || []) as ProductLike[],
    warehouseStock: (warehouseResult.data || []) as WarehouseStockLike[],
    orders: (ordersResult.data || []) as OrderLike[],
    payments: (paymentsResult.data || []) as PaymentLike[],
    journalEntries: entries.map((entry) => ({
      ...entry,
      journal_lines: lines.filter((line) => line.entry_id === entry.id),
    })),
    journalLines: lines,
    productBom: ((bomResult.data || []) as ProductBomLike[]).filter(
      (item) => item.product?.company_id === companyId
    ),
  };
}

export function buildSystemDataAuditReport(snapshot: SystemAuditSnapshot): SystemDataAuditReport {
  const issues: SystemDataAuditIssue[] = [];
  let totalChecks = 0;

  const productMap = new Map(snapshot.products.map((product) => [product.id, product]));
  const warehouseByProduct = new Map<string, number>();
  snapshot.warehouseStock.forEach((stock) => {
    warehouseByProduct.set(
      stock.product_id,
      round((warehouseByProduct.get(stock.product_id) || 0) + toNumber(stock.quantity), 4)
    );
  });

  snapshot.products.forEach((product) => {
    if (product.is_service) return;
    totalChecks += 3;
    const productStock = toNumber(product.stock_quantity);
    const warehouseStock = warehouseByProduct.get(product.id) || 0;
    compareValues({
      issues,
      module: "Kho",
      entityType: "product",
      entityId: product.id,
      title: "Tồn kho sản phẩm lệch tổng tồn kho",
      expectedLabel: "products.stock_quantity",
      expectedValue: productStock,
      actualLabel: "sum(warehouse_stock.quantity)",
      actualValue: warehouseStock,
      tolerance: STOCK_TOLERANCE,
      detail: `${productLabel(product)} đang có tồn sản phẩm khác tổng tồn theo kho.`,
      recommendation: "Đồng bộ lại warehouse_stock từ giao dịch kho hoặc chạy đối soát kho mặc định trước khi chốt báo cáo.",
    });

    if (productStock < -STOCK_TOLERANCE) {
      pushIssue(issues, {
        module: "Kho",
        entityType: "product",
        entityId: product.id,
        title: "Tồn kho âm",
        severity: "error",
        expectedLabel: "Tồn tối thiểu hợp lệ",
        expectedValue: 0,
        actualLabel: "Tồn hiện tại",
        actualValue: productStock,
        detail: `${productLabel(product)} đang âm tồn kho.`,
        recommendation: "Kiểm tra backflush BOM, đơn hoàn/hủy và phiếu xuất kho gần nhất.",
      });
    }

    const cost = toNumber(product.cost_price);
    const price = toNumber(product.selling_price);
    if (cost < 0 || price < 0) {
      pushIssue(issues, {
        module: "Giá",
        entityType: "product",
        entityId: product.id,
        title: "Giá âm không hợp lệ",
        severity: "error",
        expectedLabel: "Giá hợp lệ",
        expectedValue: 0,
        actualLabel: "Giá thấp nhất",
        actualValue: Math.min(cost, price),
        detail: `${productLabel(product)} có giá nhập hoặc giá bán âm.`,
        recommendation: "Sửa giá về số không âm trước khi xuất báo cáo doanh thu/giá vốn.",
      });
    } else if (cost > 0 && price > 0 && price + MONEY_TOLERANCE < cost) {
      pushIssue(issues, {
        module: "Giá",
        entityType: "product",
        entityId: product.id,
        title: "Giá bán thấp hơn giá vốn",
        severity: "warning",
        expectedLabel: "Giá vốn",
        expectedValue: cost,
        actualLabel: "Giá bán",
        actualValue: price,
        detail: `${productLabel(product)} có giá bán thấp hơn giá vốn.`,
        recommendation: "Xác nhận chính sách khuyến mãi hoặc cập nhật lại bảng giá/giá vốn.",
      });
    }
  });

  snapshot.warehouseStock.forEach((stock) => {
    totalChecks += 1;
    const quantity = toNumber(stock.quantity);
    if (quantity < -STOCK_TOLERANCE) {
      pushIssue(issues, {
        module: "Kho",
        entityType: "warehouse_stock",
        entityId: stock.id || `${stock.warehouse_id}-${stock.product_id}`,
        title: "Tồn kho vị trí âm",
        severity: "error",
        expectedLabel: "Tồn kho vị trí hợp lệ",
        expectedValue: 0,
        actualLabel: "warehouse_stock.quantity",
        actualValue: quantity,
        detail: `${productLabel(productMap.get(stock.product_id))} đang âm tồn ở một kho.`,
        recommendation: "Kiểm tra phiếu luân chuyển và phiếu xuất liên quan tới kho này.",
      });
    }
  });

  snapshot.orders.forEach((order) => {
    const items = order.order_items || [];
    const itemSum = round(
      items.reduce((sum, item) => {
        const quantity = toNumber(item.quantity, 1);
        const unitPrice = toNumber(item.unit_price);
        const storedLineTotal = item.total ?? item.total_price;
        totalChecks += 1;
        if (storedLineTotal !== undefined && storedLineTotal !== null) {
          compareValues({
            issues,
            module: "Đơn hàng",
            entityType: "order_item",
            entityId: item.id || `${order.id}-${item.product_id}`,
            title: "Thành tiền dòng hàng lệch số lượng x đơn giá",
            expectedLabel: "quantity x unit_price",
            expectedValue: quantity * unitPrice,
            actualLabel: "line total",
            actualValue: toNumber(storedLineTotal),
            tolerance: MONEY_TOLERANCE,
            detail: `Dòng hàng trong đơn ${order.order_number || order.id} đang lệch thành tiền.`,
            recommendation: "Tính lại dòng hàng trước khi đồng bộ doanh thu/kế toán.",
          });
        }
        return sum + toNumber(storedLineTotal, quantity * unitPrice);
      }, 0)
    );

    totalChecks += 3;
    if (order.subtotal !== undefined && order.subtotal !== null) {
      compareValues({
        issues,
        module: "Đơn hàng",
        entityType: "order",
        entityId: order.id,
        title: "Tạm tính đơn hàng lệch tổng dòng hàng",
        expectedLabel: "sum(order_items)",
        expectedValue: itemSum,
        actualLabel: "orders.subtotal",
        actualValue: toNumber(order.subtotal),
        tolerance: MONEY_TOLERANCE,
        detail: `Đơn ${order.order_number || order.id} có subtotal không khớp dòng hàng.`,
        recommendation: "Chạy lại tính tổng đơn trước khi ghi nhận doanh thu.",
      });
    }

    const expectedTotal = round(itemSum - toNumber(order.discount) + toNumber(order.shipping_fee));
    if (order.total !== undefined && order.total !== null) {
      compareValues({
        issues,
        module: "Đơn hàng",
        entityType: "order",
        entityId: order.id,
        title: "Tổng tiền đơn hàng lệch công thức",
        expectedLabel: "items - discount + shipping",
        expectedValue: expectedTotal,
        actualLabel: "orders.total",
        actualValue: toNumber(order.total),
        tolerance: MONEY_TOLERANCE,
        detail: `Đơn ${order.order_number || order.id} có tổng tiền không khớp công thức.`,
        recommendation: "Đồng bộ lại subtotal, discount, shipping_fee và total trước khi đối soát thanh toán.",
      });
    }
  });

  const paymentsByOrder = new Map<string, number>();
  snapshot.payments.forEach((payment) => {
    if (!payment.order_id) return;
    const amount = toNumber(payment.amount);
    const signed =
      payment.transaction_type === "payment_out" || payment.transaction_type === "payable"
        ? -amount
        : payment.transaction_type === "payment_in" || payment.transaction_type === "receivable"
          ? amount
          : 0;
    paymentsByOrder.set(payment.order_id, round((paymentsByOrder.get(payment.order_id) || 0) + signed));
  });

  // 1. Phép kiểm giao dịch trùng lặp và giao dịch đột biến nâng cao
  const duplicateTimeThreshold = 3 * 60 * 1000;
  const largeSpikeThreshold = 100000000;

  const validAmounts = snapshot.payments.map(p => toNumber(p.amount)).filter(a => a > 0);
  const avgAmount = validAmounts.length > 0 
    ? validAmounts.reduce((sum, val) => sum + val, 0) / validAmounts.length 
    : 0;

  for (let i = 0; i < snapshot.payments.length; i++) {
    const p1 = snapshot.payments[i];
    const amt1 = toNumber(p1.amount);
    if (amt1 <= 0) continue;

    totalChecks += 1;

    for (let j = i + 1; j < snapshot.payments.length; j++) {
      const p2 = snapshot.payments[j];
      const amt2 = toNumber(p2.amount);
      if (amt2 !== amt1) continue;
      if (p1.transaction_type !== p2.transaction_type) continue;
      if (p1.partner_id !== p2.partner_id || p1.order_id !== p2.order_id) continue;

      const time1 = p1.transaction_date || p1.created_at;
      const time2 = p2.transaction_date || p2.created_at;
      if (time1 && time2) {
        const diff = Math.abs(new Date(time1).getTime() - new Date(time2).getTime());
        if (diff <= duplicateTimeThreshold) {
          pushIssue(issues, {
            module: "Thanh toán",
            entityType: "payment_transaction",
            entityId: p1.id || `dup-${i}-${j}`,
            title: "Phát hiện giao dịch trùng lặp tiềm ẩn",
            severity: "warning",
            expectedLabel: "Số giao dịch duy nhất",
            expectedValue: 1,
            actualLabel: "Số giao dịch trùng",
            actualValue: 2,
            detail: `Giao dịch ${p1.id || ""} và ${p2.id || ""} có cùng số tiền ${amt1.toLocaleString("vi-VN")}đ phát sinh quá gần nhau (dưới 3 phút).`,
            recommendation: "Kiểm tra xem nhân viên có bấm đúp hoặc Casso bị đồng bộ lặp giao dịch hay không.",
          });
          break;
        }
      } else if (p1.reference_number && p1.reference_number === p2.reference_number) {
        pushIssue(issues, {
          module: "Thanh toán",
          entityType: "payment_transaction",
          entityId: p1.id || `dup-ref-${i}-${j}`,
          title: "Trùng mã tham chiếu giao dịch ngân hàng",
          severity: "error",
          expectedLabel: "Số tham chiếu duy nhất",
          expectedValue: 1,
          actualLabel: "Số tham chiếu trùng",
          actualValue: 2,
          detail: `Giao dịch ${p1.id || ""} và ${p2.id || ""} trùng mã tham chiếu Casso/Ngân hàng ${p1.reference_number}.`,
          recommendation: "Xóa bớt 1 giao dịch bị lặp hoặc sửa lại số tham chiếu chính xác.",
        });
        break;
      }
    }

    if (amt1 >= largeSpikeThreshold || (avgAmount > 0 && amt1 > avgAmount * 5 && amt1 > 50000000)) {
      pushIssue(issues, {
        module: "Thanh toán",
        entityType: "payment_transaction",
        entityId: p1.id || `spike-${i}`,
        title: "Giao dịch có giá trị đột biến lớn bất thường",
        severity: "warning",
        expectedLabel: "Ngưỡng cảnh báo dòng tiền",
        expectedValue: largeSpikeThreshold,
        actualLabel: "Giá trị giao dịch",
        actualValue: amt1,
        detail: `Giao dịch ${p1.id || ""} ghi nhận số tiền ${amt1.toLocaleString("vi-VN")}đ vượt quá ngưỡng an toàn hoặc gấp nhiều lần trung bình quỹ.`,
        recommendation: "Yêu cầu Kế toán trưởng kiểm tra lại tính xác thực của chứng từ/phiếu chi lớn này.",
      });
    }
  }

  snapshot.orders.forEach((order) => {
    totalChecks += 2;
    const paymentTotal = paymentsByOrder.get(order.id);
    if (paymentTotal !== undefined) {
      compareValues({
        issues,
        module: "Thanh toán",
        entityType: "order",
        entityId: order.id,
        title: "Paid amount lệch giao dịch thanh toán",
        expectedLabel: "sum(payment_transactions)",
        expectedValue: paymentTotal,
        actualLabel: "orders.paid_amount",
        actualValue: toNumber(order.paid_amount),
        tolerance: MONEY_TOLERANCE,
        detail: `Đơn ${order.order_number || order.id} có paid_amount không khớp giao dịch thanh toán.`,
        recommendation: "Đồng bộ lại paid_amount từ payment_transactions và cập nhật payment_status.",
      });
    }

    const total = toNumber(order.total);
    const paid = toNumber(order.paid_amount);
    if (order.payment_status === "paid" && paid + MONEY_TOLERANCE < total) {
      pushIssue(issues, {
        module: "Thanh toán",
        entityType: "order",
        entityId: order.id,
        title: "Đơn đánh dấu đã thanh toán nhưng chưa đủ tiền",
        severity: "error",
        expectedLabel: "orders.total",
        expectedValue: total,
        actualLabel: "orders.paid_amount",
        actualValue: paid,
        detail: `Đơn ${order.order_number || order.id} đang paid nhưng số tiền thu chưa đủ.`,
        recommendation: "Chuyển trạng thái về partial/unpaid hoặc ghi nhận thêm giao dịch thanh toán hợp lệ.",
      });
    }
  });

  snapshot.journalEntries.forEach((entry) => {
    if (entry.status === "voided") return;
    totalChecks += 1;
    const lines = entry.journal_lines || snapshot.journalLines.filter((line) => line.entry_id === entry.id);
    const debit = round(lines.reduce((sum, line) => sum + toNumber(line.debit), 0));
    const credit = round(lines.reduce((sum, line) => sum + toNumber(line.credit), 0));
    compareValues({
      issues,
      module: "Kế toán",
      entityType: "journal_entry",
      entityId: entry.id,
      title: "Bút toán Nợ/Có không cân",
      expectedLabel: "Tổng Có",
      expectedValue: credit,
      actualLabel: "Tổng Nợ",
      actualValue: debit,
      tolerance: MONEY_TOLERANCE,
      detail: `Bút toán ${entry.description || entry.id} đang lệch Nợ/Có.`,
      recommendation: "Rà soát journal_lines trước khi khóa sổ hoặc xuất báo cáo tài chính.",
    });
  });

  const bomByProduct = new Map<string, ProductBomLike[]>();
  snapshot.productBom.forEach((item) => {
    if (item.is_active === false) return;
    const list = bomByProduct.get(item.product_id) || [];
    list.push(item);
    bomByProduct.set(item.product_id, list);
  });

  bomByProduct.forEach((items, productId) => {
    const product = items[0]?.product || productMap.get(productId);
    if (!product || product.is_service) return;
    totalChecks += 1;
    let expectedBomCost = 0;
    items.forEach((item) => {
      const quantity = toNumber(item.quantity);
      const material = item.material || productMap.get(item.material_id);
      if (!material) {
        pushIssue(issues, {
          module: "BOM",
          entityType: "product_bom",
          entityId: item.id || `${item.product_id}-${item.material_id}`,
          title: "BOM thiếu nguyên vật liệu",
          severity: "error",
          expectedLabel: "Material",
          expectedValue: 1,
          actualLabel: "Material",
          actualValue: 0,
          detail: `${productLabel(product)} có BOM trỏ tới nguyên vật liệu không tồn tại.`,
          recommendation: "Gỡ dòng BOM lỗi hoặc tạo lại nguyên vật liệu trước khi sản xuất.",
        });
        return;
      }
      expectedBomCost += quantity * toNumber(material.cost_price);
      if (quantity <= 0) {
        pushIssue(issues, {
          module: "BOM",
          entityType: "product_bom",
          entityId: item.id || `${item.product_id}-${item.material_id}`,
          title: "Định mức BOM không hợp lệ",
          severity: "error",
          expectedLabel: "Định mức tối thiểu",
          expectedValue: 0.0001,
          actualLabel: "BOM quantity",
          actualValue: quantity,
          detail: `${productLabel(product)} có dòng BOM định mức không dương.`,
          recommendation: "Nhập lại định mức lớn hơn 0 để tránh sai lệch khấu trừ NVL.",
        });
      }
    });

    const actualCost = toNumber(product.cost_price);
    const absDelta = Math.abs(actualCost - expectedBomCost);
    if (expectedBomCost > 0 && absDelta > MONEY_TOLERANCE) {
      const ratio = absDelta / expectedBomCost;
      pushIssue(issues, {
        module: "BOM",
        entityType: "product",
        entityId: productId,
        title: "Giá vốn thành phẩm lệch tổng BOM",
        severity: ratio > 0.05 || actualCost === 0 ? "error" : "warning",
        expectedLabel: "Tổng cost_price NVL theo BOM",
        expectedValue: round(expectedBomCost),
        actualLabel: "products.cost_price",
        actualValue: actualCost,
        detail: `${productLabel(product)} có giá vốn lệch tổng định mức nguyên vật liệu.`,
        recommendation: "Chạy hoàn tất lệnh sản xuất/BOM sync hoặc cập nhật lại giá vốn bình quân.",
      });
    }
  });

  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const okChecks = Math.max(0, totalChecks - issues.length);
  const score = totalChecks === 0 ? 100 : Math.max(0, Math.round((okChecks / totalChecks) * 100));

  return {
    scannedAt: new Date().toISOString(),
    score,
    totalChecks,
    okChecks,
    warningCount,
    errorCount,
    issues,
  };
}

export async function runSystemDataAudit(companyId?: string | null) {
  if (isLocalDemoAuthEnabled()) {
    return buildSystemDataAuditReport(loadLocalSnapshot());
  }

  if (!companyId) throw new Error("Missing company context");
  const snapshot = await loadSupabaseSnapshot(companyId);
  return buildSystemDataAuditReport(snapshot);
}

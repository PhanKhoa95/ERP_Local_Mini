/**
 * Pure utility: Dashboard KPI calculation logic
 * Extracted from useDashboardStats.ts for testability
 */

export interface OrderForKpi {
  id: string;
  status: string;
  total: number;
  order_date?: string;
  created_at?: string;
  channel_id?: string;
  customer_phone?: string;
  customer_name?: string;
  order_items?: Array<{
    product_id: string;
    quantity: number;
    products?: { cost_price?: number };
  }>;
}

export interface ProductForKpi {
  id: string;
  is_service?: boolean;
  stock_quantity?: number;
  min_stock?: number;
  cost_price?: number;
}

export interface BomItemForKpi {
  product_id: string;
  material_id: string;
  quantity: number;
  material?: { cost_price?: number };
}

export interface ChannelForKpi {
  id: string;
  name: string;
  color?: string;
}

export interface KpiResult {
  totalRevenue: number;
  totalOrders: number;
  totalCOGS: number;
  grossProfit: number;
  profitMargin: number;
  aov: number;
  returnRate: number;
  lowStockCount: number;
  totalCustomers: number;
}

const VALID_STATUSES = ["delivered", "confirmed", "processing", "shipping"];

export function calculateDashboardKpis(
  orders: OrderForKpi[],
  products: ProductForKpi[],
  bomItems: BomItemForKpi[],
): KpiResult {
  const validOrders = orders.filter(o => VALID_STATUSES.includes(o.status));
  const totalRevenue = validOrders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;

  // BOM-based COGS — only on valid orders
  const totalCOGS = validOrders.reduce((acc, o) => {
    const itemSum = (o.order_items || []).reduce((sum, item) => {
      const bom = bomItems.filter(b => b.product_id === item.product_id);
      if (bom.length > 0) {
        const bomCost = bom.reduce((bs, b) => bs + ((b.material?.cost_price || 0) * b.quantity), 0);
        return sum + bomCost * item.quantity;
      }
      const prod = products.find(p => p.id === item.product_id);
      return sum + ((prod?.cost_price || item.products?.cost_price || 0) * item.quantity);
    }, 0);
    return acc + itemSum;
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const returnedCount = orders.filter(o => o.status === "returned").length;
  const returnRate = totalOrders > 0 ? parseFloat(((returnedCount / totalOrders) * 100).toFixed(1)) : 0;

  const lowStockCount = products.filter(
    p => !p.is_service && (p.stock_quantity || 0) <= (p.min_stock || 0)
  ).length;

  const totalCustomers = new Set(
    orders.map(o => o.customer_phone || o.customer_name).filter(Boolean)
  ).size || 0;

  return {
    totalRevenue,
    totalOrders,
    totalCOGS,
    grossProfit,
    profitMargin,
    aov,
    returnRate,
    lowStockCount,
    totalCustomers,
  };
}

/**
 * Validate order status transition
 */
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipping", "cancelled"],
  shipping: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export function isValidStatusTransition(from: string, to: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

/**
 * Validate double-entry balance
 */
export function validateDebitCreditBalance(
  lines: Array<{ debit: number; credit: number }>
): { balanced: boolean; totalDebit: number; totalCredit: number; diff: number } {
  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  return { balanced: diff <= 0.01, totalDebit, totalCredit, diff };
}

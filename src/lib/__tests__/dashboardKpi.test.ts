import { describe, it, expect } from "vitest";
import {
  calculateDashboardKpis,
  isValidStatusTransition,
  validateDebitCreditBalance,
  ALLOWED_TRANSITIONS,
  type OrderForKpi,
  type ProductForKpi,
  type BomItemForKpi,
} from "../dashboardKpi";

// --- Test data fixtures ---
const products: ProductForKpi[] = [
  { id: "p1", cost_price: 5000, stock_quantity: 100, min_stock: 10 },
  { id: "p2", cost_price: 3000, stock_quantity: 5, min_stock: 10 }, // low stock
  { id: "p3", cost_price: 0, stock_quantity: 50, min_stock: 5, is_service: true },
  { id: "nvl-vai", cost_price: 2000, stock_quantity: 500, min_stock: 20 },
  { id: "nvl-muc", cost_price: 500, stock_quantity: 200, min_stock: 10 },
];

const bomItems: BomItemForKpi[] = [
  { product_id: "p1", material_id: "nvl-vai", quantity: 1.5, material: { cost_price: 2000 } },
  { product_id: "p1", material_id: "nvl-muc", quantity: 0.5, material: { cost_price: 500 } },
];

const orders: OrderForKpi[] = [
  {
    id: "ord-1", status: "delivered", total: 50000,
    customer_phone: "0901234567",
    order_items: [{ product_id: "p1", quantity: 2, products: { cost_price: 5000 } }],
  },
  {
    id: "ord-2", status: "confirmed", total: 30000,
    customer_phone: "0909876543",
    order_items: [{ product_id: "p2", quantity: 3, products: { cost_price: 3000 } }],
  },
  {
    id: "ord-3", status: "cancelled", total: 20000,
    customer_phone: "0901234567",
    order_items: [{ product_id: "p1", quantity: 1, products: { cost_price: 5000 } }],
  },
  {
    id: "ord-4", status: "returned", total: 10000,
    customer_name: "Nguyen Van A",
    order_items: [{ product_id: "p2", quantity: 1, products: { cost_price: 3000 } }],
  },
];

describe("Dashboard KPI — Pure Logic", () => {
  it("should calculate totalRevenue only from valid orders (not cancelled/returned)", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    // valid orders: ord-1 (50k) + ord-2 (30k) = 80,000
    expect(kpi.totalRevenue).toBe(80000);
  });

  it("should count ALL orders for totalOrders", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    expect(kpi.totalOrders).toBe(4);
  });

  it("should calculate COGS only on valid orders using BOM", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    // ord-1: p1 has BOM → (2000*1.5 + 500*0.5) * 2 items = (3000+250)*2 = 6500
    // ord-2: p2 has NO BOM → cost_price 3000 * 3 items = 9000
    // cancelled/returned NOT included
    expect(kpi.totalCOGS).toBe(6500 + 9000);
  });

  it("should calculate grossProfit = revenue - COGS", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    expect(kpi.grossProfit).toBe(kpi.totalRevenue - kpi.totalCOGS);
  });

  it("should calculate profitMargin as percentage", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    const expected = (kpi.grossProfit / kpi.totalRevenue) * 100;
    expect(kpi.profitMargin).toBeCloseTo(expected, 2);
  });

  it("should calculate AOV = revenue / total orders", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    // 80000 / 4 = 20000
    expect(kpi.aov).toBe(20000);
  });

  it("should calculate returnRate correctly", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    // 1 returned / 4 total = 25%
    expect(kpi.returnRate).toBe(25);
  });

  it("should count lowStockCount excluding service products", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    // p2 has stock 5 <= min 10 → low stock
    // p3 is service → excluded
    expect(kpi.lowStockCount).toBe(1);
  });

  it("should count unique customers", () => {
    const kpi = calculateDashboardKpis(orders, products, bomItems);
    // 0901234567, 0909876543, Nguyen Van A → 3 unique
    expect(kpi.totalCustomers).toBe(3);
  });

  it("should handle empty orders gracefully", () => {
    const kpi = calculateDashboardKpis([], products, bomItems);
    expect(kpi.totalRevenue).toBe(0);
    expect(kpi.totalCOGS).toBe(0);
    expect(kpi.profitMargin).toBe(0);
    expect(kpi.aov).toBe(0);
    expect(kpi.returnRate).toBe(0);
    expect(kpi.totalCustomers).toBe(0);
  });
});

describe("Order Status Transition Guard", () => {
  it("should allow valid forward transitions", () => {
    expect(isValidStatusTransition("pending", "confirmed")).toBe(true);
    expect(isValidStatusTransition("confirmed", "processing")).toBe(true);
    expect(isValidStatusTransition("processing", "shipping")).toBe(true);
    expect(isValidStatusTransition("shipping", "delivered")).toBe(true);
  });

  it("should allow cancellation from active states", () => {
    expect(isValidStatusTransition("pending", "cancelled")).toBe(true);
    expect(isValidStatusTransition("confirmed", "cancelled")).toBe(true);
    expect(isValidStatusTransition("processing", "cancelled")).toBe(true);
  });

  it("should allow return only from shipping or delivered", () => {
    expect(isValidStatusTransition("shipping", "returned")).toBe(true);
    expect(isValidStatusTransition("delivered", "returned")).toBe(true);
  });

  it("should block invalid backward transitions", () => {
    expect(isValidStatusTransition("delivered", "pending")).toBe(false);
    expect(isValidStatusTransition("shipping", "confirmed")).toBe(false);
    expect(isValidStatusTransition("confirmed", "pending")).toBe(false);
  });

  it("should block transitions from terminal states", () => {
    expect(isValidStatusTransition("cancelled", "pending")).toBe(false);
    expect(isValidStatusTransition("cancelled", "confirmed")).toBe(false);
    expect(isValidStatusTransition("returned", "delivered")).toBe(false);
    expect(isValidStatusTransition("returned", "shipping")).toBe(false);
  });

  it("should block cancelling after delivery", () => {
    expect(isValidStatusTransition("delivered", "cancelled")).toBe(false);
  });
});

describe("Double-Entry Balance Validation", () => {
  it("should validate balanced entries", () => {
    const result = validateDebitCreditBalance([
      { debit: 100000, credit: 0 },
      { debit: 0, credit: 100000 },
    ]);
    expect(result.balanced).toBe(true);
    expect(result.totalDebit).toBe(100000);
    expect(result.totalCredit).toBe(100000);
  });

  it("should detect unbalanced entries", () => {
    const result = validateDebitCreditBalance([
      { debit: 100000, credit: 0 },
      { debit: 0, credit: 90000 },
    ]);
    expect(result.balanced).toBe(false);
    expect(result.diff).toBe(10000);
  });

  it("should tolerate rounding errors <= 0.01", () => {
    const result = validateDebitCreditBalance([
      { debit: 100000.005, credit: 0 },
      { debit: 0, credit: 100000 },
    ]);
    expect(result.balanced).toBe(true);
  });

  it("should handle empty lines", () => {
    const result = validateDebitCreditBalance([]);
    expect(result.balanced).toBe(true);
    expect(result.totalDebit).toBe(0);
    expect(result.totalCredit).toBe(0);
  });

  it("should handle multi-line complex entries", () => {
    const result = validateDebitCreditBalance([
      { debit: 50000, credit: 0 },     // Nợ 131
      { debit: 0, credit: 50000 },     // Có 511
      { debit: 23500, credit: 0 },     // Nợ 632
      { debit: 0, credit: 23500 },     // Có 156
    ]);
    expect(result.balanced).toBe(true);
    expect(result.totalDebit).toBe(73500);
    expect(result.totalCredit).toBe(73500);
  });
});

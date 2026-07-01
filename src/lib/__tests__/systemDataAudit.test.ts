import { describe, expect, it } from "vitest";
import { buildSystemDataAuditReport, type SystemAuditSnapshot } from "@/lib/systemDataAudit";

const cleanSnapshot: SystemAuditSnapshot = {
  products: [
    { id: "shirt", sku: "TP001", name: "Finished shirt", stock_quantity: 5, cost_price: 60, selling_price: 80 },
    { id: "fabric", sku: "NVL001", name: "Fabric", stock_quantity: 10, cost_price: 30, selling_price: 35 },
  ],
  warehouseStock: [
    { id: "stock-shirt", product_id: "shirt", warehouse_id: "main", quantity: 5 },
    { id: "stock-fabric", product_id: "fabric", warehouse_id: "main", quantity: 10 },
  ],
  orders: [
    {
      id: "order-1",
      order_number: "SO-001",
      subtotal: 200,
      total: 200,
      paid_amount: 200,
      payment_status: "paid",
      order_items: [{ id: "line-1", product_id: "shirt", quantity: 2, unit_price: 100, total: 200 }],
    },
  ],
  payments: [{ id: "payment-1", order_id: "order-1", transaction_type: "payment_in", amount: 200 }],
  journalEntries: [
    {
      id: "journal-1",
      description: "Balanced sale",
      journal_lines: [
        { id: "debit", entry_id: "journal-1", debit: 200, credit: 0 },
        { id: "credit", entry_id: "journal-1", debit: 0, credit: 200 },
      ],
    },
  ],
  journalLines: [],
  productBom: [
    {
      id: "bom-1",
      product_id: "shirt",
      material_id: "fabric",
      quantity: 2,
      product: { id: "shirt", sku: "TP001", name: "Finished shirt", cost_price: 60 },
      material: { id: "fabric", sku: "NVL001", name: "Fabric", cost_price: 30 },
    },
  ],
  memberships: [],
  membershipTransactions: [],
};

describe("system data audit", () => {
  it("passes a synchronized inventory, order, payment, ledger, and BOM snapshot", () => {
    const report = buildSystemDataAuditReport(cleanSnapshot);

    expect(report.score).toBe(100);
    expect(report.errorCount).toBe(0);
    expect(report.warningCount).toBe(0);
    expect(report.issues).toHaveLength(0);
    expect(report.okChecks).toBe(report.totalChecks);
  });

  it("detects mismatched stock, prices, order totals, payments, ledger, and BOM cost", () => {
    const report = buildSystemDataAuditReport({
      ...cleanSnapshot,
      products: [
        { id: "shirt", sku: "TP001", name: "Finished shirt", stock_quantity: 8, cost_price: 50, selling_price: 45 },
        { id: "fabric", sku: "NVL001", name: "Fabric", stock_quantity: 10, cost_price: 30, selling_price: 35 },
      ],
      warehouseStock: [
        { id: "stock-shirt", product_id: "shirt", warehouse_id: "main", quantity: 5 },
        { id: "stock-fabric", product_id: "fabric", warehouse_id: "main", quantity: 10 },
      ],
      orders: [
        {
          id: "order-1",
          order_number: "SO-001",
          subtotal: 200,
          total: 260,
          paid_amount: 100,
          payment_status: "paid",
          order_items: [{ id: "line-1", product_id: "shirt", quantity: 2, unit_price: 100, total: 150 }],
        },
      ],
      payments: [{ id: "payment-1", order_id: "order-1", transaction_type: "payment_in", amount: 90 }],
      journalEntries: [
        {
          id: "journal-1",
          description: "Unbalanced sale",
          journal_lines: [
            { id: "debit", entry_id: "journal-1", debit: 100, credit: 0 },
            { id: "credit", entry_id: "journal-1", debit: 0, credit: 80 },
          ],
        },
      ],
      productBom: [
        {
          id: "bom-1",
          product_id: "shirt",
          material_id: "fabric",
          quantity: 2,
          product: { id: "shirt", sku: "TP001", name: "Finished shirt", cost_price: 50 },
          material: { id: "fabric", sku: "NVL001", name: "Fabric", cost_price: 30 },
        },
      ],
    });

    expect(report.score).toBeLessThan(100);
    expect(report.errorCount).toBeGreaterThan(0);
    expect(report.warningCount).toBeGreaterThan(0);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "Kho", entityType: "product", expectedValue: 8, actualValue: 5 }),
        expect.objectContaining({ module: "Giá", entityType: "product", severity: "warning" }),
        expect.objectContaining({ module: "Đơn hàng", entityType: "order_item" }),
        expect.objectContaining({ module: "Thanh toán", entityType: "order", expectedValue: 90, actualValue: 100 }),
        expect.objectContaining({ module: "Kế toán", entityType: "journal_entry", expectedValue: 80, actualValue: 100 }),
        expect.objectContaining({ module: "BOM", entityType: "product", expectedValue: 60, actualValue: 50 }),
      ])
    );
  });
});

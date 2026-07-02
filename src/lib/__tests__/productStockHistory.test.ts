import { describe, it, expect } from "vitest";

interface InventoryTransaction {
  id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

const mockTransactions: InventoryTransaction[] = [
  { id: "tx-1", product_id: "prod-sticker", quantity: 100, notes: "Nhập hàng", created_at: "2026-07-01T08:00:00Z" },
  { id: "tx-2", product_id: "prod-pepsi", quantity: 200, notes: "Nhập Pepsi", created_at: "2026-07-01T09:00:00Z" },
  { id: "tx-3", product_id: "prod-sticker", quantity: -5, notes: "Xuất Sticker", created_at: "2026-07-01T10:00:00Z" }
];

const filterTransactionsByProduct = (productId: string): InventoryTransaction[] => {
  return mockTransactions
    .filter(tx => tx.product_id === productId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

describe("Product Stock History Logs Filters Tests", () => {
  it("1. should filter inventory transactions by specific product correctly", () => {
    const results = filterTransactionsByProduct("prod-sticker");
    expect(results.length).toBe(2);
    expect(results.every(tx => tx.product_id === "prod-sticker")).toBe(true);
  });

  it("2. should order transactions descending by created_at time (newest first)", () => {
    const results = filterTransactionsByProduct("prod-sticker");
    expect(results[0].id).toBe("tx-3"); // 10:00:00 is newer than 08:00:00
    expect(results[1].id).toBe("tx-1");
  });

  it("3. should return empty list if product has no recorded transactions", () => {
    const results = filterTransactionsByProduct("prod-unknown");
    expect(results.length).toBe(0);
  });
});

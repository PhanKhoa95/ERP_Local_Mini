import { describe, it, expect } from "vitest";

interface StockTransactionItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  search_query: string;
  is_open: boolean;
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

const mockProducts: Product[] = [
  { id: "prod-sticker", sku: "PRD-STICKER", name: "Sticker logo decal" }
];

// Replicate our React state update logic in a pure TS function for unit testing
const updateItemState = (
  items: StockTransactionItem[],
  id: string,
  updates: Partial<StockTransactionItem>
): StockTransactionItem[] => {
  return items.map(item => {
    if (item.id === id) {
      const updated = { ...item, ...updates };
      if (updates.hasOwnProperty("product_id")) {
        updated.variant_id = ""; // Reset variant when product changes
        const selected = mockProducts.find((p) => p.id === updates.product_id);
        if (selected) {
          updated.search_query = `${selected.sku} - ${selected.name}`;
        }
      }
      return updated;
    }
    return item;
  });
};

describe("Atomic State Update Tests (Anti-Race Condition)", () => {
  it("1. should update multiple properties simultaneously without overwriting each other", () => {
    let items: StockTransactionItem[] = [
      { id: "item-1", product_id: "prod-sticker", variant_id: "var-red", quantity: 1, search_query: "PRD-STICKER - Sticker logo decal", is_open: false }
    ];

    // Simulating user typing to search: updates query, clears product_id, opens panel in ONE atomic update
    items = updateItemState(items, "item-1", {
      search_query: "PRD-STICKER-BLU",
      product_id: "",
      is_open: true
    });

    expect(items[0].search_query).toBe("PRD-STICKER-BLU");
    expect(items[0].product_id).toBe("");
    expect(items[0].is_open).toBe(true);
    expect(items[0].variant_id).toBe(""); // variant reset should be triggered
  });

  it("2. should correctly auto-generate search query text and reset variant ID when selecting a product", () => {
    let items: StockTransactionItem[] = [
      { id: "item-1", product_id: "", variant_id: "var-red", quantity: 1, search_query: "stick", is_open: true }
    ];

    // Selecting the product
    items = updateItemState(items, "item-1", {
      product_id: "prod-sticker",
      is_open: false
    });

    expect(items[0].product_id).toBe("prod-sticker");
    expect(items[0].is_open).toBe(false);
    expect(items[0].variant_id).toBe(""); // variant reset to empty string
    expect(items[0].search_query).toBe("PRD-STICKER - Sticker logo decal"); // auto-filled
  });
});

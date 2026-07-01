import { describe, it, expect } from "vitest";

interface Product {
  id: string;
  sku: string;
  name: string;
  barcode?: string;
}

const mockProducts: Product[] = [
  { id: "prod-sticker", sku: "PRD-STICKER", name: "Sticker logo decal giấy", barcode: "8931234567890" },
  { id: "prod-card", sku: "PRD-CARD", name: "Card cảm ơn / Thank you card", barcode: "8930000000001" },
  { id: "prod-packaging", sku: "BOX-001", name: "Hộp carton đóng hàng", barcode: "00123456" }
];

const filterProducts = (query: string): Product[] => {
  const q = query.trim().toLowerCase();
  if (!q) return mockProducts;
  return mockProducts.filter(p => {
    const bc = p.barcode || "";
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      bc.toLowerCase().includes(q)
    );
  });
};

describe("Stock Autocomplete Search Tests", () => {
  it("1. should filter products by name correctly (case-insensitive)", () => {
    const results = filterProducts("sticker");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("prod-sticker");

    const results2 = filterProducts("Card");
    expect(results2.length).toBe(1);
    expect(results2[0].id).toBe("prod-card");
  });

  it("2. should filter products by exact or partial SKU correctly", () => {
    const results = filterProducts("PRD-");
    expect(results.length).toBe(2); // sticker and card

    const results2 = filterProducts("BOX-001");
    expect(results2.length).toBe(1);
    expect(results2[0].id).toBe("prod-packaging");
  });

  it("3. should filter products by barcode correctly", () => {
    // Exact match barcode
    const results = filterProducts("8931234567890");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("prod-sticker");

    // Partial match barcode
    const results2 = filterProducts("00000");
    expect(results2.length).toBe(1);
    expect(results2[0].id).toBe("prod-card");
  });

  it("4. should return empty list if query does not match any name, SKU or barcode", () => {
    const results = filterProducts("unknown-item-123");
    expect(results.length).toBe(0);
  });
});

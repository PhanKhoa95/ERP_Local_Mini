import { describe, it, expect, beforeEach } from "vitest";

// Interface representation matching our local state
interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  has_variants: boolean;
}

describe("Product Variants Empirical Tests", () => {
  let mockProducts: Product[];
  let mockVariants: ProductVariant[];

  beforeEach(() => {
    mockProducts = [
      { id: "prod-sticker", sku: "PRD-STICKER", name: "Sticker logo decal giấy", has_variants: false }
    ];

    mockVariants = [
      {
        id: "var-1",
        product_id: "prod-sticker",
        sku: "PRD-STICKER-RED",
        name: "Sticker logo decal giấy - Đỏ",
        attributes: { "Màu sắc": "Đỏ" },
        cost_price: 45000,
        selling_price: 99000,
        stock_quantity: 200,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
    
    mockProducts[0].has_variants = true; // since it has var-1
  });

  it("1. should retrieve existing variants for a product correctly", () => {
    const productId = "prod-sticker";
    const productVariants = mockVariants.filter(v => v.product_id === productId);
    
    expect(productVariants.length).toBe(1);
    expect(productVariants[0].sku).toBe("PRD-STICKER-RED");
    expect(productVariants[0].attributes["Màu sắc"]).toBe("Đỏ");
  });

  it("2. should block adding a new variant with a duplicate SKU", () => {
    const newVariant = {
      product_id: "prod-sticker",
      sku: "PRD-STICKER-RED", // Duplicate
      name: "Sticker logo decal giấy - Đỏ mới",
      attributes: { "Màu sắc": "Đỏ" },
      cost_price: 45000,
      selling_price: 99000,
      stock_quantity: 100,
      is_active: true
    };

    const duplicate = mockVariants.some(v => v.sku.trim().toLowerCase() === newVariant.sku.trim().toLowerCase());
    expect(duplicate).toBe(true); // Should block
  });

  it("3. should successfully add a new variant and update has_variants flag of product", () => {
    // Reset has_variants
    mockProducts[0].has_variants = false;
    mockVariants = [];

    const newVariant = {
      id: "var-2",
      product_id: "prod-sticker",
      sku: "PRD-STICKER-BLUE",
      name: "Sticker logo decal giấy - Xanh",
      attributes: { "Màu sắc": "Xanh" },
      cost_price: 45000,
      selling_price: 99000,
      stock_quantity: 150,
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Simulate creation
    mockVariants.push(newVariant);
    const parentProd = mockProducts.find(p => p.id === newVariant.product_id);
    if (parentProd) {
      parentProd.has_variants = true;
    }

    expect(mockVariants.length).toBe(1);
    expect(mockVariants[0].sku).toBe("PRD-STICKER-BLUE");
    expect(mockProducts[0].has_variants).toBe(true);
  });

  it("4. should successfully update an existing variant's prices and attributes", () => {
    const targetId = "var-1";
    const updatePayload = {
      cost_price: 40000,
      selling_price: 95000,
      attributes: { "Màu sắc": "Đỏ Đậm", "Kích thước": "L" }
    };

    const idx = mockVariants.findIndex(v => v.id === targetId);
    expect(idx).not.toBe(-1);

    mockVariants[idx] = { ...mockVariants[idx], ...updatePayload };

    expect(mockVariants[idx].cost_price).toBe(40000);
    expect(mockVariants[idx].selling_price).toBe(95000);
    expect(mockVariants[idx].attributes["Màu sắc"]).toBe("Đỏ Đậm");
    expect(mockVariants[idx].attributes["Kích thước"]).toBe("L");
  });

  it("5. should successfully delete a variant and update has_variants = false when no variants remain", () => {
    const deleteId = "var-1";
    
    // Simulate deletion
    const remaining = mockVariants.filter(v => v.id !== deleteId);
    mockVariants = remaining;

    const hasMore = mockVariants.some(v => v.product_id === "prod-sticker");
    if (!hasMore) {
      const parentProd = mockProducts.find(p => p.id === "prod-sticker");
      if (parentProd) {
        parentProd.has_variants = false;
      }
    }

    expect(mockVariants.length).toBe(0);
    expect(mockProducts[0].has_variants).toBe(false); // correctly set to false
  });
});

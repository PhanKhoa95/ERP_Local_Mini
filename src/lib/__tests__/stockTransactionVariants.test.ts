import { describe, it, expect, beforeEach } from "vitest";

interface Product {
  id: string;
  sku: string;
  name: string;
  stock_quantity: number;
  has_variants: boolean;
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  stock_quantity: number;
}

describe("Stock Transactions with Variants", () => {
  let mockProducts: Product[];
  let mockVariants: ProductVariant[];

  beforeEach(() => {
    mockProducts = [
      { id: "prod-sticker", sku: "PRD-STICKER", name: "Sticker logo decal", stock_quantity: 450, has_variants: true }
    ];

    mockVariants = [
      { id: "var-red", product_id: "prod-sticker", sku: "PRD-STICKER-RED", name: "Sticker - Đỏ", stock_quantity: 200 },
      { id: "var-blue", product_id: "prod-sticker", sku: "PRD-STICKER-BLUE", name: "Sticker - Xanh", stock_quantity: 250 }
    ];
  });

  const performTransaction = (params: {
    product_id: string;
    variant_id?: string;
    type: "in" | "out";
    quantity: number;
  }) => {
    const { product_id, variant_id, type, quantity } = params;
    const prod = mockProducts.find(p => p.id === product_id);
    if (!prod) throw new Error("Product not found");

    const delta = type === "in" ? quantity : -quantity;

    if (prod.has_variants && variant_id) {
      const vIdx = mockVariants.findIndex(v => v.id === variant_id);
      if (vIdx === -1) throw new Error("Variant not found");

      if (type === "out" && mockVariants[vIdx].stock_quantity < quantity) {
        throw new Error(`Không đủ tồn kho. Phân loại chỉ còn ${mockVariants[vIdx].stock_quantity} sản phẩm.`);
      }

      // Update variant stock
      mockVariants[vIdx].stock_quantity = Math.max(0, mockVariants[vIdx].stock_quantity + delta);

      // Re-sum parent product stock
      const sibVars = mockVariants.filter(v => v.product_id === product_id);
      prod.stock_quantity = sibVars.reduce((sum, v) => sum + v.stock_quantity, 0);
    } else {
      if (type === "out" && prod.stock_quantity < quantity) {
        throw new Error("Không đủ tồn kho.");
      }
      prod.stock_quantity = Math.max(0, prod.stock_quantity + delta);
    }
  };

  it("1. should increase variant stock and parent stock upon inbound transaction", () => {
    performTransaction({
      product_id: "prod-sticker",
      variant_id: "var-red",
      type: "in",
      quantity: 50
    });

    const targetVar = mockVariants.find(v => v.id === "var-red");
    const parentProd = mockProducts.find(p => p.id === "prod-sticker");

    expect(targetVar?.stock_quantity).toBe(250); // 200 + 50
    expect(parentProd?.stock_quantity).toBe(500); // 450 + 50 (sum of 250 + 250)
  });

  it("2. should decrease variant stock and parent stock upon outbound transaction", () => {
    performTransaction({
      product_id: "prod-sticker",
      variant_id: "var-blue",
      type: "out",
      quantity: 100
    });

    const targetVar = mockVariants.find(v => v.id === "var-blue");
    const parentProd = mockProducts.find(p => p.id === "prod-sticker");

    expect(targetVar?.stock_quantity).toBe(150); // 250 - 100
    expect(parentProd?.stock_quantity).toBe(350); // 450 - 100 (sum of 200 + 150)
  });

  it("3. should throw error if attempting to outbound more than variant stock even if parent total stock is sufficient", () => {
    // Total parent stock is 450, but variant RED only has 200. We try to outbound 210 of variant RED.
    expect(() => {
      performTransaction({
        product_id: "prod-sticker",
        variant_id: "var-red",
        type: "out",
        quantity: 210
      });
    }).toThrowError("Không đủ tồn kho");

    // Stock should not change
    const targetVar = mockVariants.find(v => v.id === "var-red");
    const parentProd = mockProducts.find(p => p.id === "prod-sticker");
    expect(targetVar?.stock_quantity).toBe(200);
    expect(parentProd?.stock_quantity).toBe(450);
  });
});

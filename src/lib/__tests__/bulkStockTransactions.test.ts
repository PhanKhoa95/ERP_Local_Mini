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

interface TransactionItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

describe("Bulk Stock Transactions (Multi-SKU)", () => {
  let mockProducts: Product[];
  let mockVariants: ProductVariant[];

  beforeEach(() => {
    mockProducts = [
      { id: "prod-sticker", sku: "PRD-STICKER", name: "Sticker logo decal", stock_quantity: 450, has_variants: true },
      { id: "prod-card", sku: "PRD-CARD", name: "Card cảm ơn", stock_quantity: 100, has_variants: false }
    ];

    mockVariants = [
      { id: "var-red", product_id: "prod-sticker", sku: "PRD-STICKER-RED", name: "Sticker - Đỏ", stock_quantity: 200 },
      { id: "var-blue", product_id: "prod-sticker", sku: "PRD-STICKER-BLUE", name: "Sticker - Xanh", stock_quantity: 250 }
    ];
  });

  const performBulkTransaction = (
    type: "in" | "out",
    items: TransactionItem[]
  ) => {
    // 1. Validation phase (Bulk Validation)
    if (type === "out") {
      // Aggregate quantities by product/variant keys
      const aggregates: Record<string, number> = {};
      items.forEach(item => {
        const key = item.variant_id ? `var-${item.variant_id}` : `prod-${item.product_id}`;
        aggregates[key] = (aggregates[key] || 0) + item.quantity;
      });

      for (const [key, qty] of Object.entries(aggregates)) {
        if (key.startsWith("var-")) {
          const varId = key.replace("var-", "");
          const variant = mockVariants.find(v => v.id === varId);
          if (!variant) throw new Error("Variant not found");
          if (variant.stock_quantity < qty) {
            throw new Error(`Phân loại "${variant.name}" không đủ tồn kho.`);
          }
        } else {
          const prodId = key.replace("prod-", "");
          const prod = mockProducts.find(p => p.id === prodId);
          if (prod && prod.stock_quantity < qty) {
            throw new Error(`Sản phẩm "${prod.name}" không đủ tồn kho.`);
          }
        }
      }
    }

    // 2. Execution phase (Bulk Update)
    items.forEach(item => {
      const delta = type === "in" ? item.quantity : -item.quantity;
      const prod = mockProducts.find(p => p.id === item.product_id);
      if (!prod) throw new Error("Product not found");

      if (prod.has_variants && item.variant_id) {
        const vIdx = mockVariants.findIndex(v => v.id === item.variant_id);
        if (vIdx !== -1) {
          mockVariants[vIdx].stock_quantity = Math.max(0, mockVariants[vIdx].stock_quantity + delta);
        }
        // Re-sum parent product stock
        const sibVars = mockVariants.filter(v => v.product_id === item.product_id);
        prod.stock_quantity = sibVars.reduce((sum, v) => sum + v.stock_quantity, 0);
      } else {
        prod.stock_quantity = Math.max(0, prod.stock_quantity + delta);
      }
    });
  };

  it("1. should successfully import multiple SKUs (variants & products) together", () => {
    const importPayload: TransactionItem[] = [
      { product_id: "prod-sticker", variant_id: "var-red", quantity: 50 },
      { product_id: "prod-sticker", variant_id: "var-blue", quantity: 30 },
      { product_id: "prod-card", quantity: 40 }
    ];

    performBulkTransaction("in", importPayload);

    const varRed = mockVariants.find(v => v.id === "var-red");
    const varBlue = mockVariants.find(v => v.id === "var-blue");
    const parentSticker = mockProducts.find(p => p.id === "prod-sticker");
    const cardProd = mockProducts.find(p => p.id === "prod-card");

    expect(varRed?.stock_quantity).toBe(250); // 200 + 50
    expect(varBlue?.stock_quantity).toBe(280); // 250 + 30
    expect(parentSticker?.stock_quantity).toBe(530); // 450 + 80
    expect(cardProd?.stock_quantity).toBe(140); // 100 + 40
  });

  it("2. should successfully export multiple SKUs together", () => {
    const exportPayload: TransactionItem[] = [
      { product_id: "prod-sticker", variant_id: "var-red", quantity: 20 },
      { product_id: "prod-sticker", variant_id: "var-blue", quantity: 50 },
      { product_id: "prod-card", quantity: 10 }
    ];

    performBulkTransaction("out", exportPayload);

    const varRed = mockVariants.find(v => v.id === "var-red");
    const varBlue = mockVariants.find(v => v.id === "var-blue");
    const parentSticker = mockProducts.find(p => p.id === "prod-sticker");
    const cardProd = mockProducts.find(p => p.id === "prod-card");

    expect(varRed?.stock_quantity).toBe(180); // 200 - 20
    expect(varBlue?.stock_quantity).toBe(200); // 250 - 50
    expect(parentSticker?.stock_quantity).toBe(380); // 450 - 70
    expect(cardProd?.stock_quantity).toBe(90); // 100 - 10
  });

  it("3. should throw error and not proceed with execution if any item in the batch exceeds available stock", () => {
    const exportPayload: TransactionItem[] = [
      { product_id: "prod-sticker", variant_id: "var-red", quantity: 10 },
      { product_id: "prod-sticker", variant_id: "var-blue", quantity: 300 }, // Over stock (250 < 300)
      { product_id: "prod-card", quantity: 10 }
    ];

    expect(() => {
      performBulkTransaction("out", exportPayload);
    }).toThrowError("không đủ tồn kho");

    // Check that NO changes were made to mock databases (Transactional Safety)
    const varRed = mockVariants.find(v => v.id === "var-red");
    const varBlue = mockVariants.find(v => v.id === "var-blue");
    const cardProd = mockProducts.find(p => p.id === "prod-card");

    expect(varRed?.stock_quantity).toBe(200);
    expect(varBlue?.stock_quantity).toBe(250);
    expect(cardProd?.stock_quantity).toBe(100);
  });
});

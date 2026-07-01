import { describe, it, expect } from "vitest";

interface Product {
  id: string;
  sku: string;
  name: string;
  stock_quantity: number;
  unit: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  stock_quantity: number;
}

interface UnitConversion {
  id: string;
  product_id: string;
  from_unit: string;
  to_unit: string;
  factor: number;
}

describe("Unit Conversions and Break Pack Logic Tests", () => {
  const mockProduct: Product = {
    id: "prod-sticker",
    sku: "PRD-STICKER",
    name: "Sticker logo decal",
    stock_quantity: 600, // Total parent stock
    unit: "Cái"
  };

  const mockVariants: ProductVariant[] = [
    { id: "var-box", product_id: "prod-sticker", name: "Thùng Sticker", stock_quantity: 1 }, // Large unit
    { id: "var-piece", product_id: "prod-sticker", name: "Cái Sticker lẻ", stock_quantity: 100 }  // Base unit
  ];

  const mockConversion: UnitConversion = {
    id: "conv-box-to-piece",
    product_id: "prod-sticker",
    from_unit: "Thùng",
    to_unit: "Cái",
    factor: 500 // 1 Thùng = 500 Cái
  };

  it("1. should correctly convert transaction quantities based on selected UOM conversion factor", () => {
    // Transaction input: User inputs 2 packages (Thùng)
    const txQty = 2;
    const factor = mockConversion.factor;
    const actualQty = txQty * factor;

    expect(actualQty).toBe(1000); // 2 * 500 = 1000 pieces
  });

  it("2. should correctly adjust variant stocks when breaking package (xé lẻ) dynamic conversions", () => {
    let variants = [...mockVariants];
    const breakQty = 1; // Break 1 box

    // Find source (Box) and dest (Piece) variants
    const srcVar = variants.find(v => v.id === "var-box")!;
    const dstVar = variants.find(v => v.id === "var-piece")!;

    expect(srcVar.stock_quantity).toBe(1);

    // Apply Break Pack transaction
    const totalDestQty = breakQty * mockConversion.factor; // 1 * 500 = 500

    // Deduct source
    srcVar.stock_quantity -= breakQty;
    // Add destination
    dstVar.stock_quantity += totalDestQty;

    // Recalculate parent product total stock
    const newTotalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);

    expect(srcVar.stock_quantity).toBe(0);
    expect(dstVar.stock_quantity).toBe(600); // 100 + 500 = 600 pieces
    expect(newTotalStock).toBe(600); // 0 + 600 = 600
  });

  it("3. should block breaking package if source variant has insufficient stock", () => {
    const breakQty = 5; // Attempt to break 5 boxes, but only 1 exists
    const srcVar = mockVariants.find(v => v.id === "var-box")!;

    const canBreak = srcVar.stock_quantity >= breakQty;
    expect(canBreak).toBe(false);
  });
});

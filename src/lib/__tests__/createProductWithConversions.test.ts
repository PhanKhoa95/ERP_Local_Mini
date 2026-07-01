import { describe, it, expect } from "vitest";

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

interface UnitConversion {
  id: string;
  product_id: string;
  from_unit: string;
  to_unit: string;
  factor: number;
  is_active: boolean;
}

describe("Create Product with Conversions Tests", () => {
  it("should create product and save conversions mapped correctly to new product id", () => {
    // 1. Mock database
    const localProducts: Product[] = [];
    const localConversions: UnitConversion[] = [];

    // 2. Form submission payload containing product details and unit conversions
    const formPayload = {
      sku: "PEPSI-001",
      name: "Pepsi Cola Lon",
      unit: "Lon",
      conversions: [
        { from_unit: "Thùng", factor: 24 },
        { from_unit: "Lốc", factor: 6 }
      ]
    };

    // 3. Simulate createProduct mutation execution returning new product with generated id
    const newProduct: Product = {
      id: "prod-pepsi-123",
      sku: formPayload.sku,
      name: formPayload.name,
      unit: formPayload.unit
    };
    localProducts.push(newProduct);

    // 4. Simulate saving conversions after product creation
    const submittedConversions = formPayload.conversions || [];
    if (newProduct.id && submittedConversions.length > 0) {
      submittedConversions.forEach((c) => {
        localConversions.push({
          id: `conv-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product_id: newProduct.id,
          from_unit: c.from_unit,
          to_unit: newProduct.unit,
          factor: c.factor,
          is_active: true
        });
      });
    }

    // 5. Assertions
    expect(localProducts.length).toBe(1);
    expect(localProducts[0].id).toBe("prod-pepsi-123");
    expect(localProducts[0].sku).toBe("PEPSI-001");

    expect(localConversions.length).toBe(2);
    // Check first conversion (Thùng)
    expect(localConversions[0].product_id).toBe("prod-pepsi-123");
    expect(localConversions[0].from_unit).toBe("Thùng");
    expect(localConversions[0].factor).toBe(24);
    
    // Check second conversion (Lốc)
    expect(localConversions[1].product_id).toBe("prod-pepsi-123");
    expect(localConversions[1].from_unit).toBe("Lốc");
    expect(localConversions[1].factor).toBe(6);
  });
});

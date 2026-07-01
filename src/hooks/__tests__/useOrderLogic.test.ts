import { describe, it, expect } from "vitest";

// Test order & inventory logic (scenarios 16-30)

function generateOrderNumber(prefix: string, counter: number): string {
  return `${prefix}-${String(counter).padStart(6, "0")}`;
}

function calculateInventoryChange(
  items: { product_id: string; quantity: number; is_service: boolean }[],
  transactionType: "in" | "out"
) {
  return items
    .filter(item => !item.is_service)
    .map(item => ({
      product_id: item.product_id,
      quantity: transactionType === "out" ? -item.quantity : item.quantity,
    }));
}

function calculateBomBackflush(
  orderItems: { product_id: string; quantity: number; is_service: boolean }[],
  bomData: Record<string, { material_id: string; quantity: number; material_is_service: boolean }[]>
) {
  const materialChanges: { material_id: string; consumed: number }[] = [];
  for (const item of orderItems) {
    if (item.is_service) continue;
    const bom = bomData[item.product_id];
    if (!bom) continue;
    for (const bomItem of bom) {
      if (bomItem.material_is_service) continue;
      materialChanges.push({
        material_id: bomItem.material_id,
        consumed: item.quantity * bomItem.quantity,
      });
    }
  }
  return materialChanges;
}

describe("Order Logic", () => {
  // Scenario 16: Order number auto-generation
  it("#16 generates order number with correct format", () => {
    expect(generateOrderNumber("ORD", 1)).toBe("ORD-000001");
    expect(generateOrderNumber("ORD", 12345)).toBe("ORD-012345");
  });

  it("handles edge cases for order number generation", () => {
    // 6 digits pad exactly
    expect(generateOrderNumber("ORD", 123456)).toBe("ORD-123456");
    // Greater than 6 digits should not truncate but rather keep the whole digits
    expect(generateOrderNumber("ORD", 1234567)).toBe("ORD-1234567");
    // Zero counter
    expect(generateOrderNumber("ORD", 0)).toBe("ORD-000000");
    // Negative counter
    expect(generateOrderNumber("ORD", -5)).toBe("ORD-0000-5");
    // Empty prefix
    expect(generateOrderNumber("", 100)).toBe("-000100");
    // Counter with decimals
    expect(generateOrderNumber("ORD", 12.34)).toBe("ORD-012.34");
  });

  // Scenario 17: Deduct inventory on confirm
  it("#17 deducts inventory for non-service products", () => {
    const items = [
      { product_id: "p1", quantity: 5, is_service: false },
      { product_id: "p2", quantity: 3, is_service: false },
    ];
    const changes = calculateInventoryChange(items, "out");
    expect(changes).toHaveLength(2);
    expect(changes[0].quantity).toBe(-5);
    expect(changes[1].quantity).toBe(-3);
  });

  // Scenario 20: Service products not deducted
  it("#20 skips service products in inventory deduction", () => {
    const items = [
      { product_id: "p1", quantity: 5, is_service: false },
      { product_id: "svc1", quantity: 1, is_service: true },
    ];
    const changes = calculateInventoryChange(items, "out");
    expect(changes).toHaveLength(1);
    expect(changes[0].product_id).toBe("p1");
  });

  // Scenario 22: Stock in increases quantity
  it("#22 stock in increases quantity", () => {
    const items = [{ product_id: "p1", quantity: 10, is_service: false }];
    const changes = calculateInventoryChange(items, "in");
    expect(changes[0].quantity).toBe(10);
  });

  // Scenario 23: Stock out decreases quantity
  it("#23 stock out decreases quantity", () => {
    const items = [{ product_id: "p1", quantity: 10, is_service: false }];
    const changes = calculateInventoryChange(items, "out");
    expect(changes[0].quantity).toBe(-10);
  });

  it("handles inventory change edge cases", () => {
    // Empty array of items
    expect(calculateInventoryChange([], "out")).toEqual([]);
    
    // Items with quantity 0
    const zeroItem = [{ product_id: "p1", quantity: 0, is_service: false }];
    expect(calculateInventoryChange(zeroItem, "out")).toEqual([{ product_id: "p1", quantity: -0 }]);
    expect(calculateInventoryChange(zeroItem, "in")).toEqual([{ product_id: "p1", quantity: 0 }]);

    // Items with negative quantities
    const negItem = [{ product_id: "p1", quantity: -5, is_service: false }];
    expect(calculateInventoryChange(negItem, "out")).toEqual([{ product_id: "p1", quantity: 5 }]);
    expect(calculateInventoryChange(negItem, "in")).toEqual([{ product_id: "p1", quantity: -5 }]);

    // Only service items
    const svcOnly = [{ product_id: "s1", quantity: 10, is_service: true }];
    expect(calculateInventoryChange(svcOnly, "out")).toEqual([]);

    // Duplicate products (should output multiple changes, as currently implemented)
    const dupItems = [
      { product_id: "p1", quantity: 5, is_service: false },
      { product_id: "p1", quantity: 10, is_service: false },
    ];
    expect(calculateInventoryChange(dupItems, "out")).toEqual([
      { product_id: "p1", quantity: -5 },
      { product_id: "p1", quantity: -10 },
    ]);
  });
});

describe("BOM Backflush", () => {
  const bomData: Record<string, { material_id: string; quantity: number; material_is_service: boolean }[]> = {
    finished_product: [
      { material_id: "wood", quantity: 2, material_is_service: false },
      { material_id: "glue", quantity: 0.5, material_is_service: false },
      { material_id: "labor", quantity: 1, material_is_service: true },
    ],
  };

  // Scenario 18: BOM backflush on confirm
  it("#18 calculates BOM material consumption", () => {
    const items = [{ product_id: "finished_product", quantity: 10, is_service: false }];
    const changes = calculateBomBackflush(items, bomData);
    expect(changes).toHaveLength(2); // wood + glue, labor is service
    expect(changes.find(c => c.material_id === "wood")?.consumed).toBe(20);
    expect(changes.find(c => c.material_id === "glue")?.consumed).toBe(5);
  });

  it("skips service materials in BOM", () => {
    const items = [{ product_id: "finished_product", quantity: 1, is_service: false }];
    const changes = calculateBomBackflush(items, bomData);
    expect(changes.find(c => c.material_id === "labor")).toBeUndefined();
  });

  it("skips service products entirely", () => {
    const items = [{ product_id: "finished_product", quantity: 5, is_service: true }];
    const changes = calculateBomBackflush(items, bomData);
    expect(changes).toHaveLength(0);
  });

  it("handles product with no BOM", () => {
    const items = [{ product_id: "simple_product", quantity: 5, is_service: false }];
    const changes = calculateBomBackflush(items, bomData);
    expect(changes).toHaveLength(0);
  });

  it("handles BOM backflush edge cases", () => {
    // Empty order items
    expect(calculateBomBackflush([], bomData)).toEqual([]);

    // Order items with zero quantity
    const zeroItems = [{ product_id: "finished_product", quantity: 0, is_service: false }];
    const zeroChanges = calculateBomBackflush(zeroItems, bomData);
    expect(zeroChanges.find(c => c.material_id === "wood")?.consumed).toBe(0);

    // Order items with negative quantity
    const negItems = [{ product_id: "finished_product", quantity: -5, is_service: false }];
    const negChanges = calculateBomBackflush(negItems, bomData);
    expect(negChanges.find(c => c.material_id === "wood")?.consumed).toBe(-10);

    // Duplicate items in order
    const dupItems = [
      { product_id: "finished_product", quantity: 2, is_service: false },
      { product_id: "finished_product", quantity: 3, is_service: false },
    ];
    const dupChanges = calculateBomBackflush(dupItems, bomData);
    expect(dupChanges).toHaveLength(4); // 2 wood + 2 glue entries
    const totalWood = dupChanges.filter(c => c.material_id === "wood").reduce((sum, c) => sum + c.consumed, 0);
    expect(totalWood).toBe(10);

    // BOM data with zero/negative material quantities
    const customBomData: Record<string, { material_id: string; quantity: number; material_is_service: boolean }[]> = {
      weird_product: [
        { material_id: "m1", quantity: 0, material_is_service: false },
        { material_id: "m2", quantity: -2, material_is_service: false },
      ]
    };
    const weirdItems = [{ product_id: "weird_product", quantity: 10, is_service: false }];
    const weirdChanges = calculateBomBackflush(weirdItems, customBomData);
    expect(weirdChanges.find(c => c.material_id === "m1")?.consumed).toBe(0);
    expect(weirdChanges.find(c => c.material_id === "m2")?.consumed).toBe(-20);
  });
});

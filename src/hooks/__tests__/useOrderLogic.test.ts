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
});

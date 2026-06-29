import { describe, expect, it } from "vitest";
import {
  buildProductionStockPlan,
  formatMaterialAvailabilityIssues,
  hasSufficientStock,
  roundStockQuantity,
} from "@/lib/productionBom";

describe("production BOM planning", () => {
  it("calculates decimal BOM consumption and finished-good weighted cost", () => {
    const plan = buildProductionStockPlan({
      finishedProduct: {
        id: "shirt",
        sku: "TP001",
        name: "Finished shirt",
        stock_quantity: 10,
        cost_price: 50000,
      },
      productionQuantity: 5,
      productionNumber: "PO-001",
      bomItems: [
        {
          product_id: "shirt",
          material_id: "fabric",
          quantity: 1.2,
          material: {
            id: "fabric",
            sku: "NVL001",
            name: "Fabric",
            stock_quantity: 20,
            cost_price: 30000,
            unit: "m",
          },
        },
        {
          product_id: "shirt",
          material_id: "button",
          quantity: 0.5,
          material: {
            id: "button",
            sku: "NVL002",
            name: "Button pack",
            stock_quantity: 10,
            cost_price: 10000,
            unit: "pack",
          },
        },
      ],
    });

    expect(plan.canComplete).toBe(true);
    expect(plan.materialMoves).toEqual([
      expect.objectContaining({ product_id: "fabric", quantity: 6, signedQuantity: -6 }),
      expect.objectContaining({ product_id: "button", quantity: 2.5, signedQuantity: -2.5 }),
    ]);
    expect(plan.totalMaterialCost).toBe(205000);
    expect(plan.unitMaterialCost).toBe(41000);
    expect(plan.finishedStockAfter).toBe(15);
    expect(plan.finishedCostPriceAfter).toBe(47000);
  });

  it("groups duplicate materials and reports exact shortage", () => {
    const plan = buildProductionStockPlan({
      finishedProduct: { id: "kit", stock_quantity: 0, cost_price: 0 },
      productionQuantity: 3,
      bomItems: [
        {
          product_id: "kit",
          material_id: "glue",
          quantity: 0.25,
          material: { id: "glue", sku: "GLUE", name: "Glue", stock_quantity: 1, unit: "kg" },
        },
        {
          product_id: "kit",
          material_id: "glue",
          quantity: 0.2,
          material: { id: "glue", sku: "GLUE", name: "Glue", stock_quantity: 1, unit: "kg" },
        },
      ],
    });

    expect(plan.canComplete).toBe(false);
    expect(plan.issues).toEqual([
      expect.objectContaining({
        material_id: "glue",
        required: 1.35,
        available: 1,
        shortage: 0.35,
      }),
    ]);
    expect(formatMaterialAvailabilityIssues(plan.issues)).toContain("need 1.35 kg");
  });

  it("skips inactive and service materials", () => {
    const plan = buildProductionStockPlan({
      finishedProduct: { id: "bag", stock_quantity: 0 },
      productionQuantity: 2,
      bomItems: [
        {
          product_id: "bag",
          material_id: "labor",
          quantity: 1,
          material: { id: "labor", name: "Labor", is_service: true, stock_quantity: 0 },
        },
        {
          product_id: "bag",
          material_id: "zipper",
          quantity: 1,
          is_active: false,
          material: { id: "zipper", name: "Zipper", stock_quantity: 0 },
        },
      ],
    });

    expect(plan.canComplete).toBe(true);
    expect(plan.materialMoves).toHaveLength(0);
    expect(plan.finishedGoodMove.quantity).toBe(2);
  });

  it("rounds floating point residue without losing stock precision", () => {
    expect(roundStockQuantity(0.1 + 0.2)).toBe(0.3);
    expect(hasSufficientStock(1, 1.00001)).toBe(true);
    expect(hasSufficientStock(1, 1.001)).toBe(false);
  });
});

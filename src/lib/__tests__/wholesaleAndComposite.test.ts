import { describe, it, expect } from "vitest";
import { calculateCompositeVariantStock, applyWholesalePricing } from "../wholesaleControl";

describe("Pancake POS Features Unit Tests", () => {
  describe("Composite Variant Stock Calculations", () => {
    it("should calculate composite variant stock correctly based on children stock levels", () => {
      const parentVariant = {
        id: "var-parent-1",
        product_id: "prod-parent-1",
        name: "Set Combo A",
        selling_price: 150000,
        stock_quantity: 0,
      };

      const allVariants = [
        { id: "var-child-1", product_id: "prod-child-1", name: "Ao Thun Do", stock_quantity: 10, selling_price: 50000 },
        { id: "var-child-2", product_id: "prod-child-2", name: "Ao Thun Xanh", stock_quantity: 15, selling_price: 50000 },
      ];

      const allComponents = [
        { parent_variant_id: "var-parent-1", child_variant_id: "var-child-1", quantity: 2 },
        { parent_variant_id: "var-parent-1", child_variant_id: "var-child-2", quantity: 3 },
      ];

      let stock = calculateCompositeVariantStock(parentVariant, allComponents, allVariants);
      expect(stock).toBe(5);

      allVariants[0].stock_quantity = 8;
      stock = calculateCompositeVariantStock(parentVariant, allComponents, allVariants);
      expect(stock).toBe(4);
    });

    it("should return variant stock directly if variant has no components", () => {
      const standardVariant = {
        id: "var-std-1",
        product_id: "prod-std-1",
        name: "Ao Thun Trang M",
        selling_price: 60000,
        stock_quantity: 12,
      };

      const stock = calculateCompositeVariantStock(standardVariant, [], []);
      expect(stock).toBe(12);
    });
  });

  describe("Wholesale Pricing Calculations", () => {
    const mockProducts = [
      { id: "prod-1", name: "Ao Thun Tron", selling_price: 100000 },
      { id: "prod-2", name: "Quan Short", selling_price: 120000 },
    ];

    const mockSettings = {
      apply_by_order_qty_enabled: false,
      apply_by_order_qty_threshold: 5,
      apply_by_product_qty_enabled: false,
      apply_by_product_qty_threshold: 5,
      apply_by_variant_qty_enabled: false,
      apply_by_order_tags_enabled: false,
      apply_by_order_tags: [] as string[],
      apply_by_customer_tags_enabled: false,
      apply_by_customer_tags: [] as string[],
      no_other_discounts: true,
    };

    it("should apply wholesale price by variant quantity", () => {
      const settings = { ...mockSettings, apply_by_variant_qty_enabled: true };
      const wholesalePrices = [
        { id: "wp-1", product_id: "prod-1", variant_id: "var-1", min_quantity: 5, wholesale_price: 80000 },
      ];

      const cart = [
        {
          product: mockProducts[0],
          variant: { id: "var-1", name: "M" },
          quantity: 6,
          unit_price: 100000,
          discount: 0,
        },
      ];

      const { updatedCart, hasWholesaleApplied } = applyWholesalePricing(
        cart,
        null,
        [],
        settings,
        wholesalePrices
      );

      expect(hasWholesaleApplied).toBe(true);
      expect(updatedCart[0].unit_price).toBe(80000);
      expect(updatedCart[0].is_wholesale).toBe(true);
    });

    it("should apply wholesale price by product quantity (combined variants and fallback to product tiers)", () => {
      const settings = { 
        ...mockSettings, 
        apply_by_product_qty_enabled: true,
        apply_by_product_qty_threshold: 8 
      };

      // Only product level wholesale prices
      const wholesalePrices = [
        { id: "wp-product-1", product_id: "prod-1", variant_id: null, min_quantity: 8, wholesale_price: 75000 },
      ];

      const cart = [
        {
          product: mockProducts[0],
          variant: { id: "var-1", name: "M" },
          quantity: 4,
          unit_price: 100000,
          discount: 0,
        },
        {
          product: mockProducts[0],
          variant: { id: "var-2", name: "L" },
          quantity: 5,
          unit_price: 100000,
          discount: 0,
        },
      ];

      const { updatedCart, hasWholesaleApplied } = applyWholesalePricing(
        cart,
        null,
        [],
        settings,
        wholesalePrices
      );

      expect(hasWholesaleApplied).toBe(true);
      expect(updatedCart[0].unit_price).toBe(75000);
      expect(updatedCart[1].unit_price).toBe(75000);
    });

    it("should apply wholesale price by customer tags", () => {
      const settings = { 
        ...mockSettings, 
        apply_by_customer_tags_enabled: true,
        apply_by_customer_tags: ["VipWholesale"]
      };
      const customerWholesalePrices = [
        { id: "wp-cust-1", product_id: "prod-1", variant_id: null, min_quantity: 1, wholesale_price: 65000 },
      ];

      const customer = { id: "cust-1", name: "Dai Ly A", tags: ["VipWholesale", "OtherTag"] };
      const cart = [
        {
          product: mockProducts[0],
          variant: null,
          quantity: 2,
          unit_price: 100000,
          discount: 0,
        },
      ];

      const { updatedCart, hasWholesaleApplied } = applyWholesalePricing(
        cart,
        customer as any,
        [],
        settings,
        customerWholesalePrices as any
      );

      expect(hasWholesaleApplied).toBe(true);
      expect(updatedCart[0].unit_price).toBe(65000);
    });
  });

  describe("Combo/Set Inventory Deduction and Restoration Logic", () => {
    // Simulated mock databases
    const mockProducts = [
      { id: "p-parent", name: "Combo X", stock_quantity: 10, is_service: false },
      { id: "p-child1", name: "Ao M", stock_quantity: 20, is_service: false },
      { id: "p-child2", name: "Ao L", stock_quantity: 15, is_service: false }
    ];

    const mockVariants = [
      { id: "v-parent", product_id: "p-parent", stock_quantity: 10 },
      { id: "v-child1", product_id: "p-child1", stock_quantity: 20 },
      { id: "v-child2", product_id: "p-child2", stock_quantity: 15 }
    ];

    const mockComponents = [
      { parent_variant_id: "v-parent", child_variant_id: "v-child1", quantity: 2 },
      { parent_variant_id: "v-parent", child_variant_id: "v-child2", quantity: 3 }
    ];

    const simulateDeductStock = (orderItems: any[]) => {
      const products = JSON.parse(JSON.stringify(mockProducts));
      const variants = JSON.parse(JSON.stringify(mockVariants));

      for (const item of orderItems) {
        if (item.variant_id) {
          const comps = mockComponents.filter(c => c.parent_variant_id === item.variant_id);
          if (comps.length > 0) {
            for (const c of comps) {
              const qtyToDeduct = item.quantity * c.quantity;
              const vIdx = variants.findIndex((v: any) => v.id === c.child_variant_id);
              if (vIdx !== -1) {
                variants[vIdx].stock_quantity -= qtyToDeduct;
                const pIdx = products.findIndex((p: any) => p.id === variants[vIdx].product_id);
                if (pIdx !== -1) {
                  products[pIdx].stock_quantity -= qtyToDeduct;
                }
              }
            }
          } else {
            const vIdx = variants.findIndex((v: any) => v.id === item.variant_id);
            if (vIdx !== -1) {
              variants[vIdx].stock_quantity -= item.quantity;
              const pIdx = products.findIndex((p: any) => p.id === item.product_id);
              if (pIdx !== -1) {
                products[pIdx].stock_quantity -= item.quantity;
              }
            }
          }
        }
      }
      return { products, variants };
    };

    const simulateRestoreStock = (orderItems: any[]) => {
      const products = JSON.parse(JSON.stringify(mockProducts));
      const variants = JSON.parse(JSON.stringify(mockVariants));

      for (const item of orderItems) {
        if (item.variant_id) {
          const comps = mockComponents.filter(c => c.parent_variant_id === item.variant_id);
          if (comps.length > 0) {
            for (const c of comps) {
              const qtyToAdd = item.quantity * c.quantity;
              const vIdx = variants.findIndex((v: any) => v.id === c.child_variant_id);
              if (vIdx !== -1) {
                variants[vIdx].stock_quantity += qtyToAdd;
                const pIdx = products.findIndex((p: any) => p.id === variants[vIdx].product_id);
                if (pIdx !== -1) {
                  products[pIdx].stock_quantity += qtyToAdd;
                }
              }
            }
          } else {
            const vIdx = variants.findIndex((v: any) => v.id === item.variant_id);
            if (vIdx !== -1) {
              variants[vIdx].stock_quantity += item.quantity;
              const pIdx = products.findIndex((p: any) => p.id === item.product_id);
              if (pIdx !== -1) {
                products[pIdx].stock_quantity += item.quantity;
              }
            }
          }
        }
      }
      return { products, variants };
    };

    it("should deduct stock from child variants when confirming a combo order", () => {
      const orderItems = [{ product_id: "p-parent", variant_id: "v-parent", quantity: 2 }];
      const { products, variants } = simulateDeductStock(orderItems);

      // Child 1: stock_quantity 20 -> should be 20 - (2 * 2) = 16
      const child1 = variants.find((v: any) => v.id === "v-child1");
      expect(child1?.stock_quantity).toBe(16);

      // Child 2: stock_quantity 15 -> should be 15 - (2 * 3) = 9
      const child2 = variants.find((v: any) => v.id === "v-child2");
      expect(child2?.stock_quantity).toBe(9);
    });

    it("should restore stock to child variants when cancelling a combo order", () => {
      const orderItems = [{ product_id: "p-parent", variant_id: "v-parent", quantity: 2 }];
      const { products, variants } = simulateRestoreStock(orderItems);

      // Child 1: stock_quantity 20 -> should be 20 + (2 * 2) = 24
      const child1 = variants.find((v: any) => v.id === "v-child1");
      expect(child1?.stock_quantity).toBe(24);

      // Child 2: stock_quantity 15 -> should be 15 + (2 * 3) = 21
      const child2 = variants.find((v: any) => v.id === "v-child2");
      expect(child2?.stock_quantity).toBe(21);
    });
  });
});

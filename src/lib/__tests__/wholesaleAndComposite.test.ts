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
});

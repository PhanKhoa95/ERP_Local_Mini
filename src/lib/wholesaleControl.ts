export interface WholesaleSettings {
  apply_by_order_qty_enabled: boolean;
  apply_by_order_qty_threshold: number;
  apply_by_product_qty_enabled: boolean;
  apply_by_product_qty_threshold: number;
  apply_by_variant_qty_enabled: boolean;
  apply_by_order_tags_enabled: boolean;
  apply_by_order_tags: string[];
  apply_by_customer_tags_enabled: boolean;
  apply_by_customer_tags: string[];
  no_other_discounts: boolean;
}

export interface ProductWholesalePrice {
  product_id: string;
  variant_id: string | null;
  min_quantity: number;
  wholesale_price: number;
}

export interface CartItem {
  product: any;
  variant?: any | null;
  quantity: number;
  unit_price: number;
  discount: number;
  is_wholesale?: boolean;
}

// Function to calculate dynamic stock of composite variants
export function calculateCompositeVariantStock(
  variant: any,
  allComponents: any[],
  allVariants: any[]
): number {
  const components = allComponents.filter(c => c.parent_variant_id === variant.id);
  if (components.length === 0) {
    return variant.stock_quantity;
  }

  let minStock = Infinity;
  for (const comp of components) {
    const child = allVariants.find(v => v.id === comp.child_variant_id);
    if (!child) continue;
    const possibleStock = Math.floor(child.stock_quantity / comp.quantity);
    if (possibleStock < minStock) {
      minStock = possibleStock;
    }
  }

  return minStock === Infinity ? 0 : minStock;
}

// Function to apply wholesale pricing rules on the cart items
export function applyWholesalePricing(
  cart: CartItem[],
  customer: any | null,
  orderTags: string[],
  settings: WholesaleSettings,
  allWholesalePrices: ProductWholesalePrice[]
): { updatedCart: CartItem[]; hasWholesaleApplied: boolean } {
  let hasWholesaleApplied = false;

  // 1. Calculate overall sums
  const totalOrderQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Group quantity by product_id
  const qtyByProduct: Record<string, number> = {};
  cart.forEach(item => {
    qtyByProduct[item.product.id] = (qtyByProduct[item.product.id] || 0) + item.quantity;
  });

  // Check tags conditions
  const hasMatchingOrderTags = settings.apply_by_order_tags_enabled && 
    orderTags.some(tag => (settings.apply_by_order_tags || []).map(t => t.toLowerCase().trim()).includes(tag.toLowerCase().trim()));

  const hasMatchingCustomerTags = settings.apply_by_customer_tags_enabled && customer &&
    (customer.tags || []).some((tag: string) => (settings.apply_by_customer_tags || []).map(t => t.toLowerCase().trim()).includes(tag.toLowerCase().trim()));

  const isWholesaleTriggeredByTags = hasMatchingOrderTags || hasMatchingCustomerTags;

  const updatedCart = cart.map(item => {
    // Reset unit_price to original price
    const originalPrice = item.variant ? Number(item.variant.selling_price) : Number(item.product.selling_price);
    let finalPrice = originalPrice;
    let isWholesale = false;

    // Find wholesale tiers for this product/variant (fallback to product tiers if variant tiers not defined)
    const variantTiers = item.variant
      ? allWholesalePrices.filter(p => p.product_id === item.product.id && p.variant_id === item.variant.id)
      : [];
    const productTiers = allWholesalePrices.filter(p => p.product_id === item.product.id && p.variant_id === null);
    const tiers = (variantTiers.length > 0 ? variantTiers : productTiers)
      .sort((a, b) => b.min_quantity - a.min_quantity); // Sort descending to find highest matched tier first

    if (tiers.length > 0) {
      // Check which conditions apply
      let shouldApplyWholesale = false;
      let qtyForTierComparison = item.quantity;

      // Rule 4 & 5: Tags (Immediate Wholesale)
      if (isWholesaleTriggeredByTags) {
        shouldApplyWholesale = true;
        // In immediate tags mode, we can compare using the current quantity, or default to the lowest tier (tier index = length-1)
        // Let's use current quantity first to find the best tier, if not matched, fallback to the lowest threshold tier
        qtyForTierComparison = Math.max(item.quantity, Math.min(...tiers.map(t => t.min_quantity)));
      }
      
      // Rule 1: Overall Order Qty
      if (settings.apply_by_order_qty_enabled && totalOrderQty >= settings.apply_by_order_qty_threshold) {
        shouldApplyWholesale = true;
        qtyForTierComparison = Math.max(qtyForTierComparison, totalOrderQty);
      }

      // Rule 2: Multi-variant sum of same product
      const productSumQty = qtyByProduct[item.product.id] || 0;
      if (settings.apply_by_product_qty_enabled && productSumQty >= settings.apply_by_product_qty_threshold) {
        shouldApplyWholesale = true;
        qtyForTierComparison = Math.max(qtyForTierComparison, productSumQty);
      }

      // Rule 3: Single variant quantity
      if (settings.apply_by_variant_qty_enabled && item.quantity >= Math.min(...tiers.map(t => t.min_quantity))) {
        shouldApplyWholesale = true;
        qtyForTierComparison = Math.max(qtyForTierComparison, item.quantity);
      }

      if (shouldApplyWholesale) {
        // Find the best tier matching qtyForTierComparison
        const matchedTier = tiers.find(t => qtyForTierComparison >= t.min_quantity);
        if (matchedTier) {
          finalPrice = Number(matchedTier.wholesale_price);
          isWholesale = true;
          hasWholesaleApplied = true;
        }
      }
    }

    return {
      ...item,
      unit_price: finalPrice,
      is_wholesale: isWholesale
    };
  });

  return { updatedCart, hasWholesaleApplied };
}

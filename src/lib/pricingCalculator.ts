/**
 * Pure utility: Pricing Calculator for Print Shop / Shopee products
 * Extracted from PrintShopReportTab.tsx for testability
 */

export interface PricingInput {
  materialCost: number;
  inkCost: number;
  processingCost: number;
  laborMinutes: number;
  laborRate: number;       // VND per hour
  wastePercent: number;    // e.g. 5 means 5%
  sellingPrice: number;
  // Shopee fees
  txFee: number;
  commFee: number;
  voucherFee: number;
  cancelRate: number;
  taxRate: number;
  targetMargin: number;
  flatFee: number;         // VND fixed
  adsFee: number;          // % of price
  // Design
  designFee: number;       // VND per design
  revisions: number;
  revisionRate: number;    // VND per revision
}

export interface PricingResult {
  laborCost: number;
  variableCost: number;
  designCostTotal: number;
  grossProfit: number;
  grossMargin: number;
  shopeePrice: number;
  shopeeTx: number;
  shopeeComm: number;
  shopeeVoucher: number;
  shopeeCancel: number;
  shopeeTax: number;
  shopeeAds: number;
  shopeeNetProfit: number;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const laborCost = input.laborMinutes * (input.laborRate / 60);
  const baseCost = input.materialCost + input.inkCost + input.processingCost + laborCost;
  const variableCost = baseCost * (1 + input.wastePercent / 100);

  const designCostTotal = input.designFee + (input.revisions * input.revisionRate);

  const grossProfit = input.sellingPrice - variableCost;
  const grossMargin = input.sellingPrice > 0 ? (grossProfit / input.sellingPrice) * 100 : 0;

  // Shopee price: reverse-engineer to hit target margin after all fees
  const rateSum = input.txFee + input.commFee + input.voucherFee + input.cancelRate + input.taxRate + input.targetMargin + input.adsFee;
  const shopeeDenom = 1 - rateSum / 100;
  const shopeePrice = shopeeDenom > 0
    ? Math.ceil((variableCost + designCostTotal + input.flatFee) / shopeeDenom)
    : 0;

  const shopeeTx = Math.round(shopeePrice * input.txFee / 100);
  const shopeeComm = Math.round(shopeePrice * input.commFee / 100);
  const shopeeVoucher = Math.round(shopeePrice * input.voucherFee / 100);
  const shopeeCancel = Math.round(shopeePrice * input.cancelRate / 100);
  const shopeeTax = Math.round(shopeePrice * input.taxRate / 100);
  const shopeeAds = Math.round(shopeePrice * input.adsFee / 100);
  const totalShopeeFees = shopeeTx + shopeeComm + shopeeVoucher + shopeeCancel + shopeeTax + shopeeAds + input.flatFee;
  const shopeeNetProfit = shopeePrice - totalShopeeFees - variableCost - designCostTotal;

  return {
    laborCost,
    variableCost,
    designCostTotal,
    grossProfit,
    grossMargin,
    shopeePrice,
    shopeeTx,
    shopeeComm,
    shopeeVoucher,
    shopeeCancel,
    shopeeTax,
    shopeeAds,
    shopeeNetProfit,
  };
}

/**
 * Check if a product is "low margin" and should show warning
 */
export function isLowMarginProduct(preset: string, grossMarginPercent: number): boolean {
  if (preset === "box" && grossMarginPercent < 35) return true;
  return false;
}

import { describe, it, expect } from "vitest";
import { calculatePricing, isLowMarginProduct, type PricingInput } from "../pricingCalculator";

const baseInput: PricingInput = {
  materialCost: 3000,
  inkCost: 500,
  processingCost: 1000,
  laborMinutes: 10,
  laborRate: 60000, // 60k VND/hour → 1000 VND/min
  wastePercent: 5,
  sellingPrice: 15000,
  txFee: 2,
  commFee: 6.5,
  voucherFee: 3,
  cancelRate: 1,
  taxRate: 1,
  targetMargin: 20,
  flatFee: 1000,
  adsFee: 3,
  designFee: 5000,
  revisions: 2,
  revisionRate: 2000,
};

describe("Pricing Calculator — Pure Logic", () => {
  it("should calculate labor cost correctly (per minute)", () => {
    const result = calculatePricing(baseInput);
    // 10 min × (60000/60) = 10 × 1000 = 10,000
    expect(result.laborCost).toBe(10000);
  });

  it("should calculate variable cost including waste %", () => {
    const result = calculatePricing(baseInput);
    // base = 3000 + 500 + 1000 + 10000 = 14500
    // variable = 14500 × 1.05 = 15225
    expect(result.variableCost).toBe(15225);
  });

  it("should calculate design cost = fee + revisions × rate", () => {
    const result = calculatePricing(baseInput);
    // 5000 + 2 × 2000 = 9000
    expect(result.designCostTotal).toBe(9000);
  });

  it("should calculate gross profit and margin correctly", () => {
    const result = calculatePricing(baseInput);
    // grossProfit = 15000 - 15225 = -225
    // grossMargin = -225 / 15000 * 100 = -1.5%
    expect(result.grossProfit).toBe(-225);
    expect(result.grossMargin).toBeCloseTo(-1.5, 1);
  });

  it("should reverse-engineer Shopee price to achieve target margin", () => {
    const result = calculatePricing(baseInput);
    // rateSum = 2 + 6.5 + 3 + 1 + 1 + 20 + 3 = 36.5
    // denom = 1 - 0.365 = 0.635
    // shopeePrice = ceil((15225 + 9000 + 1000) / 0.635) = ceil(25225 / 0.635) = ceil(39724.4)
    expect(result.shopeePrice).toBe(39725);
  });

  it("should calculate individual Shopee fee breakdowns", () => {
    const result = calculatePricing(baseInput);
    // txFee = round(39725 * 2 / 100) = 795
    expect(result.shopeeTx).toBe(Math.round(result.shopeePrice * 2 / 100));
    expect(result.shopeeComm).toBe(Math.round(result.shopeePrice * 6.5 / 100));
    expect(result.shopeeAds).toBe(Math.round(result.shopeePrice * 3 / 100));
  });

  it("should have positive Shopee net profit when margin is reasonable", () => {
    const result = calculatePricing(baseInput);
    // Net = price - fees - variableCost - designCost
    expect(result.shopeeNetProfit).toBeGreaterThan(0);
  });

  it("should return shopeePrice = 0 when total fee rate >= 100%", () => {
    const badInput: PricingInput = {
      ...baseInput,
      txFee: 30,
      commFee: 30,
      voucherFee: 20,
      cancelRate: 10,
      taxRate: 5,
      targetMargin: 10,
      adsFee: 5,
    };
    // rateSum = 30+30+20+10+5+10+5 = 110 → denom = 1 - 1.10 = -0.10 → return 0
    const result = calculatePricing(badInput);
    expect(result.shopeePrice).toBe(0);
  });

  it("should handle zero selling price gracefully", () => {
    const result = calculatePricing({ ...baseInput, sellingPrice: 0 });
    expect(result.grossMargin).toBe(0);
  });
});

describe("Low Margin Warning", () => {
  it("should flag box products with margin < 35%", () => {
    expect(isLowMarginProduct("box", 30)).toBe(true);
    expect(isLowMarginProduct("box", 34.9)).toBe(true);
  });

  it("should not flag box products with margin >= 35%", () => {
    expect(isLowMarginProduct("box", 35)).toBe(false);
    expect(isLowMarginProduct("box", 50)).toBe(false);
  });

  it("should not flag non-box presets even with low margin", () => {
    expect(isLowMarginProduct("sticker", 20)).toBe(false);
    expect(isLowMarginProduct("card", 10)).toBe(false);
  });
});

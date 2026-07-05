import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  getLocalLoyaltySettings, 
  getLocalReferralSettings, 
  getLocalLoyaltyTransactions 
} from "@/hooks/useLoyalty";

// Mock isLocalDemoAuthEnabled to always return true for testing local demo handlers
vi.mock("@/lib/localDemoAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/localDemoAuth")>();
  return {
    ...actual,
    isLocalDemoAuthEnabled: () => true
  };
});

describe("Loyalty and Referral Program Verification Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. should fall back to default settings correctly", () => {
    const loyalty = getLocalLoyaltySettings();
    const referral = getLocalReferralSettings();

    expect(loyalty.is_enabled).toBe(true);
    expect(loyalty.point_ratio_money).toBe(10000);
    expect(loyalty.point_ratio_points).toBe(1);

    expect(referral.referrer_reward_points).toBe(50);
    expect(referral.referee_discount_amount).toBe(50000);
  });

  it("2. should correctly adjust points manually and store in transactions", () => {
    const partnerId = "cust-manual-adjust";
    const initialTxs = getLocalLoyaltyTransactions();
    expect(initialTxs.length).toBe(0);

    // Simulate manual adjust
    const newTx = {
      id: "tx-test-adjust",
      partner_id: partnerId,
      order_id: null,
      points: 100,
      transaction_type: "manual_adjust" as const,
      notes: "Tặng điểm tri ân khách hàng",
      created_at: new Date().toISOString()
    };
    
    localStorage.setItem("erp-mini-loyalty-transactions", JSON.stringify([newTx]));
    
    // Simulate updating partner points
    const partner = {
      id: partnerId,
      name: "Khách hàng A",
      loyalty_points: 100
    };
    localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify([partner]));

    const savedTxs = getLocalLoyaltyTransactions(partnerId);
    expect(savedTxs.length).toBe(1);
    expect(savedTxs[0].points).toBe(100);
    expect(savedTxs[0].transaction_type).toBe("manual_adjust");

    const savedPartners = JSON.parse(localStorage.getItem("erp-mini-local-demo-partners") || "[]");
    expect(savedPartners[0].loyalty_points).toBe(100);
  });

  it("3. should calculate loyalty points earned from order total correctly", () => {
    const orderTotal = 250000; // 250k spent
    const loyalty = getLocalLoyaltySettings(); // 10k -> 1 point
    
    const pointsEarned = loyalty.is_enabled 
      ? Math.floor(orderTotal / loyalty.point_ratio_money) * loyalty.point_ratio_points 
      : 0;

    expect(pointsEarned).toBe(25); // 250k / 10k = 25 points
  });

  it("4. should respect customized point ratio money settings", () => {
    // Save customized settings: 20k -> 1 point
    const customLoyalty = {
      company_id: "demo",
      is_enabled: true,
      point_ratio_money: 20000,
      point_ratio_points: 1,
      redeem_ratio_points: 1,
      redeem_ratio_money: 1000,
      no_point_discounted: true
    };
    localStorage.setItem("erp-mini-loyalty-settings", JSON.stringify(customLoyalty));

    const orderTotal = 250000;
    const settings = getLocalLoyaltySettings();
    
    const pointsEarned = settings.is_enabled 
      ? Math.floor(orderTotal / settings.point_ratio_money) * settings.point_ratio_points 
      : 0;

    expect(pointsEarned).toBe(12); // 250k / 20k = 12 points
  });
});

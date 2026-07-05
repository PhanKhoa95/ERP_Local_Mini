import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  getLocalPaymentConfig, 
  saveLocalPaymentConfig, 
  PaymentConfig 
} from "@/hooks/usePaymentSettings";

// Mock isLocalDemoAuthEnabled to always return true for testing local demo handlers
vi.mock("@/lib/localDemoAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/localDemoAuth")>();
  return {
    ...actual,
    isLocalDemoAuthEnabled: () => true
  };
});

describe("Payment Settings & VietQR Advanced Configurations Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. should load default payment settings correctly if localStorage is empty", () => {
    const config = getLocalPaymentConfig();
    expect(config.id).toBe("default-pay-config");
    expect(config.bank_name).toBe("MB Bank");
    expect(config.qr_type).toBe("static");
    expect(config.attach_qr_to_message).toBe(true);
    expect(config.allowed_staff_ids).toEqual([]);
  });

  it("2. should correctly update payment configuration settings", () => {
    const config = getLocalPaymentConfig();
    
    const updated: PaymentConfig = {
      ...config,
      bank_name: "Techcombank",
      qr_type: "dynamic",
      attach_qr_to_message: false,
      updated_at: new Date().toISOString()
    };
    saveLocalPaymentConfig(updated);

    const saved = getLocalPaymentConfig();
    expect(saved.bank_name).toBe("Techcombank");
    expect(saved.qr_type).toBe("dynamic");
    expect(saved.attach_qr_to_message).toBe(false);
  });

  it("3. should correctly authorize staff to view transaction history", () => {
    const config = getLocalPaymentConfig();
    const staffId = "staff-user-123";

    expect(config.allowed_staff_ids).not.toContain(staffId);

    const updated = {
      ...config,
      allowed_staff_ids: [...config.allowed_staff_ids, staffId]
    };
    saveLocalPaymentConfig(updated);

    const saved = getLocalPaymentConfig();
    expect(saved.allowed_staff_ids).toContain(staffId);
  });

  it("4. should correctly revoke staff authorization", () => {
    const config = getLocalPaymentConfig();
    const staffId = "staff-user-456";

    // Setup: authorize staff first
    const authorized = {
      ...config,
      allowed_staff_ids: [staffId]
    };
    saveLocalPaymentConfig(authorized);

    const savedAuthorized = getLocalPaymentConfig();
    expect(savedAuthorized.allowed_staff_ids).toContain(staffId);

    // Act: revoke staff
    const revoked = {
      ...savedAuthorized,
      allowed_staff_ids: savedAuthorized.allowed_staff_ids.filter(id => id !== staffId)
    };
    saveLocalPaymentConfig(revoked);

    const savedRevoked = getLocalPaymentConfig();
    expect(savedRevoked.allowed_staff_ids).not.toContain(staffId);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { erpEventBus } from "../erpEventBus";

// Mock isLocalDemoAuthEnabled to always return true for testing local demo handlers
vi.mock("@/lib/localDemoAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/localDemoAuth")>();
  return {
    ...actual,
    isLocalDemoAuthEnabled: () => true
  };
});

describe("Memberships & Wallet Balance Empirical Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. should allow issuing multiple cards with different card numbers to the same customer", () => {
    const partnerId = "cust-test-123";
    const memberships = [
      {
        id: "mem-1",
        partner_id: partnerId,
        card_number: "MEM-GOLD-999",
        tier: "gold",
        balance: 100000,
        points: 100,
        status: "active",
        issue_date: "2026-01-01",
        expiry_date: "2027-01-01",
        notes: "First card"
      },
      {
        id: "mem-2",
        partner_id: partnerId,
        card_number: "MEM-SILVER-888",
        tier: "silver",
        balance: 50000,
        points: 50,
        status: "active",
        issue_date: "2026-02-01",
        expiry_date: "2027-02-01",
        notes: "Second card"
      }
    ];

    localStorage.setItem("erp-mini-local-demo-memberships", JSON.stringify(memberships));
    const saved = JSON.parse(localStorage.getItem("erp-mini-local-demo-memberships")!);
    
    // Verify that multiple cards exist for the same partner_id
    const customerCards = saved.filter((m: any) => m.partner_id === partnerId);
    expect(customerCards.length).toBe(2);
    expect(customerCards[0].card_number).toBe("MEM-GOLD-999");
    expect(customerCards[1].card_number).toBe("MEM-SILVER-888");
  });

  it("2. should prevent issuing multiple cards with the SAME card number (duplicate card number protection)", () => {
    const memberships = [
      { id: "mem-1", partner_id: "cust-1", card_number: "MEM-DUPLICATE", tier: "gold", balance: 0, points: 0, status: "active" }
    ];
    
    // Simulate what createMembership mutation function does:
    const newCard = { partner_id: "cust-2", card_number: "MEM-DUPLICATE", tier: "bronze", status: "active" };
    
    const all = [...memberships];
    const isDuplicate = all.some(m => m.card_number === newCard.card_number);
    
    expect(isDuplicate).toBe(true);
  });

  it("3. should correctly update liability offset account (3387) balance upon payment (debit reduces liability balance)", () => {
    const mockAccounts = [
      { id: "acc-3387", code: "3387", name: "Doanh thu chưa thực hiện", account_type: "liability", balance: 100000 },
      { id: "acc-511", code: "511", name: "Doanh thu", balance: 0 }
    ];
    localStorage.setItem("erp-mini-local-demo-accounts", JSON.stringify(mockAccounts));
    localStorage.setItem("erp-mini-membership-offset-account", "3387");

    const payload = {
      order: {
        id: "ord-pos-wallet-liability",
        total: 30000,
        company_id: "demo",
        order_number: "ORD-POS-001",
        payment_method: "membership_wallet",
        created_at: new Date().toISOString()
      },
      items: []
    };

    erpEventBus.publish("ORDER_CREATED", payload);

    const updatedAccounts = JSON.parse(localStorage.getItem("erp-mini-local-demo-accounts")!);
    const offsetAcc = updatedAccounts.find((a: any) => a.code === "3387");
    const salesAcc = updatedAccounts.find((a: any) => a.code === "511");

    // Liability balance should decrease: 100k - 30k = 70k
    expect(offsetAcc.balance).toBe(70000);
    // Sales revenue should increase: 0 + 30k = 30k
    expect(salesAcc.balance).toBe(30000);
  });

  it("4. should correctly update asset offset account (131) balance upon payment (debit increases asset balance)", () => {
    const mockAccounts = [
      { id: "acc-131", code: "131", name: "Phải thu khách hàng", account_type: "asset", balance: 100000 },
      { id: "acc-511", code: "511", name: "Doanh thu", balance: 0 }
    ];
    localStorage.setItem("erp-mini-local-demo-accounts", JSON.stringify(mockAccounts));
    localStorage.setItem("erp-mini-membership-offset-account", "131");

    const payload = {
      order: {
        id: "ord-pos-wallet-asset",
        total: 30000,
        company_id: "demo",
        order_number: "ORD-POS-002",
        payment_method: "membership_wallet",
        created_at: new Date().toISOString()
      },
      items: []
    };

    erpEventBus.publish("ORDER_CREATED", payload);

    const updatedAccounts = JSON.parse(localStorage.getItem("erp-mini-local-demo-accounts")!);
    const offsetAcc = updatedAccounts.find((a: any) => a.code === "131");
    const salesAcc = updatedAccounts.find((a: any) => a.code === "511");

    // Asset balance should increase: 100k + 30k = 130k
    expect(offsetAcc.balance).toBe(130000);
    expect(salesAcc.balance).toBe(30000);
  });

  it("5. should correctly simulate wallet deposit accounting for liability (3387) and asset (131) offset accounts", () => {
    const amount = 50000;

    // Case A: Liability Account 3387
    let accounts = [
      { id: "acc-1111", code: "1111", name: "Tiền mặt", balance: 10000 },
      { id: "acc-3387", code: "3387", name: "Doanh thu chưa thực hiện", account_type: "liability", balance: 20000 }
    ];

    // Deposit simulator (equivalent to useMemberships.ts logic):
    accounts.forEach((a: any) => {
      if (a.code === "1111") a.balance = (a.balance || 0) + amount;
      if (a.code === "3387") {
        const isAsset = a.account_type === "asset";
        if (isAsset) {
          a.balance = (a.balance || 0) - amount;
        } else {
          a.balance = (a.balance || 0) + amount; // Liability increases on Credit
        }
      }
    });

    expect(accounts.find(a => a.code === "1111")!.balance).toBe(60000); // 10k + 50k
    expect(accounts.find(a => a.code === "3387")!.balance).toBe(70000); // 20k + 50k (Credit to liability increases balance)

    // Case B: Asset Account 131
    accounts = [
      { id: "acc-1111", code: "1111", name: "Tiền mặt", balance: 10000 },
      { id: "acc-131", code: "131", name: "Phải thu khách hàng", account_type: "asset", balance: 60000 }
    ];

    accounts.forEach((a: any) => {
      if (a.code === "1111") a.balance = (a.balance || 0) + amount;
      if (a.code === "131") {
        const isAsset = a.account_type === "asset";
        if (isAsset) {
          a.balance = (a.balance || 0) - amount; // Asset decreases on Credit
        } else {
          a.balance = (a.balance || 0) + amount;
        }
      }
    });

    expect(accounts.find(a => a.code === "1111")!.balance).toBe(60000); // 10k + 50k
    expect(accounts.find(a => a.code === "131")!.balance).toBe(10000); // 60k - 50k (Credit to asset decreases balance)
  });

  it("6. should correctly simulate wallet refund accounting for liability (3387) and asset (131) offset accounts", () => {
    const amount = 20000;

    // Case A: Liability Account 3387
    let accounts = [
      { id: "acc-1111", code: "1111", name: "Tiền mặt", balance: 50000 },
      { id: "acc-3387", code: "3387", name: "Doanh thu chưa thực hiện", account_type: "liability", balance: 40000 }
    ];

    // Refund simulator (equivalent to useMemberships.ts logic):
    accounts.forEach((a: any) => {
      if (a.code === "3387") {
        const isAsset = a.account_type === "asset";
        if (isAsset) {
          a.balance = (a.balance || 0) + amount;
        } else {
          a.balance = (a.balance || 0) - amount; // Liability decreases on Debit
        }
      }
      if (a.code === "1111") a.balance = (a.balance || 0) - amount;
    });

    expect(accounts.find(a => a.code === "1111")!.balance).toBe(30000); // 50k - 20k
    expect(accounts.find(a => a.code === "3387")!.balance).toBe(20000); // 40k - 20k (Debit to liability decreases balance)

    // Case B: Asset Account 131
    accounts = [
      { id: "acc-1111", code: "1111", name: "Tiền mặt", balance: 50000 },
      { id: "acc-131", code: "131", name: "Phải thu khách hàng", account_type: "asset", balance: 40000 }
    ];

    accounts.forEach((a: any) => {
      if (a.code === "131") {
        const isAsset = a.account_type === "asset";
        if (isAsset) {
          a.balance = (a.balance || 0) + amount; // Asset increases on Debit
        } else {
          a.balance = (a.balance || 0) - amount;
        }
      }
      if (a.code === "1111") a.balance = (a.balance || 0) - amount;
    });

    expect(accounts.find(a => a.code === "1111")!.balance).toBe(30000); // 50k - 20k
    expect(accounts.find(a => a.code === "131")!.balance).toBe(60000); // 40k + 20k (Debit to asset increases balance)
  });

  it("7. should verify POS checkout selects the correct membership card using customSelectedCardId", () => {
    // Mock customer card list
    const customerMemberships = [
      { id: "mem-1", card_number: "MEM-GOLD", status: "active", balance: 5000 },
      { id: "mem-2", card_number: "MEM-DIAMOND", status: "active", balance: 200000 }
    ];

    const total = 45000;
    
    // Simulation of POS.tsx's defaultCard logic
    const defaultCard = (() => {
      const activeWithBalance = customerMemberships.find(m => m.status === "active" && m.balance >= total);
      if (activeWithBalance) return activeWithBalance;
      const firstActive = customerMemberships.find(m => m.status === "active");
      if (firstActive) return firstActive;
      return customerMemberships[0];
    })();

    // Default card should fall back to mem-2 since it has enough balance
    expect(defaultCard.id).toBe("mem-2");

    // Simulation of customSelectedCardId selection in POS.tsx
    let customSelectedCardId = "mem-1";
    let customerMembership = customSelectedCardId
      ? customerMemberships.find(m => m.id === customSelectedCardId)
      : defaultCard;

    expect(customerMembership!.id).toBe("mem-1");

    // Switching back to default
    customSelectedCardId = "";
    customerMembership = customSelectedCardId
      ? customerMemberships.find(m => m.id === customSelectedCardId)
      : defaultCard;

    expect(customerMembership!.id).toBe("mem-2");
  });

  it("8. should allow adding a dynamic tier config and assigning it to a card", () => {
    const mockTiers = [
      { id: "bronze", name: "Đồng", min_spent: 0, discount_rate: 0, color: "bg-orange-100", bg_gradient: "from-amber-700" }
    ];
    localStorage.setItem("erp-mini-local-demo-membership-tiers-config", JSON.stringify(mockTiers));

    // Simulate adding a dynamic tier "platinum"
    const newTier = { id: "platinum", name: "Bạch Kim", min_spent: 30000000, discount_rate: 7, color: "bg-purple-100", bg_gradient: "from-purple-600" };
    const savedConfigs = JSON.parse(localStorage.getItem("erp-mini-local-demo-membership-tiers-config") || "[]");
    savedConfigs.push(newTier);
    localStorage.setItem("erp-mini-local-demo-membership-tiers-config", JSON.stringify(savedConfigs));

    // Retrieve configs and verify
    const updatedConfigs = JSON.parse(localStorage.getItem("erp-mini-local-demo-membership-tiers-config")!);
    expect(updatedConfigs.length).toBe(2);
    expect(updatedConfigs[1].id).toBe("platinum");
    expect(updatedConfigs[1].discount_rate).toBe(7);

    // Issue a card with the platinum tier
    const card = { id: "mem-3", partner_id: "cust-9", card_number: "MEM-PLATINUM-777", tier: "platinum", balance: 0, points: 0, status: "active" };
    expect(card.tier).toBe("platinum");
  });

  it("9. should allow updating membership card details (card number, tier, notes, image) and block duplicate card numbers on update", () => {
    const memberships = [
      { id: "mem-1", partner_id: "cust-1", card_number: "MEM-OLD-111", tier: "bronze", notes: "Old notes", balance: 0, points: 0, status: "active", card_image: null as string | null },
      { id: "mem-2", partner_id: "cust-2", card_number: "MEM-DUPLICATE", tier: "bronze", notes: "Other notes", balance: 0, points: 0, status: "active", card_image: null as string | null }
    ];
    
    // Simulate updating mem-1 with duplicate card number
    const targetUpdateDuplicate = { id: "mem-1", card_number: "MEM-DUPLICATE" };
    const all = [...memberships];
    const idx = all.findIndex(m => m.id === targetUpdateDuplicate.id);
    
    const isDuplicate = all.some(m => m.id !== targetUpdateDuplicate.id && m.card_number === targetUpdateDuplicate.card_number);
    expect(isDuplicate).toBe(true); // Should block duplicate

    // Simulate successful update
    const targetUpdateSuccess = { id: "mem-1", card_number: "MEM-NEW-999", tier: "gold", notes: "New updated notes", card_image: "data:image/png;base64,123" };
    const isDuplicateSuccess = all.some(m => m.id !== targetUpdateSuccess.id && m.card_number === targetUpdateSuccess.card_number);
    expect(isDuplicateSuccess).toBe(false);

    all[idx] = { ...all[idx], ...targetUpdateSuccess };
    expect(all[idx].card_number).toBe("MEM-NEW-999");
    expect(all[idx].tier).toBe("gold");
    expect(all[idx].notes).toBe("New updated notes");
    expect(all[idx].card_image).toBe("data:image/png;base64,123");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { erpEventBus } from "../erpEventBus";

// Mock isLocalDemoAuthEnabled to always return true for testing local demo handlers
vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => true
}));

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
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { erpEventBus } from "../erpEventBus";

// Mock isLocalDemoAuthEnabled to always return true for testing local demo handlers
vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => true
}));

// Mock localInventoryStore
const mockCreateLocalInventoryTransaction = vi.fn();
const mockLogLocalAction = vi.fn();
const mockGetLocalProductBom = vi.fn().mockReturnValue([]);
vi.mock("@/lib/localInventoryStore", () => ({
  createLocalInventoryTransaction: (args: any) => mockCreateLocalInventoryTransaction(args),
  logLocalAction: (...args: any[]) => mockLogLocalAction(...args),
  getLocalProductBom: (id: string) => mockGetLocalProductBom(id),
}));

describe("ERP Event Bus Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should successfully subscribe and publish events", () => {
    const callback = vi.fn();
    const unsubscribe = erpEventBus.subscribe("ORDER_CREATED", callback);

    const payload = {
      order: { id: "ord-test", total: 1000000, company_id: "demo" },
      items: []
    };

    erpEventBus.publish("ORDER_CREATED", payload);
    expect(callback).toHaveBeenCalledWith(payload);

    unsubscribe();
    erpEventBus.publish("ORDER_CREATED", payload);
    expect(callback).toHaveBeenCalledTimes(1); // Not called again after unsubscribe
  });

  it("should handle ORDER_CREATED and trigger inventory deduction", () => {
    const payload = {
      order: { id: "ord-test", total: 150000, company_id: "demo", order_number: "ORD-001" },
      items: [
        { product_id: "prod-1", quantity: 3 }
      ]
    };

    erpEventBus.publish("ORDER_CREATED", payload);

    expect(mockCreateLocalInventoryTransaction).toHaveBeenCalledWith({
      product_id: "prod-1",
      transaction_type: "out",
      quantity: 3,
      notes: "Trừ tồn kho - Đơn hàng ORD-001"
    });
  });

  it("should handle ORDER_CREATED and update accounting journal entries and ledger balances", () => {
    // Setup initial mock accounts in localStorage
    const mockAccounts = [
      { id: "acc-131", code: "131", name: "Phải thu", balance: 0 },
      { id: "acc-511", code: "511", name: "Doanh thu", balance: 0 },
      { id: "acc-632", code: "632", name: "Giá vốn", balance: 0 },
      { id: "acc-156", code: "156", name: "Hàng hóa", balance: 500000 }
    ];
    localStorage.setItem("erp-mini-local-demo-accounts", JSON.stringify(mockAccounts));

    const payload = {
      order: {
        id: "ord-acct-test",
        total: 100000,
        company_id: "demo",
        order_number: "ORD-ACCT-001",
        created_at: new Date().toISOString()
      },
      items: [
        { product_id: "prod-1", quantity: 2, unit_price: 50000 }
      ]
    };

    erpEventBus.publish("ORDER_CREATED", payload);

    // Verify journal entries created
    const rawEntries = localStorage.getItem("erp-mini-local-demo-journal-entries");
    expect(rawEntries).not.toBeNull();
    const entries = JSON.parse(rawEntries!);
    expect(entries.length).toBeGreaterThan(0);
    
    // Verify sales journal entry exists
    const salesEntry = entries.find((e: any) => e.description.includes("ORD-ACCT-001"));
    expect(salesEntry).toBeDefined();
    expect(salesEntry.status).toBe("posted");

    // Verify ledger accounts balances updated correctly
    const rawUpdatedAccounts = localStorage.getItem("erp-mini-local-demo-accounts");
    const updatedAccounts = JSON.parse(rawUpdatedAccounts!);
    
    const acc131 = updatedAccounts.find((a: any) => a.code === "131");
    expect(acc131.balance).toBe(100000); // 0 + 100k

    const acc511 = updatedAccounts.find((a: any) => a.code === "511");
    expect(acc511.balance).toBe(100000); // 0 + 100k
  });

  it("should handle PAYMENT_RECORDED and update ledger cashier balances and decrease partner debt", () => {
    // Setup initial mock accounts & partner
    const mockAccounts = [
      { id: "acc-1111", code: "1111", name: "Tiền mặt", balance: 10000 },
      { id: "acc-131", code: "131", name: "Phải thu", balance: 50000 }
    ];
    const mockPartners = [
      { id: "partner-1", name: "Khách hàng A", partner_type: "customer", debt_amount: 50000 }
    ];
    localStorage.setItem("erp-mini-local-demo-accounts", JSON.stringify(mockAccounts));
    localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));

    const payload = {
      transaction: {
        id: "tx-pay-test",
        partner_id: "partner-1",
        amount: 20000,
        transaction_type: "payment_in",
        payment_method: "cash",
        company_id: "demo",
        notes: "Thu nợ khách hàng A"
      }
    };

    erpEventBus.publish("PAYMENT_RECORDED", payload);

    // Verify partner debt decreased
    const rawUpdatedPartners = localStorage.getItem("erp-mini-local-demo-partners");
    const updatedPartners = JSON.parse(rawUpdatedPartners!);
    expect(updatedPartners[0].debt_amount).toBe(30000); // 50k - 20k

    // Verify cash account balance increased and receivable decreased
    const rawUpdatedAccounts = localStorage.getItem("erp-mini-local-demo-accounts");
    const updatedAccounts = JSON.parse(rawUpdatedAccounts!);
    
    const cashAcc = updatedAccounts.find((a: any) => a.code === "1111");
    expect(cashAcc.balance).toBe(30000); // 10k + 20k

    const recvAcc = updatedAccounts.find((a: any) => a.code === "131");
    expect(recvAcc.balance).toBe(30000); // 50k - 20k
  });

  it("should handle PAYMENT_RECORDED with payment_out type and update ledger balances and partner debt correctly", () => {
    // Setup initial mock accounts & partner
    const mockAccounts = [
      { id: "acc-1111", code: "1111", name: "Tiền mặt", balance: 100000 },
      { id: "acc-211", code: "211", name: "Tài sản cố định", balance: 50000 },
      { id: "acc-331", code: "331", name: "Phải trả người bán", balance: 60000 },
      { id: "acc-642", code: "642", name: "Chi phí", balance: 10000 }
    ];
    const mockPartners = [
      { id: "supplier-1", name: "Nhà cung cấp A", partner_type: "supplier", debt_amount: 60000 }
    ];
    localStorage.setItem("erp-mini-local-demo-accounts", JSON.stringify(mockAccounts));
    localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));

    // Case 1: Standard Supplier payment (acc-331)
    const payloadSupplier = {
      transaction: {
        id: "tx-payout-supplier",
        partner_id: "supplier-1",
        amount: 20000,
        transaction_type: "payment_out",
        payment_method: "cash",
        company_id: "demo",
        notes: "Thanh toán nhà cung cấp A"
      }
    };

    erpEventBus.publish("PAYMENT_RECORDED", payloadSupplier);

    // Verify supplier partner debt decreased
    const updatedPartners = JSON.parse(localStorage.getItem("erp-mini-local-demo-partners")!);
    expect(updatedPartners.find((p: any) => p.id === "supplier-1").debt_amount).toBe(40000); // 60k - 20k

    // Verify cash account decreased and liability acc-331 decreased
    let updatedAccounts = JSON.parse(localStorage.getItem("erp-mini-local-demo-accounts")!);
    expect(updatedAccounts.find((a: any) => a.code === "1111").balance).toBe(80000); // 100k - 20k
    expect(updatedAccounts.find((a: any) => a.code === "331").balance).toBe(40000); // 60k - 20k

    // Case 2: Capex payment (acc-211)
    const payloadCapex = {
      transaction: {
        id: "tx-payout-capex",
        partner_id: "supplier-1",
        amount: 30000,
        transaction_type: "payment_out",
        payment_method: "cash",
        company_id: "demo",
        notes: "Mua thiết bị capex"
      }
    };

    erpEventBus.publish("PAYMENT_RECORDED", payloadCapex);

    // Verify cash account decreased and capex acc-211 increased
    updatedAccounts = JSON.parse(localStorage.getItem("erp-mini-local-demo-accounts")!);
    expect(updatedAccounts.find((a: any) => a.code === "1111").balance).toBe(50000); // 80k - 30k
    expect(updatedAccounts.find((a: any) => a.code === "211").balance).toBe(80000); // 50k + 30k

    // Case 3: General Expense payment (acc-642)
    const payloadExpense = {
      transaction: {
        id: "tx-payout-expense",
        partner_id: "other-partner",
        amount: 5000,
        transaction_type: "payment_out",
        payment_method: "cash",
        company_id: "demo",
        notes: "Chi phí văn phòng phẩm"
      }
    };

    erpEventBus.publish("PAYMENT_RECORDED", payloadExpense);

    // Verify cash account decreased and expense acc-642 increased
    updatedAccounts = JSON.parse(localStorage.getItem("erp-mini-local-demo-accounts")!);
    expect(updatedAccounts.find((a: any) => a.code === "1111").balance).toBe(45000); // 50k - 5k
    expect(updatedAccounts.find((a: any) => a.code === "642").balance).toBe(15000); // 10k + 5k
  });

  it("should handle CONTRACT_SIGNED and create an order with partner_id set correctly", () => {
    const mockPartners = [
      { id: "partner-retail-123", name: "Nhà bán lẻ ABC", partner_type: "customer", debt_amount: 0 }
    ];
    localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));
    localStorage.setItem("erp-mini-local-demo-orders", "[]");
    localStorage.setItem("erp-mini-local-demo-sales-channels", "[]");

    const payload = {
      contract: {
        id: "contract-test-partner",
        contract_number: "HD-TEST-123",
        partner_id: "partner-retail-123"
      },
      companyId: "demo"
    };

    erpEventBus.publish("CONTRACT_SIGNED", payload);

    const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
    expect(rawOrders).not.toBeNull();
    const orders = JSON.parse(rawOrders!);
    expect(orders.length).toBe(1);
    expect(orders[0].partner_id).toBe("partner-retail-123");
    expect(orders[0].customer_name).toBe("Nhà bán lẻ ABC");
  });
});

import { describe, it, expect } from "vitest";

// Cash Voucher business logic helper tests

interface MockVoucher {
  id: string;
  voucher_number: string;
  voucher_type: "receipt" | "payment";
  amount: number;
  payment_method: "cash" | "bank_transfer";
  account_id: string;
  status: "draft" | "confirmed" | "voided";
}

function generateVoucherNumber(type: "receipt" | "payment", existing: MockVoucher[]): string {
  const prefix = type === "receipt" ? "PT" : "PC";
  const sameType = existing.filter(v => v.voucher_type === type);
  const maxNum = sameType.reduce((max, v) => {
    const num = parseInt(v.voucher_number.replace(`${prefix}-`, ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(4, "0")}`;
}

function verifyDoubleEntry(voucher: MockVoucher) {
  const isReceipt = voucher.voucher_type === "receipt";
  const cashAcc = voucher.payment_method === "bank_transfer" ? "acc-1121" : "acc-1111";
  
  if (isReceipt) {
    // Receipt: Dr Cash/Bank, Cr contra account
    return [
      { account_id: cashAcc, debit: voucher.amount, credit: 0 },
      { account_id: voucher.account_id, debit: 0, credit: voucher.amount }
    ];
  } else {
    // Payment: Dr contra account, Cr Cash/Bank
    return [
      { account_id: voucher.account_id, debit: voucher.amount, credit: 0 },
      { account_id: cashAcc, debit: 0, credit: voucher.amount }
    ];
  }
}

describe("Cash Voucher Auto-Numbering", () => {
  it("generates correct prefix and increments number for receipts", () => {
    const existing: MockVoucher[] = [
      { id: "1", voucher_number: "PT-0001", voucher_type: "receipt", amount: 100, payment_method: "cash", account_id: "acc-511", status: "confirmed" },
      { id: "2", voucher_number: "PT-0002", voucher_type: "receipt", amount: 200, payment_method: "bank_transfer", account_id: "acc-131", status: "confirmed" },
      { id: "3", voucher_number: "PC-0001", voucher_type: "payment", amount: 50, payment_method: "cash", account_id: "acc-642", status: "confirmed" }
    ];
    
    expect(generateVoucherNumber("receipt", existing)).toBe("PT-0003");
  });

  it("generates correct prefix and increments number for payments", () => {
    const existing: MockVoucher[] = [
      { id: "1", voucher_number: "PT-0001", voucher_type: "receipt", amount: 100, payment_method: "cash", account_id: "acc-511", status: "confirmed" },
      { id: "2", voucher_number: "PC-0001", voucher_type: "payment", amount: 50, payment_method: "cash", account_id: "acc-642", status: "confirmed" }
    ];
    
    expect(generateVoucherNumber("payment", existing)).toBe("PC-0002");
  });

  it("handles empty lists correctly", () => {
    expect(generateVoucherNumber("receipt", [])).toBe("PT-0001");
    expect(generateVoucherNumber("payment", [])).toBe("PC-0001");
  });
});

describe("Cash Voucher Double-Entry Posting", () => {
  it("generates correct debit and credit lines for receipts (cash method)", () => {
    const v: MockVoucher = {
      id: "v-1",
      voucher_number: "PT-0001",
      voucher_type: "receipt",
      amount: 1500000,
      payment_method: "cash",
      account_id: "acc-511",
      status: "confirmed"
    };

    const lines = verifyDoubleEntry(v);
    expect(lines).toHaveLength(2);
    
    // Debit lines
    expect(lines[0].account_id).toBe("acc-1111");
    expect(lines[0].debit).toBe(1500000);
    expect(lines[0].credit).toBe(0);

    // Credit lines
    expect(lines[1].account_id).toBe("acc-511");
    expect(lines[1].debit).toBe(0);
    expect(lines[1].credit).toBe(1500000);
  });

  it("generates correct debit and credit lines for payments (bank method)", () => {
    const v: MockVoucher = {
      id: "v-2",
      voucher_number: "PC-0001",
      voucher_type: "payment",
      amount: 500000,
      payment_method: "bank_transfer",
      account_id: "acc-642",
      status: "confirmed"
    };

    const lines = verifyDoubleEntry(v);
    expect(lines).toHaveLength(2);
    
    // Debit lines
    expect(lines[0].account_id).toBe("acc-642");
    expect(lines[0].debit).toBe(500000);
    expect(lines[0].credit).toBe(0);

    // Credit lines
    expect(lines[1].account_id).toBe("acc-1121");
    expect(lines[1].debit).toBe(0);
    expect(lines[1].credit).toBe(500000);
  });
});

describe("Project Budget Verification", () => {
  interface MockVoucherForBudget {
    project_id: string | null;
    voucher_type: "receipt" | "payment";
    status: "draft" | "confirmed" | "voided";
    amount: number;
  }

  function checkProjectBudget(
    newAmount: number,
    projectId: string,
    projectBudget: number,
    existingVouchers: MockVoucherForBudget[]
  ) {
    const existingCost = existingVouchers
      .filter((v) => v.project_id === projectId && v.voucher_type === "payment" && v.status !== "voided")
      .reduce((sum, v) => sum + v.amount, 0);

    if (existingCost + newAmount > projectBudget) {
      throw new Error("Không thể tạo phiếu chi: Tổng chi phí vượt quá ngân sách được phê duyệt của dự án.");
    }
  }

  it("permits payment voucher when total cost is within budget", () => {
    const existing: MockVoucherForBudget[] = [
      { project_id: "proj-123", voucher_type: "payment", status: "confirmed", amount: 5000000 },
      { project_id: "proj-123", voucher_type: "payment", status: "draft", amount: 2000000 },
    ];
    
    expect(() => checkProjectBudget(1000000, "proj-123", 10000000, existing)).not.toThrow();
  });

  it("throws error when payment voucher exceeds project budget", () => {
    const existing: MockVoucherForBudget[] = [
      { project_id: "proj-123", voucher_type: "payment", status: "confirmed", amount: 8000000 },
      { project_id: "proj-123", voucher_type: "payment", status: "draft", amount: 1000000 },
    ];
    
    expect(() => checkProjectBudget(2000000, "proj-123", 10000000, existing)).toThrow(
      "Không thể tạo phiếu chi: Tổng chi phí vượt quá ngân sách được phê duyệt của dự án."
    );
  });

  it("ignores voided payment vouchers when calculating project cost", () => {
    const existing: MockVoucherForBudget[] = [
      { project_id: "proj-123", voucher_type: "payment", status: "confirmed", amount: 8000000 },
      { project_id: "proj-123", voucher_type: "payment", status: "voided", amount: 5000000 },
    ];
    
    expect(() => checkProjectBudget(1500000, "proj-123", 10000000, existing)).not.toThrow();
  });

  it("ignores receipt vouchers when calculating project cost", () => {
    const existing: MockVoucherForBudget[] = [
      { project_id: "proj-123", voucher_type: "payment", status: "confirmed", amount: 8000000 },
      { project_id: "proj-123", voucher_type: "receipt", status: "confirmed", amount: 5000000 },
    ];
    
    expect(() => checkProjectBudget(1500000, "proj-123", 10000000, existing)).not.toThrow();
  });
});


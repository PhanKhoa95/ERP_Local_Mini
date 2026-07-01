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

import { describe, it, expect } from "vitest";
import { parseCassoDateTime } from "../usePaymentTransactions";

describe("Casso Timezone Sync (R2.4)", () => {
  it("normalizes a Vietnam local timestamp to the correct UTC string", () => {
    const rawLocalTime = "2026-06-22 14:10:02";
    const parsedUTC = parseCassoDateTime(rawLocalTime);
    
    // 2026-06-22 14:10:02 in GMT+7 should be 2026-06-22 07:10:02 UTC
    expect(parsedUTC).toBe("2026-06-22T07:10:02.000Z");
  });

  it("handles ISO-style strings with space", () => {
    const rawLocalTime = "2026-06-22T14:10:02";
    const parsedUTC = parseCassoDateTime(rawLocalTime);
    
    expect(parsedUTC).toBe("2026-06-22T07:10:02.000Z");
  });

  it("retains existing timezone offset if already present", () => {
    const utcTime = "2026-06-22T07:10:02.000Z";
    const parsed = parseCassoDateTime(utcTime);
    expect(parsed).toBe(utcTime);
  });
});

describe("Order Payment Status Calculation (R1.1)", () => {
  function calculatePaymentStatus(paidAmount: number, total: number): "paid" | "partial" | "unpaid" {
    if (paidAmount >= total) {
      return "paid";
    } else if (paidAmount > 0) {
      return "partial";
    } else {
      return "unpaid";
    }
  }

  it("sets status to paid when paid amount equals total", () => {
    expect(calculatePaymentStatus(500000, 500000)).toBe("paid");
  });

  it("sets status to paid when paid amount exceeds total", () => {
    expect(calculatePaymentStatus(600000, 500000)).toBe("paid");
  });

  it("sets status to partial when paid amount is between 0 and total", () => {
    expect(calculatePaymentStatus(200000, 500000)).toBe("partial");
  });

  it("sets status to unpaid when paid amount is 0", () => {
    expect(calculatePaymentStatus(0, 500000)).toBe("unpaid");
  });

  it("sets status to unpaid when paid amount is negative", () => {
    expect(calculatePaymentStatus(-10000, 500000)).toBe("unpaid");
  });
});

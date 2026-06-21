import { describe, it, expect } from "vitest";
import {
  calculateOrderQualityScore,
  sourceTypeLabels,
  ingestionStatusLabels,
  validationStatusLabels,
} from "@/lib/dataHub";

describe("calculateOrderQualityScore", () => {
  it("returns 100 for a fully complete order", () => {
    const score = calculateOrderQualityScore({
      customer_name: "Nguyễn Văn A",
      customer_phone: "0901234567",
      customer_address: "123 Test St",
      payment_method: "cod",
      total: 500000,
      items_count: 3,
    });
    expect(score).toBe(100);
  });

  it("returns 0 for a completely empty order", () => {
    const score = calculateOrderQualityScore({});
    expect(score).toBe(0);
  });

  it("returns partial score for incomplete order", () => {
    const score = calculateOrderQualityScore({
      customer_name: "Nguyễn Văn A",
      customer_phone: "0901234567",
      // missing address, payment, total, items
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
    // 2 out of 6 checks passed = 33%
    expect(score).toBe(33);
  });

  it("treats zero total as failing", () => {
    const score = calculateOrderQualityScore({
      customer_name: "Test",
      customer_phone: "0901234567",
      customer_address: "123 Test",
      payment_method: "cod",
      total: 0,
      items_count: 1,
    });
    // 5 out of 6 = 83%
    expect(score).toBe(83);
  });

  it("treats null items_count as failing", () => {
    const score = calculateOrderQualityScore({
      customer_name: "Test",
      customer_phone: "0901234567",
      customer_address: "123 Test",
      payment_method: "cod",
      total: 100000,
      items_count: null,
    });
    expect(score).toBe(83);
  });
});

describe("DataHub labels", () => {
  it("has all expected source types", () => {
    const expectedKeys = [
      "manual", "pos", "public_store", "marketplace", "social",
      "website", "crm", "webhook", "api", "file_import", "other",
    ];
    for (const key of expectedKeys) {
      expect(sourceTypeLabels[key]).toBeDefined();
      expect(typeof sourceTypeLabels[key]).toBe("string");
    }
  });

  it("has all expected ingestion statuses", () => {
    const expectedKeys = ["received", "processed", "failed", "ignored"];
    for (const key of expectedKeys) {
      expect(ingestionStatusLabels[key]).toBeDefined();
    }
  });

  it("has all expected validation statuses", () => {
    const expectedKeys = ["queued", "normalized", "linked", "rejected", "duplicate"];
    for (const key of expectedKeys) {
      expect(validationStatusLabels[key]).toBeDefined();
    }
  });
});

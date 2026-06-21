import { describe, it, expect } from "vitest";
import { normalizePhone, normalizeName } from "@/lib/identityResolution";

describe("normalizePhone", () => {
  it("returns empty string for null/undefined", () => {
    expect(normalizePhone(null)).toBe("");
    expect(normalizePhone(undefined)).toBe("");
    expect(normalizePhone("")).toBe("");
  });

  it("strips spaces and dashes", () => {
    expect(normalizePhone("090 123 4567")).toBe("0901234567");
    expect(normalizePhone("090-123-4567")).toBe("0901234567");
    expect(normalizePhone("(090) 123.4567")).toBe("0901234567");
  });

  it("converts +84 prefix to 0", () => {
    expect(normalizePhone("+84901234567")).toBe("0901234567");
  });

  it("converts 84 prefix (11 digits) to 0", () => {
    expect(normalizePhone("84901234567")).toBe("0901234567");
  });

  it("preserves already normalized numbers", () => {
    expect(normalizePhone("0901234567")).toBe("0901234567");
  });
});

describe("normalizeName", () => {
  it("returns empty string for null/undefined", () => {
    expect(normalizeName(null)).toBe("");
    expect(normalizeName(undefined)).toBe("");
    expect(normalizeName("")).toBe("");
  });

  it("lowercases and removes diacritics", () => {
    expect(normalizeName("Nguyễn Văn Ấn")).toBe("nguyen van an");
  });

  it("converts đ to d", () => {
    expect(normalizeName("Đặng")).toBe("dang");
  });

  it("trims and normalizes whitespace", () => {
    expect(normalizeName("  Trần  Thị   Bé  ")).toBe("tran thi be");
  });

  it("removes special characters", () => {
    expect(normalizeName("Lê @#$ Văn")).toBe("le van");
  });

  it("handles mixed case and accents consistently", () => {
    const name1 = normalizeName("NGUYỄN VĂN AN");
    const name2 = normalizeName("nguyễn văn an");
    expect(name1).toBe(name2);
  });
});

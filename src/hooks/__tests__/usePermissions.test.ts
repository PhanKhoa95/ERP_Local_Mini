import { describe, it, expect } from "vitest";
import { getRegionFromProvince } from "../usePermissions";

describe("getRegionFromProvince", () => {
  it("resolves Northern provinces correctly", () => {
    expect(getRegionFromProvince("Hà Nội")).toBe("Miền Bắc");
    expect(getRegionFromProvince("Hải Phòng")).toBe("Miền Bắc");
    expect(getRegionFromProvince("Bắc Ninh")).toBe("Miền Bắc");
    expect(getRegionFromProvince("miền bắc")).toBe("Miền Bắc");
  });

  it("resolves Central provinces correctly", () => {
    expect(getRegionFromProvince("Đà Nẵng")).toBe("Miền Trung");
    expect(getRegionFromProvince("Khánh Hòa")).toBe("Miền Trung");
    expect(getRegionFromProvince("Gia Lai")).toBe("Miền Trung");
  });

  it("resolves Southern provinces correctly", () => {
    expect(getRegionFromProvince("Hồ Chí Minh")).toBe("Miền Nam");
    expect(getRegionFromProvince("Bình Dương")).toBe("Miền Nam");
    expect(getRegionFromProvince("Cần Thơ")).toBe("Miền Nam");
    expect(getRegionFromProvince("TP.HCM")).toBe("Miền Nam");
  });

  it("handles fallback and edge cases", () => {
    expect(getRegionFromProvince("")).toBe("Khác");
    expect(getRegionFromProvince("Khác")).toBe("Khác");
  });
});

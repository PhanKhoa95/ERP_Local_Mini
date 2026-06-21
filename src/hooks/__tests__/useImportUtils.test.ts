import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  autoMapHeaders,
  parseRowsWithMapping,
} from "../../../src/lib/importUtils";

describe("normalizeHeader", () => {
  it("trims and lowercases input strings", () => {
    expect(normalizeHeader("  MÃ ĐƠN  ")).toBe("mã đơn");
    expect(normalizeHeader("CUSTOMER_NAME")).toBe("customer name");
  });

  it("removes special characters but keeps standard alphanumeric and Vietnamese characters", () => {
    expect(normalizeHeader("Số Điện Thoại (*)")).toBe("số điện thoại");
    expect(normalizeHeader("địa_chỉ_giao")).toBe("địa chỉ giao");
  });
});

describe("autoMapHeaders", () => {
  it("maps Vietnamese headers correctly", () => {
    const headers = [
      "Mã đơn hàng",
      "Tên khách hàng",
      "Số điện thoại",
      "Địa chỉ giao hàng",
      "Mã sản phẩm",
      "Số lượng",
      "Đơn giá",
    ];
    const mapping = autoMapHeaders(headers);
    expect(mapping[0]).toBe("order_number");
    expect(mapping[1]).toBe("customer_name");
    expect(mapping[2]).toBe("customer_phone");
    expect(mapping[3]).toBe("shipping_address");
    expect(mapping[4]).toBe("product_sku");
    expect(mapping[5]).toBe("quantity");
    expect(mapping[6]).toBe("unit_price");
  });

  it("maps English and standard fields correctly", () => {
    const headers = [
      "order_number",
      "customer_name",
      "phone",
      "shipping_address",
      "sku",
      "quantity",
      "price",
    ];
    const mapping = autoMapHeaders(headers);
    expect(mapping[0]).toBe("order_number");
    expect(mapping[1]).toBe("customer_name");
    expect(mapping[2]).toBe("customer_phone");
    expect(mapping[3]).toBe("shipping_address");
    expect(mapping[4]).toBe("product_sku");
    expect(mapping[5]).toBe("quantity");
    expect(mapping[6]).toBe("unit_price");
  });
});

describe("parseRowsWithMapping", () => {
  const mapping = {
    0: "order_number" as const,
    1: "customer_name" as const,
    2: "customer_phone" as const,
    3: "product_sku" as const,
    4: "quantity" as const,
    5: "unit_price" as const,
  };

  it("successfully parses tabular grid data into objects", () => {
    const data = [
      ["Mã đơn", "Khách hàng", "SĐT", "SKU", "Số lượng", "Đơn giá"],
      ["ORD123", "Nguyễn Văn A", "0901234567", "SKU-WHITE", "2", "150000"],
      ["ORD456", "Trần Thị B", "0912345678", "SKU-BLACK", "1", "250000"],
    ];
    const rows = parseRowsWithMapping(data, mapping);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      order_number: "ORD123",
      customer_name: "Nguyễn Văn A",
      customer_phone: "0901234567",
      product_sku: "SKU-WHITE",
      quantity: 2,
      unit_price: 150000,
    });
    expect(rows[1]).toEqual({
      order_number: "ORD456",
      customer_name: "Trần Thị B",
      customer_phone: "0912345678",
      product_sku: "SKU-BLACK",
      quantity: 1,
      unit_price: 250000,
    });
  });

  it("skips blank or empty rows", () => {
    const data = [
      ["Mã đơn", "Khách hàng", "SĐT", "SKU", "Số lượng", "Đơn giá"],
      ["ORD123", "Nguyễn Văn A", "0901234567", "SKU-WHITE", "2", "150000"],
      ["", "", "", "", "", ""],
      [undefined, null, "", undefined, "", ""],
    ];
    const rows = parseRowsWithMapping(data, mapping);
    expect(rows).toHaveLength(1);
  });
});

import { describe, it, expect } from "vitest";
import {
  validateOrderPayload,
  getMissingOrderFields,
  type OrderFormData,
} from "@/lib/validation";

describe("validateOrderPayload", () => {
  it("returns no errors for a complete payload", () => {
    const formData: OrderFormData = {
      channel_id: "ch-1",
      customer_phone: "0901234567",
      shipping_address: "123 Nguyễn Huệ, Q1",
      warehouse_id: "wh-1",
      payment_method: "cod",
    };
    const errors = validateOrderPayload(formData, 1);
    expect(errors).toHaveLength(0);
  });

  it("detects missing channel_id", () => {
    const formData: OrderFormData = {
      customer_phone: "0901234567",
      shipping_address: "123 Nguyễn Huệ",
      warehouse_id: "wh-1",
      payment_method: "cod",
    };
    const errors = validateOrderPayload(formData, 1);
    expect(errors).toContain("Vui lòng chọn kênh bán hàng");
  });

  it("detects missing customer_phone", () => {
    const formData: OrderFormData = {
      channel_id: "ch-1",
      shipping_address: "123 Nguyễn Huệ",
      warehouse_id: "wh-1",
      payment_method: "cod",
    };
    const errors = validateOrderPayload(formData, 1);
    expect(errors).toContain("Số điện thoại khách hàng là bắt buộc");
  });

  it("detects missing address (both shipping and customer)", () => {
    const formData: OrderFormData = {
      channel_id: "ch-1",
      customer_phone: "0901234567",
      warehouse_id: "wh-1",
      payment_method: "cod",
    };
    const errors = validateOrderPayload(formData, 1);
    expect(errors).toContain("Địa chỉ giao hàng là bắt buộc");
  });

  it("accepts customer_address as alternative to shipping_address", () => {
    const formData: OrderFormData = {
      channel_id: "ch-1",
      customer_phone: "0901234567",
      customer_address: "123 Nguyễn Huệ",
      warehouse_id: "wh-1",
      payment_method: "cod",
    };
    const errors = validateOrderPayload(formData, 1);
    expect(errors).not.toContain("Địa chỉ giao hàng là bắt buộc");
  });

  it("detects missing warehouse_id", () => {
    const formData: OrderFormData = {
      channel_id: "ch-1",
      customer_phone: "0901234567",
      shipping_address: "123 Nguyễn Huệ",
      payment_method: "cod",
    };
    const errors = validateOrderPayload(formData, 1);
    expect(errors).toContain("Vui lòng chọn kho xuất hàng");
  });

  it("detects missing payment_method", () => {
    const formData: OrderFormData = {
      channel_id: "ch-1",
      customer_phone: "0901234567",
      shipping_address: "123 Nguyễn Huệ",
      warehouse_id: "wh-1",
    };
    const errors = validateOrderPayload(formData, 1);
    expect(errors).toContain("Vui lòng chọn phương thức thanh toán");
  });

  it("detects zero items", () => {
    const formData: OrderFormData = {
      channel_id: "ch-1",
      customer_phone: "0901234567",
      shipping_address: "123 Nguyễn Huệ",
      warehouse_id: "wh-1",
      payment_method: "cod",
    };
    const errors = validateOrderPayload(formData, 0);
    expect(errors).toContain("Vui lòng thêm ít nhất một sản phẩm");
  });

  it("returns all errors when payload is empty", () => {
    const errors = validateOrderPayload({}, 0);
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });
});

describe("getMissingOrderFields", () => {
  it("returns empty array for complete order", () => {
    const data: OrderFormData = {
      customer_phone: "0901234567",
      shipping_address: "123 Test",
      warehouse_id: "wh-1",
      payment_method: "cod",
    };
    expect(getMissingOrderFields(data)).toHaveLength(0);
  });

  it("detects all missing fields", () => {
    const missing = getMissingOrderFields({});
    expect(missing).toContain("Số điện thoại khách hàng");
    expect(missing).toContain("Địa chỉ giao hàng");
    expect(missing).toContain("Kho xuất hàng");
    expect(missing).toContain("Phương thức thanh toán");
  });

  it("uses customer_address as fallback for shipping_address", () => {
    const data: OrderFormData = {
      customer_phone: "0901234567",
      customer_address: "456 Lê Lợi",
      warehouse_id: "wh-1",
      payment_method: "cod",
    };
    const missing = getMissingOrderFields(data);
    expect(missing).not.toContain("Địa chỉ giao hàng");
  });
});

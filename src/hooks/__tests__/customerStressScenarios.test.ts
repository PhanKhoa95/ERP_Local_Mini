import { describe, expect, it } from "vitest";
import { calculateOrderQualityScore } from "@/lib/dataHub";
import {
  getOrderCustomerAddress,
  getOrderCustomerName,
  getOrderCustomerPhone,
  normalizePhone as normalizeOrderPhone,
  type OrderWithControl,
} from "@/lib/orderControl";
import { normalizeName, normalizePhone as normalizeIdentityPhone } from "@/lib/identityResolution";
import {
  getMissingOrderFields,
  validateOrderPayload,
  type OrderFormData,
} from "@/lib/validation";

function makeOrder(overrides: Partial<OrderWithControl>): OrderWithControl {
  return {
    id: "order-1",
    company_id: "company-1",
    order_number: "ORD-000001",
    status: "pending",
    source_type: "manual",
    subtotal: 0,
    discount: 0,
    voucher_discount: 0,
    total: 0,
    paid_amount: 0,
    created_at: "2026-05-21T00:00:00.000Z",
    updated_at: "2026-05-21T00:00:00.000Z",
    order_date: "2026-05-21T00:00:00.000Z",
    order_type: "b2c",
    partner_id: null,
    channel_id: null,
    customer_name: null,
    customer_phone: null,
    customer_email: null,
    customer_address: null,
    shipping_address: null,
    shipping_district: null,
    shipping_fee: null,
    shipping_province: null,
    shipping_ward: null,
    notes: null,
    internal_notes: null,
    created_by: null,
    payment_method: null,
    payment_reference: null,
    payment_status: null,
    platform_data: null,
    platform_order_id: null,
    platform_status: null,
    warehouse_id: null,
    shipping_zone_id: null,
    priority: "normal",
    confirmed_at: null,
    external_created_at: null,
    last_synced_at: null,
    shipped_at: null,
    delivered_at: null,
    cancelled_at: null,
    cancelled_reason: null,
    voucher_id: null,
    partners: null,
    sales_channels: null,
    warehouses: null,
    shipping_zones: null,
    ...overrides,
  } as OrderWithControl;
}

describe("Difficult customer stress scenarios", () => {
  it("#101 blocks a rush order when a demanding customer refuses required contact data", () => {
    const draft: OrderFormData = {
      channel_id: "storefront",
      customer_phone: "",
      shipping_address: "",
      warehouse_id: "warehouse-1",
      payment_method: "cod",
    };

    expect(validateOrderPayload(draft, 1)).toHaveLength(2);
    expect(getMissingOrderFields(draft)).toHaveLength(2);
    expect(calculateOrderQualityScore({
      customer_name: "Rush buyer",
      customer_phone: draft.customer_phone,
      customer_address: draft.shipping_address,
      payment_method: draft.payment_method,
      total: 450000,
      items_count: 1,
    })).toBe(67);
  });

  it("#102 keeps the latest shipping address when a customer changes delivery details", () => {
    const order = makeOrder({
      customer_name: "Returning buyer",
      customer_phone: "0901234567",
      customer_address: "Old billing address",
      shipping_address: "New urgent delivery address",
      partners: {
        id: "partner-1",
        name: "Returning buyer",
        phone: "0901234567",
        email: null,
        address: "Saved profile address",
      } as unknown as OrderWithControl["partners"],
    });

    expect(getOrderCustomerAddress(order)).toBe("New urgent delivery address");
  });

  it("#103 falls back to the known customer profile when a repeat buyer sends incomplete order data", () => {
    const order = makeOrder({
      partners: {
        id: "partner-2",
        name: "VIP buyer",
        phone: "0912345678",
        email: null,
        address: "Saved VIP address",
      } as unknown as OrderWithControl["partners"],
    });

    expect(getOrderCustomerName(order)).toBe("VIP buyer");
    expect(getOrderCustomerPhone(order)).toBe("0912345678");
    expect(getOrderCustomerAddress(order)).toBe("Saved VIP address");
  });

  it("#104 normalizes messy phone numbers from angry chat or marketplace messages", () => {
    expect(normalizeOrderPhone("+84 (901) 234-567")).toBe("84901234567");
    expect(normalizeIdentityPhone("+84 (901) 234-567")).toBe("0901234567");
    expect(normalizeIdentityPhone("84 912 345 678")).toBe("0912345678");
  });

  it("#105 blocks confirmation when payment and warehouse are missing from a high-pressure COD case", () => {
    const draft: OrderFormData = {
      channel_id: "messenger",
      customer_phone: "0901234567",
      shipping_address: "District 1",
      warehouse_id: "",
      payment_method: "",
    };

    const errors = validateOrderPayload(draft, 2);
    expect(errors).toHaveLength(2);
    expect(getMissingOrderFields(draft)).toHaveLength(2);
  });

  it("#106 avoids auto-identifying customers from short or vague names", () => {
    expect(normalizeName("  Chị  A!!!  ")).toBe("chi a");
    expect(normalizeName("")).toBe("");
    expect(normalizeIdentityPhone("12345")).toBe("12345");
  });
});

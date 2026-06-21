import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateOrderQualityScore } from "@/lib/dataHub";
import { resolveIdentity } from "@/lib/identityResolution";
import { resolveSkus } from "@/lib/skuResolution";

// Mocks
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: "partner-123", name: "Nguyễn Văn Test" }], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      };
      
      if (table === "partners") {
        builder.or = vi.fn().mockReturnThis();
        builder.limit = vi.fn().mockResolvedValue({ data: [{ id: "partner-123", name: "Nguyễn Văn Test" }], error: null });
      }
      if (table === "products") {
        builder.or = vi.fn().mockResolvedValue({ data: [{ id: "prod-123", name: "Sản phẩm A", price: 150000, sku: "SKU-A" }], error: null });
        builder.eq = vi.fn().mockResolvedValue({ data: [{ id: "prod-123", name: "Sản phẩm A", price: 150000, sku: "SKU-A" }], error: null });
        builder.select = vi.fn().mockReturnThis();
      }
      if (table === "orders") {
        builder.insert = vi.fn().mockResolvedValue({ data: [{ id: "order-123" }], error: null });
      }
      if (table === "entity_resolution_links") {
        builder.insert = vi.fn().mockResolvedValue({ error: null });
      }
      
      return builder;
    }),
  }
}));

describe("End-to-End Data Flow Integration", () => {
  const mockCompanyId = "00000000-0000-4000-8000-000000000001";
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Ingests raw data and calculates quality score", () => {
    const rawWebhookPayload = {
      order_id: "SHP-9999",
      customer_name: "Nguyễn Văn Test",
      customer_phone: "0901234567",
      address: "123 Test St",
      total: 300000,
      items: [
        { sku: "SKU-A", name: "Sản phẩm A", quantity: 2, price: 150000 }
      ]
    };

    const score = calculateOrderQualityScore({
      customer_name: rawWebhookPayload.customer_name,
      customer_phone: rawWebhookPayload.customer_phone,
      customer_address: rawWebhookPayload.address,
      payment_method: "cod",
      total: rawWebhookPayload.total,
      items_count: rawWebhookPayload.items.length,
    });

    expect(score).toBe(100); // 6 out of 6 checks
  });

  it("2. Resolves identity from raw data (Identity Resolution)", async () => {
    const rawEventId = "evt-123";
    const contactInfo = {
      phone: "0901234567",
      name: "Nguyễn Văn Test"
    };

    const result = await resolveIdentity(mockCompanyId, rawEventId, contactInfo);
    
    expect(result.auto_linked).toBe(true);
    expect(result.linked_entity_type).toBe("partner");
    expect(result.linked_entity_id).toBe("partner-123");
  });

  it("3. Resolves SKUs from raw data (SKU Resolution)", async () => {
    const rawItems = [
      { name: "Sản phẩm A", sku: "SKU-A", price: 150000, quantity: 2 }
    ];

    const resolutionResult = await resolveSkus(mockCompanyId, [rawItems[0].sku]);
    
    expect(resolutionResult.resolved.length).toBeGreaterThan(0);
    expect(resolutionResult.resolved[0].product_id).toBe("prod-123");
    expect(resolutionResult.resolved[0].match_type).toBe("exact_sku");
  });

  it("4. Aggregates data for Strategic Reports", () => {
    // Simulate what the strategic report hook does
    const orders = [
      { total_amount: 300000, status: "completed", payment_status: "paid" },
      { total_amount: 150000, status: "processing", payment_status: "pending" }
    ];

    const totalRevenue = orders
      .filter(o => o.status === "completed" || o.payment_status === "paid")
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const activeOrdersCount = orders.length;

    expect(totalRevenue).toBe(300000);
    expect(activeOrdersCount).toBe(2);
  });
});

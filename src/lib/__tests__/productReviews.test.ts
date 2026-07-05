import { describe, expect, it, vi, beforeEach } from "vitest";
import { getLocalReviews, saveLocalReviews, ProductReview } from "@/hooks/useProductReviews";

// Mock isLocalDemoAuthEnabled to always return true for testing local demo handlers
vi.mock("@/lib/localDemoAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/localDemoAuth")>();
  return {
    ...actual,
    isLocalDemoAuthEnabled: () => true
  };
});

describe("Product Reviews Integration and Mock Fallback Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. should automatically seed reviews if localStorage is empty", () => {
    const list = getLocalReviews();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe("rev-1");
    expect(list[0].platform).toBe("shopee");
  });

  it("2. should correctly update a review reply content and timestamp", () => {
    const list = getLocalReviews();
    const targetId = "rev-2";
    const review = list.find(r => r.id === targetId);
    expect(review?.reply_content).toBeNull();

    // Perform mock update
    const replyText = "Cảm ơn bạn đã phản hồi, shop sẽ hỗ trợ đổi trả ngay.";
    const updatedList = list.map(r => {
      if (r.id === targetId) {
        return { ...r, reply_content: replyText, updated_at: new Date().toISOString() };
      }
      return r;
    });
    saveLocalReviews(updatedList);

    const saved = getLocalReviews();
    const updatedReview = saved.find(r => r.id === targetId);
    expect(updatedReview?.reply_content).toBe(replyText);
    expect(updatedReview?.updated_at).toBeDefined();
  });

  it("3. should correctly delete a review from list", () => {
    const list = getLocalReviews();
    const initialCount = list.length;
    const targetId = "rev-1";

    const filtered = list.filter(r => r.id !== targetId);
    saveLocalReviews(filtered);

    const saved = getLocalReviews();
    expect(saved.length).toBe(initialCount - 1);
    expect(saved.find(r => r.id === targetId)).toBeUndefined();
  });

  it("4. should correctly import new reviews to the top of list", () => {
    const list = getLocalReviews();
    const initialCount = list.length;

    const newReview: ProductReview = {
      id: "rev-new-99",
      platform: "tiktok",
      customer_name: "Khách test mới",
      customer_phone: "0900111222",
      rating: 5,
      comment: "Rất hài lòng, sản phẩm tuyệt vời",
      reply_content: null,
      product_name: "Bảng QR Mica",
      product_sku: "PRD-QR-MICA",
      order_number: "HIST-TEST-99",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const combined = [newReview, ...list];
    saveLocalReviews(combined);

    const saved = getLocalReviews();
    expect(saved.length).toBe(initialCount + 1);
    expect(saved[0].id).toBe("rev-new-99");
    expect(saved[0].platform).toBe("tiktok");
  });
});

import { test, expect } from "@playwright/test";

test.describe("Promotions & Auto-Apply E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Standard Demo Login
    await page.goto("http://localhost:8017/auth");
    await page.fill('input[placeholder="name@company.com"]', "admin@demo.com");
    await page.fill('input[placeholder="••••••••"]', "demo1234");
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL("http://localhost:8017/");
  });

  test("should display promotions page list and auto-apply promotions inside POS cart", async ({ page }) => {
    // 1. Navigate to Promotions page
    await page.goto("http://localhost:8017/promotions");
    
    // Check page header and title
    await expect(page.locator("h1")).toContainText("Khuyến mãi & Ưu đãi");
    
    // Check that default seeded promotions are present in the table
    await expect(page.locator("body")).toContainText("SIEUDEAL");
    await expect(page.locator("body")).toContainText("AUTO10");
    await expect(page.locator("body")).toContainText("FREESHIP");

    // 2. Navigate to POS page
    await page.goto("http://localhost:8017/pos");
    
    // Wait for POS categories and products to load
    await page.waitForSelector(".grid >> text=Thẻ QR");
    
    // Add product "Thẻ QR cá nhân thông minh" (sku: PRD-QR-CARD) to cart
    // Available stock is 150, selling price is 69,000đ.
    await page.click("text=Thẻ QR cá nhân thông minh");
    
    // Check cart has 1 item, subtotal = 69,000đ.
    // 69k is under the 200k threshold, so no auto-apply promo should be active.
    await expect(page.locator("body")).not.toContainText("Tự động: Tự động giảm 10% đơn từ 200k");

    // Increase quantity of the item to 4 items (subtotal = 4 * 69k = 276,000đ)
    // 276k is above 200k threshold, triggering the AUTO10 auto-apply!
    const qtyInput = page.locator('input[inputmode="numeric"]');
    await qtyInput.fill("4");
    await qtyInput.blur();
    
    // Wait for the debounce to trigger and compute totals
    await page.waitForTimeout(600);
    
    // Verify auto-apply badge is now visible in the footer
    await expect(page.locator("body")).toContainText("Tự động: Tự động giảm 10% đơn từ 200k");
    
    // Verify total discount is 10% of 276k = 27,600đ
    const discountDisplay = page.locator("text=-27.600đ");
    await expect(discountDisplay).toBeVisible();

    // Verify subtotal, discount, and grand total in the summary
    // Subtotal: 276k
    // Discount: 27.6k
    // Total: 276k - 27.6k = 248,400đ
    const totalDisplay = page.locator("text=248.400đ");
    await expect(totalDisplay).toBeVisible();

    // 3. Complete checkout
    // Select a payment method (Cash / Tiền mặt)
    await page.click("text=Tiền mặt");
    
    // Click Thanh toán
    await page.click("text=Thanh toán");
    
    // Wait for order completion success toast
    await expect(page.locator("text=Thanh toán thành công")).toBeVisible();
  });
});

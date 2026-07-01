import { test, expect } from "@playwright/test";
import { loginLocalDemo } from "./helpers";

test.describe("Promotions & Auto-Apply E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 960 });
    
    // Standard Demo Login helper
    await loginLocalDemo(page);
  });

  test("should display promotions page list, auto-apply in POS, and track usage history", async ({ page }) => {
    // 1. Navigate to Promotions page
    await page.goto("/promotions");
    
    // Check page header and title
    await expect(page.locator("h1")).toContainText("Khuyến mãi & Ưu đãi");
    
    // Check that default seeded promotions are present in the table
    await expect(page.locator("body")).toContainText("SIEUDEAL");
    await expect(page.locator("body")).toContainText("AUTO10");
    await expect(page.locator("body")).toContainText("FREESHIP");

    // 2. Navigate to POS page
    await page.goto("/pos");
    
    // Wait for POS categories and products to load
    await page.waitForSelector(".grid >> text=Thẻ QR");
    
    // Add product "Thẻ QR cá nhân thông minh" (sku: PRD-QR-CARD) to cart
    await page.click("text=Thẻ QR cá nhân thông minh");
    
    // Check cart has 1 item, subtotal = 69,000đ.
    // 69k is under the 200k threshold, so no auto-apply promo should be active.
    await expect(page.locator("body")).not.toContainText("Tự động: Tự động giảm 10% đơn từ 200k");

    // Increase quantity of the item to 4 items (subtotal = 4 * 69k = 276,000đ)
    // 276k is above 200k threshold, triggering the AUTO10 auto-apply!
    const qtyInput = page.locator('input[inputmode="numeric"]').first();
    await qtyInput.fill("4");
    await qtyInput.blur();
    
    // Wait for the debounce to trigger and compute totals
    await page.waitForTimeout(1000);
    
    // Verify auto-apply badge is now visible in the footer
    await expect(page.locator("body")).toContainText("Tự động: Tự động giảm 10% đơn từ 200k");
    
    // Verify total discount is 10% of 276k = 27,600đ
    const discountDisplay = page.locator("text=-27.600đ");
    await expect(discountDisplay).toBeVisible({ timeout: 10000 });

    // Verify subtotal, discount, and grand total in the summary
    const totalDisplay = page.locator("text=248.400đ");
    await expect(totalDisplay).toBeVisible({ timeout: 10000 });

    // 3. Complete checkout by clicking Cash (Tiền mặt)
    const cashBtn = page.getByRole("button", { name: "Tiền mặt" });
    await expect(cashBtn).toBeVisible({ timeout: 5000 });
    
    // Track POS order generation based on timestamp to search for it later
    const expectedOrderPrefix = "POS-";
    
    await cashBtn.click();
    
    // Wait for order completion success toast
    const successToast = page.getByText("Thanh toán thành công").first();
    await expect(successToast).toBeVisible({ timeout: 15000 });

    // 4. Return to Promotions page and check details & customer usage history audit log
    await page.goto("/promotions");
    
    // Find the AUTO10 row and click the Eye (detail) button
    const auto10Row = page.locator('tr:has-text("AUTO10")');
    const eyeButton = auto10Row.locator('button[title="Xem chi tiết & Lịch sử sử dụng"]');
    await expect(eyeButton).toBeVisible({ timeout: 5000 });
    await eyeButton.click();
    
    // Verify detailed dialog is opened
    await expect(page.locator("h2")).toContainText("Chi tiết & Lịch sử sử dụng");
    
    // Click on the 'Lịch sử khách mua' tab inside the Dialog
    await page.click('button:has-text("Lịch sử khách mua")');
    
    // Verify the newly created order appears in the history table
    const orderHistoryCell = page.locator(`td:has-text("${expectedOrderPrefix}")`).first();
    await expect(orderHistoryCell).toBeVisible({ timeout: 5000 });
  });
});

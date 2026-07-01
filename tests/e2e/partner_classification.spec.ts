import { test, expect } from "@playwright/test";
import { loginLocalDemo } from "./helpers";

test.describe("Partner Classification & Promotion Segmentation E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 960 });
    
    // Standard Demo Login helper
    await loginLocalDemo(page);
  });

  test("should support partner bulk classification and apply promotion segmentation rules in POS", async ({ page }) => {
    // 1. Navigate to Partners page
    await page.goto("/partners");
    await page.waitForSelector("text=Quản lý đối tác");

    // Click "Thiết lập hàng loạt" button
    await page.click("text=Thiết lập hàng loạt");
    
    // Search for "BlueSky" in bulk dialog
    const bulkSearchInput = page.locator('input[placeholder="Lọc đối tác để chọn..."]');
    await bulkSearchInput.fill("BlueSky");
    await page.waitForTimeout(500);

    // Verify row for BlueSky appears, check the checkbox next to it
    const rowCheck = page.locator('tr:has-text("KH-BLUESKY") input[type="checkbox"]');
    await expect(rowCheck).toBeVisible({ timeout: 5000 });
    await rowCheck.check();

    // Configure classification attributes in the right panel
    // 1. Chi nhánh
    await page.click('div:has-text("Chi nhánh phụ trách") + div button');
    await page.click('div[role="presentation"] >> text=Chi nhánh miền Nam');

    // 2. Tệp khuyến mãi
    await page.click('div:has-text("Tệp khuyến mãi áp dụng") + div button');
    await page.click('div[role="presentation"] >> text=Khách mua sỉ (wholesale)');

    // Click Apply Bulk settings
    await page.click('button:has-text("Áp dụng thiết lập")');

    // Wait for the bulk operation to complete and dialog to close
    await expect(page.locator("text=Cập nhật hàng loạt thành công")).toBeVisible({ timeout: 10000 });

    // Verify badges are updated on the customer card
    const blueskyCard = page.locator('div.hover\\:shadow-md:has-text("BlueSky")');
    await expect(blueskyCard.locator('text=Chi nhánh miền Nam')).toBeVisible({ timeout: 5000 });
    await expect(blueskyCard.locator('text=Tệp: Wholesale')).toBeVisible({ timeout: 5000 });

    // 2. Navigate to Promotions page to create a Wholesale-specific Auto-Apply promotion
    await page.goto("/promotions");
    await page.click("text=Tạo chiến dịch");

    // Fill form
    await page.fill('input[placeholder="Ví dụ: Ưu đãi ngày hè, Giảm giá cuối tháng..."]', "Wholesale Mega Deal");
    
    // Toggle auto-apply
    const autoApplyToggle = page.locator('button[role="switch"]:has-text("Tự động áp dụng")');
    // If not already checked, click it. But switch in radix has checked status in attribute:
    const autoApplySwitch = page.locator('button[role="switch"]').first();
    await autoApplySwitch.click();

    // Select Customer Group target -> wholesale
    await page.click('div:has-text("Đối tượng khách hàng") + div button');
    await page.click('div[role="presentation"] >> text=Khách mua sỉ');

    // Select discount type -> Percentage and enter 15%
    await page.fill('input[placeholder="10"]', "15");

    // Click Submit
    await page.click('button:has-text("Kích hoạt")');

    // Verify it is created in the table
    await expect(page.locator("body")).toContainText("Wholesale Mega Deal");

    // 3. Navigate to POS to check segmentation auto-apply rules
    await page.goto("/pos");
    
    // Add product "Thẻ QR cá nhân thông minh"
    await page.waitForSelector(".grid >> text=Thẻ QR");
    await page.click("text=Thẻ QR cá nhân thông minh");

    // Selected customer is walk-in (no wholesale tệp) -> Wholesale Mega Deal should NOT apply
    await page.waitForTimeout(600);
    await expect(page.locator("body")).not.toContainText("Wholesale Mega Deal");

    // Now select "Cửa hàng Thời trang BlueSky" as the customer
    await page.click('button:has-text("Chọn khách hàng")');
    const searchCustomerInput = page.locator('input[placeholder="Tìm khách hàng (F4)..."]');
    await searchCustomerInput.fill("BlueSky");
    await page.waitForTimeout(600);
    await page.click('text=Cửa hàng Thời trang BlueSky');

    // Trigger auto-apply evaluation
    await page.waitForTimeout(1000);

    // Verify that the Wholesale Mega Deal is now auto-applied because customer belongs to wholesale segment!
    await expect(page.locator("body")).toContainText("Tự động: Wholesale Mega Deal");

    // Discount value: 15% of 69k = 10,350đ
    const discountDisplay = page.locator("text=-10.350đ");
    await expect(discountDisplay).toBeVisible({ timeout: 5000 });
  });
});

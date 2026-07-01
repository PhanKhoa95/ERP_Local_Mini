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
    // Increase test timeout to ensure slow animations don't trigger timeout
    test.setTimeout(60000);

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
    const branchSelect = page.locator('div.space-y-1\\.5:has-text("Chi nhánh phụ trách") button');
    await expect(branchSelect).toBeVisible({ timeout: 5000 });
    await branchSelect.click();
    await page.click('div[role="presentation"] >> text=Chi nhánh miền Nam');

    // 2. Tệp khuyến mãi
    const segmentSelect = page.locator('div.space-y-1\\.5:has-text("Tệp khuyến mãi áp dụng") button');
    await expect(segmentSelect).toBeVisible({ timeout: 5000 });
    await segmentSelect.click();
    await page.click('div[role="presentation"] >> text=Khách mua sỉ (wholesale)');

    // Click Apply Bulk settings
    await page.click('button:has-text("Áp dụng thiết lập")');

    // Wait for the bulk operation to complete and dialog to close
    await expect(page.locator("text=Cập nhật hàng loạt thành công").first()).toBeVisible({ timeout: 15000 });

    // Verify badges are updated on the customer card
    const blueskyCard = page.locator('div.hover\\:shadow-md:has-text("BlueSky")');
    await expect(blueskyCard.locator('text=Chi nhánh miền Nam')).toBeVisible({ timeout: 10000 });
    await expect(blueskyCard.locator('text=Tệp: Wholesale')).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Promotions page to create a Wholesale-specific Auto-Apply promotion
    await page.goto("/promotions");
    await page.click("text=Tạo chiến dịch");

    // Locate dialog container
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill form inside dialog
    await dialog.locator('input[placeholder="Ví dụ: Ưu đãi ngày hè, Giảm giá cuối tháng..."]').fill("Wholesale Mega Deal");
    
    // Toggle auto-apply inside dialog
    const autoApplySwitch = dialog.locator('button[role="switch"]').first();
    await autoApplySwitch.click();

    // Select Customer Group target -> wholesale inside dialog
    const targetGroupSelect = dialog.locator('div.space-y-2:has-text("Đối tượng khách hàng") button');
    await expect(targetGroupSelect).toBeVisible({ timeout: 5000 });
    await targetGroupSelect.click();
    await page.click('div[role="presentation"] >> text=Khách mua sỉ');

    // Select discount type -> Percentage and enter 15% inside dialog
    await dialog.locator('input[placeholder="10"]').fill("15");

    // Click Submit inside dialog
    await dialog.locator('button:has-text("Kích hoạt")').click();

    // Verify it is created in the table
    await expect(page.locator("body")).toContainText("Wholesale Mega Deal", { timeout: 10000 });

    // 3. Navigate to POS to check segmentation auto-apply rules
    await page.goto("/pos");
    
    // Add product "Thẻ QR cá nhân thông minh"
    await page.waitForSelector(".grid >> text=Thẻ QR");
    await page.click("text=Thẻ QR cá nhân thông minh");

    // Selected customer is walk-in (no wholesale tệp) -> Wholesale Mega Deal should NOT apply
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).not.toContainText("Wholesale Mega Deal");

    // Now select "Cửa hàng Thời trang BlueSky" as the customer
    const searchCustomerInput = page.locator('input[placeholder="Tìm khách hàng (tên, SĐT, mã)..."]');
    await expect(searchCustomerInput).toBeVisible({ timeout: 5000 });
    await searchCustomerInput.fill("BlueSky");
    await page.waitForTimeout(600);

    // Open customer select dropdown
    const customerSelectTrigger = page.locator('div.space-y-2 button[role="combobox"]').first();
    await customerSelectTrigger.click();
    await page.waitForTimeout(500);

    // Select Cửa hàng Thời trang BlueSky
    await page.click('div[role="presentation"] >> text=Cửa hàng Thời trang BlueSky');

    // Trigger auto-apply evaluation
    await page.waitForTimeout(1500);

    // Verify that the Wholesale Mega Deal is now auto-applied because customer belongs to wholesale segment!
    await expect(page.locator("body")).toContainText("Tự động: Wholesale Mega Deal", { timeout: 10000 });

    // Discount value: 15% of 69k = 10,350đ
    const discountDisplay = page.locator("text=-10.350đ");
    await expect(discountDisplay).toBeVisible({ timeout: 5000 });
  });
});

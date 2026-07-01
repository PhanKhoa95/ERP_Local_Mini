import { test, expect } from "@playwright/test";
import { loginLocalDemo } from "./helpers";

test.describe("Category-Specific Promotions & Quick Customer E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 960 });
    
    // Standard Demo Login helper
    await loginLocalDemo(page);
  });

  test("should support adding customer directly from POS and apply category-restricted promotions", async ({ page }) => {
    // Increase test timeout to ensure slow animations don't trigger timeout
    test.setTimeout(60000);

    // 1. Navigate to Promotions page to create a Category-Specific Promotion
    // Target: "Vat tu & Muc in" category, Auto-Apply: true, Discount: 20%
    await page.goto("/promotions");
    await page.click("text=Tạo chiến dịch");

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill campaign details
    await dialog.locator('input[placeholder="Ví dụ: Ưu đãi ngày hè, Giảm giá cuối tháng..."]').fill("Material Special 20%");
    
    // Toggle auto-apply
    const autoApplySwitch = dialog.locator('button[role="switch"]').first();
    await autoApplySwitch.click();

    // Select target category: Vat tu & Muc in
    const categorySelect = dialog.locator('div.space-y-2:has-text("Nhóm ngành hàng áp dụng") button');
    await expect(categorySelect).toBeVisible({ timeout: 5000 });
    await categorySelect.click();
    await page.click('div[role="presentation"] >> text=Vat tu & Muc in');

    // Select discount type: Percentage and enter 20%
    await dialog.locator('input[placeholder="10"]').fill("20");

    // Click Submit (Kích hoạt)
    await dialog.locator('button:has-text("Kích hoạt")').click();

    // Verify it is created in the table
    await expect(page.locator("body")).toContainText("Material Special 20%", { timeout: 10000 });

    // 2. Navigate to POS
    await page.goto("/pos");
    await page.waitForSelector(".grid >> text=Thẻ QR");

    // Click "+" button next to customer search input to quick add customer
    const plusBtn = page.locator('button[title="Thêm khách hàng mới"]');
    await expect(plusBtn).toBeVisible({ timeout: 5000 });
    await plusBtn.click();

    // Fill partner creation fields inside the quick add dialog
    const partnerDialog = page.locator('div[role="dialog"]');
    await expect(partnerDialog).toBeVisible({ timeout: 5000 });
    await partnerDialog.locator('input#code').fill("KH-QUICK-POS");
    await partnerDialog.locator('input#name').fill("Khách Hàng POS Mới");
    
    // Click Kích hoạt inside dialog
    await partnerDialog.locator('button:has-text("Kích hoạt")').click();

    // Wait for the success toast and check that customer is auto-selected in the POS combobox
    await expect(page.locator("text=Thêm đối tác thành công").first()).toBeVisible({ timeout: 10000 });
    const selectedCustomerValue = page.locator('div.space-y-2 button[role="combobox"]').first();
    await expect(selectedCustomerValue).toContainText("Khách Hàng POS Mới", { timeout: 10000 });

    // 3. Add products to cart:
    // Product 1: "Thẻ QR cá nhân thông minh" (Category: "Thanh pham", Price: 69,000đ)
    await page.click("text=Thẻ QR cá nhân thông minh");
    await page.waitForTimeout(500);

    // Verify subtotal is 69k and NO discount applies (since category is "Thanh pham", not "Vat tu & Muc in")
    await expect(page.locator("body")).not.toContainText("Material Special 20%");

    // Product 2: "Giấy decal bóng (A4)" (Category: "Vat tu & Muc in", Price: 3,000đ)
    // Scroll down to click if needed, or filter
    const searchProdInput = page.locator('input[placeholder="Tìm sản phẩm theo tên hoặc mã SKU..."]');
    await searchProdInput.fill("decal");
    await page.waitForTimeout(500);
    await page.click("text=Giấy decal bóng (A4)");
    await page.waitForTimeout(500);

    // Verify that the "Material Special 20%" promotion is auto-applied!
    await expect(page.locator("body")).toContainText("Material Special 20%", { timeout: 10000 });

    // Verify discount value is calculated ONLY on the matching category product:
    // 20% of 3,000đ = 600đ (not 20% of 72,000đ = 14,400đ!)
    const discountDisplay = page.locator("text=-600đ");
    await expect(discountDisplay).toBeVisible({ timeout: 5000 });

    // 4. Perform a checkout using Tiền mặt
    await page.click('button:has-text("Tiền mặt")');

    // Wait for the success toast
    await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });
  });
});

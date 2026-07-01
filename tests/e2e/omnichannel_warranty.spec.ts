import { test, expect } from "@playwright/test";
import { loginLocalDemo } from "./helpers";

test.describe("Omnichannel Auto-Profiling & Warranty E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 960 });
    
    // Standard Demo Login helper
    await loginLocalDemo(page);
  });

  test("should support background auto-profiling, omnichannel matching, and warranty tracking", async ({ page }) => {
    test.setTimeout(60000);

    // Step 1: Place an order in POS for a completely new customer who left only Name and Phone
    await page.goto("/pos");
    await page.waitForSelector(".grid >> text=Thẻ QR");

    // Add a warranty-eligible product to cart: "Thẻ QR cá nhân thông minh"
    await page.click("text=Thẻ QR cá nhân thông minh");
    await page.waitForTimeout(500);

    // Click "+" button next to customer search input to quick add customer
    const plusBtn = page.locator('button[title="Thêm khách hàng mới"]');
    await expect(plusBtn).toBeVisible({ timeout: 5000 });
    await plusBtn.click();

    const partnerDialog = page.locator('div[role="dialog"]');
    await expect(partnerDialog).toBeVisible({ timeout: 5000 });
    await partnerDialog.locator('input#name').fill("Khách Hàng Ẩn Danh");
    await partnerDialog.locator('input#phone').fill("0988777666");
    await partnerDialog.locator('button:has-text("Kích hoạt")').click();

    // Verify success toast and auto-selection
    await expect(page.locator("text=Thêm đối tác thành công").first()).toBeVisible({ timeout: 10000 });
    const selectedCustomerCombo = page.locator('div.space-y-2 button[role="combobox"]').first();
    await expect(selectedCustomerCombo).toContainText("Khách Hàng Ẩn Danh", { timeout: 10000 });

    // Checkout order
    await page.click('button:has-text("Tiền mặt")');
    await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });

    // Step 2: Navigate to Partner management to see if customer profile exists
    await page.goto("/partners");
    await page.waitForSelector("text=Thêm mới");

    // Search for the newly auto-profiled customer
    const searchInput = page.locator('input[placeholder="Tìm kiếm..."]').first();
    await searchInput.fill("0988777666");
    await page.waitForTimeout(500);

    // Verify profile is listed in table/cards
    const card = page.locator('.hover\\:shadow-md', { hasText: 'Khách Hàng Ẩn Danh' });
    await expect(card).toBeVisible({ timeout: 5000 });

    // Step 3: Place another order in POS searching for the existing customer "0988777666"
    await page.goto("/pos");
    await page.waitForSelector(".grid >> text=Thẻ QR");

    // Add another product: "Thẻ QR cá nhân thông minh"
    await page.click("text=Thẻ QR cá nhân thông minh");
    await page.waitForTimeout(500);

    // Search for "0988777666" in customer selection combobox
    const customerCombo = page.locator('div.space-y-2 button[role="combobox"]').first();
    await customerCombo.click();
    const searchComboInput = page.locator('input[placeholder="Tìm đối tác..."]');
    await searchComboInput.fill("0988777666");
    await page.waitForTimeout(500);
    // Click the matching result
    await page.click('div[role="option"]:has-text("0988777666")');

    // Checkout
    await page.click('button:has-text("Tiền mặt")');
    await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });

    // Step 4: Open profile details to inspect behavioral insights and active warranties!
    await page.goto("/partners");
    await page.waitForSelector("text=Thêm mới");
    await searchInput.fill("0988777666");
    await page.waitForTimeout(500);

    // Open detail dialog
    const targetCard = page.locator('.hover\\:shadow-md', { hasText: 'Khách Hàng Ẩn Danh' });
    await targetCard.locator('button:has-text("Chi tiết")').click();

    const detailDialog = page.locator('div[role="dialog"]');
    await expect(detailDialog).toBeVisible({ timeout: 5000 });

    // Click "Bảo hành & CS" Tab trigger
    await page.click('button[role="tab"]:has-text("Bảo hành & CS")');
    await page.waitForTimeout(500);

    // Verify Warranty card is rendered and contains the purchased items
    await expect(detailDialog).toContainText("Theo dõi bảo hành sản phẩm");
    await expect(detailDialog).toContainText("Thẻ QR cá nhân thông minh");
    await expect(detailDialog).toContainText("Còn hạn"); // Expiration is 12 months in the future so it must be active!

    // Verify buyer policies are listed
    await expect(detailDialog).toContainText("Chính sách mua hàng");
    await expect(detailDialog).toContainText("Đổi trả 7 ngày");
  });
});

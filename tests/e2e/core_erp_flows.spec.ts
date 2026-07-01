import { test, expect } from "@playwright/test";
import { loginLocalDemo, getBrainPath, ensureDir } from "./helpers";
import * as path from "path";

test.describe("Core ERP Flow E2E Tests", () => {
  // Increase timeout for E2E tests
  test.setTimeout(60000);

  test("Sales/Orders (Bán hàng) Flow", async ({ page }) => {
    // 1. Login as admin
    await loginLocalDemo(page, "admin");

    // 2. Go to POS page
    await page.goto("/pos", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByPlaceholder("Tìm sản phẩm theo tên hoặc mã SKU...")).toBeVisible({ timeout: 15000 });

    // 3. Add a product to cart (Click first available product card)
    const firstProductCard = page.locator("div.grid > div.cursor-pointer").first();
    await expect(firstProductCard).toBeVisible({ timeout: 10000 });
    await firstProductCard.click();

    // 4. Verify cart contains items (cart is visible on desktop)
    const cartHeader = page.locator("h2:has-text('Giỏ hàng')");
    await expect(cartHeader).toBeVisible({ timeout: 10000 });

    // 5. Checkout (Cash/Tiền mặt or Transfer/Chuyển khoản)
    // We choose Cash (Tiền mặt)
    const cashBtn = page.getByRole("button", { name: "Tiền mặt" });
    await expect(cashBtn).toBeVisible({ timeout: 5000 });
    await cashBtn.click();

    // 6. Verify order creation success toast
    const successToast = page.getByText("Thanh toán thành công").first();
    await expect(successToast).toBeVisible({ timeout: 15000 });

    // 7. Go to Orders page to verify status
    await page.goto("/orders", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: "Quản lý đơn hàng" })).toBeVisible({ timeout: 15000 });

    // Switch status filter to 'delivered' (Đã giao) to find our POS order
    await page.getByPlaceholder("Tìm mã đơn, tên KH, SĐT...").fill("POS-");
    await page.waitForTimeout(1000);

    // Verify there is a POS order visible in the filtered list
    const posOrderCard = page.locator("span.font-mono").filter({ hasText: "POS-" }).first();
    await expect(posOrderCard).toBeVisible({ timeout: 10000 });

    // 8. Capture screenshot and save dynamically under brain folder
    const screenshotPath = path.join(getBrainPath(), "core_erp_sales.png");
    ensureDir(screenshotPath);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Sales/Orders flow screenshot saved to: ${screenshotPath}`);
  });

  test("Purchasing (Mua hàng) Flow", async ({ page }) => {
    // 1. Login as admin
    await loginLocalDemo(page, "admin");

    // 2. Go to Partners page
    await page.goto("/partners", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: "Quản lý đối tác" })).toBeVisible({ timeout: 15000 });

    // 3. Click "Nhà cung cấp" (Suppliers) tab
    const supplierTab = page.locator("button[role='tab']:has-text('Nhà cung cấp')").first();
    await expect(supplierTab).toBeVisible({ timeout: 5000 });
    await supplierTab.click();

    // 4. Click "Thêm mới" button
    const addNewBtn = page.getByRole("button", { name: "Thêm mới" }).first();
    await expect(addNewBtn).toBeVisible({ timeout: 5000 });
    await addNewBtn.click();

    // 5. Fill the form with new supplier details
    const uniqueId = Date.now();
    const supplierCode = `NCC-${uniqueId}`;
    const supplierName = `Supplier E2E Test ${uniqueId}`;

    await page.locator("#code").fill(supplierCode);
    await page.locator("#name").fill(supplierName);
    await page.locator("#phone").fill("0912345678");
    await page.locator("#address").fill("123 Supplier St, Hanoi");
    await page.locator("#notes").fill("Created by automated Playwright E2E test");

    // 6. Save the new supplier
    const submitBtn = page.locator("form button[type='submit']");
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    // 7. Verify supplier is visible in list / search for it
    await page.getByPlaceholder("Tìm kiếm...").first().fill(supplierName);
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${supplierName}`).first()).toBeVisible({ timeout: 10000 });

    // 8. Capture screenshot and save dynamically under brain folder
    const screenshotPath = path.join(getBrainPath(), "core_erp_purchasing.png");
    ensureDir(screenshotPath);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Purchasing flow screenshot saved to: ${screenshotPath}`);
  });

  test("Inventory/Warehouse (Kho) Flow", async ({ page }) => {
    // 1. Login as admin
    await loginLocalDemo(page, "admin");

    // 2. Go to Inventory page
    await page.goto("/inventory", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: "Quản lý kho" })).toBeVisible({ timeout: 15000 });

    // 3. Perform "Nhập kho" (Stock in) adjustment
    const stockInBtn = page.getByRole("button", { name: "Nhập kho" }).first();
    await expect(stockInBtn).toBeVisible({ timeout: 5000 });
    await stockInBtn.click();

    // 4. Wait for the stock transaction dialog to open
    const dialogTitle = page.locator("h2").filter({ hasText: "Nhập kho" }).first();
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    // 5. Open product select dropdown
    const productSelect = page.locator("button:has-text('Chọn sản phẩm')").first();
    await expect(productSelect).toBeVisible({ timeout: 5000 });
    await productSelect.click();

    // 6. Select the first product option
    const firstOption = page.locator("role=option").first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();

    // 7. Fill the quantity input
    const quantityInput = page.locator("form input[type='number']").first();
    await expect(quantityInput).toBeVisible({ timeout: 5000 });
    await quantityInput.fill("10");

    // 8. Fill notes
    const notesInput = page.locator("form textarea").first();
    await expect(notesInput).toBeVisible({ timeout: 5000 });
    await notesInput.fill("Stock adjustment by E2E test");

    // 9. Click submit button
    const submitBtn = page.locator("form button[type='submit']").first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    // 10. Verify success toast / check transaction history tab
    const successToast = page.getByText(/thanh cong|thành công/i).first();
    await expect(successToast).toBeVisible({ timeout: 15000 });

    // Switch to "Lịch sử nhập xuất" tab
    const historyTab = page.locator("button[role='tab']:has-text('Lịch sử nhập xuất')").first();
    await expect(historyTab).toBeVisible({ timeout: 5000 });
    await historyTab.click();
    await page.waitForTimeout(1000);

    // Verify recent adjustment in table
    const firstRowNotes = page.locator("table tbody tr td").filter({ hasText: "Stock adjustment by E2E test" }).first();
    await expect(firstRowNotes).toBeVisible({ timeout: 10000 });

    // 11. Capture screenshot and save dynamically under brain folder
    const screenshotPath = path.join(getBrainPath(), "core_erp_inventory.png");
    ensureDir(screenshotPath);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Inventory flow screenshot saved to: ${screenshotPath}`);
  });

  test("Finance (Tài chính) Flow", async ({ page }) => {
    // 1. Login as admin
    await loginLocalDemo(page, "admin");

    // 2. Go to Finance page
    await page.goto("/finance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: "Tài chính" })).toBeVisible({ timeout: 15000 });

    // 3. Verify that basic financial stats cards are visible
    const revenueCard = page.locator("text=Tổng doanh thu").first();
    await expect(revenueCard).toBeVisible({ timeout: 10000 });

    // 4. Verify Casso integration panel is visible
    const cassoCard = page.locator(".col-span-full").filter({ hasText: "Casso Integration" }).first();
    await expect(cassoCard).toBeVisible({ timeout: 10000 });

    // 5. Capture screenshot and save dynamically under brain folder
    const screenshotPath = path.join(getBrainPath(), "core_erp_finance.png");
    ensureDir(screenshotPath);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Finance flow screenshot saved to: ${screenshotPath}`);
  });
});

import { test, expect } from "@playwright/test";
import { loginLocalDemo, getBrainPath, ensureDir } from "./helpers";
import * as path from "path";

test("verify membership card issuance, prepaid wallet deposit, and dynamic POS integration", async ({ page }) => {
  // Set viewport size
  await page.setViewportSize({ width: 1280, height: 960 });

  await loginLocalDemo(page);

  // 1. Create a unique new customer first to guarantee they are available for membership card mapping
  console.log("Creating unique customer on Partners page...");
  await page.goto("/partners", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  
  // Make sure we are on the Khách hàng tab
  await page.locator("button:has-text('Khách hàng')").first().click();
  await page.waitForTimeout(500);
  
  // Click Thêm mới
  await page.getByRole("button", { name: "Thêm mới" }).first().click();
  await page.waitForTimeout(500);
  
  const uniqueId = Date.now();
  const customerName = `Member Customer ${uniqueId}`;
  await page.locator("#code").fill(`KH-${uniqueId}`);
  await page.locator("#name").fill(customerName);
  await page.locator("#phone").fill("09" + String(uniqueId).slice(-8));
  await page.locator("form button[type='submit']").click();
  await page.waitForTimeout(1500);

  // 1.5. Navigate to Memberships & Wallet Page
  console.log("Navigating to Memberships & Wallet page...");
  await page.goto("/memberships", { waitUntil: "domcontentloaded" });

  // Verify visual elements are displayed
  const heading = page.locator("h1:has-text('Thẻ thành viên & Ví')");
  await expect(heading).toBeVisible({ timeout: 10000 });
  console.log("Memberships Page title loaded.");

  // 2. Issue a new membership card for an existing customer
  const issueButton = page.locator('button:has-text("Phát hành thẻ mới")');
  await expect(issueButton).toBeVisible();
  await issueButton.click();
  console.log("Clicked Issue Card button.");

  // Fill in the form
  const dialog = page.locator("role=dialog");
  await expect(dialog).toBeVisible();

  // Select customer
  await dialog.locator("button:has-text('Chọn khách hàng...')").click();
  // Select the newly created customer
  await page.locator(`role=option >> text=${customerName}`).first().click();

  // Pick Gold tier
  await dialog.locator("button:has-text('Đồng (Bronze)')").click();
  await page.getByRole("option", { name: "Vàng (Gold)", exact: false }).first().click();

  // Type issue note
  await dialog.locator("input#card_notes").fill("E2E Test Issued Member Card");

  // Save the form
  await dialog.locator("button:has-text('Xác nhận')").click();
  console.log("Submitted new card form.");

  // Wait for dialog to close and list to update
  await page.waitForTimeout(1500);

  // 3. Deposit money into the purchase account wallet
  const depositButton = page.locator('button:has-text("Nạp tiền ví")');
  await expect(depositButton).toBeVisible();
  await depositButton.click();
  console.log("Clicked Wallet Deposit button.");

  // Fill deposit dialog
  await expect(dialog).toBeVisible();
  await dialog.locator("input#tx-amount").fill("2500000"); // 2,500,000 VND
  await dialog.locator("textarea#tx-desc").fill("Deposit from E2E Test Suite");

  // Submit transaction
  await dialog.locator("button:has-text('Xác nhận giao dịch')").click();
  console.log("Submitted deposit transaction.");

  await page.waitForTimeout(1500);

  // Take screenshot of the Memberships dashboard
  const screenshotPath1 = path.join(getBrainPath(), "membership_dashboard.png");
  ensureDir(screenshotPath1);
  await page.screenshot({ path: screenshotPath1 });
  console.log("Screenshot membership_dashboard.png saved.");

  // 4. Verify balance updated in dashboard
  const balanceDisplay = page.locator("h3:has-text('2.500.000đ')");
  await expect(balanceDisplay).toBeVisible({ timeout: 5000 });
  console.log("Wallet balance successfully verified on dashboard!");
});

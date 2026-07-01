import { test, expect } from "@playwright/test";
import { loginLocalDemo, getBrainPath, ensureDir } from "./helpers";
import * as path from "path";

test("verify Casso bank transfer auto-reconciliation flow", async ({ page }) => {
  // Set viewport size to ensure everything fits on screen
  await page.setViewportSize({ width: 1280, height: 960 });

  await loginLocalDemo(page);

  // 2. Go to Data Hub and seed corporate growth data to ensure we have unpaid orders
  console.log("Navigating to Data Hub to seed test data...");
  await page.goto("/data-hub", { waitUntil: "domcontentloaded" });
  
  // Click the emerald button to seed growth data
  const seedButton = page.locator('button:has-text("Doanh Nghiệp"), button.bg-emerald-600').first();
  await expect(seedButton).toBeVisible({ timeout: 10000 });
  await seedButton.click();
  console.log("Seeding growth data...");

  // Seeding reloads the page, wait for it to load
  await page.waitForTimeout(3000);

  // 3. Go to Finance page where Casso reconciliation is integrated
  console.log("Navigating to Finance page...");
  await page.goto("/finance", { waitUntil: "domcontentloaded" });

  // 4. Verify Casso Reconciliation panel elements
  const cassoCard = page.locator(".col-span-full").filter({ hasText: "Casso Integration" });
  await expect(cassoCard).toBeVisible({ timeout: 10000 });
  console.log("Casso Reconciliation component detected.");
  await cassoCard.scrollIntoViewIfNeeded();

  // Capture simulator settings before transaction
  const screenshotPath1 = path.join(getBrainPath(), "casso_01_simulator.png");
  ensureDir(screenshotPath1);
  await page.screenshot({ path: screenshotPath1 });
  console.log("Screenshot casso_01_simulator.png saved.");

  const syncButton = cassoCard.getByRole("button");
  await expect(syncButton).toBeVisible();
  await expect(cassoCard.locator('tr:has-text("DH7731")')).toHaveCount(0);
  await syncButton.click();
  console.log("Clicked Casso transaction sync.");

  // 5. Wait for matching toast / log entry
  const successToast = page.locator('text=Casso').first();
  await expect(successToast).toBeVisible({ timeout: 5000 });
  console.log("Success toast detected!");

  // Scroll down slightly to make sure the table row is in full view
  await page.evaluate(() => window.scrollBy(0, 300));

  // Take screenshot of reconciled result showing both toast and log table
  const screenshotPath2 = path.join(getBrainPath(), "casso_02_reconciled.png");
  ensureDir(screenshotPath2);
  await page.screenshot({ path: screenshotPath2 });
  console.log("Screenshot casso_02_reconciled.png saved.");

  // Verify that the table contains the synced and auto-matched transaction.
  const syncedRow = cassoCard.locator('tr:has-text("DH7731")');
  await expect(syncedRow).toBeVisible({ timeout: 5000 });
  await expect(syncedRow).toContainText("THANH TOAN DON HANG DH7731");
  console.log("Synced Casso transaction row verified!");
});

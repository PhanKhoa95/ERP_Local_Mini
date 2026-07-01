import { test, expect } from "@playwright/test";
import { loginLocalDemo, getBrainPath, ensureDir } from "./helpers";
import * as path from "path";
import { format, subDays } from "date-fns";

test("verify global date filter synchronization between Reports and Accounting", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 960 });

  // 1. Log in
  await loginLocalDemo(page);

  // 2. Go to Reports page
  console.log("Navigating to Reports page...");
  await page.goto("/reports", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 3. Find the global date filter select/trigger in the Header
  const globalFilterSelect = page.locator('button[role="combobox"]').first();
  await expect(globalFilterSelect).toBeVisible({ timeout: 10000 });
  await globalFilterSelect.click();
  await page.waitForTimeout(1000);

  // 4. Select "30 ngày qua" preset
  const option = page.locator('div[role="option"]:has-text("30 ngày qua"), span:has-text("30 ngày qua")').first();
  await option.click();
  await page.waitForTimeout(1500);

  // 5. Verify the date display in header matches the calculation (30 days ago to today)
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  const expectedRangeText = `${format(thirtyDaysAgo, "yyyy-MM-dd")} đến ${format(today, "yyyy-MM-dd")}`;
  console.log(`Expected Date range display: ${expectedRangeText}`);

  const rangeDisplay = page.locator(`text=${expectedRangeText}`).first();
  await expect(rangeDisplay).toBeVisible({ timeout: 5000 });
  console.log("Global date range displayed in Header verified!");

  // Take screenshot of reports
  const screenshotPath1 = path.join(getBrainPath(), "reports_global_filter.png");
  ensureDir(screenshotPath1);
  await page.screenshot({ path: screenshotPath1 });
  console.log("Screenshot reports_global_filter.png saved.");

  // 6. Navigate to Accounting page
  console.log("Navigating to Accounting page...");
  await page.goto("/accounting", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 7. Verify local date input fields are synchronized to the exact date range
  const startInput = page.locator('input[type="date"]').first();
  const endInput = page.locator('input[type="date"]').nth(1);

  await expect(startInput).toHaveValue(format(thirtyDaysAgo, "yyyy-MM-dd"));
  await expect(endInput).toHaveValue(format(today, "yyyy-MM-dd"));
  console.log("Accounting page date inputs correctly synchronized!");

  // Take screenshot of Accounting page
  const screenshotPath2 = path.join(getBrainPath(), "accounting_global_filter.png");
  ensureDir(screenshotPath2);
  await page.screenshot({ path: screenshotPath2 });
  console.log("Screenshot accounting_global_filter.png saved.");
});

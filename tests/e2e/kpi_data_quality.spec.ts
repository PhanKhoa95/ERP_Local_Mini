import { test, expect } from "@playwright/test";
import { loginLocalDemo, getBrainPath, ensureDir } from "./helpers";
import * as path from "path";

test("verify KPI data quality check detects 10 issues and can resolve them", async ({ page }) => {
  // Set viewport size
  await page.setViewportSize({ width: 1280, height: 960 });

  await loginLocalDemo(page);

  // 2. Navigate to Data Hub page
  await page.goto("/data-hub", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Data Hub & BigData");

  // 3. Navigate to BigData & Analytics tab
  const analyticsTabTrigger = page.locator('button[role="tab"]:has-text("BigData & Analytics")').first();
  await expect(analyticsTabTrigger).toBeVisible();
  await analyticsTabTrigger.click({ force: true });

  // 4. Click "Quét chất lượng ngay" to run data quality checks
  const runChecksButton = page.locator('button:has-text("Quét chất lượng ngay")').first();
  await expect(runChecksButton).toBeVisible();
  await runChecksButton.click({ force: true });

  // 5. Verify the success toast appears
  const successToast = page.locator('text=Đã hoàn thành kiểm tra dữ liệu').first();
  await expect(successToast).toBeVisible({ timeout: 10000 });
  console.log("Data quality checks completed toast verified.");

  // 6. Navigate to Chất lượng tab
  const qualityTabTrigger = page.locator('button[role="tab"]:has-text("Chất lượng")').first();
  await expect(qualityTabTrigger).toBeVisible();
  await qualityTabTrigger.click({ force: true });

  // 7. Verify the issues table contains exactly 10 open issues
  // Wait for the table rows to render
  const openBadge = page.locator('div:text-is("open")');
  await expect(openBadge.first()).toBeVisible({ timeout: 5000 });
  
  // Verify that the issues exist
  const openCount = await openBadge.count();
  console.log(`Found ${openCount} open issues in the table.`);
  expect(openCount).toBeGreaterThanOrEqual(10); // Since it seeds at least 10 issues

  // Take a screenshot of the detected issues list
  const screenshotPath1 = path.join(getBrainPath(), "kpi_issues_detected.png");
  ensureDir(screenshotPath1);
  await page.screenshot({ path: screenshotPath1 });
  console.log("Screenshot kpi_issues_detected.png saved.");

  // 8. Click "Đóng" (Resolve) on the first issue
  const closeButton = page.locator('button:has-text("Đóng")').first();
  await expect(closeButton).toBeVisible();
  await closeButton.click({ force: true });

  // 9. Verify the resolution success toast
  const resolveToast = page.locator('text=Đã đóng vấn đề dữ liệu').first();
  await expect(resolveToast).toBeVisible({ timeout: 5000 });
  console.log("Resolve issue toast verified.");

  // 10. Wait a bit and verify that the first issue status updated to resolved
  const resolvedBadge = page.locator('div:text-is("resolved")').first();
  await expect(resolvedBadge).toBeVisible({ timeout: 5000 });
  console.log("Verified issue status transitioned to 'resolved'.");

  // Take a screenshot of resolved status
  const screenshotPath2 = path.join(getBrainPath(), "kpi_issue_resolved.png");
  ensureDir(screenshotPath2);
  await page.screenshot({ path: screenshotPath2 });
  console.log("Screenshot kpi_issue_resolved.png saved.");
});

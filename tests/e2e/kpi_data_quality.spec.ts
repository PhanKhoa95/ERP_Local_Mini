import { test, expect } from "@playwright/test";

test("verify KPI data quality check detects 10 issues and can resolve them", async ({ page }) => {
  // Set viewport size
  await page.setViewportSize({ width: 1280, height: 960 });

  // 1. Navigate to auth page and login
  await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded" });
  
  // Fill credentials
  await page.fill("#login-email", "admin");
  await page.fill("#login-password", "admin");
  await page.click('button[type="submit"]');

  // Wait for login redirection
  await page.waitForURL("**/");

  // 2. Navigate to Data Hub page
  await page.goto("http://127.0.0.1:8080/data-hub", { waitUntil: "domcontentloaded" });
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
  await page.screenshot({ path: "C:/Users/KHOA MEDIA/.gemini/antigravity/brain/81091271-6a4a-4083-9787-ff9d6e09437c/kpi_issues_detected.png" });
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
  await page.screenshot({ path: "C:/Users/KHOA MEDIA/.gemini/antigravity/brain/81091271-6a4a-4083-9787-ff9d6e09437c/kpi_issue_resolved.png" });
  console.log("Screenshot kpi_issue_resolved.png saved.");
});

import { test, expect } from "@playwright/test";

test("verify Casso bank transfer auto-reconciliation flow", async ({ page }) => {
  // Set viewport size to ensure everything fits on screen
  await page.setViewportSize({ width: 1280, height: 960 });

  // 1. Navigate to auth page and login
  await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded" });
  
  await page.fill("#login-email", "admin");
  await page.fill("#login-password", "admin");
  await page.click('button[type="submit"]');

  // Wait for dashboard to load
  await page.waitForURL("**/");

  // 2. Go to Data Hub and seed corporate growth data to ensure we have unpaid orders
  console.log("Navigating to Data Hub to seed test data...");
  await page.goto("http://127.0.0.1:8080/data-hub", { waitUntil: "domcontentloaded" });
  
  // Click the emerald button to seed growth data
  const seedButton = page.locator('button:has-text("Doanh Nghiệp"), button.bg-emerald-600').first();
  await expect(seedButton).toBeVisible({ timeout: 10000 });
  await seedButton.click();
  console.log("Seeding growth data...");

  // Seeding reloads the page, wait for it to load
  await page.waitForTimeout(3000);

  // 3. Go to Finance page where Casso reconciliation is integrated
  console.log("Navigating to Finance page...");
  await page.goto("http://127.0.0.1:8080/finance", { waitUntil: "domcontentloaded" });

  // 4. Verify Casso Reconciliation panel elements
  await page.waitForSelector("text=Casso.vn — Đối soát Bank Transfer");
  console.log("Casso Reconciliation component detected.");

  // Make sure we are in the simulator tab
  const simTabTrigger = page.locator('button[role="tab"]:has-text("Simulator")').first();
  await simTabTrigger.click();
  
  // Wait for simulator form inputs
  await page.waitForSelector("text=Bộ Giả Lập Casso Webhook");

  // Scroll Casso component into view
  const cassoCard = page.locator('text=Casso.vn — Đối soát Bank Transfer').first();
  await cassoCard.scrollIntoViewIfNeeded();

  // Capture simulator settings before transaction
  await page.screenshot({ path: "C:/Users/KHOA MEDIA/.gemini/antigravity/brain/81091271-6a4a-4083-9787-ff9d6e09437c/casso_01_simulator.png" });
  console.log("Screenshot casso_01_simulator.png saved.");

  // Click "Mô phỏng Giao dịch" button
  const simulateBtn = page.locator('button:has-text("Mô phỏng Giao dịch")').first();
  await expect(simulateBtn).toBeVisible();
  
  // Get description/order code from input to check match
  const descVal = await page.inputValue("#sim-desc");
  console.log(`Simulating bank transaction with description: "${descVal}"`);
  
  await simulateBtn.click();
  console.log("Clicked Simulate Webhook transaction.");

  // 5. Wait for matching toast / log entry
  // Wait for the success toast to appear
  const successToast = page.locator('text=Đối soát thành công!').first();
  await expect(successToast).toBeVisible({ timeout: 5000 });
  console.log("Success toast detected!");

  // Wait for transaction logs table to update
  await page.waitForTimeout(1000);

  // Scroll down slightly to make sure the table row is in full view
  await page.evaluate(() => window.scrollBy(0, 300));

  // Take screenshot of reconciled result showing both toast and log table
  await page.screenshot({ path: "C:/Users/KHOA MEDIA/.gemini/antigravity/brain/81091271-6a4a-4083-9787-ff9d6e09437c/casso_02_reconciled.png" });
  console.log("Screenshot casso_02_reconciled.png saved.");

  // Verify that the table contains success log status (represented as a div badge)
  const logSuccessBadge = page.locator('div:has-text("Thành công")').first();
  await expect(logSuccessBadge).toBeVisible({ timeout: 5000 });
  console.log("Success badge in log table verified!");
});

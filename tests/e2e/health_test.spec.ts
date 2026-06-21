import { test, expect } from "@playwright/test";

test("verify system health dashboard and data injection", async ({ page }) => {
  // 1. Navigate to auth page and login
  await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded" });
  
  // Fill username and password
  await page.fill("#login-email", "admin");
  await page.fill("#login-password", "admin");
  await page.click('button[type="submit"]');

  // 2. Wait for navigation and verify dashboard is loaded
  await page.waitForURL("**/");
  
  // 3. Navigate to settings
  await page.goto("http://127.0.0.1:8080/settings", { waitUntil: "domcontentloaded" });

  // 4. Click health tab trigger
  await page.locator('role=tab >> text=Sức khỏe').first().click();

  // 5. Verify the health check page elements are present
  await page.waitForSelector("text=NestJS Terminus Status");

  // 6. Click load test button to enable continuous injection
  // Target specifically the button inside the flex-col container for the load test
  const loadTestButton = page.locator('div.flex-col:has-text("Nhồi Dữ Liệu Liên Tục") >> button').first();
  
  // Verify load test state and turn it on if it's off
  const isInjectingActive = await page.locator('text=Locust: 50 concurrent req/s').isVisible();
  if (!isInjectingActive) {
    await loadTestButton.click();
    console.log("Clicked Load Test button.");
    // Wait for injection logs to appear in Locust console
    await page.waitForTimeout(2000);
  } else {
    console.log("Load Test button already active.");
  }

  // Wait for the CPU usage in UI to go above 50% to ensure metrics have updated and synced
  console.log("Waiting for CPU usage to exceed 50%...");
  await expect(async () => {
    const cpuText = await page.locator('span.text-2xl:has-text("%")').first().textContent();
    const cpuVal = parseFloat(cpuText?.replace("%", "") || "0");
    console.log(`Current UI CPU Usage: ${cpuVal}%`);
    expect(cpuVal).toBeGreaterThan(50);
  }).toPass({ timeout: 10000 });

  // 7. Toggle DB status to DOWN (simulate DB offline)
  const dbSwitch = page.locator('div:has-text("Cơ sở dữ liệu ERP") >> button[role="switch"]').first();
  const isChecked = await dbSwitch.getAttribute("aria-checked") === "true";
  
  // If it's checked (database online), click it to disconnect
  if (isChecked) {
    await dbSwitch.click();
    console.log("Clicked DB disconnect switch.");
    await page.waitForTimeout(1000);
  }

  // 8. Wait for status to reflect offline (Error 503 should be displayed)
  await page.waitForSelector("text=Error 503");

  // 9. Take a screenshot and save it to the specified path
  await page.screenshot({ path: "C:/Users/KHOA MEDIA/.gemini/antigravity/brain/81091271-6a4a-4083-9787-ff9d6e09437c/system_health_verified.png" });
  console.log("Screenshot saved.");

  // 10. Turn DB status back ON to leave system healthy
  await dbSwitch.click();
  await page.waitForSelector("text=Online 200");
  await page.waitForTimeout(1000);

  // 11. Navigate directly to /health and check the JSON content
  const response = await page.goto("http://127.0.0.1:8080/health", { waitUntil: "domcontentloaded" });
  const text = await response?.text();
  console.log("Terminus Health JSON response:", text);

  // Parse the JSON
  const json = JSON.parse(text || "{}");
  expect(json.status).toBe("ok");
  expect(json.details.database.status).toBe("up");
  expect(json.details.cpu_load.percentage).toBeGreaterThan(50); // should be high due to injection
});

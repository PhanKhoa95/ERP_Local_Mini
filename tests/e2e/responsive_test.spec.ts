import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureResponsiveScreenshot(page, pageName: string, device: "desktop" | "mobile") {
  const paths = [
    `c:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/artifacts/responsive/${pageName}_${device}.png`,
    `C:/Users/KHOA MEDIA/.gemini/antigravity/brain/81091271-6a4a-4083-9787-ff9d6e09437c/responsive/${pageName}_${device}.png`
  ];

  for (const p of paths) {
    await ensureDir(p);
    await page.screenshot({ path: p, fullPage: true });
    console.log(`Responsive screenshot saved: ${p}`);
  }
}

test.describe("ERP Mini E2E Responsive Layout Verification", () => {
  // Common login function
  async function performLogin(page) {
    await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded" });
    
    // Set localStorage for Admin role to enable full access
    await page.evaluate(() => {
      localStorage.setItem("erp-mini-local-demo-role", "admin");
    });
    
    await page.fill("#login-email", "admin");
    await page.fill("#login-password", "admin");
    await page.click('button[type="submit"]');
    
    await page.waitForURL("**/");
  }

  // DESKTOP VIEWPORT TESTS
  test.describe("Desktop Viewport (1280x960)", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 1280, height: 960 });
    });

    test("Verify desktop layouts", async ({ page }) => {
      await performLogin(page);

      // 1. POS page
      await page.goto("http://127.0.0.1:8080/pos", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.getByPlaceholder("Tìm sản phẩm theo tên hoặc mã SKU...")).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "pos", "desktop");

      // 2. Orders page
      await page.goto("http://127.0.0.1:8080/orders", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('h1:has-text("Quản lý đơn hàng")').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "orders", "desktop");

      // 3. Public tracking page (does not require login)
      await page.goto("http://127.0.0.1:8080/order-tracking", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Tra cứu đơn hàng').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "order_tracking", "desktop");

      // 4. Public storefront page (does not require login)
      await page.goto("http://127.0.0.1:8080/public-order", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('header').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "public_order", "desktop");
    });
  });

  // MOBILE VIEWPORT TESTS
  test.describe("Mobile Viewport (375x812)", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 375, height: 812 });
    });

    test("Verify mobile layouts", async ({ page }) => {
      await performLogin(page);

      // 1. POS page
      await page.goto("http://127.0.0.1:8080/pos", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.getByPlaceholder("Tìm sản phẩm theo tên hoặc mã SKU...")).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "pos", "mobile");

      // 2. Orders page
      await page.goto("http://127.0.0.1:8080/orders", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('h1:has-text("Quản lý đơn hàng")').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "orders", "mobile");

      // 3. Public tracking page
      await page.goto("http://127.0.0.1:8080/order-tracking", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Tra cứu đơn hàng').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "order_tracking", "mobile");

      // 4. Public storefront page
      await page.goto("http://127.0.0.1:8080/public-order", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('header').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "public_order", "mobile");
    });
  });
});

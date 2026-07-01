import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { loginLocalDemo, getBrainPath, ensureDir } from "./helpers";

async function captureResponsiveScreenshot(page, pageName: string, device: "desktop" | "mobile") {
  const brainDir = getBrainPath();
  const paths = [
    path.join(brainDir, "responsive", `${pageName}_${device}.png`)
  ];

  for (const p of paths) {
    ensureDir(p);
    await page.screenshot({ path: p, fullPage: true });
    console.log(`Responsive screenshot saved: ${p}`);
  }
}

test.describe("ERP Mini E2E Responsive Layout Verification", () => {
  // Common login function
  async function performLogin(page) {
    await loginLocalDemo(page, "admin");
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
      await page.goto("/pos", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.getByPlaceholder("Tìm sản phẩm theo tên hoặc mã SKU...")).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "pos", "desktop");

      // 2. Orders page
      await page.goto("/orders", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('h1:has-text("Quản lý đơn hàng")').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "orders", "desktop");

      // 3. Public tracking page (does not require login)
      await page.goto("/order-tracking", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Tra cứu đơn hàng').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "order_tracking", "desktop");

      // 4. Public storefront page (does not require login)
      await page.goto("/public-order", { waitUntil: "domcontentloaded" });
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
      await page.goto("/pos", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.getByPlaceholder("Tìm sản phẩm theo tên hoặc mã SKU...")).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "pos", "mobile");

      // 2. Orders page
      await page.goto("/orders", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('h1:has-text("Quản lý đơn hàng")').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "orders", "mobile");

      // 3. Public tracking page
      await page.goto("/order-tracking", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Tra cứu đơn hàng').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "order_tracking", "mobile");

      // 4. Public storefront page
      await page.goto("/public-order", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await expect(page.locator('header').first()).toBeVisible({ timeout: 15000 });
      await captureResponsiveScreenshot(page, "public_order", "mobile");
    });
  });
});

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function takeScreenshots(page, role: string) {
  const paths = [
    `C:/Users/KHOA MEDIA/.gemini/antigravity/brain/81091271-6a4a-4083-9787-ff9d6e09437c/${role}_role_verified.png`,
    `c:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/artifacts/${role}_role_verified.png`,
    `c:/Users/KHOA MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/artifacts/${role}_role_verified.png`
  ];

  for (const p of paths) {
    await ensureDir(p);
    await page.screenshot({ path: p });
    console.log(`Screenshot saved to ${p}`);
  }
}

async function expandSidebar(page) {
  const sections = ["Kinh doanh", "Hiệu suất", "Tài liệu"];
  for (const title of sections) {
    const trigger = page.locator(`aside button:has-text("${title}")`);
    if (await trigger.isVisible()) {
      const state = await trigger.getAttribute("data-state");
      if (state === "closed") {
        await trigger.click();
        await page.waitForTimeout(500); // Wait for transition
      }
    }
  }
}

test.describe("ERP Mini E2E Role-based Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 });
  });

  test("Admin role permissions verification", async ({ page }) => {
    // Navigate to auth
    await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded" });
    
    // Set localStorage for Admin role
    await page.evaluate(() => {
      localStorage.setItem("erp-mini-local-demo-role", "admin");
    });
    
    // Log in
    await page.fill("#login-email", "admin");
    await page.fill("#login-password", "admin");
    await page.click('button[type="submit"]');
    
    // Wait for redirection
    await page.waitForURL("**/");
    
    // Expand sidebar to ensure all elements are visible
    await expandSidebar(page);
    
    // Verify Sidebar Visibility for Admin
    // POS (/pos), Orders (/orders), Documents (/documents), Workflows (/workflows),
    // Data Hub (/data-hub), Accounting (/accounting), Strategy Reports (/strategic-report),
    // Performance Setup (/performance/setup - title "Thiết lập") must all be VISIBLE.
    await expect(page.locator('aside a[href="/pos"]')).toBeVisible();
    await expect(page.locator('aside a[href="/orders"]')).toBeVisible();
    await expect(page.locator('aside a[href="/documents"]')).toBeVisible();
    await expect(page.locator('aside a[href="/workflows"]')).toBeVisible();
    await expect(page.locator('aside a[href="/data-hub"]')).toBeVisible();
    await expect(page.locator('aside a[href="/accounting"]')).toBeVisible();
    await expect(page.locator('aside a[href="/strategic-report"]')).toBeVisible();
    await expect(page.locator('aside a[href="/performance/setup"]')).toBeVisible();
    
    // Verify Direct URL Access: Admin has access to /performance/setup
    await page.goto("http://127.0.0.1:8080/performance/setup", { waitUntil: "domcontentloaded" });
    await expect(page.locator('h1:has-text("Không có quyền truy cập")')).toBeHidden();
    
    // Capture screenshots
    await takeScreenshots(page, "admin");
  });

  test("Manager role permissions verification", async ({ page }) => {
    // Navigate to auth
    await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded" });
    
    // Set localStorage for Manager role
    await page.evaluate(() => {
      localStorage.setItem("erp-mini-local-demo-role", "manager");
    });
    
    // Log in
    await page.fill("#login-email", "admin");
    await page.fill("#login-password", "admin");
    await page.click('button[type="submit"]');
    
    // Wait for redirection
    await page.waitForURL("**/");
    
    // Expand sidebar
    await expandSidebar(page);
    
    // Verify Sidebar Visibility for Manager
    // POS (/pos), Orders (/orders), Documents (/documents), Workflows (/workflows),
    // Data Hub (/data-hub), Accounting (/accounting), Strategy Reports (/strategic-report) must be VISIBLE.
    await expect(page.locator('aside a[href="/pos"]')).toBeVisible();
    await expect(page.locator('aside a[href="/orders"]')).toBeVisible();
    await expect(page.locator('aside a[href="/documents"]')).toBeVisible();
    await expect(page.locator('aside a[href="/workflows"]')).toBeVisible();
    await expect(page.locator('aside a[href="/data-hub"]')).toBeVisible();
    await expect(page.locator('aside a[href="/accounting"]')).toBeVisible();
    await expect(page.locator('aside a[href="/strategic-report"]')).toBeVisible();
    
    // Performance Setup (/performance/setup) must be HIDDEN
    await expect(page.locator('aside a[href="/performance/setup"]')).toBeHidden();
    
    // Verify Direct URL Access Blocking for Manager
    // /performance/setup shows "Không có quyền truy cập"
    await page.goto("http://127.0.0.1:8080/performance/setup", { waitUntil: "domcontentloaded" });
    await expect(page.locator('h1:has-text("Không có quyền truy cập")')).toBeVisible();
    
    // Capture screenshots
    await takeScreenshots(page, "manager");
  });

  test("Staff role permissions verification", async ({ page }) => {
    // Navigate to auth
    await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded" });
    
    // Set localStorage for Staff role
    await page.evaluate(() => {
      localStorage.setItem("erp-mini-local-demo-role", "staff");
    });
    
    // Log in
    await page.fill("#login-email", "admin");
    await page.fill("#login-password", "admin");
    await page.click('button[type="submit"]');
    
    // Wait for redirection
    await page.waitForURL("**/");
    
    // Expand sidebar
    await expandSidebar(page);
    
    // Verify Sidebar Visibility for Staff
    // POS (/pos), Orders (/orders), Documents (/documents) must be VISIBLE
    await expect(page.locator('aside a[href="/pos"]')).toBeVisible();
    await expect(page.locator('aside a[href="/orders"]')).toBeVisible();
    await expect(page.locator('aside a[href="/documents"]')).toBeVisible();
    
    // Workflows, Data Hub, Accounting, Strategy Reports, Performance Setup must be HIDDEN
    await expect(page.locator('aside a[href="/workflows"]')).toBeHidden();
    await expect(page.locator('aside a[href="/data-hub"]')).toBeHidden();
    await expect(page.locator('aside a[href="/accounting"]')).toBeHidden();
    await expect(page.locator('aside a[href="/strategic-report"]')).toBeHidden();
    await expect(page.locator('aside a[href="/performance/setup"]')).toBeHidden();
    
    // Verify Direct URL Access Blocking for Staff
    // /performance/setup shows "Không có quyền truy cập"
    await page.goto("http://127.0.0.1:8080/performance/setup", { waitUntil: "domcontentloaded" });
    await expect(page.locator('h1:has-text("Không có quyền truy cập")')).toBeVisible();
    
    // /accounting shows "Không có quyền truy cập"
    await page.goto("http://127.0.0.1:8080/accounting", { waitUntil: "domcontentloaded" });
    await expect(page.locator('h1:has-text("Không có quyền truy cập")')).toBeVisible();
    
    // Capture screenshots
    await takeScreenshots(page, "staff");
  });
});

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { loginLocalDemo, getBrainPath, ensureDir } from "../helpers";

async function takeScreenshots(page, role: string) {
  const brainDir = getBrainPath();
  const paths = [
    path.join(brainDir, `${role}_role_verified.png`)
  ];

  for (const p of paths) {
    ensureDir(p);
    await page.screenshot({ path: p });
    console.log(`Screenshot saved to ${p}`);
  }
}

async function expandSidebar(page) {
  // Recursively click all collapsible triggers until all sections are open
  const closedTriggers = page.locator('aside button[data-state="closed"]');
  let count = await closedTriggers.count();
  while (count > 0) {
    await closedTriggers.first().click();
    await page.waitForTimeout(400);
    count = await closedTriggers.count();
  }
}

test.describe("ERP Mini E2E Role-based Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 });
  });

  test("Admin role permissions verification", async ({ page }) => {
    await loginLocalDemo(page, "admin");
    
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
    await page.goto("/performance/setup", { waitUntil: "domcontentloaded" });
    await expect(page.locator('h1:has-text("Không có quyền truy cập")')).toBeHidden();
    
    // Capture screenshots
    await takeScreenshots(page, "admin");
  });

  test("Manager role permissions verification", async ({ page }) => {
    await loginLocalDemo(page, "manager");
    
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
    await page.goto("/performance/setup", { waitUntil: "domcontentloaded" });
    await expect(page.locator('h1:has-text("Không có quyền truy cập")')).toBeVisible();
    
    // Capture screenshots
    await takeScreenshots(page, "manager");
  });

  test("Staff role permissions verification", async ({ page }) => {
    await loginLocalDemo(page, "staff");
    
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
    await page.goto("/performance/setup", { waitUntil: "domcontentloaded" });
    await expect(page.locator('h1:has-text("Không có quyền truy cập")')).toBeVisible();
    
    // /accounting shows "Không có quyền truy cập"
    await page.goto("/accounting", { waitUntil: "domcontentloaded" });
    await expect(page.locator('h1:has-text("Không có quyền truy cập")')).toBeVisible();
    
    // Capture screenshots
    await takeScreenshots(page, "staff");
  });
});

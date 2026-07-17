import { expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export function getBrainPath(): string {
  if (process.env.BRAIN_PATH) return process.env.BRAIN_PATH;
  
  // Try to find the local AppData directory dynamically
  const userProfile = process.env.USERPROFILE || process.env.HOME;
  if (userProfile) {
    const brainDir = path.join(userProfile, ".gemini", "antigravity", "brain");
    if (fs.existsSync(brainDir)) {
      try {
        const subdirs = fs.readdirSync(brainDir)
          .map(name => ({ name, path: path.join(brainDir, name) }))
          .filter(item => fs.statSync(item.path).isDirectory());
        if (subdirs.length > 0) {
          subdirs.sort((a, b) => fs.statSync(b.path).mtimeMs - fs.statSync(a.path).mtimeMs);
          return subdirs[0].path.replace(/\\/g, "/");
        }
      } catch (e) {
        // ignore
      }
    }
  }
  
  return path.resolve(__dirname, "../../artifacts").replace(/\\/g, "/");
}

export function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function loginLocalDemo(page: Page, role = "admin") {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.evaluate((localRole) => {
    localStorage.setItem("erp-mini-local-demo-auth", "true");
    localStorage.setItem("erp-mini-local-demo-role", localRole);
    localStorage.setItem("erp-mini-local-demo-version", "v9");
  }, role);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Accept both "Dashboard" and "Tổng quan" headings for compatibility
  await expect(page.getByRole("heading", { name: /Dashboard|Tổng quan/ })).toBeVisible({ timeout: 15000 });
}

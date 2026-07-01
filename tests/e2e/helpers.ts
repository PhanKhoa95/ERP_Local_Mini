import { expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export function getBrainPath(): string {
  return process.env.BRAIN_PATH || "C:/Users/KHOA MEDIA/.gemini/antigravity/brain/0981d539-feb1-4def-9660-a5731a4a4b16";
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
  }, role);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 });
}

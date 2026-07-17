# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\casso_test.spec.ts >> verify Casso bank transfer auto-reconciliation flow
- Location: tests\e2e\casso_test.spec.ts:5:1

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://127.0.0.1:8017/
Call log:
  - navigating to "http://127.0.0.1:8017/", waiting until "domcontentloaded"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]: E
        - generic [ref=e9]: ERP Mini
      - paragraph [ref=e10]: Hệ thống quản lý kinh doanh đa kênh
    - generic [ref=e12]:
      - tablist [ref=e14]:
        - tab "Đăng nhập" [selected] [ref=e15] [cursor=pointer]
        - tab "Đăng ký" [ref=e16] [cursor=pointer]
      - generic [ref=e17]:
        - generic [ref=e18]:
          - text: Không có tài khoản mặc định. Hãy đăng ký bằng email thật, xác nhận email rồi quay lại đăng nhập.
          - generic [ref=e19]: "Local dev: có thể dùng admin_demo / admin_demo để vào nhanh bản demo."
        - tabpanel "Đăng nhập" [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]:
              - text: Email
              - textbox "Email" [ref=e23]:
                - /placeholder: email@example.com
            - generic [ref=e24]:
              - text: Mật khẩu
              - generic [ref=e25]:
                - textbox "Mật khẩu" [ref=e26]:
                  - /placeholder: ••••••••
                - button [ref=e27] [cursor=pointer]:
                  - img
            - button "Đăng nhập" [ref=e28] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | import * as fs from "fs";
  3  | import * as path from "path";
  4  | 
  5  | export function getBrainPath(): string {
  6  |   if (process.env.BRAIN_PATH) return process.env.BRAIN_PATH;
  7  |   
  8  |   // Try to find the local AppData directory dynamically
  9  |   const userProfile = process.env.USERPROFILE || process.env.HOME;
  10 |   if (userProfile) {
  11 |     // Current conversation ID is e572c9fa-8149-43a3-940b-5456bbfcec6a
  12 |     return path.join(userProfile, ".gemini", "antigravity", "brain", "e572c9fa-8149-43a3-940b-5456bbfcec6a").replace(/\\/g, "/");
  13 |   }
  14 |   
  15 |   return path.resolve(__dirname, "../../artifacts").replace(/\\/g, "/");
  16 | }
  17 | 
  18 | export function ensureDir(filePath: string) {
  19 |   const dir = path.dirname(filePath);
  20 |   if (!fs.existsSync(dir)) {
  21 |     fs.mkdirSync(dir, { recursive: true });
  22 |   }
  23 | }
  24 | 
  25 | export async function loginLocalDemo(page: Page, role = "admin") {
  26 |   await page.goto("/auth", { waitUntil: "domcontentloaded" });
  27 |   await page.evaluate((localRole) => {
  28 |     localStorage.setItem("erp-mini-local-demo-auth", "true");
  29 |     localStorage.setItem("erp-mini-local-demo-role", localRole);
  30 |   }, role);
> 31 |   await page.goto("/", { waitUntil: "domcontentloaded" });
     |              ^ Error: page.goto: net::ERR_ABORTED at http://127.0.0.1:8017/
  32 |   // Accept both "Dashboard" and "Tổng quan" headings for compatibility
  33 |   await expect(page.getByRole("heading", { name: /Dashboard|Tổng quan/ })).toBeVisible({ timeout: 15000 });
  34 | }
  35 | 
```
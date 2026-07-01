# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\promotions.spec.ts >> Promotions & Auto-Apply E2E Tests >> should display promotions page list and auto-apply promotions inside POS cart
- Location: tests\e2e\promotions.spec.ts:15:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="name@company.com"]')

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
          - generic [ref=e19]: "Local dev: có thể dùng admin / admin để vào nhanh bản demo."
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
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Promotions & Auto-Apply E2E Tests", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Standard Demo Login
  6  |     await page.goto("http://localhost:8017/auth");
> 7  |     await page.fill('input[placeholder="name@company.com"]', "admin@demo.com");
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill('input[placeholder="••••••••"]', "demo1234");
  9  |     await page.click('button[type="submit"]');
  10 |     
  11 |     // Wait for redirect to dashboard
  12 |     await expect(page).toHaveURL("http://localhost:8017/");
  13 |   });
  14 | 
  15 |   test("should display promotions page list and auto-apply promotions inside POS cart", async ({ page }) => {
  16 |     // 1. Navigate to Promotions page
  17 |     await page.goto("http://localhost:8017/promotions");
  18 |     
  19 |     // Check page header and title
  20 |     await expect(page.locator("h1")).toContainText("Khuyến mãi & Ưu đãi");
  21 |     
  22 |     // Check that default seeded promotions are present in the table
  23 |     await expect(page.locator("body")).toContainText("SIEUDEAL");
  24 |     await expect(page.locator("body")).toContainText("AUTO10");
  25 |     await expect(page.locator("body")).toContainText("FREESHIP");
  26 | 
  27 |     // 2. Navigate to POS page
  28 |     await page.goto("http://localhost:8017/pos");
  29 |     
  30 |     // Wait for POS categories and products to load
  31 |     await page.waitForSelector(".grid >> text=Thẻ QR");
  32 |     
  33 |     // Add product "Thẻ QR cá nhân thông minh" (sku: PRD-QR-CARD) to cart
  34 |     // Available stock is 150, selling price is 69,000đ.
  35 |     await page.click("text=Thẻ QR cá nhân thông minh");
  36 |     
  37 |     // Check cart has 1 item, subtotal = 69,000đ.
  38 |     // 69k is under the 200k threshold, so no auto-apply promo should be active.
  39 |     await expect(page.locator("body")).not.toContainText("Tự động: Tự động giảm 10% đơn từ 200k");
  40 | 
  41 |     // Increase quantity of the item to 4 items (subtotal = 4 * 69k = 276,000đ)
  42 |     // 276k is above 200k threshold, triggering the AUTO10 auto-apply!
  43 |     const qtyInput = page.locator('input[inputmode="numeric"]');
  44 |     await qtyInput.fill("4");
  45 |     await qtyInput.blur();
  46 |     
  47 |     // Wait for the debounce to trigger and compute totals
  48 |     await page.waitForTimeout(600);
  49 |     
  50 |     // Verify auto-apply badge is now visible in the footer
  51 |     await expect(page.locator("body")).toContainText("Tự động: Tự động giảm 10% đơn từ 200k");
  52 |     
  53 |     // Verify total discount is 10% of 276k = 27,600đ
  54 |     const discountDisplay = page.locator("text=-27.600đ");
  55 |     await expect(discountDisplay).toBeVisible();
  56 | 
  57 |     // Verify subtotal, discount, and grand total in the summary
  58 |     // Subtotal: 276k
  59 |     // Discount: 27.6k
  60 |     // Total: 276k - 27.6k = 248,400đ
  61 |     const totalDisplay = page.locator("text=248.400đ");
  62 |     await expect(totalDisplay).toBeVisible();
  63 | 
  64 |     // 3. Complete checkout
  65 |     // Select a payment method (Cash / Tiền mặt)
  66 |     await page.click("text=Tiền mặt");
  67 |     
  68 |     // Click Thanh toán
  69 |     await page.click("text=Thanh toán");
  70 |     
  71 |     // Wait for order completion success toast
  72 |     await expect(page.locator("text=Thanh toán thành công")).toBeVisible();
  73 |   });
  74 | });
  75 | 
```
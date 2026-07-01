# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\omnichannel_warranty.spec.ts >> Omnichannel Auto-Profiling & Warranty E2E Tests >> should support background auto-profiling, omnichannel matching, and warranty tracking
- Location: tests\e2e\omnichannel_warranty.spec.ts:13:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="Tìm đối tác..."]')

```

# Page snapshot

```yaml
- generic:
  - generic:
    - list
    - region "Notifications alt+T"
    - generic:
      - complementary:
        - generic:
          - generic:
            - generic:
              - generic: E
            - generic: ERP Mini
          - button:
            - img
        - navigation:
          - generic:
            - button [expanded]:
              - img
              - text: Kinh doanh
            - generic:
              - link:
                - /url: /
                - img
                - generic: Dashboard
              - link:
                - /url: /pos
                - img
                - generic: POS Bán hàng
              - link:
                - /url: /promotions
                - img
                - generic: Khuyến mãi
              - link:
                - /url: /orders
                - img
                - generic: Đơn hàng
              - link:
                - /url: /inventory
                - img
                - generic: Kho hàng
              - link:
                - /url: /warehouses
                - img
                - generic: Quản lý kho
              - link:
                - /url: /partners
                - img
                - generic: Đối tác
              - link:
                - /url: /tracking
                - img
                - generic: Tra cứu đơn hàng
              - link:
                - /url: /debt-report
                - img
                - generic: Công nợ
              - link:
                - /url: /e-office
                - img
                - generic: E-Office
              - link:
                - /url: /directive-dashboard
                - img
                - generic: Dashboard Chỉ thị
              - link:
                - /url: /contracts
                - img
                - generic: Hợp đồng
              - link:
                - /url: /bookings
                - img
                - generic: Đặt lịch
              - link:
                - /url: /workflows
                - img
                - generic: Tự động hóa
              - link:
                - /url: /sales-agent
                - img
                - generic: Sales Agent AI
              - link:
                - /url: /data-hub
                - img
                - generic: Data Hub
              - link:
                - /url: /digital-assets
                - img
                - generic: Tài sản số
              - link:
                - /url: /accounting
                - img
                - generic: Kế toán
              - link:
                - /url: /finance
                - img
                - generic: Tài chính
              - link:
                - /url: /reports
                - img
                - generic: Báo cáo
          - generic:
            - button:
              - img
              - text: Hiệu suất
          - generic:
            - button:
              - img
              - text: Tài liệu
        - generic:
          - link:
            - /url: /settings
            - img
            - generic: Cài đặt
          - button:
            - img
            - generic: Đăng xuất
      - main:
        - generic:
          - generic:
            - generic:
              - generic:
                - img
                - textbox:
                  - /placeholder: Tìm sản phẩm theo tên hoặc mã SKU...
              - combobox:
                - generic: Tất cả
                - img
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Sticker logo decal giấy
                        - paragraph: PRD-STICKER
                        - generic:
                          - generic: 99.000đ
                          - generic: "450"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Card cảm ơn / Thank you card
                        - paragraph: PRD-CARD
                        - generic:
                          - generic: 119.000đ
                          - generic: "600"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Bảng QR để bàn mica
                        - paragraph: PRD-QR-BOARD
                        - generic:
                          - generic: 109.000đ
                          - generic: "80"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Tem QR thanh toán decal
                        - paragraph: PRD-QR-STICKER
                        - generic:
                          - generic: 69.000đ
                          - generic: "200"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Thẻ QR cá nhân thông minh
                        - paragraph: PRD-QR-CARD
                        - generic:
                          - generic: 69.000đ
                          - generic: "149"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Combo Shop Mới Khởi Nghiệp
                        - paragraph: PRD-COMBO-NEW
                        - generic:
                          - generic: 349.000đ
                          - generic: "40"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Dịch vụ thiết kế Avatar & QR
                        - paragraph: PRD-DESIGN-QR
                        - generic:
                          - generic: 149.000đ
                          - generic: "0"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Bao bì / Hộp gia công nhỏ
                        - paragraph: PRD-BOX
                        - generic:
                          - generic: 179.000đ
                          - generic: "200"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Giấy decal bóng (A4)
                        - paragraph: MAT-DECAL
                        - generic:
                          - generic: 3.000đ
                          - generic: "1000"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Giấy Couche 300gsm (A4)
                        - paragraph: MAT-COUCHE
                        - generic:
                          - generic: 4.000đ
                          - generic: "1500"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Mực in Pigment (ml)
                        - paragraph: MAT-INK
                        - generic:
                          - generic: 1.000đ
                          - generic: "2000"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Tấm mica trong 2mm (A4 size)
                        - paragraph: MAT-MICA
                        - generic:
                          - generic: 30.000đ
                          - generic: "200"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Tấm Formex 3mm (A4 size)
                        - paragraph: MAT-FORMEX
                        - generic:
                          - generic: 16.000đ
                          - generic: "300"
                    - generic:
                      - generic:
                        - generic:
                          - img
                        - heading [level=3]: Hộp carton & băng keo
                        - paragraph: MAT-BOX
                        - generic:
                          - generic: 6.000đ
                          - generic: "500"
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - img
                    - heading [level=2]: Giỏ hàng
                    - generic: "1"
                  - button:
                    - img
                    - text: Xóa
                - combobox:
                  - generic:
                    - generic: Cửa hàng bán lẻ (POS)
                  - img
                - combobox:
                  - generic:
                    - generic:
                      - img
                      - text: Kho chính
                      - generic: Mặc định
                  - img
                - generic:
                  - generic:
                    - img
                    - generic: Đủ hàng tại Kho chính
              - generic:
                - generic:
                  - generic:
                    - img
                    - generic: Khách hàng
                  - button:
                    - img
                    - text: Giả lập Quét VIP
                - generic:
                  - generic:
                    - textbox:
                      - /placeholder: Tìm khách hàng (tên, SĐT, mã)...
                    - button:
                      - img
                  - combobox [expanded]:
                    - generic: Khách lẻ
                    - img
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - heading [level=4]: Thẻ QR cá nhân thông minh
                          - paragraph: PRD-QR-CARD
                          - generic:
                            - spinbutton: "69000"
                            - generic: đ/sp
                        - generic:
                          - button:
                            - img
                          - generic:
                            - button:
                              - img
                            - textbox: "1"
                            - button:
                              - img
                          - generic: 69.000đ
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic: Giảm giá
                    - textbox:
                      - /placeholder: "0"
                  - generic:
                    - text: Phí ship
                    - textbox:
                      - /placeholder: "0"
                - generic:
                  - text: Ghi chú
                  - textbox:
                    - /placeholder: Ghi chú đơn hàng...
                - generic:
                  - generic:
                    - generic: Tạm tính
                    - generic: 69.000đ
                  - generic:
                    - generic: Tổng cộng
                    - generic: 69.000đ
                - generic:
                  - button:
                    - img
                    - text: Tiền mặt
                  - button:
                    - img
                    - text: Chuyển khoản
      - button:
        - generic:
          - generic:
            - img
  - listbox [ref=e1]:
    - option "Khách lẻ" [active] [ref=e2]:
      - generic [ref=e4]: Khách lẻ
    - option "Khách Hàng Ẩn Danh 0988777666 • 6 điểm" [ref=e5]:
      - generic [ref=e8]:
        - generic [ref=e9]: Khách Hàng Ẩn Danh
        - generic [ref=e10]: 0988777666 • 6 điểm
    - option "Cửa hàng Thời trang BlueSky 0901234567 • 450 điểm" [ref=e11]:
      - generic [ref=e14]:
        - generic [ref=e15]: Cửa hàng Thời trang BlueSky
        - generic [ref=e16]: 0901234567 • 450 điểm
    - option "Công ty Cổ phần Techcom 0243987654 • 1200 điểm" [ref=e17]:
      - generic [ref=e20]:
        - generic [ref=e21]: Công ty Cổ phần Techcom
        - generic [ref=e22]: 0243987654 • 1200 điểm
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { loginLocalDemo } from "./helpers";
  3   | 
  4   | test.describe("Omnichannel Auto-Profiling & Warranty E2E Tests", () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Set viewport size
  7   |     await page.setViewportSize({ width: 1280, height: 960 });
  8   |     
  9   |     // Standard Demo Login helper
  10  |     await loginLocalDemo(page);
  11  |   });
  12  | 
  13  |   test("should support background auto-profiling, omnichannel matching, and warranty tracking", async ({ page }) => {
  14  |     test.setTimeout(60000);
  15  | 
  16  |     // Step 1: Place an order in POS for a completely new customer who left only Name and Phone
  17  |     await page.goto("/pos");
  18  |     await page.waitForSelector(".grid >> text=Thẻ QR");
  19  | 
  20  |     // Add a warranty-eligible product to cart: "Thẻ QR cá nhân thông minh"
  21  |     await page.click("text=Thẻ QR cá nhân thông minh");
  22  |     await page.waitForTimeout(500);
  23  | 
  24  |     // Click "+" button next to customer search input to quick add customer
  25  |     const plusBtn = page.locator('button[title="Thêm khách hàng mới"]');
  26  |     await expect(plusBtn).toBeVisible({ timeout: 5000 });
  27  |     await plusBtn.click();
  28  | 
  29  |     const partnerDialog = page.locator('div[role="dialog"]');
  30  |     await expect(partnerDialog).toBeVisible({ timeout: 5000 });
  31  |     await partnerDialog.locator('input#name').fill("Khách Hàng Ẩn Danh");
  32  |     await partnerDialog.locator('input#phone').fill("0988777666");
  33  |     await partnerDialog.locator('button:has-text("Kích hoạt")').click();
  34  | 
  35  |     // Verify success toast and auto-selection
  36  |     await expect(page.locator("text=Thêm đối tác thành công").first()).toBeVisible({ timeout: 10000 });
  37  |     const selectedCustomerCombo = page.locator('div.space-y-2 button[role="combobox"]').first();
  38  |     await expect(selectedCustomerCombo).toContainText("Khách Hàng Ẩn Danh", { timeout: 10000 });
  39  | 
  40  |     // Checkout order
  41  |     await page.click('button:has-text("Tiền mặt")');
  42  |     await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });
  43  | 
  44  |     // Step 2: Navigate to Partner management to see if customer profile exists
  45  |     await page.goto("/partners");
  46  |     await page.waitForSelector("text=Thêm mới");
  47  | 
  48  |     // Search for the newly auto-profiled customer
  49  |     const searchInput = page.locator('input[placeholder="Tìm kiếm..."]').first();
  50  |     await searchInput.fill("0988777666");
  51  |     await page.waitForTimeout(500);
  52  | 
  53  |     // Verify profile is listed in table/cards
  54  |     const card = page.locator('.hover\\:shadow-md', { hasText: 'Khách Hàng Ẩn Danh' });
  55  |     await expect(card).toBeVisible({ timeout: 5000 });
  56  | 
  57  |     // Step 3: Place another order in POS searching for the existing customer "0988777666"
  58  |     await page.goto("/pos");
  59  |     await page.waitForSelector(".grid >> text=Thẻ QR");
  60  | 
  61  |     // Add another product: "Thẻ QR cá nhân thông minh"
  62  |     await page.click("text=Thẻ QR cá nhân thông minh");
  63  |     await page.waitForTimeout(500);
  64  | 
  65  |     // Search for "0988777666" in customer selection combobox
  66  |     const customerCombo = page.locator('div.space-y-2 button[role="combobox"]').first();
  67  |     await customerCombo.click();
  68  |     const searchComboInput = page.locator('input[placeholder="Tìm đối tác..."]');
> 69  |     await searchComboInput.fill("0988777666");
      |                            ^ Error: locator.fill: Test timeout of 60000ms exceeded.
  70  |     await page.waitForTimeout(500);
  71  |     // Click the matching result
  72  |     await page.click('div[role="option"]:has-text("0988777666")');
  73  | 
  74  |     // Checkout
  75  |     await page.click('button:has-text("Tiền mặt")');
  76  |     await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });
  77  | 
  78  |     // Step 4: Open profile details to inspect behavioral insights and active warranties!
  79  |     await page.goto("/partners");
  80  |     await page.waitForSelector("text=Thêm mới");
  81  |     await searchInput.fill("0988777666");
  82  |     await page.waitForTimeout(500);
  83  | 
  84  |     // Open detail dialog
  85  |     const targetCard = page.locator('.hover\\:shadow-md', { hasText: 'Khách Hàng Ẩn Danh' });
  86  |     await targetCard.locator('button:has-text("Chi tiết")').click();
  87  | 
  88  |     const detailDialog = page.locator('div[role="dialog"]');
  89  |     await expect(detailDialog).toBeVisible({ timeout: 5000 });
  90  | 
  91  |     // Click "Bảo hành & CS" Tab trigger
  92  |     await page.click('button[role="tab"]:has-text("Bảo hành & CS")');
  93  |     await page.waitForTimeout(500);
  94  | 
  95  |     // Verify Warranty card is rendered and contains the purchased items
  96  |     await expect(detailDialog).toContainText("Theo dõi bảo hành sản phẩm");
  97  |     await expect(detailDialog).toContainText("Thẻ QR cá nhân thông minh");
  98  |     await expect(detailDialog).toContainText("Còn hạn"); // Expiration is 12 months in the future so it must be active!
  99  | 
  100 |     // Verify buyer policies are listed
  101 |     await expect(detailDialog).toContainText("Chính sách mua hàng");
  102 |     await expect(detailDialog).toContainText("Đổi trả 7 ngày");
  103 |   });
  104 | });
  105 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\memberships.spec.ts >> verify membership card issuance, prepaid wallet deposit, and dynamic POS integration
- Location: tests\e2e\memberships.spec.ts:5:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('role=option').first()

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
                - /url: /memberships
                - img
                - generic: Thẻ thành viên
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
                - heading [level=1]: Thẻ thành viên & Ví
                - paragraph: Quản lý thẻ tích điểm thông minh, tài khoản mua hàng trả trước của khách hàng
            - generic:
              - generic:
                - generic:
                  - generic:
                    - img
                    - generic: "Kỳ báo cáo:"
                  - combobox:
                    - generic: Tháng này
                    - img
                  - generic: 2026-07-01 đến 2026-07-31
              - generic:
                - img
                - textbox:
                  - /placeholder: Tìm kiếm...
              - button:
                - img
              - button:
                - generic:
                  - generic: A
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Thẻ thành viên
                      - heading [level=4]: VIETERP SMART CARD
                    - generic: Bạc (Silver)
                  - generic:
                    - generic: MEM-234567
                    - generic:
                      - generic:
                        - paragraph: Chủ thẻ
                        - paragraph: Cửa hàng Thời trang BlueSky
                      - generic:
                        - paragraph: Hạn dùng
                        - paragraph: 2027-07-01
              - generic:
                - generic:
                  - heading [level=3]:
                    - img
                    - text: Số dư tài khoản & Điểm thưởng
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Tài khoản mua hàng
                      - heading [level=3]: 2.000.000đ
                      - paragraph: Dùng để thanh toán POS nhanh
                    - generic:
                      - paragraph: Điểm tích lũy
                      - heading [level=3]: 300 điểm
                      - paragraph: Tích lũy 1% mỗi đơn hàng
                  - generic:
                    - button:
                      - img
                      - text: Nạp tiền ví
                    - button:
                      - img
                      - text: Thanh toán
              - generic:
                - generic:
                  - heading [level=3]:
                    - img
                    - text: Thiết lập thẻ
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Trạng thái thẻ
                      - paragraph: Khóa hoặc mở khóa thẻ tạm thời
                    - button: Khóa thẻ
                  - generic:
                    - generic:
                      - paragraph: Hạng thành viên
                      - paragraph: Cập nhật quyền lợi phân khúc
                    - combobox:
                      - generic: Bạc (Silver)
                      - img
            - generic:
              - generic:
                - tablist:
                  - tab [selected]: Danh sách thẻ
                  - tab: Lịch sử giao dịch
                - tabpanel:
                  - generic:
                    - generic:
                      - generic:
                        - heading [level=3]: Danh mục thẻ thành viên
                        - paragraph: Tìm kiếm thẻ theo mã số hoặc tên/SĐT khách hàng
                      - button:
                        - img
                        - text: Phát hành thẻ mới
                    - generic:
                      - generic:
                        - generic:
                          - img
                          - textbox:
                            - /placeholder: Mã thẻ, tên, số điện thoại...
                        - combobox:
                          - generic: Tất cả hạng
                          - img
                        - combobox:
                          - generic: Tất cả trạng thái
                          - img
                      - generic:
                        - generic:
                          - table:
                            - rowgroup:
                              - row:
                                - columnheader: Mã thẻ / Khách hàng
                                - columnheader: Hạng
                                - columnheader: Số dư ví
                                - columnheader: Trạng thái
                            - rowgroup:
                              - row:
                                - cell:
                                  - generic: MEM-234567
                                  - generic: Cửa hàng Thời trang BlueSky
                                  - generic: "0901234567"
                                - cell:
                                  - generic: silver
                                - cell:
                                  - text: 2.000.000đ
                                  - generic: 300 điểm
                                - cell:
                                  - generic: Đang hoạt động
                              - row:
                                - cell:
                                  - generic: MEM-987654
                                  - generic: Công ty Cổ phần Techcom
                                  - generic: "0243987654"
                                - cell:
                                  - generic: gold
                                - cell:
                                  - text: 1.500.000đ
                                  - generic: 450 điểm
                                - cell:
                                  - generic: Đang hoạt động
      - button:
        - generic:
          - generic:
            - img
  - dialog:
    - generic:
      - heading [level=2]: Phát hành thẻ thành viên
      - paragraph: Chọn khách hàng và đặt mã thẻ thành viên tương ứng
    - generic:
      - generic:
        - text: Khách hàng liên kết *
        - combobox [expanded]:
          - generic: Chọn khách hàng...
          - img
        - combobox
      - generic:
        - text: Mã số thẻ (Tự sinh hoặc quét barcode) *
        - textbox:
          - /placeholder: "VD: MEM-123456"
      - generic:
        - text: Hạng thành viên ban đầu
        - combobox:
          - generic: Đồng (Bronze)
          - img
        - combobox
      - generic:
        - text: Ghi chú phát hành
        - textbox:
          - /placeholder: "VD: Khách hàng thân thiết..."
          - text: Phát hành thẻ thành viên
      - generic:
        - button: Hủy
        - button [disabled]: Xác nhận
    - button:
      - img
      - generic: Close
  - listbox [active] [ref=e2]:
    - generic [ref=e3]: Tất cả khách hàng hiện tại đã có thẻ thành viên.
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { loginLocalDemo, getBrainPath, ensureDir } from "./helpers";
  3  | import * as path from "path";
  4  | 
  5  | test("verify membership card issuance, prepaid wallet deposit, and dynamic POS integration", async ({ page }) => {
  6  |   // Set viewport size
  7  |   await page.setViewportSize({ width: 1280, height: 960 });
  8  | 
  9  |   await loginLocalDemo(page);
  10 | 
  11 |   // 1. Navigate to Memberships & Wallet Page
  12 |   console.log("Navigating to Memberships & Wallet page...");
  13 |   await page.goto("/memberships", { waitUntil: "domcontentloaded" });
  14 | 
  15 |   // Verify visual elements are displayed
  16 |   const heading = page.locator("h1:has-text('Thẻ thành viên & Ví')");
  17 |   await expect(heading).toBeVisible({ timeout: 10000 });
  18 |   console.log("Memberships Page title loaded.");
  19 | 
  20 |   // 2. Issue a new membership card for an existing customer
  21 |   const issueButton = page.locator('button:has-text("Phát hành thẻ mới")');
  22 |   await expect(issueButton).toBeVisible();
  23 |   await issueButton.click();
  24 |   console.log("Clicked Issue Card button.");
  25 | 
  26 |   // Fill in the form
  27 |   const dialog = page.locator("role=dialog");
  28 |   await expect(dialog).toBeVisible();
  29 | 
  30 |   // Select customer
  31 |   await dialog.locator("button:has-text('Chọn khách hàng...')").click();
  32 |   // Select first available customer
> 33 |   await page.locator("role=option").first().click();
     |                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  34 | 
  35 |   // Pick Gold tier
  36 |   await dialog.locator("button:has-text('Đồng (Bronze)')").click();
  37 |   await page.locator("role=option:has-text('Vàng (Gold)')").click();
  38 | 
  39 |   // Type issue note
  40 |   await dialog.locator("input#card_notes").fill("E2E Test Issued Member Card");
  41 | 
  42 |   // Save the form
  43 |   await dialog.locator("button:has-text('Xác nhận')").click();
  44 |   console.log("Submitted new card form.");
  45 | 
  46 |   // Wait for dialog to close and list to update
  47 |   await page.waitForTimeout(1500);
  48 | 
  49 |   // 3. Deposit money into the purchase account wallet
  50 |   const depositButton = page.locator('button:has-text("Nạp tiền ví")');
  51 |   await expect(depositButton).toBeVisible();
  52 |   await depositButton.click();
  53 |   console.log("Clicked Wallet Deposit button.");
  54 | 
  55 |   // Fill deposit dialog
  56 |   await expect(dialog).toBeVisible();
  57 |   await dialog.locator("input#tx-amount").fill("2500000"); // 2,500,000 VND
  58 |   await dialog.locator("textarea#tx-desc").fill("Deposit from E2E Test Suite");
  59 | 
  60 |   // Submit transaction
  61 |   await dialog.locator("button:has-text('Xác nhận giao dịch')").click();
  62 |   console.log("Submitted deposit transaction.");
  63 | 
  64 |   await page.waitForTimeout(1500);
  65 | 
  66 |   // Take screenshot of the Memberships dashboard
  67 |   const screenshotPath1 = path.join(getBrainPath(), "membership_dashboard.png");
  68 |   ensureDir(screenshotPath1);
  69 |   await page.screenshot({ path: screenshotPath1 });
  70 |   console.log("Screenshot membership_dashboard.png saved.");
  71 | 
  72 |   // 4. Verify balance updated in dashboard
  73 |   const balanceDisplay = page.locator("h3:has-text('2.500.000đ')");
  74 |   await expect(balanceDisplay).toBeVisible({ timeout: 5000 });
  75 |   console.log("Wallet balance successfully verified on dashboard!");
  76 | });
  77 | 
```
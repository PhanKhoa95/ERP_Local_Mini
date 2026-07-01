# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\omnichannel_warranty.spec.ts >> Omnichannel Auto-Profiling & Warranty E2E Tests >> should support background auto-profiling, omni-channel matching, and warranty tracking
- Location: tests\e2e\omnichannel_warranty.spec.ts:13:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('text=Thêm Đối Tác') to be visible

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e8]: E
          - generic [ref=e9]: ERP Mini
        - button [ref=e10] [cursor=pointer]:
          - img
      - navigation [ref=e11]:
        - generic [ref=e12]:
          - button "Kinh doanh" [expanded] [ref=e13] [cursor=pointer]:
            - img [ref=e14]
            - text: Kinh doanh
          - generic [ref=e16]:
            - link "Dashboard" [ref=e17] [cursor=pointer]:
              - /url: /
              - img [ref=e18]
              - generic [ref=e23]: Dashboard
            - link "POS Bán hàng" [ref=e24] [cursor=pointer]:
              - /url: /pos
              - img [ref=e25]
              - generic [ref=e29]: POS Bán hàng
            - link "Khuyến mãi" [ref=e30] [cursor=pointer]:
              - /url: /promotions
              - img [ref=e31]
              - generic [ref=e33]: Khuyến mãi
            - link "Đơn hàng" [ref=e34] [cursor=pointer]:
              - /url: /orders
              - img [ref=e35]
              - generic [ref=e38]: Đơn hàng
            - link "Kho hàng" [ref=e39] [cursor=pointer]:
              - /url: /inventory
              - img [ref=e40]
              - generic [ref=e44]: Kho hàng
            - link "Quản lý kho" [ref=e45] [cursor=pointer]:
              - /url: /warehouses
              - img [ref=e46]
              - generic [ref=e49]: Quản lý kho
            - link "Đối tác" [ref=e50] [cursor=pointer]:
              - /url: /partners
              - img [ref=e51]
              - generic [ref=e56]: Đối tác
            - link "Tra cứu đơn hàng" [ref=e57] [cursor=pointer]:
              - /url: /tracking
              - img [ref=e58]
              - generic [ref=e64]: Tra cứu đơn hàng
            - link "Công nợ" [ref=e65] [cursor=pointer]:
              - /url: /debt-report
              - img [ref=e66]
              - generic [ref=e69]: Công nợ
            - link "E-Office" [ref=e70] [cursor=pointer]:
              - /url: /e-office
              - img [ref=e71]
              - generic [ref=e74]: E-Office
            - link "Dashboard Chỉ thị" [ref=e75] [cursor=pointer]:
              - /url: /directive-dashboard
              - img [ref=e76]
              - generic [ref=e78]: Dashboard Chỉ thị
            - link "Hợp đồng" [ref=e79] [cursor=pointer]:
              - /url: /contracts
              - img [ref=e80]
              - generic [ref=e83]: Hợp đồng
            - link "Đặt lịch" [ref=e84] [cursor=pointer]:
              - /url: /bookings
              - img [ref=e85]
              - generic [ref=e87]: Đặt lịch
            - link "Tự động hóa" [ref=e88] [cursor=pointer]:
              - /url: /workflows
              - img [ref=e89]
              - generic [ref=e93]: Tự động hóa
            - link "Sales Agent AI" [ref=e94] [cursor=pointer]:
              - /url: /sales-agent
              - img [ref=e95]
              - generic [ref=e98]: Sales Agent AI
            - link "Data Hub" [ref=e99] [cursor=pointer]:
              - /url: /data-hub
              - img [ref=e100]
              - generic [ref=e104]: Data Hub
            - link "Tài sản số" [ref=e105] [cursor=pointer]:
              - /url: /digital-assets
              - img [ref=e106]
              - generic [ref=e111]: Tài sản số
            - link "Kế toán" [ref=e112] [cursor=pointer]:
              - /url: /accounting
              - img [ref=e113]
              - generic [ref=e115]: Kế toán
            - link "Tài chính" [ref=e116] [cursor=pointer]:
              - /url: /finance
              - img [ref=e117]
              - generic [ref=e120]: Tài chính
            - link "Báo cáo" [ref=e121] [cursor=pointer]:
              - /url: /reports
              - img [ref=e122]
              - generic [ref=e124]: Báo cáo
        - button "Hiệu suất" [ref=e126] [cursor=pointer]:
          - img [ref=e127]
          - text: Hiệu suất
        - button "Tài liệu" [ref=e130] [cursor=pointer]:
          - img [ref=e131]
          - text: Tài liệu
      - generic [ref=e133]:
        - link "Cài đặt" [ref=e134] [cursor=pointer]:
          - /url: /settings
          - img [ref=e135]
          - generic [ref=e138]: Cài đặt
        - button "Đăng xuất" [ref=e139] [cursor=pointer]:
          - img [ref=e140]
          - generic [ref=e143]: Đăng xuất
    - main [ref=e144]:
      - generic [ref=e146]:
        - generic [ref=e148]:
          - heading "Quản lý đối tác" [level=1] [ref=e149]
          - paragraph [ref=e150]: Khách hàng và nhà cung cấp
        - generic [ref=e151]:
          - generic [ref=e153]:
            - generic [ref=e154]:
              - img [ref=e155]
              - generic [ref=e157]: "Kỳ báo cáo:"
            - combobox [ref=e158] [cursor=pointer]:
              - generic: Tháng này
              - img [ref=e159]
            - generic [ref=e161]: 2026-07-01 đến 2026-07-31
          - generic [ref=e162]:
            - img [ref=e163]
            - textbox "Tìm kiếm..." [ref=e166]
          - button [ref=e167] [cursor=pointer]:
            - img
          - button "A" [ref=e171] [cursor=pointer]:
            - generic [ref=e173]: A
      - generic [ref=e175]:
        - generic [ref=e176]:
          - tablist [ref=e177]:
            - tab "Khách hàng (3)" [selected] [ref=e178] [cursor=pointer]:
              - img [ref=e179]
              - generic [ref=e184]: Khách hàng
              - text: (3)
            - tab "Nhà cung cấp (1)" [ref=e185] [cursor=pointer]:
              - img [ref=e186]
              - generic [ref=e189]: Nhà cung cấp
              - text: (1)
            - tab "Phân tích RFM" [ref=e190] [cursor=pointer]:
              - img [ref=e191]
              - generic [ref=e193]: Phân tích RFM
          - generic [ref=e194]:
            - generic [ref=e195]:
              - img [ref=e196]
              - textbox "Tìm kiếm..." [ref=e199]
            - button "Thiết lập hàng loạt" [ref=e200] [cursor=pointer]:
              - img
              - text: Thiết lập hàng loạt
            - button "Xuất Excel" [ref=e201] [cursor=pointer]:
              - img
              - text: Xuất Excel
            - button "Thêm mới" [ref=e202] [cursor=pointer]:
              - img
              - text: Thêm mới
        - tabpanel "Khách hàng (3)" [ref=e203]:
          - generic [ref=e204]:
            - generic [ref=e206]:
              - generic [ref=e207]:
                - generic [ref=e208]:
                  - generic [ref=e210]: K
                  - generic [ref=e211]:
                    - heading "Khách Hàng Ẩn Danh" [level=3] [ref=e212]
                    - paragraph [ref=e213]: KH-0988777666
                - generic [ref=e215]: Khách hàng
              - generic [ref=e216]:
                - generic [ref=e217]:
                  - img [ref=e218]
                  - text: "0988777666"
                - generic [ref=e220]:
                  - generic [ref=e221]:
                    - text: "Công nợ:"
                    - strong [ref=e222]: 69.000đ
                  - generic [ref=e223]:
                    - text: "Chi tiêu:"
                    - strong [ref=e224]: 69.000đ
                  - generic [ref=e225]:
                    - img [ref=e226]
                    - text: 6 điểm
              - generic [ref=e228]:
                - button "Thanh toán" [ref=e229] [cursor=pointer]:
                  - img
                  - text: Thanh toán
                - generic [ref=e230]:
                  - button "Chi tiết" [ref=e231] [cursor=pointer]:
                    - img
                    - text: Chi tiết
                  - button "Sửa" [ref=e232] [cursor=pointer]:
                    - img
                    - text: Sửa
                  - button "Xóa" [ref=e233] [cursor=pointer]:
                    - img
                    - text: Xóa
            - generic [ref=e235]:
              - generic [ref=e236]:
                - generic [ref=e237]:
                  - generic [ref=e239]: C
                  - generic [ref=e240]:
                    - heading "Cửa hàng Thời trang BlueSky" [level=3] [ref=e241]
                    - paragraph [ref=e242]: KH-BLUESKY
                - generic [ref=e244]: Khách hàng
              - generic [ref=e245]:
                - generic [ref=e246]:
                  - img [ref=e247]
                  - text: "0901234567"
                - generic [ref=e249]:
                  - img [ref=e250]
                  - text: contact@bluesky.vn
                - generic [ref=e253]:
                  - generic [ref=e254]: Chi nhánh miền Nam
                  - generic [ref=e255]: "Tệp: Wholesale"
                - generic [ref=e256]:
                  - generic [ref=e257]:
                    - text: "Công nợ:"
                    - strong [ref=e258]: 15.000.000đ
                  - generic [ref=e259]:
                    - text: "Chi tiêu:"
                    - strong [ref=e260]: 85.000.000đ
                  - generic [ref=e261]:
                    - img [ref=e262]
                    - text: 450 điểm
              - generic [ref=e264]:
                - button "Thanh toán" [ref=e265] [cursor=pointer]:
                  - img
                  - text: Thanh toán
                - generic [ref=e266]:
                  - button "Chi tiết" [ref=e267] [cursor=pointer]:
                    - img
                    - text: Chi tiết
                  - button "Sửa" [ref=e268] [cursor=pointer]:
                    - img
                    - text: Sửa
                  - button "Xóa" [ref=e269] [cursor=pointer]:
                    - img
                    - text: Xóa
            - generic [ref=e271]:
              - generic [ref=e272]:
                - generic [ref=e273]:
                  - generic [ref=e275]: C
                  - generic [ref=e276]:
                    - heading "Công ty Cổ phần Techcom" [level=3] [ref=e277]
                    - paragraph [ref=e278]: KH-TECHCOM
                - generic [ref=e280]: Khách hàng
              - generic [ref=e281]:
                - generic [ref=e282]:
                  - img [ref=e283]
                  - text: "0243987654"
                - generic [ref=e285]:
                  - img [ref=e286]
                  - text: info@techcom.vn
                - generic [ref=e289]:
                  - generic [ref=e290]: Chi nhánh miền Bắc
                  - generic [ref=e291]: "Tệp: Loyalty/VIP"
                - generic [ref=e292]:
                  - generic [ref=e293]:
                    - text: "Chi tiêu:"
                    - strong [ref=e294]: 124.000.000đ
                  - generic [ref=e295]:
                    - img [ref=e296]
                    - text: 1200 điểm
              - generic [ref=e299]:
                - button "Chi tiết" [ref=e300] [cursor=pointer]:
                  - img
                  - text: Chi tiết
                - button "Sửa" [ref=e301] [cursor=pointer]:
                  - img
                  - text: Sửa
                - button "Xóa" [ref=e302] [cursor=pointer]:
                  - img
                  - text: Xóa
    - button "Trợ lý AI" [ref=e303] [cursor=pointer]:
      - img [ref=e307]
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
  13  |   test("should support background auto-profiling, omni-channel matching, and warranty tracking", async ({ page }) => {
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
  24  |     // Locate customer search combobox and select/input a new customer profile name
  25  |     // Since this is a guest checkout, we enter customer details manually
  26  |     // In our POS, the cashier can enter name and phone in custom fields. Let's see:
  27  |     // To check if custom fields exist, we check if we can fill the search box.
  28  |     // Wait! Let's search for "0988777666". Since no partner matches, we can click "+" to add them.
  29  |     // That triggers the simplified PartnerDialog!
  30  |     const plusBtn = page.locator('button[title="Thêm khách hàng mới"]');
  31  |     await expect(plusBtn).toBeVisible({ timeout: 5000 });
  32  |     await plusBtn.click();
  33  | 
  34  |     const partnerDialog = page.locator('div[role="dialog"]');
  35  |     await expect(partnerDialog).toBeVisible({ timeout: 5000 });
  36  |     await partnerDialog.locator('input#name').fill("Khách Hàng Ẩn Danh");
  37  |     await partnerDialog.locator('input#phone').fill("0988777666");
  38  |     await partnerDialog.locator('button:has-text("Kích hoạt")').click();
  39  | 
  40  |     // Verify success toast and auto-selection
  41  |     await expect(page.locator("text=Thêm đối tác thành công").first()).toBeVisible({ timeout: 10000 });
  42  |     await expect(page.locator('div.space-y-2 button[role="combobox"]').first()).toContainText("Khách Hàng Ẩn Danh", { timeout: 10000 });
  43  | 
  44  |     // Checkout order
  45  |     await page.click('button:has-text("Tiền mặt")');
  46  |     await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });
  47  | 
  48  |     // Step 2: Navigate to Partner management to see if customer profile exists
  49  |     await page.goto("/partners");
> 50  |     await page.waitForSelector("text=Thêm Đối Tác");
      |                ^ Error: page.waitForSelector: Test timeout of 60000ms exceeded.
  51  | 
  52  |     // Search for the newly auto-profiled customer
  53  |     const searchInput = page.locator('input[placeholder="Tìm theo tên, mã, SĐT, email..."]');
  54  |     await searchInput.fill("0988777666");
  55  |     await page.waitForTimeout(500);
  56  | 
  57  |     // Verify profile is listed in table
  58  |     const tableBody = page.locator("table tbody");
  59  |     await expect(tableBody).toContainText("Khách Hàng Ẩn Danh");
  60  | 
  61  |     // Step 3: Simulate omnichannel matching. Place another order in POS.
  62  |     // This time, the cashier adds another order. The customer gives the same phone number "0988777666".
  63  |     await page.goto("/pos");
  64  |     await page.waitForSelector(".grid >> text=Thẻ QR");
  65  | 
  66  |     // Add another product: "Thẻ QR cá nhân thông minh"
  67  |     await page.click("text=Thẻ QR cá nhân thông minh");
  68  |     await page.waitForTimeout(500);
  69  | 
  70  |     // Search for "0988777666" in customer selection combobox
  71  |     const customerCombo = page.locator('div.space-y-2 button[role="combobox"]').first();
  72  |     await customerCombo.click();
  73  |     const searchComboInput = page.locator('input[placeholder="Tìm đối tác..."]');
  74  |     await searchComboInput.fill("0988777666");
  75  |     await page.waitForTimeout(500);
  76  |     // Click the matching result
  77  |     await page.click('div[role="option"]:has-text("0988777666")');
  78  | 
  79  |     // Checkout
  80  |     await page.click('button:has-text("Tiền mặt")');
  81  |     await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });
  82  | 
  83  |     // Step 4: Open profile details to inspect behavioral insights and active warranties!
  84  |     await page.goto("/partners");
  85  |     await page.waitForSelector("text=Thêm Đối Tác");
  86  |     await searchInput.fill("0988777666");
  87  |     await page.waitForTimeout(500);
  88  | 
  89  |     // Click "Xem chi tiết" row action or click on the name
  90  |     await page.click('text=Khách Hàng Ẩn Danh');
  91  | 
  92  |     const detailDialog = page.locator('div[role="dialog"]');
  93  |     await expect(detailDialog).toBeVisible({ timeout: 5000 });
  94  | 
  95  |     // Click "Bảo hành & CS" Tab trigger
  96  |     await page.click('button[role="tab"]:has-text("Bảo hành & CS")');
  97  |     await page.waitForTimeout(500);
  98  | 
  99  |     // Verify Warranty card is rendered and contains the purchased items
  100 |     await expect(detailDialog).toContainText("Theo dõi bảo hành sản phẩm");
  101 |     await expect(detailDialog).toContainText("Thẻ QR cá nhân thông minh");
  102 |     await expect(detailDialog).toContainText("Còn hạn"); // Expiration is 12 months in the future so it must be active!
  103 | 
  104 |     // Verify buyer policies are listed
  105 |     await expect(detailDialog).toContainText("Chính sách mua hàng");
  106 |     await expect(detailDialog).toContainText("Đổi trả 7 ngày");
  107 |   });
  108 | });
  109 | 
```
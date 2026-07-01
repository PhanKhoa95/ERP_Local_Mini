# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\partner_classification.spec.ts >> Partner Classification & Promotion Segmentation E2E Tests >> should support partner bulk classification and apply promotion segmentation rules in POS
- Location: tests\e2e\partner_classification.spec.ts:13:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Chọn khách hàng")')

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
      - generic [ref=e145]:
        - generic [ref=e146]:
          - generic [ref=e147]:
            - generic [ref=e148]:
              - img [ref=e149]
              - textbox "Tìm sản phẩm theo tên hoặc mã SKU..." [ref=e152]
            - combobox [ref=e153] [cursor=pointer]:
              - generic: Tất cả
              - img [ref=e154]
          - generic [ref=e159]:
            - generic [ref=e161] [cursor=pointer]:
              - img [ref=e163]
              - heading "Sticker logo decal giấy" [level=3] [ref=e167]
              - paragraph [ref=e168]: PRD-STICKER
              - generic [ref=e169]:
                - generic [ref=e170]: 99.000đ
                - generic [ref=e171]: "450"
            - generic [ref=e173] [cursor=pointer]:
              - img [ref=e175]
              - heading "Card cảm ơn / Thank you card" [level=3] [ref=e179]
              - paragraph [ref=e180]: PRD-CARD
              - generic [ref=e181]:
                - generic [ref=e182]: 119.000đ
                - generic [ref=e183]: "600"
            - generic [ref=e185] [cursor=pointer]:
              - img [ref=e187]
              - heading "Bảng QR để bàn mica" [level=3] [ref=e191]
              - paragraph [ref=e192]: PRD-QR-BOARD
              - generic [ref=e193]:
                - generic [ref=e194]: 109.000đ
                - generic [ref=e195]: "80"
            - generic [ref=e197] [cursor=pointer]:
              - img [ref=e199]
              - heading "Tem QR thanh toán decal" [level=3] [ref=e203]
              - paragraph [ref=e204]: PRD-QR-STICKER
              - generic [ref=e205]:
                - generic [ref=e206]: 69.000đ
                - generic [ref=e207]: "200"
            - generic [ref=e209] [cursor=pointer]:
              - img [ref=e211]
              - heading "Thẻ QR cá nhân thông minh" [level=3] [ref=e215]
              - paragraph [ref=e216]: PRD-QR-CARD
              - generic [ref=e217]:
                - generic [ref=e218]: 69.000đ
                - generic [ref=e219]: "150"
            - generic [ref=e221] [cursor=pointer]:
              - img [ref=e223]
              - heading "Combo Shop Mới Khởi Nghiệp" [level=3] [ref=e227]
              - paragraph [ref=e228]: PRD-COMBO-NEW
              - generic [ref=e229]:
                - generic [ref=e230]: 349.000đ
                - generic [ref=e231]: "40"
            - generic [ref=e233] [cursor=pointer]:
              - img [ref=e235]
              - heading "Dịch vụ thiết kế Avatar & QR" [level=3] [ref=e239]
              - paragraph [ref=e240]: PRD-DESIGN-QR
              - generic [ref=e241]:
                - generic [ref=e242]: 149.000đ
                - generic [ref=e243]: "0"
            - generic [ref=e245] [cursor=pointer]:
              - img [ref=e247]
              - heading "Bao bì / Hộp gia công nhỏ" [level=3] [ref=e251]
              - paragraph [ref=e252]: PRD-BOX
              - generic [ref=e253]:
                - generic [ref=e254]: 179.000đ
                - generic [ref=e255]: "200"
            - generic [ref=e257] [cursor=pointer]:
              - img [ref=e259]
              - heading "Giấy decal bóng (A4)" [level=3] [ref=e263]
              - paragraph [ref=e264]: MAT-DECAL
              - generic [ref=e265]:
                - generic [ref=e266]: 3.000đ
                - generic [ref=e267]: "1000"
            - generic [ref=e269] [cursor=pointer]:
              - img [ref=e271]
              - heading "Giấy Couche 300gsm (A4)" [level=3] [ref=e275]
              - paragraph [ref=e276]: MAT-COUCHE
              - generic [ref=e277]:
                - generic [ref=e278]: 4.000đ
                - generic [ref=e279]: "1500"
            - generic [ref=e281] [cursor=pointer]:
              - img [ref=e283]
              - heading "Mực in Pigment (ml)" [level=3] [ref=e287]
              - paragraph [ref=e288]: MAT-INK
              - generic [ref=e289]:
                - generic [ref=e290]: 1.000đ
                - generic [ref=e291]: "2000"
            - generic [ref=e293] [cursor=pointer]:
              - img [ref=e295]
              - heading "Tấm mica trong 2mm (A4 size)" [level=3] [ref=e299]
              - paragraph [ref=e300]: MAT-MICA
              - generic [ref=e301]:
                - generic [ref=e302]: 30.000đ
                - generic [ref=e303]: "200"
            - generic [ref=e305] [cursor=pointer]:
              - img [ref=e307]
              - heading "Tấm Formex 3mm (A4 size)" [level=3] [ref=e311]
              - paragraph [ref=e312]: MAT-FORMEX
              - generic [ref=e313]:
                - generic [ref=e314]: 16.000đ
                - generic [ref=e315]: "300"
            - generic [ref=e317] [cursor=pointer]:
              - img [ref=e319]
              - heading "Hộp carton & băng keo" [level=3] [ref=e323]
              - paragraph [ref=e324]: MAT-BOX
              - generic [ref=e325]:
                - generic [ref=e326]: 6.000đ
                - generic [ref=e327]: "500"
        - generic [ref=e329]:
          - generic [ref=e330]:
            - generic [ref=e331]:
              - generic [ref=e332]:
                - img [ref=e333]
                - heading "Giỏ hàng" [level=2] [ref=e337]
                - generic [ref=e338]: "1"
              - button "Xóa" [ref=e339] [cursor=pointer]:
                - img
                - text: Xóa
            - combobox [ref=e340] [cursor=pointer]:
              - generic:
                - generic: Cửa hàng bán lẻ (POS)
              - img [ref=e341]
            - combobox [ref=e343] [cursor=pointer]:
              - generic:
                - generic:
                  - img
                  - text: Kho chính
                  - generic: Mặc định
              - img [ref=e344]
            - generic [ref=e347]:
              - img [ref=e348]
              - generic [ref=e351]: Đủ hàng tại Kho chính
          - generic [ref=e352]:
            - generic [ref=e353]:
              - img [ref=e354]
              - generic [ref=e357]: Khách hàng
            - generic [ref=e358]:
              - textbox "Tìm khách hàng (tên, SĐT, mã)..." [ref=e359]
              - combobox [ref=e360] [cursor=pointer]:
                - generic: Khách lẻ
                - img [ref=e361]
          - generic [ref=e367]:
            - generic [ref=e368]:
              - heading "Thẻ QR cá nhân thông minh" [level=4] [ref=e369]
              - paragraph [ref=e370]: PRD-QR-CARD
              - generic [ref=e371]:
                - spinbutton [ref=e372]: "69000"
                - generic [ref=e373]: đ/sp
            - generic [ref=e374]:
              - button [ref=e375] [cursor=pointer]:
                - img
              - generic [ref=e376]:
                - button [ref=e377] [cursor=pointer]:
                  - img
                - textbox [ref=e378]: "1"
                - button [ref=e379] [cursor=pointer]:
                  - img
              - generic [ref=e380]: 69.000đ
          - generic [ref=e381]:
            - generic [ref=e382]:
              - generic [ref=e383]:
                - generic [ref=e385]: Giảm giá
                - textbox "0" [ref=e386]
              - generic [ref=e387]:
                - text: Phí ship
                - textbox "0" [ref=e388]
            - generic [ref=e389]:
              - text: Ghi chú
              - textbox "Ghi chú đơn hàng..." [ref=e390]
            - generic [ref=e391]:
              - generic [ref=e392]:
                - generic [ref=e393]: Tạm tính
                - generic [ref=e394]: 69.000đ
              - generic [ref=e395]:
                - generic [ref=e396]: Tổng cộng
                - generic [ref=e397]: 69.000đ
            - generic [ref=e398]:
              - button "Tiền mặt" [ref=e399] [cursor=pointer]:
                - img
                - text: Tiền mặt
              - button "Chuyển khoản" [ref=e400] [cursor=pointer]:
                - img
                - text: Chuyển khoản
    - button "Trợ lý AI" [ref=e401] [cursor=pointer]:
      - img [ref=e405]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { loginLocalDemo } from "./helpers";
  3   | 
  4   | test.describe("Partner Classification & Promotion Segmentation E2E Tests", () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Set viewport size
  7   |     await page.setViewportSize({ width: 1280, height: 960 });
  8   |     
  9   |     // Standard Demo Login helper
  10  |     await loginLocalDemo(page);
  11  |   });
  12  | 
  13  |   test("should support partner bulk classification and apply promotion segmentation rules in POS", async ({ page }) => {
  14  |     // Increase test timeout to ensure slow animations don't trigger timeout
  15  |     test.setTimeout(60000);
  16  | 
  17  |     // 1. Navigate to Partners page
  18  |     await page.goto("/partners");
  19  |     await page.waitForSelector("text=Quản lý đối tác");
  20  | 
  21  |     // Click "Thiết lập hàng loạt" button
  22  |     await page.click("text=Thiết lập hàng loạt");
  23  |     
  24  |     // Search for "BlueSky" in bulk dialog
  25  |     const bulkSearchInput = page.locator('input[placeholder="Lọc đối tác để chọn..."]');
  26  |     await bulkSearchInput.fill("BlueSky");
  27  |     await page.waitForTimeout(500);
  28  | 
  29  |     // Verify row for BlueSky appears, check the checkbox next to it
  30  |     const rowCheck = page.locator('tr:has-text("KH-BLUESKY") input[type="checkbox"]');
  31  |     await expect(rowCheck).toBeVisible({ timeout: 5000 });
  32  |     await rowCheck.check();
  33  | 
  34  |     // Configure classification attributes in the right panel
  35  |     // 1. Chi nhánh
  36  |     const branchSelect = page.locator('div.space-y-1\\.5:has-text("Chi nhánh phụ trách") button');
  37  |     await expect(branchSelect).toBeVisible({ timeout: 5000 });
  38  |     await branchSelect.click();
  39  |     await page.click('div[role="presentation"] >> text=Chi nhánh miền Nam');
  40  | 
  41  |     // 2. Tệp khuyến mãi
  42  |     const segmentSelect = page.locator('div.space-y-1\\.5:has-text("Tệp khuyến mãi áp dụng") button');
  43  |     await expect(segmentSelect).toBeVisible({ timeout: 5000 });
  44  |     await segmentSelect.click();
  45  |     await page.click('div[role="presentation"] >> text=Khách mua sỉ (wholesale)');
  46  | 
  47  |     // Click Apply Bulk settings
  48  |     await page.click('button:has-text("Áp dụng thiết lập")');
  49  | 
  50  |     // Wait for the bulk operation to complete and dialog to close
  51  |     await expect(page.locator("text=Cập nhật hàng loạt thành công").first()).toBeVisible({ timeout: 15000 });
  52  | 
  53  |     // Verify badges are updated on the customer card
  54  |     const blueskyCard = page.locator('div.hover\\:shadow-md:has-text("BlueSky")');
  55  |     await expect(blueskyCard.locator('text=Chi nhánh miền Nam')).toBeVisible({ timeout: 10000 });
  56  |     await expect(blueskyCard.locator('text=Tệp: Wholesale')).toBeVisible({ timeout: 10000 });
  57  | 
  58  |     // 2. Navigate to Promotions page to create a Wholesale-specific Auto-Apply promotion
  59  |     await page.goto("/promotions");
  60  |     await page.click("text=Tạo chiến dịch");
  61  | 
  62  |     // Locate dialog container
  63  |     const dialog = page.locator('div[role="dialog"]');
  64  |     await expect(dialog).toBeVisible({ timeout: 5000 });
  65  | 
  66  |     // Fill form inside dialog
  67  |     await dialog.locator('input[placeholder="Ví dụ: Ưu đãi ngày hè, Giảm giá cuối tháng..."]').fill("Wholesale Mega Deal");
  68  |     
  69  |     // Toggle auto-apply inside dialog
  70  |     const autoApplySwitch = dialog.locator('button[role="switch"]').first();
  71  |     await autoApplySwitch.click();
  72  | 
  73  |     // Select Customer Group target -> wholesale inside dialog
  74  |     const targetGroupSelect = dialog.locator('div.space-y-2:has-text("Đối tượng khách hàng") button');
  75  |     await expect(targetGroupSelect).toBeVisible({ timeout: 5000 });
  76  |     await targetGroupSelect.click();
  77  |     await page.click('div[role="presentation"] >> text=Khách mua sỉ');
  78  | 
  79  |     // Select discount type -> Percentage and enter 15% inside dialog
  80  |     await dialog.locator('input[placeholder="10"]').fill("15");
  81  | 
  82  |     // Click Submit inside dialog
  83  |     await dialog.locator('button:has-text("Kích hoạt")').click();
  84  | 
  85  |     // Verify it is created in the table
  86  |     await expect(page.locator("body")).toContainText("Wholesale Mega Deal", { timeout: 10000 });
  87  | 
  88  |     // 3. Navigate to POS to check segmentation auto-apply rules
  89  |     await page.goto("/pos");
  90  |     
  91  |     // Add product "Thẻ QR cá nhân thông minh"
  92  |     await page.waitForSelector(".grid >> text=Thẻ QR");
  93  |     await page.click("text=Thẻ QR cá nhân thông minh");
  94  | 
  95  |     // Selected customer is walk-in (no wholesale tệp) -> Wholesale Mega Deal should NOT apply
  96  |     await page.waitForTimeout(1000);
  97  |     await expect(page.locator("body")).not.toContainText("Wholesale Mega Deal");
  98  | 
  99  |     // Now select "Cửa hàng Thời trang BlueSky" as the customer
> 100 |     await page.click('button:has-text("Chọn khách hàng")');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  101 |     const searchCustomerInput = page.locator('input[placeholder="Tìm khách hàng (F4)..."]');
  102 |     await searchCustomerInput.fill("BlueSky");
  103 |     await page.waitForTimeout(600);
  104 |     await page.click('text=Cửa hàng Thời trang BlueSky');
  105 | 
  106 |     // Trigger auto-apply evaluation
  107 |     await page.waitForTimeout(1500);
  108 | 
  109 |     // Verify that the Wholesale Mega Deal is now auto-applied because customer belongs to wholesale segment!
  110 |     await expect(page.locator("body")).toContainText("Tự động: Wholesale Mega Deal", { timeout: 10000 });
  111 | 
  112 |     // Discount value: 15% of 69k = 10,350đ
  113 |     const discountDisplay = page.locator("text=-10.350đ");
  114 |     await expect(discountDisplay).toBeVisible({ timeout: 5000 });
  115 |   });
  116 | });
  117 | 
```
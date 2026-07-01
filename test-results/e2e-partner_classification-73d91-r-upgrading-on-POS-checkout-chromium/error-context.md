# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\partner_classification.spec.ts >> Partner Classification & Promotion Segmentation E2E Tests >> should support simulated QR VIP scanning and automatic loyalty tier upgrading on POS checkout
- Location: tests\e2e\partner_classification.spec.ts:124:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('div[role="presentation"]').locator('text=Khách Hàng Mới')

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
            - generic [ref=e332]:
              - img [ref=e333]
              - heading "Giỏ hàng" [level=2] [ref=e337]
              - generic [ref=e338]: "0"
            - combobox [ref=e339] [cursor=pointer]:
              - generic:
                - generic: Cửa hàng bán lẻ (POS)
              - img [ref=e340]
            - combobox [ref=e342] [cursor=pointer]:
              - generic:
                - generic:
                  - img
                  - text: Kho chính
                  - generic: Mặc định
              - img [ref=e343]
          - generic [ref=e345]:
            - generic [ref=e346]:
              - generic [ref=e347]:
                - img [ref=e348]
                - generic [ref=e351]: Khách hàng
              - button "Giả lập Quét VIP" [ref=e352] [cursor=pointer]:
                - img
                - text: Giả lập Quét VIP
            - generic [ref=e353]:
              - generic [ref=e354]:
                - textbox "Tìm khách hàng (tên, SĐT, mã)..." [ref=e355]: Mới
                - button "Thêm khách hàng mới" [ref=e356] [cursor=pointer]:
                  - img
              - combobox [ref=e357] [cursor=pointer]:
                - generic: Khách lẻ
                - img [ref=e358]
          - generic [ref=e364]:
            - img [ref=e365]
            - paragraph [ref=e369]: Giỏ hàng trống
            - paragraph [ref=e370]: Nhấn vào sản phẩm để thêm
          - generic [ref=e371]:
            - generic [ref=e372]:
              - generic [ref=e373]:
                - generic [ref=e375]: Giảm giá
                - textbox "0" [ref=e376]
              - generic [ref=e377]:
                - text: Phí ship
                - textbox "0" [ref=e378]
            - generic [ref=e379]:
              - text: Ghi chú
              - textbox "Ghi chú đơn hàng..." [ref=e380]
            - generic [ref=e381]:
              - generic [ref=e382]:
                - generic [ref=e383]: Tạm tính
                - generic [ref=e384]: 0đ
              - generic [ref=e385]:
                - generic [ref=e386]: Tổng cộng
                - generic [ref=e387]: 0đ
            - generic [ref=e388]:
              - button "Tiền mặt" [disabled]:
                - img
                - text: Tiền mặt
              - button "Chuyển khoản" [disabled]:
                - img
                - text: Chuyển khoản
    - button "Trợ lý AI" [ref=e389] [cursor=pointer]:
      - img [ref=e393]
```

# Test source

```ts
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
  100 |     const searchCustomerInput = page.locator('input[placeholder="Tìm khách hàng (tên, SĐT, mã)..."]');
  101 |     await expect(searchCustomerInput).toBeVisible({ timeout: 5000 });
  102 |     await searchCustomerInput.fill("BlueSky");
  103 |     await page.waitForTimeout(600);
  104 | 
  105 |     // Open customer select dropdown
  106 |     const customerSelectTrigger = page.locator('div.space-y-2 button[role="combobox"]').first();
  107 |     await customerSelectTrigger.click();
  108 |     await page.waitForTimeout(500);
  109 | 
  110 |     // Select Cửa hàng Thời trang BlueSky
  111 |     await page.click('div[role="presentation"] >> text=Cửa hàng Thời trang BlueSky');
  112 | 
  113 |     // Trigger auto-apply evaluation
  114 |     await page.waitForTimeout(1500);
  115 | 
  116 |     // Verify that the Wholesale Mega Deal is now auto-applied because customer belongs to wholesale segment!
  117 |     await expect(page.locator("body")).toContainText("Tự động: Wholesale Mega Deal", { timeout: 10000 });
  118 | 
  119 |     // Discount value: 15% of 69k = 10,350đ
  120 |     const discountDisplay = page.locator("text=-10.350đ");
  121 |     await expect(discountDisplay).toBeVisible({ timeout: 5000 });
  122 |   });
  123 | 
  124 |   test("should support simulated QR VIP scanning and automatic loyalty tier upgrading on POS checkout", async ({ page }) => {
  125 |     test.setTimeout(60000);
  126 | 
  127 |     // 1. Navigate to Partners to create a new retail customer
  128 |     await page.goto("/partners");
  129 |     await page.click("text=Thêm mới");
  130 | 
  131 |     const partnerForm = page.locator('form');
  132 |     await expect(partnerForm).toBeVisible({ timeout: 5000 });
  133 | 
  134 |     // Fill partner creation fields
  135 |     await partnerForm.locator('input#code').fill("KH-NEW-RETAIL");
  136 |     await partnerForm.locator('input#name').fill("Khách Hàng Mới");
  137 |     
  138 |     // Choose Tệp khuyến mãi -> Khách lẻ / Tất cả (retail) which maps to promo_segment="all"
  139 |     const promoSegmentSelect = partnerForm.locator('div.space-y-2:has-text("Tệp khuyến mãi áp dụng") button');
  140 |     await promoSegmentSelect.click();
  141 |     await page.click('div[role="presentation"] >> text=Khách lẻ / Tất cả');
  142 | 
  143 |     // Click Submit
  144 |     await partnerForm.locator('button:has-text("Kích hoạt")').click();
  145 |     await page.waitForTimeout(1000);
  146 | 
  147 |     // 2. Navigate to POS
  148 |     await page.goto("/pos");
  149 | 
  150 |     // Select "Khách Hàng Mới" as the customer
  151 |     const searchCustomerInput = page.locator('input[placeholder="Tìm khách hàng (tên, SĐT, mã)..."]');
  152 |     await expect(searchCustomerInput).toBeVisible({ timeout: 5000 });
  153 |     await searchCustomerInput.fill("Mới");
  154 |     await page.waitForTimeout(600);
  155 | 
  156 |     // Open customer select dropdown
  157 |     const customerSelectTrigger = page.locator('div.space-y-2 button[role="combobox"]').first();
  158 |     await customerSelectTrigger.click();
  159 |     await page.waitForTimeout(500);
  160 | 
  161 |     // Select Khách Hàng Mới
> 162 |     await page.click('div[role="presentation"] >> text=Khách Hàng Mới');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  163 |     await page.waitForTimeout(500);
  164 | 
  165 |     // 3. Perform a checkout that crosses the 10,000,000đ threshold to trigger VIP auto-upgrade!
  166 |     // Add product "Thẻ QR cá nhân thông minh"
  167 |     await page.waitForSelector(".grid >> text=Thẻ QR");
  168 |     await page.click("text=Thẻ QR cá nhân thông minh");
  169 |     await page.waitForTimeout(500);
  170 | 
  171 |     // Locate the unit price input inside cart item to bypass inventory limits by setting it to 11 million
  172 |     const priceInput = page.locator('input.w-24.h-7.text-xs').first();
  173 |     await expect(priceInput).toBeVisible({ timeout: 5000 });
  174 |     await priceInput.fill("11000000");
  175 |     await page.waitForTimeout(500);
  176 | 
  177 |     // Click "Tiền mặt" checkout button (Channel is auto-selected on POS load)
  178 |     await page.click('button:has-text("Tiền mặt")');
  179 | 
  180 |     // Wait for the consolidated thăng hạng VIP toast
  181 |     await expect(page.locator("text=Thăng hạng Thành viên VIP").first()).toBeVisible({ timeout: 15000 });
  182 | 
  183 |     // 4. Now let's navigate to Partners, search for Khách Hàng Mới and check detail card
  184 |     await page.goto("/partners");
  185 |     await page.waitForSelector("text=Quản lý đối tác");
  186 | 
  187 |     // Search for the upgraded customer using the last placeholder input to avoid strict mode header conflicts
  188 |     const searchInput = page.locator('input[placeholder="Tìm kiếm..."]').last();
  189 |     await searchInput.fill("Khách Hàng Mới");
  190 |     await page.waitForTimeout(500);
  191 | 
  192 |     // Click "Chi tiết" button on the customer card
  193 |     const targetCard = page.locator(`div.hover\\:shadow-md:has-text("Khách Hàng Mới")`);
  194 |     await targetCard.locator('button:has-text("Chi tiết")').click();
  195 | 
  196 |     // Verify glassmorphic loyalty membership card is displayed and shows "VIP Member" badge!
  197 |     const detailDialog = page.locator('div[role="dialog"]');
  198 |     await expect(detailDialog.locator('text=VIP Member')).toBeVisible({ timeout: 10000 });
  199 |   });
  200 | });
  201 | 
```
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
  - waiting for locator('button:has-text("Thanh toán (")')

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
              - generic [ref=e354]:
                - img [ref=e355]
                - generic [ref=e358]: Khách hàng
              - button "Giả lập Quét VIP" [ref=e359] [cursor=pointer]:
                - img
                - text: Giả lập Quét VIP
            - generic [ref=e360]:
              - textbox "Tìm khách hàng (tên, SĐT, mã)..." [ref=e361]
              - combobox [ref=e362] [cursor=pointer]:
                - generic:
                  - generic:
                    - generic: Công ty Cổ phần Techcom
                    - generic: 0243987654 • 1200 điểm
                - img [ref=e363]
          - generic [ref=e369]:
            - generic [ref=e370]:
              - heading "Thẻ QR cá nhân thông minh" [level=4] [ref=e371]
              - paragraph [ref=e372]: PRD-QR-CARD
              - generic [ref=e373]:
                - spinbutton [ref=e374]: "11000000"
                - generic [ref=e375]: đ/sp
            - generic [ref=e376]:
              - button [ref=e377] [cursor=pointer]:
                - img
              - generic [ref=e378]:
                - button [ref=e379] [cursor=pointer]:
                  - img
                - textbox [ref=e380]: "1"
                - button [ref=e381] [cursor=pointer]:
                  - img
              - generic [ref=e382]: 11.000.000đ
          - generic [ref=e383]:
            - generic [ref=e384]:
              - generic [ref=e385]:
                - generic [ref=e386]:
                  - generic [ref=e387]: Giảm giá
                  - generic [ref=e388]: "Tự động: Tự động giảm 10% đơn từ 200k"
                - textbox "0" [ref=e389]: "50000"
              - generic [ref=e390]:
                - text: Phí ship
                - textbox "0" [ref=e391]
            - generic [ref=e392]:
              - text: Ghi chú
              - textbox "Ghi chú đơn hàng..." [ref=e393]
            - generic [ref=e394]:
              - generic [ref=e395]:
                - generic [ref=e396]: Tạm tính
                - generic [ref=e397]: 11.000.000đ
              - generic [ref=e398]:
                - generic [ref=e399]: Giảm giá
                - generic [ref=e400]: "-50.000đ"
              - generic [ref=e401]:
                - generic [ref=e402]: Tổng cộng
                - generic [ref=e403]: 10.950.000đ
            - generic [ref=e404]:
              - button "Tiền mặt" [ref=e405] [cursor=pointer]:
                - img
                - text: Tiền mặt
              - button "Chuyển khoản" [ref=e406] [cursor=pointer]:
                - img
                - text: Chuyển khoản
    - button "Trợ lý AI" [ref=e407] [cursor=pointer]:
      - img [ref=e411]
```

# Test source

```ts
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
  127 |     // 1. Navigate to POS
  128 |     await page.goto("/pos");
  129 | 
  130 |     // Click "Giả lập Quét VIP"
  131 |     const qrScanBtn = page.locator('button:has-text("Giả lập Quét VIP")');
  132 |     await expect(qrScanBtn).toBeVisible({ timeout: 5000 });
  133 |     await qrScanBtn.click();
  134 | 
  135 |     // Verify success toast that scanner simulated OK
  136 |     await expect(page.locator("text=Quét thẻ thành viên thành công").first()).toBeVisible({ timeout: 10000 });
  137 | 
  138 |     // Verify customer is selected
  139 |     const selectedCustomerValue = page.locator('div.space-y-2 button[role="combobox"]').first();
  140 |     await expect(selectedCustomerValue).not.toContainText("Khách lẻ", { timeout: 10000 });
  141 | 
  142 |     const fullSelectedText = await selectedCustomerValue.textContent();
  143 |     const selectedCustomerName = fullSelectedText?.split("•")[0]?.replace(/[0-9]/g, "")?.trim() || "Techcom";
  144 | 
  145 |     // 2. Perform a checkout that crosses the 10,000,000đ threshold to trigger VIP auto-upgrade!
  146 |     // Add product "Thẻ QR cá nhân thông minh"
  147 |     await page.waitForSelector(".grid >> text=Thẻ QR");
  148 |     await page.click("text=Thẻ QR cá nhân thông minh");
  149 |     await page.waitForTimeout(500);
  150 | 
  151 |     // Locate the unit price input inside cart item to bypass inventory limits by setting it to 11 million
  152 |     const priceInput = page.locator('input.w-24.h-7.text-xs').first();
  153 |     await expect(priceInput).toBeVisible({ timeout: 5000 });
  154 |     await priceInput.fill("11000000");
  155 |     await page.waitForTimeout(500);
  156 | 
  157 |     // Click "Thanh toán" button (Channel is auto-selected on POS load)
> 158 |     await page.click('button:has-text("Thanh toán (")');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  159 | 
  160 |     // Wait for the thăng hạng VIP toast & checkout success toast!
  161 |     await expect(page.locator("text=Thanh toán thành công").first()).toBeVisible({ timeout: 15000 });
  162 |     await expect(page.locator("text=Thăng hạng Thành viên VIP").first()).toBeVisible({ timeout: 15000 });
  163 | 
  164 |     // 3. Now let's navigate to Partners, search for the dynamically upgraded customer and check detail card
  165 |     await page.goto("/partners");
  166 |     await page.waitForSelector("text=Quản lý đối tác");
  167 | 
  168 |     // Search for the upgraded customer
  169 |     const searchInput = page.locator('input[placeholder="Tìm kiếm..."]');
  170 |     await searchInput.fill(selectedCustomerName);
  171 |     await page.waitForTimeout(500);
  172 | 
  173 |     // Click "Chi tiết" button on the customer card
  174 |     const targetCard = page.locator(`div.hover\\:shadow-md:has-text("${selectedCustomerName}")`);
  175 |     await targetCard.locator('button:has-text("Chi tiết")').click();
  176 | 
  177 |     // Verify glassmorphic loyalty membership card is displayed and shows "VIP Member" badge!
  178 |     const detailDialog = page.locator('div[role="dialog"]');
  179 |     await expect(detailDialog.locator('text=VIP Member')).toBeVisible({ timeout: 10000 });
  180 |   });
  181 | });
  182 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\partner_classification.spec.ts >> Partner Classification & Promotion Segmentation E2E Tests >> should support simulated QR VIP scanning and automatic loyalty tier upgrading on POS checkout
- Location: tests\e2e\partner_classification.spec.ts:124:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Thăng hạng Thành viên VIP').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('text=Thăng hạng Thành viên VIP').first()

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T":
  - list:
    - listitem:
      - img
      - text: Tạo đơn hàng thành công
- complementary:
  - text: E ERP Mini
  - button:
    - img
  - navigation:
    - button "Kinh doanh" [expanded]:
      - img
      - text: Kinh doanh
    - link "Dashboard":
      - /url: /
      - img
      - text: Dashboard
    - link "POS Bán hàng":
      - /url: /pos
      - img
      - text: POS Bán hàng
    - link "Khuyến mãi":
      - /url: /promotions
      - img
      - text: Khuyến mãi
    - link "Đơn hàng":
      - /url: /orders
      - img
      - text: Đơn hàng
    - link "Kho hàng":
      - /url: /inventory
      - img
      - text: Kho hàng
    - link "Quản lý kho":
      - /url: /warehouses
      - img
      - text: Quản lý kho
    - link "Đối tác":
      - /url: /partners
      - img
      - text: Đối tác
    - link "Tra cứu đơn hàng":
      - /url: /tracking
      - img
      - text: Tra cứu đơn hàng
    - link "Công nợ":
      - /url: /debt-report
      - img
      - text: Công nợ
    - link "E-Office":
      - /url: /e-office
      - img
      - text: E-Office
    - link "Dashboard Chỉ thị":
      - /url: /directive-dashboard
      - img
      - text: Dashboard Chỉ thị
    - link "Hợp đồng":
      - /url: /contracts
      - img
      - text: Hợp đồng
    - link "Đặt lịch":
      - /url: /bookings
      - img
      - text: Đặt lịch
    - link "Tự động hóa":
      - /url: /workflows
      - img
      - text: Tự động hóa
    - link "Sales Agent AI":
      - /url: /sales-agent
      - img
      - text: Sales Agent AI
    - link "Data Hub":
      - /url: /data-hub
      - img
      - text: Data Hub
    - link "Tài sản số":
      - /url: /digital-assets
      - img
      - text: Tài sản số
    - link "Kế toán":
      - /url: /accounting
      - img
      - text: Kế toán
    - link "Tài chính":
      - /url: /finance
      - img
      - text: Tài chính
    - link "Báo cáo":
      - /url: /reports
      - img
      - text: Báo cáo
    - button "Hiệu suất":
      - img
      - text: Hiệu suất
    - button "Tài liệu":
      - img
      - text: Tài liệu
  - link "Cài đặt":
    - /url: /settings
    - img
    - text: Cài đặt
  - button "Đăng xuất":
    - img
    - text: Đăng xuất
- main:
  - img
  - textbox "Tìm sản phẩm theo tên hoặc mã SKU..."
  - combobox: Tất cả
  - img
  - heading "Sticker logo decal giấy" [level=3]
  - paragraph: PRD-STICKER
  - text: 99.000đ 450
  - img
  - heading "Card cảm ơn / Thank you card" [level=3]
  - paragraph: PRD-CARD
  - text: 119.000đ 600
  - img
  - heading "Bảng QR để bàn mica" [level=3]
  - paragraph: PRD-QR-BOARD
  - text: 109.000đ 80
  - img
  - heading "Tem QR thanh toán decal" [level=3]
  - paragraph: PRD-QR-STICKER
  - text: 69.000đ 200
  - img
  - heading "Thẻ QR cá nhân thông minh" [level=3]
  - paragraph: PRD-QR-CARD
  - text: 69.000đ 149
  - img
  - heading "Combo Shop Mới Khởi Nghiệp" [level=3]
  - paragraph: PRD-COMBO-NEW
  - text: 349.000đ 40
  - img
  - heading "Dịch vụ thiết kế Avatar & QR" [level=3]
  - paragraph: PRD-DESIGN-QR
  - text: 149.000đ 0
  - img
  - heading "Bao bì / Hộp gia công nhỏ" [level=3]
  - paragraph: PRD-BOX
  - text: 179.000đ 200
  - img
  - heading "Giấy decal bóng (A4)" [level=3]
  - paragraph: MAT-DECAL
  - text: 3.000đ 1000
  - img
  - heading "Giấy Couche 300gsm (A4)" [level=3]
  - paragraph: MAT-COUCHE
  - text: 4.000đ 1500
  - img
  - heading "Mực in Pigment (ml)" [level=3]
  - paragraph: MAT-INK
  - text: 1.000đ 2000
  - img
  - heading "Tấm mica trong 2mm (A4 size)" [level=3]
  - paragraph: MAT-MICA
  - text: 30.000đ 200
  - img
  - heading "Tấm Formex 3mm (A4 size)" [level=3]
  - paragraph: MAT-FORMEX
  - text: 16.000đ 300
  - img
  - heading "Hộp carton & băng keo" [level=3]
  - paragraph: MAT-BOX
  - text: 6.000đ 500
  - img
  - heading "Giỏ hàng" [level=2]
  - text: "0"
  - combobox: Cửa hàng bán lẻ (POS)
  - combobox:
    - img
    - text: Kho chính Mặc định
  - img
  - text: Khách hàng
  - button "Giả lập Quét VIP":
    - img
    - text: Giả lập Quét VIP
  - textbox "Tìm khách hàng (tên, SĐT, mã)..."
  - combobox: Khách lẻ
  - img
  - paragraph: Giỏ hàng trống
  - paragraph: Nhấn vào sản phẩm để thêm
  - text: Giảm giá
  - textbox "0"
  - text: Phí ship
  - textbox "0"
  - text: Ghi chú
  - textbox "Ghi chú đơn hàng..."
  - text: Tạm tính 0đ Tổng cộng 0đ
  - button "Tiền mặt" [disabled]:
    - img
    - text: Tiền mặt
  - button "Chuyển khoản" [disabled]:
    - img
    - text: Chuyển khoản
- button "Trợ lý AI":
  - img
```

# Test source

```ts
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
  162 |     await page.click('div[role="presentation"] >> text=Khách Hàng Mới');
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
  180 |     // Wait for the thăng hạng VIP toast & checkout success toast!
  181 |     await expect(page.locator("text=Thanh toán thành công").first()).toBeVisible({ timeout: 15000 });
> 182 |     await expect(page.locator("text=Thăng hạng Thành viên VIP").first()).toBeVisible({ timeout: 15000 });
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  183 | 
  184 |     // 4. Now let's navigate to Partners, search for Khách Hàng Mới and check detail card
  185 |     await page.goto("/partners");
  186 |     await page.waitForSelector("text=Quản lý đối tác");
  187 | 
  188 |     // Search for the upgraded customer
  189 |     const searchInput = page.locator('input[placeholder="Tìm kiếm..."]');
  190 |     await searchInput.fill("Khách Hàng Mới");
  191 |     await page.waitForTimeout(500);
  192 | 
  193 |     // Click "Chi tiết" button on the customer card
  194 |     const targetCard = page.locator(`div.hover\\:shadow-md:has-text("Khách Hàng Mới")`);
  195 |     await targetCard.locator('button:has-text("Chi tiết")').click();
  196 | 
  197 |     // Verify glassmorphic loyalty membership card is displayed and shows "VIP Member" badge!
  198 |     const detailDialog = page.locator('div[role="dialog"]');
  199 |     await expect(detailDialog.locator('text=VIP Member')).toBeVisible({ timeout: 10000 });
  200 |   });
  201 | });
  202 | 
```
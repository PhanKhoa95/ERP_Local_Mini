# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\category_promotions.spec.ts >> Category-Specific Promotions & Quick Customer E2E Tests >> should support adding customer directly from POS and apply category-restricted promotions
- Location: tests\e2e\category_promotions.spec.ts:13:3

# Error details

```
Error: expect(locator).not.toContainText(expected) failed

Locator: locator('body')
Expected substring: not "Material Special 20%"
Received string: "
    EERP MiniKinh doanhDashboardPOS Bán hàngKhuyến mãiĐơn hàngKho hàngQuản lý khoĐối tácTra cứu đơn hàngCông nợE-OfficeDashboard Chỉ thịHợp đồngĐặt lịchTự động hóaSales Agent AIData HubTài sản sốKế toánTài chínhBáo cáoHiệu suấtTài liệuCài đặtĐăng xuấtEERP MiniTất cảSticker logo decal giấyPRD-STICKER99.000đ450Card cảm ơn / Thank you cardPRD-CARD119.000đ600Bảng QR để bàn micaPRD-QR-BOARD109.000đ80Tem QR thanh toán decalPRD-QR-STICKER69.000đ200Thẻ QR cá nhân thông minhPRD-QR-CARD69.000đ150Combo Shop Mới Khởi NghiệpPRD-COMBO-NEW349.000đ40Dịch vụ thiết kế Avatar & QRPRD-DESIGN-QR149.000đ0Bao bì / Hộp gia công nhỏPRD-BOX179.000đ200Giấy decal bóng (A4)MAT-DECAL3.000đ1000Giấy Couche 300gsm (A4)MAT-COUCHE4.000đ1500Mực in Pigment (ml)MAT-INK1.000đ2000Tấm mica trong 2mm (A4 size)MAT-MICA30.000đ200Tấm Formex 3mm (A4 size)MAT-FORMEX16.000đ300Hộp carton & băng keoMAT-BOX6.000đ500Giỏ hàng1XóaCửa hàng bán lẻ (POS)Kho chínhMặc địnhĐủ hàng tại Kho chínhKhách hàng Giả lập Quét VIPKhách Hàng POS MớiKH-QUICK-POSThẻ QR cá nhân thông minhPRD-QR-CARDđ/sp69.000đGiảm giáTự động: Material Special 20%Phí shipGhi chúTạm tính69.000đGiảm giá-13.800đTổng cộng55.200đTiền mặtChuyển khoản1
    
  

"
Timeout: 5000ms

Call log:
  - Expect "not toContainText" with timeout 5000ms
  - waiting for locator('body')
    4 × locator resolved to <body>…</body>
      - unexpected value "
    Thêm đối tác thành côngĐã chọn khách hàng "Khách Hàng POS Mới" cho đơn hàng.EERP MiniKinh doanhDashboardPOS Bán hàngKhuyến mãiĐơn hàngKho hàngQuản lý khoĐối tácTra cứu đơn hàngCông nợE-OfficeDashboard Chỉ thịHợp đồngĐặt lịchTự động hóaSales Agent AIData HubTài sản sốKế toánTài chínhBáo cáoHiệu suấtTài liệuCài đặtĐăng xuấtEERP MiniTất cảSticker logo decal giấyPRD-STICKER99.000đ450Card cảm ơn / Thank you cardPRD-CARD119.000đ600Bảng QR để bàn micaPRD-QR-BOARD109.000đ80Tem QR thanh toán decalPRD-QR-STICKER69.000đ200Thẻ QR cá nhân thông minhPRD-QR-CARD69.000đ150Combo Shop Mới Khởi NghiệpPRD-COMBO-NEW349.000đ40Dịch vụ thiết kế Avatar & QRPRD-DESIGN-QR149.000đ0Bao bì / Hộp gia công nhỏPRD-BOX179.000đ200Giấy decal bóng (A4)MAT-DECAL3.000đ1000Giấy Couche 300gsm (A4)MAT-COUCHE4.000đ1500Mực in Pigment (ml)MAT-INK1.000đ2000Tấm mica trong 2mm (A4 size)MAT-MICA30.000đ200Tấm Formex 3mm (A4 size)MAT-FORMEX16.000đ300Hộp carton & băng keoMAT-BOX6.000đ500Giỏ hàng1XóaCửa hàng bán lẻ (POS)Kho chínhMặc địnhĐủ hàng tại Kho chínhKhách hàng Giả lập Quét VIPKhách Hàng POS MớiKH-QUICK-POSThẻ QR cá nhân thông minhPRD-QR-CARDđ/sp69.000đGiảm giáTự động: Material Special 20%Phí shipGhi chúTạm tính69.000đGiảm giá-13.800đTổng cộng55.200đTiền mặtChuyển khoản1
    
  

Notification Thêm đối tác thành côngĐã chọn khách hàng "Khách Hàng POS Mới" cho đơn hàng."
    8 × locator resolved to <body>…</body>
      - unexpected value "
    Thêm đối tác thành côngĐã chọn khách hàng "Khách Hàng POS Mới" cho đơn hàng.EERP MiniKinh doanhDashboardPOS Bán hàngKhuyến mãiĐơn hàngKho hàngQuản lý khoĐối tácTra cứu đơn hàngCông nợE-OfficeDashboard Chỉ thịHợp đồngĐặt lịchTự động hóaSales Agent AIData HubTài sản sốKế toánTài chínhBáo cáoHiệu suấtTài liệuCài đặtĐăng xuấtEERP MiniTất cảSticker logo decal giấyPRD-STICKER99.000đ450Card cảm ơn / Thank you cardPRD-CARD119.000đ600Bảng QR để bàn micaPRD-QR-BOARD109.000đ80Tem QR thanh toán decalPRD-QR-STICKER69.000đ200Thẻ QR cá nhân thông minhPRD-QR-CARD69.000đ150Combo Shop Mới Khởi NghiệpPRD-COMBO-NEW349.000đ40Dịch vụ thiết kế Avatar & QRPRD-DESIGN-QR149.000đ0Bao bì / Hộp gia công nhỏPRD-BOX179.000đ200Giấy decal bóng (A4)MAT-DECAL3.000đ1000Giấy Couche 300gsm (A4)MAT-COUCHE4.000đ1500Mực in Pigment (ml)MAT-INK1.000đ2000Tấm mica trong 2mm (A4 size)MAT-MICA30.000đ200Tấm Formex 3mm (A4 size)MAT-FORMEX16.000đ300Hộp carton & băng keoMAT-BOX6.000đ500Giỏ hàng1XóaCửa hàng bán lẻ (POS)Kho chínhMặc địnhĐủ hàng tại Kho chínhKhách hàng Giả lập Quét VIPKhách Hàng POS MớiKH-QUICK-POSThẻ QR cá nhân thông minhPRD-QR-CARDđ/sp69.000đGiảm giáTự động: Material Special 20%Phí shipGhi chúTạm tính69.000đGiảm giá-13.800đTổng cộng55.200đTiền mặtChuyển khoản1
    
  

"
    - locator resolved to <body>…</body>
    - unexpected value "
    EERP MiniKinh doanhDashboardPOS Bán hàngKhuyến mãiĐơn hàngKho hàngQuản lý khoĐối tácTra cứu đơn hàngCông nợE-OfficeDashboard Chỉ thịHợp đồngĐặt lịchTự động hóaSales Agent AIData HubTài sản sốKế toánTài chínhBáo cáoHiệu suấtTài liệuCài đặtĐăng xuấtEERP MiniTất cảSticker logo decal giấyPRD-STICKER99.000đ450Card cảm ơn / Thank you cardPRD-CARD119.000đ600Bảng QR để bàn micaPRD-QR-BOARD109.000đ80Tem QR thanh toán decalPRD-QR-STICKER69.000đ200Thẻ QR cá nhân thông minhPRD-QR-CARD69.000đ150Combo Shop Mới Khởi NghiệpPRD-COMBO-NEW349.000đ40Dịch vụ thiết kế Avatar & QRPRD-DESIGN-QR149.000đ0Bao bì / Hộp gia công nhỏPRD-BOX179.000đ200Giấy decal bóng (A4)MAT-DECAL3.000đ1000Giấy Couche 300gsm (A4)MAT-COUCHE4.000đ1500Mực in Pigment (ml)MAT-INK1.000đ2000Tấm mica trong 2mm (A4 size)MAT-MICA30.000đ200Tấm Formex 3mm (A4 size)MAT-FORMEX16.000đ300Hộp carton & băng keoMAT-BOX6.000đ500Giỏ hàng1XóaCửa hàng bán lẻ (POS)Kho chínhMặc địnhĐủ hàng tại Kho chínhKhách hàng Giả lập Quét VIPKhách Hàng POS MớiKH-QUICK-POSThẻ QR cá nhân thông minhPRD-QR-CARDđ/sp69.000đGiảm giáTự động: Material Special 20%Phí shipGhi chúTạm tính69.000đGiảm giá-13.800đTổng cộng55.200đTiền mặtChuyển khoản1
    
  

"

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
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
  - text: 69.000đ 150
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
  - text: "1"
  - button "Xóa":
    - img
    - text: Xóa
  - combobox: Cửa hàng bán lẻ (POS)
  - combobox:
    - img
    - text: Kho chính Mặc định
  - img
  - text: Đủ hàng tại Kho chính
  - img
  - text: Khách hàng
  - button "Giả lập Quét VIP":
    - img
    - text: Giả lập Quét VIP
  - textbox "Tìm khách hàng (tên, SĐT, mã)..."
  - button "Thêm khách hàng mới":
    - img
  - combobox: Khách Hàng POS Mới KH-QUICK-POS
  - heading "Thẻ QR cá nhân thông minh" [level=4]
  - paragraph: PRD-QR-CARD
  - spinbutton: "69000"
  - text: đ/sp
  - button:
    - img
  - button:
    - img
  - textbox: "1"
  - button:
    - img
  - text: "69.000đ Giảm giá Tự động: Material Special 20%"
  - textbox "0": "13800"
  - text: Phí ship
  - textbox "0"
  - text: Ghi chú
  - textbox "Ghi chú đơn hàng..."
  - text: Tạm tính 69.000đ Giảm giá -13.800đ Tổng cộng 55.200đ
  - button "Tiền mặt":
    - img
    - text: Tiền mặt
  - button "Chuyển khoản":
    - img
    - text: Chuyển khoản
- button "Trợ lý AI":
  - img
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { loginLocalDemo } from "./helpers";
  3   | 
  4   | test.describe("Category-Specific Promotions & Quick Customer E2E Tests", () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Set viewport size
  7   |     await page.setViewportSize({ width: 1280, height: 960 });
  8   |     
  9   |     // Standard Demo Login helper
  10  |     await loginLocalDemo(page);
  11  |   });
  12  | 
  13  |   test("should support adding customer directly from POS and apply category-restricted promotions", async ({ page }) => {
  14  |     // Increase test timeout to ensure slow animations don't trigger timeout
  15  |     test.setTimeout(60000);
  16  | 
  17  |     // 1. Navigate to Promotions page to create a Category-Specific Promotion
  18  |     // Target: "Vat tu & Muc in" category, Auto-Apply: true, Discount: 20%
  19  |     await page.goto("/promotions");
  20  |     await page.click("text=Tạo chiến dịch");
  21  | 
  22  |     const dialog = page.locator('div[role="dialog"]');
  23  |     await expect(dialog).toBeVisible({ timeout: 5000 });
  24  | 
  25  |     // Fill campaign details
  26  |     await dialog.locator('input[placeholder="Ví dụ: Ưu đãi ngày hè, Giảm giá cuối tháng..."]').fill("Material Special 20%");
  27  |     
  28  |     // Toggle auto-apply
  29  |     const autoApplySwitch = dialog.locator('button[role="switch"]').first();
  30  |     await autoApplySwitch.click();
  31  | 
  32  |     // Select target category: Vat tu & Muc in
  33  |     const categorySelect = dialog.locator('div.space-y-2:has-text("Nhóm ngành hàng áp dụng") button');
  34  |     await expect(categorySelect).toBeVisible({ timeout: 5000 });
  35  |     await categorySelect.click();
  36  |     await page.click('div[role="presentation"] >> text=Vat tu & Muc in');
  37  | 
  38  |     // Select discount type: Percentage and enter 20%
  39  |     await dialog.locator('input[placeholder="10"]').fill("20");
  40  | 
  41  |     // Click Submit (Kích hoạt)
  42  |     await dialog.locator('button:has-text("Kích hoạt")').click();
  43  | 
  44  |     // Verify it is created in the table
  45  |     await expect(page.locator("body")).toContainText("Material Special 20%", { timeout: 10000 });
  46  | 
  47  |     // 2. Navigate to POS
  48  |     await page.goto("/pos");
  49  |     await page.waitForSelector(".grid >> text=Thẻ QR");
  50  | 
  51  |     // Click "+" button next to customer search input to quick add customer
  52  |     const plusBtn = page.locator('button[title="Thêm khách hàng mới"]');
  53  |     await expect(plusBtn).toBeVisible({ timeout: 5000 });
  54  |     await plusBtn.click();
  55  | 
  56  |     // Fill partner creation fields inside the quick add dialog
  57  |     const partnerDialog = page.locator('div[role="dialog"]');
  58  |     await expect(partnerDialog).toBeVisible({ timeout: 5000 });
  59  |     await partnerDialog.locator('input#code').fill("KH-QUICK-POS");
  60  |     await partnerDialog.locator('input#name').fill("Khách Hàng POS Mới");
  61  |     
  62  |     // Click Kích hoạt inside dialog
  63  |     await partnerDialog.locator('button:has-text("Kích hoạt")').click();
  64  | 
  65  |     // Wait for the success toast and check that customer is auto-selected in the POS combobox
  66  |     await expect(page.locator("text=Thêm đối tác thành công").first()).toBeVisible({ timeout: 10000 });
  67  |     const selectedCustomerValue = page.locator('div.space-y-2 button[role="combobox"]').first();
  68  |     await expect(selectedCustomerValue).toContainText("Khách Hàng POS Mới", { timeout: 10000 });
  69  | 
  70  |     // 3. Add products to cart:
  71  |     // Product 1: "Thẻ QR cá nhân thông minh" (Category: "Thanh pham", Price: 69,000đ)
  72  |     await page.click("text=Thẻ QR cá nhân thông minh");
  73  |     await page.waitForTimeout(500);
  74  | 
  75  |     // Verify subtotal is 69k and NO discount applies (since category is "Thanh pham", not "Vat tu & Muc in")
> 76  |     await expect(page.locator("body")).not.toContainText("Material Special 20%");
      |                                            ^ Error: expect(locator).not.toContainText(expected) failed
  77  | 
  78  |     // Product 2: "Giấy decal bóng (A4)" (Category: "Vat tu & Muc in", Price: 3,000đ)
  79  |     // Scroll down to click if needed, or filter
  80  |     const searchProdInput = page.locator('input[placeholder="Tìm sản phẩm theo tên hoặc mã SKU..."]');
  81  |     await searchProdInput.fill("decal");
  82  |     await page.waitForTimeout(500);
  83  |     await page.click("text=Giấy decal bóng (A4)");
  84  |     await page.waitForTimeout(500);
  85  | 
  86  |     // Verify that the "Material Special 20%" promotion is auto-applied!
  87  |     await expect(page.locator("body")).toContainText("Material Special 20%", { timeout: 10000 });
  88  | 
  89  |     // Verify discount value is calculated ONLY on the matching category product:
  90  |     // 20% of 3,000đ = 600đ (not 20% of 72,000đ = 14,400đ!)
  91  |     const discountDisplay = page.locator("text=-600đ");
  92  |     await expect(discountDisplay).toBeVisible({ timeout: 5000 });
  93  | 
  94  |     // 4. Perform a checkout using Tiền mặt
  95  |     await page.click('button:has-text("Tiền mặt")');
  96  | 
  97  |     // Wait for the success toast
  98  |     await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });
  99  |   });
  100 | });
  101 | 
```
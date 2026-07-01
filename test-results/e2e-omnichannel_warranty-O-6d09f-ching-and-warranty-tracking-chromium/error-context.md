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
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('div[role="option"]:has-text("Khách Hàng Ẩn Danh")')

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
            - link "Thẻ thành viên" [ref=e57] [cursor=pointer]:
              - /url: /memberships
              - img [ref=e58]
              - generic [ref=e60]: Thẻ thành viên
            - link "Tra cứu đơn hàng" [ref=e61] [cursor=pointer]:
              - /url: /tracking
              - img [ref=e62]
              - generic [ref=e68]: Tra cứu đơn hàng
            - link "Công nợ" [ref=e69] [cursor=pointer]:
              - /url: /debt-report
              - img [ref=e70]
              - generic [ref=e73]: Công nợ
            - link "E-Office" [ref=e74] [cursor=pointer]:
              - /url: /e-office
              - img [ref=e75]
              - generic [ref=e78]: E-Office
            - link "Dashboard Chỉ thị" [ref=e79] [cursor=pointer]:
              - /url: /directive-dashboard
              - img [ref=e80]
              - generic [ref=e82]: Dashboard Chỉ thị
            - link "Hợp đồng" [ref=e83] [cursor=pointer]:
              - /url: /contracts
              - img [ref=e84]
              - generic [ref=e87]: Hợp đồng
            - link "Đặt lịch" [ref=e88] [cursor=pointer]:
              - /url: /bookings
              - img [ref=e89]
              - generic [ref=e91]: Đặt lịch
            - link "Tự động hóa" [ref=e92] [cursor=pointer]:
              - /url: /workflows
              - img [ref=e93]
              - generic [ref=e97]: Tự động hóa
            - link "Sales Agent AI" [ref=e98] [cursor=pointer]:
              - /url: /sales-agent
              - img [ref=e99]
              - generic [ref=e102]: Sales Agent AI
            - link "Data Hub" [ref=e103] [cursor=pointer]:
              - /url: /data-hub
              - img [ref=e104]
              - generic [ref=e108]: Data Hub
            - link "Tài sản số" [ref=e109] [cursor=pointer]:
              - /url: /digital-assets
              - img [ref=e110]
              - generic [ref=e115]: Tài sản số
            - link "Kế toán" [ref=e116] [cursor=pointer]:
              - /url: /accounting
              - img [ref=e117]
              - generic [ref=e119]: Kế toán
            - link "Tài chính" [ref=e120] [cursor=pointer]:
              - /url: /finance
              - img [ref=e121]
              - generic [ref=e124]: Tài chính
            - link "Báo cáo" [ref=e125] [cursor=pointer]:
              - /url: /reports
              - img [ref=e126]
              - generic [ref=e128]: Báo cáo
        - button "Hiệu suất" [ref=e130] [cursor=pointer]:
          - img [ref=e131]
          - text: Hiệu suất
        - button "Tài liệu" [ref=e134] [cursor=pointer]:
          - img [ref=e135]
          - text: Tài liệu
      - generic [ref=e137]:
        - link "Cài đặt" [ref=e138] [cursor=pointer]:
          - /url: /settings
          - img [ref=e139]
          - generic [ref=e142]: Cài đặt
        - button "Đăng xuất" [ref=e143] [cursor=pointer]:
          - img [ref=e144]
          - generic [ref=e147]: Đăng xuất
    - main [ref=e148]:
      - generic [ref=e149]:
        - generic [ref=e150]:
          - generic [ref=e151]:
            - generic [ref=e152]:
              - img [ref=e153]
              - textbox "Tìm sản phẩm theo tên hoặc mã SKU..." [ref=e156]
            - combobox [ref=e157] [cursor=pointer]:
              - generic: Tất cả
              - img [ref=e158]
          - generic [ref=e163]:
            - generic [ref=e165] [cursor=pointer]:
              - img [ref=e167]
              - heading "Sticker logo decal giấy" [level=3] [ref=e171]
              - paragraph [ref=e172]: PRD-STICKER
              - generic [ref=e173]:
                - generic [ref=e174]: 99.000đ
                - generic [ref=e175]: "450"
            - generic [ref=e177] [cursor=pointer]:
              - img [ref=e179]
              - heading "Card cảm ơn / Thank you card" [level=3] [ref=e183]
              - paragraph [ref=e184]: PRD-CARD
              - generic [ref=e185]:
                - generic [ref=e186]: 119.000đ
                - generic [ref=e187]: "600"
            - generic [ref=e189] [cursor=pointer]:
              - img [ref=e191]
              - heading "Bảng QR để bàn mica" [level=3] [ref=e195]
              - paragraph [ref=e196]: PRD-QR-BOARD
              - generic [ref=e197]:
                - generic [ref=e198]: 109.000đ
                - generic [ref=e199]: "80"
            - generic [ref=e201] [cursor=pointer]:
              - img [ref=e203]
              - heading "Tem QR thanh toán decal" [level=3] [ref=e207]
              - paragraph [ref=e208]: PRD-QR-STICKER
              - generic [ref=e209]:
                - generic [ref=e210]: 69.000đ
                - generic [ref=e211]: "200"
            - generic [ref=e213] [cursor=pointer]:
              - img [ref=e215]
              - heading "Thẻ QR cá nhân thông minh" [level=3] [ref=e219]
              - paragraph [ref=e220]: PRD-QR-CARD
              - generic [ref=e221]:
                - generic [ref=e222]: 69.000đ
                - generic [ref=e223]: "149"
            - generic [ref=e225] [cursor=pointer]:
              - img [ref=e227]
              - heading "Combo Shop Mới Khởi Nghiệp" [level=3] [ref=e231]
              - paragraph [ref=e232]: PRD-COMBO-NEW
              - generic [ref=e233]:
                - generic [ref=e234]: 349.000đ
                - generic [ref=e235]: "40"
            - generic [ref=e237] [cursor=pointer]:
              - img [ref=e239]
              - heading "Dịch vụ thiết kế Avatar & QR" [level=3] [ref=e243]
              - paragraph [ref=e244]: PRD-DESIGN-QR
              - generic [ref=e245]:
                - generic [ref=e246]: 149.000đ
                - generic [ref=e247]: "0"
            - generic [ref=e249] [cursor=pointer]:
              - img [ref=e251]
              - heading "Bao bì / Hộp gia công nhỏ" [level=3] [ref=e255]
              - paragraph [ref=e256]: PRD-BOX
              - generic [ref=e257]:
                - generic [ref=e258]: 179.000đ
                - generic [ref=e259]: "200"
            - generic [ref=e261] [cursor=pointer]:
              - img [ref=e263]
              - heading "Giấy decal bóng (A4)" [level=3] [ref=e267]
              - paragraph [ref=e268]: MAT-DECAL
              - generic [ref=e269]:
                - generic [ref=e270]: 3.000đ
                - generic [ref=e271]: "1000"
            - generic [ref=e273] [cursor=pointer]:
              - img [ref=e275]
              - heading "Giấy Couche 300gsm (A4)" [level=3] [ref=e279]
              - paragraph [ref=e280]: MAT-COUCHE
              - generic [ref=e281]:
                - generic [ref=e282]: 4.000đ
                - generic [ref=e283]: "1500"
            - generic [ref=e285] [cursor=pointer]:
              - img [ref=e287]
              - heading "Mực in Pigment (ml)" [level=3] [ref=e291]
              - paragraph [ref=e292]: MAT-INK
              - generic [ref=e293]:
                - generic [ref=e294]: 1.000đ
                - generic [ref=e295]: "2000"
            - generic [ref=e297] [cursor=pointer]:
              - img [ref=e299]
              - heading "Tấm mica trong 2mm (A4 size)" [level=3] [ref=e303]
              - paragraph [ref=e304]: MAT-MICA
              - generic [ref=e305]:
                - generic [ref=e306]: 30.000đ
                - generic [ref=e307]: "200"
            - generic [ref=e309] [cursor=pointer]:
              - img [ref=e311]
              - heading "Tấm Formex 3mm (A4 size)" [level=3] [ref=e315]
              - paragraph [ref=e316]: MAT-FORMEX
              - generic [ref=e317]:
                - generic [ref=e318]: 16.000đ
                - generic [ref=e319]: "300"
            - generic [ref=e321] [cursor=pointer]:
              - img [ref=e323]
              - heading "Hộp carton & băng keo" [level=3] [ref=e327]
              - paragraph [ref=e328]: MAT-BOX
              - generic [ref=e329]:
                - generic [ref=e330]: 6.000đ
                - generic [ref=e331]: "500"
        - generic [ref=e333]:
          - generic [ref=e334]:
            - generic [ref=e335]:
              - generic [ref=e336]:
                - img [ref=e337]
                - heading "Giỏ hàng" [level=2] [ref=e341]
                - generic [ref=e342]: "1"
              - button "Xóa" [ref=e343] [cursor=pointer]:
                - img
                - text: Xóa
            - combobox [ref=e344] [cursor=pointer]:
              - generic:
                - generic: Cửa hàng bán lẻ (POS)
              - img [ref=e345]
            - combobox [ref=e347] [cursor=pointer]:
              - generic:
                - generic:
                  - img
                  - text: Kho chính
                  - generic: Mặc định
              - img [ref=e348]
            - generic [ref=e351]:
              - img [ref=e352]
              - generic [ref=e355]: Đủ hàng tại Kho chính
          - generic [ref=e356]:
            - generic [ref=e357]:
              - generic [ref=e358]:
                - img [ref=e359]
                - generic [ref=e362]: Khách hàng
              - button "Giả lập Quét VIP" [ref=e363] [cursor=pointer]:
                - img
                - text: Giả lập Quét VIP
            - generic [ref=e364]:
              - generic [ref=e365]:
                - textbox "Tìm khách hàng (tên, SĐT, mã)..." [ref=e366]: "0988777666"
                - button "Thêm khách hàng mới" [ref=e367] [cursor=pointer]:
                  - img
              - combobox [ref=e368] [cursor=pointer]:
                - generic: Khách lẻ
                - img [ref=e369]
          - generic [ref=e375]:
            - generic [ref=e376]:
              - heading "Thẻ QR cá nhân thông minh" [level=4] [ref=e377]
              - paragraph [ref=e378]: PRD-QR-CARD
              - generic [ref=e379]:
                - spinbutton [ref=e380]: "69000"
                - generic [ref=e381]: đ/sp
            - generic [ref=e382]:
              - button [ref=e383] [cursor=pointer]:
                - img
              - generic [ref=e384]:
                - button [ref=e385] [cursor=pointer]:
                  - img
                - textbox [ref=e386]: "1"
                - button [ref=e387] [cursor=pointer]:
                  - img
              - generic [ref=e388]: 69.000đ
          - generic [ref=e389]:
            - generic [ref=e390]:
              - generic [ref=e391]:
                - generic [ref=e393]: Giảm giá
                - textbox "0" [ref=e394]
              - generic [ref=e395]:
                - text: Phí ship
                - textbox "0" [ref=e396]
            - generic [ref=e397]:
              - text: Ghi chú
              - textbox "Ghi chú đơn hàng..." [ref=e398]
            - generic [ref=e399]:
              - generic [ref=e400]:
                - generic [ref=e401]: Tạm tính
                - generic [ref=e402]: 69.000đ
              - generic [ref=e403]:
                - generic [ref=e404]: Tổng cộng
                - generic [ref=e405]: 69.000đ
            - generic [ref=e407]:
              - button "Tiền mặt" [ref=e408] [cursor=pointer]:
                - img
                - text: Tiền mặt
              - button "Chuyển khoản" [ref=e409] [cursor=pointer]:
                - img
                - text: Chuyển khoản
    - button "Trợ lý AI" [ref=e410] [cursor=pointer]:
      - img [ref=e414]
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
  65  |     // Search for "0988777666" in customer selection input
  66  |     const searchCustomerInput = page.locator('input[placeholder="Tìm khách hàng (tên, SĐT, mã)..."]').first();
  67  |     await searchCustomerInput.fill("0988777666");
  68  |     await page.waitForTimeout(500);
  69  | 
  70  |     // Click the combobox trigger next to it
  71  |     const customerSelect = page.locator('div.space-y-2 button[role="combobox"]').first();
  72  |     await customerSelect.click();
  73  |     await page.waitForTimeout(500);
  74  | 
  75  |     // Click the matching result from dropdown options
> 76  |     await page.click('div[role="option"]:has-text("Khách Hàng Ẩn Danh")');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  77  | 
  78  |     // Checkout
  79  |     await page.click('button:has-text("Tiền mặt")');
  80  |     await expect(page.locator("text=Tạo đơn hàng thành công").first()).toBeVisible({ timeout: 15000 });
  81  | 
  82  |     // Step 4: Open profile details to inspect behavioral insights and active warranties!
  83  |     await page.goto("/partners");
  84  |     await page.waitForSelector("text=Thêm mới");
  85  |     await searchInput.fill("0988777666");
  86  |     await page.waitForTimeout(500);
  87  | 
  88  |     // Open detail dialog
  89  |     const targetCard = page.locator('.hover\\:shadow-md', { hasText: 'Khách Hàng Ẩn Danh' });
  90  |     await targetCard.locator('button:has-text("Chi tiết")').click();
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
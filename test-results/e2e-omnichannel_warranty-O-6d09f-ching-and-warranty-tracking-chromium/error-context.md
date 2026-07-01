# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\omnichannel_warranty.spec.ts >> Omnichannel Auto-Profiling & Warranty E2E Tests >> should support background auto-profiling, omnichannel matching, and warranty tracking
- Location: tests\e2e\omnichannel_warranty.spec.ts:13:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('div[role="dialog"]')
Expected substring: "Thẻ QR cá nhân thông minh"
Received string:    "KKhách Hàng Ẩn DanhKH-0988777666Tổng quanHành vi & Phân tíchĐơn hàngThanh toánSản phẩmBảo hành & CSCSKH Chính sách mua hàngÁp dụng dựa trên phân khúc đối tác hiện tại:Đổi trả 7 ngày: Đổi mới sản phẩm đối với các lỗi kỹ thuật phát sinh.Tích điểm Loyalty: Hoàn 1% giá trị hóa đơn quy đổi sang điểm thưởng.Giao hàng: Miễn phí ship cho đơn từ 200,000đ khi đặt mua online. Theo dõi bảo hành sản phẩmChưa có lịch sử mua sản phẩm bảo hành.Close"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('div[role="dialog"]')
    14 × locator resolved to <div role="dialog" tabindex="-1" id="radix-:rv:" data-state="open" aria-labelledby="radix-:r10:" aria-describedby="radix-:r11:" class="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[sta…>…</div>
       - unexpected value "KKhách Hàng Ẩn DanhKH-0988777666Tổng quanHành vi & Phân tíchĐơn hàngThanh toánSản phẩmBảo hành & CSCSKH Chính sách mua hàngÁp dụng dựa trên phân khúc đối tác hiện tại:Đổi trả 7 ngày: Đổi mới sản phẩm đối với các lỗi kỹ thuật phát sinh.Tích điểm Loyalty: Hoàn 1% giá trị hóa đơn quy đổi sang điểm thưởng.Giao hàng: Miễn phí ship cho đơn từ 200,000đ khi đặt mua online. Theo dõi bảo hành sản phẩmChưa có lịch sử mua sản phẩm bảo hành.Close"

```

```yaml
- dialog "K Khách Hàng Ẩn Danh KH-0988777666":
  - heading "K Khách Hàng Ẩn Danh KH-0988777666" [level=2]
  - tablist:
    - tab "Tổng quan":
      - img
      - text: Tổng quan
    - tab "Hành vi & Phân tích":
      - img
      - text: Hành vi & Phân tích
    - tab "Đơn hàng":
      - img
      - text: Đơn hàng
    - tab "Thanh toán":
      - img
      - text: Thanh toán
    - tab "Sản phẩm":
      - img
      - text: Sản phẩm
    - tab "Bảo hành & CS" [selected]:
      - img
      - text: Bảo hành & CS
    - tab "CSKH":
      - img
      - text: CSKH
  - tabpanel "Bảo hành & CS":
    - heading "Chính sách mua hàng" [level=3]:
      - img
      - text: Chính sách mua hàng
    - text: "Áp dụng dựa trên phân khúc đối tác hiện tại:"
    - img
    - strong: "Đổi trả 7 ngày:"
    - text: Đổi mới sản phẩm đối với các lỗi kỹ thuật phát sinh.
    - img
    - strong: "Tích điểm Loyalty:"
    - text: Hoàn 1% giá trị hóa đơn quy đổi sang điểm thưởng.
    - img
    - strong: "Giao hàng:"
    - text: Miễn phí ship cho đơn từ 200,000đ khi đặt mua online.
    - heading "Theo dõi bảo hành sản phẩm" [level=3]:
      - img
      - text: Theo dõi bảo hành sản phẩm
    - text: Chưa có lịch sử mua sản phẩm bảo hành.
  - button "Close":
    - img
    - text: Close
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
  76  |     await page.click('div[role="option"]:has-text("Khách Hàng Ẩn Danh")');
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
> 101 |     await expect(detailDialog).toContainText("Thẻ QR cá nhân thông minh");
      |                                ^ Error: expect(locator).toContainText(expected) failed
  102 |     await expect(detailDialog).toContainText("Còn hạn"); // Expiration is 12 months in the future so it must be active!
  103 | 
  104 |     // Verify buyer policies are listed
  105 |     await expect(detailDialog).toContainText("Chính sách mua hàng");
  106 |     await expect(detailDialog).toContainText("Đổi trả 7 ngày");
  107 |   });
  108 | });
  109 | 
```
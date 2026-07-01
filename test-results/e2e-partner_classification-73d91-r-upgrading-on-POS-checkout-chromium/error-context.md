# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\partner_classification.spec.ts >> Partner Classification & Promotion Segmentation E2E Tests >> should support simulated QR VIP scanning and automatic loyalty tier upgrading on POS checkout
- Location: tests\e2e\partner_classification.spec.ts:124:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('div.space-y-2 button[role="combobox"]').first()
Expected substring: "BlueSky"
Received string:    "Công ty Cổ phần Techcom0243987654 • 1200 điểm"
Timeout: 10000ms

Call log:
  - Expect "toContainText" with timeout 10000ms
  - waiting for locator('div.space-y-2 button[role="combobox"]').first()
    23 × locator resolved to <button dir="ltr" type="button" role="combobox" data-state="closed" aria-expanded="false" aria-autocomplete="none" class="flex h-10 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 bg-background">…</button>
       - unexpected value "Công ty Cổ phần Techcom0243987654 • 1200 điểm"

```

```yaml
- combobox: Công ty Cổ phần Techcom 0243987654 • 1200 điểm
```

# Test source

```ts
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
> 140 |     await expect(selectedCustomerValue).toContainText("BlueSky", { timeout: 10000 });
      |                                         ^ Error: expect(locator).toContainText(expected) failed
  141 | 
  142 |     // 2. Perform a checkout that crosses the 10,000,000đ threshold to trigger VIP auto-upgrade!
  143 |     // Add product "Thẻ QR cá nhân thông minh"
  144 |     await page.waitForSelector(".grid >> text=Thẻ QR");
  145 |     await page.click("text=Thẻ QR cá nhân thông minh");
  146 |     await page.waitForTimeout(500);
  147 | 
  148 |     // Locate the unit price input inside cart item to bypass inventory limits by setting it to 11 million
  149 |     const priceInput = page.locator('input.w-24.h-7.text-xs').first();
  150 |     await expect(priceInput).toBeVisible({ timeout: 5000 });
  151 |     await priceInput.fill("11000000");
  152 |     await page.waitForTimeout(500);
  153 | 
  154 |     // Select sales channel
  155 |     const channelSelect = page.locator('button:has-text("Chọn kênh bán hàng *")').first();
  156 |     await channelSelect.click();
  157 |     await page.click('div[role="presentation"] >> text=Cửa hàng bán lẻ');
  158 | 
  159 |     // Click "Thanh toán" button
  160 |     await page.click('button:has-text("Thanh toán (")');
  161 | 
  162 |     // Wait for the thăng hạng VIP toast & checkout success toast!
  163 |     await expect(page.locator("text=Thanh toán thành công").first()).toBeVisible({ timeout: 15000 });
  164 |     await expect(page.locator("text=Thăng hạng Thành viên VIP").first()).toBeVisible({ timeout: 15000 });
  165 | 
  166 |     // 3. Now let's navigate to Partners, search for BlueSky and check detail card
  167 |     await page.goto("/partners");
  168 |     await page.waitForSelector("text=Quản lý đối tác");
  169 | 
  170 |     // Search for BlueSky
  171 |     const searchInput = page.locator('input[placeholder="Tìm kiếm..."]');
  172 |     await searchInput.fill("BlueSky");
  173 |     await page.waitForTimeout(500);
  174 | 
  175 |     // Click "Chi tiết" button on BlueSky card
  176 |     const blueskyCard = page.locator('div.hover\\:shadow-md:has-text("BlueSky")');
  177 |     await blueskyCard.locator('button:has-text("Chi tiết")').click();
  178 | 
  179 |     // Verify glassmorphic loyalty membership card is displayed and shows "VIP Member" badge!
  180 |     const detailDialog = page.locator('div[role="dialog"]');
  181 |     await expect(detailDialog.locator('text=VIP Member')).toBeVisible({ timeout: 10000 });
  182 |   });
  183 | });
  184 | 
```
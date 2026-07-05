import { test, expect } from "@playwright/test";
import { loginLocalDemo } from "./helpers";

test.describe("Composite (Combo) Stock Deduction E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set standard desktop viewport
    await page.setViewportSize({ width: 1280, height: 960 });
    
    // Login to local demo
    await loginLocalDemo(page);
    
    // Seed composite product and child ingredients via localStorage
    await page.evaluate(() => {
      const companyId = "00000000-0000-4000-8000-000000000001";
      
      const testProducts = [
        {
          id: "p-box",
          name: "Bao bi carton",
          sku: "PRD-BOX",
          category: "Thanh pham",
          company_id: companyId,
          cost_price: 1000,
          selling_price: 5000,
          stock_quantity: 100, // Child 1 initial stock
          is_active: true,
          is_service: false,
          has_variants: false,
        },
        {
          id: "p-tape",
          name: "Bang keo dong hang",
          sku: "PRD-TAPE",
          category: "Thanh pham",
          company_id: companyId,
          cost_price: 500,
          selling_price: 2000,
          stock_quantity: 80, // Child 2 initial stock
          is_active: true,
          is_service: false,
          has_variants: false,
        },
        {
          id: "p-combo",
          name: "Combo Dong Goi",
          sku: "PRD-COMBO",
          category: "Combo & Bo san pham",
          company_id: companyId,
          cost_price: 3000,
          selling_price: 15000,
          stock_quantity: 0, // Stock is calculated dynamically
          is_active: true,
          is_service: false,
          has_variants: true, // Parent product has variants
        }
      ];
      
      const testVariants = [
        {
          id: "v-box",
          product_id: "p-box",
          sku: "PRD-BOX",
          name: "Bao bi carton",
          cost_price: 1000,
          selling_price: 5000,
          stock_quantity: 100,
          is_active: true,
        },
        {
          id: "v-tape",
          product_id: "p-tape",
          sku: "PRD-TAPE",
          name: "Bang keo dong hang",
          cost_price: 500,
          selling_price: 2000,
          stock_quantity: 80,
          is_active: true,
        },
        {
          id: "v-combo-gold",
          product_id: "p-combo",
          sku: "PRD-COMBO-GOLD",
          name: "Combo Dong Goi - Gold",
          cost_price: 3000,
          selling_price: 15000,
          stock_quantity: 0,
          is_active: true,
        }
      ];
      
      const testComponents = [
        {
          id: "comp-box",
          parent_variant_id: "v-combo-gold",
          child_variant_id: "v-box",
          quantity: 2, // 2 boxes per combo
        },
        {
          id: "comp-tape",
          parent_variant_id: "v-combo-gold",
          child_variant_id: "v-tape",
          quantity: 3, // 3 tapes per combo
        }
      ];

      localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(testProducts));
      localStorage.setItem("erp-mini-local-demo-product-variants", JSON.stringify(testVariants));
      localStorage.setItem("erp-mini-local-demo-product-variant-components", JSON.stringify(testComponents));
      // Clear existing transactions to isolate test log validations
      localStorage.setItem("erp-mini-local-demo-inventory-transactions", JSON.stringify([]));
      localStorage.setItem("erp-mini-local-demo-version", "v9"); // Ensure version matches to prevent auto-reset
    });

    // Navigate to POS to load seeded products
    await page.goto("/pos", { waitUntil: "domcontentloaded" });
  });

  test("should calculate composite stock, checkout, and deduct child ingredients inventory with correct logs", async ({ page }) => {
    test.setTimeout(90000);

    // 1. Click on "Combo Dong Goi"
    await page.waitForSelector("text=Combo Dong Goi");
    await page.click("text=Combo Dong Goi");

    // 2. Verify variant selection dialog opens and displays composite stock:
    // Min(100/2, 80/3) = Min(50, 26) = 26.
    const selectDialog = page.getByRole("dialog").filter({ hasText: "Chọn mẫu mã" }).first();
    await expect(selectDialog).toBeVisible();
    
    // Check that variant name and computed actual stock is 26
    await expect(selectDialog).toContainText("Combo Dong Goi - Gold");
    await expect(selectDialog).toContainText("Tồn khả dụng: 26");

    // Click "Chọn" to add Combo variant to cart
    await selectDialog.getByRole("button", { name: "Chọn" }).click();
    await page.waitForTimeout(500);

    // 3. Checkout combo via cash payment (Tiền mặt)
    const cashBtn = page.getByRole("button", { name: "Tiền mặt" });
    await expect(cashBtn).toBeVisible();
    await cashBtn.click();

    // Verify order completion toast
    const successToast = page.getByText("Thanh toán thành công").first();
    await expect(successToast).toBeVisible({ timeout: 15000 });

    // 4. Navigate to Inventory tab to check updated stock & transaction history logs
    await page.goto("/inventory?tab=transactions", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Verify the "Lịch sử Nhập xuất kho" tab is loaded
    await expect(page.locator("h3")).toContainText("Lịch sử Nhập xuất kho");

    // Check that child variants are decremented and logs are logged:
    // Bao bi carton quantity should be -2
    // Bang keo dong hang quantity should be -3
    const tableBody = page.locator("table tbody");
    await expect(tableBody).toContainText("Bao bi carton");
    await expect(tableBody).toContainText("-2");
    await expect(tableBody).toContainText("Tieu hao thanh phan Combo");

    await expect(tableBody).toContainText("Bang keo dong hang");
    await expect(tableBody).toContainText("-3");
  });
});

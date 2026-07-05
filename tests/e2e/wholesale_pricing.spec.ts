import { test, expect } from "@playwright/test";
import { loginLocalDemo } from "./helpers";

test.describe("Wholesale Pricing & Stacking Exclusion E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set standard desktop viewport
    await page.setViewportSize({ width: 1280, height: 960 });
    
    // Login to local demo
    await loginLocalDemo(page);
    
    // Seed test product, global wholesale settings, and wholesale prices via localStorage
    await page.evaluate(() => {
      const companyId = "00000000-0000-4000-8000-000000000001";
      
      const testProducts = [
        {
          id: "p-wholesale-test",
          name: "Sản phẩm Bán sỉ Test",
          sku: "PRD-WS-TEST",
          category: "Thanh pham",
          company_id: companyId,
          cost_price: 5000,
          selling_price: 10000,
          stock_quantity: 100,
          is_active: true,
          is_service: false,
          has_variants: false,
        }
      ];
      
      const wholesaleSettings = {
        id: "local-wholesale-settings",
        company_id: companyId,
        apply_by_order_qty_enabled: false,
        apply_by_order_qty_threshold: 10,
        apply_by_product_qty_enabled: false,
        apply_by_product_qty_threshold: 5,
        apply_by_variant_qty_enabled: true, // Trigger wholesale pricing based on variant quantity
        apply_by_order_tags_enabled: false,
        apply_by_order_tags: [],
        apply_by_customer_tags_enabled: false,
        apply_by_customer_tags: [],
        no_other_discounts: true, // Disallow stacked discounts when wholesale is applied
      };
      
      const wholesalePrices = [
        {
          id: "wp-test-1",
          product_id: "p-wholesale-test",
          variant_id: null,
          min_quantity: 5, // Threshold tier 1
          wholesale_price: 8000, // Price drops from 10k to 8k
        },
        {
          id: "wp-test-2",
          product_id: "p-wholesale-test",
          variant_id: null,
          min_quantity: 10, // Threshold tier 2
          wholesale_price: 7000, // Price drops to 7k
        }
      ];
      
      localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(testProducts));
      localStorage.setItem("erp-mini-local-demo-wholesale-settings", JSON.stringify(wholesaleSettings));
      localStorage.setItem("erp-mini-local-demo-product-wholesale-prices", JSON.stringify(wholesalePrices));
      localStorage.setItem("erp-mini-local-demo-version", "v9"); // Ensure version matches to prevent auto-reset
    });

    // Navigate to POS page to load the seeded data
    await page.goto("/pos", { waitUntil: "domcontentloaded" });
  });

  test("should apply tiered wholesale pricing as quantity exceeds thresholds", async ({ page }) => {
    test.setTimeout(90000);

    // 1. Add product to cart
    await page.waitForSelector("text=Sản phẩm Bán sỉ Test");
    await page.click("text=Sản phẩm Bán sỉ Test");

    // Wait for item to appear in cart table
    const cartRow = page.locator("table tbody tr").first();
    await expect(cartRow).toBeVisible();

    // Check initial item unit price (should be original selling_price: 10,000)
    await expect(cartRow.locator('input[type="number"]').nth(1)).toHaveValue("10000");

    // 2. Increase quantity to 5 to trigger Tier 1 wholesale price (8,000)
    const qtyInput = cartRow.locator('input[type="number"]').first();
    await qtyInput.focus();
    
    // Press ArrowUp 4 times to go from 1 to 5
    for (let i = 0; i < 4; i++) {
      await qtyInput.press("ArrowUp");
      await page.waitForTimeout(100);
    }
    
    // Wait for state update
    await page.waitForTimeout(500);

    // Verify unit price drops to 8,000 and "Giá sỉ" badge is displayed
    await expect(cartRow.locator('input[type="number"]').nth(1)).toHaveValue("8000");
    await expect(cartRow).toContainText("Giá sỉ");

    // Verify the total row reflects Tier 1 pricing: 5 * 8,000 = 40,000
    // nth(6) corresponds to the "Thành tiền" cell
    const totalRowPrice = cartRow.locator("td").nth(6);
    await expect(totalRowPrice).toContainText("40.000");

    // 3. Increase quantity to 10 to trigger Tier 2 wholesale price (7,000)
    // Press ArrowUp another 5 times
    for (let i = 0; i < 5; i++) {
      await qtyInput.press("ArrowUp");
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    // Verify unit price drops to 7,000
    await expect(cartRow.locator('input[type="number"]').nth(1)).toHaveValue("7000");

    // Verify the total row reflects Tier 2 pricing: 10 * 7,000 = 70,000
    await expect(totalRowPrice).toContainText("70.000");
  });

  test("should clear manual discounts/vouchers and show toast warning when wholesale is active", async ({ page }) => {
    test.setTimeout(90000);

    // 1. Add product to cart and set quantity to 5 to trigger wholesale pricing
    await page.waitForSelector("text=Sản phẩm Bán sỉ Test");
    await page.click("text=Sản phẩm Bán sỉ Test");

    const cartRow = page.locator("table tbody tr").first();
    await expect(cartRow).toBeVisible();

    const qtyInput = cartRow.locator('input[type="number"]').first();
    await qtyInput.focus();
    for (let i = 0; i < 4; i++) {
      await qtyInput.press("ArrowUp");
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    // Check wholesale is applied (unit price drops to 8,000)
    await expect(cartRow.locator('input[type="number"]').nth(1)).toHaveValue("8000");

    // 2. Try to apply a manual discount of 5,000
    const discountInput = page.locator("#pos-discount-input");
    await expect(discountInput).toBeVisible();
    
    await discountInput.fill("5000");
    // Press tab or enter to trigger blur/change events
    await discountInput.press("Tab");
    await page.waitForTimeout(1000);

    // 3. Verify discount input is cleared back to 0 (displays empty string in custom number input)
    await expect(discountInput).toHaveValue("");

    // 4. Verify toast notification warning is shown
    const toastTitle = page.getByText("Áp dụng giá bán sỉ").first();
    await expect(toastTitle).toBeVisible();
    
    const toastDesc = page.getByText("Đơn hàng đã được áp giá bán sỉ. Các mã giảm giá/voucher khác đã bị vô hiệu hóa.").first();
    await expect(toastDesc).toBeVisible();
  });
});

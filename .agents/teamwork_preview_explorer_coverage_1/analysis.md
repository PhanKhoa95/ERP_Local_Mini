# Coverage Gap Analysis — Milestone 1
**Date**: 2026-07-05T13:59:00+07:00
**Explorer**: Teamwork Preview Explorer

---

## 1. Executive Summary
This report presents a thorough Coverage Gap Analysis of key modules in the Pancake POS & ERP Mini application. We analyzed the following target hooks:
* `useLoyalty.ts`
* `useWholesaleSettings.ts`
* `usePlatformSync.ts`

And investigated core POS/Wholesale functionalities including:
* Composite/Combo products stock calculations.
* Ingredient stock deductions on order placement (local demo vs Supabase mode).
* Wholesale tiered pricing triggers and stacked discount/voucher exclusion logic.

We identify critical gaps in existing test suites (Vitest unit tests and Playwright E2E tests) and lay out a concrete strategy to implement robust test coverage.

---

## 2. Analysis of Target Hooks

### 2.1 `useLoyalty.ts`
* **Path**: `src/hooks/useLoyalty.ts`
* **Exposed Hooks**:
  1. `useLoyaltySettings()`: Fetches/updates point earning settings (e.g. `point_ratio_money`, `point_ratio_points`).
  2. `useReferralSettings()`: Fetches/updates referral reward settings (e.g. `referrer_reward_points`, `referee_discount_amount`).
  3. `useLoyaltyTransactions(partnerId?: string)`: Fetches transactions and provides `adjustPoints` mutation to manually add/subtract customer points.
* **Logic Branches**:
  * Local Demo Mode (`isLocalDemoAuthEnabled()`) reads from and writes to `localStorage` (keys: `erp-mini-loyalty-settings`, `erp-mini-referral-settings`, `erp-mini-loyalty-transactions`, `erp-mini-local-demo-partners`).
  * Database/Supabase Mode executes live SQL operations via the Supabase JS client.
* **Current Test Coverage**:
  * **Unit Tests**: `src/lib/__tests__/loyaltyAndReferral.test.ts` only imports and asserts against the local demo helper functions (e.g. `getLocalLoyaltySettings`, `getLocalLoyaltyTransactions`). The actual React hooks (`useLoyaltySettings`, `useReferralSettings`, `useLoyaltyTransactions`) using `@tanstack/react-query` and Supabase are **never rendered, invoked, or tested**.
  * **E2E Tests**: `tests/e2e/partner_classification.spec.ts` verifies that checkout transactions over 10M VND automatically trigger a VIP tier upgrade, but does not cover general point accumulation, redemption, or manual point adjustment flow from the partner detail dialog UI.

### 2.2 `useWholesaleSettings.ts`
* **Path**: `src/hooks/useWholesaleSettings.ts`
* **Exposed Hooks**:
  1. `useWholesaleSettings()`: Fetches/updates global wholesale rules (e.g. thresholds for order/product quantity, tags, or `no_other_discounts` override settings).
  2. `useProductWholesalePrices(productId?, variantId?)`: Fetches/updates tiered wholesale price configurations.
* **Logic Branches**:
  * Branch between Local Demo Mode (saves to `localStorage` keys: `erp-mini-local-demo-wholesale-settings`, `erp-mini-local-demo-product-wholesale-prices`) and Supabase database mode (fetching/upserting tables `wholesale_settings` and `product_wholesale_prices`).
* **Current Test Coverage**:
  * **Unit Tests**: **0%**. The hook and its queries/mutations are never tested.
  * **E2E Tests**: **0%**. The wholesale configuration UI (`WholesaleSettingsTab.tsx`) is never tested.

### 2.3 `usePlatformSync.ts`
* **Path**: `src/hooks/usePlatformSync.ts`
* **Exposed Hooks**:
  1. `usePlatformSync()`: Exposes `syncLogs` query and mutations: `syncOrders`, `getAuthUrl`, `exchangeToken`, and `refreshToken`.
* **Logic Branches**:
  * `syncLogs` query branches on `isLocalDemoAuthEnabled()`.
  * All mutations (`syncOrders`, `getAuthUrl`, `exchangeToken`, `refreshToken`) invoke the Supabase Edge Function `sync-platform-orders` directly via `supabase.functions.invoke`. There is no demo fallback for mutations.
* **Current Test Coverage**:
  * **Unit Tests**: **0%**.
  * **E2E Tests**: **0%**.

---

## 3. Investigation of POS & Wholesale Modules

### 3.1 Composite/Combo Products & Ingredient Stock Deductions
* **Stock Calculation**: 
  * Implemented in `calculateCompositeVariantStock` (`src/lib/wholesaleControl.ts` lines 32-53).
  * Stock of a composite variant is dynamically computed as: `Min(child_stock / comp_qty)` for all ingredients mapped in the BOM components. If no ingredients are defined, it defaults to the variant's own stock level.
* **Deduction and Restoration**:
  * Deductions are triggered when checkout succeeds. In `src/hooks/useOrders.ts`:
    * Local Demo: `deductLocalStock(items, orderNumber)` (lines 1025-1095) fetches `erp-mini-local-demo-product-variant-components` to check if an item's `variant_id` is a composite parent. If yes, it subtracts `qtyToSubtract = item.quantity * comp.quantity` from each child variant's stock.
    * Supabase: `deductSupabaseStock(items, orderNumber)` (lines 1171-1255) queries `product_variant_components`, updates child variant stock via `increment_variant_stock_quantity` RPC, and logs transactions.
  * Restorations occur on cancellation/return using `restoreLocalStock` or `restoreSupabaseStock` (lines 1258-1339), reversing the calculations.
* **Current Test Coverage**:
  * Unit test `src/lib/__tests__/wholesaleAndComposite.test.ts` (lines 171-283) tests composite deduction/restoration, but it does so by duplicating and running **simulated** helper functions (`simulateDeductStock`/`simulateRestoreStock`) inside the test file itself. The actual `useOrders` methods (`deductLocalStock`, `deductSupabaseStock`) are **not** invoked.
  * There is **no E2E test coverage** verifying that purchase of combo products successfully decrements ingredient stocks in the database or UI.

### 3.2 Wholesale Pricing Rules
* **Pricing Engine**:
  * Implemented in `applyWholesalePricing` (`src/lib/wholesaleControl.ts` lines 56-151).
  * Supports 5 trigger conditions:
    1. Overall order quantity (Rule 1)
    2. Multi-variant sum of same product (Rule 2)
    3. Single variant quantity (Rule 3)
    4. Order tags (Rule 4)
    5. Customer tags (Rule 5)
  * Matches the tier with the largest `min_quantity` matching the compared quantity.
* **Current Test Coverage**:
  * Unit test `src/lib/__tests__/wholesaleAndComposite.test.ts` (lines 66-169) tests `applyWholesalePricing` logic with mock data.
  * E2E test `partner_classification.spec.ts` covers the customer segment wholesale promotions (Rules/Filters), but **no E2E test** verifies tiered quantity triggers (e.g. single variant quantity thresholds) inside the POS interface.

### 3.3 Stacked Discounts / Vouchers Exclusion
* **Stacking Logic**:
  * Implemented in `src/pages/POS.tsx` (lines 686-695):
    ```typescript
    if (wholesaleSettings.no_other_discounts && hasWholesaleApplied) {
      if (discount > 0 || appliedVoucherId) {
        setDiscount(0);
        setAppliedVoucherId(null);
        toast({
          title: "Áp dụng giá bán sỉ",
          description: "Đơn hàng đã được áp giá bán sỉ. Các mã giảm giá/voucher khác đã bị vô hiệu hóa.",
        });
      }
    }
    ```
  * Vouchers are automatically calculated inside POS using `bestDiscount` only if `isManualDiscount` is false and no wholesale rules block them.
* **Current Test Coverage**:
  * Unit tests do not verify this state clearing behavior because it is tied directly to POS React state and `useEffect` triggers.
  * E2E tests check auto-apply vouchers (`promotions.spec.ts` and `category_promotions.spec.ts`) but **never verify the exclusion rules** (wholesale pricing disabling stacked vouchers/discounts).

---

## 4. Concrete Strategy to Fill Gaps

### 4.1 Vitest Unit Tests
To achieve robust unit test coverage, we should create or expand tests using `@testing-library/react` and `msw` or direct mocks:

1. **`useLoyalty.test.ts`**:
   * Test `useLoyaltySettings` hook query and `updateSettings` mutation. Mock Supabase calls to simulate both success and error conditions.
   * Test `useReferralSettings` query and mutation.
   * Test `useLoyaltyTransactions` query. Mock React Query context and verify that `adjustPoints` triggers the correct payload to Supabase or `localStorage` updating target client points.
2. **`useWholesaleSettings.test.ts`**:
   * Render hook `useWholesaleSettings` and verify fallback settings.
   * Verify that updating settings fires the correct Supabase update query.
   * Verify `useProductWholesalePrices` handles deletion of existing price configurations and insertion of new tiered prices.
3. **`usePlatformSync.test.ts`**:
   * Mock `supabase.functions.invoke` using `vi.spyOn`.
   * Assert `syncOrders` correctly calls the Edge function with `action: "sync_orders"`, `channel_id`, and parameters.
   * Test success toast callback triggers cache invalidations for `"orders"`, `"sync_logs"`, and `"sales_channels"`.
   * Test error boundary toast display.
4. **`useOrders` Stock Deduction Unit Tests**:
   * Rather than simulating logic in test helpers, mock `localStorage` and call the actual hooks or module methods (e.g. `deductLocalStock`) to verify integration.

### 4.2 Playwright E2E Tests
Write two new E2E test files or expand existing ones:

1. **`tests/e2e/wholesale_pricing.spec.ts`**:
   * **Test Case 1 (Tiered Pricing)**: Add 5 items of "Thẻ QR cá nhân thông minh" variant to POS cart. Confirm that price drops to wholesale price tier.
   * **Test Case 2 (Stacked Discount Exclusion)**: Set global wholesale settings `no_other_discounts = true` in `/settings`. Go to POS, add items to trigger wholesale price, attempt to enter manual discount or apply coupon. Verify that POS displays the toast, clears the coupon/discount, and total only reflects the wholesale tier prices.
2. **`tests/e2e/composite_stock.spec.ts`**:
   * Navigate to POS, select a known composite/combo variant. Check the "Tồn kho" badge matches expected BOM child inventory.
   * Checkout the combo.
   * Navigate to the Inventory logs page (`/inventory`), check the transaction list, verify there is an `"out"` transaction with note `"Tieu hao thanh phan Combo..."` for the child variants, and their stock counts have decremented by the correct BOM multiplier.

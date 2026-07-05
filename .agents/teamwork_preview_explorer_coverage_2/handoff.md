# Handoff Report — Coverage Gap Analysis (Milestone 1)

## 1. Observation
* **Loyalty Settings & Transactions Hook**:
  * Located hook file `src/hooks/useLoyalty.ts` containing `useLoyaltySettings`, `useReferralSettings`, and `useLoyaltyTransactions`.
  * Unit test file `src/lib/__tests__/loyaltyAndReferral.test.ts` imports and tests only local helpers:
    ```typescript
    import { 
      getLocalLoyaltySettings, 
      getLocalReferralSettings, 
      getLocalLoyaltyTransactions 
    } from "@/hooks/useLoyalty";
    ```
    The main React hooks (`useLoyaltySettings`, etc.) are not imported or tested here.
* **Wholesale Settings Hook**:
  * Located hook file `src/hooks/useWholesaleSettings.ts` containing `useWholesaleSettings` and `useProductWholesalePrices`.
  * Unit test file `src/lib/__tests__/wholesaleAndComposite.test.ts` tests only static helper functions `calculateCompositeVariantStock` and `applyWholesalePricing`:
    ```typescript
    import { calculateCompositeVariantStock, applyWholesalePricing } from "../wholesaleControl";
    ```
    The hooks themselves are not tested.
* **Platform Sync Hook**:
  * Located hook file `src/hooks/usePlatformSync.ts` containing mutations (`syncOrders`, `getAuthUrl`, `exchangeToken`, `refreshToken`) invoking Supabase edge functions via:
    ```typescript
    const { data, error } = await supabase.functions.invoke("sync-platform-orders", { ... });
    ```
  * No unit or integration test files exist under `src/hooks/__tests__` or `src/lib/__tests__` containing the word `PlatformSync` or `platform`.
* **Combo / Component Stock Deductions Inconsistency**:
  * Checked stock calculations in `src/pages/POS.tsx` lines 714-716:
    ```typescript
    const availableStock = variant 
      ? calculateCompositeVariantStock(variant, allComponents, allVariants)
      : product.stock_quantity || 0;
    ```
  * Checked stock deduction in Supabase mode inside `src/hooks/useOrders.ts` line 1184-1186:
    ```typescript
    if (components && components.length > 0) {
      for (const comp of components) {
        const qtyToDeduct = (item.quantity || 1) * Number(comp.quantity);
    ```
  * Checked Local Demo mode order inventory event bus listener in `src/lib/erpEventBus.ts` lines 207-227:
    ```typescript
    for (const item of orderItems) {
      if (!item.product_id) continue;
      try {
        const bomItems = getLocalProductBom(item.product_id);
        if (bomItems && bomItems.length > 0) {
          ...
        } else {
          createLocalInventoryTransaction({
            product_id: item.product_id,
            transaction_type: "out",
            quantity: item.quantity || 1,
            notes: `Trừ tồn kho - Đơn hàng ${orderNumber}`,
          });
        }
      ...
    ```
    This completely bypasses checking variants or `product_variant_components` local store.
* **Wholesale stacked discounts / voucher locking**:
  * Observed voucher suppression logic in `src/pages/POS.tsx` lines 686-694:
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
* **Testing Command Execution**:
  Ran unit tests via command `powershell -ExecutionPolicy Bypass -Command "npm run test"`, returning:
  `Test Files  50 passed (50)` and `Tests  353 passed (353)`.

---

## 2. Logic Chain
1. **Existing Unit Test Gaps**:
   * *Observation*: Tests in `src/lib/__tests__/` only verify static helper routines (`getLocalLoyaltySettings`, `applyWholesalePricing`).
   * *Inference*: The actual React Query hooks (`useLoyaltySettings`, `useWholesaleSettings`) containing caching and Supabase integration logic are completely untested.
2. **Platform Sync Gaps**:
   * *Observation*: `usePlatformSync.ts` uses `supabase.functions.invoke` directly without checks for `isLocalDemoAuthEnabled()`.
   * *Inference*: Since there are zero tests written for this hook, its behavior in local demo mode will always fail when invoking edge functions (as no mock endpoints exist).
3. **Local Demo Combo Deduction Bug**:
   * *Observation*: Dynamic combo stocks are calculated in the UI using components via `calculateCompositeVariantStock`.
   * *Observation*: `erpEventBus.ts` handles `ORDER_CREATED` stock deduction in local demo mode. It only looks up product BOMs (`getLocalProductBom`) and falls back to simple product-level stock deduction.
   * *Observation*: The helper `deductLocalStock(items, orderNumber)` in `useOrders.ts` which handles variants/components is declared but never called.
   * *Inference*: Orders checked out in Local Demo mode will NOT decrement constituent child variant stocks of combo products, causing stock divergence.

---

## 3. Caveats
* The team did not test real network requests to Supabase Edge functions, as the environment is constrained to offline CODE_ONLY network mode.
* The analysis assumes that Playwright E2E tests are meant to run in Local Demo mode, which aligns with the usage of the `loginLocalDemo` helper.

---

## 4. Conclusion
* Existing unit and integration tests successfully pass, but coverage is strictly limited to utility calculations.
* There is a major coverage gap for the three custom React-Query hooks and the Platform Sync module.
* There is a functional bug in Local Demo mode regarding combo product stock deduction.
* Stacked voucher locking logic is tightly coupled in `POS.tsx` and requires a specific Playwright E2E test to prevent future regression.

---

## 5. Verification Method
To independently verify the test suite execution and configurations:
1. Run Vitest unit tests:
   ```powershell
   powershell -ExecutionPolicy Bypass -Command "npm run test"
   ```
2. Verify existing Playwright E2E specs:
   ```powershell
   powershell -ExecutionPolicy Bypass -Command "npx playwright test"
   ```
3. Inspect `e:\ERP_Local_Mini\.agents\teamwork_preview_explorer_coverage_2\analysis.md` for the detailed analysis.

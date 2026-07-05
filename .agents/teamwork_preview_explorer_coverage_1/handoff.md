# Handoff Report — Coverage Gap Analysis

## 1. Observation
We observed the following exact paths and lines in the codebase:
* **useLoyalty hook**: Located at `src/hooks/useLoyalty.ts` (312 lines). The file contains `useLoyaltySettings()` (line 87), `useReferralSettings()` (line 154), and `useLoyaltyTransactions()` (line 220).
* **useWholesaleSettings hook**: Located at `src/hooks/useWholesaleSettings.ts` (220 lines). It contains `useWholesaleSettings()` (line 50) and `useProductWholesalePrices()` (line 124).
* **usePlatformSync hook**: Located at `src/hooks/usePlatformSync.ts` (105 lines). It contains `usePlatformSync()` (line 7), which invokes Supabase Edge function `sync-platform-orders` via `supabase.functions.invoke`.
* **Loyalty unit tests**: `src/lib/__tests__/loyaltyAndReferral.test.ts` only references the local helpers:
  ```typescript
  import { 
    getLocalLoyaltySettings, 
    getLocalReferralSettings, 
    getLocalLoyaltyTransactions 
  } from "@/hooks/useLoyalty";
  ```
  The React hooks themselves are not tested.
* **Wholesale unit tests**: `src/lib/__tests__/wholesaleAndComposite.test.ts` defines simulated handlers inside the test file:
  ```typescript
  const simulateDeductStock = (orderItems: any[]) => { ... }
  ```
  Rather than calling `deductLocalStock` or `deductSupabaseStock` from the hooks module.
* **POS page auto-discount exclusion**: In `src/pages/POS.tsx` lines 686-695:
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
* **Existing Playwright E2E tests**: In `tests/e2e/`, the spec files include `promotions.spec.ts`, `category_promotions.spec.ts`, `core_erp_flows.spec.ts`, and `partner_classification.spec.ts`. There are no dedicated spec files for tiered quantity pricing triggers, composite variant inventory checks, or wholesale stacking exclusion in the POS checkout flow.

## 2. Logic Chain
1. The hooks `useWholesaleSettings` and `usePlatformSync` are not imported or referenced in any files under `src/hooks/__tests__` or `src/lib/__tests__` (as confirmed by grep search). Therefore, their unit test coverage is 0%.
2. The hook `useLoyalty` has helpers tested in `loyaltyAndReferral.test.ts`, but the hook queries and mutations (`useLoyaltySettings`, `useReferralSettings`, `useLoyaltyTransactions`) are not rendered or tested. Therefore, their unit test coverage is 0%.
3. In `wholesaleAndComposite.test.ts`, the combo stock deduction test uses local duplicate simulators (`simulateDeductStock`/`simulateRestoreStock`) instead of executing `deductLocalStock` or `deductSupabaseStock` inside the codebase. Thus, the actual codebase implementations of stock deduction/restoration have no unit test coverage.
4. E2E tests under `tests/e2e` cover simple cash checkout, auto-vouchers, and VIP classification upgrades, but omit:
   - Dynamic tiered pricing updates in POS cart when quantity threshold is crossed.
   - Deduction/increment verification of the physical BOM components in the Inventory/Log page after POS checkouts.
   - Exclusion logic where wholesale pricing disables manual discounts and auto-applied vouchers.
5. Therefore, a comprehensive strategy is required to fill these unit and E2E coverage gaps.

## 3. Caveats
* The Edge functions (e.g. `sync-platform-orders` invoked by `usePlatformSync.ts`) are external Supabase endpoints. In code-only mock environments, they must be stubbed or simulated (e.g., using `vi.spyOn` or MSW) because we cannot perform real platform synchronization callback flows without active APIs.
* Tests are designed around the `isLocalDemoAuthEnabled()` configuration. We assume the local demo auth is the main path for client E2E tests in Playwright.

## 4. Conclusion
We conclude that there are substantial testing gaps:
1. Three core hooks (`useLoyalty`, `useWholesaleSettings`, `usePlatformSync`) have 0% React Query hook unit test coverage.
2. The core inventory deduction module is tested using mock code rather than actual source code hooks.
3. Key E2E rules (tiered pricing thresholds, BOM ingredient deduction validation, and wholesale stacked discounts exclusion) are missing from Playwright coverage.

Actionable suggestions are detailed in `analysis.md` to guide the implementation agent.

## 5. Verification Method
* Inspect the analysis report at: `e:\ERP_Local_Mini\.agents\teamwork_preview_explorer_coverage_1\analysis.md`
* Run current Vitest tests to ensure all existing tests pass:
  ```bash
  npx vitest run
  ```
* Run existing Playwright E2E tests:
  ```bash
  npx playwright test
  ```

# Handoff Report — Coverage Gap Analysis (Milestone 1)

This report details the findings, logic, and proposed verification methods for the Pancake POS & ERP Mini Coverage Gap Analysis.

---

## 1. Observation

During our investigation of the Pancake POS and Wholesale modules, we observed the following:

1.  **Untested Hooks**:
    *   `src/hooks/useLoyalty.ts` has no corresponding `useLoyalty.test.ts` in `src/hooks/__tests__/`.
    *   `src/hooks/useWholesaleSettings.ts` has no corresponding `useWholesaleSettings.test.ts` in `src/hooks/__tests__/`.
    *   `src/hooks/usePlatformSync.ts` has no corresponding `usePlatformSync.test.ts` in `src/hooks/__tests__/`.

2.  **Duplicate Test Implementations**:
    *   In `src/lib/__tests__/wholesaleAndComposite.test.ts` (lines 190–256), the test verifies inventory deduction by duplicating the logic:
        ```typescript
        const simulateDeductStock = (orderItems: any[]) => { ... };
        const simulateRestoreStock = (orderItems: any[]) => { ... };
        ```
        Instead of calling the hook implementation (`deductLocalStock` / `restoreLocalStock` from `src/hooks/useOrders.ts`), the unit tests run assertions against these local mock replicas.
    *   In `src/hooks/__tests__/useOrderLogic.test.ts` (lines 9–39), a similar duplication is present for `calculateInventoryChange` and `calculateBomBackflush`.

3.  **Circular State dependency / Render Loop Bug**:
    *   In `src/pages/POS.tsx` (lines 686–693):
        ```typescript
        if (wholesaleSettings.no_other_discounts && hasWholesaleApplied) {
          if (discount > 0 || appliedVoucherId) {
            setDiscount(0);
            setAppliedVoucherId(null);
            ...
          }
        }
        ```
    *   In `src/pages/POS.tsx` (lines 874–951), an auto-apply voucher `useEffect` runs when `subtotal, cart, vouchers, ...` changes and updates the discount/voucher selection:
        ```typescript
        setDiscount(bestDiscount);
        setAppliedPromoName(bestPromoName);
        setAppliedVoucherId(bestPromoId);
        ```
    *   There is no condition in the auto-apply voucher hook checking `hasWholesaleApplied` or `wholesaleSettings.no_other_discounts`, creating an infinite render loop when wholesale pricing applies and an auto-apply voucher is active.

---

## 2. Logic Chain

1.  **Observation 1** indicates that three critical hooks (`useLoyalty`, `useWholesaleSettings`, `usePlatformSync`) manage essential business logic (points/referrals, price tiers, edge function token refresh). Because there are no tests at the hook level, code changes in these hooks could silently break the CRM, POS, or sales integrations without triggering test failures.
2.  **Observation 2** highlights that current unit tests for stock deduction and BOM backflushing do not actually execute the functions in `useOrders.ts` (`deductLocalStock` / `deductSupabaseStock` / `restoreLocalStock`). Therefore, any bugs inside these functions (e.g. failing to deduct child variant stock in Supabase RPC calls) will go undetected by the test suite.
3.  **Observation 3** points to a direct architectural conflict in `POS.tsx` where the wholesale application effect clears discounts/vouchers, while the voucher application effect immediately recalculates and sets them. This will lead to an infinite rendering loop in production.
4.  Consequently, we conclude that unit test files must be created for the three target hooks, stock deduction unit tests must be refactored to test the actual implementations, and E2E tests must be introduced to verify the stacked discounts constraints and prevent render loop regressions.

---

## 3. Caveats

*   **Network limitations**: Since the execution is isolated in `CODE_ONLY` mode, we could not hit the real Supabase Edge Functions or external platform auth endpoints (Shopee/Lazada) during our exploration.
*   **Database state**: Tests are assumed to use mock queries/mutations for Supabase calls rather than running against live databases, as schema mutations and RPC triggers (such as `increment_variant_stock_quantity`) are managed inside the Supabase server.

---

## 4. Conclusion

The testing coverage has significant gaps:
1.  **Hook-level coverage**: 0% for `useLoyalty.ts`, `useWholesaleSettings.ts`, and `usePlatformSync.ts`.
2.  **Integration logic validation**: Stock deduction tests are isolated from the actual `useOrders.ts` module, leaving the real codebase untested.
3.  **Conflict & loop vulnerabilities**: No unit or E2E tests check for state-fighting between wholesale constraints and auto-apply vouchers.

We must introduce Vitest unit tests for the three hooks and create Playwright E2E tests for combo products stock deduction and wholesale stacked discounts/vouchers behavior.

---

## 5. Verification Method

To verify these observations:
1.  Run the unit test suite:
    ```bash
    cmd /c npx vitest run
    ```
    Confirm that 353 tests pass, but note the lack of hook files or direct calls to `useOrders` stock deduction logic.
2.  Inspect files:
    *   Check `src/pages/POS.tsx` lines 686-696 and 874-951 to see the two competing `useEffect` hooks.
    *   Check `src/lib/__tests__/wholesaleAndComposite.test.ts` lines 190–256 to confirm the presence of duplicate stock simulation helpers.

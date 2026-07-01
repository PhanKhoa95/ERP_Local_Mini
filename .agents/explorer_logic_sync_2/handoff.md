# Handoff Report: Logic Resolution & Data Sync Investigation

## 1. Observation
*   **Order Payment Status**: Checked `src/hooks/usePaymentTransactions.ts` line 381-393, which updates the `paid_amount` on `orders` but completely skips updating the `payment_status` in Supabase mode. Also checked lines 354-357, where only `"paid"` is evaluated if `paid_amount >= total` without handling `"partially_paid"` or resetting to `"unpaid"`.
*   **Unmatched Casso Transactions**: Examined `src/components/finance/CassoReconciliation.tsx` line 14-45 (mock transactions with `"unmatched"` status) and lines 152-157. There are no UI controls to match unmatched items or call a manual match mutation.
*   **Selling Below Cost**: Reviewed `src/components/products/ProductDialog.tsx` line 16-28 (Zod validation schemas) and `CreateOrderDialog.tsx`. No validations compare product `selling_price` with `cost_price`.
*   **Deleting Products in BOM**: Inspected `src/hooks/useProducts.ts` line 173-200 and `src/lib/localInventoryStore.ts` line 643-655. Deleting a product silently filters out BOM entries or runs Supabase cascades without checks, risking recipe corruption.
*   **Service Product Quantities**: Inspected `src/lib/localInventoryStore.ts` line 784, which states `if (product.is_service) throw new Error("San pham dich vu khong quan ly ton kho.");` and forces quantities to `0` without any limited-quantity service capability.
*   **Sales Channel Quota**: Checked `src/components/settings/SubscriptionsTab.tsx` line 156: `current: channels.length`, which includes disabled/inactive channels in the quota validation.
*   **Project Budgets & Expenses**: Inspected `src/hooks/useCashVouchers.ts` lines 98-142 (`createVoucher`) and 145-265 (`confirmVoucher`). No validations exist to verify if voucher amounts exceed project budgets.
*   **BOM Circular Reference**: In `src/hooks/useProductBom.ts` lines 90-122, adding BOM items only checks if `product_id === material_id` (self-reference) but permits cyclic references (A -> B -> A).
*   **Data Integrity Check Engine**: Reviewed `src/lib/systemDataAudit.ts` lines 320-335 (detecting product stock vs sum of warehouse stock mismatches), lines 523-543 (detecting unbalanced journal entries), and lines 595-612 (detecting finished product cost drift from BOM totals).

## 2. Logic Chain
1. *Observation 1* shows that payment transactions update `paid_amount` but do not synchronize `payment_status`, leading to status drift where an order is paid but remains tagged as unpaid.
2. *Observation 2* shows Casso reconciliation is mock-only and offers no interface or API flow to resolve unmatched transactions manually.
3. *Observation 3* highlights the lack of cost price comparison, which allows users to sell products below cost and incur unnotified financial losses.
4. *Observation 4* shows that products can be deleted even if they are raw material inputs in other BOMs, leaving finished goods with corrupted recipes.
5. *Observation 5* indicates that services are forced to have `0` stock, blocking limited-quantity package tracking.
6. *Observation 6* reveals that inactive channels count against subscription limits, preventing users from adding new channels unless they delete old ones.
7. *Observation 7* shows budget limits are completely bypassed during expense voucher creation.
8. *Observation 8* shows that circular dependencies are not checked in BOMs, which can cause stack overflows during backflushing.
9. *Observation 9* exposes that several data points, such as warehouse stocks, ledger entries, and timezone offsets, drift due to missing mutation-level recalculations.
10. Therefore, these 10 logic and 10 sync limitations exist and require code refactoring as described in `analysis.md`.

## 3. Caveats
*   Investigation is strictly read-only; no code modifications were applied.
*   Assumes local storage demo mode behavior should match Supabase mode validation patterns.

## 4. Conclusion
The `ERP_Local_Mini` codebase has 10 business logic limitations and 10 data sync inconsistencies that cause financial warnings, data drifts, and potential application crashes. Implementing the recommendations outlined in `analysis.md` will resolve these issues.

## 5. Verification Method
Verify by inspecting:
*   `y:\ERP_Local_Mini\.agents\explorer_logic_sync_2\analysis.md` for specific file ranges and code modifications.
*   Ensure that typechecking is clean by running `npm run typecheck` and testing works by running `npm run test` or `npx vitest`.

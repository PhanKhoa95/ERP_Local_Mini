# Handoff Report - Logic Resolution & Data Sync Investigation

## 1. Observation
The following file structures and logic paths were directly observed:
*   `src/lib/systemDataAudit.ts`:
    *   Lines 320-335: Checks `products.stock_quantity` vs `sum(warehouse_stock.quantity)`.
    *   Lines 353-383: Checks negative prices and `cost_price > selling_price`.
    *   Lines 504-521: Checks `order.payment_status === "paid"` when `paid_amount < total`.
    *   Lines 595-612: Checks product BOM cost vs `products.cost_price`.
*   `src/hooks/usePaymentTransactions.ts`:
    *   Lines 354-357: Local updates setting status `"paid"` when fully paid:
        ```typescript
        if (orders[orderIdx].paid_amount >= (orders[orderIdx].total || 0)) {
          orders[orderIdx].payment_status = "paid";
        }
        ```
    *   Lines 381-393: Supabase update logic lacks `payment_status` recalculation.
*   `src/components/finance/CassoReconciliation.tsx`:
    *   Lines 14-45: Uses a hardcoded `transactions` array, containing an unmatched record with status `"unmatched"`.
    *   Lines 152-157: Shows the unmatched badge: `"Chờ đối soát thủ công"`, but lacks matching triggers.
*   `src/hooks/useProducts.ts`:
    *   Lines 173-188: Deletion mutation only handles Postgres constraints and lacks BOM relationship checking in local storage mode.
*   `src/lib/localInventoryStore.ts`:
    *   Line 784: Blocks service inventory adjustments: `if (product.is_service) throw new Error("San pham dich vu khong quan ly ton kho.");`.
    *   Line 874: BOM self-referencing check: `if (input.product_id === input.material_id) throw new Error("Khong the them san pham lam NVL cua chinh no.");`.
*   `src/hooks/useDashboardStats.ts`:
    *   Lines 96-105: Channel processing maps over all channels (`channels.map(...)`) without checking the `is_active` flag.
*   `src/hooks/useCashVouchers.ts`:
    *   Lines 110-136: Voucher creation logic inserts draft records without validating project budget availability.
*   `src/pages/Reports.tsx`:
    *   Lines 216-232: Saves project health configuration directly to `shop_settings` using `updateSetting.mutate` without logging changes.
*   `src/lib/erpEventBus.ts`:
    *   Subscribes to `"ORDER_CREATED"` (lines 194, 262, 552), `"PAYMENT_RECORDED"` (lines 395, 567), and `"CONTRACT_SIGNED"` (line 589), but does not listen to manual warehouse adjustments or publish manual stock transaction events.

The test suite command `pnpm vitest run src/lib/__tests__/systemDataAudit.test.ts` completed successfully:
```text
✓ src/lib/__tests__/systemDataAudit.test.ts (2 tests) 5ms
Test Files  1 passed (1)
Tests       2 passed (2)
```

## 2. Logic Chain
1. **R1.1 Payment Status**: Since `usePaymentTransactions.ts` does not update `payment_status` in Supabase mode and ignores `"partial"` and `"unpaid"` states, these statuses will remain out of sync, triggering the audit alert on line 506 of `systemDataAudit.ts`.
2. **R1.2 Casso Reconcile**: Since `CassoReconciliation.tsx` relies on hardcoded state and lacks order selection modals or backend-matching endpoints, unmatched bank transactions cannot be reconciled manually.
3. **R1.3 Selling Price Warn**: Because Zod validates cost and selling prices separately without checking the relation, users can save products with `selling_price < cost_price` without alerts until a system audit is run.
4. **R1.4 Block Material Delete**: Because `deleteLocalProduct` in `localInventoryStore.ts` deletes products and silently filters out BOM linkages, component products can be deleted, corrupting the BOM recipes of parent items.
5. **R1.5 Limited Services**: Because `is_service` toggle blocks stock management entirely, services with limited seats or capacity cannot track remaining counts or prevent overselling.
6. **R1.6 Active Channels Quota**: Because `useDashboardStats.ts` and `ChannelPieChart.tsx` iterate over the full channels list, inactive sales channels skew target and percentage calculations.
7. **R1.7 Voucher Budget Check**: Because `useCashVouchers.ts` inserts payment vouchers without querying project targets, expense vouchers can exceed project budgets.
8. **R1.8 BOM Circular Block**: Because `addLocalBomItem` only checks direct self-reference, multi-level circular graphs (e.g. A -> B -> C -> A) can be saved, causing stack overflows during COGS calculations.
9. **R2.1 BOM Cost Sync**: Because `updateProduct` and `addBomItem` mutations do not recalculate parent costs, parent finished product cost prices must be manually synced, causing discrepancies in audits.
10. **R2.2 Product/Warehouse Stock Sync**: Because order deductions in `useOrders.ts` run RPC calls that bypass `warehouse_stock` entirely, and warehouse mutations in `useWarehouseStock.ts` do not update the product table, the two representations will drift apart.
11. **R2.3 Stock Ledger Sync**: Since `StockTransactionDialog.tsx` processes transactions directly without publishing events or updating ledger lines, manual inventory updates do not reflect in the accounting ledger.
12. **R2.4 Casso Timezone Sync**: Because Casso sends raw local GMT+7 strings, inserting them directly into Supabase treats them as UTC unless the `+07:00` offset is appended.
13. **R2.5 Project Health Audit Logging**: Because `handleSaveProjectHealth` in `Reports.tsx` triggers `updateSetting` directly without calling `logAction`, configuration changes escape history tracking.

## 3. Caveats
*   The actual database webhook parser for incoming Casso API payloads is not located in the frontend repository, meaning the timezone parsing change needs to be integrated into the respective API server or webhook ingest handler.
*   Assumed that all cash payment vouchers for projects represent expenses against the project's budget.

## 4. Conclusion
The codebase contains the necessary hooks and components to satisfy the milestone, but requires specific validations, event triggers, recursive price update utilities, and a DFS cycle checker to be implemented. These modifications are fully outlined in `analysis.md`.

## 5. Verification Method
1. Run the existing test suite to ensure the baseline remains healthy:
   `pnpm vitest run src/lib/__tests__/systemDataAudit.test.ts`
2. Create new unit tests in:
   *   `src/lib/__tests__/systemDataAudit.test.ts` to test price discrepancies and order status matching.
   *   `src/hooks/__tests__/useOrderLogic.test.ts` to verify limited services capacity.
   *   `src/lib/__tests__/productionBom.test.ts` to test BOM circular dependency checks.

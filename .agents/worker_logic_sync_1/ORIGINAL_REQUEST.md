## 2026-07-01T15:03:08Z
You are the teamwork_preview_worker subagent. Your working directory is `y:\ERP_Local_Mini\.agents\worker_logic_sync_1`.
Your objective is to implement the fixes for the 10 business logic limitations and 10 data synchronization inconsistencies.

Please refer to the following files for the exact requirements and locations:
- Analysis Report: `y:\ERP_Local_Mini\.agents\explorer_logic_sync_2\analysis.md`
- plan.md: `y:\ERP_Local_Mini\.agents\sub_orch_logic_sync\plan.md`

### MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

### Summary of Tasks to Implement:

1. **R1.1 & R1.2 (Payment Status & Partially Paid)**:
   - Update order status transitions on payments (in `usePaymentTransactions.ts` createTransaction for both Supabase and local demo mode) to dynamically set order payment status: `"paid"` (if paid >= total), `"partially_paid"` (if 0 < paid < total), else `"unpaid"`.
   - Update Zod schemas/types if necessary and update the UI dialogs/badges (`OrderDetailDialog.tsx`, `PartnerDetailDialog.tsx`) to render `"partially_paid"` state.

2. **R1.3 (Casso Manual Match)**:
   - Add a manual matching UI action in `CassoReconciliation.tsx` for unmatched transactions. Add a simple dialog to select an order, call a mutation/method to match it, update transaction status/orderCode, add payment transaction, and update order payment_status & paid_amount.

3. **R1.4 (Selling Price below Cost Price warning)**:
   - Add a warning alert/label under the selling price field in `ProductDialog.tsx` if selling_price < cost_price. Also warning in POS/Order forms.

4. **R1.5 (BOM Delete Block)**:
   - In `deleteLocalProduct` (`localInventoryStore.ts`) and product deletion hooks/methods (`useProducts.ts`), query `product_bom` for active material usage. Block deletion (throw custom error) if the product is used in another product's BOM.

5. **R1.6 (Limited Service Capacity)**:
   - Allow service items (`is_service: true`) to have stock/quantities managed if capacity limit is set (e.g. `stock_quantity > 0` or `min_stock > 0`). Update `createLocalProduct`, `updateLocalProduct`, and stock check in `POS.tsx` and `useOrders.ts` to respect limited service stock.

6. **R1.7 (Active Sales Channels Quota)**:
   - Update channels length calculation in `SubscriptionsTab.tsx` to count only active channels: `channels.filter(c => c.is_active !== false).length`.

7. **R1.8 (Project Budget Validation)**:
   - In `confirmVoucher` (`useCashVouchers.ts`), validate that confirming the voucher does not push the total confirmed expenses for the project beyond its budget. Block confirmation and throw error if exceeded.

8. **R1.9 (BOM Circular Dependency Check)**:
   - Add depth-first search (DFS) recursion check in BOM item addition/updating (`addLocalBomItem` in `localInventoryStore.ts` and `useProductBom.ts` mutation). Block it and throw custom error if it introduces a circular dependency (e.g. A -> B -> A).

9. **R1.10 (Local Demo Booking)**:
   - Implement local storage fallback wrappers (`getLocalBookings`, `saveLocalBookings`) inside `useBookings.ts` when local demo mode is active.

10. **R2.1 (FG Cost Price Propagation)**:
    - Recalculate finished goods cost price when raw material costs update or BOM list changes. Call `syncBomCostToProducts` automatically inside product and BOM mutations/methods.

11. **R2.2 (Stock Location Sync)**:
    - Align location stock `warehouse_stock` and product overall stock: stock deductions should deduct target warehouse location first, and general product stock should equal sum of its warehouse locations.

12. **R2.3 (Manual Stock Adjustment Ledger Sync)**:
    - Synchronize physical manual stock movements with journal entries. When a manual transaction is recorded, publish/create debit/credit entries (Debit 156 / Credit 4111/642 for Stock In, Debit 632 / Credit 156 for Stock Out).

13. **R2.4 (Casso Timezone Alignment)**:
    - Align casso webhook and simulator timestamps (ensure +07:00 offset is appended to Vietnam local date strings before DB write/UTC conversion).

14. **R2.5 (Project Health Logs)**:
    - Call `logAction`/`logLocalAction` when project health settings are modified.

15. **R2.6 (Double-entry Balance Check)**:
    - Enforce Debits === Credits (+/- 1 VNĐ tolerance) on manual journal entry submissions.

16. **R2.7, R2.8, R2.9, R2.10 (Order Calculation & Payment Alignments)**:
    - R2.7: Ensure item line total equals `quantity * unit_price`.
    - R2.8: Force order subtotal to equal `sum(order_items.total)`.
    - R2.9: Force order total to equal `subtotal - discount + shipping_fee`.
    - R2.10: Recalculate order's `paid_amount` when payment transactions are voided, deleted, or updated.

When finished, run TypeScript check (`npm run typecheck`), build (`npm run build`), and run all tests (`npm run test` or `npx vitest`) to verify your implementations. Write a detailed handoff report when complete.

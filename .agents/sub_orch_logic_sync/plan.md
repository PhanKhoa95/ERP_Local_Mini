# plan.md — Logic Resolution & Data Sync Execution Plan

This document outlines the detailed roadmap for addressing the 10 business logic limitations and 10 data synchronization inconsistencies identified in the ERP_Local_Mini codebase.

## Architecture & Code Layout
- **Shared Validation**: `src/lib/validation.ts`
- **Store & Core Logic**: `src/lib/localInventoryStore.ts`, `src/lib/productionBom.ts`, `src/lib/systemDataAudit.ts`
- **React Hooks**: `src/hooks/useOrders.ts`, `src/hooks/usePaymentTransactions.ts`, `src/hooks/useProductBom.ts`, `src/hooks/useCashVouchers.ts`, `src/hooks/useBookings.ts`
- **Components**: `src/components/finance/CassoReconciliation.tsx`, `src/components/products/ProductDialog.tsx`

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Logic Resolution (R1) | Resolve all 10 business logic limitations including payment status transitions, Casso manual match, cost warnings, BOM delete protection, service stock, active channels quota, budget checks, and BOM circular checks. | None | PLANNED |
| 2 | Data Synchronization (R2) | Resolve all 10 sync inconsistencies including cost propagation, warehouse stock sync, stock ledger hạch toán, timezone alignment, project health logs, journal double-entry checks, and order calculations. | M1 | PLANNED |
| 3 | Verification Pipeline | Run TypeScript typecheck, unit/integration tests (`npm run test`), E2E tests (`npx playwright test`), and production build. | M2 | PLANNED |

---

## Detailed Implementation Steps

### Milestone 1: Logic Resolution (R1)
1. **R1.1 & R1.2 (Payment Status & Partially Paid)**:
   - Update `usePaymentTransactions.ts` createTransaction mutation (both local demo and Supabase branches) to query order total, calculate new payment status (`"paid"` if paid >= total, `"partially_paid"` if paid > 0, else `"unpaid"`), and update the order payment status.
   - Update `OrderDetailDialog.tsx` and `PartnerDetailDialog.tsx` to handle `"partially_paid"` badge and labels.
2. **R1.3 (Casso Manual Match)**:
   - Add a "Khớp thủ công" (Manual Match) button in the `CassoReconciliation.tsx` transactions table for unmatched items.
   - Implement a dialog to select a pending/unpaid order.
   - Create a local/Supabase mutation `matchBankTransaction` to match the transaction with the selected order, record a payment transaction, and update the order's paid amount and payment status.
3. **R1.4 (Selling Below Cost Warning)**:
   - Display a warning in `ProductDialog.tsx` if selling price is set below cost price.
   - Display a warning in POS and Order Creation forms when adding an item whose selling price is lower than its cost.
4. **R1.5 (BOM Delete Block)**:
   - Update `deleteLocalProduct` in `localInventoryStore.ts` and products deletion hooks in `useProducts.ts` to check if a product is active in any `product_bom` item as a material. If so, throw an error to block deletion.
5. **R1.6 (Limited Service Capacities)**:
   - Update Zod schemas in `ProductDialog.tsx` and creation/update logic in `localInventoryStore.ts`/hooks to support limited capacity service products (allow stock management when `is_service === true` and `stock_quantity > 0` or `min_stock > 0`).
   - Refactor POS stock checks to verify stock availability for limited services.
6. **R1.7 (Active Sales Channels Quota)**:
   - Refactor quota check in `SubscriptionsTab.tsx` to count only active channels: `channels.filter(c => c.is_active !== false).length`.
7. **R1.8 (Project Budget Validation)**:
   - Update `confirmVoucher` in `useCashVouchers.ts` to fetch project budget and total confirmed expenses. If current voucher pushes project expenses beyond its budget, throw an validation error.
8. **R1.9 (BOM Circular Check)**:
   - Implement depth-first search cycle check in `addLocalBomItem` and `addBomItem` hook. Block addition/updates that create circular material dependencies.
9. **R1.10 (Local Demo Booking System)**:
   - Add local storage fallback array `erp-mini-local-demo-bookings` in `useBookings.ts` when `isLocalDemoAuthEnabled()` is true.

### Milestone 2: Data Synchronization (R2)
1. **R2.1 (FG Cost Price Propagation)**:
   - Call `syncBomCostToProducts()` (BOM sync) automatically inside raw material cost updates and BOM item changes to update finished goods cost in real time.
2. **R2.2 (Product Stock Location Sync)**:
   - In warehouse operations (Stock In/Out/Deduction), update location balances first, and keep `products.stock_quantity` synchronized to the sum of warehouse stock locations.
3. **R2.3 (Stock Adjustment Ledger Sync)**:
   - Publish `STOCK_TRANSACTION_RECORDED` event on manual inventory moves and create a subscriber to insert appropriate journal lines (Nợ 156 / Có 4111 or Nợ 632 / Có 156).
4. **R2.4 (Casso Timezone Alignment)**:
   - Ensure the casso webhook parser and simulator append `+07:00` offset to Vietnam bank timestamps before writing to DB.
5. **R2.5 (Project Health Logs)**:
   - Add audit logging `logLocalAction` / `logAction` inside settings updates for project health metrics.
6. **R2.6 (Double-entry Ledger Check)**:
   - Validate Debits === Credits (+/- tolerance) in journal entry save mutations.
7. **R2.7 (Order Item Total Line Calculation)**:
   - Force line total to equal `quantity * unit_price` inside creation and CSV/Excel import pipelines.
8. **R2.8 (Order Subtotal Realignment)**:
   - Recalculate order subtotal as `sum(items.total)` inside write operations.
9. **R2.9 (Order Total Formula Alignment)**:
   - Enforce `total = subtotal - discount + shipping_fee` on order updates/creations.
10. **R2.10 (Paid Amount Recalculation on Payment Deletion)**:
    - Update payment delete mutations to sum remaining payment transactions and update order `paid_amount` accordingly.

### Milestone 3: Verification Pipeline
- Run `npm run typecheck` to verify TypeScript compile.
- Run `npm run test` (Vitest) to check unit/integration tests.
- Add specific test cases to verify the new rules (budget gate, BOM circular checks, manual match, etc.).
- Run `npx playwright test` to verify E2E flows.
- Run `npm run build` to package.

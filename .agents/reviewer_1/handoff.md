# Review Handoff Report - Centralized Event-Driven Observer

## Review Summary

**Verdict**: REQUEST_CHANGES

This report contains the review findings and adversarial stress test results for the Centralized Event-Driven Observer implementation in the ERP Local Demo. The code compiles successfully, and all unit tests pass. However, several functional gaps, mismatched storage keys, duplicated logic, and query cache stale issues have been identified.

---

## 1. Observation

- **Observation 1 (Storage Key Mismatch)**:
  In `src/hooks/useContracts.ts` (line 205), sales channels are loaded from local storage using:
  ```typescript
  const channelsRaw = localStorage.getItem("erp-mini-local-demo-channels") || "[]";
  ```
  However, the rest of the application (e.g., `useSalesChannels.ts` line 12, `erpEventBus.ts` line 371, `ChannelPieChart.tsx` line 14, `RecentOrders.tsx` line 34, `RevenueChart.tsx` line 24, etc.) uniformly uses:
  ```typescript
  "erp-mini-local-demo-sales-channels"
  ```
  
- **Observation 2 (Missing Events on Contract Activation)**:
  In `src/hooks/useContracts.ts` (lines 328-364), the `updateContract` mutation handles transitioning a contract to `"active"` status in local mode:
  ```typescript
  if (updates.status === "active" && prevStatus !== "active") {
    createLocalOrderFromContract(companyId || "", local[idx]);
  }
  ```
  No events (`CONTRACT_SIGNED` or `ORDER_CREATED`) are published here.

- **Observation 3 (Stale Orders Cache in React Query)**:
  In `src/hooks/useContracts.ts` (lines 359-363), the success handler for `updateContract` only invalidates `"smart-contracts"`:
  ```typescript
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["smart-contracts"] });
    toast({ title: "Cập nhật hợp đồng thành công" });
  }
  ```
  It does not invalidate the `"orders"` query key.

- **Observation 4 (SKU Mismatch / Hardcoding)**:
  In `src/lib/erpEventBus.ts` (line 365) and `src/hooks/useContracts.ts` (line 199), the code resolves the contract order's product by searching for SKU `"SP001"`:
  ```typescript
  const finishedProd = products.find((p: any) => p.sku === "SP001") || products[0];
  ```
  In `src/lib/localInventoryStore.ts` (lines 114-150), `DEFAULT_PRODUCTS` contains no SKU named `"SP001"`. The only seeded products are `"PRD-STICKER"` and `"PRD-CARD"`.

- **Observation 5 (Missing Partner ID in Order Creation)**:
  In `src/hooks/useContracts.ts`, the helper `createLocalOrderFromContract` (lines 232-251) creates a `newOrder` object that is saved to local storage but is missing the `partner_id` property. In contrast, the handler inside `erpEventBus.ts` (lines 398-418) properly includes `partner_id: contract.partner_id || ...`.

- **Observation 6 (Unused Centralized Invalidation)**:
  In `src/lib/queryInvalidation.ts` (line 32), the function `invalidateAccountingRelated` is defined but is never used or imported anywhere in the project. Mutations in `useAccounting.ts` directly invoke `queryClient.invalidateQueries` inline.

- **Observation 7 (Build and Test Output)**:
  - Running `pnpm test` completed successfully with `188 passed (188)` tests.
  - Running `pnpm typecheck` (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`) completed successfully with no compilation errors.

---

## 2. Logic Chain

- **Logic Step 1 (Sales Channel Resolution Failure)**:
  From **Observation 1**, since `useContracts.ts` reads from `"erp-mini-local-demo-channels"` (which does not exist and resolves to `[]`), `channels.find(...)` fails to find the target channel. As a result, the generated order's `channel_id` is set to `null` instead of identifying the correct channel.
  
- **Logic Step 2 (Accounting, Debt, and Inventory Desynchronization)**:
  From **Observation 2**, when a contract is activated through `updateContract`, an order is written directly to local storage. However, because no events are published to the `erpEventBus`, the subscribers for `ORDER_CREATED` do not fire. Thus:
  - Inventory is not deducted.
  - Journal entries and lines are not created.
  - Partner debt amount and total spent are not updated.
  This breaks data synchronization across the ERP sub-systems under local demo mode.

- **Logic Step 3 (Stale UI State)**:
  From **Observation 3**, updating a contract to active writes a new order to local storage, but since `["orders"]` is not invalidated, React Query is unaware of the new order. The user interface does not display the newly created order in the orders list until a hard refresh or another invalidating action is taken.

- **Logic Step 4 (Data Inconsistency / Fallback Behavior)**:
  From **Observation 4**, the search for SKU `"SP001"` fails because it does not exist in the seeds. It falls back to `products[0]` (`"PRD-STICKER"`), which has a seeded selling price of `99000`. However, the generated order items hardcode `unit_price: 120000`, creating a mismatch between the product's actual catalog price and the order's item price.

- **Logic Step 5 (Inconsistent Partner Mapping)**:
  From **Observation 5**, orders created via the `updateContract` mutation lack the `partner_id` key in local storage, preventing them from being correctly associated with their corresponding partner.

---

## 3. Caveats

- The review is focused on local demo mode integrations since the `erpEventBus` is designed specifically for client-side state synchronization. Supabase database triggers/functions for production mode were not checked.
- Evaluated and verified using mock local storage states in memory during unit testing.

---

## 4. Conclusion

The Centralized Event-Driven Observer contains multiple structural bugs that compromise data integrity, cache consistency, and feature parity:
1. **Critical key mismatch**: `"erp-mini-local-demo-channels"` must be renamed to `"erp-mini-local-demo-sales-channels"` in `useContracts.ts`.
2. **Missing event publishing**: The `updateContract` mutation in `useContracts.ts` should publish `CONTRACT_SIGNED` or `ORDER_CREATED` when a contract is activated, rather than writing the order to storage silently.
3. **Cache invalidation gap**: `updateContract` onSuccess must invalidate `["orders"]` when an order is created.
4. **Logic duplication and data gaps**: The order-creation logic in `useContracts.ts` should be refactored or aligned with the handler in `erpEventBus.ts` to ensure `partner_id` is recorded and that default products match seeded SKUs.

---

## 5. Verification Method

To independently verify:
1. **Run test suite**: Execute `pnpm test` (verify that `src/lib/__tests__/erpEventBus.test.ts` passes).
2. **Run typechecking**: Execute `pnpm typecheck` to confirm compilation.
3. **Inspect files**:
   - `src/hooks/useContracts.ts` lines 205, 342-344, 359-363.
   - `src/lib/erpEventBus.ts` lines 365, 371.

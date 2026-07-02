# Handoff Report: Orders & Packing Dialog Analysis

## 1. Observation
I directly observed the following files and tool outputs:
- **Target Files**:
  - `y:\ERP_Local_Mini\src\pages\Orders.tsx`
  - `y:\ERP_Local_Mini\src\components\orders\PackingDialog.tsx`
- **TypeScript Compiler Output** (from command `npx tsc -p tsconfig.app.json --noEmit`):
  ```text
  src/components/orders/PackingDialog.tsx(322,24): error TS2367: This comparison appears to be unintentional because the types '"pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned"' and '"packing"' have no overlap.
  ```
- **File Content of `src/hooks/useOrders.ts`** (Lines 28-32):
  ```typescript
  export interface Order {
    id: string;
    company_id?: string | null;
    order_number: string;
    status: "pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned";
  ```
- **File Content of `src/components/orders/PackingDialog.tsx`** (Line 322):
  ```typescript
  {currentOrder.status === "packing" ? "Đang đóng" : currentOrder.status}
  ```
- **Test suite status** (from command `npx vitest run`):
  - 41 test files, 307 tests passed successfully.
- **Stock deduction behaviour**:
  - In `erpEventBus.ts`, an event handler subscribes to `"ORDER_CREATED"` and calls `createLocalInventoryTransaction` which modifies `"erp-mini-local-demo-products"` inside `localStorage`.
  - In `PackingDialog.tsx` line 52, `autoDeductStock` checkbox state is defined but ignored. The callback `onPackOrder` in `Orders.tsx` only updates the order status to `"waiting_transfer"`.

---

## 2. Logic Chain
1. **TypeScript Type Mismatch**:
   - The `Order` interface's `status` type is a union representing only basic status codes.
   - The local demo mode database/memory supports Pancake POS style statuses (including `"packing"`).
   - In `PackingDialog.tsx`, `currentOrder.status` (typed as the union) is compared to `"packing"`, causing compilation error TS2367.
2. **Stock Update Flow**:
   - Local stock updates are triggered via the `ORDER_CREATED` event bus subscription.
   - `createLocalInventoryTransaction` dynamically edits the product's `stock_quantity` under `"erp-mini-local-demo-products"` in `localStorage`.
   - `useWarehouseStock.ts` reads the updated products list and maps them dynamically to a single default warehouse (`"local-warehouse-default"`, `"Kho chính"`).
   - Once a mutation succeeds, `invalidateOrderRelated` invalidates the `["warehouse-stock-full"]` query, automatically pulling the updated quantities into the UI.
3. **Unused Checkbox**:
   - `PackingDialog.tsx` exposes a "Tự động trừ tồn kho" option but does not pass it back to the status mutation callback, leaving stock unchanged at packing time.

---

## 3. Caveats
- Supabase production migrations were not checked for compatibility with Pancake POS statuses.
- The analysis is bounded by the current mock implementation of local storage warehouse mapping.

---

## 4. Conclusion
- The TypeScript error is caused by the strict definition of `Order["status"]` vs. the Pancake POS statuses utilized in local demo mode.
- Stock deduction is executed synchronously on order creation, making the packing dialog checkbox redundant in the current implementation.
- In local demo mode, warehouse stock is dynamically generated from global stock, meaning any product updates automatically refresh warehouse levels.

---

## 5. Verification Method
- **Verify TypeScript compilation**: `npx tsc -p tsconfig.app.json --noEmit`
- **Verify Test suite stability**: `npx vitest run`

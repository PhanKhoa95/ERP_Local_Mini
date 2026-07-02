# ERP Local Mini: Orders and Packing Dialog Technical Analysis

## 1. Executive Summary
This report analyzes the files `Orders.tsx` and `PackingDialog.tsx` inside the `ERP_Local_Mini` project. It examines the product stock reduction logic, warehouse mapping in local demo vs. production (Supabase) modes, the K80 thermal print workflow, and TypeScript compilation errors, providing clear recommendations and a fix strategy.

---

## 2. Stock Reduction Logic Analysis

### A. Local Demo Mode
- **Mechanism**: The stock deduction is triggered during order creation when the mutation publishes the `"ORDER_CREATED"` event via `erpEventBus`.
- **Event Bus Handler**: In `src/lib/erpEventBus.ts`, an active subscription to `"ORDER_CREATED"` intercepts the event and executes `createLocalInventoryTransaction` for each item.
- **Transaction & Local Storage Updates**: 
  - `createLocalInventoryTransaction` reads the products from the local storage key `"erp-mini-local-demo-products"`.
  - It subtracts the ordered quantity from `product.stock_quantity`.
  - It updates the product record and writes the updated list back to local storage.
  - It writes a new transaction record to the `"erp-mini-local-demo-inventory-transactions"` key.
- **Order Cancellation & Returns**: 
  - In `useOrders.ts` inside `updateOrderStatus`, when an order transitions to `"cancelled"` or `"returned"`, `restoreLocalStock` is called.
  - This function runs `createLocalInventoryTransaction` with a transaction type of `"in"`, which restores the product's `stock_quantity` in local storage.

### B. Supabase Mode
- **Mechanism**: During order creation, the mutation calls `deductSupabaseStock(items, orderNumber)`.
- **Database Updates**:
  - It executes a Supabase RPC function `increment_stock_quantity` with `p_quantity` equal to the negative quantity ordered. This modifies the `stock_quantity` field in the `products` table atomically.
  - It inserts an transaction entry into the `inventory_transactions` table to record the stock out activity.
- **Order Cancellation & Returns**: 
  - In `useOrders.ts` inside `updateOrderStatus`, when status changes to `"cancelled"` or `"returned"`, `restoreSupabaseStock` is executed to increment the `products.stock_quantity` and log a `"in"` transaction.

### C. Major Gaps & Discrepancies Identified
1. **Unused `autoDeductStock` Option in `PackingDialog`**:
   - `PackingDialog.tsx` defines an `autoDeductStock` state (checkbox labeled "Tự động trừ tồn kho" in the UI).
   - However, when the packing is finalized, `handleCompletePacking` invokes `onPackOrder(orderId)`.
   - In `Orders.tsx`, `onPackOrder` maps to `handlePackOrder`, which simply calls `updateOrderStatus.mutateAsync({ id, status: "waiting_transfer" })`.
   - The `autoDeductStock` value is completely ignored, and no stock adjustment is performed during packing.
2. **Double Deduction Risk vs. Delayed Deduction**:
   - Stock is already subtracted at **Order Creation** via the `"ORDER_CREATED"` event.
   - If stock is deducted at creation, having a "Tự động trừ tồn kho" checkbox in the packing step is misleading, because doing so again would result in double deduction.
   - Alternatively, if certain orders are created as drafts/pending without stock reservation, stock should be deducted at packing/confirmation, but the codebase lacks this conditional flow control.

---

## 3. Warehouse Mapping Analysis

### A. Warehouse Designated in Orders
- Orders are stored with a `warehouse_id` foreign key.
- In `Orders.tsx`, the order is enriched using `useMemo`:
  ```typescript
  warehouses: warehouses.find((warehouse) => warehouse.id === order.warehouse_id) || null
  ```
  This allows looking up the warehouse's name and details for UI display.

### B. Local Storage Warehouse Stock Mapping
- In local demo mode, there is **no warehouse-specific stock table** in local storage.
- Instead, `useWarehouseStock.ts` queries the global products key `"erp-mini-local-demo-products"`.
- It dynamically maps any active non-service products with `stock_quantity > 0` to a single hardcoded warehouse:
  - **Warehouse ID**: `"local-warehouse-default"`
  - **Warehouse Code**: `"KHO-CHINH"`
  - **Warehouse Name**: `"Kho chính"` (Default main warehouse)
- **Dynamic Updates**:
  - When `createLocalInventoryTransaction` updates a product's stock in local storage, `invalidateOrderRelated` is triggered on mutation success.
  - This invalidates React Query keys `["warehouse-stock-full"]` and `["warehouse-stock"]`, forcing a refresh.
  - The refreshed query reads the modified local products list and returns the correct updated stock quantity for `"Kho chính"`.

### C. Supabase Warehouse Stock Mapping
- Supabase has a dedicated `warehouse_stock` table which links `product_id` and `warehouse_id` to a warehouse-specific `quantity`.
- **Gap**: The `deductSupabaseStock` function in `useOrders.ts` calls `increment_stock_quantity` on the `products` table but **does not** update the `warehouse_stock` table.
- This creates an inventory discrepancy between the global `products.stock_quantity` and the per-warehouse quantity tracked in `warehouse_stock`.

---

## 4. K80 Printing Workflow Analysis

The application supports K80 thermal receipt printing (72mm width layout) in two separate workflows:

### A. Bulk Printing (`Orders.tsx` - `handleBulkPrint`)
- **Title**: `"HÓA ĐƠN BÁN LẺ"` (Retail Invoice)
- **Layout**: Simple 72mm width container with a dashed line separator, order metadata (order number, customer name, phone), product list (index, product name, quantity, total price), and overall total.

### B. Packing Dialog Printing (`PackingDialog.tsx` - `printK80`)
- **Title**: `"PHIẾU ĐÓNG HÀNG"` (Packing Slip)
- **Layout**: Similar 72mm width layout but includes timestamp, detailed delivery/shipping address, product name along with its SKU, and a footer: `"--- Đã kiểm hàng & đóng gói ---"`.

### C. Core Printing Limitations
1. **Pop-up Blocker Interception**:
   - `window.open("", "_blank", ...)` is called inside asynchronous promise handlers (e.g. after `onPackOrder` finishes).
   - Browsers often block pop-up windows opened asynchronously because they are not recognized as direct results of user action.
2. **Race Condition on Rendering styles**:
   - The print window immediately invokes `printWindow.print()` after `document.write`. Modern browser engines may execute print rendering before the inline styles and HTML layouts are fully compiled, leading to erratic styling or printing blank pages.

---

## 5. TypeScript Compilation Errors

### A. Verbatim Error
```text
src/components/orders/PackingDialog.tsx(322,24): error TS2367: This comparison appears to be unintentional because the types '"pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned"' and '"packing"' have no overlap.
```

### B. Root Cause
- The `Order` interface in `src/hooks/useOrders.ts` strictly defines the `status` property:
  ```typescript
  status: "pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned";
  ```
- However, the local demo mode supports additional Pancake POS statuses (such as `"packing"`, `"waiting_transfer"`, `"waiting_print"`, `"printed"`, `"duplicate"`, `"waiting_goods"`, `"priority_ship"`, `"ordered"`, `"deleted"`).
- In `PackingDialog.tsx` line 322, the comparison:
  ```typescript
  currentOrder.status === "packing"
  ```
  causes compiler error `TS2367` because TS knows `"packing"` is not in the union type of `status`.

---

## 6. Recommended Implementation / Fix Strategy

### Phase 1: TypeScript Compilation Fix (Immediate)
To compile successfully without changing database structure:
- **Option 1 (Quick Type Cast)**: Cast status to `string` in `PackingDialog.tsx`:
  ```typescript
  (currentOrder.status as string) === "packing"
  ```
- **Option 2 (Extend Union Type)**: Update the `Order` interface in `src/hooks/useOrders.ts` to include all Pancake status codes as valid strings:
  ```typescript
  status: "pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned" | "packing" | "waiting_transfer" | "waiting_print" | "printed" | "duplicate" | "waiting_goods" | "priority_ship" | "ordered" | "deleted" | "returned_partial" | "exchanging";
  ```

### Phase 2: Stock Reduction & Warehouse Mapping Fixes
- **In Local Demo Mode**:
  - Connect the `autoDeductStock` state in `PackingDialog.tsx` to the mutation payload.
  - If `autoDeductStock` is selected and stock was not already deducted at order creation (or if we want to defer deduction until packing), trigger `deductLocalStock(items, orderNumber)` during the packing transition.
- **In Supabase Mode**:
  - Modify `deductSupabaseStock` in `useOrders.ts` to deduct quantity from the `warehouse_stock` table where `product_id` matches the item and `warehouse_id` matches the order's warehouse:
    ```typescript
    await supabase
      .from("warehouse_stock")
      .update({ quantity: sql`quantity - ${item.quantity}` }) // or via a dedicated RPC
      .eq("product_id", item.product_id)
      .eq("warehouse_id", warehouseId);
    ```

### Phase 3: Printing Workflow Improvements
- Move the `window.open` call to be synchronous inside the click handler instead of inside the async callback, or render a hidden iframe and call print on it to prevent pop-up blockers from intercepting.
- Add a slight delay before triggering print to let CSS styles load fully:
  ```typescript
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 100);
  ```

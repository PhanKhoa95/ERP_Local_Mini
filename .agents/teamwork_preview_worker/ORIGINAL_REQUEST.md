## 2026-07-02T05:07:12Z
You are teamwork_preview_worker. Your mission is to implement and complete the Packing Workflow and Bulk Action Bar features in y:\ERP_Local_Mini\src\pages\Orders.tsx, y:\ERP_Local_Mini\src\components\orders\PackingDialog.tsx, and y:\ERP_Local_Mini\src\hooks\useOrders.ts.

Please follow these exact requirements:

1. **Extend Order Status Types**:
   - In `src/hooks/useOrders.ts`, modify the `Order` interface's `status` type definition to include extended Pancake statuses:
     `"pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned" | "duplicate" | "waiting_goods" | "priority_ship" | "waiting_print" | "printed" | "ordered" | "packing" | "waiting_transfer" | "deleted" | "returned_partial" | "exchanging"`
   - This will cleanly resolve the TS2367 compilation error in `PackingDialog.tsx` line 322: `{currentOrder.status === "packing" ? "Đang đóng" : currentOrder.status}`.

2. **Enhance PackingDialog.tsx**:
   - **Product Barcode Scanning**: In `handleScanSubmit`, when scanning a value:
     - Check if `currentOrder` is active. If so, search `orderItems` for an item whose product SKU (e.g. `item.products?.sku`) matches the scanned value (case-insensitive).
     - If found:
       - Get its current picked quantity. If it's already fully picked (picked >= quantity), show a warning toast: "Sản phẩm đã đủ".
       - Otherwise, increment its picked quantity in the state by 1 and show a success toast.
       - Clear the input and return.
     - If no matching product SKU is found in the current active order (or if there is no active order), check if the scanned value matches any order number (or order ID) in `allOrders`. If found, set it as `manualOrder`.
     - Otherwise, show a destructive toast: "Không tìm thấy đơn hàng hoặc sản phẩm phù hợp".
   - **Persist Picking Progress Across Orders**:
     - Change the state `pickedItems` from a flat record to a map keyed by order ID: `pickedItemsMap: Record<string, Record<string, number>>`.
     - Define a derived `pickedItems` helper for the current order: `const pickedItems = useMemo(() => currentOrder ? (pickedItemsMap[currentOrder.id] || {}) : {}, [currentOrder, pickedItemsMap])`.
     - When toggling picking or scanning, update `pickedItemsMap` for the `currentOrder.id`.
     - Remove the `useEffect` that clears picking progress on `currentOrder?.id` changes. This ensures picking progress is preserved when the user switches orders.
   - **Fix Sequential Packing Queue Lag**:
     - In `handleCompletePacking`, state updates to `manualOrder` (setting to null) are batched and asynchronous. Ensure that the queue progression logic checks the immediate status correctly (e.g., using local variables or conditional checks) to transition to the next order in `orderQueue` without rendering glitches or jumping back.
   - **Address Stock Deduction**:
     - If `autoDeductStock` is checked, make sure stock deduction is verified. In local demo mode, stock is already deducted at creation time via ORDER_CREATED event subscription. To satisfy the requirement while preventing double-deduction: check if stock has already been deducted for the order (e.g., order has inventory transactions or its status was already updated), or perform the deduction if it hasn't happened.

3. **Enhance Bulk Action Bar in src/pages/Orders.tsx**:
   - **Floating Sticky Layout**: Position the Bulk Action Bar as a floating card at the bottom of the screen (e.g. `fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-6xl shadow-lg border border-blue-100 dark:border-blue-900 bg-white/95 backdrop-blur-sm dark:bg-card/95 px-4 py-2.5 rounded-xl`) to make it easily accessible and look extremely modern on both Desktop and Mobile. Make sure it wraps and scales cleanly on small screens.
   - **More Actions ("Thao tác") Select Dropdown**:
     - Implement `onValueChange` handler.
     - If `"delete"`, update the status of all `selectedOrderIds` to `"deleted"`.
     - If `"assign"`, show a success toast indicating that the selected orders have been assigned to staff.
     - If `"tag"`, show a success toast indicating that tags have been updated for selected orders.
   - **In sản phẩm (Print products)**:
     - Implement `onClick` handler.
     - Generate a print window displaying an aggregated list of products (SKU, name, and total quantity) across all selected orders. This is a bulk pick list for the warehouse team.
   - **In phiếu bàn giao (Print handover ticket)**:
     - Implement `onClick` handler.
     - Generate a print window displaying a handover slip/table listing all selected orders (Order Number, Customer Name, Phone, Total Value) grouped by carrier/shipping provider.
   - **Nhập hàng (Receive goods)**:
     - Implement `onClick` handler.
     - Show a success toast or simple flow indicating that stock has been replenished for the selected orders.

4. **Verify Compile & Tests**:
   - After making all changes, run `npm run typecheck` to verify no TypeScript compilation errors.
   - Run `npm run test` or `npx vitest run` to ensure all existing tests pass successfully.

## 2026-07-02T05:17:25Z
You are teamwork_preview_worker. Your mission is to fix issues identified by the reviewers and challengers in the Packing Workflow and Bulk Action Bar features.

Please implement the following changes:

1. **In `src/pages/Orders.tsx`**:
   - Replace the "Tải lại" button `onClick` handler (currently calling `window.location.reload()`) with a React-friendly data refresh using React Query invalidation:
     ```typescript
     onClick={() => {
       setSelectedOrderIds([]);
       invalidateOrderRelated(queryClient);
       toast({
         title: "Làm mới danh sách",
         description: "Đã làm mới danh sách đơn hàng thành công",
       });
     }}
     ```
   - Make sure `invalidateOrderRelated` is imported from `@/lib/queryInvalidation` (or use queryClient directly to invalidate `["orders"]` and related queries).

2. **In `src/components/orders/PackingDialog.tsx`**:
   - Update `handleScanSubmit` to handle duplicate/multiple items with the same SKU in an order. Find the first item with matching SKU that is **not yet fully picked**:
     ```typescript
     const matchedItem = orderItems.find(
       (item) =>
         item.products?.sku?.toLowerCase() === trimmedScan.toLowerCase() &&
         (pickedItems[item.id] || 0) < item.quantity
     );
     ```
     - If `matchedItem` is found, increment its picked count in state and show success toast.
     - If `matchedItem` is not found, check if there is **any** item in the order with that SKU (even if already fully picked):
       ```symbolic
       const anyMatchedItem = orderItems.find(
         (item) => item.products?.sku?.toLowerCase() === trimmedScan.toLowerCase()
       );
       ```
       - If `anyMatchedItem` is found, show warning toast: `Sản phẩm "${anyMatchedItem.products?.name}" đã được nhặt đủ số lượng.`
       - If no item matches the SKU, proceed to search for an order with that order number/ID in `allOrders`.
   - Clear focus `setTimeout` in the dialog open `useEffect` by storing the timer ID and returning a cleanup function:
     ```typescript
     useEffect(() => {
       let timer: NodeJS.Timeout | undefined;
       if (open) {
         setQueueIndex(0);
         setManualOrder(null);
         setPickedItemsMap({});
         setScanValue("");
         setPackedCount(0);
         timer = setTimeout(() => scanInputRef.current?.focus(), 200);
       }
       return () => {
         if (timer) clearTimeout(timer);
       };
     }, [open]);
     ```

3. **In `src/components/__tests__/OrdersBulkActions.challenge.test.tsx`**:
   - Locate the `beforeEach` hook where `window.Location.prototype` / `window.location` reload mock is set up:
     ```typescript
     const reloadMock = vi.fn();
     Object.defineProperty(window.Location.prototype, 'reload', { ... });
     ```
     Remove this definition entirely to prevent JSDOM test environment prototype corruption. (Since the reload action is no longer using `window.location.reload()`, this mock is unnecessary).

4. **Validation**:
   - Run `npm run typecheck` to verify no compilation errors.
   - Run `npm run test` or `npx vitest run` to verify that ALL unit tests (including the new challenge tests) compile and pass successfully.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

Please document your changes in changes.md and handoff.md, then send a message back.


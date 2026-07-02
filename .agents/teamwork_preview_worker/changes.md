# Code Changes Log

## 1. extended Order Status Types
- **File**: `y:\ERP_Local_Mini\src\hooks\useOrders.ts`
- **Details**:
  - Updated the `Order` interface's `status` type definition to include extended Pancake statuses: `"pending" | "confirmed" | "processing" | "shipping" | "delivered" | "cancelled" | "returned" | "duplicate" | "waiting_goods" | "priority_ship" | "waiting_print" | "printed" | "ordered" | "packing" | "waiting_transfer" | "deleted" | "returned_partial" | "exchanging"`.
  - Added typecast `status: status as any` in the Supabase mutation function to allow compile-time compatibility between the UI-extended statuses and the narrower database constraints.

## 2. Enhanced PackingDialog.tsx
- **File**: `y:\ERP_Local_Mini\src\components\orders\PackingDialog.tsx`
- **Details**:
  - **Imports**: Added `isLocalDemoAuthEnabled` from `@/lib/localDemoAuth` and `getLocalInventoryTransactions`, `createLocalInventoryTransaction`, `getLocalProductBom` from `@/lib/localInventoryStore`.
  - **State Persistence**:
    - Changed `pickedItems` flat state to a map `pickedItemsMap` keyed by `order.id` of type `Record<string, Record<string, number>>`.
    - Created derived state helper `pickedItems` via `useMemo` retrieving picks of the current order ID from `pickedItemsMap`.
    - Removed `useEffect` that cleared picking progress on `currentOrder?.id` changes.
    - Removed `setPickedItems({});` in the `ChevronLeft` and `ChevronRight` click handlers.
  - **Barcode Scanning**:
    - In `handleScanSubmit`, checked if `currentOrder` is active. If so, checked `orderItems` for product SKU matches (case-insensitive).
    - If found and quantity is already fully picked, displayed warning toast.
    - Else, incremented picked quantity by 1 in `pickedItemsMap` for the current order and displayed success toast.
    - If not matching product SKU, checked if the scanned value matches any order number/ID in `allOrders`. Set found order as `manualOrder`.
    - Else, displayed destructive error toast.
  - **Sequential Packing Queue Lag**:
    - Handled stale `manualOrder` state in `handleCompletePacking` by checking a local `isManual` boolean, ensuring correct queue index progression without rendering glitches or jumping back.
  - **Stock Deduction**:
    - In `handleCompletePacking`, if `autoDeductStock` is checked, retrieved transactions from `getLocalInventoryTransactions()`.
    - Verified if a transaction for the order exists. If not, performed the deduction by running `createLocalInventoryTransaction` for each item or its BOM materials.

## 3. Styled & Connected Bulk Action Bar in Orders.tsx
- **File**: `y:\ERP_Local_Mini\src\pages\Orders.tsx`
- **Details**:
  - **Imports**: Added `isLocalDemoAuthEnabled`, `createLocalInventoryTransaction`, and `getLocalProductBom`.
  - **Handlers**:
    - `handleBulkActionChange`: Handled Select dropdown changes for "Thao tác". Updates selected orders to `"deleted"` on "delete", shows assignment toast on "assign", and shows tag toast on "tag".
    - `handleBulkPrintProducts`: Aggregated product SKUs, names, and total quantities across selected orders and opened a print page.
    - `handleBulkPrintHandover`: Grouped selected orders by carrier (`order.partners?.name` or "Tự vận chuyển") and generated a grouped handover table printed in a new window.
    - `handleBulkReplenishStock`: Simulated inventory replenishment transactions (transaction_type: `"in"`) for each selected order's items/BOM materials in local demo mode, then showed a success toast.
  - **Layout**:
    - Updated container div of the Bulk Action Bar to a floating bottom card styled with tailwind CSS: `fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-6xl shadow-lg border border-blue-100 dark:border-blue-900 bg-white/95 backdrop-blur-sm dark:bg-card/95 px-4 py-2.5 rounded-xl animate-in slide-in-from-bottom-2`.
    - Hooked up `onClick` and `onValueChange` events for print products, print handover, replenish stock, and dropdown actions.

## 4. Refined Bulk Refresh (Tải lại) in Orders.tsx
- **File**: `y:\ERP_Local_Mini\src\pages\Orders.tsx`
- **Details**:
  - Replaced the `onClick` handler of the "Tải lại" button (which previously reloaded the entire page using `window.location.reload()`) with a React-friendly invalidation query strategy.
  - Used `useQueryClient` from `@tanstack/react-query` to initialize the `queryClient`.
  - Imported `invalidateOrderRelated` from `@/lib/queryInvalidation` to invalidate `["orders"]` and other related queries while clearing selected order IDs and triggering a success toast.

## 5. Optimized Scan and Focus in PackingDialog.tsx
- **File**: `y:\ERP_Local_Mini\src\components\orders\PackingDialog.tsx`
- **Details**:
  - **Duplicate SKU Scanning**: Updated `handleScanSubmit` to handle orders with duplicate or multiple items having the same SKU. It now searches for the first item with matching SKU that is **not yet fully picked**. If found, it increments its picked count. If none is found, it searches for **any** item with that SKU (even if already fully picked) to display a warning toast indicating the product is already fully picked. Otherwise, it proceeds to scan for order IDs.
  - **Focus Timeout Cleanup**: Stored the timer ID of the auto-focus `setTimeout` inside the dialog open `useEffect`, and returned a cleanup function to clear the timeout when the dialog closes or dependencies change.

## 6. Cleaned Up Challenge Test Setup
- **File**: `y:\ERP_Local_Mini\src\components\__tests__\OrdersBulkActions.challenge.test.tsx`
- **Details**:
  - Removed the `window.Location.prototype.reload` override mock in `beforeEach` hook. Since the "Tải lại" refresh behavior no longer reloads the page via `window.location.reload()`, this mock is obsolete and removing it prevents potential prototype pollution or corruption of the JSDOM test environment.


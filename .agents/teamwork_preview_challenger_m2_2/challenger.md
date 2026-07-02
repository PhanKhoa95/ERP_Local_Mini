# Bulk Action Bar - Empirical Verification & Challenge Report

**Date**: 2026-07-02
**Agent**: teamwork_preview_challenger_m2_2
**Overall Risk Assessment**: MEDIUM

---

## 1. "Thao tác" Dropdown Actions in Orders.tsx

### Delete Action
- **Mechanism**: The delete action iterates over the selected order IDs and calls `updateOrderStatus.mutateAsync({ id, status: "deleted" })` sequentially.
- **Identified Flaw (Critical/High)**: 
  - **State Guard Block**: The order status update is constrained by a status transition guard (`allowedTransitions` in `useOrders.ts`). Orders in states like `delivered`, `returned`, `returned_partial`, or `exchanging` are prohibited from transitioning to `deleted`.
  - **Partial Execution & UI Inconsistency**: In a bulk operation, the loop runs sequentially. If one of the selected orders throws a transition guard error, the loop is immediately aborted. However, any deletions that were executed before the error are persisted, while subsequent ones are skipped. The UI fails to clear the selection list (`selectedOrderIds`), leaving the UI out of sync and prompting a misleading state.
- **Empirical Proof**: Written in `src/components/__tests__/OrdersBulkActions.challenge.test.tsx` (Test: `stops and reports error if delete mutation fails`).

### Assign Action
- **Mechanism**: Displays a toast notification: `"Đã phân công [count] đơn hàng cho nhân viên xử lý thành công."`
- **Identified Flaw (Low)**: 
  - **Stub Only**: This action does not update any database records or change any assignment field. It is purely a UI mockup showing a successful toast.

### Tag Action
- **Mechanism**: Displays a toast notification: `"Đã cập nhật thẻ (tags) cho [count] đơn hàng thành công."`
- **Identified Flaw (Low)**: 
  - **Stub Only**: This action is a placeholder and does not write any tags/labels to the database or state.

---

## 2. Printable Views Verification

### Aggregated Product Pick List (In sản phẩm)
- **Mechanism**: Groups items from all selected orders and sums their quantities.
- **Identified Flaw (Medium)**: 
  - **Key Collision on Null SKUs**: The aggregation groups products using the product SKU: `const sku = item.products?.sku || "N/A"`. If multiple distinct products are missing SKUs, they will all group under `"N/A"`. Their quantities will be aggregated together, presenting an incorrect total and mix-up in the picker list.
- **Empirical Proof**: Verified via test case `verifies printable view - Aggregated Product pick list` where quantities are aggregated and written to a print window document.

### Grouped Handover Slips (In phiếu bàn giao)
- **Mechanism**: Groups orders by carrier name (`order.partners?.name || "Tự vận chuyển / Chưa chọn"`) and outputs grouped tables.
- **Identified Flaw (Low)**:
  - **No Carrier Page Breaks**: The grouped handover slip renders tables sequentially in a single document window. While it uses `page-break-inside: avoid` on the containers, it does not insert strict page breaks (`page-break-before: always` or `page-break-after: always`) between different carriers, which is normally expected so each carrier can take their own physical slip.

---

## 3. Floating Sticky Layout Verification

### Desktop Size
- **Behavior**: The bar floats centered at the bottom of the screen (`fixed bottom-4 left-1/2 -translate-x-1/2`). It has `max-w-6xl` which keeps it clean, centered, and readable. All 12 tools and options fit on a single row.

### Mobile Size
- **Identified Flaw (Medium)**:
  - **Excessive Vertical Space (UX Obtrusion)**: On mobile viewports (e.g. ~360px-412px wide), there is no responsive collapsing, hiding, or icon-only behavior for the 12 elements. Because of `flex-wrap`, the buttons wrap into 4-5 rows. The bar grows to a height of 150px-200px, covering up to 30% of the mobile screen height and blocking underlying orders.

---

## 4. Verification Runs

- **Typecheck (`npm run typecheck`)**: Passed successfully with no errors.
- **Unit & Integration Tests (`npm run test`)**:
  - All 307 existing tests passed.
  - Added new test suite `src/components/__tests__/OrdersBulkActions.challenge.test.tsx` containing 6 test cases specifically validating the bulk action bar, printable view data, exception handling, and mock states.
  - Total test count: 313 passed successfully.

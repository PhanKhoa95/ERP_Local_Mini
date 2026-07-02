# Project: Packing Workflow & Bulk Action Bar Integration

## Architecture
- **Orders.tsx**: Main page listing ERP orders. Needs to render the **Bulk Action Bar** when one or more orders are selected.
- **PackingDialog.tsx**: Dialog component launched from the bulk actions toolbar or order details. Handles order scanning/lookup, picking list (picking items checklist), stock verification and deduction, retail receipt K80 printing, and automatic progression to the next selected order.
- **Data Flow / State Sync**:
  - Selection state in `Orders.tsx` triggers the visibility of `Bulk Action Bar`.
  - Triggering "Đóng hàng" (Pack orders) opens `PackingDialog` with the selected order IDs.
  - On completing a packing process (checking off all items or clicking "Đã đủ hàng"):
    - Order status updates to `waiting_transfer`.
    - Inventory is updated (items deducted from the designated warehouse).
    - If configured, K80 print window opens.
    - If multiple orders were selected, the dialog automatically advances to the next order in the queue.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 1 | Exploration & Diagnostic | Inspect `Orders.tsx` and `PackingDialog.tsx` structure and TypeScript errors | None | DONE (da92c621, e86932bf, 56a53389) |
| 2 | Implement Bulk Action Bar | Add Toolbar/Bulk Actions on Orders.tsx with all standard buttons | M1 | PLANNED |
| 3 | Complete Packing Workflow | Implement PackingDialog logic (picking, stock reduction, K80 printing, sequential forwarding) | M1, M2 | PLANNED |
| 4 | Verification & Quality Gate | Run typecheck, verify test coverage, and test functionality | M3 | PLANNED |

## Interface Contracts
### Orders.tsx ↔ PackingDialog.tsx
- Dialog Props:
  - `open`: boolean
  - `onClose`: () => void
  - `selectedOrderIds`: string[] (queue of order IDs to pack sequentially)
  - `onPackOrderComplete`: (orderId: string) => void (callback when an order in the queue is successfully packed)
- Stock Deduction:
  - Updates `products` list in localStorage / Supabase.
  - Updates order status to `waiting_transfer`.

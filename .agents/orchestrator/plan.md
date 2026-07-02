# Execution Plan: Bulk Actions & Pancake Packing Workflow (Milestone 6)

## Project Objective
Integrate Pancake-style Bulk Action Bar and Packing/Picking Dialog ("Đóng hàng") into the Order Management page (`src/pages/Orders.tsx`), ensuring state synchronization, inventory deduction, print actions, and seamless user experience.

## Milestones & Tasks

### Milestone 6: Bulk Actions & Pancake Packing Workflow
- **Goal**: Implement Bulk Action Bar and Packing Dialog in `Orders.tsx`.
- **Tasks**:
  1. **Exploration & Codebase Analysis**:
     - Map out selection states in `Orders.tsx`.
     - Discover how order actions, status updates, and stock deduction hooks (or helper functions) are currently implemented.
     - Understand the warehouse/inventory structures and how products are queried and updated.
  2. **Implementation (Worker)**:
     - Render white/blue Bulk Action Bar on top of the order table when at least 1 order is selected.
     - Add required buttons: `Tải lại`, `In đơn`, `Cập nhật nhanh`, `In sản phẩm`, `Xuất excel`, `Nhập excel`, `Đóng hàng`, `In phiếu bàn giao`, `Nhập hàng`, `Thao tác` (dropdown).
     - Build the Packing & Picking Dialog (`PackingDialog`):
       - Search/scan order input field.
       - Display Order details (Code, Customer Name, Phone, Address, Shipping partner (ĐVVC), and item list with quantity needed vs quantity packed).
       - Support packing items manually or via a "Đã đủ hàng" button.
       - Add configuration checkboxes: "Tự động in hóa đơn/nhãn dán K80 sau khi đóng xong" and "Tự động trừ tồn kho sản phẩm".
       - Complete packaging: Update order status to `waiting_transfer`, deduct stock from the designated warehouse, optionally trigger K80 print window, and auto-advance to the next selected order.
  3. **Verification (Reviewer & Challenger & Auditor)**:
     - Review layout, components, responsive styles, state consistency.
     - Run typechecks and unit tests to verify no compilation or business logic regressions.
     - Perform audit verification to ensure no hardcoded or fake mock data.

## Verification Gates
1. **TypeScript compilation**: `npm run typecheck` passes 100%.
2. **Production build**: `npm run build` compiles without errors.
3. **Manual / Challenger Verification**: Selecting orders, packing them, status change to `waiting_transfer`, stock deduction, and K80 print window display correctly.
4. **Audit**: Verifying correct localStorage operations and no fake mock data.

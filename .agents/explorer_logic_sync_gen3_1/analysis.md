# Codebase Analysis Report: Logic Resolution & Data Sync

This report outlines the files, line numbers, and proposed implementation details for resolving business logic limitations (R1) and data synchronization issues (R2) identified in the ERP codebase.

---

## 1. Business Logic Resolutions (R1)

### R1.1 Order Payment Status Synchronization (`paid` based on `paid_amount` vs `total`)
*   **Target Files**: `src/hooks/usePaymentTransactions.ts`
*   **Exact Lines**:
    *   Local path: lines 354-357
    *   Supabase mutation path: lines 381-393
*   **Current State**: Local storage mode only checks and sets `"paid"` if the paid amount is equal to or greater than the total. It does not handle `"partial"` or `"unpaid"`. Supabase path does not update the order's `payment_status` at all when a payment transaction is recorded.
*   **Proposed Fix**:
    *   Refactor the payment status logic to evaluate `paid_amount` vs `total` dynamically:
        *   If `paid_amount >= total`, set `payment_status = "paid"`.
        *   If `paid_amount > 0` and `paid_amount < total`, set `payment_status = "partial"`.
        *   If `paid_amount <= 0`, set `payment_status = "unpaid"`.
    *   Apply this change to both local storage path and the Supabase mutation path by querying the order's `total` first, calculating the updated status, and performing a dual-write (updating both `paid_amount` and `payment_status` in `orders`).
*   **Test Suggestion**: Add unit tests verifying order payment status transition from `unpaid` -> `partial` -> `paid` when creating payment transactions.

### R1.2 Manual Match UI/Backend for Unmatched Casso Transactions
*   **Target Files**: `src/components/finance/CassoReconciliation.tsx`, `src/hooks/usePaymentTransactions.ts` (or a new hook `useBankTransactions.ts`)
*   **Exact Lines**: `src/components/finance/CassoReconciliation.tsx` lines 14-45 (mock data) and 152-157 (unmatched badge render).
*   **Current State**: Casso transactions are completely mock-based in `CassoReconciliation.tsx`. There is no UI button to link an unmatched transaction to an order or partner, and no corresponding backend mutation.
*   **Proposed Fix**:
    *   Use a React Query hook to fetch from the `bank_transactions` table for the current `company_id`.
    *   In the UI, add an action button "Gán đơn hàng" (Assign Order) next to transactions with `reconciliation_status === 'unmatched'`.
    *   Clicking the button opens a modal (`MatchOrderDialog`) listing active, unpaid, or partially paid orders.
    *   On selection, call a mutation `matchBankTransaction({ bankTxId, orderId })` which:
        1. Updates `bank_transactions` set `reconciliation_status = 'matched'`, `matched_entity_id = orderId`, `matched_entity_type = 'order'`, and populate reconciliation auditing fields.
        2. Inserts a corresponding payment transaction (`payment_transactions`) for the order, which automatically updates the order's `paid_amount` and `payment_status` via the R1.1 hook logic.
*   **Test Suggestion**: Verify the modal state, the mutation payload, and confirm that linking updates both the transaction status and order ledger.

### R1.3 Warn/Prevent Selling Price Lower than Cost Price
*   **Target Files**: `src/components/products/ProductDialog.tsx`
*   **Exact Lines**: lines 16-28 (Zod schema), 102-121 (handleSubmit), 278-285 (UI fields).
*   **Current State**: Product dialog has separate validation for `selling_price` and `cost_price` but does not compare them.
*   **Proposed Fix**:
    *   In the UI input form, show an inline warning message (yellow color) directly under the "Giá bán" field if `formData.selling_price > 0 && formData.cost_price > 0 && formData.selling_price < formData.cost_price`:
        ```tsx
        {formData.selling_price > 0 && formData.cost_price > 0 && formData.selling_price < formData.cost_price && (
          <p className="text-xs text-amber-500 font-medium mt-1">
            Cảnh báo: Giá bán đang thấp hơn giá nhập (vốn).
          </p>
        )}
        ```
    *   Alternatively, refine the Zod schema to reject it on submission if strict enforcement is required:
        ```typescript
        const productSchema = z.object({ ... }).refine(data => data.selling_price >= data.cost_price, {
          message: "Giá bán không được thấp hơn giá vốn!",
          path: ["selling_price"]
        });
        ```
*   **Test Suggestion**: Write validation tests for `ProductDialog` submitting a price discrepancy.

### R1.4 Block Deletion of Product in BOM of Another Product
*   **Target Files**: `src/hooks/useProducts.ts` (inside `deleteProduct` mutation).
*   **Exact Lines**: lines 173-188.
*   **Current State**: Product deletion checks foreign key errors (`23503`) but in local mode, it silently deletes the product and filters out BOM references, which corrupts product recipes.
*   **Proposed Fix**:
    *   In the `deleteProduct` mutation (before executing the delete call):
        *   Local Mode: Read `BOM_KEY` from localStorage. Check if any active BOM contains `material_id === id`. If yes, fetch the parent product's name and throw a detailed exception:
            `throw new Error("Không thể xóa sản phẩm vì đang là vật tư trong định mức (BOM) của sản phẩm khác.");`
        *   Supabase Mode: Query `product_bom` to see if there is any active reference. If yes, block deletion and throw a similar custom error toast.
*   **Test Suggestion**: Create a test where Product A is in the BOM of Product B. Verify calling `deleteProduct(A.id)` throws an assertion error and keeps Product A intact.

### R1.5 Manage Quantity for Limited Services
*   **Target Files**: `src/components/products/ProductDialog.tsx`, `src/lib/localInventoryStore.ts` (`createLocalInventoryTransaction`), `src/hooks/useOrders.ts` (`deductLocalStock`, `deductSupabaseStock`).
*   **Current State**: Any product marked `is_service === true` bypasses stock checks in audits, but also fails/throws an error when an inventory transaction is registered for it.
*   **Proposed Fix**:
    *   Add a new column or attribute `is_limited_service` (or `manage_service_quantity`).
    *   In `ProductDialog.tsx`, when "Sản phẩm dịch vụ" is enabled, show an option: "Quản lý số lượng / giới hạn chỗ". If checked, enable inputs for `stock_quantity` (representing the capacity or slot limit) and `min_stock`.
    *   In `createLocalInventoryTransaction` (in `localInventoryStore.ts` line 784):
        *   Check `if (product.is_service && !product.is_limited_service) throw new Error("Sản phẩm dịch vụ không quản lý tồn kho.");`
        *   If it is a limited service, allow inventory transactions, checking for negative capacity: `if (currentStock + delta < 0) throw new Error("Dịch vụ đã hết chỗ/số lượng giới hạn.");`
    *   In `deductLocalStock` and `deductSupabaseStock`, check if the item is a service. If it's a normal service, skip stock subtraction. If it is a limited service, perform the stock subtraction.
*   **Test Suggestion**: Add a test creating an order with a limited service item, checking that stock is correctly deducted and errors out when exceeding the limit.

### R1.6 Ignore Inactive Sales Channels in Quota Calculations
*   **Target Files**: `src/hooks/useDashboardStats.ts`, `src/components/dashboard/ChannelPieChart.tsx`, `src/hooks/useReportStats.ts`.
*   **Exact Lines**:
    *   `useDashboardStats.ts` line 96
    *   `ChannelPieChart.tsx` lines 38, 77
    *   `useReportStats.ts` line 46
*   **Current State**: The active status of the sales channel (`is_active === false`) is ignored. Revenue/quota contribution maps include inactive channels, which skews data distribution.
*   **Proposed Fix**:
    *   In all three files, filter the channel lists before processing. For example, change `channels.map(...)` to `channels.filter((c: any) => c.is_active !== false).map(...)`.
*   **Test Suggestion**: Add a mock database test with one active and one inactive sales channel and verify the dashboard stats exclude the inactive channel's quota calculations.

### R1.7 Check Project Budget Limit when Creating Expense Vouchers
*   **Target Files**: `src/hooks/useCashVouchers.ts`
*   **Exact Lines**: lines 110-136 (`createVoucher` mutation).
*   **Current State**: Expense vouchers can be created for projects without checking the project's budget, allowing project expenses to exceed allocations.
*   **Proposed Fix**:
    *   Inside the `createVoucher` mutation, if the voucher type is `"payment"` and a `project_id` is specified:
        1. Fetch the project details (specifically its `budget`).
        2. Sum all existing, non-voided payment vouchers (`voucher_type === "payment" && status !== "voided"`) linked to this project.
        3. Check `if (existingCost + newAmount > project.budget) { throw new Error("Không thể tạo phiếu chi: Tổng chi phí vượt quá ngân sách được phê duyệt của dự án."); }`.
*   **Test Suggestion**: Mock a project with a 10M VNĐ budget, record 8M VNĐ in cash payments, and assert that attempting to create a new 3M VNĐ voucher fails validation.

### R1.8 Block Circular Dependency in BOM Materials
*   **Target Files**: `src/hooks/useProductBom.ts` (`addBomItem` mutation), `src/lib/localInventoryStore.ts` (`addLocalBomItem`).
*   **Exact Lines**:
    *   `useProductBom.ts` lines 90-122
    *   `localInventoryStore.ts` lines 863-897
*   **Current State**: Only self-reference check is implemented (`product_id === material_id`). Loops spanning multiple products (A -> B -> C -> A) are not blocked.
*   **Proposed Fix**:
    *   Create a cycle-detection function using BFS or DFS traversal on the active BOM graph.
    *   Before inserting a BOM entry (e.g., adding `materialId` as a component of `productId`), run the check. If a cycle is detected, block the mutation:
        ```typescript
        function checkCircularDependency(productId: string, candidateMaterialId: string, bomItems: ProductBom[]): boolean {
          const visited = new Set<string>();
          const queue: string[] = [candidateMaterialId];
          while (queue.length > 0) {
            const current = queue.shift()!;
            if (current === productId) return true; // Cycle detected
            if (!visited.has(current)) {
              visited.add(current);
              const materials = bomItems
                .filter(item => item.product_id === current && item.is_active !== false)
                .map(item => item.material_id);
              for (const matId of materials) {
                if (!visited.has(matId)) queue.push(matId);
              }
            }
          }
          return false;
        }
        ```
*   **Test Suggestion**: Add a test that tries to add finished product A as a material of component C, verifying it is blocked with a `"Circular dependency detected"` error.

---

## 2. Data Synchronization (R2)

### R2.1 Auto Sync Finished Product Cost Price when BOM Price Changes
*   **Target Files**: `src/hooks/useProducts.ts` (`updateProduct` mutation), `src/hooks/useProductBom.ts` (`addBomItem`, `updateBomItem`, `deleteBomItem` mutations).
*   **Current State**: Audit warns if price discrepancies occur, but there is no mechanism to propagate price changes up the BOM tree.
*   **Proposed Fix**:
    *   Write a helper function `syncParentBomCost(productId)` that is called whenever a product's price is updated, or a BOM item is modified.
    *   The function queries all active BOM entries where the modified product is used as a material, recalculates each parent product's cost price, updates the database, and recursively calls `syncParentBomCost(parentId)` to propagate the changes.
*   **Test Suggestion**: Change raw material Fabric price from 30 -> 40. Verify finished Shirt price (using 2x Fabric) automatically increases by 20.

### R2.2 Sync `products.stock_quantity` with Sum of `warehouse_stock.quantity`
*   **Target Files**: `src/hooks/useWarehouseStock.ts` (`updateWarehouseStock` mutation), `src/hooks/useOrders.ts` (`deductSupabaseStock`, `restoreSupabaseStock`).
*   **Current State**: Order deductions bypass `warehouse_stock`, leading to data drift. Individual stock updates inside `useWarehouseStock.ts` do not update the main product's `stock_quantity`.
*   **Proposed Fix**:
    *   When `warehouse_stock` is updated, fetch the sum of all warehouse quantities for that product and write it to `products.stock_quantity`.
    *   In the order stock deduction flow, update a specific warehouse's stock (using `autoSelectWarehouse` logic) instead of updating the product table directly, then trigger the summation sync.
*   **Test Suggestion**: Modify inventory at Warehouse A and Warehouse B for Product X, and verify `products.stock_quantity` equals the combined total.

### R2.3 Auto Sync Journal Entries for Inventory Stock In/Out
*   **Target Files**: `src/lib/erpEventBus.ts`, `src/components/inventory/StockTransactionDialog.tsx`
*   **Current State**: Seeding writes initial accounting entries, and orders create entries via the event bus. However, manual inventory movements do not trigger journal entries, making the ledger incomplete.
*   **Proposed Fix**:
    *   Define a new event in `erpEventBus.ts`: `STOCK_TRANSACTION_RECORDED`.
    *   Publish this event in `StockTransactionDialog.tsx` (for both local and cloud modes) when completing a manual stock transaction.
    *   Register a subscriber `InventoryTransactionAccountingHandler` in `erpEventBus.ts` that automatically creates double-entry journal entries:
        *   **Stock In**: Debit "156" (Goods) / Credit "4111" (Equity) or "642" (Gain).
        *   **Stock Out**: Debit "632" (COGS/Loss) / Credit "156" (Goods).
        *   Amount is computed as `transaction.quantity * product.cost_price`.
*   **Test Suggestion**: Perform a manual Stock In of 10 items at cost 100k, and verify a new journal entry is created with Debit 156 (1,000,000) and Credit 4111 (1,000,000).

### R2.4 Sync Casso Bank Transaction Timezone (GMT+7 to UTC)
*   **Target Files**: Bank transaction webhook parser/ingest code.
*   **Current State**: Casso sends Vietnam time strings (e.g. `2026-06-22 14:10:02`). If inserted directly, Postgres processes it as UTC, shifting the actual transaction time forward by 7 hours.
*   **Proposed Fix**:
    *   Normalize the casso date-time string by parsing it and appending the GMT+7 offset `+07:00` (e.g. `2026-06-22T14:10:02+07:00`) before sending it to Supabase. This ensures standard timestamptz conversion to the correct UTC timestamp (`2026-06-22T07:10:02Z`).
*   **Test Suggestion**: Pass `2026-06-22 14:10:02` from a mock Casso payload and assert that the database stores it as `2026-06-22T07:10:02.000Z`.

### R2.5 Record Project Health Configuration Change History in `audit_logs`
*   **Target Files**: `src/pages/Reports.tsx`
*   **Exact Lines**: lines 216-232 (`handleSaveProjectHealth` function).
*   **Current State**: Changes to project health configurations are saved directly to `shop_settings` but are not logged in the audit logs.
*   **Proposed Fix**:
    *   Import and call the `logAction` function from the `useAuditLogs` hook inside `handleSaveProjectHealth`:
        ```typescript
        const oldConfig = dbHealthDetails[code] || null;
        const newConfig = healthFormData;
        await logAction(
          `Cập nhật sức khỏe dự án [${code}]`,
          "shop_settings",
          `setting-${companyId}-project_health_details`,
          oldConfig,
          newConfig
        );
        ```
*   **Test Suggestion**: Open Project Health modal, update progress, click save, and check the `audit_logs` table (or local Audit Logs screen) to ensure a log entry exists with the exact progress delta.

# Codebase Analysis Report: Logic Resolution & Data Sync (Attempt 2)

This report provides a detailed codebase audit of the `ERP_Local_Mini` system, identifying exactly **10 business logic limitations** and **10 data synchronization inconsistencies**. For each issue, the exact file locations, current codebase state, operational/financial risks, and implementation recommendations (including code and SQL schemas) are documented.

---

## Part 1. 10 Business Logic Limitations (R1)

### R1.1 Order Payment Status Auto-Transition Failure
*   **Target File**: `src/hooks/usePaymentTransactions.ts` (lines 381-393)
*   **Current State**: In Supabase mode, the transaction mutation adds the transaction amount to the order's `paid_amount`, but it never updates the order's `payment_status` in the database. In local storage mode, it only updates the status to `"paid"` if the paid amount meets or exceeds the total, failing to handle other statuses.
*   **Operational & Financial Risk**: Orders with matching payment transactions remain in `pending` or `unpaid` states, forcing manual status corrections and skewing cash flow reports.
*   **Recommendation**:
    Update the `createTransaction` mutation to query the order's total, calculate the new payment status, and update both fields:
    ```typescript
    const updatedPaidAmount = (order.paid_amount || 0) + transaction.amount;
    let paymentStatus = "unpaid";
    if (updatedPaidAmount >= (order.total || 0)) {
      paymentStatus = "paid";
    } else if (updatedPaidAmount > 0) {
      paymentStatus = "partially_paid";
    }
    await supabase.from("orders").update({ paid_amount: updatedPaidAmount, payment_status: paymentStatus }).eq("id", orderId);
    ```

### R1.2 Missing Support for `"partially_paid"` Payment Status
*   **Target Files**: `src/hooks/usePaymentTransactions.ts` (lines 354-357) and `src/components/orders/OrderDetailDialog.tsx`
*   **Current State**: Status transitions check `paid_amount >= total` to set `"paid"`, else default to `"unpaid"`. An order with a partial deposit still displays as `"unpaid"`.
*   **Operational & Financial Risk**: Loss of tracking for partial customer deposits, making it difficult to isolate partially paid invoice balances.
*   **Recommendation**:
    Define `"partially_paid"` in Zod validation schema and handle it in the badges:
    ```tsx
    // Badge rendering
    {order.payment_status === "partially_paid" && (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-300">
        Thanh toán một phần
      </Badge>
    )}
    ```

### R1.3 Lack of Manual Matching UI/Backend for Unmatched Casso Transactions
*   **Target Files**: `src/components/finance/CassoReconciliation.tsx` (lines 14-45, 147-158)
*   **Current State**: Transactions that fail automatic parsing (description missing order number) are shown as `"unmatched"`. No UI button or backend query exists to match these bank transactions manually.
*   **Operational & Financial Risk**: Unmatched deposits are orphaned in the bank transaction log, distorting financial reconciliations and requiring direct database edits.
*   **Recommendation**:
    Add a manual match dialog in `CassoReconciliation.tsx`. Introduce a mutation `matchBankTransaction`:
    ```typescript
    const matchBankTransaction = useMutation({
      mutationFn: async ({ txId, orderId }: { txId: string, orderId: string }) => {
        // 1. Update bank_transactions reconciliation status
        await supabase.from("bank_transactions").update({ reconciliation_status: "matched", matched_order_id: orderId }).eq("id", txId);
        // 2. Insert corresponding payment transaction
        await createTransaction.mutateAsync({ order_id: orderId, amount: tx.amount, transaction_type: "payment_in" });
      }
    });
    ```

### R1.4 Lack of Selling Price below Cost Price Warning/Enforcement
*   **Target Files**: `src/components/products/ProductDialog.tsx` (lines 16-28 Zod, 278-285 UI), `src/components/orders/CreateOrderDialog.tsx`
*   **Current State**: There is no check comparing `selling_price` with `cost_price` during product creation or order entry. Users can sell items below cost price without warnings.
*   **Operational & Financial Risk**: Financial losses from human error during discounted sales or bulk invoicing.
*   **Recommendation**:
    Add an inline warning under price fields in `ProductDialog.tsx`:
    ```tsx
    {formData.selling_price > 0 && formData.cost_price > 0 && formData.selling_price < formData.cost_price && (
      <span className="text-xs text-amber-500 font-medium">Cảnh báo: Giá bán thấp hơn giá vốn</span>
    )}
    ```
    Add Zod schema warning and alert hooks during order item entry.

### R1.5 No Block on Product Deletion when Used in a BOM
*   **Target Files**: `src/hooks/useProducts.ts` (lines 173-200), `src/lib/localInventoryStore.ts` (lines 643-655)
*   **Current State**: Deleting a product silently deletes or orphans raw material references inside `product_bom`.
*   **Operational & Financial Risk**: Corrupts finished goods recipes, throwing runtime crashes when calculating BOM backflush or production availability.
*   **Recommendation**:
    Query `product_bom` for active material usage before executing deletion:
    ```typescript
    const { data: bomUsage } = await supabase.from("product_bom").select("product_id").eq("material_id", id).eq("is_active", true);
    if (bomUsage && bomUsage.length > 0) {
      throw new Error("Không thể xóa: Sản phẩm đang được sử dụng trong định mức BOM của thành phẩm khác.");
    }
    ```

### R1.6 Hardcoded Stock Exclusions for Service Products
*   **Target Files**: `src/lib/localInventoryStore.ts` (lines 784-791), `src/hooks/useProducts.ts`
*   **Current State**: Products with `is_service === true` are hardcoded to have `stock_quantity = 0` and are strictly blocked from stock moves or inventory transactions.
*   **Operational & Financial Risk**: Disables slot limit management or capacity tracking for packages/events (e.g. a class with 20 seats max).
*   **Recommendation**:
    Introduce a field `is_limited_service` (or `manage_service_quantity`).
    Update stock logic:
    ```typescript
    if (product.is_service && !product.is_limited_service) {
      throw new Error("Sản phẩm dịch vụ thông thường không quản lý tồn kho.");
    }
    ```
    Allow inventory transactions if `is_limited_service` is active.

### R1.7 Active Sales Channels Quota Calculation Error
*   **Target File**: `src/components/settings/SubscriptionsTab.tsx` (line 156)
*   **Current State**: Usage calculations use `channels.length`, counting both active and inactive/disabled sales channels.
*   **Operational & Financial Risk**: Users are blocked from adding new sales channels because of retired/disabled channels, violating subscription tiers.
*   **Recommendation**:
    Filter out inactive channels before validating quotas:
    ```typescript
    current: channels.filter(c => c.is_active !== false).length
    ```

### R1.8 Lack of Project Budget Validation during Expense Voucher (Cash Voucher) Creation
*   **Target File**: `src/hooks/useCashVouchers.ts` (lines 98-142)
*   **Current State**: Cash payment vouchers can be created and confirmed for any project without verifying if the voucher amount exceeds the project's allocated budget.
*   **Operational & Financial Risk**: Project costs exceed approved budget caps, leading to hidden deficit spending.
*   **Recommendation**:
    Validate project budget during voucher confirmation:
    ```typescript
    if (v.voucher_type === "payment" && v.project_id) {
      const proj = projects.find(p => p.id === v.project_id);
      const existingExpenses = vouchers
        .filter(x => x.project_id === v.project_id && x.voucher_type === "payment" && x.status === "confirmed")
        .reduce((sum, x) => sum + x.amount, 0);
      if (existingExpenses + v.amount > (proj?.budget || 0)) {
        throw new Error("Không thể xác nhận: Chi phí vượt quá ngân sách được cấp cho dự án.");
      }
    }
    ```

### R1.9 Missing Circular Dependency Checks in BOM
*   **Target Files**: `src/hooks/useProductBom.ts` (lines 90-122), `src/lib/localInventoryStore.ts` (lines 863-897)
*   **Current State**: Only self-reference is checked (`product_id === material_id`). Multi-level loops (A -> B -> C -> A) are allowed.
*   **Operational & Financial Risk**: Causes infinite loops, stack overflow errors, or browser crashes during backflushing and production plan calculations.
*   **Recommendation**:
    Run a depth-first search cycle detector prior to adding/updating a BOM item:
    ```typescript
    function detectCycle(productId: string, materialId: string, bomList: ProductBom[]): boolean {
      const visited = new Set<string>();
      const queue = [materialId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr === productId) return true;
        visited.add(curr);
        const children = bomList.filter(b => b.product_id === curr && b.is_active !== false).map(b => b.material_id);
        for (const child of children) {
          if (!visited.has(child)) queue.push(child);
        }
      }
      return false;
    }
    ```

### R1.10 Lack of Booking System support for Local Demo / Offline Mode
*   **Target File**: `src/hooks/useBookings.ts` (lines 47-128)
*   **Current State**: Unlike other hooks, `useBookings` contains no local storage checks and directly calls Supabase APIs and Edge functions, causing crash errors in local/offline modes.
*   **Operational & Financial Risk**: Complete breakdown of the Booking module for retail/service shops operating in local-only demo configurations.
*   **Recommendation**:
    Implement local storage wrappers (`getLocalBookings`, `saveLocalBookings`) inside `useBookings.ts` when `isLocalDemoAuthEnabled() === true`.

---

## Part 2. 10 Data Synchronization Inconsistencies (R2)

### R2.1 Finished Goods Cost Price Drift from BOM Cost Changes
*   **Target Files**: `src/hooks/useProducts.ts`, `src/hooks/useProductBom.ts`
*   **Current State**: Changing a raw material cost price does not recalculate the cost price of parent products in real time. Cost discrepancies must be manually synced or resolved in audit pages.
*   **Data Integrity & Audit Risk**: Outdated COGS calculation on sales orders, creating inaccurate gross profit margins in financial reports.
*   **Recommendation**:
    Add a recursive trigger function `syncParentBomCost(productId)` in `useProducts.ts` and call it inside the cost update and BOM mutation `onSuccess` handlers.

### R2.2 Product Stock Quantity Mismatch with Warehouse Stock
*   **Target Files**: `src/hooks/useWarehouseStock.ts`, `src/hooks/useOrders.ts`
*   **Current State**: Sales stock reductions update `products.stock_quantity` directly, skipping `warehouse_stock` balances. This results in products displaying positive stock overall but zero stock in warehouse locations.
*   **Data Integrity & Audit Risk**: Mismatch between physical location reports and general ledger totals.
*   **Recommendation**:
    Refactor order stock deduction to update the target warehouse location `warehouse_stock`, and recalculate `products.stock_quantity = sum(warehouse_stock.quantity)`.

### R2.3 Manual Inventory Movements lack Ledger (Journal Entries) Synchronization
*   **Target Files**: `src/components/inventory/StockTransactionDialog.tsx`, `src/lib/erpEventBus.ts`
*   **Current State**: Custom manual adjustments (Stock In/Out) update physical quantities, but fail to trigger accounting journal entries.
*   **Data Integrity & Audit Risk**: Physical assets value drifts from ledger balances, violating accounting alignment (Asset account 156 vs Expense account 632).
*   **Recommendation**:
    Publish a `STOCK_TRANSACTION_RECORDED` event on manual adjustment. Bind a subscriber to generate ledger lines:
    *   **Stock In**: Debit 156 (Inventory) / Credit 4111 (Equity) or 642 (Other Gains).
    *   **Stock Out**: Debit 632 (COGS) / Credit 156 (Inventory).

### R2.4 Timezone Offset Shift in Bank Transactions (GMT+7 to UTC)
*   **Target File**: Casso Webhook / Ingestion parser
*   **Current State**: Casso sends Vietnam time strings (GMT+7, e.g. `2026-06-22 14:10:02`). Postgres database interprets this as UTC, causing a 7-hour forward date distortion.
*   **Data Integrity & Audit Risk**: Transactions recorded on the next day in the system compared to actual bank statements, distorting daily cash flow metrics.
*   **Recommendation**:
    Ensure the ingestion parser appends the local timezone offset (`+07:00`) to the raw casso timestamp string before database insertion.

### R2.5 Missing Project Health Configuration Change History in `audit_logs`
*   **Target File**: `src/pages/Reports.tsx` (lines 216-232)
*   **Current State**: Changes to project health configurations are saved directly to `shop_settings` without calling `logAction` to write to `audit_logs`.
*   **Data Integrity & Audit Risk**: No history trace of health setting changes, making budget/progress status revisions untraceable.
*   **Recommendation**:
    Import and invoke `logAction` inside `handleSaveProjectHealth` to record old vs new project health parameters.

### R2.6 Double-Entry Ledger Mismatch (Debits vs Credits Balance)
*   **Target File**: `src/hooks/useAccounting.ts`
*   **Current State**: There is no assertion check at the database constraint or model level enforcing Debits === Credits before saving manual journal lines.
*   **Data Integrity & Audit Risk**: Disconnected ledger entries, causing a corrupted Trial Balance.
*   **Recommendation**:
    Enforce validation on journal entry save mutations:
    ```typescript
    const totalDebits = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredits = lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebits - totalCredits) > 1) {
      throw new Error("Lỗi: Tổng phát sinh Nợ phải bằng tổng phát sinh Có.");
    }
    ```

### R2.7 Drift between Order Item Total and Qty * Unit Price
*   **Target Files**: `src/hooks/useOrders.ts`, `src/lib/validation.ts`
*   **Current State**: The order item's `total` value is calculated client-side and saved. There is no verification comparing it against `quantity * unit_price`.
*   **Data Integrity & Audit Risk**: Subtotal calculation errors due to client-side rounding drifts.
*   **Recommendation**:
    Force calculation validation:
    ```typescript
    const expected = round(item.quantity * item.unit_price);
    if (Math.abs(item.total - expected) > 1) {
      item.total = expected; // Force alignment
    }
    ```

### R2.8 Discrepancy between Order Subtotal and Sum of Order Items
*   **Target File**: `src/hooks/useOrders.ts`
*   **Current State**: Subtotals can drift from the actual sum of items if discounts/adjustments are calculated, as the subtotal field is stored independently.
*   **Data Integrity & Audit Risk**: Financial discrepancy in invoices where individual lines do not add up to the invoice subtotal.
*   **Recommendation**:
    Recalculate order subtotal as `sum(items.total)` inside the write mutations before database commits.

### R2.9 Drift between Order Total and Formula (`subtotal - discount + shipping_fee`)
*   **Target File**: `src/hooks/useOrders.ts`
*   **Current State**: The final total on an order is stored independently of subtotal, discount, and shipping fee, introducing rounding/drift risks.
*   **Data Integrity & Audit Risk**: Financial audits flags, revenue reports mismatches.
*   **Recommendation**:
    Enforce total calculation inside order mutations:
    ```typescript
    order.total = (order.subtotal || 0) - (order.discount || 0) + (order.shipping_fee || 0);
    ```

### R2.10 Discrepancy between Order `paid_amount` and Sum of Payment Transactions
*   **Target File**: `src/hooks/usePaymentTransactions.ts`
*   **Current State**: If a payment transaction is deleted or voided, the associated order's `paid_amount` is not decremented, leaving the order state incorrect.
*   **Data Integrity & Audit Risk**: Customer invoices show as fully paid even after payments have been refunded or voided.
*   **Recommendation**:
    Add triggers inside delete/void payment transaction hooks to sum all remaining active payments and update `orders.paid_amount`.

---

## Part 3. Verification Strategy

To verify the resolution of these 20 issues, we recommend introducing integration tests within `src/lib/__tests__/erpBusinessRefinement.test.ts` or similar:
1.  **Test Case 1**: Add a payment of 5M VNĐ to a 10M VNĐ order and assert order payment status shifts from `unpaid` to `partially_paid`.
2.  **Test Case 2**: Try to delete Product A (used in BOM of Product B) and assert it throws a custom restriction warning.
3.  **Test Case 3**: Assert that adding a cycle (A -> B -> A) in BOM triggers a cycle warning.
4.  **Test Case 4**: Assert that creating a project expense voucher exceeding budget fails.
5.  **Test Case 5**: Confirm that updating raw material costs automatically updates finished goods costs.

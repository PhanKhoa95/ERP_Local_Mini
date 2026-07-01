# Handoff Report: Stress Testing and Robustness Analysis of Report Hooks

## 1. Observation
We examined the report hook implementation in `src/hooks/useReportStats.ts` and the test suites `src/hooks/__tests__/useReportStats.test.tsx` and `src/hooks/__tests__/useReportStats.challenge.test.tsx`.

We identified several critical logical bugs, scaling issues, and database-mapping mismatches between the Local Demo mode and Production Supabase mode. Specifically, we observed:

1. **Double Counting of Customer Payments (`usePartnerReport`)**:
   ```typescript
   // line 454
   customerStats[partner.id].paidAmount += order.paid_amount || 0;
   ...
   // line 471
   customerStats[partner.id].paidAmount += payment.amount || 0;
   ```
   If a payment transaction is linked to an order, the payment amount is recorded in the order's `paid_amount` and also exists as a `payment_transaction`. Both values are added to the customer's aggregate `paidAmount` during calculations.

2. **Supabase Production Mismatch (`useInventoryReport`)**:
   In Local Demo Mode:
   ```typescript
   // lines 227-238
   transactions = transactionsList
     .filter((tx: any) => productMap.has(tx.product_id))
     .map((tx: any) => {
       const product = productMap.get(tx.product_id);
       return {
         ...tx,
         products: product ? { name: product.name, sku: product.sku, company_id: product.company_id } : undefined,
       };
     });
   ```
   In Supabase Mode (Production):
   ```typescript
   // lines 251-255
   const { data: txData, error: txError } = await supabase
     .from("inventory_transactions")
     .select("*")
     .order("created_at", { ascending: false })
     .limit(100);
   ```
   No `.select("*, products(...)")` join is performed in Supabase mode, causing the `products` object to be `undefined` on recent transactions in production, which will cause the UI to crash or fail to display product info.

3. **Supplier Purchase Stats Always Zero (`usePartnerReport`)**:
   ```typescript
   // line 437
   orders.forEach((order) => {
     if (!order.partner_id || !order.partners) return;
     const partner = order.partners;
     if (partner.partner_type === "customer" || partner.partner_type === "both") {
       ...
     }
   });
   ```
   Orders are never processed for supplier partners (`partner_type === "supplier"`), causing `supplierStats.purchaseAmount` and `supplierStats.orderCount` to always remain `0`.

4. **RangeError on Malformed Date Formats (`useRevenueReport`)**:
   ```typescript
   // line 68
   const dateDate = order.order_date || order.created_at;
   const date = format(new Date(dateDate), "dd/MM");
   ```
   An invalid/malformed date value causes `new Date` to return `Invalid Date`, which throws a `RangeError: Invalid time value` in date-fns `format()`, breaking the entire hook.

5. **Negative Stock Counts (`useInventoryReport`)**:
   ```typescript
   // line 264
   const outOfStock = products.filter((p) => (p.stock_quantity || 0) === 0);
   ```
   If a product has a negative stock quantity (e.g., `-3`), it is not counted in the `outOfStockCount` because the check strictly asserts `=== 0`.

We added `Fault 8: Double-counting of customer payments` in `src/hooks/__tests__/useReportStats.challenge.test.tsx` and ran the tests. The test command ran successfully:
```powershell
npx vitest run src/hooks/__tests__/useReportStats.challenge.test.tsx
```
Output:
```text
✓ src/hooks/__tests__/useReportStats.challenge.test.tsx (10 tests) 791ms
Test Files  1 passed (1)
Tests  10 passed (10)
```

---

## 2. Logic Chain
1. **Double Counting**:
   - Every time a payment transaction is recorded, the mutation in `usePaymentTransactions` updates `orders.paid_amount`.
   - In `usePartnerReport`, `customerStats.paidAmount` aggregates `order.paid_amount` from all matching orders, and also aggregates `payment.amount` from all matching payments.
   - If both the order and payment transaction fall within the query's date range, the payment is added twice, resulting in a lower (or negative) calculated debt. This was verified empirically via the new test case `Fault 8` which passed with `custData.paidAmount = 1600` instead of `800`.
2. **Missing Products Join**:
   - In `useInventoryReport`, the Supabase query selects from `inventory_transactions` without joining the `products` table.
   - When the app is in production mode, the transactions list returned by `useInventoryReport` has no `.products` nested object.
   - If the UI references `tx.products?.name`, it will evaluate to undefined, or crash if it accesses `.name` on an un-guarded object.
3. **Supplier Purchase Stats**:
   - Supplier orders are skipped in `usePartnerReport` because the order aggregation block only handles `customer` or `both` partner types.
   - Consequently, `purchaseAmount` and `orderCount` are never accumulated for suppliers, making supplier dashboard metrics useless.
4. **RangeError on Dates**:
   - `useRevenueReport` parses strings alphabetically for filtering (`orderDate >= startStr`), which allows malformed date strings (like `"2026-06-15-invalid"`) to pass.
   - However, when the hook attempts to format them client-side using `format(new Date(dateDate), "dd/MM")`, it fails with a RangeError.
5. **Negative Stock**:
   - `outOfStock` strictly checks `=== 0`.
   - A negative quantity (e.g. `-5`) is logically out-of-stock, but it fails the `=== 0` check, so it is omitted from `outOfStockCount` and `outOfStockProducts`.

---

## 3. Caveats
- Real Supabase API calls were mocked in the test environment. Real database execution patterns may exhibit different latency behaviors, but the JavaScript logic discrepancies remain present.
- Client-side performance constraints were analyzed theoretically based on the `reduce` loops. We did not run profile timelines on the UI thread, but synchronous `.reduce` over large datasets is known to cause layout jank.

---

## 4. Conclusion
The current report hooks possess multiple logic bugs and design inconsistencies:
1. **Double-counting** payments falsely reduces customer debt (sometimes to negative values).
2. **Inconsistent joins** between local demo and production mode will lead to runtime failures in production.
3. **Incomplete aggregations** leave supplier statistics blank.
4. **Poor input validation** allows malformed dates to crash hooks with RangeErrors.
5. **Strict equal checks** skip negative stock quantities.
6. **Lack of server-side aggregation** makes the hooks scale poorly.

To fix these issues:
- Deduplicate payment contributions in `usePartnerReport`.
- Align database queries by joining `products(name, sku, company_id)` in the Supabase query within `useInventoryReport`.
- Process supplier orders in the order loop.
- Validate date fields before formatting.
- Check `p.stock_quantity <= 0` for out-of-stock items.
- Move calculation logic to SQL Views or RPCs to prevent client-side performance degradation.

---

## 5. Verification Method
To verify the standard and challenge tests run successfully:
1. Run standard tests:
   ```bash
   npx vitest run src/hooks/__tests__/useReportStats.test.tsx
   ```
2. Run challenge tests (which contains our verification test cases for all 8 faults):
   ```bash
   npx vitest run src/hooks/__tests__/useReportStats.challenge.test.tsx
   ```
3. Run all tests in the hooks directory to ensure clean execution:
   ```bash
   npx vitest run src/hooks/__tests__/
   ```

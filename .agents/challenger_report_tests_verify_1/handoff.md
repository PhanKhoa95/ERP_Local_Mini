# Handoff Report: Report Hooks Calculation Logic Robustness Challenge

## 1. Observation

During my investigation of the report hook logic (`src/hooks/useReportStats.ts`) and existing test suite (`src/hooks/__tests__/useReportStats.test.tsx`), I executed baseline tests:
- Command: `npx vitest run src/hooks/__tests__/useReportStats.test.tsx`
- Result:
  ```
  RUN  v3.2.6 Y:/ERP_Local_Mini
  ✓ src/hooks/__tests__/useReportStats.test.tsx (8 tests) 1114ms
  Test Files  1 passed (1)
  Tests  8 passed (8)
  ```

I created a custom challenge test suite:
- Command: `npx vitest run src/hooks/__tests__/useReportStats.challenge.test.tsx`
- Result:
  ```
  RUN  v3.2.6 Y:/ERP_Local_Mini
  ✓ src/hooks/__tests__/useReportStats.challenge.test.tsx (9 tests) 709ms
  Test Files  1 passed (1)
  Tests  9 passed (9)
  ```

Through code examination and empirical test failures/passes, I directly observed the following issues and gaps:

### A. Unhandled Date Crash
In `useRevenueReport` (lines 68-69):
```typescript
        const dateDate = order.order_date || order.created_at;
        const date = format(new Date(dateDate), "dd/MM");
```
When `orderDate` passes alphabetical checks (e.g. `"2026-06-15-invalid"`) but cannot be parsed by `new Date`, `format` throws a `RangeError: Invalid time value` which crashes the hook. 

### B. Missing Field Silent Errors (COGS and Profit)
In `useRevenueReport` (lines 57-61):
```typescript
      const totalCOGS = orders.reduce((sum, o) => {
        return sum + (o.order_items?.reduce((itemSum: number, item: any) => {
          return itemSum + ((item.products?.cost_price || 0) * item.quantity);
        }, 0) || 0);
      }, 0);
```
If `item.quantity` is undefined/null, the expression inside the inner reduce results in `NaN`. However, because of the logical OR `|| 0` coalescing at the outer level, the hook silently coerces the result to `0`, reporting correct execution but producing wrong mathematical outputs (COGS is suppressed to 0, artificially inflating profit metrics).

### C. NaN Propagation in Product Stats
In `useProductReport` (lines 185-191):
```typescript
        productStats[productId].quantity += item.quantity || 0;
        const itemTotal = item.total ?? ((item.quantity || 0) * (item.unit_price || 0) - (item.discount || 0));
        productStats[productId].revenue += itemTotal;
        const itemCost = (item.products?.cost_price || 0) * (item.quantity || 0);
        productStats[productId].cost += itemCost;
        productStats[productId].profit += itemTotal - itemCost;
```
If `item.quantity` is a non-numeric string (e.g. `"invalid"`), `"invalid" * 100` evaluates to `NaN`. This `NaN` is directly accumulated into revenue and profit metrics without nullish/NaN coalescing, propagating `NaN` to the UI.

### D. Negative Stock Excluded from Out-of-Stock Products
In `useInventoryReport` (lines 263-264):
```typescript
      const lowStock = products.filter((p) => (p.stock_quantity || 0) <= (p.min_stock || 0));
      const outOfStock = products.filter((p) => (p.stock_quantity || 0) === 0);
```
Products with `stock_quantity: -5` are correctly filtered as `lowStock` (`-5 <= 2`), but are excluded from `outOfStock` (strictly `=== 0`), meaning a deficit stock level is ignored by the out-of-stock count.

### E. Supabase Production Branch / Local Demo Mismatch
In `useInventoryReport` (lines 243-258), the Supabase database branch does:
```typescript
        const { data: txData, error: txError } = await supabase
          .from("inventory_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
```
Whereas the Local Demo Auth branch manually links products (lines 228-239):
```typescript
            return {
              ...tx,
              products: product
                ? {
                    name: product.name,
                    sku: product.sku,
                    company_id: product.company_id,
                  }
                : undefined,
            };
```
As a result, in production (Supabase mode), transaction objects in `recentTransactions` do not have the nested `products` object. Any component attempting to read `tx.products.name` will throw `TypeError: Cannot read properties of undefined` and crash in production.

### F. Supplier Stats Kept at 0
In `usePartnerReport` (lines 437-457), the hook only loops and populates `customerStats` for partners whose type is `customer` or `both`. The loop to accumulate orders completely ignores `supplier` partner types, resulting in `orderCount` and `purchaseAmount` remaining `0` forever on suppliers regardless of actual purchase orders.

### G. Case Sensitivity in Transaction Types
In `usePartnerReport` (lines 466-470):
```typescript
            if (
              payment.transaction_type === "receipt" ||
              payment.transaction_type === "payment_in" ||
              payment.transaction_type === "receivable"
            )
```
Mismatched cases like `"Receipt"` or `"PAYMENT"` fail the strict comparison and are silently ignored, causing missing transactions and wrong customer/supplier debt calculations.

---

## 2. Logic Chain

1. **Premise**: In JS, string comparisons allow invalid dates (e.g. `"2026-06-15-invalid"`) to pass through simple filters (e.g. `orderDate <= endStr`).
2. **Step**: When parsing such invalid dates inside `new Date(...)` and running `format(...)`, the date-fns library throws `RangeError`.
3. **Conclusion A**: Unhandled Date Crash is possible when malformed date strings enter the database.

4. **Premise**: In JS, `NaN || 0` evaluates to `0`.
5. **Step**: An order item with `quantity = undefined` evaluates to `NaN` during cost multiplication. 
6. **Conclusion B**: The hook silences this error by coalescing `NaN` to `0`, causing incorrect calculations where costs are treated as 0 and profits are inflated.

7. **Premise**: If mathematical operations include strings, they can result in `NaN` (e.g. `"invalid" * 100`).
8. **Step**: The hook performs `productStats[productId].revenue += itemTotal` without check.
9. **Conclusion C**: Revenue and profit metrics return `NaN` when quantity is non-numeric.

10. **Premise**: Out of stock logic is hardcoded as `(p.stock_quantity || 0) === 0`.
11. **Step**: If a product has stock quantity `-1`, it does not satisfy `=== 0`.
12. **Conclusion D**: Products with negative stock are not counted in out-of-stock statistics.

13. **Premise**: Supabase query uses `.select("*")` on `inventory_transactions`.
14. **Step**: There is no join on `products` table in the database query.
15. **Conclusion E**: The `products` object is undefined on transactions in production mode, leading to UI crash vulnerabilities.

16. **Premise**: In `usePartnerReport`, `orders.forEach` checks `partner.partner_type === "customer" || partner.partner_type === "both"`.
17. **Step**: If the partner is a `supplier`, the order is skipped.
18. **Conclusion F**: Supplier order counts and purchase amounts are never populated and always stay `0`.

19. **Premise**: Comparisons are done using strict string equality `=== "receipt"`.
20. **Step**: Payments with type `"Receipt"` are skipped.
21. **Conclusion G**: Uppercase or mismatched transaction types are ignored, corrupting debt calculations.

---

## 3. Caveats

- We assumed that the local storage demo matches the schema and type conventions of the production Supabase database. However, this is exactly what exposed the mismatch in recent transaction fields.
- Large scale memory and thread-blocking behaviors were assessed theoretically. We have not run automated load tests with >10,000 items in a real browser rendering context, but JavaScript's single-threaded nature guarantees lag when parsing thousands of dates inside map/reduce loops synchronously.

---

## 4. Conclusion

The report hook calculation logic has several critical gaps and vulnerabilities under fault conditions (invalid date crash, NaN propagation, silent wrong calculations, negative stock omission, schema mismatches, empty supplier stats, and case-sensitive payment types). The standard test suite did not capture these gaps because it only tested happy-path/mock data matching expectations.

**Actionable Recommendations (to Orchesrator/Implementer)**:
1. Wrap formatting dates in try-catch blocks or use validation helpers to ignore or format malformed dates safely.
2. Replace `|| 0` coalescing blocks that hide `NaN` calculations with explicit `isNaN` validation to alert users or log errors.
3. Update database query inside `useInventoryReport` to join the products table: `.select("*, products:products(name, sku, company_id)")` to align Supabase branch with the demo auth branch.
4. Modify `outOfStock` filter check in `useInventoryReport` to `(p.stock_quantity || 0) <= 0`.
5. Add processing loop for suppliers in `usePartnerReport` or map order totals to `supplierStats` when `partner_type === 'supplier' || partner_type === 'both'`.
6. Coerce transaction types to lowercase before checking (e.g. `payment.transaction_type?.toLowerCase() === "receipt"`).
7. Keep `useReportStats.challenge.test.tsx` in the repository as part of the test suite.

---

## 5. Verification Method

- Run the test suite: `npx vitest run src/hooks/__tests__/useReportStats.challenge.test.tsx`
- To invalidate these findings:
  1. Fix the hooks in `src/hooks/useReportStats.ts`.
  2. The challenge test cases (e.g. Fault 5 - missing `products` in Supabase branch, or Fault 6 - supplier orderCount being `0`) should change/fail when the code gets fixed.

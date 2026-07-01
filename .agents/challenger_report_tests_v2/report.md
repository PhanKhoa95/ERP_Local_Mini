# Report — useReportStats Tests Verification & Robustness Analysis

## Challenge Summary

**Overall risk assessment**: HIGH

While the tests in `src/hooks/__tests__/useReportStats.test.tsx` and the newly added `useReportStats.challenge.test.tsx` pass successfully (8 and 10 tests respectively), our adversarial review and empirical testing reveal major code coverage gaps in the original test suite and several silent calculation/logic issues in the hook implementation.

---

## Key Findings & Code Path Gaps

### 1. Test Coverage Gap: Supabase Production Branch is Never Tested
- **Observation**: In `src/hooks/__tests__/useReportStats.test.tsx`, the function `isLocalDemoAuthEnabled` is mocked to always return `true` (lines 14-18).
- **Issue**: The supabase query paths (production branch) for all five hooks (`useRevenueReport`, `useProductReport`, `useInventoryReport`, `useOrderReport`, and `usePartnerReport`) are completely untested by the original test suite.
- **Impact**: Code drift or schema mismatch in production query structures is never caught during test execution.

### 2. API Mismatch on Transactions (Fault 5)
- **Observation**: In `useInventoryReport` (lines 242-259), the Supabase branch fetches transactions via:
  ```typescript
  const { data: txData, error: txError } = await supabase
    .from("inventory_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  ```
  While the demo branch maps products data dynamically:
  ```typescript
  transactions = transactionsList
    .filter((tx: any) => productMap.has(tx.product_id))
    .map((tx: any) => ({
      ...tx,
      products: product ? { name: product.name, sku: product.sku, ... } : undefined
    }));
  ```
- **Issue**: The database query lacks a join or post-processing to append `products` details onto transactions in the production path.
- **Impact**: Any UI element attempting to render `tx.products.name` or `tx.products.sku` will display blank space or throw a `TypeError` in production.

---

## Detailed Logic Challenges

### [High] Challenge 1: Silent COGS Suppression (Fault 3)
- **Assumption challenged**: Order items are always fully populated with correct numeric quantities.
- **Attack scenario**: An order item has an undefined `quantity`.
- **Blast radius**: The inner reduce in `useRevenueReport` evaluates `(cost_price * undefined)` to `NaN`. Because of `o.order_items?.reduce(...) || 0`, the falsy value `NaN` is coalesced to `0`. Consequently, COGS is silently reported as `0` for the entire order items array, which artificially inflates gross profit and profit margin calculations in the reports.
- **Mitigation**: Filter out invalid quantities or coerce them to 0 per item rather than letting `NaN` propagate to the whole array reducer level.

### [High] Challenge 2: Double-Counting Customer Payments (Fault 8)
- **Assumption challenged**: `order.paid_amount` and `payment_transactions` represent separate and independent monetary flows.
- **Attack scenario**: A user records an order with a `paid_amount` of `800`, and the payment gateway writes a matching payment transaction of type `payment_in` for the same `800`.
- **Blast radius**: In `usePartnerReport`, `customerStats.paidAmount` aggregates both `order.paid_amount` and the payment transaction amount. This results in the customer being credited with `1600` in payments, yielding incorrect debt calculations (in this case, negative debt).
- **Mitigation**: Differentiate order-level payments from independent account-level payment transactions to prevent double counting, or link them via `order_id` and exclude duplicates.

### [Medium] Challenge 3: Case Sensitivity in Transaction Types (Fault 7)
- **Assumption challenged**: Transaction types are always inserted in strict lowercase format.
- **Attack scenario**: A payment has transaction_type `"Receipt"` (capital R).
- **Blast radius**: The strict equality check `payment.transaction_type === "receipt"` fails. The transaction is silently ignored, producing inaccurate total paid amounts and customer debt calculations.
- **Mitigation**: Convert the type to lowercase: `payment.transaction_type?.toLowerCase() === "receipt"`.

### [Medium] Challenge 4: Negative Stock Excluded from Out of Stock (Fault 4)
- **Assumption challenged**: Stock levels never drop below zero.
- **Attack scenario**: High sales volume or database sync lag results in a product stock quantity of `-5`.
- **Blast radius**: In `useInventoryReport`, the out of stock filter is strictly `p.stock_quantity === 0`. The negative stock product is classified as low stock, but not counted in `outOfStockCount` or `outOfStockProducts`, presenting an incorrect picture of stock depletion.
- **Mitigation**: Update filter to `p.stock_quantity <= 0`.

### [Low] Challenge 5: RangeError on Malformed Date Strings (Fault 2)
- **Assumption challenged**: All orders have a valid date string format.
- **Attack scenario**: An order has a date format that passes alphabetical boundary checks but fails JS Date parsing (e.g. `"2026-06-15-invalid"`).
- **Blast radius**: `format(new Date(orderDate), "dd/MM")` throws a `RangeError: Invalid time value`, crashing the entire query function.
- **Mitigation**: Catch parsing errors, or filter out orders with invalid date structures before running date-fns formatting.

---

## Stress Test Results

- **Empty Database State** → `totalRevenue: 0`, `totalStock: 0`, empty arrays, no division by zero or NaN propagation. → **PASS**
- **High Volume Slicing** → 150 transactions successfully sliced to 100 in `recentTransactions`; top-performing lists sliced to 10. → **PASS**
- **Boundary Conditions** → Inclusive start/end boundaries, exclusive early/late dates. → **PASS**
- **Supabase Production Mismatch (Fault 5)** → Verifies that `tx.products` is `undefined` under Supabase branch. → **PASS**

---

## Unchallenged Areas

- Supabase network level error handling: Mocked at the query interface level. Real Supabase connection timeouts or rate limiting behavior are out of scope.

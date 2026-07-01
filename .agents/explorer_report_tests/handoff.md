# Handoff Report — Report Tests Explorer

## 1. Observation

Direct observations from the target file `src/hooks/useReportStats.ts`:
- **Line 17-21**: Check for local demo auth and read orders/channels from `localStorage`:
  ```typescript
  if (isLocalDemoAuthEnabled()) {
    const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
    const allOrders = rawOrders ? JSON.parse(rawOrders) : [];
    const rawChannels = localStorage.getItem("erp-mini-local-demo-sales-channels");
    const channels = rawChannels ? JSON.parse(rawChannels) : [];
  ```
- **Lines 57-61**: Calculation of `totalCOGS` in `useRevenueReport`:
  ```typescript
  const totalCOGS = orders.reduce((sum, o) => {
    return sum + (o.order_items?.reduce((itemSum: number, item: any) => {
      return itemSum + ((item.products?.cost_price || 0) * item.quantity);
    }, 0) || 0);
  }, 0);
  ```
- **Lines 160-198**: Aggregation by product in `useProductReport` only processes items retrieved from orders that fit the filtered list:
  ```typescript
  orderItems.forEach((item) => {
    const productId = item.product_id;
    if (!productId) return;
    if (!productStats[productId]) {
      productStats[productId] = { ... };
    }
    // ...
  });
  ```
- **Lines 504-518**: Overwriting supplier debt directly from the partner metadata in `usePartnerReport`:
  ```typescript
  partners.forEach((partner) => {
    if (partner.partner_type === "supplier" || partner.partner_type === "both") {
      if (!supplierStats[partner.id]) {
        supplierStats[partner.id] = {
          // ...
          debt: Number(partner.debt_amount) || 0,
        };
      } else {
        supplierStats[partner.id].debt = Number(partner.debt_amount) || 0;
      }
    }
  });
  ```

---

## 2. Logic Chain

1. **LocalStorage Dependency**: Each report hook splits its query logic based on `isLocalDemoAuthEnabled()`. When `true`, it bypasses Supabase queries and performs synchronous filtering, mapping, and calculations using data parsed from `localStorage`.
2. **Schema Integrity**:
   - `useRevenueReport` and `useProductReport` inspect nested `order_items` and nested `products` objects inside each order.
   - `useInventoryReport` inspects product records and inventory transactions.
   - `useOrderReport` processes status occurrences and rates.
   - `usePartnerReport` maps orders and payments to partners.
3. **Supplier Debt Quirk**: Although `usePartnerReport` parses payment histories for both customers and suppliers, it overrides the supplier's accumulated debt using the static value from `partner.debt_amount`.
4. **Slow Moving Quirk**: The slow-moving list only considers products that have been sold at least once during the specified date range. Unsold products are omitted from the metrics.
5. **Testing Architecture**:
   - By mocking `isLocalDemoAuthEnabled` to return `true`, we force the hooks to use the local storage path.
   - Setting up a temporary `QueryClient` inside a React custom provider wrapper allows `renderHook` to resolve asynchronous query promises.
   - Clearing `localStorage` in `beforeEach` and `afterEach` guarantees isolation between tests.

---

## 3. Caveats

- **Network Mode**: The investigation was conducted in CODE_ONLY mode, and test files were not executed or written to the source code tree (adhering strictly to the read-only constraint).
- **Timezone Offsets**: Dates are processed as ISO strings. The comparison `orderDate >= startStr` is lexicographical, which could lead to edge-case failures if mock timestamps are written without consistent timezone specs (e.g. mix of UTC and local time offsets).

---

## 4. Conclusion

The report statistics hooks in `src/hooks/useReportStats.ts` are fully mockable in local demo mode. To implement tests:
1. Wrap them using a fresh `QueryClient` on each run.
2. Mock `@/lib/localDemoAuth` to override `isLocalDemoAuthEnabled` to return `true`.
3. Pre-seed the six specific `localStorage` keys before running hook render steps.
4. Execute assertions using `@testing-library/react`'s `waitFor` to handle the asynchronous query resolution cycle.

---

## 5. Verification Method

To verify these findings and strategy:
1. View the detailed schemas and Vitest sample wrappers in the analysis file: `y:\ERP_Local_Mini\.agents\explorer_report_tests\analysis.md`.
2. Verify the project's test suite execution status by running:
   ```powershell
   npm run test
   ```
3. A future implementation agent can construct a test suite in `src/hooks/__tests__/useReportStats.test.tsx` using the configurations detailed in `analysis.md`.

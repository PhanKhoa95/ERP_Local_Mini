# Challenger Handoff Report

## 1. Observation
All requested build and test commands were executed and passed successfully.

### Build and Test Commands & Output
- **Build Command**: `cmd /c npm run build`
  - *Result*: Succeeded in `1m 5s` producing production-ready assets in `dist/`.
- **Vitest Unit Tests**: `cmd /c npx vitest run src/hooks/__tests__/useLoyalty.test.ts src/hooks/__tests__/useWholesaleSettings.test.ts src/hooks/__tests__/usePlatformSync.test.ts`
  - *Result*: All 3 test files and 25 test cases passed:
    ```
    ✓ src/hooks/__tests__/usePlatformSync.test.ts (7 tests)
    ✓ src/hooks/__tests__/useWholesaleSettings.test.ts (8 tests)
    ✓ src/hooks/__tests__/useLoyalty.test.ts (10 tests)
    Test Files  3 passed (3)
    Tests  25 passed (25)
    ```
- **Playwright E2E Tests**: `cmd /c npx playwright test tests/e2e/wholesale_pricing.spec.ts tests/e2e/composite_stock.spec.ts`
  - *Result*: All 3 E2E test cases passed:
    ```
    ok 1 [chromium] › tests\e2e\composite_stock.spec.ts:118:3 › Composite (Combo) Stock Deduction E2E Tests › should calculate composite stock...
    ok 2 [chromium] › tests\e2e\wholesale_pricing.spec.ts:74:3 › Wholesale Pricing & Stacking Exclusion E2E Tests › should apply tiered wholesale pricing...
    ok 3 [chromium] › tests\e2e\wholesale_pricing.spec.ts:125:3 › Wholesale Pricing & Stacking Exclusion E2E Tests › should clear manual discounts/vouchers...
    3 passed (26.1s)
    ```

### Code Audit Observations

#### Observation A: Double COGS & Stock Entry Posting
In `src/lib/erpEventBus.ts`, the `ORDER_CREATED` event triggers two separate subscribers in sequential order:
- Subscriber 1: `InventoryHandler` (lines 201-311):
  ```typescript
  // 1. Inventory Handler
  erpEventBus.subscribe("ORDER_CREATED", (payload) => {
    ...
    for (const item of orderItems) {
      ...
      createLocalInventoryTransaction({ ... });
    }
  }, "InventoryHandler");
  ```
  Calling `createLocalInventoryTransaction` in `src/lib/localInventoryStore.ts` (lines 911-914) automatically publishes a nested `STOCK_TRANSACTION_RECORDED` event:
  ```typescript
  // Publish STOCK_TRANSACTION_RECORDED event for accounting integration
  if (typeof window !== "undefined" && (window as any).erpEventBus) {
    (window as any).erpEventBus.publish("STOCK_TRANSACTION_RECORDED", { transaction, product });
  }
  ```
  This triggers `StockAccountingHandler` (lines 768-851), which generates an inventory/COGS entry:
  ```typescript
  const stockLines = [
    { account_id: drAccId /* acc-632 */, debit: txAmount },
    { account_id: crAccId /* acc-156 */, credit: txAmount }
  ];
  ```
  - Subscriber 2: `AccountingHandler` (lines 343-483) also handles `ORDER_CREATED` and explicitly posts a second COGS journal entry:
  ```typescript
  // COGS Entry — BOM-based calculation
  const costAmount = calculateOrderCOGS(order);
  if (costAmount > 0) {
    ...
    const cogsLines = [
      { account_id: "acc-632", debit: costAmount },
      { account_id: "acc-156", credit: costAmount }
    ];
    ...
  }
  ```

#### Observation B: Partial Rollback Accounting Inconsistency
In `src/lib/erpEventBus.ts` inside `InventoryHandler` (lines 207-212 and 294-310):
```typescript
    // Backup current state for database consistency transaction rollback
    const backupProducts = localStorage.getItem("erp-mini-local-demo-products");
    const backupVariants = localStorage.getItem("erp-mini-local-demo-product-variants");
    const backupTransactions = localStorage.getItem("erp-mini-local-demo-inventory-transactions");
    const backupAuditLogs = localStorage.getItem("erp-mini-local-demo-audit-logs");
```
If an error occurs mid-loop (e.g., the 3rd out of 5 items is out of stock):
```typescript
    } catch (err: any) {
      // Rollback to maintain database consistency
      if (backupProducts !== null) localStorage.setItem("erp-mini-local-demo-products", backupProducts);
      ...
```
However, the accounting tables (`erp-mini-local-demo-accounts`, `erp-mini-local-demo-journal-entries`, `erp-mini-local-demo-journal-lines`) modified by `StockAccountingHandler` during the successful preceding items (items 1 and 2) are **not backed up or rolled back**.

#### Observation C: POS Checkout Prepaid Wallet Transaction Failure Risk
In `src/pages/POS.tsx` inside `handleCheckout` (lines 1035-1080):
```typescript
      // Deduct balance from membership card prepaid wallet
      if (method === "membership_wallet" && customerMembership) {
        await performTransaction.mutateAsync({
          membershipId: customerMembership.id,
          type: "payment",
          amount: total,
          description: `Thanh toán mua hàng đơn POS: ${orderNumber}`,
        });
      }

      await createOrder.mutateAsync({ ... });
```
In the event that `performTransaction.mutateAsync` succeeds, but `createOrder.mutateAsync` throws an exception (e.g., database connection timeout, stock allocation failure, etc.), the customer's prepaid balance is deducted, but the order is never created. The catch block only logs the error:
```typescript
    } catch (error) {
      console.error("Checkout error:", error);
    }
```

#### Observation D: Infinite React Render Loop on Stacking Exclusions
In `src/pages/POS.tsx`, two separate `useEffect` hooks operate on the same state variables (`discount` and `appliedVoucherId`):
- Hook A (auto-apply promotion check, lines 880-957):
  Reads `cart` and `subtotal`, checks eligible vouchers, and calls `setDiscount(bestDiscount)` and `setAppliedVoucherId(bestPromoId)`.
- Hook B (wholesale stacking exclusion check, lines 690-703):
  ```typescript
  useEffect(() => {
    if (!wholesaleSettings) return;
    const hasWholesaleApplied = cart.some(item => item.is_wholesale);
    if (wholesaleSettings.no_other_discounts && hasWholesaleApplied) {
      if (discount > 0 || appliedVoucherId) {
        setDiscount(0);
        setAppliedVoucherId(null);
        ...
      }
    }
  }, [cart, discount, appliedVoucherId, wholesaleSettings]);
  ```
When a wholesale item is present in the cart, and a promotion qualifies for auto-apply, Hook A sets the discount/voucher. Hook B detects this and resets them to `0` and `null`. This state change triggers Hook A again, creating an infinite loop.

#### Observation E: Playwright E2E Tests Version Fragility
In `tests/e2e/wholesale_pricing.spec.ts` (line 67) and `tests/e2e/composite_stock.spec.ts` (line 111):
```typescript
      localStorage.setItem("erp-mini-local-demo-version", "v9"); // Ensure version matches to prevent auto-reset
```
This is hardcoded to match the version constraint in `src/lib/localDemoAuth.ts` (line 17):
```typescript
    const currentVersion = "v9";
```

---

## 2. Logic Chain
1. **Observation A** shows that B2C orders trigger both `InventoryHandler` (which indirectly publishes `STOCK_TRANSACTION_RECORDED` to trigger `StockAccountingHandler`) and `AccountingHandler`.
2. Both of these handlers post Debit 632 / Credit 156 entries for the same order items.
3. **Therefore**, B2C checkout leads to double posting of COGS and stock reduction in the general ledger accounts, distorting reporting.

4. **Observation B** shows that inventory and variant records are backed up and restored if a checkout fails midway, but accounts and journal entries modified by `StockAccountingHandler` are not.
5. **Therefore**, a partial order failure results in orphaned journal entries and incorrect general ledger balances, corrupting accounting consistency.

6. **Observation C** shows that the membership prepaid wallet balance is deducted *before* order creation in POS.tsx checkout.
7. If order creation fails, there is no compensating logic to refund the deducted amount.
8. **Therefore**, the customer loses balance without an order being created (financial integrity breach).

9. **Observation D** shows that Hook A updates discount state variables based on eligible vouchers, while Hook B resets them to `0` when wholesale is active.
10. Since React re-evaluates both effects on state updates, this creates an active loop that can crash the user's browser/POS terminal.

11. **Observation E** shows E2E tests hardcode the version `"v9"`.
12. If the codebase updates `currentVersion` in `localDemoAuth.ts` to `"v10"` (or higher) to invalidate older sessions, the E2E tests will continue to seed `"v9"`.
13. This mismatch triggers `resetLocalDemoData()` on load, clearing seeded test products and breaking E2E tests.

---

## 3. Caveats
- The accounting entries double-posting issue is restricted to the local demo mode (`isLocalDemoAuthEnabled() === true`). Supabase production SQL schemas and triggers were not audited for similar double-deduction hooks.
- Tested environment is Windows 11 under a single-user Dev environment context. Multi-user concurrent race conditions on localStorage cannot be fully emulated.

---

## 4. Conclusion
While all existing test suites compile and pass successfully, the business logic changes introduce three **Critical** transaction/concurrency bugs and one **High** reliability flaw:
1. **Double COGS/Inventory General Ledger Entries**: General ledger records double-deduct inventory values and double-add COGS.
2. **Accounting Ledger Pollution on Mid-transaction Failure**: Partial transaction failures restore physical stock levels but fail to rollback financial ledger entries.
3. **Un-refunded Customer Prepaid Wallet Balances**: If checkout fails post-payment, prepaid wallet balances are lost permanently.
4. **Infinite POS Interface Freeze / Render Crash**: Wholesale stacking exclusions loop against auto-apply voucher checks, locking the UI.
5. **E2E Version Drift Risk**: Test seeds are tightly coupled to a hardcoded string `v9`.

---

## 5. Verification Method
To verify these issues:
1. **Double COGS Entry**:
   - Run the E2E test `composite_stock.spec.ts`.
   - Once it completes, inspect `localStorage.getItem("erp-mini-local-demo-journal-entries")` in the browser dev tools.
   - Observe that there are two separate COGS entries for the single order.
2. **Partial Transaction Corruption**:
   - In `erpEventBus.ts` inside `InventoryHandler`, temporarily insert `throw new Error("Simulated Fail")` on the second item loop iteration.
   - Run a checkout with multiple items.
   - Check `localStorage` keys for accounting. Observe that ledger entries exist for the first item even though the transaction failed and rolled back physical inventory.
3. **Infinite Render Loop**:
   - Seed a voucher with `is_auto_apply: true`, `discount_type: "percentage"`, `discount_value: 10`.
   - Add a wholesale item (quantity >= 5) to the cart.
   - Load the POS page. The browser will freeze or print a `Maximum update depth exceeded` error in the console.

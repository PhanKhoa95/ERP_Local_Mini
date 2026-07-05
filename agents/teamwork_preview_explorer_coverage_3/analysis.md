# Coverage Gap Analysis — Milestone 1

This report presents the findings of the Coverage Gap Analysis conducted on the Pancake POS & ERP Mini codebase. The focus of this analysis is on three core React hooks (`useLoyalty`, `useWholesaleSettings`, `usePlatformSync`), the POS and Wholesale modules, and the implementation of combo products, stock deductions, and stacked promotions/vouchers.

---

## 1. Analysis of Target Hooks

### 1.1. `useLoyalty.ts` (`src/hooks/useLoyalty.ts`)
*   **Purpose**: Manages loyalty settings, referral settings, and loyalty transaction history. It provides three React Query hooks: `useLoyaltySettings`, `useReferralSettings`, and `useLoyaltyTransactions`.
*   **Logic Branches & Operations**:
    *   **Local Demo vs. Supabase Mode**: Branching on `isLocalDemoAuthEnabled()` to query/mutate either the local storage cache (`localStorage` keys: `erp-mini-loyalty-settings`, `erp-mini-referral-settings`, `erp-mini-loyalty-transactions`) or the real Supabase database (`loyalty_settings`, `referral_settings`, `loyalty_transactions` tables).
    *   **Upsert Logic on Settings Mutations**: When updating loyalty/referral settings in database mode, it queries `maybeSingle()` to check if settings already exist. If yes, it performs an `.update()`; if no, it performs an `.insert()`.
    *   **Transactions & Order Association**: When retrieving transactions, if `partnerId` is absent, it returns `[]`. In local demo mode, it fetches transactions and maps the `order_number` from `erp-mini-local-demo-orders`. In Supabase mode, it performs a join on `orders(order_number)` and maps `order_number` from the relation object.
    *   **Manual Adjustments**: The `adjustPoints` mutation inserts a transaction with type `"manual_adjust"`. In local mode, it also queries, updates, and persists the target partner's `loyalty_points` within the `erp-mini-local-demo-partners` array in `localStorage`.
*   **Current Test Coverage & Gaps**:
    *   *Existing tests*: `src/lib/__tests__/loyaltyAndReferral.test.ts` exists. However, it **only** imports and tests the helper functions `getLocalLoyaltySettings`, `getLocalReferralSettings`, and `getLocalLoyaltyTransactions`.
    *   *Gaps*:
        *   **No hook tests**: The three hooks (`useLoyaltySettings`, `useReferralSettings`, `useLoyaltyTransactions`) and their queries/mutations are completely untested in React components or wrapper-based test environments.
        *   **No Supabase mode tests**: The branching logic, database mutations, and relational joins are 100% untested.
        *   **No upsert validation**: The logic that selects between database insert and update is not verified.

### 1.2. `useWholesaleSettings.ts` (`src/hooks/useWholesaleSettings.ts`)
*   **Purpose**: Manages general wholesale settings configuration and tiered wholesale pricing lists for individual products or variants.
*   **Logic Branches & Operations**:
    *   **useWholesaleSettings Hook**: Returns default settings if no `companyId` is provided. If `companyId` exists, it branches on local demo mode vs. Supabase mode. In database mode, it queries `wholesale_settings`. If no record exists, it inserts a new seeded record.
    *   **useProductWholesalePrices Hook**: Returns `[]` if no `productId` is provided. Filters in `localStorage` by `product_id` and optional `variant_id` (handling `variant_id === null` correctly) under local mode. Under database mode, it performs a conditional query on `product_wholesale_prices`, ordering by `min_quantity` ascending.
    *   **saveWholesalePrices Mutation**: Under local mode, it filters out existing prices from the list and appends new ones. Under database mode, it deletes existing pricing records for the target product/variant combination and then inserts the new pricing array in a single workflow.
*   **Current Test Coverage & Gaps**:
    *   *Existing tests*: There are **no unit tests** at all for `useWholesaleSettings.ts`.
    *   *Gaps*:
        *   **No coverage**: The hook functions and mutations have 0% test coverage.
        *   **Seeding logic untested**: The automatic database seeding of wholesale configurations when a new company is queried is untested.
        *   **Transaction deletion & insert untested**: The "delete-then-insert" logic in `saveWholesalePrices` is not covered by tests, leaving potential room for orphan data bugs if the deletion succeeds but the insertion fails.

### 1.3. `usePlatformSync.ts` (`src/hooks/usePlatformSync.ts`)
*   **Purpose**: Interfaces with the Supabase Edge Function `sync-platform-orders` to synchronize external sales channels (Shopee, Lazada, Pancake POS, etc.), obtain platform authorization URLs, exchange auth codes, and refresh authorization tokens.
*   **Logic Branches & Operations**:
    *   **syncLogs Query**: Returns `[]` if no `companyId`. Fetches from `localStorage` under local mode, or retrieves from the `sync_logs` table (joined with `sales_channels`, limited to 50 records) in Supabase mode.
    *   **Edge Function Mutations**: `syncOrders`, `getAuthUrl`, `exchangeToken`, and `refreshToken` all invoke `supabase.functions.invoke("sync-platform-orders", { body: { ... } })`.
    *   **Invalidation Logic**: `syncOrders` invalidates query keys `orders`, `sync_logs`, `sales_channels`, and `data-hub` on success. `exchangeToken` invalidates `sales_channels` on success.
*   **Current Test Coverage & Gaps**:
    *   *Existing tests*: There are **no unit tests** at all for `usePlatformSync.ts`.
    *   *Gaps*:
        *   **No coverage**: The hook is 100% untested.
        *   **Local mode mutations gap**: There is a potential bug where the mutations (`syncOrders`, `getAuthUrl`, `exchangeToken`, `refreshToken`) do **not** check for `isLocalDemoAuthEnabled()`. They directly attempt to invoke `supabase.functions.invoke`, which will fail at runtime if offline or running in pure demo mode. This needs test verification and correction.
        *   **Invalidation logic untested**: Invalidation of React Query keys on successful mutations is untested.

---

## 2. POS & Wholesale Modules Investigation

### 2.1. Combo Products & Ingredient Stock Deduction
*   **BOM Stock Calculation**: In `POS.tsx`, before adding a product to the cart or checking stock, the system determines the available stock:
    *   If the product has a variant, it calls `calculateCompositeVariantStock(variant, allComponents, allVariants)` in `src/lib/wholesaleControl.ts`.
    *   The utility checks components in the `product_variant_components` table where `parent_variant_id === variant.id`.
    *   If components are present (meaning it is a combo product), the stock is dynamically computed as:
        $$\text{Stock} = \min_{c \in \text{components}} \left\lfloor \frac{\text{child\_variant.stock\_quantity}}{\text{component.quantity}} \right\rfloor$$
    *   This prevents adding more combos than the limiting ingredient variant allows.
*   **Checkout Stock Deduction**:
    *   When the checkout completes in `POS.tsx` via `createOrder.mutateAsync`, stock deduction is handed over to `useOrders.ts` (`deductLocalStock` and `deductSupabaseStock`).
    *   The deduction logic checks if the item being purchased is a service (`is_service === true`). If not, and it contains a `variant_id`, it queries `product_variant_components` to retrieve parent-child links.
    *   If components exist, it **skips deducting the parent variant stock** and instead deducts `order_qty * component_qty` from each child variant and child product stock.
    *   It inserts a log record into `inventory_transactions` with notes `Tieu hao thanh phan Combo - Don <OrderNumber>` and transaction type `"out"`. (In Supabase mode, the transaction `reference_type` is set to `"composite_consumption"`).
*   **Deduction Restore on Cancel**:
    *   When cancelling or returning an order in `useOrders.ts` (`restoreLocalStock` or `restoreSupabaseStock`), the system reverses this calculation and increments the stock of child components.
*   **Existing Test Files**:
    *   `src/lib/__tests__/wholesaleAndComposite.test.ts` includes unit tests for `calculateCompositeVariantStock` and simulates combo stock deduction/restoration.
    *   **Critical Gap**: The unit tests for deduction and restoration **replicate** the code structure as helper functions (`simulateDeductStock` and `simulateRestoreStock`) inside the test file itself, rather than importing and verifying the actual implementations (`deductLocalStock` / `restoreLocalStock`) inside `src/hooks/useOrders.ts`.

### 2.2. Wholesale Stacked Discounts & Vouchers
*   **Pricing Application**: Wholesale prices are applied dynamically in `POS.tsx` using `applyWholesalePricing` from `src/lib/wholesaleControl.ts`. The wholesale prices override the item `unit_price` in the cart and set `is_wholesale: true`.
*   **Stacked Promotions Constraints**:
    *   The general wholesale configuration contains a flag: `no_other_discounts: boolean`.
    *   If `no_other_discounts` is enabled and wholesale pricing is applied to any item (`hasWholesaleApplied === true`):
        ```typescript
        if (wholesaleSettings.no_other_discounts && hasWholesaleApplied) {
          if (discount > 0 || appliedVoucherId) {
            setDiscount(0);
            setAppliedVoucherId(null);
            toast({
              title: "Áp dụng giá bán sỉ",
              description: "Đơn hàng đã được áp giá bán sỉ. Các mã giảm giá/voucher khác đã bị vô hiệu hóa.",
            });
          }
        }
        ```
    *   This forces the order-level `discount` to 0 and clears `appliedVoucherId`.
*   **Critical rendering loop bug**:
    *   In `POS.tsx`, there is a second `useEffect` hook that automatically calculates the best voucher discount and applies it via `setDiscount(bestDiscount)` and `setAppliedVoucherId(bestPromoId)`.
    *   This voucher auto-apply hook does **not** check whether `wholesaleSettings.no_other_discounts` is enabled or if the cart has wholesale items applied.
    *   When a cart triggers wholesale prices and there is an eligible auto-apply promotion:
        1. The wholesale `useEffect` runs, detects wholesale applied, and sets `discount` to 0 / `appliedVoucherId` to null.
        2. This state change triggers a re-render.
        3. The voucher `useEffect` runs, finds an eligible promo (since discount is 0), and sets `discount` to `bestDiscount` / `appliedVoucherId` to `bestPromoId`.
        4. This state change triggers a re-render.
        5. The wholesale `useEffect` runs again, sees `discount > 0` or `appliedVoucherId !== null`, and resets them to 0 and null.
        6. This loop continues infinitely, causing UI freezing or heavy state-fighting console spam.
*   **Existing Test Files**:
    *   `src/lib/__tests__/wholesaleAndComposite.test.ts` unit tests the basic pricing tiers (variant quantity, product quantity, customer tags).
    *   `tests/e2e/promotions.spec.ts` and `tests/e2e/category_promotions.spec.ts` test promotion application in POS.
    *   **Gaps**:
        *   No tests check the interaction between wholesale settings (`no_other_discounts`) and voucher auto-application.
        *   No tests verify the infinite rendering loop described above.
        *   No tests check what happens when `no_other_discounts` is set to `false` (allowing stacked wholesale and vouchers).

---

## 3. Concrete Testing Strategy

To address the gaps identified above, the following unit and end-to-end tests are recommended:

### 3.1. Vitest Unit Testing Actions
1.  **Create `src/hooks/__tests__/useLoyalty.test.ts`**:
    *   Wrap hook execution in a custom render utility containing `QueryClientProvider` and `useToast` mock.
    *   Mock `isLocalDemoAuthEnabled` to return `true` in one test block, checking that `localStorage` queries/mutations update correctly.
    *   Mock `isLocalDemoAuthEnabled` to return `false` in a second block, mocking Supabase client response structures (e.g. `maybeSingle` returning mock rows for updates vs. returning `null` for inserts).
    *   Assert that `adjustPoints` calls update partner loyalty points in local mode.
2.  **Create `src/hooks/__tests__/useWholesaleSettings.test.ts`**:
    *   Verify hook default parameters (returns `DEFAULT_SETTINGS` when no `companyId` is active).
    *   Mock Supabase fetch responses to verify that query initialization seeds a new record if the database has none.
    *   Verify the `saveWholesalePrices` mutation deletes variant/product prices and inserts new tiers.
3.  **Create `src/hooks/__tests__/usePlatformSync.test.ts`**:
    *   Test `syncLogs` in local mode vs. database mode.
    *   Mock `supabase.functions.invoke` using `vi.spyOn`. Test successful order synchronization (verifying the correct body structure containing `action: "sync_orders"`, `channel_id`, etc.) and edge-case error returns.
    *   Verify query client key invalidation for `orders`, `sync_logs`, `sales_channels`, and `data-hub` when `syncOrders` completes.
4.  **Enhance `src/lib/__tests__/wholesaleAndComposite.test.ts`**:
    *   Import `deductLocalStock` and `restoreLocalStock` from `src/hooks/useOrders.ts` and test them using `localStorage` directly instead of writing simulated local helper functions in the test file.

### 3.2. Playwright E2E Testing Actions
1.  **Create `tests/e2e/combo_inventory.spec.ts`**:
    *   *Setup*: Add test data for child products ("Component Red", "Component Blue") with set stock levels, and a combo product variant that links them via `product_variant_components` (BOM).
    *   *Step 1*: Open POS, verify the combo display stock matches the dynamic bottleneck calculation.
    *   *Step 2*: Checkout a combo unit.
    *   *Step 3*: Go to inventory details, assert that component stock has been deducted appropriately (e.g. Ao Thun Do stock down by 2, Ao Thun Xanh stock down by 3), while the parent combo stock remains un-mutated.
    *   *Step 4*: In the Orders table, cancel the order and assert that ingredient stocks are fully restored.
2.  **Create `tests/e2e/wholesale_stacked_discounts.spec.ts`**:
    *   *Setup*: Create an auto-apply discount campaign (e.g. "AUTO10" for 10% off) and a tiered wholesale price rule for a target product.
    *   *Scenario A (`no_other_discounts = true`)*:
        *   Open POS, add product items to trigger wholesale tier.
        *   Verify the wholesale price is applied.
        *   Assert that the "AUTO10" voucher is **not** applied, the discount summary remains `0đ`, and a warning toast appears.
        *   Check that manual discount entries are rejected/reset.
    *   *Scenario B (`no_other_discounts = false`)*:
        *   Go to Wholesale Settings page, set `no_other_discounts = false`.
        *   Open POS, trigger wholesale tier.
        *   Assert that both the wholesale tier price is applied to the cart items **and** the order-level `AUTO10` 10% voucher discount is applied to the subtotal.

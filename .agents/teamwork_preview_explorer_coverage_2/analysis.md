# Coverage Gap Analysis (Milestone 1)

This report performs a comprehensive Coverage Gap Analysis on the local ERP Mini POS and Wholesale integration module. It details the purpose, implementation logic, and current test coverage for the hooks (`useLoyalty`, `useWholesaleSettings`, `usePlatformSync`), business modules (`wholesaleControl.ts`, `POS.tsx`), combo/BOM systems, and stacked promotions/voucher locking logic. Finally, it outlines a concrete test strategy to close identified gaps.

---

## 1. Hooks Investigation & Coverage

### 1.1 `useLoyalty.ts`
* **Purpose**: Manages loyalty program configurations (point-to-money and money-to-point earn/redeem ratios, enabling switches, point exclusion rules), referral program rewards (referrer rewards, referee discounts), and partner loyalty transaction history (earn, redeem, manual adjust, refund).
* **Key Logic Branches**:
  * **Auth Mode Split**: Checks `isLocalDemoAuthEnabled()`. 
    * If `true`: Reads and updates local state stored in `localStorage` under keys `erp-mini-loyalty-settings`, `erp-mini-referral-settings`, and `erp-mini-loyalty-transactions`.
    * If `false`: Reads and writes to Supabase database tables `loyalty_settings`, `referral_settings`, and `loyalty_transactions`.
  * **Seeding & Mutation**:
    * Updates to loyalty/referral settings check if an entry already exists for the company. If yes, it executes an `update` query filtered by `id`; if no, it performs an `insert` query seeding a new record.
  * **Transaction History Fetching & Joins**:
    * `useLoyaltyTransactions(partnerId)` retrieves transactions for a given customer. In Local Demo mode, it maps `order_id` to local storage orders to append the `order_number` field. In Supabase mode, it uses `.select("*, orders(order_number)")` to perform a join query.
  * **Manual Adjustment**:
    * The `adjustPoints` mutation inserts a new transaction of type `manual_adjust` and increments/decrements the partner's points both in the database (or local storage `erp-mini-local-demo-partners`) and triggers query invalidation.
* **Current Test Coverage**:
  * Partially covered by `src/lib/__tests__/loyaltyAndReferral.test.ts`.
  * *Tested*: Pure fallback helper functions (`getLocalLoyaltySettings`, `getLocalReferralSettings`, `getLocalLoyaltyTransactions`) and custom earned point calculations based on order total.
  * *Untested / Gaps*: The React Query hooks themselves (`useLoyaltySettings`, `useReferralSettings`, `useLoyaltyTransactions`), React Query caching/invalidation behaviors, Supabase network queries/insert/update database paths, manual points adjustment mutations, and the UI panels associated with loyalty configuration.

### 1.2 `useWholesaleSettings.ts`
* **Purpose**: Manages global wholesale policy configurations (threshold toggles for applying wholesale prices based on order qty, product qty, variant qty, or tags; and voucher stacking rules) and product-specific or variant-specific price tiers.
* **Key Logic Branches**:
  * **Auth Mode Split**: Splits operations between local localStorage (`erp-mini-local-demo-wholesale-settings`, `erp-mini-local-demo-product-wholesale-prices`) and Supabase tables (`wholesale_settings`, `product_wholesale_prices`).
  * **Seeding**: If no company settings are retrieved from Supabase, it inserts a new settings record on the fly to seed configuration.
  * **Product Wholesale Price Overwriting**:
    * The `saveWholesalePrices` mutation deletes all existing wholesale price tiers matching the target product/variant combination first (e.g. `product_id = X` and `variant_id = Y`), and then inserts the new pricing array.
* **Current Test Coverage**:
  * Partially covered by `src/lib/__tests__/wholesaleAndComposite.test.ts`.
  * *Tested*: Pure helper functions `applyWholesalePricing` and `calculateCompositeVariantStock` using hardcoded inline arrays.
  * *Untested / Gaps*: The React hooks themselves (`useWholesaleSettings`, `useProductWholesalePrices`), cache invalidations, Supabase integration, bulk price saving/overwriting mutations, and the wholesale configuration UI settings tab.

### 1.3 `usePlatformSync.ts`
* **Purpose**: Fetches synchronization logs and interacts with Supabase edge functions to perform integrations with external sales channels (Lazada, Shopee, TikTok Shop).
* **Key Logic Branches**:
  * **Logs Fetching**: Local storage (`erp-mini-local-demo-sync-logs`) vs. Supabase (`sync_logs` table).
  * **Supabase Edge Function Invocations**:
    * Mutations `syncOrders`, `getAuthUrl`, `exchangeToken`, and `refreshToken` perform network requests to the Supabase Edge Function `sync-platform-orders` via `supabase.functions.invoke`.
    * **Crucial Finding**: Unlike other hooks, these functions do not check if `isLocalDemoAuthEnabled()` is true before invoking Supabase functions. In local demo mode, there is no mock interceptor for edge functions, meaning these mutation calls will fail if executed.
* **Current Test Coverage**:
  * **0%**. There are no unit tests under `src/hooks/__tests__/` or `src/lib/__tests__/`, and no Playwright E2E tests target sales channel synchronization or logs.

---

## 2. Core POS & Wholesale Business Logic

### 2.1 Combo Product Stocks (Dynamic Calculations)
* **Definition**: Combos are products represented by parent variants that are composed of multiple child variants in specified quantities. They are configured via the `product_variant_components` table / local store.
* **Stock Formula**: Done in `calculateCompositeVariantStock`:
  * If a variant has component mappings:
    $$\text{Combo Stock} = \min_{c \in \text{components}} \left( \lfloor \frac{\text{child\_variant.stock\_quantity}_c}{\text{component.quantity}_c} \rfloor \right)$$
  * If a variant has no components, it defaults to its own `stock_quantity`.
* **POS Integration**:
  * Verified in `src/pages/POS.tsx` during `addToCart` and `updateQuantity`.
  * The system computes `availableStock` for the selected item. If adding an item to the cart (or incrementing its quantity) exceeds `availableStock`, the operation is blocked and a "Hết hàng" (Out of stock) or "Vượt quá tồn kho" toast is displayed.

### 2.2 Ingredient Stock Deductions
* **Supabase Mode (Correct Behavior)**:
  * When an order is checked out, `createOrder` calls `deductSupabaseStock(items, orderNumber)`.
  * If an item has a variant, it queries `product_variant_components` to identify child components.
  * If components exist, it loops through each, computes `qtyToDeduct = item.quantity * comp.quantity`, and runs Supabase RPC calls:
    * `increment_variant_stock_quantity` for `comp.child_variant_id` (by `-qtyToDeduct`).
    * `increment_stock_quantity` for the child variant's product ID (by `-qtyToDeduct`).
    * It inserts an inventory transaction of type `"out"` and reference type `"composite_consumption"`.
  * If no components exist, it deducts stock directly from the variant and product using RPC calls and inserts an inventory transaction of reference type `"order"`.
* **Local Demo Mode (BUG / INCONSISTENCY)**:
  * Local checkout publishes the `ORDER_CREATED` event on `erpEventBus`.
  * The inventory subscriber `"InventoryHandler"` in `erpEventBus.ts` handles this event.
  * However, `"InventoryHandler"` only checks `getLocalProductBom(item.product_id)`.
    * If a product-level BOM is defined, it deducts BOM materials (ingredients).
    * If no BOM is defined, it deducts stock of `item.product_id` directly.
  * **Critical Gap**: `"InventoryHandler"` completely ignores variants (`item.variant_id`) and variant components (`product_variant_components`). Consequently, placing a POS order in local demo mode **does not deduct constituent child stocks** for combo products, violating business rules and diverging from Supabase mode.
  * Furthermore, `useOrders.ts` defines a function `deductLocalStock(items, orderNumber)` that contains the correct logic for local variant component deduction, but it is **never called** in the codebase.

### 2.3 Wholesale Stacked Discounts & Voucher Locking
* **Logic Recalculation**: Recalculated dynamically in `POS.tsx` inside a `useEffect` whenever the cart, selected customer, order tags, wholesale settings, or wholesale prices change.
* **Voucher / Discount Locking Rule**:
  * Inside `useEffect`, if `wholesaleSettings.no_other_discounts` is `true` AND `hasWholesaleApplied` is `true` (at least one item in the cart has a wholesale price applied):
    * If a general order discount (`discount > 0`) or an active voucher (`appliedVoucherId !== null`) is present:
      * The system resets general discount to `0` (`setDiscount(0)`).
      * The system resets active voucher to null (`setAppliedVoucherId(null)`).
      * The system displays a toast: *"Đơn hàng đã được áp giá bán sỉ. Các mã giảm giá/voucher khác đã bị vô hiệu hóa."*
  * If `no_other_discounts` is `false`, the system allows stacking, keeping both the wholesale item prices and the general voucher discount.

---

## 3. Coverage Gaps & Edge Cases

| File / Hook | Current Unit Test Coverage | Playwright E2E Coverage | Identified Gap / Edge Case |
|---|---|---|---|
| `useLoyalty.ts` | Partial (local helpers only) | None | Hook behavior, cache invalidation, Supabase routes, and manual adjustment UI. |
| `useWholesaleSettings.ts` | Partial (calculations only) | None | Hook querying, saving bulk price tiers, and settings panel integration. |
| `usePlatformSync.ts` | **0%** | None | Supabase Edge Function integrations, logs rendering, and synchronization flows. |
| `POS.tsx` (Checkout & Stock) | None | Partial (standard orders) | Out-of-stock validation for combos; local demo mode combo stock deduction failure. |
| `POS.tsx` (Wholesale Lock) | None | Partial (segment auto-apply) | Stacking locking rule validation (`no_other_discounts = true` vs `false`). |

---

## 4. Proposed Test Strategy

### 4.1 Playwright E2E Testing Strategy
To close the UI and integration coverage gaps, we propose implementing three specific E2E spec files:

#### Test 1: `wholesale_tiered_pricing.spec.ts` (Wholesale Recalculation & Voucher Lock)
* **Steps**:
  1. Login as Admin using `loginLocalDemo(page, "admin")`.
  2. Navigate to `/wholesale` and configure tiered prices for product `PRD-A` (Original price: 100,000đ):
     * Min qty 5 -> Wholesale price: 80,000đ.
     * Min qty 10 -> Wholesale price: 70,000đ.
  3. Toggle "no_other_discounts" (Không áp dụng chung với KM khác) to **Enabled** in wholesale settings.
  4. Navigate to `/pos`. Add `PRD-A` to the cart. Verify unit price is 100,000đ.
  5. Apply voucher code `SIEUDEAL` (value: 10,000đ discount). Verify subtotal is 100,000đ, discount is 10,000đ, total is 90,000đ.
  6. Increase quantity of `PRD-A` to 6 items.
  7. **Assert**: The unit price updates to 80,000đ, the applied voucher is cleared, the general discount resets to 0đ, and a toast message "Áp dụng giá bán sỉ..." appears.
  8. **Assert**: The final order total displays `6 * 80,000đ = 480,000đ`.
  9. Go back to `/wholesale` and toggle "no_other_discounts" to **Disabled**.
  10. Return to POS, repeat, and verify that both the wholesale price (80,000đ) and voucher discount (10,000đ) are applied simultaneously.

#### Test 2: `combo_stock_deduction.spec.ts` (Dynamic Stock Calculation & Deductions)
* **Steps**:
  1. Login as Admin.
  2. Navigate to Products/Inventory and set initial stock levels:
     * Child Variant A (`var-child-1`): 10 items.
     * Child Variant B (`var-child-2`): 15 items.
  3. Configure a Combo variant (`var-parent`) consisting of:
     * 2x Child Variant A
     * 3x Child Variant B
  4. Navigate to `/pos`.
  5. **Assert**: Combo variant is displayed with `5` available stock in the catalog.
  6. Attempt to add `6` items of the Combo variant. Verify the POS triggers a "Hết hàng" toast and blocks the action.
  7. Add `2` items of the Combo variant. Proceed to checkout using cash.
  8. Navigate to Products/Inventory (or query local storage state in demo mode).
  9. **Assert**: Stock levels have correctly decremented:
     * Child Variant A: $10 - (2 \times 2) = 6$ items.
     * Child Variant B: $15 - (2 \times 3) = 9$ items.
     * Inventory transactions of reference type `composite_consumption` have been logged.

#### Test 3: `platform_channel_sync.spec.ts` (Platform Sync & Integration Logs)
* **Steps**:
  1. Login as Admin.
  2. Navigate to `/integrations` (or platform settings).
  3. Verify Lazada, Shopee, and TikTok Shop channels are listed.
  4. Mock the Supabase functions invoke API response (since E2E runs in local demo mode without edge functions) to return a mock sync count (`synced: 5`).
  5. Click "Đồng bộ đơn hàng" for Shopee.
  6. **Assert**: A success toast "Đồng bộ hoàn tất: Đã đồng bộ 5 đơn hàng" appears.
  7. Verify that the "Lịch sử đồng bộ" (Sync logs) table displays a new entry:
     * Platform: Shopee.
     * Status: Success.
     * Synced count: 5.

---

### 4.2 Vitest Unit Testing Strategy
To test hooks and cache invalidations independently of the browser DOM, we propose adding the following tests:

#### Test 1: `useLoyalty.test.ts` (React-Query & Supabase Mutation Unit Tests)
* **Scenarios**:
  * **Fetch Fallback**: Mount `useLoyaltySettings` hook. Verify that if Supabase/local storage has no records, it returns `DEFAULT_LOYALTY_SETTINGS`.
  * **Updates / Invalidation**: Call `updateSettings` mutation. Verify it calls supabase `update` table with correct payload, invalidates `"loyalty-settings"` query, and displays a success toast.
  * **Manual Points Adjustment**: Call `adjustPoints` with `{ partnerId: "cust-1", points: 100, notes: "Test adjust" }`. Verify it calls Supabase insert, updates partner points, and invalidates `"loyalty-transactions"` and `"partner"` queries.

#### Test 2: `useWholesaleSettings.test.ts` (Dynamic Tier Pricing Fetch & Save)
* **Scenarios**:
  * **Seeding Logic**: Mount `useWholesaleSettings`. Verify that if Supabase returns null, it triggers an insertion query to seed a new wholesale settings row.
  * **Tier Pricing Fetching**: Mount `useProductWholesalePrices` with a specific variant. Verify it retrieves tiers sorted by `min_quantity` in ascending order.
  * **Save Prices Transactions**: Call `saveWholesalePrices` with a list of tiers. Verify it makes a delete query for current variant tiers, then inserts the new tiers in a batch.

#### Test 3: `usePlatformSync.test.ts` (Edge Function RPC Calls)
* **Scenarios**:
  * **Invoking Edge Function**: Spy on `supabase.functions.invoke`. Call `syncOrders`. Verify that it invokes the function with `sync-platform-orders` and payload `{ action: 'sync_orders', channel_id: 'x', sync_params: {} }`.
  * **Authentication Exchanges**: Call `exchangeToken`. Verify it invokes the function with `exchange_token` action and correct code/redirect arguments. Verify success invalidates query `"sales_channels"`.

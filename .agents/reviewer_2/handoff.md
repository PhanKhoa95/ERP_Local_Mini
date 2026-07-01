# Handoff Report & Review Findings

This report evaluates the implementation of the Centralized Event-Driven Observer for ERP Local Demo. 

---

## Part 1: 5-Component Handoff Report

### 1. Observation
We conducted static code analysis and executed the validation script. Below are the verbatim code selections and tool logs:

*   **Observation A: Storage Key Mismatch in `useContracts.ts`**
    *   File Path: `src/hooks/useContracts.ts`
    *   Line 205:
        ```typescript
        const channelsRaw = localStorage.getItem("erp-mini-local-demo-channels") || "[]";
        ```
    *   Mismatch: The correct key used by `useSalesChannels.ts` (and everywhere else in the system) is `"erp-mini-local-demo-sales-channels"`.

*   **Observation B: Missing `partner_id` in order generation**
    *   File Path: `src/hooks/useContracts.ts`
    *   Lines 232–251:
        ```typescript
        const newOrder = {
          id: orderId,
          company_id: companyId,
          order_number: `ORD-${Date.now().toString().slice(-6)}`,
          customer_name: distPartner ? distPartner.name : "Nhà phân phối miền Nam",
          customer_phone: distPartner ? distPartner.phone : "0900000000",
          shipping_address: distPartner ? distPartner.address : "Hồ Chí Minh",
          payment_method: "Ghi nợ",
          payment_status: "pending",
          status: "pending",
          total: 3600000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          channel_id: retailChannel ? retailChannel.id : null,
          warehouse_id: null,
          notes: `Tạo từ hợp đồng ${contract.contract_number}`,
          discount: 0,
          shipping_fee: 0,
          order_items: orderItems,
        };
        ```
    *   Missing property: `partner_id` is missing, which prevents the Partner Debt observer handler from identifying the corresponding partner.

*   **Observation C: Event Bus Bypass in `updateContract` hook**
    *   File Path: `src/hooks/useContracts.ts`
    *   Lines 342–344:
        ```typescript
        if (updates.status === "active" && prevStatus !== "active") {
          createLocalOrderFromContract(companyId || "", local[idx]);
        }
        ```
    *   Bypass: This directly manipulates `localStorage` rather than publishing a `CONTRACT_SIGNED` event to the Event Bus (in contrast to the correct implementation in `signContract` at line 398). Consequently, the centralized inventory, accounting, and debt handlers are never invoked.

*   **Observation D: Incomplete Query Invalidation in `updateContract`**
    *   File Path: `src/hooks/useContracts.ts`
    *   Lines 359–361:
        ```typescript
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["smart-contracts"] });
          toast({ title: "Cập nhật hợp đồng thành công" });
        },
        ```
    *   Defect: Only `smart-contracts` is invalidated. Since an order is created, this should trigger a full invalidation via `invalidateContractRelated(qc)`.

*   **Observation E: Event Bus Ignores Outflow Transactions**
    *   File Path: `src/lib/erpEventBus.ts`
    *   Lines 234–236 (Accounting) & 338–341 (Partner Debt):
        ```typescript
        if (transaction.transaction_type !== "payment_in" && transaction.transaction_type !== "receivable") {
          return;
        }
        ```
    *   Defect: Outflow transactions (`payment_out` and `payable`) are filtered out. This prevents recording accounting journal entries and ledger balance updates for supplier payments or capital expenditures (Capex).

*   **Observation F: ESLint Failures**
    *   Execution of `npm run test:local` failed with exit code 1:
        ```text
        Y:\ERP_Local_Mini\src\components\settings\BackupTab.tsx
          421:9  error  'order_items' is never reassigned. Use 'const' instead    prefer-const
          439:9  error  'journal_lines' is never reassigned. Use 'const' instead  prefer-const
        ```

### 2. Logic Chain
1. If a contract is activated through the general edit UI (`updateContract`) instead of the signing modal (`signContract`), it calls `createLocalOrderFromContract`.
2. `createLocalOrderFromContract` attempts to read channels from `"erp-mini-local-demo-channels"`. Because the key is actually `"erp-mini-local-demo-sales-channels"`, it receives `null`/`[]` and fails to resolve the channel ID.
3. The generated order is written to `localStorage` without a `partner_id` field.
4. No event is published (`CONTRACT_SIGNED` or `ORDER_CREATED`), which bypasses all subscribers in `erpEventBus.ts`. Because these subscribers are bypassed, inventory is not adjusted, accounting journal entries are not created, and partner debt remains unchanged.
5. On success, `updateContract` only invalidates the `["smart-contracts"]` query cache. The query cache for `["orders"]` is not invalidated. Therefore, the newly created order does not display in the orders list until a full page reload occurs.
6. When `PAYMENT_RECORDED` is published for an outflow transaction (e.g. `payment_out`), the accounting subscriber rejects it. No journal entry is created, leaving cash accounts and liability accounts in the ledger out of sync.

### 3. Caveats
- Non-demo (Supabase database) mode integration was not physically tested against a live database instance. We assumed correct behavior in Supabase mode based on the source code structure.
- We did not modify the implementation code to correct the findings in accordance with the review-only constraints of this role.

### 4. Conclusion
The implementation of the Centralized Event-Driven Observer contains critical architectural bypasses, storage key mismatches, missing properties, and incomplete coverage for cash outflows and query cache invalidations. Our verdict is **REQUEST_CHANGES**.

### 5. Verification Method
- **To verify compilation and tests**: Run `npm run test` or `npx vitest run src/lib/__tests__/erpEventBus.test.ts`. All 188 unit tests currently pass because there are no tests covering the `updateContract` activation bypass, missing `partner_id`, or `payment_out` events.
- **To verify ESLint compliance**: Run `npm run lint`. This will show the `prefer-const` violations in `BackupTab.tsx`.

---

## Part 2: Quality Review Report

**Verdict**: REQUEST_CHANGES

### Findings

#### [Critical] Finding 1: Event Bus Bypass & Storage Write Mismatches in Contract Update
- **What**: The `updateContract` mutation directly writes orders to localStorage using incorrect keys and omitting `partner_id`, completely bypassing the central Event Bus.
- **Where**: `src/hooks/useContracts.ts` (Lines 193–254, 342–344)
- **Why**: Bypassing the Event Bus prevents the system from triggering related actions: stock deduction, accounting journal entry creation, and partner debt updates. Furthermore, the mismatch in storage keys prevents retrieving sales channels.
- **Suggestion**: Remove `createLocalOrderFromContract` from `useContracts.ts`. Instead, in `updateContract`, publish the `CONTRACT_SIGNED` event:
  ```typescript
  erpEventBus.publish("CONTRACT_SIGNED", { contract: local[idx], companyId: companyId || "" });
  ```
  Let the Event Bus subscriber handle order creation uniformly.

#### [Major] Finding 2: Incomplete Cash Outflow Handling in Accounting & Partner Debt Observers
- **What**: `PAYMENT_RECORDED` subscriber ignores transactions that are not `payment_in` or `receivable`.
- **Where**: `src/lib/erpEventBus.ts` (Lines 234–236, 338–341)
- **Why**: Excludes `payment_out` and `payable` transactions from ledger entry updates. This leads to ledger imbalances where cash is spent on suppliers/Capex but not recorded in the general ledger.
- **Suggestion**: Expand the subscriber logic to handle `payment_out` and `payable` transaction types, mapping them to Debit accounts (such as 331, 211, or 642) and Credit cash accounts (1111 or 1121).

#### [Major] Finding 3: Incomplete Query Invalidation on Contract Update
- **What**: `updateContract` onSuccess does not invalidate related queries like orders, accounting, and payments.
- **Where**: `src/hooks/useContracts.ts` (Lines 359–361)
- **Why**: The UI displays stale cached data (e.g. newly created orders do not show up in the order table).
- **Suggestion**: Call `invalidateContractRelated(qc)` in the `onSuccess` handler of `updateContract`.

#### [Minor] Finding 4: Linting Failures in BackupTab
- **What**: ESLint errors due to reassignment of variables declared with `let` that should be `const`.
- **Where**: `src/components/settings/BackupTab.tsx` (Lines 421, 439)
- **Why**: Prevents build pipeline checks from passing.
- **Suggestion**: Change `let` to `const` on lines 421 and 439 of `BackupTab.tsx`.

### Verified Claims
- **Claim**: Event Bus successfully routes order creation to stock deduction in demo mode. -> Verified via `erpEventBus.test.ts` (Unit Test) -> **PASS**
- **Claim**: Event Bus updates ledger balances on payment receipt. -> Verified via `erpEventBus.test.ts` (Unit Test) -> **PASS**
- **Claim**: The project compiles successfully. -> Verified via `npm run typecheck` -> **PASS**
- **Claim**: All existing unit tests pass. -> Verified via `npm run test` -> **PASS**

---

## Part 3: Adversarial Challenge Report

**Overall risk assessment**: HIGH

### Challenges

#### [High] Challenge 1: Silent Failure in Data Consistency via Edit Forms
- **Assumption challenged**: Activating a contract via editing its status is functionally identical to signing it via the dedicated button.
- **Attack scenario**: A user edits a contract to set its status to `"active"` through a form. The hook creates a local order silently in storage without publishing any event. No inventory deduction, journal entries, or partner debt adjustments occur.
- **Blast radius**: Out-of-sync inventory values, incomplete general ledger reports, and partner debt figures that show incorrect receivables.
- **Mitigation**: Route all state mutations that lead to contract activation through the `CONTRACT_SIGNED` event on the Event Bus.

#### [Medium] Challenge 2: Broken Channel Mapping in Offline Mode
- **Assumption challenged**: Sales channels are correctly queried using the `"erp-mini-local-demo-channels"` key.
- **Attack scenario**: A contract is activated via `updateContract`. It attempts to read channels from the wrong key. It defaults to an empty list, making the `retailChannel` undefined, and sets `channel_id` to `null`.
- **Blast radius**: Broken dashboards that rely on channel-wise sales segmentation because the order is created without a channel.
- **Mitigation**: Replace `"erp-mini-local-demo-channels"` with `"erp-mini-local-demo-sales-channels"` in `useContracts.ts`.

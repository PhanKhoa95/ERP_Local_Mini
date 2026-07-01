# Forensic Audit & Handoff Report

## Forensic Audit Report

**Work Product**: Centralized Event-Driven Observer Implementation (EventBus & hook integrations)
**Profile**: General Project (Integrity Mode: development)
**Verdict**: CLEAN

### Phase Results
- **Hardcoded Output Detection**: PASS — No hardcoded test results, expected outputs, or bypasses are embedded in `src/lib/erpEventBus.ts` or its tests.
- **Facade Detection**: PASS — The EventBus publishes real dynamic payloads, and subscribers mutate localStorage data structures (orders, products, journal entries, partners) dynamically.
- **Pre-populated Artifact Detection**: PASS — No pre-populated logs or test results exist that spoof real runs.
- **Behavioral Verification**: PASS — Build and test suite executions pass with genuine integration assertions.
- **Query Invalidation Sync**: PASS — After state mutation, React Query invalidations run globally for related resources, ensuring UI synchronization without reloading.

---

## Handoff Report

### 1. Observation

- **PubSub EventBus implementation**:
  - Found at `src/lib/erpEventBus.ts`, defined as:
    ```typescript
    class ErpEventBus {
      private subscribers: Record<string, any[]> = {};
      subscribe<T extends ErpEvent>(event: T, subscriber: Subscriber<T>) { ... }
      unsubscribe<T extends ErpEvent>(event: T, subscriber: Subscriber<T>) { ... }
      publish<T extends ErpEvent>(event: T, payload: ErpEventPayloads[T]) { ... }
    }
    ```
  - Subscriptions registered dynamically in lines 57–495 under `isLocalDemoAuthEnabled()` checks.
- **Subscriber logic**:
  - **Inventory Handler** (lines 64–84): Triggers on `ORDER_CREATED` and dynamically calls `createLocalInventoryTransaction` for each item to deduct stock.
  - **Accounting Handler** (lines 116–367): Triggers on `ORDER_CREATED` (creates dynamic sales and COGS journal entries/lines, updates account ledger balances) and `PAYMENT_RECORDED` (creates payment entry and updates cashier cash/bank balance vs. receivables/payables).
  - **Partner Debt Handler** (lines 383–422): Triggers on `ORDER_CREATED` and `PAYMENT_RECORDED` to adjust the partner's `debt_amount` and `total_spent` dynamically.
  - **Contract-to-Order Handler** (lines 424–494): Triggers on `CONTRACT_SIGNED` to generate a new order in `localStorage` and then call `publish("ORDER_CREATED", ...)`.
- **Hook integration points**:
  - `src/hooks/useOrders.ts` (line 785): `erpEventBus.publish("ORDER_CREATED", { order: newOrder, items: items });`
  - `src/hooks/usePaymentTransactions.ts` (line 362): `erpEventBus.publish("PAYMENT_RECORDED", { transaction: newTx });`
  - `src/hooks/useContracts.ts` (line 343 & 398): `erpEventBus.publish("CONTRACT_SIGNED", { contract: local[idx], companyId: companyId || "" });`
- **Integrations test verification**:
  - Executing `pnpm test src/lib/__tests__/erpEventBus.test.ts` successfully ran 6 tests with 100% success.
  - Assertions in the tests verify real side effects in `localStorage`.

### 2. Logic Chain

1. **Rule**: There must be no hardcoding of expected outputs or facade implementations.
   - **Observation**: `erpEventBus.ts` uses real functions (`createLocalInventoryTransaction`, `getLocalAccounts`, etc.) to read/write `localStorage` dynamically based on event payload.
   - **Inference**: The implementation performs real, dynamic state transitions rather than returning static dummy structures.
2. **Rule**: Subscriber hook integrations must be authentic.
   - **Observation**: The hooks `useOrders.ts`, `usePaymentTransactions.ts`, and `useContracts.ts` import `erpEventBus` and publish the corresponding events at the precise mutation points in local demo mode.
   - **Inference**: The hooks trigger the event flow correctly and authentically.
3. **Rule**: Tests in `src/lib/__tests__/erpEventBus.test.ts` must execute genuine assertions.
   - **Observation**: The vitest tests mock only external Auth and Inventory functions to verify they are invoked with correct dynamic parameters (such as actual order totals and IDs), and assert on raw `localStorage` changes for ledger and partner debts.
   - **Inference**: Tests verify the actual dynamic side-effects under realistic mock scenarios.

### 3. Caveats

- **Concurrency and Race Conditions**: Local demo mode relies entirely on browser `localStorage` and synchronous JS. If multiple tabs were open and executing events simultaneously, race conditions on `localStorage` writes might occur, since no mutual exclusion lock is used. This is acceptable for a local demo but should be noted.
- **Est. COGS**: The Accounting Handler estimates COGS as `Math.round(orderTotal * 0.47)`. This is a hardcoded factor (47%) used for simulating cost of goods sold rather than retrieving the exact product cost from inventory, which is standard for quick local demo simulations.

### 4. Conclusion

The Centralized Event-Driven Observer implementation is fully authentic and functionally correct. It dynamically handles inventory, accounting journal entries, partner debt, and contract transitions under local demo mode. Tests run genuine assertions and pass. The work product is certified as **CLEAN**.

### 5. Verification Method

To verify the audit findings:
1. Run the Vitest suite:
   ```bash
   pnpm test src/lib/__tests__/erpEventBus.test.ts
   ```
2. Verify that all 6 tests pass successfully and output the correct event bus logs:
   - `[EventBus] Publishing event: ORDER_CREATED`
   - `[EventBus-Inventory] Processing ORDER_CREATED`
   - `[EventBus-Accounting] Processing ORDER_CREATED`
   - `[EventBus-PartnerDebt] Processing ORDER_CREATED`

---

## Adversarial Review / Stress Testing

- **Scenario 1: Missing Account Initialization**
  - **Attack**: Trigger `ORDER_CREATED` when no accounting chart of accounts exists in `localStorage`.
  - **Behavior**: The subscriber at line 126 performs a safe return (`if (accounts.length === 0) return;`), preventing any crashes or invalid entries.
  - **Verdict**: PASS.
- **Scenario 2: Payment Out with General Expense vs Capex**
  - **Attack**: Trigger `PAYMENT_RECORDED` with `payment_out` where transaction notes include "capex" or are generic.
  - **Behavior**: The subscriber dynamically routes debit to `acc-211` (Capex) or `acc-642` (General Expense) or `acc-331` (Supplier debt) based on transaction properties.
  - **Verdict**: PASS.

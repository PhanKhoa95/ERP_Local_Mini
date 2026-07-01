# Execution Plan: Centralized Event-Driven Observer

## Project Objective
Implement a Centralized Event-Driven Observer system (`src/lib/erpEventBus.ts`) that listens to data-modifying hooks and automates business synchronization across modules (Inventory, Accounting, Partner Debt) and invalidates UI queries in local demo mode.

## Milestones & Tasks

### Milestone 1: Exploration & Codebase Analysis
- **Goal**: Map out existing storage structures, hooks, and identify exact points of injection.
- **Tasks**:
  - Run explorer to locate data-modifying functions in `useOrders.ts`, `usePaymentTransactions.ts`, and `useContracts.ts`.
  - Analyze how `localStorage` is structured for orders, products (stock), journal entries (accounts/lines/entries), and partners (debts).
  - Define Event types and payload structures (e.g., `ORDER_CREATED`, `PAYMENT_RECORDED`, `CONTRACT_SIGNED`).

### Milestone 2: Implement Event Bus & Hooks Integration
- **Goal**: Implement the publish/subscribe system in `src/lib/erpEventBus.ts` and integrate triggers into the hooks.
- **Tasks**:
  - Implement a simple PubSub Event Bus in `src/lib/erpEventBus.ts`.
  - Add event publisher triggers inside `createOrder`, `createTransaction` (payment), and `signContract` / `completeMilestone` hooks.
  - Support passing relevant payloads (company_id, partner_id, order_id, amounts, items).

### Milestone 3: Implement Subscribers / Operations Handlers
- **Goal**: Implement handlers for Inventory, Accounting, and Partner Debt modules.
- **Tasks**:
  - **Inventory Subscriber**: Listen to `ORDER_CREATED`, subtract quantity from products in local storage.
  - **Accounting Subscriber**: Listen to `ORDER_CREATED` and `PAYMENT_RECORDED`, create double-entry journal entries and lines in local storage.
  - **Partner Debt Subscriber**: Listen to events, update the customer/supplier `debt_amount` in local storage.
  - Ensure operations only run or synchronize in local demo mode.

### Milestone 4: Implement UI Synchronization (Query Invalidation)
- **Goal**: Synchronize React Query states.
- **Tasks**:
  - Set up query invalidation inside the event bus or subscribers when events complete.
  - Leverage `invalidateOrderRelated`, `invalidatePaymentRelated`, `invalidateAccountingRelated` etc. from `src/lib/queryInvalidation.ts`.

### Milestone 5: Writing Tests & Verification
- **Goal**: Create automated tests for the event bus and verify everything passes.
- **Tasks**:
  - Write `src/lib/__tests__/erpEventBus.test.ts` to test event pub/sub, subscriber side-effects (stock update, journal entry generation, debt updating) and mock React Query.
  - Execute `npm run test` or `npx vitest src/lib/__tests__/erpEventBus.test.ts`.

## Verification Gates
1. **Automated Tests**: Unit and integration tests for `erpEventBus` pass 100%.
2. **Review & Audit**: Verification from reviewers and forensic auditor that no hardcoding or dummy implementations are present.

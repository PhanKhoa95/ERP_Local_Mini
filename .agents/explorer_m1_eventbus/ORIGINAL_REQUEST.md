## 2026-06-30T04:29:22Z
Please perform codebase analysis for implementing the Centralized Event-Driven Observer for ERP Local Demo.
Your working directory is: y:\ERP_Local_Mini\.agents\explorer_m1_eventbus

Specific Tasks:
1. Examine hooks: `src/hooks/useOrders.ts`, `src/hooks/usePaymentTransactions.ts`, `src/hooks/useContracts.ts`. Identify exactly where orders are created, payment transactions are written, and contracts/milestones are signed/completed under local demo mode.
2. Determine how `localStorage` is structured for orders, products/stock, partners, payment transactions, and accounting (journal entries/lines/accounts).
3. Plan the design of the centralized Event Bus in `src/lib/erpEventBus.ts` (PubSub) supporting events: `ORDER_CREATED`, `PAYMENT_RECORDED`, `CONTRACT_SIGNED`.
4. Define the logic for the following subscribers:
   - **Inventory Handler**: How to deduct product `stock_quantity` in `localStorage` when `ORDER_CREATED` is received.
   - **Accounting Handler**: How to auto-generate posted double-entry journal entries and lines in `localStorage` when `ORDER_CREATED` or `PAYMENT_RECORDED` is received.
   - **Partner Debt Handler**: How to auto-update a partner's `debt_amount` in `localStorage` when `ORDER_CREATED` or `PAYMENT_RECORDED` is received.
5. Plan React Query invalidation for state synchronization on UI.
6. Write your detailed findings and proposed implementation plan/signatures to `handoff.md` in your working directory. DO NOT write code to the source tree. Only propose the design in your handoff report.

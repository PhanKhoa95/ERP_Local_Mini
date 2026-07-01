## 2026-06-30T04:32:35Z
Please implement the Centralized Event-Driven Observer for ERP Local Demo.
Your working directory is: y:\ERP_Local_Mini\.agents\worker_m2_eventbus_impl

Tasks to execute:
1. Implement the Centralized Event Bus file `src/lib/erpEventBus.ts` based on the PubSub design.
2. In `src/lib/erpEventBus.ts`, register the following subscribers to execute under local demo mode (`isLocalDemoAuthEnabled() === true`):
   - **Inventory Handler**: Subscribes to `ORDER_CREATED`, deducts stock quantity from `erp-mini-local-demo-products`, and logs inventory transactions.
   - **Accounting Handler**: Subscribes to `ORDER_CREATED` (creates Sales journal entry & COGS entry, updates accounts `131`, `511`, `632`, `156` balances in `erp-mini-local-demo-accounts`) and `PAYMENT_RECORDED` (creates collection journal entry, updates accounts cash/bank and `131` balances).
   - **Partner Debt Handler**: Subscribes to `ORDER_CREATED` (increases customer's `debt_amount` and `total_spent`) and `PAYMENT_RECORDED` (decreases partner's `debt_amount`).
   - **Contract-to-Order Handler**: Subscribes to `CONTRACT_SIGNED`, creates an order in `erp-mini-local-demo-orders` (reconciling the mismatch key), and publishes the `ORDER_CREATED` event.
3. Integrate the event publishers inside hooks:
   - In `src/hooks/useOrders.ts` (`createOrder` mutation, publish `ORDER_CREATED` event).
   - In `src/hooks/usePaymentTransactions.ts` (`createTransaction` mutation, publish `PAYMENT_RECORDED` event).
   - In `src/hooks/useContracts.ts` (`signContract` mutation, publish `CONTRACT_SIGNED` event instead of direct creation).
4. Resolve storage key bugs:
   - Make sure any code reading/writing orders to `"erp-mini-local-demo"` is corrected to `"erp-mini-local-demo-orders"`.
   - Make sure any code reading/writing chart of accounts to `"erp-mini-local-demo-chart-of-accounts"` is corrected to `"erp-mini-local-demo-accounts"`.
5. Align query key mismatches in `src/lib/queryInvalidation.ts`:
   - Map `"journal_entries"` and `"chart_of_accounts"` invalidations to the correct hook query keys: `"journal-entries-and-lines"` and `"chart-of-accounts"`.
   - In `invalidateContractRelated`, add `"orders"` invalidation.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please run TypeScript check and build inside your workflow to verify the changes compile without errors. Log all details of modified files and verification results in your handoff report at `y:\ERP_Local_Mini\.agents\worker_m2_eventbus_impl\handoff.md`.

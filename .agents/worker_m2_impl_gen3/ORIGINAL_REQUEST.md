## 2026-06-30T04:49:24Z
Please apply corrections to the Centralized Event-Driven Observer implementation for ERP Local Demo.
Your working directory is: y:\ERP_Local_Mini\.agents\worker_m2_impl_gen3

Tasks to perform:
1. Address the Event Bus bypass on Contract activation in `src/hooks/useContracts.ts`:
   - Locate the `updateContract` mutation. If the updated status is `"active"` and the previous status was not `"active"`, publish the `CONTRACT_SIGNED` event on the Event Bus instead of calling `createLocalOrderFromContract` directly.
   - In `updateContract`'s `onSuccess`, replace `qc.invalidateQueries({ queryKey: ["smart-contracts"] })` with a call to `invalidateContractRelated(qc)` to ensure all order, payment, and accounting UI caches are refreshed.
   - In `src/hooks/useContracts.ts`, ensure `erpEventBus.publish("CONTRACT_SIGNED", ...)` passes both the `contract` and `companyId`.
2. Fix missing property and key bugs:
   - In the `CONTRACT_SIGNED` observer inside `src/lib/erpEventBus.ts`, make sure the generated order has the `partner_id` field set to the contract's `partner_id` or resolved partner.
   - Replace any remaining references to `"erp-mini-local-demo-channels"` with `"erp-mini-local-demo-sales-channels"`.
3. Support cash outflow transactions in `src/lib/erpEventBus.ts`:
   - In the Accounting subscriber: handle `PAYMENT_RECORDED` when transaction type is `payment_out`. Create a double-entry journal entry for the outflow. Debit the appropriate account: `acc-211` (Capex if notes contains 'capex'), `acc-331` (Phải trả người bán if partner is a supplier), or `acc-642` (General Expense otherwise). Credit the cash/bank account (`acc-1111` or `acc-1121`). Update the respective ledger balances.
   - In the Partner Debt subscriber: handle `PAYMENT_RECORDED` when transaction type is `payment_out`. Decrease the supplier's `debt_amount` by the transaction amount.
4. Correct linting violations in `src/components/settings/BackupTab.tsx`:
   - At lines 421 and 439, change the declarations of `order_items` and `journal_lines` from `let` to `const`.
5. Run ESLint (`npm run lint`), TypeScript check (`npm run typecheck`), and Vitest (`npm run test`) to verify all builds and tests pass 100%.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Document all changes and test results in `handoff.md` in your working directory.

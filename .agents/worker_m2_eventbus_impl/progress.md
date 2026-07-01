# Progress - worker_m2_eventbus_impl
Last visited: 2026-06-30T11:39:00+07:00

## Status
- [x] 1. Investigate codebase (locate local storage keys, existing hooks, and invalidation mechanisms)
- [x] 2. Create `src/lib/erpEventBus.ts` and implement PubSub architecture with the 4 handlers (Inventory, Accounting, Partner Debt, Contract-to-Order)
- [ ] 3. Integrate publishers into `useOrders.ts`, `usePaymentTransactions.ts`, and `useContracts.ts`
- [ ] 4. Audit storage keys (`erp-mini-local-demo` -> `erp-mini-local-demo-orders`, `erp-mini-local-demo-chart-of-accounts` -> `erp-mini-local-demo-accounts`) and fix them
- [ ] 5. Align query invalidations in `src/lib/queryInvalidation.ts`
- [ ] 6. Run TSC check & build, verify everything works
- [ ] 7. Write handoff report

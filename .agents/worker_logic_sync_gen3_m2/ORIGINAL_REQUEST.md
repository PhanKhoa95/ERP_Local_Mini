## 2026-07-01T08:04:09Z
You are teamwork_preview_worker.
Your working directory is: y:\ERP_Local_Mini\.agents\worker_logic_sync_gen3_m2
Your mission is to implement fixes and unit tests for the following issues in the repository:
1. R1.1 Order Payment Status: Dynamically calculate payment_status ("unpaid", "partial", "paid") based on paid_amount vs total in both local and Supabase modes.
   - Target: src/hooks/usePaymentTransactions.ts
2. R1.2 Casso Manual Match: Create UI and mutations to manually reconciliation unmatched bank transactions to orders, updating payment_transactions and the order status.
   - Target: src/components/finance/CassoReconciliation.tsx, src/hooks/usePaymentTransactions.ts (or new code/hook/mutation)
3. R1.7 Voucher budget check: Check project budget before creating expense/payment vouchers, throwing validation errors if budget exceeded.
   - Target: src/hooks/useCashVouchers.ts
4. R2.4 Casso timezone sync: Parse and append GMT+7 (+07:00) timezone offset to Casso raw date-time strings to save them correctly in UTC.
   - Target: Casso sync parsing logic when creating/syncing bank transaction records.

For detailed analysis, refer to y:\ERP_Local_Mini\.agents\explorer_logic_sync_gen3_1\analysis.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please write/update unit tests for all implemented features, and verify by running:
1. Build command: npm run build
2. Test command: npm run test or vitest run

Once completed, write a handoff.md in your working directory with the changes made, build/test results, and send a message back to me (parent).

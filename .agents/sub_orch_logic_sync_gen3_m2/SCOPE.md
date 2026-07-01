# Scope: Finance & Casso Reconciliation (Milestone 2)

## Architecture
- React Query hooks for bank transactions (`useBankTransactions`), payment transactions (`usePaymentTransactions`), and cash vouchers (`useCashVouchers`).
- Local storage and Supabase storage layers for bank transactions.
- Reconciliation logic linking `bank_transactions`, `payment_transactions`, and `orders`.
- Budget validation constraints during cash voucher creation.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Order Payment Status (R1.1) | Dynamically calculate payment_status ("unpaid", "partial", "paid") based on paid_amount vs total in both local and Supabase modes inside `usePaymentTransactions.ts`. | None | PLANNED |
| 2 | Casso Manual Match UI & Mutation (R1.2) | Build manual match button, modal listing active orders, and matching mutation in `CassoReconciliation.tsx` and custom hook. | M1 | PLANNED |
| 3 | Casso Timezone Sync (R2.4) | Parse casso date-time strings (e.g. `2026-06-22 14:10:02`), append `+07:00` offset, and save to database/local-storage in UTC. | M2 | PLANNED |
| 4 | Voucher Budget Check (R1.7) | Check project budget from local storage/db before creating expense cash vouchers, throwing error if exceeded. | None | PLANNED |

## Interface Contracts
### `usePaymentTransactions` & `useBankTransactions`
- `useBankTransactions()` hook:
  - `bankTransactions`: `BankTransaction[]`
  - `syncBankTransactions`: mutation to trigger fetching/syncing
  - `matchBankTransaction`: mutation to link unmatched transaction to order
- `usePaymentTransactions`:
  - Triggers dynamic order payment status calculation.
- `useCashVouchers`:
  - `createVoucher` payload includes `project_id`, which triggers budget limit validations.

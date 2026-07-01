# Scope: Logic Resolution & Data Sync

## Architecture
- React Query hooks (`useProducts`, `useOrders`, `usePaymentTransactions`, `useProductBom`, `useWarehouseStock`, `useCashVouchers`, `useDashboardStats`)
- Components (`ProductDialog`, `CategoriesTab`, `SalesPoliciesTab`, `PartnerDetailDialog`, `CassoReconciliation`, `Reports`)
- Local Storage store `localInventoryStore.ts` and Supabase clients.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Products, Inventory, and BOM | R1.3, R1.4, R1.5, R1.8, R2.1, R2.2, R2.3 | none | IN_PROGRESS (c399e4ef-509c-410b-9aed-88ff225acae4) |
| 2 | Finance and Casso Reconciliation | R1.1, R1.2, R1.7, R2.4 | none | IN_PROGRESS (67585048-4524-4e7c-9b95-0a4b73f1481e) |
| 3 | Reports, Settings, and Audit Log | R1.6, R2.5 | M1, M2 | PLANNED |

## Interface Contracts
- No new cross-module interface contracts. Existing hook signatures are extended with optional parameters or backward-compatible types.

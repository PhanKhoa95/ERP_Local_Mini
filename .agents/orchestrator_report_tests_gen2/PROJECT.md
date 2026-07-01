# Project: Report Calculation Logic & Stats Testing

## Architecture
- Target Hook: `src/hooks/useReportStats.ts`
- Functions to test:
  - `useRevenueReport`
  - `useProductReport`
  - `useInventoryReport`
  - `useOrderReport`
  - `usePartnerReport`
- Data Sources: local storage is used when `isLocalDemoAuthEnabled()` is true.
- Test runner: Vitest in JSDOM environment, using `@testing-library/react` (`renderHook`) and `@tanstack/react-query` (`QueryClientProvider`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Explore & Analyze | Read `useReportStats.ts` details, verify how it reads localStorage and localDemoAuth. | None | DONE |
| 2 | Create Test Suite | Write `src/hooks/__tests__/useReportStats.test.ts` covering R1, R2, and R3. | M1 | DONE |
| 3 | Verify & Audit | Run tests, verify they pass 100%, run integrity audits. | M2 | DONE |

## Interface Contracts
- The tests mock the following keys in localStorage:
  - `erp-mini-local-demo-orders` (orders and order_items)
  - `erp-mini-local-demo-products` (products)
  - `erp-mini-local-demo-sales-channels` (channels)
  - `erp-mini-local-demo-inventory-transactions` (transactions)
  - `erp-mini-local-demo-partners` (partners)
  - `erp-mini-local-demo-payment-transactions` (payment transactions)
- Subagent must mock `isLocalDemoAuthEnabled` from `@/lib/localDemoAuth` to return `true`.

## 2026-06-30T06:03:03Z
You are the Report Tests Worker.
Your task is to write a comprehensive test suite for `src/hooks/useReportStats.ts` inside `src/hooks/__tests__/useReportStats.test.tsx`.
You MUST read `y:\ERP_Local_Mini\.agents\explorer_report_tests\analysis.md` for schemas, date boundaries, and scaling strategy.

Requirements to fulfill:
- R1: Revenue & Sales Report Tests:
  - Test calculation accuracy for totalRevenue, totalCOGS, grossProfit, profitMargin.
  - Test dailyChart and channelChart grouping.
- R2: Product & Inventory Report Tests:
  - Test Top Selling, Top Revenue, Top Profit, and Slow Moving lists.
  - Test totalStock, totalValue, lowStock, and outOfStock counts.
- R3: Partner & Order Report Tests:
  - Test customer debt calculation and static supplier debt copying.
  - Test fulfillmentRate, cancelRate, returnRate, and averageOrderValue calculations.
  - Test status counts and payment transactions mapping.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Technical specifications:
1. Mock `@/lib/localDemoAuth` to return `true` for `isLocalDemoAuthEnabled()`.
2. Mock `localStorage` properly and clean up `localStorage` in `beforeEach` and `afterEach` hooks.
3. Wrap the hooks in a fresh `QueryClientProvider` per test using a custom render wrapper or inline wrapper, to ensure React Query cache does not leak across tests. Use `renderHook` and `waitFor` from `@testing-library/react`.
4. Test edge cases:
   - Date range boundaries (orders exactly on boundaries vs outside boundaries).
   - Empty databases (empty localStorage lists for all items) to verify division by zero guards and NaN/Infinity avoidance.
   - High volume scaling (seed 200+ orders, products, etc. and assert that top list slices and transaction limits function correctly).
5. Run Vitest command to execute the tests: `npx vitest run src/hooks/__tests__/useReportStats.test.tsx` and verify that they pass 100%.

Write your work progress to `y:\ERP_Local_Mini\.agents\worker_report_tests\changes.md` and handoff report to `y:\ERP_Local_Mini\.agents\worker_report_tests\handoff.md`.
Use workspace path: y:\ERP_Local_Mini\.agents\worker_report_tests
Report back when finished.

## 2026-06-30T13:01:13+07:00
You are the Report Tests Explorer.
Analyze the target hook file: `src/hooks/useReportStats.ts` and investigate how it queries localStorage data when `isLocalDemoAuthEnabled()` is true.
We need to test the logic of:
- `useRevenueReport` (totalRevenue, totalCOGS, grossProfit, profitMargin, dailyChart, channelChart)
- `useProductReport` (top selling, top revenue, top profit, slow moving)
- `useInventoryReport` (totalStock, totalValue, lowStock, outOfStock, recent transactions)
- `useOrderReport` (fulfillmentRate, cancelRate, returnRate, statusCounts, avgOrderValue)
- `usePartnerReport` (debt_amount, totalCustomerRevenue, customer list, supplier list, topCustomersByRevenue, topCustomersByOrders, etc.)

Check how mock `localStorage` should be set up, how `@tanstack/react-query` hooks should be wrapped with `QueryClientProvider` and tested using `renderHook` from `@testing-library/react`.
Determine the exact mock data schemas for:
- `erp-mini-local-demo-orders`
- `erp-mini-local-demo-products`
- `erp-mini-local-demo-sales-channels`
- `erp-mini-local-demo-inventory-transactions`
- `erp-mini-local-demo-partners`
- `erp-mini-local-demo-payment-transactions`

Write your findings to `y:\ERP_Local_Mini\.agents\explorer_report_tests\analysis.md`. Include a detailed strategy for the Vitest test cases, verifying calculations under data scaling, and clean localStorage mock teardown.
Produce a handoff report at `y:\ERP_Local_Mini\.agents\explorer_report_tests\handoff.md`.
Use workspace path: y:\ERP_Local_Mini\.agents\explorer_report_tests
Report back when finished.

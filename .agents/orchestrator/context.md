# Project Context: Centralized Event-Driven Observer

## System Architecture Overview
The application is a local-first ERP dashboard. Under local demo mode (`isLocalDemoAuthEnabled() === true`), data is read/written to `localStorage` instead of Supabase.
React Query manages UI state cache.

## Local Storage Schema & Keys
- **Orders**: `erp-mini-local-demo-orders` (key: `LOCAL_ORDERS_KEY` in `useOrders.ts`)
- **Products/Inventory**: `erp-mini-local-demo-products` (key: `PRODUCTS_KEY` in `localInventoryStore.ts`)
- **Payment Transactions**: `erp-mini-local-demo-payment-transactions` (key: `TRANSACTIONS_KEY` in `usePaymentTransactions.ts`)
- **Partners**: `erp-mini-local-demo-partners` (key: `PARTNERS_KEY` in `usePartners.ts`)
- **Journal Entries**: `erp-mini-local-demo-journal-entries` (key: `LOCAL_ENTRIES_KEY` in `useAccounting.ts`)
- **Journal Lines**: `erp-mini-local-demo-journal-lines` (key: `LOCAL_LINES_KEY` in `useAccounting.ts`)

## Business Logic Rules & Handlers

### 1. Inventory Handler
- **Trigger event**: `ORDER_CREATED`
- **Logic**: For each product in the order, decrement its `stock_quantity` in `erp-mini-local-demo-products` by the quantity purchased. Create an inventory transaction of type `out` with notes referencing the order number.

### 2. Accounting Ledger Handler (Double Entry Bookkeeping)
- **Trigger event**: `ORDER_CREATED`
  - **Debit**: Phải thu khách hàng (account `131`) -> `total_amount`
  - **Credit**: Doanh thu bán hàng (account `511`) -> `total_amount`
  - **Debit**: Giá vốn bán hàng (account `632`) -> `cost_amount` (calculated as `total_amount * 0.47`)
  - **Credit**: Hàng hóa (account `156`) -> `cost_amount`
- **Trigger event**: `PAYMENT_RECORDED` (where transaction_type = `payment_in`)
  - **Debit**: Tiền gửi ngân hàng (`1121` if payment method is `vietqr`/`bank_transfer`) or Tiền mặt (`1111` if cash) -> `amount`
  - **Credit**: Phải thu khách hàng (account `131`) -> `amount`

### 3. Partner Debt Handler
- **Trigger event**: `ORDER_CREATED`
  - Increase the partner's (customer's) `debt_amount` in `erp-mini-local-demo-partners` by the order `total`.
- **Trigger event**: `PAYMENT_RECORDED`
  - Decrease the partner's `debt_amount` in `erp-mini-local-demo-partners` by the payment `amount`.

### 4. Query Invalidation / UI Sync
- After events are processed, React Query keys must be invalidated to force UI components to re-fetch:
  - `["orders"]`
  - `["products"]`
  - `["journal-entries"]`
  - `["partners"]`
  - `["payment-transactions"]`
  - `["debt-summary"]`
  - `["finance-stats"]`
  - `["dashboard-stats"]`

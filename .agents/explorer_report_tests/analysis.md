# Report Stats Hook Analysis & Test Strategy Plan

## Executive Summary
This document analyzes the React Query hooks inside `src/hooks/useReportStats.ts` and details the strategy to test them in a localized development mode (`isLocalDemoAuthEnabled() === true`). It establishes mock data schemas, Vitest setup patterns, date range edge cases, calculation formulas, and data-scaling test strategies.

---

## 1. Key Findings Summary

| Hook | Data Source (LocalStorage Keys) | Key Calculations | Critical Caveats |
| :--- | :--- | :--- | :--- |
| **`useRevenueReport`** | `erp-mini-local-demo-orders`<br>`erp-mini-local-demo-sales-channels` | Total Revenue, Total COGS, Gross Profit, Profit Margin, Daily Chart, Channel Chart. | • Relies on nested `order_items` and `products` fields in order records to calculate COGS.<br>• Filters out orders with status not in `["delivered", "confirmed", "processing", "shipping"]`. |
| **`useProductReport`** | `erp-mini-local-demo-orders` | Top Selling, Top Revenue, Top Profit, Slow Moving products, Total Sold Quantity. | • Slow-moving list only reflects products that have **at least one order** within the date range. Products with 0 sales are entirely omitted.<br>• Flattens nested `order_items` array in filtered orders. |
| **`useInventoryReport`** | `erp-mini-local-demo-products`<br>`erp-mini-local-demo-inventory-transactions` | Total Stock Quantity, Total Stock Value, Low Stock Count/Products, Out of Stock Count/Products, Mapped Recent Transactions. | • Filters out inactive products (`is_active === false`).<br>• Mapped transactions are limited to `slice(0, 100)`. |
| **`useOrderReport`** | `erp-mini-local-demo-orders` | Total Orders, Status Counts, Fulfillment Rate, Cancel Rate, Return Rate, Average Order Value. | • Does **not** filter by status during date filtration. All statuses within range are calculated.<br>• Return rate is calculated relative to **delivered orders** (`returned / delivered`), not total orders. |
| **`usePartnerReport`** | `erp-mini-local-demo-partners`<br>`erp-mini-local-demo-orders`<br>`erp-mini-local-demo-payment-transactions` | Total Customer Revenue, Total Customer/Supplier Debt, Top Customers by Revenue/Orders, Customers/Suppliers with Debt. | • Customer debt is calculated as `revenue - paidAmount` dynamically.<br>• Supplier debt **ignores** transaction calculations and directly copies `partner.debt_amount` from the partner object. |

---

## 2. Deep-Dive Hook Logic & Query Behavior

### useRevenueReport
- **Query Key:** `["revenue-report", dateRange.from, dateRange.to]`
- **Status Filter:** Only processes orders with status: `delivered`, `confirmed`, `processing`, or `shipping`.
- **Formulas:**
  - $\text{Total Revenue} = \sum (\text{order.total})$
  - $\text{Total COGS} = \sum_{orders} \sum_{items} (\text{item.products.cost\_price} \times \text{item.quantity})$
  - $\text{Gross Profit} = \text{Total Revenue} - \text{Total COGS}$
  - $\text{Profit Margin (\%)} = \frac{\text{Gross Profit}}{\text{Total Revenue}} \times 100$ (Guarded against division by zero: returns `0` if Total Revenue $\le 0$).
- **Daily Charting:** Grouped by format `"dd/MM"` of order date (`order_date` or `created_at`).
- **Channel Charting:** Matches order `channel_id` with `sales_channel.id` to retrieve the channel name (defaults to `"Khác"`) and color (defaults to `"#6B7280"`).

### useProductReport
- **Query Key:** `["product-report", dateRange.from, dateRange.to]`
- **Formulas:**
  - $\text{Revenue per Product} = \sum (\text{item.total} \text{ or } [(\text{item.quantity} \times \text{item.unit\_price}) - \text{item.discount}])$
  - $\text{Cost per Product} = \sum (\text{item.products.cost\_price} \times \text{item.quantity})$
  - $\text{Profit per Product} = \text{Revenue} - \text{Cost}$
- **Sorting Logic:**
  - `topSelling`: Sort by quantity descending.
  - `topRevenue`: Sort by revenue descending.
  - `topProfit`: Sort by profit descending.
  - `slowMoving`: Sort by quantity ascending. (Max 10 items for each list).

### useInventoryReport
- **Query Key:** `["inventory-report"]` (Static key, does not react to date changes).
- **Formulas:**
  - $\text{Total Stock} = \sum (\text{product.stock\_quantity})$
  - $\text{Total Value} = \sum (\text{product.stock\_quantity} \times \text{product.cost\_price})$
  - Low Stock: $\text{product.stock\_quantity} \le \text{product.min\_stock}$
  - Out of Stock: $\text{product.stock\_quantity} = 0$
- **Transaction Mapping:** Iterates through transactions and embeds product details `name`, `sku`, and `company_id`.

### useOrderReport
- **Query Key:** `["order-report", dateRange.from, dateRange.to]`
- **Formulas:**
  - $\text{Fulfillment Rate (\%)} = \frac{\text{statusCounts["delivered"]}}{\text{totalOrders}} \times 100$
  - $\text{Cancel Rate (\%)} = \frac{\text{statusCounts["cancelled"]}}{\text{totalOrders}} \times 100$
  - $\text{Return Rate (\%)} = \frac{\text{statusCounts["returned"]}}{\text{statusCounts["delivered"]}} \times 100$ (Guarded against division by zero: returns `0` if Delivered Orders $\le 0$).
  - $\text{Average Order Value} = \frac{\sum (\text{order.total})}{\text{totalOrders}}$

### usePartnerReport
- **Query Key:** `["partner-report", dateRange.from, dateRange.to]`
- **Customer Stat Calculations:**
  - Aggregates orders matching `partner_id` to compute `revenue` and initial `paidAmount`.
  - Loops over payments with `transaction_type` in `["receipt", "payment_in", "receivable"]` to add to `paidAmount`.
  - $\text{Customer Debt} = \text{Revenue} - \text{Paid Amount}$
- **Supplier Stat Calculations:**
  - Loops over payments with `transaction_type` in `["payment", "payment_out", "payable"]` to calculate `paidAmount`.
  - **Note:** Supplier debt is assigned as `Number(partner.debt_amount) || 0` directly from the partner metadata, bypassing payment transaction calculations.
- **Top Metrics:** Sorted lists for top customers by revenue and order counts, and filtered list of customers/suppliers with non-zero debts.

---

## 3. Storage Mock Data Schemas

To correctly test these hooks, mock data in `localStorage` must match these precise TypeScript models:

### Schema 1: `erp-mini-local-demo-orders`
```typescript
interface MockOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount?: number;
  total?: number;
  products?: {
    id: string;
    name: string;
    sku: string;
    cost_price: number;
  };
}

interface MockOrder {
  id: string;
  company_id: string;
  order_number: string;
  status: "delivered" | "confirmed" | "processing" | "shipping" | "cancelled" | "returned";
  total: number;
  paid_amount: number;
  customer_name?: string;
  order_date?: string; // ISO Format (e.g. 2026-06-30T12:00:00.000Z)
  created_at: string;  // Fallback date if order_date is missing
  channel_id?: string;
  partner_id?: string;
  order_items: MockOrderItem[];
}
```

### Schema 2: `erp-mini-local-demo-products`
```typescript
interface MockProduct {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  company_id: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock: number;
  unit: string | null;
  is_active: boolean;
  is_service: boolean;
  created_at: string;
  updated_at: string;
}
```

### Schema 3: `erp-mini-local-demo-sales-channels`
```typescript
interface MockSalesChannel {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  company_id: string;
  color?: string; // Critical for matching charts
  created_at: string;
  updated_at: string;
}
```

### Schema 4: `erp-mini-local-demo-inventory-transactions`
```typescript
interface MockInventoryTransaction {
  id: string;
  product_id: string;
  transaction_type: "in" | "out";
  quantity: number; // Signed or unsigned value matching type direction
  notes?: string | null;
  reference_id?: string | null;
  reference_type?: string | null;
  created_by?: string;
  created_at: string;
}
```

### Schema 5: `erp-mini-local-demo-partners`
```typescript
interface MockPartner {
  id: string;
  name: string;
  code: string;
  partner_type: "customer" | "supplier" | "both";
  debt_amount: number; // Critical for supplier debt reporting
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}
```

### Schema 6: `erp-mini-local-demo-payment-transactions`
```typescript
interface MockPaymentTransaction {
  id: string;
  partner_id: string;
  order_id: string | null;
  transaction_type: "receivable" | "payable" | "payment_in" | "payment_out" | "receipt" | "payment";
  amount: number;
  transaction_date?: string; // ISO Format
  created_at: string;        // Fallback date
}
```

---

## 4. Test Strategy & Architecture (Vitest)

### A. Environment Mocking & Setup
To run tests targeting local demo branches, configure the Vitest mock setup:

```typescript
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";

// Mock the demo check to enforce localStorage branches
vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => true,
  LOCAL_DEMO_COMPANY_ID: "demo-company",
  LOCAL_DEMO_USER_ID: "demo-user",
}));

// Clean up sandbox between tests to prevent cache leak
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

### B. QueryClient Wrapper Helper
Query state must be fresh for every test block:

```typescript
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Prevents Vitest from stalling on failures
      gcTime: 0,    // Instantly drops garbage collection to preserve RAM
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);
```

### C. Date Boundary Handling Strategy
Hooks filter dates via ISO string comparisons: `orderDate >= startStr && orderDate <= endStr`.
- **Inclusivity Test:** Verify that orders exactly matching `dateRange.from` and `dateRange.to` boundaries are included.
- **Exclusivity Test:** Ensure that orders 1 millisecond outside the date range are excluded.
- **Null Safety:** Verify fallback behavior when `order_date` is omitted and `created_at` is evaluated.

```typescript
const fromDate = new Date("2026-06-01T00:00:00.000Z");
const toDate = new Date("2026-06-30T23:59:59.999Z");

// Order on start boundary
const orderOnBoundary = {
  id: "ord-bound-1",
  created_at: "2026-06-01T00:00:00.000Z",
  status: "delivered",
  total: 100,
  order_items: []
};

// Order just outside end boundary
const orderOutBoundary = {
  id: "ord-bound-2",
  created_at: "2026-07-01T00:00:00.000Z",
  status: "delivered",
  total: 200,
  order_items: []
};
```

### D. Data Scaling & Stress Strategy
Verify calculations behave correctly under different sizes and values of data:
1. **Empty Arrays (`[]`):**
   - Ensure hooks do not throw runtime exceptions.
   - Assert all totals, margins, and rates return `0` instead of `NaN` or `Infinity`.
2. **Null/Undefined Handling:**
   - Orders without `order_items` should not crash (should fallback to empty arrays or sum to 0 COGS).
   - Incomplete product metadata (e.g. missing `cost_price` or missing `products` object in items) must fallback to `0` or `N/A`.
3. **High Volume Scaling:**
   - Put 500+ mock records in `localStorage`.
   - Assert that slicing operations (e.g. recent transactions slice of `100`, top lists slice of `10`) execute correctly without freezing the jsdom runner.

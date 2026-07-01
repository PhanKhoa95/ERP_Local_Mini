import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useRevenueReport,
  useProductReport,
  useInventoryReport,
  useOrderReport,
  usePartnerReport,
} from "../useReportStats";

// Dynamic flag to toggle local demo mode in tests
let demoAuthEnabled = true;

vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => demoAuthEnabled,
  LOCAL_DEMO_COMPANY_ID: "00000000-0000-4000-8000-000000000001",
  LOCAL_DEMO_USER_ID: "00000000-0000-4000-8000-000000000002",
}));

// Supabase mock setup to support custom responses
const mockSupabaseQueryResponses: Record<string, any> = {
  products: { data: [], error: null },
  inventory_transactions: { data: [], error: null },
  orders: { data: [], error: null },
  order_items: { data: [], error: null },
  partners: { data: [], error: null },
  payment_transactions: { data: [], error: null },
};

// Mock Supabase with chaining capabilities
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const builder: any = {};
      builder.select = vi.fn((query?: string) => {
        // Return a mock promise if it's the end of a simple chain
        const promise: any = Promise.resolve(mockSupabaseQueryResponses[table] || { data: [], error: null });
        
        // Add chain methods
        promise.eq = vi.fn().mockReturnValue(promise);
        promise.gte = vi.fn().mockReturnValue(promise);
        promise.lte = vi.fn().mockReturnValue(promise);
        promise.in = vi.fn().mockReturnValue(promise);
        promise.not = vi.fn().mockReturnValue(promise);
        promise.order = vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockSupabaseQueryResponses[table] || { data: [], error: null }),
        });
        
        return promise;
      });
      return builder;
    },
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

const DATE_RANGE_JUNE_2026 = {
  from: new Date("2026-06-01T00:00:00.000Z"),
  to: new Date("2026-06-30T23:59:59.999Z"),
};

describe("useReportStats Challenge & Robustness Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    demoAuthEnabled = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Fault 1: Invalid dates in dateRange", () => {
    it("should crash when provided with an invalid Date object", async () => {
      const invalidRange = {
        from: new Date("invalid-date-string"),
        to: new Date("2026-06-30"),
      };

      const { result } = renderHook(() => useRevenueReport(invalidRange), { wrapper });

      // We expect the query to fail because `toISOString` or `format` throws on invalid dates.
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain("Invalid time value");
    });
  });

  describe("Fault 2: Malformed or missing order dates in orders database", () => {
    it("should filter out order with missing/malformed dateDate (dropping it silently)", async () => {
      const mockOrders = [
        {
          id: "o1",
          status: "delivered",
          total: 100,
          // order_date and created_at both missing/undefined
          order_items: [],
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useRevenueReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // The order is silently dropped because undefined comparison fails, returning 0 orders instead of crashing.
      expect(result.current.data!.orderCount).toBe(0);
    });

    it("should throw RangeError when order date passes filter but is invalid format", async () => {
      const mockOrders = [
        {
          id: "o1",
          status: "delivered",
          total: 100,
          order_date: "2026-06-15-invalid", // passes range check alphabetically but is invalid date format
          order_items: [],
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useRevenueReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toContain("Invalid time value");
    });
  });

  describe("Fault 3: Missing quantity or product info in order items (NaN propagation and silent bugs)", () => {
    it("should evaluate totalCOGS to 0 (silent cost suppression) instead of NaN if item.quantity is undefined", async () => {
      const mockOrders = [
        {
          id: "o1",
          status: "delivered",
          total: 1000,
          order_date: "2026-06-10T10:00:00.000Z",
          order_items: [
            {
              product_id: "p1",
              quantity: undefined, // missing
              products: { cost_price: 300 },
            },
          ],
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useRevenueReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const data = result.current.data!;
      // Because the code does `o.order_items?.reduce(...) || 0`, NaN is coalesced to 0.
      // This is a silent logic bug: COGS is reported as 0, which makes gross profit incorrect!
      expect(data.totalCOGS).toBe(0);
      expect(data.grossProfit).toBe(1000);
    });

    it("should propagate NaN in product stats if item.quantity is a non-numeric string", async () => {
      const mockOrders = [
        {
          id: "o1",
          status: "delivered",
          order_date: "2026-06-10T10:00:00.000Z",
          order_items: [
            {
              product_id: "p1",
              quantity: "invalid" as any, // non-numeric string
              unit_price: 100,
              total: undefined,
              products: { id: "p1", name: "P1", sku: "S1", cost_price: 10 },
            },
          ],
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useProductReport(DATE_RANGE_JUNE_2026), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const data = result.current.data!;
      // NaN propagates in revenue and profit because "invalid" * 100 evaluates to NaN.
      expect(data.topSelling[0].revenue).toBeNaN();
      expect(data.topSelling[0].profit).toBeNaN();
    });
  });

  describe("Fault 4: Negative stock quantities handling", () => {
    it("does not classify a negative stock product as outOfStock", async () => {
      const mockProducts = [
        {
          id: "p-neg",
          name: "Neg Product",
          sku: "SKU-NEG",
          cost_price: 10,
          stock_quantity: -5, // Negative stock
          min_stock: 2,
          is_active: true,
          company_id: "comp-1",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(mockProducts));

      const { result } = renderHook(() => useInventoryReport(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const data = result.current.data!;
      
      // Negative stock is <= min_stock, so it should count as low stock.
      expect(data.lowStockCount).toBe(1);
      
      // Critical Check: Out of Stock is strictly quantity === 0, so negative stock is NOT counted as out of stock!
      expect(data.outOfStockCount).toBe(0);
      expect(data.outOfStockProducts).toHaveLength(0);
    });
  });

  describe("Fault 5: Mismatch between Supabase Production branch and Local Demo Auth branch in useInventoryReport", () => {
    it("fails to populate 'products' detail on transactions in production (Supabase mode)", async () => {
      demoAuthEnabled = false; // Turn off local demo mode to run Supabase branch

      // Setup mock data for Supabase
      mockSupabaseQueryResponses.products = {
        data: [{ id: "p1", name: "Product 1", sku: "SKU-1", is_active: true, stock_quantity: 10, cost_price: 50, min_stock: 5 }],
        error: null,
      };
      
      mockSupabaseQueryResponses.inventory_transactions = {
        data: [{ id: "tx-1", product_id: "p1", transaction_type: "in", quantity: 10, created_at: "2026-06-15T00:00:00Z" }],
        error: null,
      };

      const { result } = renderHook(() => useInventoryReport(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const data = result.current.data!;

      // Confirm transaction exists
      expect(data.recentTransactions).toHaveLength(1);
      
      // Verify that in production (Supabase), the 'products' object is completely missing/undefined!
      // This is because the supabase query is .select('*') on inventory_transactions instead of joining products.
      expect(data.recentTransactions[0].products).toBeUndefined();
    });
  });

  describe("Fault 6: Supplier Stats and orderCount/purchaseAmount remain 0", () => {
    it("never updates purchaseAmount or orderCount for suppliers regardless of orders", async () => {
      const mockPartners = [
        { id: "s-1", name: "Supplier 1", code: "S1", partner_type: "supplier", debt_amount: 400 },
      ];
      localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));

      // Order with supplier
      const mockOrders = [
        {
          id: "o1",
          partner_id: "s-1",
          total: 1000,
          paid_amount: 500,
          status: "delivered",
          order_date: "2026-06-10T00:00:00Z",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => usePartnerReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const data = result.current.data!;

      const supplier = data.suppliersWithDebt.find(s => s.id === "s-1");
      expect(supplier).toBeDefined();
      
      // Even though there is an order associated with the supplier,
      // orderCount and purchaseAmount are 0 because orders are only processed if type is customer/both.
      expect(supplier?.orderCount).toBe(0);
      expect(supplier?.purchaseAmount).toBe(0);
    });
  });

  describe("Fault 7: Case sensitivity in transaction types causes payments to be ignored", () => {
    it("ignores payments with uppercase or unexpected transaction types, causing wrong debt calculations", async () => {
      const mockPartners = [
        { id: "c-1", name: "Customer 1", code: "C1", partner_type: "customer", debt_amount: 0 },
      ];
      localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));

      const mockOrders = [
        {
          id: "o1",
          partner_id: "c-1",
          total: 1000,
          paid_amount: 0,
          status: "delivered",
          order_date: "2026-06-10T00:00:00Z",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const mockPayments = [
        {
          id: "pm-1",
          partner_id: "c-1",
          transaction_type: "Receipt", // Uppercase R -> should be ignored by hook strict check === "receipt"
          amount: 600,
          transaction_date: "2026-06-11T00:00:00Z",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-payment-transactions", JSON.stringify(mockPayments));

      const { result } = renderHook(() => usePartnerReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const data = result.current.data!;

      const cust = data.customersWithDebt.find(c => c.id === "c-1");
      expect(cust).toBeDefined();
      
      // If payment was parsed correctly: debt = 1000 - 600 = 400.
      // But because "Receipt" is ignored, debt is 1000 - 0 = 1000.
      expect(cust?.paidAmount).toBe(0);
      expect(cust?.debt).toBe(1000);
    });
  });

  describe("Fault 8: Double-counting of customer payments", () => {
    it("double-counts payment transactions that are already included in order.paid_amount, resulting in negative/incorrect debt", async () => {
      const mockPartners = [
        { id: "c-1", name: "Customer 1", code: "C1", partner_type: "customer", debt_amount: 0 },
      ];
      localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));

      // Order with paid_amount = 800
      const mockOrders = [
        {
          id: "o1",
          partner_id: "c-1",
          total: 1000,
          paid_amount: 800,
          status: "delivered",
          order_date: "2026-06-10T00:00:00Z",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      // Payment transaction representing the same 800 payment
      const mockPayments = [
        {
          id: "pm-1",
          partner_id: "c-1",
          order_id: "o1",
          transaction_type: "payment_in",
          amount: 800,
          transaction_date: "2026-06-10T05:00:00Z",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-payment-transactions", JSON.stringify(mockPayments));

      const { result } = renderHook(() => usePartnerReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const data = result.current.data!;

      const cust = data.customersWithDebt.find(c => c.id === "c-1");
      
      // If the hook correctly avoided double counting, paidAmount would be 800 and debt would be 200.
      // But due to double-counting, paidAmount will be 1600 and debt will be -600 (represented as 0 or excluded from customersWithDebt if debt <= 0).
      // Let's assert that it indeed double counts (paidAmount is 1600).
      const allCustomers = data.topCustomersByRevenue;
      const custData = allCustomers.find(c => c.id === "c-1");
      expect(custData).toBeDefined();
      expect(custData?.paidAmount).toBe(1600); // Proves the double counting exists!
      expect(custData?.debt).toBe(-600); // Proves negative debt due to double counting!
    });
  });
});

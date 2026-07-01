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

// Mock the demo check to enforce localStorage branches
vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => true,
  LOCAL_DEMO_COMPANY_ID: "00000000-0000-4000-8000-000000000001",
  LOCAL_DEMO_USER_ID: "00000000-0000-4000-8000-000000000002",
}));

// Mock supabase client to prevent initialization errors during test runs
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        gte: () => ({
          lte: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

// Helper to create a fresh QueryClient for each test
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

// Wrap component to provide QueryClient
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

const DATE_RANGE_JUNE_2026 = {
  from: new Date("2026-06-01T00:00:00.000Z"),
  to: new Date("2026-06-30T23:59:59.999Z"),
};

describe("useReportStats Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("R1: Revenue & Sales Report Tests", () => {
    it("should calculate revenue metrics and groupings correctly in range with correct status", async () => {
      // Setup mock sales channels
      const mockChannels = [
        { id: "chan-1", name: "Shopee", color: "#FF5722" },
        { id: "chan-2", name: "Lazada", color: "#00BCD4" },
      ];
      localStorage.setItem("erp-mini-local-demo-sales-channels", JSON.stringify(mockChannels));

      // Setup mock orders
      const mockOrders = [
        // Order 1: In range, delivered status, Shopee channel
        {
          id: "o1",
          status: "delivered",
          total: 1000,
          channel_id: "chan-1",
          order_date: "2026-06-10T10:00:00.000Z",
          order_items: [
            {
              product_id: "p1",
              quantity: 2,
              products: { cost_price: 300 },
            },
          ],
        },
        // Order 2: In range, processing status, Lazada channel
        {
          id: "o2",
          status: "processing",
          total: 500,
          channel_id: "chan-2",
          order_date: "2026-06-11T12:00:00.000Z",
          order_items: [
            {
              product_id: "p2",
              quantity: 1,
              products: { cost_price: 200 },
            },
          ],
        },
        // Order 3: In range, but invalid status (cancelled) -> excluded
        {
          id: "o3",
          status: "cancelled",
          total: 300,
          channel_id: "chan-1",
          order_date: "2026-06-12T15:00:00.000Z",
          order_items: [
            {
              product_id: "p1",
              quantity: 1,
              products: { cost_price: 300 },
            },
          ],
        },
        // Order 4: Outside range, delivered status -> excluded
        {
          id: "o4",
          status: "delivered",
          total: 2000,
          channel_id: "chan-1",
          order_date: "2026-07-01T00:00:00.000Z",
          order_items: [
            {
              product_id: "p1",
              quantity: 1,
              products: { cost_price: 300 },
            },
          ],
        },
        // Order 5: In range, shipping status, no channel (fallback testing)
        {
          id: "o5",
          status: "shipping",
          total: 200,
          order_date: "2026-06-15T09:00:00.000Z",
          order_items: [],
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useRevenueReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const data = result.current.data!;
      // Calculations:
      // Orders included: o1 (1000), o2 (500), o5 (200). Total: 1700
      expect(data.totalRevenue).toBe(1700);

      // COGS: o1 (2 * 300 = 600) + o2 (1 * 200 = 200) + o5 (0). Total: 800
      expect(data.totalCOGS).toBe(800);
      expect(data.grossProfit).toBe(900);
      expect(data.profitMargin).toBeCloseTo((900 / 1700) * 100);
      expect(data.orderCount).toBe(3);

      // Daily chart grouping checking (formatted as dd/MM)
      // "10/06" -> o1 (total: 1000, profit: 1000 - 600 = 400)
      // "11/06" -> o2 (total: 500, profit: 500 - 200 = 300)
      // "15/06" -> o5 (total: 200, profit: 200 - 0 = 200)
      expect(data.dailyChart).toHaveLength(3);
      const dailyMap = new Map(data.dailyChart.map((d) => [d.date, d]));
      expect(dailyMap.get("10/06")).toEqual({ date: "10/06", revenue: 1000, orders: 1, profit: 400 });
      expect(dailyMap.get("11/06")).toEqual({ date: "11/06", revenue: 500, orders: 1, profit: 300 });
      expect(dailyMap.get("15/06")).toEqual({ date: "15/06", revenue: 200, orders: 1, profit: 200 });

      // Channel chart grouping checking
      // Shopee -> o1 (1000 revenue, 1 order)
      // Lazada -> o2 (500 revenue, 1 order)
      // Khác -> o5 (200 revenue, 1 order)
      expect(data.channelChart).toHaveLength(3);
      const channelMap = new Map(data.channelChart.map((c) => [c.name, c]));
      expect(channelMap.get("Shopee")).toEqual({ name: "Shopee", revenue: 1000, orders: 1, color: "#FF5722" });
      expect(channelMap.get("Lazada")).toEqual({ name: "Lazada", revenue: 500, orders: 1, color: "#00BCD4" });
      expect(channelMap.get("Khác")).toEqual({ name: "Khác", revenue: 200, orders: 1, color: "#6B7280" });
    });
  });

  describe("R2: Product & Inventory Report Tests", () => {
    it("should calculate product report metrics and list ordering correctly", async () => {
      // Setup mock orders
      const mockOrders = [
        {
          id: "o1",
          status: "delivered",
          order_date: "2026-06-10T10:00:00.000Z",
          order_items: [
            // Product A (p-a): qty 10, total 1000, cost 400 (cost_price: 40) -> Profit: 600
            {
              product_id: "p-a",
              quantity: 10,
              total: 1000,
              products: { id: "p-a", name: "Product A", sku: "SKU-A", cost_price: 40 },
            },
            // Product B (p-b): qty 5, total 1500, cost 500 (cost_price: 100) -> Profit: 1000
            {
              product_id: "p-b",
              quantity: 5,
              total: 1500,
              products: { id: "p-b", name: "Product B", sku: "SKU-B", cost_price: 100 },
            },
          ],
        },
        {
          id: "o2",
          status: "delivered",
          order_date: "2026-06-11T12:00:00.000Z",
          order_items: [
            // Product C (p-c): qty 20, total 800, cost 600 (cost_price: 30) -> Profit: 200
            {
              product_id: "p-c",
              quantity: 20,
              total: 800,
              products: { id: "p-c", name: "Product C", sku: "SKU-C", cost_price: 30 },
            },
            // Product D (p-d): qty 1, total 100, cost 90 (cost_price: 90) -> Profit: 10
            {
              product_id: "p-d",
              quantity: 1,
              total: 100,
              products: { id: "p-d", name: "Product D", sku: "SKU-D", cost_price: 90 },
            },
          ],
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useProductReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const data = result.current.data!;
      expect(data.totalProducts).toBe(4);
      expect(data.totalQuantitySold).toBe(36); // 10 + 5 + 20 + 1

      // topSelling (qty desc): Product C (20), Product A (10), Product B (5), Product D (1)
      expect(data.topSelling[0].id).toBe("p-c");
      expect(data.topSelling[1].id).toBe("p-a");
      expect(data.topSelling[2].id).toBe("p-b");
      expect(data.topSelling[3].id).toBe("p-d");

      // topRevenue (revenue desc): Product B (1500), Product A (1000), Product C (800), Product D (100)
      expect(data.topRevenue[0].id).toBe("p-b");
      expect(data.topRevenue[1].id).toBe("p-a");
      expect(data.topRevenue[2].id).toBe("p-c");
      expect(data.topRevenue[3].id).toBe("p-d");

      // topProfit (profit desc): Product B (1000), Product A (600), Product C (200), Product D (10)
      expect(data.topProfit[0].id).toBe("p-b");
      expect(data.topProfit[1].id).toBe("p-a");
      expect(data.topProfit[2].id).toBe("p-c");
      expect(data.topProfit[3].id).toBe("p-d");

      // slowMoving (qty asc): Product D (1), Product B (5), Product A (10), Product C (20)
      expect(data.slowMoving[0].id).toBe("p-d");
      expect(data.slowMoving[1].id).toBe("p-b");
      expect(data.slowMoving[2].id).toBe("p-a");
      expect(data.slowMoving[3].id).toBe("p-c");
    });

    it("should calculate inventory report correctly, excluding inactive products and mapping transactions", async () => {
      // Setup mock products
      const mockProducts = [
        // P1: Active, enough stock
        {
          id: "p1",
          name: "Product 1",
          sku: "SKU-1",
          cost_price: 50,
          stock_quantity: 10,
          min_stock: 5,
          is_active: true,
          company_id: "comp-1",
        },
        // P2: Active, low stock
        {
          id: "p2",
          name: "Product 2",
          sku: "SKU-2",
          cost_price: 100,
          stock_quantity: 2,
          min_stock: 5,
          is_active: true,
          company_id: "comp-1",
        },
        // P3: Active, out of stock
        {
          id: "p3",
          name: "Product 3",
          sku: "SKU-3",
          cost_price: 200,
          stock_quantity: 0,
          min_stock: 0, // 0 <= 0 is true, so also low stock
          is_active: true,
          company_id: "comp-1",
        },
        // P4: Inactive -> ignored
        {
          id: "p4",
          name: "Product 4",
          sku: "SKU-4",
          cost_price: 500,
          stock_quantity: 50,
          min_stock: 5,
          is_active: false,
          company_id: "comp-1",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(mockProducts));

      // Setup mock inventory transactions
      const mockTx = [
        // Tx for P1 (active)
        {
          id: "tx-1",
          product_id: "p1",
          transaction_type: "in",
          quantity: 10,
          created_at: "2026-06-15T00:00:00Z",
        },
        // Tx for P4 (inactive) -> should be excluded by hook since P4 is filtered from products
        {
          id: "tx-2",
          product_id: "p4",
          transaction_type: "out",
          quantity: 5,
          created_at: "2026-06-16T00:00:00Z",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-inventory-transactions", JSON.stringify(mockTx));

      const { result } = renderHook(() => useInventoryReport(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const data = result.current.data!;
      expect(data.totalProducts).toBe(3); // P1, P2, P3
      expect(data.totalStock).toBe(12); // 10 + 2 + 0
      expect(data.totalValue).toBe(700); // 10*50 + 2*100 + 0*200 = 700
      expect(data.lowStockCount).toBe(2); // P2, P3
      expect(data.outOfStockCount).toBe(1); // P3
      expect(data.lowStockProducts).toHaveLength(2);
      expect(data.outOfStockProducts).toHaveLength(1);

      // Verify transaction mapping
      expect(data.recentTransactions).toHaveLength(1);
      expect(data.recentTransactions[0].id).toBe("tx-1");
      expect(data.recentTransactions[0].products).toEqual({
        name: "Product 1",
        sku: "SKU-1",
        company_id: "comp-1",
      });
    });
  });

  describe("R3: Partner & Order Report Tests", () => {
    it("should calculate order report rates and averages correctly", async () => {
      // Setup mock orders in range with various statuses
      const mockOrders = [
        { id: "o1", status: "delivered", total: 1000, order_date: "2026-06-10T00:00:00Z" },
        { id: "o2", status: "delivered", total: 2000, order_date: "2026-06-11T00:00:00Z" },
        { id: "o3", status: "cancelled", total: 500, order_date: "2026-06-12T00:00:00Z" },
        { id: "o4", status: "returned", total: 800, order_date: "2026-06-13T00:00:00Z" },
        { id: "o5", status: "processing", total: 1200, order_date: "2026-06-14T00:00:00Z" },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useOrderReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const data = result.current.data!;
      expect(data.totalOrders).toBe(5);
      expect(data.statusCounts).toEqual({
        delivered: 2,
        cancelled: 1,
        returned: 1,
        processing: 1,
      });

      // fulfillmentRate: 2 / 5 = 40%
      expect(data.fulfillmentRate).toBe(40);
      // cancelRate: 1 / 5 = 20%
      expect(data.cancelRate).toBe(20);
      // returnRate: 1 / 2 = 50% (returned relative to delivered)
      expect(data.returnRate).toBe(50);
      // avgOrderValue: 5500 / 5 = 1100
      expect(data.avgOrderValue).toBe(1100);
    });

    it("should calculate customer debts and static supplier debts properly", async () => {
      // Setup mock partners
      const mockPartners = [
        { id: "c-1", name: "Customer 1", code: "C1", partner_type: "customer", debt_amount: 0 },
        { id: "s-1", name: "Supplier 1", code: "S1", partner_type: "supplier", debt_amount: 400 },
        { id: "b-1", name: "Both 1", code: "B1", partner_type: "both", debt_amount: 150 },
      ];
      localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));

      // Setup mock orders (used for customer revenue & initial paid amount calculations)
      const mockOrders = [
        {
          id: "o1",
          partner_id: "c-1",
          total: 1200,
          paid_amount: 800,
          status: "delivered",
          order_date: "2026-06-10T00:00:00Z",
        },
        {
          id: "o2",
          partner_id: "b-1",
          total: 3000,
          paid_amount: 2000,
          status: "delivered",
          order_date: "2026-06-10T00:00:00Z",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      // Setup mock payment transactions
      const mockPayments = [
        // Cust 1 payment receipt in range -> adds 150 to paidAmount
        {
          id: "pm-1",
          partner_id: "c-1",
          transaction_type: "receipt",
          amount: 150,
          transaction_date: "2026-06-11T00:00:00Z",
        },
        // Supp 1 payment out in range -> ignored for static supplier debt but tracked in paidAmount
        {
          id: "pm-2",
          partner_id: "s-1",
          transaction_type: "payment",
          amount: 200,
          transaction_date: "2026-06-11T00:00:00Z",
        },
        // Both 1 receivable transaction in range -> adds 300 to customer paidAmount
        {
          id: "pm-3",
          partner_id: "b-1",
          transaction_type: "receivable",
          amount: 300,
          transaction_date: "2026-06-11T00:00:00Z",
        },
      ];
      localStorage.setItem("erp-mini-local-demo-payment-transactions", JSON.stringify(mockPayments));

      const { result } = renderHook(() => usePartnerReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const data = result.current.data!;
      expect(data.totalCustomers).toBe(2); // c-1, b-1
      expect(data.totalSuppliers).toBe(2); // s-1, b-1

      // totalCustomerRevenue: 1200 + 3000 = 4200
      expect(data.totalCustomerRevenue).toBe(4200);

      // Customer debts:
      // c-1: 1200 revenue - (800 + 150) paid = 250 debt
      // b-1: 3000 revenue - (2000 + 300) paid = 700 debt
      // totalCustomerDebt: 250 + 700 = 950
      expect(data.totalCustomerDebt).toBe(950);

      // Supplier debts:
      // s-1: 400 (debt_amount from metadata)
      // b-1: 150 (debt_amount from metadata)
      // totalSupplierDebt: 400 + 150 = 550
      expect(data.totalSupplierDebt).toBe(550);

      // Top Customers lists
      expect(data.topCustomersByRevenue[0].id).toBe("b-1");
      expect(data.topCustomersByRevenue[1].id).toBe("c-1");

      expect(data.customersWithDebt).toHaveLength(2);
      expect(data.customersWithDebt[0].id).toBe("b-1"); // 700 debt
      expect(data.customersWithDebt[1].id).toBe("c-1"); // 250 debt

      expect(data.suppliersWithDebt).toHaveLength(2);
      expect(data.suppliersWithDebt[0].id).toBe("s-1"); // 400 debt
      expect(data.suppliersWithDebt[1].id).toBe("b-1"); // 150 debt

      expect(data.activeCustomers).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle date boundaries correctly (inclusive on start/end, exclusive outside)", async () => {
      const mockOrders = [
        // Exactly on start boundary
        {
          id: "bound-start",
          status: "delivered",
          total: 100,
          order_date: "2026-06-01T00:00:00.000Z",
          order_items: [],
        },
        // Exactly on end boundary
        {
          id: "bound-end",
          status: "delivered",
          total: 200,
          order_date: "2026-06-30T23:59:59.999Z",
          order_items: [],
        },
        // 1ms before start boundary -> excluded
        {
          id: "bound-early",
          status: "delivered",
          total: 400,
          order_date: "2026-05-31T23:59:59.999Z",
          order_items: [],
        },
        // 1ms after end boundary -> excluded
        {
          id: "bound-late",
          status: "delivered",
          total: 800,
          order_date: "2026-07-01T00:00:00.000Z",
          order_items: [],
        },
      ];
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useRevenueReport(DATE_RANGE_JUNE_2026), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // ONLY bound-start and bound-end should be included.
      expect(result.current.data!.totalRevenue).toBe(300);
      expect(result.current.data!.orderCount).toBe(2);
    });

    it("should support empty databases gracefully (avoiding division by zero or NaN/Infinity)", async () => {
      // Initialize completely empty databases
      localStorage.setItem("erp-mini-local-demo-orders", "[]");
      localStorage.setItem("erp-mini-local-demo-sales-channels", "[]");
      localStorage.setItem("erp-mini-local-demo-products", "[]");
      localStorage.setItem("erp-mini-local-demo-inventory-transactions", "[]");
      localStorage.setItem("erp-mini-local-demo-partners", "[]");
      localStorage.setItem("erp-mini-local-demo-payment-transactions", "[]");

      // Test Revenue Report
      const { result: rev } = renderHook(() => useRevenueReport(DATE_RANGE_JUNE_2026), { wrapper });
      await waitFor(() => expect(rev.current.isSuccess).toBe(true));
      expect(rev.current.data!).toEqual({
        totalRevenue: 0,
        totalCOGS: 0,
        grossProfit: 0,
        profitMargin: 0,
        orderCount: 0,
        dailyChart: [],
        channelChart: [],
      });

      // Test Product Report
      const { result: prod } = renderHook(() => useProductReport(DATE_RANGE_JUNE_2026), { wrapper });
      await waitFor(() => expect(prod.current.isSuccess).toBe(true));
      expect(prod.current.data!).toEqual({
        totalProducts: 0,
        totalQuantitySold: 0,
        topSelling: [],
        topRevenue: [],
        topProfit: [],
        slowMoving: [],
      });

      // Test Inventory Report
      const { result: inv } = renderHook(() => useInventoryReport(), { wrapper });
      await waitFor(() => expect(inv.current.isSuccess).toBe(true));
      expect(inv.current.data!).toEqual({
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        lowStockProducts: [],
        outOfStockProducts: [],
        recentTransactions: [],
      });

      // Test Order Report
      const { result: ord } = renderHook(() => useOrderReport(DATE_RANGE_JUNE_2026), { wrapper });
      await waitFor(() => expect(ord.current.isSuccess).toBe(true));
      expect(ord.current.data!).toEqual({
        totalOrders: 0,
        statusCounts: {},
        fulfillmentRate: 0,
        cancelRate: 0,
        returnRate: 0,
        avgOrderValue: 0,
      });

      // Test Partner Report
      const { result: partner } = renderHook(() => usePartnerReport(DATE_RANGE_JUNE_2026), { wrapper });
      await waitFor(() => expect(partner.current.isSuccess).toBe(true));
      expect(partner.current.data!).toEqual({
        totalCustomers: 0,
        totalSuppliers: 0,
        totalCustomerRevenue: 0,
        totalCustomerDebt: 0,
        totalSupplierDebt: 0,
        topCustomersByRevenue: [],
        topCustomersByOrders: [],
        customersWithDebt: [],
        suppliersWithDebt: [],
        activeCustomers: 0,
      });
    });

    it("should handle high volume scaling gracefully (limit recent transactions to 100 and top lists to 10)", async () => {
      // 1. Seed 205 active products
      const mockProducts = [];
      for (let i = 1; i <= 205; i++) {
        mockProducts.push({
          id: `p-${i}`,
          name: `Product ${i}`,
          sku: `SKU-${i}`,
          cost_price: 10,
          stock_quantity: 5,
          min_stock: 2,
          is_active: true,
          company_id: "comp-1",
        });
      }
      localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(mockProducts));

      // 2. Seed 150 inventory transactions
      const mockTx = [];
      for (let i = 1; i <= 150; i++) {
        mockTx.push({
          id: `tx-${i}`,
          product_id: `p-${i}`,
          transaction_type: "in",
          quantity: 1,
          created_at: new Date(2026, 5, 10, 0, 0, i).toISOString(),
        });
      }
      localStorage.setItem("erp-mini-local-demo-inventory-transactions", JSON.stringify(mockTx));

      // Verify transaction list slicing in Inventory Report
      const { result: inv } = renderHook(() => useInventoryReport(), { wrapper });
      await waitFor(() => expect(inv.current.isSuccess).toBe(true));
      expect(inv.current.data!.recentTransactions).toHaveLength(100);

      // 3. Seed 200+ orders to check list limits in Product Report & Partner Report
      const mockOrders = [];
      const mockPartners = [];
      for (let i = 1; i <= 120; i++) {
        // Create 120 partners
        mockPartners.push({
          id: `cust-${i}`,
          name: `Customer ${i}`,
          code: `C${i}`,
          partner_type: "customer",
          debt_amount: 0,
        });

        // Add matching orders in date range
        mockOrders.push({
          id: `o-${i}`,
          partner_id: `cust-${i}`,
          status: "delivered",
          total: i * 10, // different revenue per customer
          order_date: "2026-06-15T00:00:00.000Z",
          order_items: [
            {
              product_id: `p-${(i % 15) + 1}`, // spread across 15 products
              quantity: i, // different quantity sold
              total: i * 10,
              products: { cost_price: 2 },
            },
          ],
        });
      }
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));
      localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));

      // Test product report top list slicing (maximum 10 slices)
      const { result: prod } = renderHook(() => useProductReport(DATE_RANGE_JUNE_2026), { wrapper });
      await waitFor(() => expect(prod.current.isSuccess).toBe(true));
      expect(prod.current.data!.topSelling).toHaveLength(10);
      expect(prod.current.data!.topRevenue).toHaveLength(10);
      expect(prod.current.data!.topProfit).toHaveLength(10);
      expect(prod.current.data!.slowMoving).toHaveLength(10);

      // Test partner report top customer lists slicing (maximum 10 slices)
      const { result: part } = renderHook(() => usePartnerReport(DATE_RANGE_JUNE_2026), { wrapper });
      await waitFor(() => expect(part.current.isSuccess).toBe(true));
      expect(part.current.data!.topCustomersByRevenue).toHaveLength(10);
      expect(part.current.data!.topCustomersByOrders).toHaveLength(10);
    });
  });
});

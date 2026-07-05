import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useWholesaleSettings, useProductWholesalePrices } from "../useWholesaleSettings";

// Mock variables
let mockDemoMode = true;
let mockData: any = null;
let mockError: any = null;

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

// Mock dependencies
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock("@/hooks/useCompanyContext", () => ({
  useCompanyContext: () => ({
    companyId: "test-company-id",
  }),
}));

vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => mockDemoMode,
}));

vi.mock("@/integrations/supabase/client", () => {
  const builder: any = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation(() => builder),
    update: vi.fn().mockImplementation(() => builder),
    delete: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    is: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    single: vi.fn().mockImplementation(() => mockSingle()),
    maybeSingle: vi.fn().mockImplementation(() => mockMaybeSingle()),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve({ data: mockData, error: mockError }).then(onfulfilled);
    }),
  };

  return {
    supabase: {
      from: vi.fn(() => builder),
    },
  };
});

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

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

describe("useWholesaleSettings Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    mockDemoMode = true;
    mockData = null;
    mockError = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("useWholesaleSettings Hook", () => {
    it("should fetch default settings in local demo mode if none saved", async () => {
      const { result } = renderHook(() => useWholesaleSettings(), { wrapper });

      await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));
      expect(result.current.settings).toEqual(
        expect.objectContaining({
          company_id: "test-company-id",
          apply_by_variant_qty_enabled: true,
          no_other_discounts: false,
        })
      );
    });

    it("should fetch saved settings from local storage in local demo mode", async () => {
      const customSettings = {
        id: "local-wholesale-settings",
        company_id: "test-company-id",
        apply_by_order_qty_enabled: true,
        apply_by_order_qty_threshold: 15,
        apply_by_product_qty_enabled: false,
        apply_by_product_qty_threshold: 5,
        apply_by_variant_qty_enabled: true,
        apply_by_order_tags_enabled: false,
        apply_by_order_tags: [],
        apply_by_customer_tags_enabled: false,
        apply_by_customer_tags: [],
        no_other_discounts: true,
      };
      localStorage.setItem("erp-mini-local-demo-wholesale-settings", JSON.stringify(customSettings));

      const { result } = renderHook(() => useWholesaleSettings(), { wrapper });

      await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));
      expect(result.current.settings).toEqual(customSettings);
    });

    it("should update settings in local demo mode", async () => {
      const { result } = renderHook(() => useWholesaleSettings(), { wrapper });
      await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

      act(() => {
        result.current.updateSettings.mutate({ no_other_discounts: true });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Cập nhật cấu hình bán sỉ thành công",
          })
        );
      });

      const saved = JSON.parse(localStorage.getItem("erp-mini-local-demo-wholesale-settings") || "{}");
      expect(saved.no_other_discounts).toBe(true);
    });

    it("should fetch settings from Supabase in non-demo mode", async () => {
      mockDemoMode = false;
      const dbSettings = {
        id: "db-settings-id",
        company_id: "test-company-id",
        no_other_discounts: true,
      };

      mockMaybeSingle.mockResolvedValue({ data: dbSettings, error: null });

      const { result } = renderHook(() => useWholesaleSettings(), { wrapper });
      await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));
      expect(result.current.settings).toEqual(dbSettings);
    });
  });

  describe("useProductWholesalePrices Hook", () => {
    it("should fetch empty array if no product ID is provided", async () => {
      const { result } = renderHook(() => useProductWholesalePrices(undefined), { wrapper });

      await waitFor(() => expect(result.current.isLoadingPrices).toBe(false));
      expect(result.current.wholesalePrices).toEqual([]);
    });

    it("should fetch wholesale prices in local demo mode", async () => {
      const mockPrices = [
        { id: "wp-1", product_id: "prod-1", variant_id: "var-1", min_quantity: 5, wholesale_price: 10000 },
        { id: "wp-2", product_id: "prod-2", variant_id: "var-2", min_quantity: 10, wholesale_price: 20000 },
      ];
      localStorage.setItem("erp-mini-local-demo-product-wholesale-prices", JSON.stringify(mockPrices));

      const { result } = renderHook(() => useProductWholesalePrices("prod-1", "var-1"), { wrapper });

      await waitFor(() => expect(result.current.isLoadingPrices).toBe(false));
      expect(result.current.wholesalePrices).toEqual([
        { id: "wp-1", product_id: "prod-1", variant_id: "var-1", min_quantity: 5, wholesale_price: 10000 },
      ]);
    });

    it("should save wholesale prices in local demo mode", async () => {
      const mockPrices = [
        { id: "wp-existing", product_id: "prod-1", variant_id: "var-1", min_quantity: 5, wholesale_price: 10000 },
      ];
      localStorage.setItem("erp-mini-local-demo-product-wholesale-prices", JSON.stringify(mockPrices));

      const { result } = renderHook(() => useProductWholesalePrices("prod-1", "var-1"), { wrapper });
      await waitFor(() => expect(result.current.isLoadingPrices).toBe(false));

      act(() => {
        result.current.saveWholesalePrices.mutate([
          { product_id: "prod-1", variant_id: "var-1", min_quantity: 10, wholesale_price: 9000 },
        ]);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Cấu hình bậc giá sỉ thành công",
          })
        );
      });

      const saved = JSON.parse(localStorage.getItem("erp-mini-local-demo-product-wholesale-prices") || "[]");
      // Check that existing for prod-1 / var-1 was removed, and the new one was added
      expect(saved).toHaveLength(1);
      expect(saved[0].min_quantity).toBe(10);
      expect(saved[0].wholesale_price).toBe(9000);
    });

    it("should fetch wholesale prices from Supabase in non-demo mode", async () => {
      mockDemoMode = false;
      const dbPrices = [
        { id: "db-wp-1", product_id: "prod-1", variant_id: "var-1", min_quantity: 5, wholesale_price: 9500 },
      ];
      mockData = dbPrices;

      const { result } = renderHook(() => useProductWholesalePrices("prod-1", "var-1"), { wrapper });
      await waitFor(() => expect(result.current.isLoadingPrices).toBe(false));
      expect(result.current.wholesalePrices).toEqual(dbPrices);
    });
  });
});

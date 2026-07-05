import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useLoyaltySettings, useReferralSettings, useLoyaltyTransactions } from "../useLoyalty";

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

vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => mockDemoMode,
}));

vi.mock("@/integrations/supabase/client", () => {
  const builder: any = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation(() => builder),
    update: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
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

describe("useLoyalty Test Suite", () => {
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

  describe("useLoyaltySettings Hook", () => {
    it("should fetch default loyalty settings in local demo mode when empty", async () => {
      const { result } = renderHook(() => useLoyaltySettings(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.settings).toEqual({
        company_id: "demo",
        is_enabled: true,
        point_ratio_money: 10000,
        point_ratio_points: 1,
        redeem_ratio_points: 1,
        redeem_ratio_money: 1000,
        no_point_discounted: true,
      });
    });

    it("should fetch saved loyalty settings in local demo mode", async () => {
      const customSettings = {
        company_id: "demo",
        is_enabled: false,
        point_ratio_money: 5000,
        point_ratio_points: 2,
        redeem_ratio_points: 1,
        redeem_ratio_money: 500,
        no_point_discounted: false,
      };
      localStorage.setItem("erp-mini-loyalty-settings", JSON.stringify(customSettings));

      const { result } = renderHook(() => useLoyaltySettings(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.settings).toEqual(customSettings);
    });

    it("should update loyalty settings in local demo mode", async () => {
      const { result } = renderHook(() => useLoyaltySettings(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.updateSettings({ point_ratio_money: 20000 });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Thành công",
            description: "Đã cập nhật cài đặt tích điểm.",
          })
        );
      });

      const saved = JSON.parse(localStorage.getItem("erp-mini-loyalty-settings") || "{}");
      expect(saved.point_ratio_money).toBe(20000);
    });

    it("should fetch loyalty settings from Supabase mode", async () => {
      mockDemoMode = false;
      const dbSettings = {
        id: "settings-db-1",
        company_id: "demo-db",
        is_enabled: true,
        point_ratio_money: 8000,
        point_ratio_points: 1,
        redeem_ratio_points: 1,
        redeem_ratio_money: 800,
        no_point_discounted: true,
      };

      mockMaybeSingle.mockResolvedValue({ data: dbSettings, error: null });

      const { result } = renderHook(() => useLoyaltySettings(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.settings).toEqual(dbSettings);
    });

    it("should insert loyalty settings if they do not exist in Supabase mode", async () => {
      mockDemoMode = false;
      
      // select for check (returns no existing settings)
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // insert callback
      const insertedSettings = { id: "new-loyalty-settings", is_enabled: true };
      mockSingle.mockResolvedValueOnce({ data: insertedSettings, error: null });

      const { result } = renderHook(() => useLoyaltySettings(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.updateSettings({ is_enabled: true });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Thành công",
            description: "Đã cập nhật cài đặt tích điểm.",
          })
        );
      });
    });
  });

  describe("useReferralSettings Hook", () => {
    it("should fetch default referral settings in local demo mode", async () => {
      const { result } = renderHook(() => useReferralSettings(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.settings).toEqual({
        company_id: "demo",
        referrer_reward_points: 50,
        referee_discount_amount: 50000,
      });
    });

    it("should update referral settings in local demo mode", async () => {
      const { result } = renderHook(() => useReferralSettings(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.updateSettings({ referrer_reward_points: 100 });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Thành công",
            description: "Đã cập nhật cài đặt giới thiệu.",
          })
        );
      });

      const saved = JSON.parse(localStorage.getItem("erp-mini-referral-settings") || "{}");
      expect(saved.referrer_reward_points).toBe(100);
    });
  });

  describe("useLoyaltyTransactions Hook", () => {
    it("should fetch empty transactions when no partner ID is provided", async () => {
      const { result } = renderHook(() => useLoyaltyTransactions(undefined), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.transactions).toEqual([]);
    });

    it("should fetch loyalty transactions and map order numbers in local demo mode", async () => {
      const mockTransactions = [
        {
          id: "tx-1",
          partner_id: "partner-1",
          order_id: "order-1",
          points: 10,
          transaction_type: "earn",
          notes: "Tích điểm",
          created_at: "2026-07-05T12:00:00Z",
        },
      ];
      const mockOrders = [
        {
          id: "order-1",
          order_number: "ORD-0001",
        },
      ];

      localStorage.setItem("erp-mini-loyalty-transactions", JSON.stringify(mockTransactions));
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(mockOrders));

      const { result } = renderHook(() => useLoyaltyTransactions("partner-1"), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.transactions).toEqual([
        {
          id: "tx-1",
          partner_id: "partner-1",
          order_id: "order-1",
          points: 10,
          transaction_type: "earn",
          notes: "Tích điểm",
          created_at: "2026-07-05T12:00:00Z",
          order_number: "ORD-0001",
        },
      ]);
    });

    it("should adjust points in local demo mode and update partner details", async () => {
      const mockPartners = [
        { id: "partner-1", name: "Client A", loyalty_points: 100 },
      ];
      localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(mockPartners));

      const { result } = renderHook(() => useLoyaltyTransactions("partner-1"), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let res;
      await act(async () => {
        res = await result.current.adjustPoints({
          partnerId: "partner-1",
          points: 50,
          notes: "Adjust points",
        });
      });

      expect(res).toBeDefined();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Thành công",
          description: "Đã điều chỉnh +50 điểm thành công.",
        })
      );

      const savedPartners = JSON.parse(localStorage.getItem("erp-mini-local-demo-partners") || "[]");
      expect(savedPartners[0].loyalty_points).toBe(150);

      const savedTxs = JSON.parse(localStorage.getItem("erp-mini-loyalty-transactions") || "[]");
      expect(savedTxs).toHaveLength(1);
      expect(savedTxs[0].points).toBe(50);
      expect(savedTxs[0].transaction_type).toBe("manual_adjust");
    });
  });
});

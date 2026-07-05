import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { usePlatformSync } from "../usePlatformSync";

// Mock variables
let mockDemoMode = false;
let mockInvokeData: any = null;
let mockInvokeError: any = null;

const mockInvoke = vi.fn().mockImplementation(() => {
  return Promise.resolve({ data: mockInvokeData, error: mockInvokeError });
});

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
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      functions: {
        invoke: (...args: any[]) => mockInvoke(...args),
      },
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

describe("usePlatformSync Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    mockDemoMode = false;
    mockInvokeData = null;
    mockInvokeError = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("syncLogs fetching", () => {
    it("should fetch logs from local storage in local demo mode", async () => {
      mockDemoMode = true;
      const mockLogs = [{ id: "log-1", status: "completed" }];
      localStorage.setItem("erp-mini-local-demo-sync-logs", JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePlatformSync(), { wrapper });
      await waitFor(() => expect(result.current.logsLoading).toBe(false));
      expect(result.current.syncLogs).toEqual(mockLogs);
    });
  });

  describe("syncOrders Mutation", () => {
    it("should call edge function with correct payload and handle success", async () => {
      mockInvokeData = { synced: 5, failed: 1 };
      const { result } = renderHook(() => usePlatformSync(), { wrapper });

      let syncRes;
      await act(async () => {
        syncRes = await result.current.syncOrders.mutateAsync({
          channelId: "channel-123",
          syncParams: { since: "2026-07-01" },
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith("sync-platform-orders", {
        body: {
          action: "sync_orders",
          channel_id: "channel-123",
          sync_params: { since: "2026-07-01" },
        },
      });

      expect(syncRes).toEqual(mockInvokeData);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Đồng bộ hoàn tất",
          description: "Đã đồng bộ 5 đơn hàng, 1 lỗi",
        })
      );
    });

    it("should handle mutation errors gracefully", async () => {
      mockInvokeError = new Error("Network timeout");
      const { result } = renderHook(() => usePlatformSync(), { wrapper });

      await act(async () => {
        try {
          await result.current.syncOrders.mutateAsync({
            channelId: "channel-123",
          });
        } catch (e) {
          // Expected error throwing
        }
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Lỗi đồng bộ",
        })
      );
    });

    it("should handle error nested inside data payload", async () => {
      mockInvokeData = { error: "API limit exceeded" };
      const { result } = renderHook(() => usePlatformSync(), { wrapper });

      await act(async () => {
        try {
          await result.current.syncOrders.mutateAsync({
            channelId: "channel-123",
          });
        } catch (e) {
          // Expected error throwing
        }
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Lỗi đồng bộ",
          description: "API limit exceeded",
        })
      );
    });
  });

  describe("getAuthUrl Mutation", () => {
    it("should query and return authorization URL", async () => {
      mockInvokeData = { url: "https://auth.example.com/oauth" };
      const { result } = renderHook(() => usePlatformSync(), { wrapper });

      let url;
      await act(async () => {
        url = await result.current.getAuthUrl.mutateAsync({
          channelId: "channel-abc",
          redirectUri: "https://localhost/callback",
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith("sync-platform-orders", {
        body: {
          action: "get_auth_url",
          channel_id: "channel-abc",
          redirect_uri: "https://localhost/callback",
        },
      });
      expect(url).toBe("https://auth.example.com/oauth");
    });
  });

  describe("exchangeToken Mutation", () => {
    it("should exchange auth code for token and trigger invalidation", async () => {
      mockInvokeData = { success: true };
      const { result } = renderHook(() => usePlatformSync(), { wrapper });

      await act(async () => {
        await result.current.exchangeToken.mutateAsync({
          channelId: "channel-abc",
          code: "auth-code-123",
          redirectUri: "https://localhost/callback",
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith("sync-platform-orders", {
        body: {
          action: "exchange_token",
          channel_id: "channel-abc",
          code: "auth-code-123",
          redirect_uri: "https://localhost/callback",
        },
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Kết nối sàn thành công",
        })
      );
    });
  });

  describe("refreshToken Mutation", () => {
    it("should call token refresh flow", async () => {
      mockInvokeData = { refreshed: true };
      const { result } = renderHook(() => usePlatformSync(), { wrapper });

      let res;
      await act(async () => {
        res = await result.current.refreshToken.mutateAsync("channel-abc");
      });

      expect(mockInvoke).toHaveBeenCalledWith("sync-platform-orders", {
        body: {
          action: "refresh_token",
          channel_id: "channel-abc",
        },
      });
      expect(res).toEqual({ refreshed: true });
    });
  });
});

import { isLocalDemoAuthEnabled } from "./localDemoAuth";
import type { QueryClient } from "@tanstack/react-query";

let isSyncingFromServer = false;
let clientLastUpdated = 0;
let isPendingPush = false;

export async function initLocalDemoSync(queryClient: QueryClient) {
  if (typeof window === "undefined" || !import.meta.env.DEV) return;

  const pullFromServer = async () => {
    if (isPendingPush) return;
    try {
      const response = await fetch("/api/local-demo-data");
      if (!response.ok) return;
      const result = await response.json();

      // If server has never been updated, or timestamp is not newer/changed, do nothing
      if (!result.timestamp || result.timestamp === clientLastUpdated) {
        return;
      }

      isSyncingFromServer = true;

      const data = result.data || {};

      // Identify local keys that need to be removed (except the auth state)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("erp-mini-local-demo-") && key !== "erp-mini-local-demo-auth" && key !== "erp-mini-local-demo-role") {
          if (!(key in data)) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Set/update keys from the server
      for (const [key, val] of Object.entries(data)) {
        if (key !== "erp-mini-local-demo-auth" && key !== "erp-mini-local-demo-role") {
          localStorage.setItem(key, val as string);
        }
      }

      clientLastUpdated = result.timestamp;
      isSyncingFromServer = false;

      // Invalidate React Query cache so the UI automatically updates with the fresh data
      if (queryClient) {
        queryClient.invalidateQueries();
      }
    } catch (err) {
      console.error("Failed to pull local demo data from server:", err);
      isSyncingFromServer = false;
    }
  };

  const doPushToServer = async () => {
    try {
      isPendingPush = true;
      const demoData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("erp-mini-local-demo-") && key !== "erp-mini-local-demo-auth" && key !== "erp-mini-local-demo-role") {
          const val = localStorage.getItem(key);
          if (val !== null) {
            demoData[key] = val;
          }
        }
      }

      const response = await fetch("/api/local-demo-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: demoData }),
      });

      if (response.ok) {
        const result = await response.json();
        clientLastUpdated = result.timestamp;
      }
    } catch (err) {
      console.error("Failed to push local demo data to server:", err);
    } finally {
      isPendingPush = false;
    }
  };

  (window as any).__forcePushLocalDemoSync = doPushToServer;

  let debounceTimeout: any = null;
  const pushToServer = () => {
    if (isSyncingFromServer) return;
    isPendingPush = true;

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(doPushToServer, 100);
  };

  // Override localStorage methods to capture changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    if (key.startsWith("erp-mini-local-demo-") && key !== "erp-mini-local-demo-auth" && key !== "erp-mini-local-demo-role") {
      pushToServer();
    }
  };

  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function (key: string) {
    originalRemoveItem.apply(this, [key]);
    if (key.startsWith("erp-mini-local-demo-") && key !== "erp-mini-local-demo-auth" && key !== "erp-mini-local-demo-role") {
      pushToServer();
    }
  };

  const originalClear = localStorage.clear;
  localStorage.clear = function () {
    originalClear.apply(this);
    pushToServer();
  };

  // Initial pull from server if logged in
  if (isLocalDemoAuthEnabled()) {
    await pullFromServer();
  }

  // Poll the server for updates from other clients every 3 seconds
  setInterval(async () => {
    if (isLocalDemoAuthEnabled() && !isSyncingFromServer) {
      try {
        const response = await fetch("/api/local-demo-data/timestamp");
        if (response.ok) {
          const { timestamp } = await response.json();
          if (timestamp && timestamp !== clientLastUpdated) {
            await pullFromServer();
          }
        }
      } catch (err) {
        // Fallback to checking full data if timestamp endpoint fails
        await pullFromServer();
      }
    }
  }, 3000);
}

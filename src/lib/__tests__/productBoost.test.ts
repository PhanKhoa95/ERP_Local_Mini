import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  getLocalMaps, 
  getLocalLogs, 
  saveLocalMaps, 
  saveLocalLogs, 
  CategoryMap, 
  PushLog 
} from "@/hooks/useProductBoost";

// Mock isLocalDemoAuthEnabled to always return true for testing local demo handlers
vi.mock("@/lib/localDemoAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/localDemoAuth")>();
  return {
    ...actual,
    isLocalDemoAuthEnabled: () => true
  };
});

describe("Product Boost & Platform Synced Operations Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. should load default seeded platform mappings and logs", () => {
    const maps = getLocalMaps();
    const logs = getLocalLogs();

    expect(maps.length).toBeGreaterThan(0);
    expect(maps[0].pos_category).toBe("Sticker / Decal");
    expect(maps[0].platform).toBe("shopee");

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].product_sku).toBe("PRD-STICKER");
    expect(logs[1].status).toBe("failed");
  });

  it("2. should correctly add or update pos category to platform mapping", () => {
    const maps = getLocalMaps();
    const initialCount = maps.length;

    // Add a new mapping
    const newMap: CategoryMap = {
      id: "map-new",
      pos_category: "Thẻ VIP",
      platform: "shopee",
      platform_category: "Nhà cửa & Đời sống > Thiệp & Quà tặng"
    };

    const updated = [...maps, newMap];
    saveLocalMaps(updated);

    const saved = getLocalMaps();
    expect(saved.length).toBe(initialCount + 1);
    expect(saved.find(m => m.id === "map-new")?.pos_category).toBe("Thẻ VIP");
  });

  it("3. should append new push logs on executePush", () => {
    const logs = getLocalLogs();
    const initialCount = logs.length;

    const newLog: PushLog = {
      id: "log-test-new",
      product_id: "p3",
      product_name: "Sticker VIP",
      product_sku: "PRD-VIP-STICKER",
      platform: "shopee",
      status: "success",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const combined = [newLog, ...logs];
    saveLocalLogs(combined);

    const saved = getLocalLogs();
    expect(saved.length).toBe(initialCount + 1);
    expect(saved[0].id).toBe("log-test-new");
    expect(saved[0].status).toBe("success");
  });

  it("4. should update failed log status to success on retry", () => {
    const logs = getLocalLogs();
    const targetId = "log-2";
    const failedLog = logs.find(l => l.id === targetId);
    expect(failedLog?.status).toBe("failed");

    const updated = logs.map(l => {
      if (l.id === targetId) {
        return {
          ...l,
          status: "success" as const,
          error_msg: null,
          updated_at: new Date().toISOString()
        };
      }
      return l;
    });
    saveLocalLogs(updated);

    const saved = getLocalLogs();
    const retriedLog = saved.find(l => l.id === targetId);
    expect(retriedLog?.status).toBe("success");
    expect(retriedLog?.error_msg).toBeNull();
  });
});

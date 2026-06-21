import { describe, it, expect } from "vitest";

// Test offline policy logic directly (extracted from useOfflineQueue)
const OFFLINE_BLACKLIST = [
  "token_ledger",
  "project_shares",
  "permission_policies",
  "agent_permissions",
  "sensitive_action_logs",
  "blockchain_config",
];

const OFFLINE_WHITELIST: Record<string, string[]> = {
  bookings: ["insert"],
  work_reports: ["insert"],
  attendance_records: ["insert"],
  orders: ["insert"],
};

function canPerformOffline(table: string, action: string) {
  if (OFFLINE_BLACKLIST.includes(table)) {
    return { allowed: false, reason: `Thao tác trên "${table}" không được phép khi offline (tài sản số)` };
  }
  const whitelist = OFFLINE_WHITELIST[table];
  if (whitelist && whitelist.includes(action)) {
    if (table === "orders") return { allowed: true, forceStatus: "pending_sync" };
    return { allowed: true };
  }
  if (["insert", "update", "delete"].includes(action)) return { allowed: true };
  return { allowed: true };
}

describe("Offline Policy - canPerformOffline", () => {
  // Scenario 86: Offline booking insert → allowed
  it("#86 allows booking insert offline", () => {
    const result = canPerformOffline("bookings", "insert");
    expect(result.allowed).toBe(true);
    expect(result.forceStatus).toBeUndefined();
  });

  // Scenario 87: Offline work_report insert → allowed
  it("#87 allows work_report insert offline", () => {
    expect(canPerformOffline("work_reports", "insert").allowed).toBe(true);
  });

  // Scenario 88: Offline token_ledger → blocked (blacklist)
  it("#88 blocks token_ledger offline", () => {
    const result = canPerformOffline("token_ledger", "insert");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("token_ledger");
  });

  // Scenario 89: Offline sensitive_action_logs → blocked
  it("#89 blocks sensitive_action_logs offline", () => {
    expect(canPerformOffline("sensitive_action_logs", "insert").allowed).toBe(false);
  });

  // Blocks project_shares offline
  it("blocks project_shares offline", () => {
    expect(canPerformOffline("project_shares", "update").allowed).toBe(false);
  });

  // Blocks permission_policies offline
  it("blocks permission_policies offline", () => {
    expect(canPerformOffline("permission_policies", "insert").allowed).toBe(false);
  });

  // Blocks agent_permissions offline
  it("blocks agent_permissions offline", () => {
    expect(canPerformOffline("agent_permissions", "delete").allowed).toBe(false);
  });

  // Blocks blockchain_config offline
  it("blocks blockchain_config offline", () => {
    expect(canPerformOffline("blockchain_config", "update").allowed).toBe(false);
  });

  // Scenario 94: Offline order insert → forceStatus pending_sync
  it("#94 forces order status to pending_sync offline", () => {
    const result = canPerformOffline("orders", "insert");
    expect(result.allowed).toBe(true);
    expect(result.forceStatus).toBe("pending_sync");
  });

  // Allows attendance_records insert offline
  it("allows attendance_records insert offline", () => {
    expect(canPerformOffline("attendance_records", "insert").allowed).toBe(true);
  });

  // Non-whitelisted table still allowed (queued)
  it("allows non-whitelisted table writes (queued)", () => {
    expect(canPerformOffline("partners", "insert").allowed).toBe(true);
  });

  // Booking update not in whitelist but still allowed
  it("allows booking update (queued)", () => {
    expect(canPerformOffline("bookings", "update").allowed).toBe(true);
  });
});

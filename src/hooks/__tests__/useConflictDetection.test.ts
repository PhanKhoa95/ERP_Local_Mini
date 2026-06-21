import { describe, it, expect } from "vitest";

// Test SoD (Separation of Duties) conflict detection logic
interface ApprovalRequest {
  id: string;
  title: string;
  requested_by: string;
  approved_by: string | null;
  request_type: string;
}

function detectSelfApprovalConflicts(requests: ApprovalRequest[]) {
  return requests
    .filter(req => req.approved_by && req.requested_by === req.approved_by)
    .map(req => ({
      id: req.id,
      user_id: req.requested_by,
      title: req.title,
      conflict_type: "self_approval" as const,
      details: `Người tạo và người duyệt "${req.title}" là cùng một tài khoản (${req.request_type})`,
    }));
}

describe("Conflict Detection - SoD", () => {
  const requests: ApprovalRequest[] = [
    { id: "r1", title: "Mua văn phòng phẩm", requested_by: "u1", approved_by: "u1", request_type: "purchase" },
    { id: "r2", title: "Thuê nhân viên mới", requested_by: "u2", approved_by: "u3", request_type: "hr" },
    { id: "r3", title: "Chi phí marketing", requested_by: "u3", approved_by: "u3", request_type: "expense" },
    { id: "r4", title: "Pending request", requested_by: "u1", approved_by: null, request_type: "purchase" },
  ];

  // Scenario 13: Detect self-approval SoD
  it("#13 detects self-approval conflicts", () => {
    const conflicts = detectSelfApprovalConflicts(requests);
    expect(conflicts).toHaveLength(2);
    expect(conflicts[0].conflict_type).toBe("self_approval");
    expect(conflicts[0].id).toBe("r1");
    expect(conflicts[1].id).toBe("r3");
  });

  it("ignores pending requests (no approved_by)", () => {
    const conflicts = detectSelfApprovalConflicts(requests);
    expect(conflicts.find(c => c.id === "r4")).toBeUndefined();
  });

  it("ignores properly separated approvals", () => {
    const conflicts = detectSelfApprovalConflicts(requests);
    expect(conflicts.find(c => c.id === "r2")).toBeUndefined();
  });

  it("produces correct detail messages", () => {
    const conflicts = detectSelfApprovalConflicts(requests);
    expect(conflicts[0].details).toContain("Mua văn phòng phẩm");
    expect(conflicts[0].details).toContain("purchase");
  });

  it("handles empty input", () => {
    expect(detectSelfApprovalConflicts([])).toHaveLength(0);
  });

  it("handles all-clean approvals", () => {
    const clean: ApprovalRequest[] = [
      { id: "r1", title: "A", requested_by: "u1", approved_by: "u2", request_type: "x" },
      { id: "r2", title: "B", requested_by: "u3", approved_by: "u4", request_type: "y" },
    ];
    expect(detectSelfApprovalConflicts(clean)).toHaveLength(0);
  });
});

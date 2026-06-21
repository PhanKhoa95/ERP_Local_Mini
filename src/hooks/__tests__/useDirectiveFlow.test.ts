import { describe, it, expect } from "vitest";

// Test 3-level directive flow logic (scenarios 31-45)

interface DirectiveTask {
  title: string;
  priority: string;
  assignee_name?: string;
  deadline_days?: number;
  kpi_target?: string;
}

// Simulate AI transcription result validation
function validateTranscriptionResult(result: { directive_title: string; tasks: DirectiveTask[] }) {
  if (!result.directive_title) return { valid: false, error: "Missing directive_title" };
  if (!result.tasks || !Array.isArray(result.tasks)) return { valid: false, error: "tasks must be array" };
  for (const task of result.tasks) {
    if (!task.title) return { valid: false, error: "Task missing title" };
    if (!["low", "normal", "high", "urgent"].includes(task.priority)) {
      return { valid: false, error: `Invalid priority: ${task.priority}` };
    }
  }
  return { valid: true };
}

// Simulate assignee matching
function matchAssigneeToEmployee(
  assigneeName: string | undefined,
  employees: { id: string; name: string }[]
): string | null {
  if (!assigneeName) return null;
  const match = employees.find(e =>
    e.name.toLowerCase().includes(assigneeName.toLowerCase())
  );
  return match?.id || null;
}

// Simulate deadline calculation
function calculateDeadline(deadlineDays: number | undefined): string | null {
  if (!deadlineDays) return null;
  return new Date(Date.now() + deadlineDays * 86400000).toISOString();
}

// Simulate escalation check
function findStaleDirectives(
  directives: { id: string; status: string; created_at: string; escalation_count: number }[],
  thresholdMs: number = 2 * 3600000
) {
  const threshold = new Date(Date.now() - thresholdMs).getTime();
  return directives.filter(d => d.status === "draft" && new Date(d.created_at).getTime() < threshold);
}

// Simulate workload-based assignment
function assignByWorkload(employees: { id: string; taskCount: number }[], maxTasks: number = 10) {
  return employees
    .filter(e => e.taskCount < maxTasks)
    .sort((a, b) => a.taskCount - b.taskCount);
}

describe("Directive Transcription Validation", () => {
  // Scenario 31-32: AI output structured validation
  it("#31-32 validates correct AI transcription result", () => {
    const result = {
      directive_title: "Triển khai dự án ABC",
      tasks: [
        { title: "Lập kế hoạch", priority: "high", assignee_name: "Nguyễn Văn A", deadline_days: 7 },
        { title: "Thiết kế giao diện", priority: "normal", kpi_target: "Hoàn thành 100%" },
      ],
    };
    expect(validateTranscriptionResult(result).valid).toBe(true);
  });

  it("rejects missing directive_title", () => {
    expect(validateTranscriptionResult({ directive_title: "", tasks: [] }).valid).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = {
      directive_title: "Test",
      tasks: [{ title: "Task 1", priority: "invalid" }],
    };
    expect(validateTranscriptionResult(result).valid).toBe(false);
  });

  it("rejects task without title", () => {
    const result = {
      directive_title: "Test",
      tasks: [{ title: "", priority: "normal" }],
    };
    expect(validateTranscriptionResult(result).valid).toBe(false);
  });
});

describe("Assignee Matching", () => {
  const employees = [
    { id: "e1", name: "Nguyễn Văn An" },
    { id: "e2", name: "Trần Thị Bình" },
    { id: "e3", name: "Lê Minh Cường" },
  ];

  // Scenario 34: Auto-assign manager
  it("#34 matches assignee name to employee", () => {
    expect(matchAssigneeToEmployee("An", employees)).toBe("e1");
    expect(matchAssigneeToEmployee("Bình", employees)).toBe("e2");
  });

  it("returns null for unmatched name", () => {
    expect(matchAssigneeToEmployee("Unknown", employees)).toBeNull();
  });

  it("returns null for undefined name", () => {
    expect(matchAssigneeToEmployee(undefined, employees)).toBeNull();
  });

  it("case-insensitive matching", () => {
    expect(matchAssigneeToEmployee("cường", employees)).toBe("e3");
  });
});

describe("Deadline Calculation", () => {
  it("calculates deadline from days", () => {
    const deadline = calculateDeadline(7);
    expect(deadline).toBeTruthy();
    const d = new Date(deadline!);
    const expected = new Date(Date.now() + 7 * 86400000);
    expect(Math.abs(d.getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it("returns null for undefined days", () => {
    expect(calculateDeadline(undefined)).toBeNull();
  });
});

describe("Escalation Detection", () => {
  // Scenario 40: Stale directives > 2h
  it("#40 finds directives stale > 2 hours", () => {
    const directives = [
      { id: "d1", status: "draft", created_at: new Date(Date.now() - 3 * 3600000).toISOString(), escalation_count: 0 },
      { id: "d2", status: "draft", created_at: new Date(Date.now() - 1 * 3600000).toISOString(), escalation_count: 0 },
      { id: "d3", status: "dispatched", created_at: new Date(Date.now() - 5 * 3600000).toISOString(), escalation_count: 0 },
    ];
    const stale = findStaleDirectives(directives);
    expect(stale).toHaveLength(1);
    expect(stale[0].id).toBe("d1"); // only d1 is draft AND > 2h old
  });

  it("no stale directives when all recent", () => {
    const directives = [
      { id: "d1", status: "draft", created_at: new Date().toISOString(), escalation_count: 0 },
    ];
    expect(findStaleDirectives(directives)).toHaveLength(0);
  });
});

describe("Workload-Based Assignment", () => {
  // Scenario 38: Prioritize employees with fewer tasks
  it("#38 sorts by workload ascending", () => {
    const employees = [
      { id: "e1", taskCount: 8 },
      { id: "e2", taskCount: 2 },
      { id: "e3", taskCount: 5 },
    ];
    const sorted = assignByWorkload(employees);
    expect(sorted[0].id).toBe("e2");
    expect(sorted[1].id).toBe("e3");
  });

  // Scenario 59: Employees at max → excluded
  it("#59 excludes employees at max task limit", () => {
    const employees = [
      { id: "e1", taskCount: 10 },
      { id: "e2", taskCount: 3 },
    ];
    const available = assignByWorkload(employees, 10);
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe("e2");
  });

  it("returns empty when all maxed out", () => {
    const employees = [
      { id: "e1", taskCount: 15 },
      { id: "e2", taskCount: 12 },
    ];
    expect(assignByWorkload(employees, 10)).toHaveLength(0);
  });
});

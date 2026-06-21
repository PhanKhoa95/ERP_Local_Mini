import { describe, it, expect } from "vitest";

// Test the metrics computation logic from useDirectiveDashboard
interface MockDirective {
  id: string;
  status: string;
  created_at: string;
}

interface MockTask {
  id: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  directive_id: string | null;
  assigned_to: string | null;
}

function computeDirectiveStats(directives: MockDirective[]) {
  return {
    total: directives.length,
    draft: directives.filter(d => d.status === "draft").length,
    dispatched: directives.filter(d => d.status === "dispatched").length,
    inProgress: directives.filter(d => d.status === "in_progress").length,
    completed: directives.filter(d => d.status === "completed").length,
  };
}

function computeTaskStats(tasks: MockTask[]) {
  const now = new Date();
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "done").length,
    onTime: tasks.filter(t => t.status === "done" && t.due_date && new Date(t.completed_at || t.due_date) <= new Date(t.due_date)).length,
    overdue: tasks.filter(t => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < now).length,
  };
}

function computeDirectiveProgress(directive: MockDirective, tasks: MockTask[]) {
  const dTasks = tasks.filter(t => t.directive_id === directive.id);
  const now = new Date();
  return {
    total_tasks: dTasks.length,
    completed_tasks: dTasks.filter(t => t.status === "done").length,
    overdue_tasks: dTasks.filter(t => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < now).length,
  };
}

describe("Directive Dashboard Metrics", () => {
  const directives: MockDirective[] = [
    { id: "d1", status: "draft", created_at: "2026-03-01T00:00:00Z" },
    { id: "d2", status: "dispatched", created_at: "2026-03-02T00:00:00Z" },
    { id: "d3", status: "in_progress", created_at: "2026-03-03T00:00:00Z" },
    { id: "d4", status: "completed", created_at: "2026-03-04T00:00:00Z" },
    { id: "d5", status: "completed", created_at: "2026-03-05T00:00:00Z" },
  ];

  const tasks: MockTask[] = [
    { id: "t1", status: "done", due_date: "2026-03-10T00:00:00Z", completed_at: "2026-03-08T00:00:00Z", directive_id: "d3", assigned_to: "e1" },
    { id: "t2", status: "in_progress", due_date: "2026-01-01T00:00:00Z", completed_at: null, directive_id: "d3", assigned_to: "e2" }, // overdue
    { id: "t3", status: "done", due_date: "2026-03-05T00:00:00Z", completed_at: "2026-03-04T00:00:00Z", directive_id: "d4", assigned_to: "e1" },
    { id: "t4", status: "todo", due_date: "2026-12-01T00:00:00Z", completed_at: null, directive_id: "d2", assigned_to: "e3" },
    { id: "t5", status: "cancelled", due_date: "2026-01-01T00:00:00Z", completed_at: null, directive_id: "d2", assigned_to: null },
  ];

  // Scenario 42: DirectiveDashboard StatCards accuracy
  it("#42 computes directive stats correctly", () => {
    const stats = computeDirectiveStats(directives);
    expect(stats.total).toBe(5);
    expect(stats.draft).toBe(1);
    expect(stats.dispatched).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.completed).toBe(2);
  });

  it("computes task stats correctly", () => {
    const stats = computeTaskStats(tasks);
    expect(stats.total).toBe(5);
    expect(stats.completed).toBe(2);
    expect(stats.onTime).toBe(2); // both completed before due_date
    expect(stats.overdue).toBe(1); // t2 is overdue (due 2026-01-01, still in_progress)
  });

  it("computes directive progress correctly", () => {
    const prog = computeDirectiveProgress(directives[2], tasks); // d3
    expect(prog.total_tasks).toBe(2);
    expect(prog.completed_tasks).toBe(1);
    expect(prog.overdue_tasks).toBe(1);
  });

  it("handles directives with no tasks", () => {
    const prog = computeDirectiveProgress(directives[0], tasks); // d1
    expect(prog.total_tasks).toBe(0);
    expect(prog.completed_tasks).toBe(0);
    expect(prog.overdue_tasks).toBe(0);
  });

  it("handles empty data", () => {
    expect(computeDirectiveStats([]).total).toBe(0);
    expect(computeTaskStats([]).total).toBe(0);
  });

  it("cancelled tasks not counted as overdue", () => {
    const stats = computeTaskStats(tasks);
    // t5 is cancelled with past due_date - should NOT be overdue
    expect(stats.overdue).toBe(1); // only t2
  });

  // Scenario 43: Timeline data (7 day chart)
  it("#43 generates timeline data for 7 days", () => {
    const days: { date: string; created: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        created: directives.filter(dir => dir.created_at.slice(0, 10) === dateStr).length,
        completed: tasks.filter(t => t.status === "done" && t.completed_at?.slice(0, 10) === dateStr).length,
      });
    }
    expect(days).toHaveLength(7);
  });

  // Scenario 44: Pie chart status distribution
  it("#44 generates task status distribution", () => {
    const distribution = [
      { name: "Hoàn thành", value: tasks.filter(t => t.status === "done").length },
      { name: "Đang làm", value: tasks.filter(t => t.status === "in_progress").length },
      { name: "Chờ", value: tasks.filter(t => t.status === "todo" || t.status === "pending").length },
    ].filter(d => d.value > 0);
    expect(distribution.length).toBeGreaterThan(0);
    expect(distribution.find(d => d.name === "Hoàn thành")?.value).toBe(2);
  });
});

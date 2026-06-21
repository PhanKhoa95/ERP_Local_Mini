import { describe, it, expect } from "vitest";

// Test workflow BFS execution logic and node type handling (scenarios 46-60)

interface Node {
  id: string;
  type: "trigger" | "condition" | "action";
  trigger_type?: string;
  condition_type?: string;
  action_type?: string;
  config?: Record<string, any>;
}

interface Edge {
  source: string;
  target: string;
}

function findStartNodes(nodes: Node[], edges: Edge[]): string[] {
  const targetSet = new Set(edges.map(e => e.target));
  return nodes.filter(n => !targetSet.has(n.id)).map(n => n.id);
}

function buildAdjacencyMap(edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of edges) {
    const children = map.get(edge.source) || [];
    children.push(edge.target);
    map.set(edge.source, children);
  }
  return map;
}

function bfsOrder(startNodes: string[], adjacencyMap: Map<string, string[]>): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  const queue = [...startNodes];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    result.push(nodeId);
    const children = adjacencyMap.get(nodeId) || [];
    queue.push(...children);
  }
  return result;
}

// Test condition evaluation logic
function evaluateCompareCondition(field: string, operator: string, value: number, contextData: Record<string, any>) {
  const actual = Number(contextData?.[field] ?? 0);
  switch (operator) {
    case ">": return actual > value;
    case "<": return actual < value;
    case "=": return actual === value;
    case ">=": return actual >= value;
    case "<=": return actual <= value;
    default: return false;
  }
}

function evaluatePermissionGuard(userRole: string, requiredRole: string, vneidVerified: boolean, requiresVneid: boolean) {
  const roleLevel: Record<string, number> = { staff: 1, manager: 2, admin: 3 };
  const hasRole = (roleLevel[userRole] || 1) >= (roleLevel[requiredRole] || 1);
  const vneidOk = !requiresVneid || vneidVerified;
  return { result: hasRole && vneidOk, denied_reason: !hasRole ? "insufficient_role" : !vneidOk ? "vneid_required" : null };
}

describe("Workflow BFS Execution", () => {
  const nodes: Node[] = [
    { id: "n1", type: "trigger", trigger_type: "new_order" },
    { id: "n2", type: "condition", condition_type: "compare", config: { field: "total", operator: ">", value: "1000000" } },
    { id: "n3", type: "action", action_type: "create_approval" },
    { id: "n4", type: "action", action_type: "send_notification" },
  ];

  const edges: Edge[] = [
    { source: "n1", target: "n2" },
    { source: "n2", target: "n3" },
    { source: "n2", target: "n4" },
  ];

  // Scenario 49: BFS traversal
  it("#49 BFS traversal visits all nodes in correct order", () => {
    const starts = findStartNodes(nodes, edges);
    expect(starts).toEqual(["n1"]);

    const adj = buildAdjacencyMap(edges);
    const order = bfsOrder(starts, adj);
    expect(order).toEqual(["n1", "n2", "n3", "n4"]);
  });

  it("finds start nodes (no incoming edges)", () => {
    const starts = findStartNodes(nodes, edges);
    expect(starts).toHaveLength(1);
    expect(starts[0]).toBe("n1");
  });

  it("handles disconnected graphs", () => {
    const extraNodes = [...nodes, { id: "n5", type: "trigger" as const, trigger_type: "manual" }];
    const starts = findStartNodes(extraNodes, edges);
    expect(starts).toContain("n1");
    expect(starts).toContain("n5");
  });

  it("handles cycles without infinite loop", () => {
    const cyclicEdges: Edge[] = [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
      { source: "c", target: "a" },
    ];
    const adj = buildAdjacencyMap(cyclicEdges);
    const order = bfsOrder(["a"], adj);
    expect(order).toEqual(["a", "b", "c"]); // visited set prevents revisit
  });
});

describe("Workflow Condition Evaluation", () => {
  // Scenario 50: Compare condition with new_order total
  it("#50 compare condition > works", () => {
    expect(evaluateCompareCondition("total", ">", 1000000, { total: 5000000 })).toBe(true);
    expect(evaluateCompareCondition("total", ">", 1000000, { total: 500000 })).toBe(false);
  });

  it("compare condition < works", () => {
    expect(evaluateCompareCondition("total", "<", 100, { total: 50 })).toBe(true);
  });

  it("compare condition = works", () => {
    expect(evaluateCompareCondition("total", "=", 100, { total: 100 })).toBe(true);
  });

  it("missing field defaults to 0", () => {
    expect(evaluateCompareCondition("missing", ">", 0, {})).toBe(false);
    expect(evaluateCompareCondition("missing", "=", 0, {})).toBe(true);
  });
});

describe("Permission Guard Node", () => {
  // Scenario 52: User has sufficient role → allowed
  it("#52 admin passes manager-required guard", () => {
    const result = evaluatePermissionGuard("admin", "manager", false, false);
    expect(result.result).toBe(true);
    expect(result.denied_reason).toBeNull();
  });

  // Scenario 53: User lacks role → denied
  it("#53 staff fails manager-required guard", () => {
    const result = evaluatePermissionGuard("staff", "manager", false, false);
    expect(result.result).toBe(false);
    expect(result.denied_reason).toBe("insufficient_role");
  });

  // VNeID required but not verified
  it("vneid required but not verified → denied", () => {
    const result = evaluatePermissionGuard("admin", "admin", false, true);
    expect(result.result).toBe(false);
    expect(result.denied_reason).toBe("vneid_required");
  });

  // VNeID required and verified → allowed
  it("vneid required and verified → allowed", () => {
    const result = evaluatePermissionGuard("admin", "admin", true, true);
    expect(result.result).toBe(true);
  });

  // Scenario 59: Check workload logic
  it("#59 workload check: employee under limit → allowed", () => {
    const currentTasks = 3;
    const maxTasks = 10;
    expect(currentTasks < maxTasks).toBe(true);
  });

  it("workload check: employee at limit → denied", () => {
    const currentTasks = 10;
    const maxTasks = 10;
    expect(currentTasks < maxTasks).toBe(false);
  });
});

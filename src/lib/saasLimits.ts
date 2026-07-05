export interface SaaSPlan {
  id: "starter" | "growth" | "enterprise";
  max_warehouses: number;
  max_orders: number;
}

export const PLANS: Record<string, SaaSPlan> = {
  starter: { id: "starter", max_warehouses: 1, max_orders: 100 },
  growth: { id: "growth", max_warehouses: 5, max_orders: 2000 },
  enterprise: { id: "enterprise", max_warehouses: 9999, max_orders: 999999 },
};

export function checkPlanLimit(
  planType: "starter" | "growth" | "enterprise",
  metric: "warehouses" | "orders",
  currentUsage: number
): boolean {
  const plan = PLANS[planType];
  if (!plan) return false;

  const limit = metric === "warehouses" ? plan.max_warehouses : plan.max_orders;
  return currentUsage < limit;
}

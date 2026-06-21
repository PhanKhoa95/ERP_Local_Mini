import { describe, it, expect } from "vitest";

// Business logic functions to test price list tier matching
interface PriceListRule {
  product_id: string;
  custom_price: number;
  min_quantity: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export function getApplicablePrice(
  productId: string,
  quantity: number,
  basePrice: number,
  rules: PriceListRule[],
  now: Date = new Date()
): number {
  let bestPrice = basePrice;

  // Filter valid and active rules
  const activeRules = rules.filter((rule) => {
    if (rule.product_id !== productId) return false;
    if (!rule.is_active) return false;
    
    if (rule.start_date && new Date(rule.start_date) > now) return false;
    if (rule.end_date && new Date(rule.end_date) < now) return false;
    
    return quantity >= rule.min_quantity;
  });

  if (activeRules.length > 0) {
    // Sort rules to find the one with the highest min_quantity that the user matches
    activeRules.sort((a, b) => b.min_quantity - a.min_quantity);
    bestPrice = activeRules[0].custom_price;
  }

  return bestPrice;
}

// Fleet trip dispatch and verification
interface Driver {
  id: string;
  name: string;
  is_active: boolean;
  status: "idle" | "busy";
}

interface Shipment {
  id: string;
  status: "pending" | "dispatched" | "delivered";
}

interface DeliveryTrip {
  id: string;
  driver_id: string | null;
  status: "planned" | "loading" | "en_route" | "completed";
  shipments: Shipment[];
}

export function assignDriverToTrip(
  trip: DeliveryTrip,
  driver: Driver
): { trip: DeliveryTrip; driver: Driver } {
  if (!driver.is_active) {
    throw new Error("Tài xế đang không hoạt động");
  }
  if (driver.status === "busy") {
    throw new Error("Tài xế đang bận chuyến xe khác");
  }

  return {
    trip: {
      ...trip,
      driver_id: driver.id,
      status: "loading",
    },
    driver: {
      ...driver,
      status: "busy",
    },
  };
}

// Picking list workflow state transitions
type PickingListStatus = "pending" | "picking" | "packed" | "completed" | "cancelled";

export function transitionPickingList(
  currentStatus: PickingListStatus,
  nextStatus: PickingListStatus
): PickingListStatus {
  if (currentStatus === "completed" || currentStatus === "cancelled") {
    throw new Error("Không thể chuyển trạng thái khi phiếu đã hoàn thành hoặc hủy");
  }

  const validTransitions: Record<PickingListStatus, PickingListStatus[]> = {
    pending: ["picking", "cancelled"],
    picking: ["packed", "cancelled"],
    packed: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[currentStatus].includes(nextStatus)) {
    throw new Error(`Trực quan hóa quy trình: Không thể chuyển từ ${currentStatus} sang ${nextStatus}`);
  }

  return nextStatus;
}

// SaaS Billing limit enforcement
interface SaaSPlan {
  id: "starter" | "growth" | "enterprise";
  max_warehouses: number;
  max_orders: number;
}

const PLANS: Record<string, SaaSPlan> = {
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

describe("Price List Tier Logic", () => {
  const rules: PriceListRule[] = [
    {
      product_id: "p1",
      custom_price: 8000,
      min_quantity: 5,
      is_active: true,
      start_date: null,
      end_date: null,
    },
    {
      product_id: "p1",
      custom_price: 7000,
      min_quantity: 10,
      is_active: true,
      start_date: null,
      end_date: null,
    },
    {
      product_id: "p1",
      custom_price: 6000,
      min_quantity: 20,
      is_active: false, // Inactive rule
      start_date: null,
      end_date: null,
    },
    {
      product_id: "p1",
      custom_price: 5000,
      min_quantity: 30,
      is_active: true,
      start_date: "2026-01-01",
      end_date: "2026-02-01", // Expired rule
    },
  ];

  it("returns base price if quantity does not meet any tiered criteria", () => {
    const price = getApplicablePrice("p1", 3, 10000, rules, new Date("2026-06-11"));
    expect(price).toBe(10000);
  });

  it("returns tier 1 price for matching quantity threshold", () => {
    const price = getApplicablePrice("p1", 6, 10000, rules, new Date("2026-06-11"));
    expect(price).toBe(8000);
  });

  it("returns tier 2 price for meeting higher quantity threshold", () => {
    const price = getApplicablePrice("p1", 12, 10000, rules, new Date("2026-06-11"));
    expect(price).toBe(7000);
  });

  it("ignores inactive rules", () => {
    const price = getApplicablePrice("p1", 25, 10000, rules, new Date("2026-06-11"));
    expect(price).toBe(7000); // Should fall back to 10 tier rule (7000) instead of 20 tier rule (6000)
  });

  it("ignores expired time-based rules", () => {
    const price = getApplicablePrice("p1", 35, 10000, rules, new Date("2026-06-11"));
    expect(price).toBe(7000); // Expired on Feb 2026, current is Jun 2026
  });

  it("applies active time-based rule within the valid window", () => {
    const price = getApplicablePrice("p1", 35, 10000, rules, new Date("2026-01-15"));
    expect(price).toBe(5000); // Within Jan 2026
  });
});

describe("Fleet Trip Dispatch Logic", () => {
  it("successfully assigns an idle active driver to a planned trip", () => {
    const driver: Driver = { id: "d1", name: "Nguyen Van A", is_active: true, status: "idle" };
    const trip: DeliveryTrip = { id: "t1", driver_id: null, status: "planned", shipments: [] };

    const result = assignDriverToTrip(trip, driver);
    expect(result.trip.driver_id).toBe("d1");
    expect(result.trip.status).toBe("loading");
    expect(result.driver.status).toBe("busy");
  });

  it("throws error when driver is inactive", () => {
    const driver: Driver = { id: "d1", name: "Nguyen Van A", is_active: false, status: "idle" };
    const trip: DeliveryTrip = { id: "t1", driver_id: null, status: "planned", shipments: [] };

    expect(() => assignDriverToTrip(trip, driver)).toThrow("Tài xế đang không hoạt động");
  });

  it("throws error when driver is already busy", () => {
    const driver: Driver = { id: "d1", name: "Nguyen Van A", is_active: true, status: "busy" };
    const trip: DeliveryTrip = { id: "t1", driver_id: null, status: "planned", shipments: [] };

    expect(() => assignDriverToTrip(trip, driver)).toThrow("Tài xế đang bận chuyến xe khác");
  });
});

describe("Picking List Workflow Transitions", () => {
  it("transitions pending picking lists to picking status", () => {
    expect(transitionPickingList("pending", "picking")).toBe("picking");
  });

  it("transitions picking to packed", () => {
    expect(transitionPickingList("picking", "packed")).toBe("packed");
  });

  it("transitions packed to completed", () => {
    expect(transitionPickingList("packed", "completed")).toBe("completed");
  });

  it("allows cancellation of pending list", () => {
    expect(transitionPickingList("pending", "cancelled")).toBe("cancelled");
  });

  it("throws error for illegal status skip", () => {
    expect(() => transitionPickingList("pending", "completed")).toThrow();
  });

  it("throws error when modifying terminal status list", () => {
    expect(() => transitionPickingList("completed", "cancelled")).toThrow();
  });
});

describe("SaaS Plan Limit Enforcement", () => {
  it("permits warehouse creation under starter limits", () => {
    expect(checkPlanLimit("starter", "warehouses", 0)).toBe(true);
  });

  it("blocks warehouse creation exceeding starter limits", () => {
    expect(checkPlanLimit("starter", "warehouses", 1)).toBe(false);
  });

  it("permits warehouse creation under growth limits", () => {
    expect(checkPlanLimit("growth", "warehouses", 4)).toBe(true);
    expect(checkPlanLimit("growth", "warehouses", 5)).toBe(false);
  });

  it("permits order creations under limit threshold", () => {
    expect(checkPlanLimit("starter", "orders", 99)).toBe(true);
    expect(checkPlanLimit("starter", "orders", 100)).toBe(false);
  });
});

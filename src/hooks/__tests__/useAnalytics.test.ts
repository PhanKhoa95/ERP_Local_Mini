import { describe, it, expect } from "vitest";
import { pivotCohortData, type CohortRetention } from "../useAnalytics";

describe("pivotCohortData", () => {
  it("correctly groups and pivots cohort retention records", () => {
    const mockCohorts: CohortRetention[] = [
      {
        company_id: "comp-1",
        first_purchase_month: "2026-01-01",
        cohort_index: 0,
        active_customers: 100,
        total_revenue: 10000,
      },
      {
        company_id: "comp-1",
        first_purchase_month: "2026-01-01",
        cohort_index: 1,
        active_customers: 40,
        total_revenue: 4000,
      },
      {
        company_id: "comp-1",
        first_purchase_month: "2026-01-01",
        cohort_index: 2,
        active_customers: 25,
        total_revenue: 3000,
      },
      {
        company_id: "comp-1",
        first_purchase_month: "2026-02-01",
        cohort_index: 0,
        active_customers: 50,
        total_revenue: 5000,
      },
      {
        company_id: "comp-1",
        first_purchase_month: "2026-02-01",
        cohort_index: 1,
        active_customers: 15,
        total_revenue: 1500,
      },
    ];

    const result = pivotCohortData(mockCohorts);

    expect(result).toHaveLength(2);

    // Verify January cohort
    const janCohort = result.find((r) => r.signupMonth === "2026-01-01");
    expect(janCohort).toBeDefined();
    expect(janCohort?.cohortSize).toBe(100);
    expect(janCohort?.retention[0]).toEqual({
      customers: 100,
      percentage: 100,
      revenue: 10000,
    });
    expect(janCohort?.retention[1]).toEqual({
      customers: 40,
      percentage: 40,
      revenue: 4000,
    });
    expect(janCohort?.retention[2]).toEqual({
      customers: 25,
      percentage: 25,
      revenue: 3000,
    });

    // Verify February cohort
    const febCohort = result.find((r) => r.signupMonth === "2026-02-01");
    expect(febCohort).toBeDefined();
    expect(febCohort?.cohortSize).toBe(50);
    expect(febCohort?.retention[0]).toEqual({
      customers: 50,
      percentage: 100,
      revenue: 5000,
    });
    expect(febCohort?.retention[1]).toEqual({
      customers: 15,
      percentage: 30,
      revenue: 1500,
    });
    expect(febCohort?.retention[2]).toBeUndefined();
  });

  it("handles empty array input", () => {
    const result = pivotCohortData([]);
    expect(result).toHaveLength(0);
  });

  it("handles cohorts with missing index 0 gracefully", () => {
    const mockCohorts: CohortRetention[] = [
      {
        company_id: "comp-1",
        first_purchase_month: "2026-03-01",
        cohort_index: 1,
        active_customers: 10,
        total_revenue: 1000,
      },
    ];

    const result = pivotCohortData(mockCohorts);
    expect(result).toHaveLength(1);
    expect(result[0].cohortSize).toBe(0);
    expect(result[0].retention[1]).toEqual({
      customers: 10,
      percentage: 0,
      revenue: 1000,
    });
  });
});

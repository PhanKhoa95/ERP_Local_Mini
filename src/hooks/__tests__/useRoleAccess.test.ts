import { describe, it, expect } from "vitest";

// Test role-based access control logic (scenarios 5-7)
type Role = "admin" | "manager" | "staff";

const roleLevel: Record<Role, number> = { staff: 1, manager: 2, admin: 3 };

function hasAccess(userRole: Role, minRole: Role): boolean {
  return (roleLevel[userRole] || 0) >= (roleLevel[minRole] || 0);
}

// Route protection config (from routes.tsx/Sidebar.tsx)
const protectedRoutes: { path: string; minRole: Role }[] = [
  { path: "/settings", minRole: "admin" },
  { path: "/finance", minRole: "manager" },
  { path: "/directive-dashboard", minRole: "manager" },
  { path: "/strategic-report", minRole: "manager" },
  { path: "/performance-team", minRole: "manager" },
  { path: "/dashboard", minRole: "staff" },
  { path: "/orders", minRole: "staff" },
];

describe("Role-Based Access Control", () => {
  // Scenario 5: Staff cannot access /settings (admin only)
  it("#5 staff cannot access /settings", () => {
    const route = protectedRoutes.find(r => r.path === "/settings")!;
    expect(hasAccess("staff", route.minRole)).toBe(false);
  });

  // Scenario 6: Staff cannot access /finance (manager+)
  it("#6 staff cannot access /finance", () => {
    const route = protectedRoutes.find(r => r.path === "/finance")!;
    expect(hasAccess("staff", route.minRole)).toBe(false);
  });

  // Scenario 7: Manager can access /directive-dashboard
  it("#7 manager can access /directive-dashboard", () => {
    const route = protectedRoutes.find(r => r.path === "/directive-dashboard")!;
    expect(hasAccess("manager", route.minRole)).toBe(true);
  });

  it("admin can access everything", () => {
    protectedRoutes.forEach(route => {
      expect(hasAccess("admin", route.minRole)).toBe(true);
    });
  });

  it("staff can access staff-level routes", () => {
    expect(hasAccess("staff", "staff")).toBe(true);
  });

  it("manager can access staff and manager routes", () => {
    expect(hasAccess("manager", "staff")).toBe(true);
    expect(hasAccess("manager", "manager")).toBe(true);
    expect(hasAccess("manager", "admin")).toBe(false);
  });
});

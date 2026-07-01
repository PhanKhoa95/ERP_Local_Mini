## 2026-07-01T08:44:01Z
You are teamwork_preview_worker.
Your working directory is: y:\ERP_Local_Mini\.agents\worker_m2.
Your task is to implement the Dynamic RBAC/ABAC role system for ERP_Local_Mini, covering all specifications.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Key Requirements:
1. Migration:
   - Create a new migration file under `supabase/migrations/` to define the `custom_roles` table (id, company_id, name, description, permissions JSONB, timestamps) with proper RLS policies.
   - Alter `company_members` table to add a `region` TEXT column (null values allowed).
2. React Hook:
   - Create `src/hooks/usePermissions.ts` which handles both Local Demo (localStorage) and Supabase mode.
   - It should determine the current user's role (standard or custom) and region attribute.
   - It should expose `hasPermission(module, action): boolean`, `hasFieldPermission(module, field): boolean`, `getUserRegion(): string`, and check access helpers.
   - For default roles (`admin`, `manager`, `staff`), if no custom role exists, resolve standard defaults (admin has all, manager has all except settings, staff has pos, orders, partners, debt with restricted write permissions, no cost_price).
3. Settings Matrix UI:
   - Create `src/components/settings/DynamicRbacTab.tsx` and integrate it into `src/pages/Settings.tsx` (as a new "Vai trò & Quyền" tab).
   - Admin should be able to create, edit, delete custom roles.
   - It must display a permission matrix (Modules: pos, orders, inventory, partners, debt, contracts, accounting, finance, reports, settings vs Actions: View, Create, Edit, Delete).
   - Include special toggles: "Xem giá vốn và Biên lợi nhuận" (view_cost_price) and checkboxes for allowed regions (Miền Bắc, Miền Trung, Miền Nam).
4. Member & Region UI:
   - Update `useCompanyMembers.ts` and `CompanyMembersTab.tsx` to load custom roles into the role dropdown and add a region dropdown ("Toàn quốc / All", "Miền Bắc", "Miền Trung", "Miền Nam") next to each member. Save updates to database / localStorage.
5. Dynamic Access Control:
   - Update `Sidebar.tsx` to dynamically show/hide navigation items according to module view permissions.
   - Update `ProtectedRoute.tsx` to block route access dynamically.
   - Update action buttons: hide/disable Create, Edit, Delete buttons in Product lists (Inventory) and Orders if the current user doesn't have create/edit/delete permissions on that module.
6. Field-level protection:
   - In `Inventory.tsx`, hide the `cost_price` column (displaying '***' or hide the column completely) and hide total valuation if the user lacks `view_cost_price` permission.
7. Record-level protection (ABAC):
   - In `Orders.tsx`, filter orders based on the user's assigned region (matching order's `shipping_province`). If the user is assigned a specific region, lock the filter to that region.
   - In `Reports.tsx` / `useReportStats.ts`, filter sales and revenue by region if the user is region-restricted.
8. Audit Logging:
   - Automatically log to `audit_logs` (Supabase or localStorage) when custom roles or permission matrix changes, or when role/region is assigned to an employee.
9. Verification:
   - Run typecheck (`npm run typecheck`), linting (`npm run lint`), Vitest (`npm run test`), E2E (`npx playwright test`), and production build (`npm run build`). Keep updating progress.md and send a handoff message when done.

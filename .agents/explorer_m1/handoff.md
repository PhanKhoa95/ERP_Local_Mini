# Handoff Report: ERP Local Mini Dynamic RBAC/ABAC Role System Investigation

## 1. Observation

During the read-only investigation of the `ERP_Local_Mini` repository, the following details were discovered:

### A. Roles and Permissions Definition, Fetching & Checking
- **Role Fetching**: In `src/contexts/AuthContext.tsx` (lines 45-68), the `fetchCompany` function retrieves the membership details of the user:
  ```typescript
  const { data: membership, error } = await supabase
    .from("company_members")
    .select(`company_id, role, companies:company_id (id, name)`)
    .eq("user_id", userId)
    .single();
  ```
- **Local Demo Role**: In `src/contexts/AuthContext.tsx` (lines 79-93), if local demo authentication is active, the role defaults to:
  ```typescript
  const demoRole = localStorage.getItem("erp-mini-local-demo-role") || "admin";
  ```
- **Client-Side Authorization Check**:
  - `src/components/layout/ProtectedRoute.tsx` (lines 12-14) uses a hardcoded mapping:
    ```typescript
    const roleLevel: Record<string, number> = { staff: 1, manager: 2, admin: 3 };
    ```
    And checks permissions based on `userLevel >= requiredLevel`.
  - `src/components/layout/Sidebar.tsx` (lines 79-84) performs identical role-level checks for rendering sidebar navigation.
- **Database Schema**: 
  - `supabase/migrations/20260309032859_74f0cb60-af9c-4d4a-b717-b4ed63d74a10.sql` creates the tables `public.permission_policies` (which supports `requires_vneid` and `requires_step_up`), `public.agent_permissions`, and `public.sensitive_action_logs`.
  - It also defines `public.check_sensitive_action(_user_id UUID, _action_type TEXT)` which returns dynamic permissions information based on policies and roles.

### B. Settings and Sidebar/Navigation
- **Sidebar**: Defined in `src/components/layout/Sidebar.tsx`. Menu items are defined with the attribute `minRole?: string;`.
- **Settings**: Defined in `src/pages/Settings.tsx`. It provides various configuration tabs including:
  - `CompanyMembersTab` (`src/components/settings/CompanyMembersTab.tsx` for updating roles)
  - `PermissionPoliciesTab` (`src/components/settings/PermissionPoliciesTab.tsx` for creating/deleting policies)
  - `AgentPermissionsTab` (`src/components/settings/AgentPermissionsTab.tsx` for configuring AI agents)
  - `AuditLogsTab` (`src/components/settings/AuditLogsTab.tsx` for viewing audit trails)

### C. Product Lists and Orders Lists
- **Product List (with cost_price)**:
  - Inside `src/pages/Inventory.tsx` (lines 165, 416): Displays the `cost_price` of products to all users within the table.
  - Adding/editing products is done via `src/components/products/ProductDialog.tsx` (where `cost_price` input is processed).
- **Orders List (with region filter)**:
  - Inside `src/pages/Orders.tsx`: Displays orders and supports filters for `statusFilter`, `channelFilter`, search text, and global dates. **No region filter currently exists.**
  - `src/pages/Reports.tsx` (line 451) indicates orders are grouped into regions dynamically using `o.shipping_province || "Khác"`. Therefore, `shipping_province` serves as the region attribute.

### D. Local Demo vs Supabase Mode Logic
- **Detection**: Handled by `isLocalDemoAuthEnabled()` in `src/lib/localDemoAuth.ts` (lines 14-25), checking if `import.meta.env.DEV && localStorage.getItem("erp-mini-local-demo-auth") === "true"`.
- **Storage**: Under Local Demo, data is saved directly in `localStorage` under keys prefixed with `erp-mini-local-demo-` (e.g. `erp-mini-local-demo-orders`, `erp-mini-local-demo-products`, `erp-mini-local-demo-partners`). In Supabase mode, the PostgreSQL tables are accessed via TanStack Query and Supabase clients.

### E. Audit Logs
- **Writing**: Handled by `logAction` function in `src/hooks/useAuditLogs.ts` (lines 90-124).
- **Storage**: Under Local Demo, it updates a list serialized inside the `localStorage` key `"erp-mini-local-demo-audit-logs"`. In Supabase mode, it writes directly to `public.audit_logs`.
- **Structure**: Contains fields `id`, `user_id`, `action`, `table_name`, `record_id`, `old_data`, `new_data`, `ip_address`, `user_agent`, `created_at`, `user_email`.

### F. Testing Configurations
- **Typechecking**: Command is `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`).
- **Linting**: Command is `npm run lint` (`eslint .`).
- **Vitest**: Configured in `vitest.config.ts` running against files matching `src/**/*.{test,spec}.{ts,tsx}` in a `jsdom` environment. Command is `npm run test`.
- **Playwright**: Configured in `playwright.config.ts`, tests are in `./tests`. Local server runs on `http://127.0.0.1:8017`. Command is `npx playwright test`.

---

## 2. Logic Chain

The current codebase contains all the building blocks for transition to a dynamic RBAC/ABAC role system:
1. **Dynamic RBAC Hook**: Instead of relying on the static client-side `roleLevel` mapping, a new hook `usePermissions` can fetch policy data from `permission_policies` table (or mock it in `localStorage` under Local Demo mode). This decouples permissions checks from hardcoded values.
2. **Dynamic Menu Loading**: `Sidebar.tsx` and `ProtectedRoute.tsx` can query the dynamic permissions hook to check if the current user has access to each route or action.
3. **ABAC filtering on Orders List**: By retrieving the current user's region attributes (which can be stored in the user profile `metadata` or mocked in Local Demo `localStorage`), the `useOrders` hook can limit the query or filter orders on the client side:
   - If the user has a restricted region attribute (e.g., `shipping_province` must match `"TP.HCM"`), only matching orders are returned/displayed.
   - A dropdown selector can be added in `Orders.tsx` to allow managers/admins to filter orders dynamically by shipping province.
4. **Role-based Product Cost Price Hiding**: In `Inventory.tsx`, the `cost_price` column and the total stock value calculation can be conditionally rendered based on the permission check (e.g., `hasPermission("view_cost_price")`).

---

## 3. Caveats

- **PostgreSQL Row Level Security (RLS)**: The database RLS rules currently enforce company-scoping but do not enforce granular province/region constraints. A fully secure production ABAC system requires matching RLS policies on the database level in Supabase.
- **Local Demo Synchrony**: Changes made to policies or attributes under Local Demo must trigger events or invalidations to refresh the UI immediately without requiring a manual page reload.

---

## 4. Conclusion

The current codebase is ready to be upgraded to a Dynamic RBAC/ABAC system. It is recommended to perform the following code modifications:

### A. Recommended Files to Modify
1. **`src/components/layout/Sidebar.tsx`**: Change sidebar routing permission checks to use a dynamic hook `usePermissions()` instead of checking the static `roleLevel`.
2. **`src/components/layout/ProtectedRoute.tsx`**: Replace the static `roleLevel` verification with a dynamic `hasPermission` check.
3. **`src/pages/Orders.tsx`**: 
   - Add a dropdown for filtering orders by "Khu vực" (shipping province).
   - Enforce region restriction rules returned by the permission hook.
4. **`src/pages/Inventory.tsx`**: 
   - Inject the permission check `hasPermission("view_cost_price")` to decide whether to hide or show the `cost_price` column and the total stock valuation summary.
5. **`src/lib/localDemoAuth.ts`**:
   - Add utility functions to initialize and update demo permission policies and mock user attributes (like assigned region) in `localStorage`.

### B. New Files to Create
1. **`src/hooks/usePermissions.ts`**:
   - Create a central React hook to resolve permissions based on active policies and user metadata (both in Supabase and Local Demo modes).
   - Expose methods: `hasPermission(action)`, `getUserAttributes()`, and `canAccessOrder(order)`.

---

## 5. Verification Method

To verify the proposed implementation:
1. Run the local test command:
   ```powershell
   npm run test:local
   ```
2. Execute the E2E role-based verification tests:
   ```powershell
   npx playwright test tests/e2e/role_verification/role_verification.spec.ts
   ```
   *Expected result*: Default permissions (Admin, Manager, Staff) should behave identical to the current rules to avoid breaking the existing regression tests.
3. Write a new unit test suite under `src/hooks/__tests__/usePermissions.test.ts` to assert:
   - Dynamic authorization resolving.
   - Region-based order filtering (ABAC).
   - Cost price visibility restriction based on active policies.

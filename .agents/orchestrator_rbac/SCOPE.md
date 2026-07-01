# Scope: Dynamic RBAC/ABAC Milestone

## Architecture
- Role definitions & Permission schema.
- Hook `useAuth` / `usePermissions` or similar for checking current role and permissions.
- Storage layer: `localStorage` wrapper vs Supabase client querying DB.
- Components to modify:
  - Sidebar/navigation: hide modules.
  - Settings page: add Role management and matrix.
  - Product list: field hiding (cost_price).
  - Orders / Sales: filter by Region.
  - Action buttons: enable/disable.
  - Audit logging system: write to `audit_logs` database/local storage.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Exploration | Explore codebase and document files to modify | none | IN_PROGRESS |
| 2 | M2: Role & Matrix UI | Implement settings tab for managing roles and matrix | M1 | PLANNED |
| 3 | M3: Multi-tier Enforcement | Integrate access control in Sidebar, Action Buttons, Region filtering, and Field hiding | M2 | PLANNED |
| 4 | M4: Storage & Audit | Ensure Local/Supabase sync and write Audit Logs | M3 | PLANNED |
| 5 | M5: Verification | Run typecheck, lint, Vitest, E2E, and Production Build | M4 | PLANNED |

## Interface Contracts
- `Role`: `{ id: string, name: string, permissions: Record<string, string[]> }`
- `Region`: `'North' | 'Central' | 'South'` (or Vietnamese 'Miền Bắc' | 'Miền Trung' | 'Miền Nam')
- `PermissionAction`: `'view' | 'create' | 'edit' | 'delete'`

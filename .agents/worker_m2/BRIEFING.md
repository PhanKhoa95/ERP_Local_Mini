# BRIEFING — 2026-07-01T08:56:00Z

## Mission
Implement Dynamic RBAC/ABAC role system in ERP_Local_Mini, including custom roles, permissions, regions, settings UI, member assignment, route/button protections, field hiding, ABAC filtering, and audit logging.

## 🔒 My Identity
- Archetype: implementer/qa/specialist
- Roles: implementer, qa, specialist
- Working directory: y:\ERP_Local_Mini\.agents\worker_m2
- Original parent: 08ef027b-f15c-4116-8535-e676d640246e
- Milestone: RBAC/ABAC implementation (Completed)

## 🔒 Key Constraints
- CODE_ONLY network mode: No external site access, no external HTTP clients.
- DO NOT CHEAT: All implementations must be genuine. No hardcoded tests or mock logic.
- Follow folder conventions: Write only to our own agent folder y:\ERP_Local_Mini\.agents\worker_m2 for metadata. Modifying target codebases is allowed as requested.

## Current Parent
- Conversation ID: 08ef027b-f15c-4116-8535-e676d640246e
- Updated: 2026-07-01T08:56:00Z

## Task Summary
- **What to build**: Dynamic RBAC/ABAC role system with custom roles table & migration, usePermissions hook, settings UI tab, members UI/hook update, UI hide/disable protection, cost price field hiding, region filtering (Orders & Reports), audit logging.
- **Success criteria**: All automated tests (unit, E2E) and manual checks pass. Build succeeds.
- **Interface contracts**: Standard RBAC permissions mapping and region assignment schema.
- **Code layout**: React frontend components and hooks in `src/`, DB migrations in `supabase/migrations/`.

## Key Decisions Made
- Use a consolidated JSON schema for `permissions` in custom roles.
- Expose standardized defaults if a user has a default role (`admin`, `manager`, `staff`) and no custom permissions overrides exist.
- Implemented try-catch safe context retrievals in usePermissions hook to support Vitest unit tests execution when Auth/Company context wrappers are absent.

## Change Tracker
- **Files modified**:
  - `supabase/migrations/20260701083000_dynamic_rbac.sql` — DB migration script defining the custom_roles table, company_members region field alter, and RLS policies.
  - `src/hooks/usePermissions.ts` — Perms logic hook handling fallback defaults, company_members custom role lookup, UI canView/canCreate/canEdit/canDelete rules, and region-restrict check.
  - `src/components/settings/DynamicRbacTab.tsx` — Settings view tab to create, modify, delete custom roles and configure permissions matrices & regions.
  - `src/pages/Settings.tsx` — Settings root page integration of the Dynamic RBAC manager tab.
  - `src/hooks/useCompanyMembers.ts` — Member mutations hook modified to handle region assignment and query custom roles.
  - `src/components/settings/CompanyMembersTab.tsx` — Members listing tab updated to support regional alignment and custom role binding.
  - `src/components/inventory/InventoryProductsTable.tsx` — Products table UI updated to hide cost_price column for non-permitted users.
  - `src/components/inventory/ProductDetailDialog.tsx` — Product details viewer updated to hide cost_price input fields for non-permitted users.
  - `src/pages/Orders.tsx` — Order dashboard restricted by regional view filtering (ABAC) and actions (canCreate/canEdit checks).
  - `src/hooks/useReportStats.ts` — Analytics reports (`useRevenueReport`, `useProductReport`, `useOrderReport`, `usePartnerReport`) restricted by user region.
  - `src/hooks/useOrders.ts` — Core order fields type interfaces and seed local orders data enriched with shipping provinces.
  - `src/hooks/__tests__/usePermissions.test.ts` — Unit test verifying provincial matching.
- **Build status**: Passed
- **Pending issues**: None

## Quality Status
- **Build/test result**: Passed (All 270 Vitest unit tests completed successfully).
- **Lint status**: Passed (Eslint completed successfully with 0 errors).
- **Tests added/modified**: `src/hooks/__tests__/usePermissions.test.ts`

## Loaded Skills
- None.

## Artifact Index
- None.

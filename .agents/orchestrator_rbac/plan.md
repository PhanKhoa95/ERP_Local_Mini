# Plan — Dynamic RBAC/ABAC Milestone

## Objectives
Implement a dynamic RBAC/ABAC role system for ERP_Local_Mini.
- R1. Dynamic Roles & Permission Matrix UI (Settings tab).
- R2. Multi-tier permission enforcement:
  - Module-level (sidebar / tabs hide/show)
  - Action-level (create/edit/delete buttons disable/hide)
  - Record-level (filter by Region: North, Central, South)
  - Field-level (hide cost_price and profit margin)
- R3. Compatibility with both Local Demo (localStorage) and Supabase mode.
- R4. Audit logging of permissions/roles updates.
- R5. Verification: Passing all tests, typecheck, and production build.

## Milestones
| Milestone | Name | Objective | Agent | Status |
|-----------|------|-----------|-------|--------|
| M1 | Exploration & Architecture | Explore codebase, identify current RBAC/ABAC, audit logs, components, and design implementation plan. | Explorer | PLANNED |
| M2 | UI Settings & Permission Matrix | Add Custom Roles management UI and Permission Matrix settings. | Worker | PLANNED |
| M3 | Multi-Tier Enforcement | Implement Module, Action, Record (Region), and Field (cost_price) level permission checks. | Worker | PLANNED |
| M4 | Storage & Audit Log integration | Connect backend/localStorage layer for roles/permissions and implement Audit Logs. | Worker | PLANNED |
| M5 | Testing & Verification | Write tests, verify via Vitest & Playwright E2E, run lint, typecheck, and build. | Reviewer, Challenger, Auditor | PLANNED |

## Verification Plan
- Unit tests for RBAC/ABAC hooks, helpers, and utilities using Vitest.
- E2E tests for dynamic roles matrix UI, sidebar hiding, actions hiding, regional filtering, and field hiding using Playwright.
- Static verification: `npm run typecheck`, `npm run lint`.
- Production build: `npm run build`.

# BRIEFING — 2026-07-01T08:44:10Z

## Mission
Implement Dynamic RBAC/ABAC role system in ERP_Local_Mini, including custom roles, permissions, regions, settings UI, member assignment, route/button protections, field hiding, ABAC filtering, and audit logging.

## 🔒 My Identity
- Archetype: implementer/qa/specialist
- Roles: implementer, qa, specialist
- Working directory: y:\ERP_Local_Mini\.agents\worker_m2
- Original parent: 08ef027b-f15c-4116-8535-e676d640246e
- Milestone: RBAC/ABAC implementation

## 🔒 Key Constraints
- CODE_ONLY network mode: No external site access, no external HTTP clients.
- DO NOT CHEAT: All implementations must be genuine. No hardcoded tests or mock logic.
- Follow folder conventions: Write only to our own agent folder y:\ERP_Local_Mini\.agents\worker_m2 for metadata. Modifying target codebases is allowed as requested.

## Current Parent
- Conversation ID: 08ef027b-f15c-4116-8535-e676d640246e
- Updated: 2026-07-01T08:44:10Z

## Task Summary
- **What to build**: Dynamic RBAC/ABAC role system with custom roles table & migration, usePermissions hook, settings UI tab, members UI/hook update, UI hide/disable protection, cost price field hiding, region filtering (Orders & Reports), audit logging.
- **Success criteria**: All automated tests (unit, E2E) and manual checks pass. Build succeeds.
- **Interface contracts**: Standard RBAC permissions mapping and region assignment schema.
- **Code layout**: React frontend components and hooks in `src/`, DB migrations in `supabase/migrations/`.

## Key Decisions Made
- Use a consolidated JSON schema for `permissions` in custom roles.
- Expose standardized defaults if a user has a default role (`admin`, `manager`, `staff`) and no custom permissions overrides exist.

## Change Tracker
- **Files modified**: None
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Untested
- **Lint status**: Untested
- **Tests added/modified**: None

## Loaded Skills
- None yet.

## Artifact Index
- None.

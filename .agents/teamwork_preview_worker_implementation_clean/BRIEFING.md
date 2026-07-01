# BRIEFING — 2026-07-01T12:03:23+07:00

## Mission
Clean up configuration duplication, partner detail sync, and warranty calculation logic.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: y:\ERP_Local_Mini\.agents\teamwork_preview_worker_implementation_clean
- Original parent: 3c4c53a6-6026-43c8-a5cc-adaf1d9cd471
- Milestone: Configuration clean-up and sync

## 🔒 Key Constraints
- Do not cheat (no hardcoded test results, facade implementations).
- Scale effort by impact: verify key claims, run build & tests, fix lints.
- Write files only inside working directory (.agents/teamwork_preview_worker_implementation_clean).

## Current Parent
- Conversation ID: 3c4c53a6-6026-43c8-a5cc-adaf1d9cd471
- Updated: not yet

## Task Summary
- **What to build**: Configuration clean-up in CategoriesTab and SalesPoliciesTab; update hook usePartnerDetail to select product's category column and map it; fix PartnerDetailDialog warranty and dynamic purchase policy logic and layout.
- **Success criteria**: Code compiles, tests pass, layout of the "Bảo hành & CS" tab is optimized and does not overlap.
- **Interface contracts**: Source code folders (src/components, src/hooks)
- **Code layout**: src/components/settings/CategoriesTab.tsx, src/components/settings/SalesPoliciesTab.tsx, src/hooks/usePartnerDetail.ts, src/components/partners/PartnerDetailDialog.tsx

## Key Decisions Made
- [TBD]

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Untested
- **Lint status**: Untested
- **Tests added/modified**: None

## Loaded Skills
- None

## Artifact Index
- y:\ERP_Local_Mini\.agents\teamwork_preview_worker_implementation_clean\ORIGINAL_REQUEST.md — Original request details

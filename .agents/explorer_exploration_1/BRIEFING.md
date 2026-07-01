# BRIEFING — 2026-06-30T10:46:00+07:00

## Mission
Explore ERP_Local_Mini codebase to locate Backup subsystem, audit, local/supabase switch, data patterns, and exports, then propose JSON Import.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Teamwork explorer, Read-only investigator
- Working directory: y:\ERP_Local_Mini\.agents\explorer_exploration_1
- Original parent: 874e0747-43e6-439c-a944-7f81869417ae
- Milestone: Exploration 1

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Code-only network mode (no external calls)
- Keep briefing under ~100 lines

## Current Parent
- Conversation ID: 874e0747-43e6-439c-a944-7f81869417ae
- Updated: 2026-06-30T10:46:00+07:00

## Investigation State
- **Explored paths**: `src/components/settings/BackupTab.tsx`, `src/lib/localDemoAuth.ts`, `src/lib/localDemoSync.ts`, `src/lib/localInventoryStore.ts`, `src/lib/systemDataAudit.ts`, `src/hooks/useProducts.ts`, `src/hooks/usePartners.ts`, `src/hooks/useOrders.ts`, `src/hooks/useDocuments.ts`, `src/components/orders/ImportOrdersDialog.tsx`, `src/integrations/supabase/client.ts`
- **Key findings**: Backup system bypasses Local Demo mode (queries Supabase directly); orders backup doesn't fetch relation tables like `order_items`; local storage overrides propagate local changes to dev server; designed clear-and-insert order for database imports.
- **Unexplored areas**: None.

## Key Decisions Made
- Formulated import flow and dependency insertion hierarchy.

## Artifact Index
- y:\ERP_Local_Mini\.agents\explorer_exploration_1\handoff.md — Final handoff report containing findings and import strategy.
- y:\ERP_Local_Mini\.agents\explorer_exploration_1\progress.md — Progress tracker.

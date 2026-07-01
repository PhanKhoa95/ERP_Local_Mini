# BRIEFING — 2026-07-01T05:01:21Z

## Mission
Configuration clean-up and dynamic warranty calculations sync for ERP Local Mini, with quality checks and full verification.

## 🔒 My Identity
- Archetype: teamwork_preview_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: y:\ERP_Local_Mini\.agents\orchestrator_clean
- Original parent: parent
- Original parent conversation ID: 820f4af1-50f0-41ab-9e3e-e9f3563b4a13

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: y:\ERP_Local_Mini\PROJECT.md
1. **Decompose**: Decompose the task into milestones for implementation, review, and verification.
2. **Dispatch & Execute**:
   - **Delegate (sub-orchestrator)**: Spawn sub-orchestrators for milestones or run iteration loop.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Configuration clean-up (CategoriesTab, SalesPoliciesTab) [pending]
  2. Sync partner detail and warranty calculations (PartnerDetailDialog) [pending]
  3. Quality checks and verification pipeline execution [pending]
- **Current phase**: 1
- **Current focus**: Decompose and plan

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Audit enforcement: Forensic Auditor clean report is mandatory.
- Never reuse a subagent after it has delivered its handoff.

## Current Parent
- Conversation ID: 820f4af1-50f0-41ab-9e3e-e9f3563b4a13
- Updated: not yet

## Key Decisions Made
- Use Project Orchestrator pattern to manage this request.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| 3613d53b-fbbe-4113-8264-a4f01bee39f1 | teamwork_preview_explorer | Explore configuration components and files | completed | 3613d53b-fbbe-4113-8264-a4f01bee39f1 |
| 42496679-eb5f-4d49-ab3f-5482671fc461 | teamwork_preview_worker | Implement fixes and cleanup | pending | 42496679-eb5f-4d49-ab3f-5482671fc461 |

## Succession Status
- Spawn count: 2 / 16
- Pending subagents: 42496679-eb5f-4d49-ab3f-5482671fc461
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 3c4c53a6-6026-43c8-a5cc-adaf1d9cd471/task-21
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run manage_task(Action="list") — re-create if missing

## Artifact Index
- y:\ERP_Local_Mini\.agents\orchestrator_clean\progress.md — progress heartbeat
- y:\ERP_Local_Mini\.agents\orchestrator_clean\ORIGINAL_REQUEST.md — original request log
- y:\ERP_Local_Mini\.agents\orchestrator_clean\plan.md — execution plan

# BRIEFING — 2026-07-05T21:31:20+07:00

## Mission
Complete and verify the M.A.T.R.I.X POS Workflow & Auto Project Manager Integration for production readiness.

## 🔒 My Identity
- Archetype: Project Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: e:\ERP_Local_Mini\.agents\orchestrator_matrix_autopilot
- Original parent: main agent
- Original parent conversation ID: 4bc92530-f869-413d-9351-a0f9e8930844

## 🔒 My Workflow
- **Pattern**: Project Pattern
- **Scope document**: e:\ERP_Local_Mini\PROJECT.md
1. **Decompose**: Decomposed the follow-up request into three main milestones covering local verification baseline, database migration, and automation testing & auditing.
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: Explorer → Worker → Reviewer → test → gate
   - **Delegate (sub-orchestrator)**: When an item is too large, spawn a sub-orchestrator for it
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 subagent spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Milestone 1: Local Verification Baseline [pending]
  2. Milestone 2: Supabase Remote DB Synchronization [pending]
  3. Milestone 3: Autopilot Automation & Security Audit [pending]
- **Current phase**: 1
- **Current focus**: Milestone 1

## 🔒 Key Constraints
- CODE_ONLY network mode.
- Never write, modify, or create source code files directly.
- Never run build/test commands yourself — require workers to do so.
- Forensic Auditor verifications: audit is a BINARY VETO.
- Never reuse a subagent after it has delivered its handoff.

## Current Parent
- Conversation ID: 4bc92530-f869-413d-9351-a0f9e8930844
- Updated: 2026-07-05T21:31:20+07:00

## Key Decisions Made
- Initialized Project Orchestrator state.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|---|---|---|---|---|
| worker_m1 | teamwork_preview_worker | Milestone 1 Verification | completed | 62b1f70b-104d-4e82-b025-65aaa0676073 |
| auditor_m1 | teamwork_preview_auditor | Milestone 1 Audit | pending | cb225e63-befc-4378-9f3e-2aba33ff00dc |

## Succession Status
- Succession required: no
- Spawn count: 2 / 16
- Pending subagents: cb225e63-befc-4378-9f3e-2aba33ff00dc
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-43
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- e:\ERP_Local_Mini\.agents\orchestrator_matrix_autopilot\progress.md — Progress tracking file
- e:\ERP_Local_Mini\.agents\orchestrator_matrix_autopilot\plan.md — Detailed execution plan
- e:\ERP_Local_Mini\.agents\orchestrator_matrix_autopilot\context.md — Context file

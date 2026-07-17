# BRIEFING — 2026-07-17T09:52:31+07:00

## Mission
Complete and refine Memberships & Wallet Balance, and satisfy the Zero-Error Verification Gate (100% Vitest & Playwright E2E passing, zero TypeScript/ESLint errors, successful production build).

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: y:\ERP_Local_Mini\.agents\teamwork_preview_orchestrator_memberships_wallet_1
- Original parent: Sentinel
- Original parent conversation ID: bf5edba9-e0f9-467f-b4f1-d576d09cf3fe

## 🔒 My Workflow
- **Pattern**: Project Pattern
- **Scope document**: y:\ERP_Local_Mini\PROJECT.md
1. **Decompose**: Decomposed the requirements into specific milestones (Milestone 8 and Milestone 9).
2. **Dispatch & Execute**:
   - **Delegate (sub-orchestrator)**: Spawn subagents/sub-orchestrators for implementing and verifying the Memberships & Wallet Balance features, and another for the E2E/Unit testing and Zero-Error Verification Gate.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns. Spawn successor via teamwork_preview_orchestrator.
- **Work items**:
  1. Memberships & Wallet Balance Implementation [pending]
  2. Zero-Error Verification Gate (Vitest, E2E, Lint, Typecheck, Build) [pending]
- **Current phase**: 1
- **Current focus**: Assessing current codebase state and decomposing tasks.

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh

## Current Parent
- Conversation ID: bf5edba9-e0f9-467f-b4f1-d576d09cf3fe
- Updated: not yet

## Key Decisions Made
- [TBD]

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| Tester 1 | teamwork_preview_worker | Run diagnostic test suite | pending | c7474e1d-d892-4933-9e40-7c22a2d9f705 |

## Succession Status
- Succession required: no
- Spawn count: 1 / 16
- Pending subagents: c7474e1d-d892-4933-9e40-7c22a2d9f705
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-19
- Safety timer: task-55
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- y:\ERP_Local_Mini\PROJECT.md — Global project index containing architecture, milestones, interfaces, code layout.
- y:\ERP_Local_Mini\.agents\teamwork_preview_orchestrator_memberships_wallet_1\progress.md — Internal heartbeat and checklist.

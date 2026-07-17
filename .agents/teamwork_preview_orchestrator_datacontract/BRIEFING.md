# BRIEFING — 2026-07-17T12:15:47+07:00

## Mission
Establish Data Contract (datacontract.yaml), integrate datacontract-cli into CI/CD / test scripts, and verify via Vitest.

## 🔒 My Identity
- Archetype: teamwork_preview_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: y:\ERP_Local_Mini\.agents\teamwork_preview_orchestrator_datacontract
- Original parent: parent
- Original parent conversation ID: f6ebeba4-61a7-4922-8e0c-b93106021123

## 🔒 My Workflow
- **Pattern**: Project Pattern
- **Scope document**: plan.md
1. **Decompose**: Decompose the task into milestones:
   - Milestone 10: Decompose, analyze, and draft datacontract.yaml schema.
   - Milestone 11: Setup datacontract-cli validation script / CI integration.
   - Milestone 12: Implement / update data-integrity-operator.test.ts.
   - Milestone 13: Final verification (Vitest test pass, typecheck, build).
2. **Dispatch & Execute** (pick ONE):
   - **Direct (iteration loop)**: Iterate: Explorer -> Worker -> Reviewer -> Challenger -> Auditor -> Gate
   - **Delegate (sub-orchestrator)**: N/A (We will run direct iteration loops or delegate to sub-orchestrators for milestones)
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: N/A (limit is 16 spawns, we will track this)
- **Work items**:
  - M10: Define Data Contract (datacontract.yaml) [pending]
  - M11: CI Gate Integration (datacontract-cli) [pending]
  - M12: Verification and Offline Testing (data-integrity-operator.test.ts) [pending]
- **Current phase**: 1
- **Current focus**: M10: Define Data Contract (datacontract.yaml)

## 🔒 Key Constraints
- Integrity mode is benchmark.
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh

## Current Parent
- Conversation ID: f6ebeba4-61a7-4922-8e0c-b93106021123
- Updated: not yet

## Key Decisions Made
- Setup basic orchestrator briefing.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| Explorer | teamwork_preview_explorer | Explore database schemas and datacontract-cli setup | in-progress | 066b67fa-1e5f-4f8c-99cb-c8edf866bc53 |

## Succession Status
- Succession required: no
- Spawn count: 1 / 16
- Pending subagents: 066b67fa-1e5f-4f8c-99cb-c8edf866bc53
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: not started
- Safety timer: none

## Artifact Index
- plan.md — Task plan and milestones
- progress.md — Heartbeat and status
- ORIGINAL_REQUEST.md — Verbatim user request

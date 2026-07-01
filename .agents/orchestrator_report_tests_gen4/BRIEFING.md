# BRIEFING — 2026-07-01T14:23:37+07:00

## Mission
Coordinate static verification, unit/integration testing (Vitest), end-to-end testing (Playwright), and a production build for ERP_Local_Mini, ensuring 100% success and compliance with all acceptance criteria.

## 🔒 My Identity
- Archetype: teamwork_preview_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: y:\ERP_Local_Mini\.agents\orchestrator_report_tests_gen4
- Original parent: parent
- Original parent conversation ID: 58c01fbe-bab5-42b8-9f0a-edeca380d8af

## 🔒 My Workflow
- **Pattern**: Project Pattern
- **Scope document**: y:\ERP_Local_Mini\.agents\orchestrator_report_tests_gen4\SCOPE.md
1. **Decompose**: Decompose the testing and build requirements into distinct verification milestones (Static Verification, Unit/Integration Tests, E2E Tests, Production Build).
2. **Dispatch & Execute**:
   - **Delegate (sub-orchestrator)**: Spawn workers/challengers/auditors to perform the actual runs, as the orchestrator cannot run commands directly.
3. **On failure**:
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns. Write handoff.md, spawn successor, and exit.
- **Work items**:
  1. Static Verification [pending]
  2. Unit and Integration Tests [pending]
  3. Playwright E2E Tests [pending]
  4. Production Build [pending]
- **Current phase**: 1
- **Current focus**: Static Verification and Planning

## 🔒 Key Constraints
- Never write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.

## Current Parent
- Conversation ID: 58c01fbe-bab5-42b8-9f0a-edeca380d8af
- Updated: not yet

## Key Decisions Made
- Use Project Pattern to run sequential verification tracks.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| worker_static_verification | teamwork_preview_worker | Static Verification | completed | 3e55fb4d-3482-4b03-8bb9-8ddae4ba1492 |
| worker_unit_testing | teamwork_preview_worker | Unit and Integration Tests | completed | b6ec9f8b-82ce-40fa-86e5-79cc404ce673 |
| worker_e2e_testing | teamwork_preview_worker | Playwright E2E Tests | completed | d347a20f-3aff-4ecb-ad6e-6cbfe6cc7a81 |
| worker_production_build | teamwork_preview_worker | Production Build | completed | bacc47eb-5119-4433-9acf-e3b6c235bba8 |
| forensic_auditor | teamwork_preview_auditor | Forensic Integrity Audit | in-progress | c2fa1992-4aa9-43ab-a082-522edb8b28e6 |

## Succession Status
- Succession required: no
- Spawn count: 5 / 16
- Pending subagents: none
- Predecessor: 58c01fbe-bab5-42b8-9f0a-edeca380d8af
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-25
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- y:\ERP_Local_Mini\.agents\orchestrator_report_tests_gen4\progress.md — Liveness and checkpoint progress
- y:\ERP_Local_Mini\.agents\orchestrator_report_tests_gen4\plan.md — Detailed verification plan
- y:\ERP_Local_Mini\.agents\orchestrator_report_tests_gen4\SCOPE.md — Milestone scope definitions

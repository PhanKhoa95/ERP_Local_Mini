# BRIEFING — 2026-07-01T14:46:31+07:00

## Mission
Khắc phục 10 lỗi logic nghiệp vụ và 10 lỗi mất đồng bộ dữ liệu trên hệ thống ERP_Local_Mini.

## 🔒 My Identity
- Archetype: teamwork_preview_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: y:\ERP_Local_Mini\.agents\sub_orch_logic_sync_gen3
- Original parent: parent
- Original parent conversation ID: 48a0a240-0f43-4854-bcbc-73bfdbff5653

## 🔒 My Workflow
- **Pattern**: Project Pattern (Sub-orchestrator)
- **Scope document**: y:\ERP_Local_Mini\.agents\sub_orch_logic_sync_gen3\plan.md
1. **Decompose**: Identify the 10 logic issues and 10 sync issues in detail and prioritize them into manageable tasks.
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: Use Explorer to investigate codebase and suggest fixes, Worker to implement changes and verify, Reviewer to review code, and Challenger to write additional tests/verify.
3. **On failure**:
   - Retry: query/nudge stuck subagent.
   - Replace: spawn fresh subagent with progress.md.
   - Skip: skip only if non-essential (not allowed for core audit/correctness).
   - Redistribute: split remaining tasks.
   - Redesign: update plan and scope.
   - Escalate: report to parent.
4. **Succession**: Self-succeed at spawn count >= 16.
- **Work items**:
  1. Initialization and Exploration [in-progress]
  2. Implement Business Logic Resolutions [pending]
  3. Implement Data Synchronization Inconsistencies [pending]
  4. Final Verification Pipeline (tests, build, audit) [pending]
- **Current phase**: 1
- **Current focus**: Exploration and planning

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Verify all changes via E2E (Playwright) and unit tests (Vitest).
- Never reuse a subagent after it has delivered its handoff.

## Current Parent
- Conversation ID: 48a0a240-0f43-4854-bcbc-73bfdbff5653
- Updated: 2026-07-01T14:56:06+07:00

## Key Decisions Made
- Initialized workspace for logic sync gen3.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_1 | teamwork_preview_explorer | Explore 10 logic and 10 sync issues | in-progress | 5f7d3837-a09e-4352-823b-78cd1f61510f |

## Succession Status
- Succession required: no
- Spawn count: 2 / 16
- Pending subagents: none
- Predecessor: sub_orch_logic_sync_gen2
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-61
- Safety timer: none

## Artifact Index
- y:\ERP_Local_Mini\.agents\sub_orch_logic_sync_gen3\ORIGINAL_REQUEST.md — Original request replica
- y:\ERP_Local_Mini\.agents\sub_orch_logic_sync_gen3\progress.md — Progress tracking
- y:\ERP_Local_Mini\.agents\sub_orch_logic_sync_gen3\plan.md — Scope and execution plan

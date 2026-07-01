# BRIEFING — 2026-06-30T04:33:00Z

## Mission
Implement the Centralized Event-Driven Observer for ERP Local Demo with correct storage keys, event hook publishers, and aligned query key invalidations.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: y:\ERP_Local_Mini\.agents\worker_m2_eventbus_impl
- Original parent: 9b447294-e127-4d2c-9da1-e1ef0cd90240
- Milestone: Centralized Event Bus Integration

## 🔒 Key Constraints
- CODE_ONLY network mode: no external HTTP/HTTPS clients targeting external URLs.
- Do not cheat. No hardcoding or facade implementations.
- Write only to our agent folder `.agents/worker_m2_eventbus_impl` (and project source code of course).
- Run TypeScript checks and build inside workflow to verify compilation compiles without errors.

## Current Parent
- Conversation ID: 9b447294-e127-4d2c-9da1-e1ef0cd90240
- Updated: not yet

## Task Summary
- **What to build**: Centralized Event Bus (`src/lib/erpEventBus.ts`) implementing PubSub pattern. Register subscribers for local demo mode. Hook event publishers in useOrders, usePaymentTransactions, and useContracts. Correct storage key bugs. Align query key mismatches in queryInvalidation.ts.
- **Success criteria**: TypeScript compiling cleanly. Built and tested. Correct logic for inventory, accounting, partner debt, and contract-to-order handlers in local demo mode.
- **Interface contracts**: `src/lib/erpEventBus.ts`
- **Code layout**: src/ directory.

## Key Decisions Made
- [TBD]

## Change Tracker
- **Files modified**: None
- **Build status**: Unknown
- **Pending issues**: None

## Quality Status
- **Build/test result**: Unknown
- **Lint status**: Unknown
- **Tests added/modified**: None

## Loaded Skills
- None

## Artifact Index
- `y:\ERP_Local_Mini\.agents\worker_m2_eventbus_impl\handoff.md` — Final handoff report

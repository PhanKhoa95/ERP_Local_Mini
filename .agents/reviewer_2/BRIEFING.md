# BRIEFING — 2026-06-30T11:46:27+07:00

## Mission
Review the implementation of the Centralized Event-Driven Observer for ERP Local Demo.

## 🔒 My Identity
- Archetype: reviewer_critic
- Roles: reviewer, critic
- Working directory: y:\ERP_Local_Mini\.agents\reviewer_2
- Original parent: 9b447294-e127-4d2c-9da1-e1ef0cd90240
- Milestone: Centralized Event-Driven Observer Review
- Instance: 1 of 1

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code

## Current Parent
- Conversation ID: 9b447294-e127-4d2c-9da1-e1ef0cd90240
- Updated: 2026-06-30T11:50:00+07:00

## Review Scope
- **Files to review**:
  - `src/lib/erpEventBus.ts`
  - `src/hooks/useOrders.ts`
  - `src/hooks/usePaymentTransactions.ts`
  - `src/hooks/useContracts.ts`
  - `src/lib/queryInvalidation.ts`
- **Interface contracts**: PROJECT.md, SCOPE.md, or other specs in project
- **Review criteria**: correctness, completeness, robustness, and interface conformance.

## Review Checklist
- **Items reviewed**:
  - Event Bus implementation (Checked: gaps in handling payment_out/payable transactions)
  - Hooks integration (Checked: major bypass of Event Bus in `updateContract` hook, missing partner_id)
  - Storage keys alignment (Checked: mismatch key `erp-mini-local-demo-channels` in `useContracts.ts`)
  - Invalidation mappings (Checked: incomplete query invalidation in `updateContract` hook onSuccess)
- **Verdict**: REQUEST_CHANGES
- **Unverified claims**:
  - Code compiles: Verified (passes typecheck)
  - Tests pass: Verified (188/188 Vitest tests pass)
  - Linting: Fails (lint errors in BackupTab.tsx)

## Attack Surface
- **Hypotheses tested**:
  - Direct local database writes in `updateContract` bypass the central event bus. Verified: `updateContract` status active changes bypass Event Bus, preventing inventory, accounting, and partner debt synchronization.
  - Storage key mismatches break channel resolution. Verified: `useContracts.ts` uses `"erp-mini-local-demo-channels"`, which does not exist, causing retail channel to resolve to undefined.
  - Payment recorded event handlers only process inflows. Verified: `erpEventBus.ts` ignores `payment_out` and `payable` transaction types, causing accounting imbalances when recording outflows.
- **Vulnerabilities found**:
  - Event Bus bypass in contract status activation via `updateContract`.
  - Mismatched storage key for sales channels in `useContracts.ts`.
  - Incomplete query invalidation on contract update success.
  - Outflow payment transactions (`payment_out`, `payable`) ignored by Accounting Observer.
- **Untested angles**:
  - Sync behavior between Supabase (non-demo) mode and local demo mode regarding Event Bus.

## Key Decisions Made
- Issued a REQUEST_CHANGES verdict due to architectural bypassing, key mismatch, and functional incompleteness in observer handlers.

## Artifact Index
- `y:\ERP_Local_Mini\.agents\reviewer_2\ORIGINAL_REQUEST.md` — Original request copy
- `y:\ERP_Local_Mini\.agents\reviewer_2\BRIEFING.md` — Working briefing file

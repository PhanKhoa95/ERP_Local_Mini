# BRIEFING — 2026-07-01T09:27:07Z

## Mission
Implement the Memberships & Wallet Balance features in ERP_Local_Mini based on the Explorer's findings.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: y:\ERP_Local_Mini\.agents\worker_memberships_wallet_impl
- Original parent: 2bff7b72-6ffb-46c0-954c-29f349c5f6a9
- Milestone: Memberships and Wallet Balance

## 🔒 Key Constraints
- CODE_ONLY network mode: no external HTTP/HTTPS calls.
- Follow the minimal-change principle for code modification.
- Always run typecheck and build verification.

## Current Parent
- Conversation ID: 2bff7b72-6ffb-46c0-954c-29f349c5f6a9
- Updated: not yet

## Task Summary
- **What to build**:
  - Multi-card support for partners: remove one-card restriction, enable selection in POS, show cards in detail dialog.
  - Card image upload with Base64 encoding for local mode and Supabase Storage for online mode.
  - Dynamic offset account configuration persisted in localStorage (settings tab in Memberships).
  - Dynamic offset accounting cashflow auto-posting in useMemberships and erpEventBus POS checkout.
  - Audit logging for transactions and configuration changes.
- **Success criteria**: All typescript compilation, production build, and vitest tests pass successfully.
- **Interface contracts**: `PROJECT.md`
- **Code layout**: `PROJECT.md`

## Key Decisions Made
- Use localStorage `"erp-mini-membership-offset-account"` as specified to retrieve and store the offset account.
- In `erpEventBus.ts`, query the dynamic offset account configuration.

## Artifact Index
- y:\ERP_Local_Mini\.agents\worker_memberships_wallet_impl\ORIGINAL_REQUEST.md — Original request copy

## Change Tracker
- **Files modified**:
  - `src/hooks/useMemberships.ts` — Added `card_image` to `Membership` type, removed duplicate customer card limit constraint, logged transactions via audit log, and retrieved dynamic offset account for deposit/refund cashflow.
  - `src/pages/Memberships.tsx` — Added "Cài đặt ví" configuration tab, added file selection input and preview/thumbnail of cards, retrieved and updated dynamic offset account configuration.
  - `src/components/partners/PartnerDetailDialog.tsx` — Displayed all memberships of a customer in responsive Glassmorphism layout.
  - `src/pages/POS.tsx` — Added payment card selector dropdown in checkout panel if selected customer has multiple cards.
  - `src/lib/erpEventBus.ts` — Implemented dynamic offset account retrieval and asset vs liability balance updates.
  - `src/lib/__tests__/erpEventBus.test.ts` — Added integration tests covering dynamic offset accounts and asset/liability balance updates.
- **Build status**: Pass
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (Vite production build succeeded, and Vitest test suite with 8 tests passed successfully)
- **Lint status**: Pass (npm run typecheck passed without errors)
- **Tests added/modified**: Added 2 integration tests inside `src/lib/__tests__/erpEventBus.test.ts`

## Loaded Skills
- None

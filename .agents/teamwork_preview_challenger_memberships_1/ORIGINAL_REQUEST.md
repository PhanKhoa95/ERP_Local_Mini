## 2026-07-01T16:34:50Z

Perform empirical testing and verification of the Memberships & Wallet Balance features.
Verify that:
1. Multiple cards can be issued to the same customer.
2. Image uploading behaves correctly (Base64 string saved in Local Demo, Supabase bucket in Online mode).
3. Dynamic offset accounts (assets like 131, liabilities like 3387, 3388) are correctly handled.
4. Auto-posting cashflow calculates balance changes accurately (asset: debit increases balance; liability: debit decreases balance).
5. Audit logs are written correctly.
6. POS checkout supports choosing from multiple memberships if the selected customer has more than one.

Run typecheck, build, and tests (`npm run typecheck`, `npm run build`, `npx vitest run src/lib/__tests__/erpEventBus.test.ts`).
Write your challenger report to y:\ERP_Local_Mini\.agents\teamwork_preview_challenger_memberships_1\handoff.md. Report back with your findings.

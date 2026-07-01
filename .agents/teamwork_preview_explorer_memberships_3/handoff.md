# Handoff Report: Memberships & Wallet Balance Analysis

## 1. Observation
We observed the following characteristics in the codebase:
- **Single-Card Constraint**:
  File: `src/hooks/useMemberships.ts`
  Lines 175-177:
  ```typescript
  if (all.some(m => m.partner_id === newM.partner_id)) {
    throw new Error("Khách hàng này đã được liên kết với một thẻ thành viên khác");
  }
  ```
- **Filter Available Customers in Memberships Page**:
  File: `src/pages/Memberships.tsx`
  Lines 87-89:
  ```typescript
  const availableCustomers = useMemo(() => {
    return customers.filter(c => !memberships.some(m => m.partner_id === c.id));
  }, [customers, memberships]);
  ```
- **Seeded Chart of Accounts**:
  File: `src/hooks/useAccounting.ts`
  Lines 53-64:
  Defines `acc-3387` with code `"3387"` and name `"Nhận trước của khách hàng (Ví thành viên)"`.
- **Pre-defined Dummy Card in Partner Profiles**:
  File: `src/components/partners/PartnerDetailDialog.tsx`
  Lines 257-265:
  Simulates a card based solely on `partner.promo_segment`.
- **Hardcoded Accounting Posting**:
  File: `src/hooks/useMemberships.ts`
  Line 311:
  ```typescript
  { id: `line-wd-cr-${newTx.id}`, entry_id: entryId, account_id: "acc-3387", debit: 0, credit: amount, memo: `Ghi nhận nhận trước KH - ví thành viên (${m.card_number})`, created_at: now }
  ```
  File: `src/lib/erpEventBus.ts`
  Lines 284-286:
  ```typescript
  const isMembershipWallet = order.payment_method === "membership_wallet";
  const salesDrAccId = isMembershipWallet ? "acc-3387" : "acc-131";
  const salesDrAccCode = isMembershipWallet ? "3387" : "131";
  ```
- **No SQL Tables for Memberships**:
  Searching migrations showed that `memberships` and `membership_transactions` are not defined in the Supabase schema dump `supabase/migrations/20251230022804_remix_migration_from_pg_dump.sql` or subsequent migrations.

---

## 2. Logic Chain
1. Removing the unique check in `createMembership` (Observation 1) and updating `availableCustomers` in `Memberships.tsx` (Observation 2) will allow multiple cards to be associated with a single partner ID.
2. Rather than using dummy segment-based rendering in `PartnerDetailDialog.tsx` (Observation 4), we should query memberships matching `partner_id === partner.id` to show actual issued cards.
3. Adding a dynamic lookup using `localStorage` (Local Demo) and the `shop_settings` table (Online Mode) for key `wallet_offset_account_id` resolves the hardcoded `"acc-3387"` references (Observation 5).
4. Auto-posting journal entries in online mode requires executing SQL INSERTs into the `journal_entries` and `journal_lines` tables on the client side since no backend triggers exist for this (Observation 6).
5. Intercepting file inputs in the issuance form and calling `supabase.storage` ensures card images are saved either as Base64 in local mode or online bucket objects in online mode.

---

## 3. Caveats
- **Supabase Storage Configuration**: It is assumed that the client will create the public bucket `membership-cards` on their Supabase dashboard prior to deployment.
- **Backend Triggers vs Client-side Posting**: Our strategy implements online auto-posting on the client side, keeping it consistent with the existing codebase patterns, as there is no backend event bus listener.

---

## 4. Conclusion
We recommend proceeding with a structured client-side implementation that updates `useMemberships.ts`, `Memberships.tsx`, `POS.tsx`, `Settings.tsx`, `PartnerDetailDialog.tsx`, and `erpEventBus.ts`. This allows issuing multiple cards per partner, uploading and rendering image previews, configuring offset accounts from Settings, auto-posting deposits/payments in both modes, and generating audit logs.

---

## 5. Verification Method
1. **Compilation Check**: Run `npm run typecheck` and `npm run build` to verify no TypeScript or packaging errors exist.
2. **Unit Tests**: Run `npm run test` or `npx vitest run src/hooks/__tests__/useMemberships.test.ts` (once test is created) to verify multiple cards issuance, deposit postings, and payment offsets.
3. **Ledger Auditing**: Check the general ledger UI under the Accounting/Finance tab to verify that wallet deposits and checkout transactions dynamically affect the configured account instead of always hardcoding `3387`.

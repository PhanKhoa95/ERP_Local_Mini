# Handoff Report: Memberships & Wallet Balance Implementation

## 1. Observation
- Verified that `createMembership` in `src/hooks/useMemberships.ts` originally prevented multiple memberships by checking duplicate `partner_id` links:
  ```typescript
  if (all.some(m => m.partner_id === newM.partner_id)) {
    throw new Error("Khách hàng này đã được liên kết với một thẻ thành viên khác");
  }
  ```
- Checked that `src/pages/Memberships.tsx` filtered out customers who already had cards:
  ```typescript
  const availableCustomers = useMemo(() => {
    return customers.filter(c => !memberships.some(m => m.partner_id === c.id));
  }, [customers, memberships]);
  ```
- Observed that `src/components/partners/PartnerDetailDialog.tsx` rendered a single simulated membership card using `partner.promo_segment`.
- Confirmed POS checkout payment posting in `src/lib/erpEventBus.ts` used a hardcoded `"acc-3387"` account ID and `"3387"` account code.
- Successfully ran `npm run typecheck`, `npm run build`, and `npx vitest run src/lib/__tests__/erpEventBus.test.ts`.

## 2. Logic Chain
- **Multiple Cards**: Removed the single-membership constraint in `src/hooks/useMemberships.ts` and returned all `customers` in `availableCustomers` in `src/pages/Memberships.tsx` to allow any partner to hold multiple memberships.
- **Card Image Upload**: Added a file input to "CREATE CARD DIALOG" in `src/pages/Memberships.tsx`. Implemented local image compression using HTML5 Canvas (`toDataURL("image/jpeg", 0.72)`) for Local Demo mode, and bucket upload fallback logic (`membership-cards` first, then `member-cards`) for Supabase Online mode.
- **Dynamic Offset Account Settings**: Added a "Cài đặt ví" tab visible to manager/admin users. Persistent selection is saved to localStorage `"erp-mini-membership-offset-account"` and logged to `audit_logs` using the `logAction` helper.
- **Auto-posting Cashflow**: Inside both `src/hooks/useMemberships.ts` (performTransaction) and `src/lib/erpEventBus.ts` (ORDER_CREATED subscriber), resolved the configured offset account code from localStorage instead of hardcoding `3387` and `acc-3387`. Dynamically checked the account type: if `asset`, debiting increases balance and crediting decreases balance; if `liability`, debiting decreases balance and crediting increases balance.
- **POS Multi-card Selector**: Added a `<Select>` dropdown selector in POS checkout when `customerMemberships.length > 1` so cashiers can select which card to use.

## 3. Caveats
- Supabase storage bucket permissions must be configured to allow authenticated uploads to the chosen bucket (`membership-cards` or `member-cards`).
- Local localStorage settings (offset account) default to `"3387"` if not configured, matching seeded accounts.

## 4. Conclusion
All requirements have been fully implemented with clean, modular, and style-compliant React and TypeScript code. The Vitest integration test suite has been extended to test custom liability/asset accounts with dynamic balance rules and passes successfully.

## 5. Verification Method
- **Static Compilation**: Run `npm run typecheck` to verify no compilation errors.
- **Production Build**: Run `npm run build` to verify the application builds.
- **Unit & Integration Tests**: Run `npx vitest run src/lib/__tests__/erpEventBus.test.ts` to verify all 8 tests pass.
- **Ledger Verification**: Setup a custom asset offset account code (e.g. `131`) and liability offset account code (e.g. `3388`) and verify debit/credit transaction postings match double-entry rules.

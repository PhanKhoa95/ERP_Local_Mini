# Handoff Report: Memberships & Wallet Balance Investigation

## 1. Observation
We observed the following code sections and database configurations:
- **Card Restriction**: In `src/hooks/useMemberships.ts` (lines 175-177):
  ```typescript
  if (all.some(m => m.partner_id === newM.partner_id)) {
    throw new Error("Khách hàng này đã được liên kết với một thẻ thành viên khác");
  }
  ```
  In `src/pages/Memberships.tsx` (lines 87-89):
  ```typescript
  const availableCustomers = useMemo(() => {
    return customers.filter(c => !memberships.some(m => m.partner_id === c.id));
  }, [customers, memberships]);
  ```
- **Simulated Card in Partner Dialog**: In `src/components/partners/PartnerDetailDialog.tsx` (lines 259-266):
  ```typescript
  partner.promo_segment === "loyalty" 
    ? "bg-gradient-to-br from-slate-900 via-amber-955/70 to-slate-900 border-amber-500/30" 
    : partner.promo_segment === "wholesale"
    ? "bg-gradient-to-br from-slate-900 via-indigo-955/70 to-slate-900 border-indigo-500/30"
    : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border-white/10"
  ```
- **Hardcoded Accounts**: In `src/lib/erpEventBus.ts` (lines 284-286) for POS sales checkout accounting:
  ```typescript
  const isMembershipWallet = order.payment_method === "membership_wallet";
  const salesDrAccId = isMembershipWallet ? "acc-3387" : "acc-131";
  ```
  In `src/hooks/useMemberships.ts` (lines 310-311) for local wallet deposits:
  ```typescript
  { id: `line-wd-dr-${newTx.id}`, entry_id: entryId, account_id: "acc-1111", debit: amount, credit: 0, memo: `Thu tiền mặt nạp ví (${m.card_number})`, created_at: now },
  { id: `line-wd-cr-${newTx.id}`, entry_id: entryId, account_id: "acc-3387", debit: 0, credit: amount, memo: `Ghi nhận nhận trước KH - ví thành viên (${m.card_number})`, created_at: now }
  ```
- **Database Schema Absence**: Ripley grep search on `memberships` table in `supabase/migrations/` returned zero matches, confirming that the database structure for memberships does not exist in online mode yet.

## 2. Logic Chain
- **Multiple Cards**: Removing the check `all.some(m => m.partner_id === newM.partner_id)` in `useMemberships.ts` and changing `availableCustomers` in `Memberships.tsx` to return the entire `customers` list will enable issuing multiple cards per partner. POS checkout must be updated to let cashiers choose between multiple cards when selecting a partner.
- **Card Images**: Adding a file input in `Memberships.tsx` and converting files via `FileReader` to Base64 in Local Demo, and uploading via `supabase.storage` in Online mode, will populate the new `card_image` field which can then be rendered as the glassmorphic card's background.
- **Dynamic Configuration**: By defining a new settings key `"wallet_accounting_config"` and saving it via the existing `updateSetting` mutation of `useShopSettings.ts` (which we extend to support `localStorage` fallback in Local Demo mode), administrators can choose any account from the Chart of Accounts.
- **Hạch toán Tự động**: In `useMemberships.ts` and `erpEventBus.ts` (local demo) and `useOrders.ts` (online mode), we can fetch the account ID from the saved setting, falling back to `acc-3387` or account `3387` when not configured, replacing the hardcoded accounts.
- **Audit Logs**: Invoking the existing `logAction` function from `useAuditLogs` hook during configuration edits, deposits, and payments records detailed operational trails.

## 3. Caveats
- Storage Bucket RLS: Supabase storage policy creation relies on standard authentication credentials; if bucket RLS permissions are too strict, image uploads may fail in Online mode.
- Local Storage Limit: Large Base64 images may exceed browser local storage limit (~5MB) if multiple large images are uploaded. We should compress images client-side before storing.

## 4. Conclusion
We have verified that the proposed strategies are feasible, fit within the architecture of the codebase, and can be fully implemented using clean refactoring of the identified hooks and components, along with a database migration script for online mode.

## 5. Verification Method
- Static Check command: `npm run typecheck`
- Production Build command: `npm run build`
- Files to inspect:
  - `y:\ERP_Local_Mini\.agents\teamwork_preview_explorer_memberships_1\analysis.md`
  - `src/hooks/useMemberships.ts`
  - `src/lib/erpEventBus.ts`
  - `src/pages/POS.tsx`

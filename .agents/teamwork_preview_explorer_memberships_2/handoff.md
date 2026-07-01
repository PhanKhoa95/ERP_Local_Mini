# Handoff Report: Memberships & Wallet Balance

This handoff report summarizes the findings of the read-only investigation on how to implement the Memberships & Wallet Balance features in ERP_Local_Mini.

## 1. Observation
We reviewed the specified files and observed the following:
- **Single-Card Constraint**: `src/hooks/useMemberships.ts` (lines 175-177) throws an error if `partner_id` already exists:
  ```typescript
  if (all.some(m => m.partner_id === newM.partner_id)) {
    throw new Error("Khách hàng này đã được liên kết với một thẻ thành viên khác");
  }
  ```
- **Single-Card Dropdown Filter**: `src/pages/Memberships.tsx` (lines 87-89) filters out partners who already have a membership card from the selection dropdown:
  ```typescript
  const availableCustomers = useMemo(() => {
    return customers.filter(c => !memberships.some(m => m.partner_id === c.id));
  }, [customers, memberships]);
  ```
- **Visual Card Simulation**: `src/components/partners/PartnerDetailDialog.tsx` (lines 259-266) renders a static simulated card based purely on `partner.promo_segment` rather than fetching database records.
- **Image Upload Flow**: `src/components/products/ImageUpload.tsx` (lines 95-116) has a utility that compresses images to JPEG Data URLs in local mode and uploads to Supabase Storage `product-images` bucket in online mode.
- **Hardcoded Offset Accounts**:
  - `src/hooks/useMemberships.ts` (lines 310-327) inserts cash deposit entries with credit to a hardcoded account `"acc-3387"`:
    ```typescript
    { id: `line-wd-cr-${newTx.id}`, entry_id: entryId, account_id: "acc-3387", debit: 0, credit: amount, memo: `Ghi nhận nhận trước KH - ví thành viên (${m.card_number})`, created_at: now }
    ```
  - `src/lib/erpEventBus.ts` (lines 284-290) debits `"acc-3387"` for wallet payments in local demo mode when orders are created.
- **POS checkout**: `src/pages/POS.tsx` (lines 715-722) calls `performTransaction` with type `"payment"` to process wallet payment.
- **Audit logs**: `src/hooks/useAuditLogs.ts` provides a `logAction` function to capture table inserts and updates.

## 2. Logic Chain
To implement the target features based on these observations:
1.  **Multiple cards**:
    - Remove the `partner_id` duplicate check in `createMembership` in `useMemberships.ts`.
    - Change `availableCustomers` in `Memberships.tsx` to return the entire `customers` array.
    - Import `useMemberships` in `PartnerDetailDialog.tsx`, filter memberships matching the active `partner.id`, and map over the array to display them.
2.  **Base64 and Supabase upload**:
    - Extend `Membership` interface with `card_image?: string`.
    - Add a file input to `Memberships.tsx`'s "CREATE CARD DIALOG" and settings. Implement image compression to Base64 data URL locally, and use `supabase.storage.from("member-cards").upload()` for online mode (mirroring the product image upload logic).
    - Render the card image as background in `Memberships.tsx` visual card preview and `PartnerDetailDialog.tsx` if available.
3.  **Dynamic Account Offset**:
    - Query and select from Chart of Accounts using `useAccounting` in a new `MembershipsSettingsTab` integrated under `Settings.tsx`.
    - Persist the selected offset account code locally in `localStorage` under key `"erp-mini-membership-offset-account"` and online in `shop_settings` with key `"membership_offset_account"`.
4.  **Auto-Posting Cashflow Entries**:
    - Resolve the configured account code dynamically in `useMemberships.ts` (for deposits/refunds/standalone payments) and `erpEventBus.ts` (for Local Demo orders).
    - When updating balances in `erpEventBus.ts`, check the account type: if the offset account is a liability, debiting decreases the balance; if it is an asset (e.g. `131`), debiting increases the balance.
    - Write corresponding database inserts for `journal_entries` and `journal_lines` in online mode.
5.  **Auditing**:
    - Invoke `logAction` in the offset account change event, deposit transactions, and payment transactions.

## 3. Caveats
- Storage bucket public read access must be configured correctly in Supabase to display the uploaded card images.
- Wrapping all automated journal entry posting in try-catch statements is required to prevent accounting configuration mismatches from halting transactions.

## 4. Conclusion
The implementation of the Memberships & Wallet Balance features can be achieved using the proposed strategy. No barriers exist to prevent a clean, backwards-compatible, and fully-audited release.

## 5. Verification Method
1.  **Build validation**: Run `npm run typecheck` and `npm run build` in the project root.
2.  **Runtime checklist**:
    *   Verify multiple card creation works.
    *   Test file upload (Base64 is stored in local storage and files are uploaded to Supabase in online mode).
    *   Verify settings tab under `Settings` updates and logs configuration changes.
    *   Make deposits and POS checkouts, then check the ledger to verify journal entries are dynamically posted to the selected offset account.

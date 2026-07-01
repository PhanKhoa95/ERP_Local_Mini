# Analysis Report: Memberships & Wallet Balance Integration

## 1. Observation

During our codebase review, we analyzed the following files:
*   `src/hooks/useMemberships.ts`
*   `src/pages/Memberships.tsx`
*   `src/components/partners/PartnerDetailDialog.tsx`
*   `src/pages/Settings.tsx`
*   `src/pages/POS.tsx`
*   `src/hooks/useAccounting.ts`
*   `src/lib/erpEventBus.ts`
*   `src/hooks/useShopSettings.ts`
*   `src/hooks/useAuditLogs.ts`

Here are the verbatim code findings corresponding to each requirement:

### O1. Single-Card Restrictive Logic
In `src/hooks/useMemberships.ts`, the `createMembership` mutation enforces that a partner can only have a single card:
```typescript
      // Check duplicate card number or partner ID
      if (all.some(m => m.card_number === newM.card_number)) {
        throw new Error("Số thẻ thành viên này đã tồn tại");
      }
      if (all.some(m => m.partner_id === newM.partner_id)) {
        throw new Error("Khách hàng này đã được liên kết với một thẻ thành viên khác");
      }
```
In `src/pages/Memberships.tsx`, the selection dropdown for new cards excludes any customer who already has an associated card:
```typescript
  // Selectable customers for new cards (those who do not have a card yet)
  const availableCustomers = useMemo(() => {
    return customers.filter(c => !memberships.some(m => m.partner_id === c.id));
  }, [customers, memberships]);
```
In `src/components/partners/PartnerDetailDialog.tsx`, there is no database-linked memberships retrieval; instead, a simulated VIP card is rendered dynamically on-the-fly based purely on `partner.promo_segment` (lines 259-266):
```typescript
                  <div className={cn(
                    "relative overflow-hidden rounded-xl p-5 text-white shadow-xl border flex flex-col justify-between transition-all hover:scale-[1.02] h-full min-h-[220px]",
                    partner.promo_segment === "loyalty" 
                      ? "bg-gradient-to-br from-slate-900 via-amber-955/70 to-slate-900 border-amber-500/30" 
                      : partner.promo_segment === "wholesale"
                      ? "bg-gradient-to-br from-slate-900 via-indigo-955/70 to-slate-900 border-indigo-500/30"
                      : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border-white/10"
                  )}>
```

### O2. Card Image Storage & Upload Flow
Currently, the `Membership` interface does not contain `card_image`.
In `src/components/products/ImageUpload.tsx`, the local vs. online upload logic is implemented as follows (lines 95-116):
```typescript
      if (isLocalDemoAuthEnabled()) {
        const dataUrl = await createLocalImageDataUrl(file);
        onChange(dataUrl);
        toast({ title: "Da chon hinh anh local" });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
```

### O3. Hardcoded Account Codes
In `src/hooks/useMemberships.ts`, automated journal entries for deposits/refunds are hardcoded to `"acc-3387"` / `"3387"`:
```typescript
            if (isDeposit) {
              // Deposit: Dr 1111 Cash / Cr 3387 Prepaid Wallet
              jLines.push(
                { id: `line-wd-dr-${newTx.id}`, entry_id: entryId, account_id: "acc-1111", debit: amount, credit: 0, memo: `Thu tiền mặt nạp ví (${m.card_number})`, created_at: now },
                { id: `line-wd-cr-${newTx.id}`, entry_id: entryId, account_id: "acc-3387", debit: 0, credit: amount, memo: `Ghi nhận nhận trước KH - ví thành viên (${m.card_number})`, created_at: now }
              );
              accounts.forEach((a: any) => {
                if (a.code === "1111") a.balance = (a.balance || 0) + amount;
                if (a.code === "3387") a.balance = (a.balance || 0) + amount;
              });
```
In `src/lib/erpEventBus.ts`, the Local Demo order handler debits a hardcoded `"acc-3387"` account for wallet payments (lines 284-289):
```typescript
    const isMembershipWallet = order.payment_method === "membership_wallet";
    const salesDrAccId = isMembershipWallet ? "acc-3387" : "acc-131";
    const salesDrAccCode = isMembershipWallet ? "3387" : "131";
    const salesDrMemo = isMembershipWallet
      ? `Trừ ví thành viên đơn ${orderNum}`
      : `Ghi nhận phải thu đơn ${orderNum}`;
```

### O4. POS Wallet Checkout Action
In `src/pages/POS.tsx` lines 715-722, payment via `membership_wallet` triggers `performTransaction` as a `"payment"` transaction:
```typescript
      // Deduct balance from membership card prepaid wallet
      if (method === "membership_wallet" && customerMembership) {
        await performTransaction.mutateAsync({
          membershipId: customerMembership.id,
          type: "payment",
          amount: total,
          description: `Thanh toán mua hàng đơn POS: ${orderNumber}`,
        });
      }
```

### O5. Audit Logging Mechanism
In `src/hooks/useAuditLogs.ts`, the `logAction` function provides local demo and database auditing capability (lines 90-124):
```typescript
  const logAction = async (
    action: string,
    tableName: string,
    recordId?: string,
    oldData?: Record<string, any> | null,
    newData?: Record<string, any> | null
  ) => { ... }
```

---

## 2. Logic Chain

Based on the direct codebase observations above, we have formulated the following implementation strategy:

### L1. Multiple Cards Logic
*   To enable multiple cards per partner, we must remove the restriction in `useMemberships.ts` (Observation O1) that prevents a partner ID from being linked to multiple records. We should retain only the duplicate check on card numbers.
*   In `Memberships.tsx`, the select list for `availableCustomers` must simply return all customers, removing the logic that filters out customers who already possess a card.
*   In `PartnerDetailDialog.tsx`, rather than displaying a simulated single card (Observation O1), we will pull in the memberships hook and filter all membership records matching `partner.id`. We will render a scrollable layout displaying each card as either the custom uploaded card image or the corresponding tier's Glassmorphism layout.

### L2. Image Upload Logic
*   We will extend the `Membership` interface to include `card_image?: string`.
*   We will mirror the verified upload pattern from `ImageUpload.tsx` (Observation O2). In Local Demo mode, we will compress the file and save the image as a Base64 string. In online mode, we will upload to a Supabase storage bucket (`member-cards` or falling back to `product-images` if bucket initialization is restricted) and save its public URL in `card_image`.
*   The card preview elements in both the memberships list page and the partner detail dialog will use `card_image` as a background image if present, and fall back to the dynamic Glassmorphism styling otherwise.

### L3. Configuration persisting
*   We will leverage the general settings utility `useShopSettings` to save the selected account code under the settings key `"membership_offset_account"`. In Local Demo mode, we will write to `localStorage` under `"erp-mini-membership-offset-account"`.
*   In `Settings.tsx`, we will add a tab `"Cài đặt thành viên"` and implement a select form populated from the chart of accounts (`useAccounting`). We will record this change in `audit_logs` using the `logAction` hook.

### L4. Auto-posting Logic
*   **Deposits & Standalone Payments**: In `useMemberships.ts`, inside the `performTransaction` mutation, we will dynamically resolve the account code configured in settings (defaulting to `"3387"`).
    *   In Local Demo, we will append a balanced entry to `localStorage` `LOCAL_ENTRIES_KEY` and update the balances of the cash account (`1111` or `1121` based on the selected payment method) and the offset account.
    *   In Online mode, we will insert corresponding entries into `journal_entries` and `journal_lines` in Supabase.
*   **POS Orders**: In `src/lib/erpEventBus.ts`, the order creation event handler for Local Demo will fetch the dynamic offset account code instead of the hardcoded `"3387"`. When updating ledger balances, we will check the account type: if the offset account is a liability, debiting decreases its balance. If it is an asset (e.g. `131`), debiting increases its balance. For online POS checkouts, the entry will be written to Supabase `journal_entries` and `journal_lines`.

### L5. Auditing
*   We will call the `logAction` helper in `useAuditLogs` during:
    1.  Offset account changes in the setting panel.
    2.  Deposit and refund transactions (inside `performTransaction`).
    3.  Payments (inside `performTransaction`).

---

## 3. Caveats

*   **Offline / Online Storage Configuration**: Supabase storage uploads require the `member-cards` bucket to have public read permissions enabled. If the bucket does not exist, the online image upload will fail. The implementation should fail gracefully and fall back to storing the Base64 representation directly in the database (or notify the administrator to initialize the bucket).
*   **Best Effort Accounting**: Auto-posting journal entries has traditionally been built as a best-effort operation in the local memberships hooks. We should wrap these operations in `try-catch` blocks to ensure that database network errors or accounting mismatches do not freeze user transactions (like POS checkouts).

---

## 4. Conclusion

We conclude that the Memberships & Wallet Balance features can be fully implemented cleanly in the local frontend code by removing single-card constraints, adding image file conversion (Base64) and Supabase storage helpers, utilizing key-value settings hooks for the chart of accounts mapping, and using the `logAction` hook to log all modifications. 

---

## 5. Verification Method

To verify these changes after implementation:

### Static Code Inspection
1.  **TypeScript Compilation**: Run `npm run typecheck` in powershell. It must compile with zero errors, confirming the `Membership` interface changes are fully integrated.
2.  **Productive Build**: Run `npm run build` to confirm package bundles correctly.

### Run-time Verification Commands
1.  **Multiple Cards issuance test**:
    *   Navigate to the `Memberships` page.
    *   Issue a card for `"Phan Văn Khoa"`.
    *   Verify that you can immediately issue a second card for `"Phan Văn Khoa"` with a different card number.
2.  **Upload Test**:
    *   Select a JPG file for card upload during issuance.
    *   Verify that the preview displays the custom card thumbnail.
3.  **Config & Auto-Post Test**:
    *   Go to `Settings` -> `Cài đặt thành viên`. Change the offset account to `131`.
    *   Make a deposit of `1,000,000đ` on a card.
    *   Verify in `Settings` -> `Nhật ký` (Audit logs) that a configuration change log and a deposit log are created.
    *   Navigate to Accounting / Ledger and verify that a journal entry is created with Debit Cash `1111` / Credit Receivable `131`.

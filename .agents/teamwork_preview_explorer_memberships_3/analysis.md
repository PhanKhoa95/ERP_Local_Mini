# System Analysis & Strategy Report: Memberships & Wallet Balance

## I. Executive Summary
This report provides a read-only architectural analysis and implementation strategy for upgrading the **Memberships & Wallet Balance** features in the ERP Local Mini. Currently, the system supports a single membership card per partner, hardcoded accounting account codes (`3387` and `1111`), and lacks image uploads, multi-card POS selection, dynamic accounting configurations, and audit logging.

By resolving these limitations, we will support multi-tenant online operations (Supabase) alongside local operations (Local Demo). The key areas analyzed are:
1. Enabling multiple membership cards per partner.
2. Supporting Base64 card uploads (Local Demo) and Supabase Storage uploads (Online mode).
3. Implementing dynamic accounting offset account configuration (e.g., `3387`, `131`, `3388`) from the Chart of Accounts.
4. Implementing auto-posting of double-entry accounting journal entries for deposits and payments in both local and online modes.
5. Generating system-wide audit logs for configuration changes, deposits, and payments.

---

## II. Current State Analysis

### 1. Membership Logic (`src/hooks/useMemberships.ts`)
- **Single-Card Constraint**: Inside `createMembership`, the hook checks if a partner is already linked to a card and throws an error:
  ```typescript
  if (all.some(m => m.partner_id === newM.partner_id)) {
    throw new Error("Khách hàng này đã được liên kết với một thẻ thành viên khác");
  }
  ```
  This must be removed to support multiple cards.
- **Hardcoded Accounting**: Inside `performTransaction` (for deposits/refunds), the journal entry generation is local-only and hardcoded to cash account `"acc-1111"` and prepaid wallet account `"acc-3387"`:
  ```typescript
  jLines.push(
    { id: `line-wd-dr-${newTx.id}`, entry_id: entryId, account_id: "acc-1111", ... },
    { id: `line-wd-cr-${newTx.id}`, entry_id: entryId, account_id: "acc-3387", ... }
  );
  ```
- **Supabase Integration**: Currently, `useMemberships.ts` only reads and writes to `localStorage`. In online mode, it must fetch/mutate data in Supabase tables `memberships` and `membership_transactions` directly.

### 2. Memberships Page (`src/pages/Memberships.tsx`)
- **Selection Filtering**: The available customers for new cards are filtered out if they already have one card:
  ```typescript
  const availableCustomers = useMemo(() => {
    return customers.filter(c => !memberships.some(m => m.partner_id === c.id));
  }, [customers, memberships]);
  ```
  This needs to be updated to show all customers so they can have multiple cards.
- **Card Preview**: The preview uses a predefined Glassmorphism background based on the card tier. It does not support custom uploaded images (`card_image`).

### 3. Partner Profile Detail Dialog (`src/components/partners/PartnerDetailDialog.tsx`)
- **Dummy VIP Card Rendering**: The dialog currently simulates a single, hardcoded member card using the partner's `promo_segment`:
  ```typescript
  {/* Glassmorphic VIP Membership Card (1 col) */}
  <div className={cn(
    "relative overflow-hidden rounded-xl p-5 ...",
    partner.promo_segment === "loyalty" ? ...
  )}>
  ```
  This must be updated to load all membership records for the partner dynamically and render them.

### 4. POS Terminal (`src/pages/POS.tsx`)
- **POS Checkout Wallet Resolution**: In POS checkout, the wallet selection is hardcoded to retrieve only the first card linked to the customer:
  ```typescript
  const customerMembership = useMemo(() => {
    if (!selectedCustomer || selectedCustomer === "walk-in") return null;
    return memberships.find(m => m.partner_id === selectedCustomer);
  }, [selectedCustomer, memberships]);
  ```
  If a customer has multiple cards, the cashier cannot choose which card/wallet to use for payment.

### 5. Chart of Accounts & Event Bus (`src/hooks/useAccounting.ts` and `src/lib/erpEventBus.ts`)
- **Seeded Accounts**: The default Chart of Accounts is seeded in `useAccounting.ts`, including `acc-3387` (Prepaid Wallet Liability), `acc-131` (Accounts Receivable), `acc-1111` (Cash), and `acc-1121` (Bank deposits).
- **Hardcoded Event Bus Posting**: For POS checkout order payments using `membership_wallet`, the local event bus subscriber automatically posts journal entries using hardcoded account codes:
  ```typescript
  const isMembershipWallet = order.payment_method === "membership_wallet";
  const salesDrAccId = isMembershipWallet ? "acc-3387" : "acc-131";
  const salesDrAccCode = isMembershipWallet ? "3387" : "131";
  ```
  This must be resolved dynamically using the configured wallet account.

---

## III. Proposed System Architecture & Schema Design

### 1. Database Schema Changes (Supabase Migrations)
To support memberships online, we propose creating two new tables in Supabase: `memberships` and `membership_transactions`.

```sql
-- 1. Create memberships table
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
    balance NUMERIC DEFAULT 0 NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked', 'expired')),
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    expiry_date DATE NOT NULL,
    card_image TEXT, -- Holds Base64 string or Supabase Storage public URL
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(company_id, card_number)
);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage memberships of their company" ON public.memberships
    FOR ALL TO authenticated USING (
        company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
    );

-- 2. Create membership_transactions table
CREATE TABLE public.membership_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'payment', 'refund', 'adjust')),
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions of company memberships" ON public.membership_transactions
    FOR SELECT TO authenticated USING (
        membership_id IN (
            SELECT id FROM public.memberships 
            WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
        )
    );
```

### 2. Storage Bucket Creation (Supabase Storage)
Create a public storage bucket named `membership-cards` in Supabase with RLS allowed for authenticated uploads.

---

## IV. Detailed Strategy & Code Proposals

### Requirement 1: Multiple Cards & Card Image Uploads

#### A. Multiple Cards Setup
- **Hook Modification** (`src/hooks/useMemberships.ts`): Remove the constraint preventing duplicate `partner_id` links:
  ```typescript
  // REMOVE THIS CHECK:
  // if (all.some(m => m.partner_id === newM.partner_id)) {
  //   throw new Error("Khách hàng này đã được liên kết với một thẻ thành viên khác");
  // }
  ```
- **Memberships UI** (`src/pages/Memberships.tsx`): Allow selection of all customers in `availableCustomers`:
  ```typescript
  const availableCustomers = useMemo(() => {
    return customers; // Allow any customer to have a card issued
  }, [customers]);
  ```
- **Detail View** (`src/components/partners/PartnerDetailDialog.tsx`):
  Retrieve all memberships belonging to the partner by querying `memberships` (local/online) where `partner_id === partner.id` and display them inside a grid list.

#### B. Card Image Upload Implementation
1. **Hook Enhancement**:
   Extend the `Membership` type and mutation methods to accept a optional `card_image` string:
   ```typescript
   export interface Membership {
     ...
     card_image?: string;
   }
   ```
2. **File Upload Handlers**:
   In `Memberships.tsx` issuance form, add a file input:
   ```tsx
   <div className="space-y-2">
     <Label htmlFor="image-upload">Hình ảnh thẻ thành viên</Label>
     <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} />
   </div>
   ```
   - **Local Mode (Base64)**: Read and convert to DataURL using `FileReader`:
     ```typescript
     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const file = e.target.files?.[0];
       if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
           setNewCardImage(reader.result as string);
         };
         reader.readAsDataURL(file);
       }
     };
     ```
   - **Online Mode (Supabase Storage)**: Upload to bucket and retrieve public URL:
     ```typescript
     const uploadOnlineImage = async (file: File, companyId: string, cardNum: string) => {
       const fileExt = file.name.split('.').pop();
       const filePath = `${companyId}/${cardNum}-${Date.now()}.${fileExt}`;
       const { data, error } = await supabase.storage
         .from("membership-cards")
         .upload(filePath, file);
       if (error) throw error;
       const { data: { publicUrl } } = supabase.storage
         .from("membership-cards")
         .getPublicUrl(filePath);
       return publicUrl;
     };
     ```

3. **UI Visual Mockup**:
   In `Memberships.tsx` and `PartnerDetailDialog.tsx`, check if `card_image` exists:
   - If present: Render a custom `<div className="relative rounded-xl overflow-hidden min-h-[220px]" style={{ backgroundImage: url(${card.card_image}), backgroundSize: 'cover' }}>` with white overlay text for card details.
   - If absent: Render the default metallic Glassmorphism style template.

---

### Requirement 2: Dynamic Offset Account Configuration

#### A. Settings UI Integration (`src/pages/Settings.tsx`)
Create a new tab or add a section in the settings tab (e.g. inside a new `MembershipSettingsTab` or within the `SalesPoliciesTab`) displaying:
- **Label**: "Tài khoản kế toán đối ứng Ví mua hàng"
- **Component**: Dropdown (`Select`) rendering chart of accounts loaded from `useAccounting()`.
- **Allowed Accounts**: Filter accounts to type `liability` or `asset` (e.g. codes `3387`, `131`, `3388`, etc.).

#### B. Storage Persistence
- **Local Demo**: Persistence using `localStorage`:
  ```typescript
  const handleSave = (accountId: string) => {
    localStorage.setItem("erp-mini-local-demo-wallet-offset-account-id", accountId);
    toast({ title: "Cấu hình thành công" });
  };
  ```
- **Online Mode**: Persistent via `shop_settings` table (key: `wallet_offset_account_id`):
  ```typescript
  // Via useShopSettings hook's updateSetting mutation
  updateSetting.mutate({ key: "wallet_offset_account_id", value: { accountId } });
  ```

---

### Requirements 3 & 4: Accounting Cashflow Integration & Auto-posting

#### A. Deposits & Refunds Posting (`src/hooks/useMemberships.ts`)
Retrieve the configured offset account code and ID at runtime:
```typescript
// Resolve configured offset account
const offsetAccId = isLocalDemoAuthEnabled()
  ? (localStorage.getItem("erp-mini-local-demo-wallet-offset-account-id") || "acc-3387")
  : onlineSetting?.accountId || "acc-3387";

const offsetAccount = accounts.find(a => a.id === offsetAccId || a.code === offsetAccId) || { id: "acc-3387", code: "3387" };
```
- **Local Demo Mode**:
  Write to local journal keys. Replace `"acc-3387"` with `offsetAccount.id` and `"3387"` with `offsetAccount.code`.
- **Supabase Online Mode**:
  Inside `performTransaction` success, insert journal entry and lines into Supabase:
  ```typescript
  const { data: entry } = await supabase.from("journal_entries").insert({
    company_id: companyId,
    entry_date: new Date().toISOString().split("T")[0],
    description: `Nạp tiền ví thành viên (${m.card_number})`,
    status: "posted",
    source_type: "membership_wallet",
    source_id: newTx.id
  }).select().single();

  await supabase.from("journal_lines").insert([
    { entry_id: entry.id, account_id: "acc-1111", debit: amount, credit: 0, memo: "Thu tiền nạp ví" },
    { entry_id: entry.id, account_id: offsetAccount.id, debit: 0, credit: amount, memo: "Ghi nhận nhận trước" }
  ]);
  ```

#### B. POS Checkout Wallet Payment Posting
In POS checkout, when `payment_method === "membership_wallet"`:
- **Local Demo (via `erpEventBus.ts`)**:
  Resolve the dynamic offset account inside `ORDER_CREATED` subscriber:
  ```typescript
  const walletOffsetAccId = localStorage.getItem("erp-mini-local-demo-wallet-offset-account-id") || "acc-3387";
  const walletAccount = accounts.find(a => a.id === walletOffsetAccId || a.code === walletOffsetAccId) || { id: "acc-3387", code: "3387" };
  
  const salesDrAccId = isMembershipWallet ? walletAccount.id : "acc-131";
  const salesDrAccCode = isMembershipWallet ? walletAccount.code : "131";
  ```
- **Supabase Online Mode (via client-side post)**:
  Inside POS terminal or `useOrders.ts` during online order checkout, if `payment_method === "membership_wallet"`, auto-insert the journal entry:
  - **Debit**: Configured Offset Account (resolving balance reduction).
  - **Credit**: Revenue Account `511`.

---

### Requirement 5: System Audit Logs
Integrate `logAction` from `useAuditLogs` in key events:

1. **Configuration Change**:
   ```typescript
   // On offset account selection change
   logAction(
     "Thay đổi tài khoản đối ứng ví thành viên",
     "shop_settings",
     "wallet_offset_account_id",
     { accountId: oldAccountId },
     { accountId: newAccountId }
   );
   ```
2. **Deposit / Refund**:
   ```typescript
   // Inside performTransaction mutation
   logAction(
     `Nạp tiền ví thành viên: ${m.card_number}`,
     "membership_transactions",
     newTx.id,
     null,
     { amount, card_number: m.card_number, type }
   );
   ```
3. **POS Checkout Payment**:
   ```typescript
   // Inside POS checkout
   logAction(
     `Thanh toán ví thành viên đơn POS: ${orderNumber}`,
     "membership_transactions",
     transactionId,
     null,
     { amount: total, card_number: customerMembership.card_number, order_number: orderNumber }
   );
   ```

---

## V. POS Multi-Card Selection Strategy
When `selectedCustomer` has multiple cards:
1. Render a Select dropdown selector in `POS.tsx` next to the customer details listing their card numbers and current balances.
2. Store `selectedCardId` in POS state, defaulting to the first active card or highest-tier card.
3. During checkout:
   - Validate balance against the chosen card: `selectedCard.balance < total`.
   - Pass the chosen `selectedCard.id` to `performTransaction` instead of looking up the default card.
This provides a fluid POS experience for customers holding multiple memberships.

---

## VI. Step-by-Step Implementation Roadmap

1. **Database Migration**: Deploy the `memberships` and `membership_transactions` SQL migrations. Create the `membership-cards` Supabase Storage bucket.
2. **Hook Upgrade (`useMemberships.ts`)**: Rewrite methods to support online Supabase operations, remove the one-card-per-partner constraint, and fetch dynamic accounting accounts.
3. **Settings Upgrade (`Settings.tsx` & `useShopSettings.ts`)**: Add the configuration dropdown to Settings and enable storage/retrieval of `wallet_offset_account_id`.
4. **Visual & Dialog Upgrades (`Memberships.tsx` & `PartnerDetailDialog.tsx`)**: Refactor to render card images from storage/Base64, allow file uploads, and load dynamic multi-card structures.
5. **POS Terminal Refactoring (`POS.tsx`)**: Implement the card selector dropdown, hook the chosen card balance checks, and pass the selected card ID to checkout transactions.
6. **Accounting Posting Adjustments (`erpEventBus.ts` & `useOrders.ts`)**: Replace all hardcoded occurrences of `"acc-3387"` / `"3387"` with the dynamically loaded configuration.
7. **Logging & Auditing Integration**: Add `logAction` triggers to configurations, deposits, and payments.

---

## VII. Validation & Verification Plan

### 1. Automated Vitest Suite (`src/hooks/__tests__/useMemberships.test.ts`)
Implement integration tests simulating:
- Issuing multiple cards to a single partner ID.
- Upgrading configuration to target account `3388` instead of `3387` and verifying that subsequent deposits credit `3388`.
- Verifying deposits trigger correct ledger balances (Debit Cash, Credit Configured Account).
- Verifying payments trigger correct ledger balances (Debit Configured Account, Credit Revenue).

### 2. Manual Verification
- **Build Verification**: Run `npm run typecheck` and `npm run build` to verify code integrity.
- **E2E Playwright Flows**: Run POS checkout flows using different customer cards and verify journal entries are posted correctly in the Ledgers.

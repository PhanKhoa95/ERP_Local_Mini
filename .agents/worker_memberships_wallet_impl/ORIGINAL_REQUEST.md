## 2026-07-01T09:27:07Z
You are the Worker subagent. Your task is to implement the Memberships & Wallet Balance features in ERP_Local_Mini based on the Explorer's findings.

Implement the following:
1. Multiple Cards:
   - In `src/hooks/useMemberships.ts`, remove the constraint in `createMembership` mutation that checks if a partner already has a membership card (allow the same `partner_id` in multiple memberships).
   - In `src/pages/Memberships.tsx`, change `availableCustomers` so it shows all customers (do not filter out those who already have a card).
   - In `src/components/partners/PartnerDetailDialog.tsx`, import `useMemberships`, filter the cards for the current partner, and display all their memberships using the gorgeous Glassmorphism card component (ensure it is responsive for mobile/desktop).
   - In `src/pages/POS.tsx`, if the selected customer has multiple cards, show a dropdown to let the user select which card to use for the "membership_wallet" payment method (defaulting to the first active card with sufficient balance or first active card).

2. Card Image Upload:
   - Extend the `Membership` interface to include `card_image?: string`.
   - In `src/pages/Memberships.tsx`'s "CREATE CARD DIALOG", add a file selector input to select/upload a card image.
   - For Local Demo: convert the selected image to a compressed Base64 Data URL and store it in `card_image`.
   - For Online Mode: upload to Supabase storage bucket `member-cards` (or create/use `membership-cards`) and store the public URL.
   - Display this image (or render a preview/thumbnail) in `src/pages/Memberships.tsx` and as the glassmorphic card background in both `Memberships.tsx` and `PartnerDetailDialog.tsx`.

3. Dynamic Offset Account:
   - In `src/pages/Memberships.tsx`, add a new tab "Cài đặt ví" (next to "Danh sách thẻ" and "Lịch sử giao dịch") visible to manager/admin users.
   - Allow the user to select the wallet offset account (e.g. choose between 3387 - Doanh thu chưa thực hiện, 131 - Phải thu khách hàng, 3388 - Phải trả khác, or any other liability/asset account) from the Chart of Accounts (query using `useAccounting`).
   - Save this selection to localStorage under `"erp-mini-membership-offset-account"` (default: `"3387"`) and log the change in `audit_logs` (using the `logAction` helper).

4. Auto-posting cashflow:
   - In `src/hooks/useMemberships.ts` (deposit/refund auto-posting) and `src/lib/erpEventBus.ts` (POS order checkout accounting), dynamically retrieve the configured offset account instead of hardcoding `acc-3387` and `3387`.
   - In ledger updates (e.g., in `erpEventBus.ts`), dynamically check if the configured account is asset or liability (asset: debit increases balance, credit decreases balance; liability: debit decreases balance, credit increases balance) to update the account's balance correctly.

5. Audit Logs:
   - Log wallet transactions (deposits, refunds, payments) and offset account configuration changes to `audit_logs` using the `logAction` helper.

6. Verification:
   - Compile and verify: run `npm run typecheck` and `npm run build` and ensure they succeed without any errors.
   - Run Vitest tests (`npx vitest run src/lib/__tests__/erpEventBus.test.ts` or similar) to ensure all tests pass.

MANDATORY INTEGRITY WARNING — include this verbatim in the Worker's dispatch prompt:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

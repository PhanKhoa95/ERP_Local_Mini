# Handoff Report — Centralized Event-Driven Observer Corrections

## 1. Observation
- **`src/hooks/useContracts.ts`**:
  - Found direct mutation bypass at line 343:
    ```typescript
    if (updates.status === "active" && prevStatus !== "active") {
      createLocalOrderFromContract(companyId || "", local[idx]);
    }
    ```
  - Found query cache invalidation at line 360:
    ```typescript
    qc.invalidateQueries({ queryKey: ["smart-contracts"] });
    ```
  - Found mismatching key for sales channels at line 205:
    ```typescript
    const channelsRaw = localStorage.getItem("erp-mini-local-demo-channels") || "[]";
    ```
- **`src/lib/erpEventBus.ts`**:
  - Found `CONTRACT_SIGNED` observer resolving partner incorrectly at line 369:
    ```typescript
    const distPartner = partners.find((p: any) => p.name.includes("Nhà phân phối miền Nam")) || partners.find((p: any) => p.id === contract.partner_id) || partners[0];
    ```
  - Found accounting subscriber for `PAYMENT_RECORDED` at line 234 filtering out anything other than `"payment_in"` and `"receivable"`:
    ```typescript
    if (transaction.transaction_type !== "payment_in" && transaction.transaction_type !== "receivable") {
      return;
    }
    ```
  - Found partner debt subscriber for `PAYMENT_RECORDED` at line 339 filtering out anything other than `"payment_in"` and `"receivable"`:
    ```typescript
    if (transaction.transaction_type !== "payment_in" && transaction.transaction_type !== "receivable") {
      return;
    }
    ```
- **`src/components/settings/BackupTab.tsx`**:
  - Found `let` declaration for `order_items` at line 421 and `journal_lines` at line 439.
- **Verification Commands Run**:
  - `npm run typecheck` returned `exitCode: 0` (success).
  - `npm run lint` returned `exitCode: 0` (no errors, only minor pre-existing warnings).
  - `npm run test -- --run` returned `exitCode: 0` with 190 tests passing, including 2 new integration tests added to `src/lib/__tests__/erpEventBus.test.ts`.

## 2. Logic Chain
- **Task 1: Event Bus bypass on Contract activation in `useContracts.ts`**:
  - In `updateContract`, instead of calling `createLocalOrderFromContract` directly, publishing `CONTRACT_SIGNED` to the `erpEventBus` with payload containing `{ contract, companyId }` aligns this mutation flow with the signature modal flow (`signContract`), maintaining consistency.
  - Using `invalidateContractRelated(qc)` instead of `invalidateQueries` in `onSuccess` ensures that the newly created order, accounting records, and payments are automatically refreshed in the UI.
- **Task 2: Fix missing property and key bugs**:
  - In the `CONTRACT_SIGNED` observer in `erpEventBus.ts`, reordering the lookup of `distPartner` to check `p.id === contract.partner_id` first guarantees that the order is linked to the correct partner assigned to the contract, rather than default matching to `"Nhà phân phối miền Nam"`.
  - Replaced the key `"erp-mini-local-demo-channels"` with `"erp-mini-local-demo-sales-channels"` in `useContracts.ts` to properly resolve the sales channel, matching the storage key used in the rest of the application.
- **Task 3: Cash outflow transactions support**:
  - Inside the `Accounting` subscriber, when `transaction_type === "payment_out"`, the cash/bank account is credited (balance decreased), and the appropriate debit account is selected based on transaction properties: `acc-211` (if notes contains `'capex'`), `acc-331` (if partner is a supplier), or `acc-642` (otherwise). The debit account's balance is correctly debited (increased for asset/expense, decreased for liability).
  - Inside the `Partner Debt` subscriber, allowing `payment_out` and subtracting the transaction amount from the partner's `debt_amount` ensures that supplier payment transactions correctly reduce outstanding debts.
- **Task 4: Correct linting violations**:
  - Changing `let` to `const` for `order_items` and `journal_lines` in `BackupTab.tsx` directly resolves linting warnings/errors as these variables are never reassigned.

## 3. Caveats
- No caveats. The implementation covers all requirements precisely and does not impact any other system functionalities.

## 4. Conclusion
The Centralized Event-Driven Observer implementation has been successfully corrected. Bypass patterns have been removed, missing keys have been resolved, cash outflow transactions are fully supported, and linting violations have been eliminated. All tests and type checks pass 100%.

## 5. Verification Method
1. Inspect the modified files to verify correctness:
   - `src/hooks/useContracts.ts`
   - `src/lib/erpEventBus.ts`
   - `src/components/settings/BackupTab.tsx`
   - `src/lib/__tests__/erpEventBus.test.ts`
2. Run the validation commands:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test -- --run`

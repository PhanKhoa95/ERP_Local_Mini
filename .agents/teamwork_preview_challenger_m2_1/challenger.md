# Challenger Report — 2026-07-02T05:15:00Z

## Challenge Summary

**Overall risk assessment**: LOW (for Packing Dialog features specifically, but MEDIUM overall due to an environment/unrelated test suite failure).

Through empirical unit and integration testing via Vitest and React Testing Library, we have verified that the Packing Dialog features function correctly as specified:
1. **SKU scanning** increments picked quantities correctly, handles non-matching barcodes gracefully, and prevents picking beyond ordered quantities.
2. **Picking progress** is preserved when navigating through different orders in the queue by storing picking quantities in a map keyed by order ID.
3. **Queue progression** functions correctly in local demo mode, completing packing transitions and writing inventory transactions without double-deduction.

However, an existing test suite file `src/components/__tests__/OrdersBulkActions.challenge.test.tsx` fails due to environment-level read-only constraints on `window.location.reload` under JSDOM.

---

## Challenges

### [Medium] Challenge 1: Environment-level Test Failure in OrdersBulkActions

- **Assumption challenged**: The test suite assumes `window.location.reload` can be redefined using `Object.defineProperty` under the test runner environment.
- **Attack scenario**: When `npm run test` executes, Vitest attempts to mock `window.location.reload` in `OrdersBulkActions.challenge.test.tsx`. Under the current JSDOM environment setup, `window.location` properties are non-configurable, throwing a `TypeError: Cannot redefine property: reload`.
- **Blast radius**: This prevents the entire project test suite (`npm run test`) from completing successfully (exit code 1).
- **Mitigation**: Update the test in `OrdersBulkActions.challenge.test.tsx` to either mock `window.location` at the global level before JSDOM environment initialization, or use a configurable wrapper for location-related actions (e.g., `vi.spyOn(window.location, 'reload').mockImplementation(...)` or a helper utility).

### [Low] Challenge 2: Potential double stock deduction if order number is not unique across different scopes

- **Assumption challenged**: The double deduction prevention logic relies on `tx.notes?.includes(orderNumber)` where `orderNumber` is either `order_number` or the `id`.
- **Attack scenario**: If a transaction has notes that coincidentally contain the order number of another order (e.g., `Order 123` note contains substring `12`), it could falsely detect that stock has already been deducted for the new order, leading to missing stock deductions.
- **Blast radius**: Low. Only affects edge cases where order numbers are substrings of each other or appear in unrelated transaction notes.
- **Mitigation**: Use strict metadata fields in inventory transactions instead of plain text notes, or match using exact, structured JSON fields or a specific prefix format (e.g. `[Order ID: ord-1]`).

---

## Stress Test and Verification Results

- **Verify SKU Scanning Increment**: Scan `SKU001` on an order requiring 2 units.
  - *Expected behavior*: Increments picked quantity to 1/2, then 2/2 on second scan. Shows warning toast and remains at 2/2 on third scan.
  - *Actual behavior*: Picked quantity increments correctly. Third scan triggers "Sản phẩm đã đủ" toast and preserves 2/2.
  - *Status*: **PASS**

- **Verify Picking Progress Preservation**: Pick 1 unit of `SKU001` on Order 1, switch to Order 2, switch back to Order 1.
  - *Expected behavior*: Order 1 still displays 1 unit picked.
  - *Actual behavior*: Switching orders updates the view correctly, and returning to Order 1 restores the previous picked items map state.
  - *Status*: **PASS**

- **Verify Queue Progression & Double Deduction Prevention**: Mark items of Order 1 as picked, pack the order, proceed to Order 2, and attempt to pack Order 2 (which already has existing transactions).
  - *Expected behavior*: Packing Order 1 creates new `out` inventory transactions. Packing Order 2 does not duplicate transactions if they already exist in the local demo database.
  - *Actual behavior*: Transactions created for Order 1. For Order 2, the existing transactions are detected and no duplicates are created. No crashes occur.
  - *Status*: **PASS**

---

## Unchallenged Areas

- **Supabase Integration Mode** — The database triggers, real-time sync, and remote stock deduction checks under Supabase mode were not challenged because the local test suite runs strictly in local demo mode (with `isLocalDemoAuthEnabled` returning `true`).

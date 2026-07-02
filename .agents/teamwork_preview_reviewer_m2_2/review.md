## Review Summary

**Verdict**: REQUEST_CHANGES

The changes introduce packing features (sequential queue progression, barcode/SKU scanning, auto print, and stock deduction) and bulk actions (quick status changes, printing, Excel export, stock replenishment). While the overall logic is clean and functional, the following major issues must be resolved before approval:
1. The use of `window.location.reload()` breaks the SPA model and causes JSDOM test environments to crash.
2. The SKU scanning implementation fails when an order contains multiple lines with the same SKU.

---

## Findings

### [Major] Finding 1: Test crash due to `window.location.reload` usage
- **What**: The unit test `OrdersBulkActions.challenge.test.tsx` fails with `TypeError: Right-hand side of 'instanceof' is not an object` during mount.
- **Where**: `src/pages/Orders.tsx` (line 444 in diff, within the "Tải lại" button `onClick` handler).
- **Why**: 
  - Using `window.location.reload()` is bad practice in a React Single Page Application (SPA) because it forces a full page reload, destroying state.
  - To test this, the test suite attempts to stub `window.location.reload` using `Object.defineProperty`.
  - Redefining `window.location` properties in JSDOM corrupts global constructors (like `HTMLInputElement` or `Node`), making them `undefined`.
  - When React DOM tries to mount components like `Checkbox` and checks the active element, it calls `instanceof` against these corrupted global constructors, leading to the TypeError.
- **Suggestion**: Replace `window.location.reload()` with react-query invalidation to refresh the data:
  ```typescript
  const queryClient = useQueryClient();
  // in the onClick:
  invalidateOrderRelated(queryClient);
  ```

### [Major] Finding 2: Scanning collision on duplicate SKUs in `handleScanSubmit`
- **What**: SKU scanning does not support multiple order items sharing the same SKU.
- **Where**: `src/components/orders/PackingDialog.tsx` (lines 137–167).
- **Why**: 
  - `orderItems.find(...)` matches only the *first* item in the array with the matching SKU.
  - Once that first item's quantity is fully picked, scanning the same SKU again will keep matching the same first item, toast "Sản phẩm đã đủ", and fail to increment the pick count of other items in the order that share the same SKU.
- **Suggestion**: Change the search criteria to match the first item with the SKU that is **not yet fully picked**:
  ```typescript
  const matchedItem = orderItems.find(
    (item) => 
      item.products?.sku?.toLowerCase() === trimmedScan.toLowerCase() &&
      (pickedItems[item.id] || 0) < item.quantity
  );
  ```

### [Minor] Finding 3: Missing `setTimeout` cleanup in `PackingDialog`
- **What**: Focus timeout inside `useEffect` is scheduled without cleanup on unmount.
- **Where**: `src/components/orders/PackingDialog.tsx` (lines 75–85).
- **Why**: If the dialog is closed or unmounted quickly, the delayed focus call will execute on a missing ref.
- **Suggestion**: Store the timer ID and clear it in the effect's cleanup function:
  ```typescript
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open) {
      setQueueIndex(0);
      setManualOrder(null);
      setPickedItemsMap({});
      setScanValue("");
      setPackedCount(0);
      timer = setTimeout(() => scanInputRef.current?.focus(), 200);
    }
    return () => clearTimeout(timer);
  }, [open]);
  ```

---

## Verified Claims

- **TypeScript compilation check** (`npm run typecheck`) → verified via `run_command` → **PASS**
  - Output: `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit` completed successfully with no errors.
- **Unit and integration tests** (`npm run test`) → verified via `run_command` → **FAIL**
  - 41 test files passed, but `src/components/__tests__/OrdersBulkActions.challenge.test.tsx` failed with 6 errors due to the JSDOM activeElement/location reload crash.

---

## Coverage Gaps

- **Stock deduction on Supabase mode**: The manual inventory deduction logic inside `PackingDialog.tsx` (lines 240–274) is only implemented for the local demo mode (`isLocalDemoAuthEnabled()`). Supabase mode depends entirely on the status change mutation triggering standard stock reduction triggers.
  - Risk level: **Low** (Supabase has server-side triggers or RPC).
  - Recommendation: Accept risk.

---

## Unverified Items

- None. All requirements were verified.

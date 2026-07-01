## Challenge Summary

**Overall risk assessment**: LOW

## Challenges

### [Low] Challenge 1: Null or Undefined Category Column in Supabase Schema
- **Assumption challenged**: The query `products(id, name, sku, category)` assumes that the `category` column is present and accessible on the `products` table.
- **Attack scenario**: If the column is dropped, renamed, or is null for most products, lookups will fail or fall back to default values.
- **Blast radius**: If the column does not exist on Supabase, the Supabase query will return a Postgrest error, resulting in a blank or crashed partner details view.
- **Mitigation**: The codebase already handles fallback logic safely (`category: item.products?.category || null`) and the current database schema includes the `category` column as verified by successfully running tests.

### [Low] Challenge 2: Whitespace and Case Sensitivity in Category Matching
- **Assumption challenged**: The matching logic assumes category values in the database are relatively clean and match either the exact ID (UUID) or the name (case-insensitive).
- **Attack scenario**: If a product has a category string with trailing spaces or irregular casing that isn't captured by `toLowerCase()` or `trim()`, the lookup will fail.
- **Blast radius**: The warranty calculation will fall back to name/SKU keywords (12 months for QR cards, 6 months for QR boards) or the final default of 3 months.
- **Mitigation**: The code uses `productCategory.trim()` and `catWarrantyMap.has(productCategory.toLowerCase())`, which mitigates case sensitivity and trailing whitespaces.

### [Low] Challenge 3: Responsive Table Scrolling
- **Assumption challenged**: Wrapping the table in a scrollable div (`overflow-x-auto`) is sufficient for mobile readability.
- **Attack scenario**: On tiny devices (e.g. 320px width), horizontal scrolling is forced, which is functional but might not provide the best user experience compared to a stacked list layout.
- **Blast radius**: UX friction when inspecting purchased items on mobile.
- **Mitigation**: The current design uses a cards list layout for policies and scrollable table for purchase history, which is a standard trade-off for complex tabular data.

## Stress Test Results

- **Run all E2E Tests** → `npx playwright test` → All 18 tests pass successfully.
- **Run all Unit Tests** → `npm run test` (Vitest) → All 249 tests pass successfully.
- **Type Check** → `npm run typecheck` → Compiles with zero errors.
- **ESLint Linting** → `npm run lint` → Fails due to 1 error in `src/hooks/usePartners.ts` (empty block statement in `catch` block on line 66), which is outside the scope of modified files.

## Unchallenged Areas

- **Casso webhook signature verification** — Out of scope for current changes.

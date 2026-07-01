# Changes

## 1. Fix Category Description Wipe Bug in Sales Policies Tab
- **File**: `src/components/settings/SalesPoliciesTab.tsx`
- **Details**: Updated `WarrantyRow` saving function to include `description: category.description || ""` when calling `updateCategory.mutateAsync`. This prevents the category's description from being overwritten by an empty string during warranty month updates.

## 2. Dynamic Category Query in usePartnerDetail Hook
- **File**: `src/hooks/usePartnerDetail.ts`
- **Details**: Modified the Supabase select query for `purchasedItems` to retrieve the `category` column from `products` table (i.e. `products(id, name, sku, category)`) and mapped it to the `category` field on the returned objects (`category: item.products?.category || null`).

## 3. Dynamic Warranty Calculations and Responsive Layout in Partner Detail Dialog
- **File**: `src/components/partners/PartnerDetailDialog.tsx`
- **Details**:
  - Re-implemented the `warranties` memo logic to build a map of category names and IDs to their warranty months (filtering out undefined/null).
  - Used this map to match purchased items' categories to their specific category-configured warranty months, falling back to name/SKU keyword-based matching only when category warranty is missing or not set.
  - Formatted purchase policies in the "Bảo hành & CS" tab to display with a clean card list layout and value/unit badges.
  - Wrapped the warranties table in an `overflow-y-auto overflow-x-auto w-full` container and set `min-w-[500px] md:min-w-full` on the Table to prevent squeezed column text and overlap across desktop and mobile screens.

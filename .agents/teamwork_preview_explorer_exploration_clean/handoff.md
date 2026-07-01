# Handoff Report: Codebase Exploration for Warranty & Sales Policies

## 1. Observation

During the exploration of the codebase, the following file paths, line numbers, and logic implementations were analyzed:

### A. Component `CategoriesTab`
- **File Path**: `src/components/settings/CategoriesTab.tsx`
- **Location of "Thời gian bảo hành" Display**:
  - The warranty months badge is rendered inside `SortableCategoryItem` component at line 101:
    ```tsx
    99:               {category.warranty_months !== undefined && (
    100:                 <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20" title="Quản lý tại Cài đặt → Chính sách">
    101:                   BH: {category.warranty_months} tháng
    102:                 </Badge>
    103:               )}
    ```
- **Form FormState**:
  - Inside the category addition/editing dialog form, the field `"Thời gian bảo hành"` **has already been removed from the UI rendering** (lines 353-448), preventing duplicate input.
  - However, the form state `formData` still initializes and holds the `warranty_months` property (lines 134-142):
    ```tsx
    134:   const [formData, setFormData] = useState<ProductCategoryInsert & { warranty_months: number }>({
    135:     name: "",
    136:     description: "",
    137:     color: "#3B82F6",
    138:     is_active: true,
    139:     sort_order: 0,
    140:     parent_id: null,
    141:     warranty_months: 3,
    142:   });
    ```
- **Storage of Product Categories**:
  - Managed via the hook `useProductCategories()` inside `src/hooks/useProductCategories.ts`.
  - **Local Storage storage**: If local demo authentication is enabled (`isLocalDemoAuthEnabled()` is true), categories are fetched and saved using `getLocalProductCategories`, `createLocalProductCategory`, and `updateLocalProductCategory` from `src/lib/localInventoryStore.ts`. The local storage key is `erp-mini-local-demo-product-categories` (defined in `localInventoryStore.ts` line 38).
  - **Database storage**: If demo auth is disabled, categories are fetched and updated using Supabase table `product_categories`.
  - **Metadata Serialization**: Because the database table schema has no dedicated `warranty_months` column, category warranty settings are serialized into the `description` text field as a JSON string containing the fields `desc` and `warranty_months` via helper functions `parseCategoryMetadata` and `serializeCategoryMetadata`.

---

### B. Component `SalesPoliciesTab`
- **File Path**: `src/components/settings/SalesPoliciesTab.tsx`
- **Representation & Storage of Segment Sales Policies**:
  - Managed via the hook `useSalesPolicies()` in `src/hooks/useSalesPolicies.ts`.
  - Policies are stored in `localStorage` under the key `erp-mini-local-demo-sales-policies`.
  - Policies are separated into segment tabs based on `policy.segment` (values: `"loyalty" | "wholesale" | "all"`):
    - `loyalty` (VIP / Loyalty)
    - `wholesale` (Sỉ / Phân phối)
    - `all` (Khách lẻ (Mặc định))
- **Representation & Storage of Category Warranty Settings**:
  - Displays a dedicated card section `"Bảo hành theo ngành hàng"` (lines 234-291) showing all categories sorted by sort order.
  - Users configure the warranty months directly through a numeric input in the `WarrantyRow` sub-component, which triggers `updateCategory` mutation in `useProductCategories.ts`.
  - **Critical Bug Identified**: In `WarrantyRow` at line 465, the save handler calls `updateCategory.mutateAsync` passing only `{ id, name, warranty_months }`:
    ```tsx
    465:   const handleSave = async () => {
    466:     if (editingWarranty[category.id] === undefined) return;
    467:     await updateCategory.mutateAsync({
    468:       id: category.id,
    469:       name: category.name,
    470:       warranty_months: editingWarranty[category.id],
    471:     });
    ```
    Because `description` is omitted, the `updateCategory` mutation in `useProductCategories.ts` receives `undefined` for description and serializes it as `serializeCategoryMetadata("", warranty_months)`, which overwrites and **wipes out the category's original description text**.

---

### C. Component `PartnerDetailDialog`
- **File Path**: `src/components/partners/PartnerDetailDialog.tsx`
- **Warranty & CS Tab Details**:
  - The tab is rendered as `<TabsContent value="warranty">` (lines 524-624).
- **Segment Sales Policies Display**:
  - Shows dynamic purchase policies calculated based on the partner's VIP/Loyalty segment. The segment is mapped dynamically as (lines 538-541):
    ```tsx
    539:                         const segment: PolicySegment = partner.promo_segment === "loyalty" ? "loyalty" : partner.promo_segment === "wholesale" ? "wholesale" : "all";
    540:                         const activePolicies = getPoliciesForSegment(segment);
    ```
    This fetches the configured active sales policies from `useSalesPolicies()` hook.
- **Product Warranty Months Calculation**:
  - Calculates product warranty inside `useMemo` hook (lines 69-112) using `purchasedItems` and `categories`:
    - First, maps lowercase category name and ID to its configured `warranty_months`.
    - Iterates over each purchased item, attempting to read `item.category` (which stores the category name as a string). If there's a match in `catWarrantyMap`, it uses that value.
    - Otherwise, falls back to SKU/name keyword matching (e.g. `QR-CARD`/`THẺ QR` -> 12 months, `BOARD`/`BẢNG QR` -> 6 months) or defaults to `3` months.
- **Critical Bug Identified**: In `src/hooks/usePartnerDetail.ts` under the Supabase data fetching branch, `purchasedItems` is queried from the `order_items` table (lines 164-188):
    ```tsx
    164:       const { data, error } = await supabase
    165:         .from("order_items")
    166:         .select(`
    167:           id,
    168:           product_id,
    169:           quantity,
    170:           unit_price,
    171:           total,
    172:           products(id, name, sku),
    173:           orders!inner(partner_id, company_id, order_date)
    174:         `)
    ```
    The select statement only fetches `products(id, name, sku)`, completely omitting `category`.
    Moreover, the mapped result returned by this branch also omits the `category` property (lines 178-187):
    ```tsx
    178:       return (data || []).map((item: any) => ({
    179:         id: item.id,
    180:         product_id: item.product_id,
    181:         name: item.products?.name || "Sản phẩm không tên",
    182:         sku: item.products?.sku || "N/A",
    183:         quantity: item.quantity,
    184:         unit_price: item.unit_price,
    185:         total: item.total,
    186:         order_date: item.orders?.order_date || new Date().toISOString(),
    187:       }));
    ```
    Because of this, `item.category` is always `undefined` when the Supabase data path is used, forcing calculations to fall back to keyword inference or the default 3 months.

---

## 2. Logic Chain

1. **Why Category Descriptions Are Wiped Out**:
   - `useProductCategories.ts`'s `updateCategory` mutation performs serialized metadata assembly:
     `const serializedDesc = serializeCategoryMetadata(description || "", warranty_months !== undefined ? warranty_months : 3);`
   - In `SalesPoliciesTab.tsx`, `WarrantyRow` saves changes by invoking:
     `updateCategory.mutateAsync({ id: category.id, name: category.name, warranty_months: editingWarranty[category.id] })`
   - Because `description` is omitted from this object, it defaults to `""` in the serialization helper.
   - Consequently, the serialized JSON string stored in the database's `description` column becomes `{"desc":"","warranty_months":X}`, erasing the description string.
   - *Resolution*: Pass `description: category.description || ""` in `WarrantyRow`'s save handler.

2. **Why Supabase Warranty Calculations Are Incorrect**:
   - `PartnerDetailDialog.tsx` matches `item.category` against the `categories` list using the category's name.
   - In `usePartnerDetail.ts`, the Supabase path for `purchasedItems` queries `order_items` and joins `products` but requests only `id, name, sku`.
   - The `products` table schema contains a string column `category` containing the category name.
   - Since `category` is not queried or mapped in `usePartnerDetail.ts`, `item.category` is undefined on the returned array of objects.
   - *Resolution*: Query `category` from the nested `products` selection (`products(id, name, sku, category)`) and assign it as `category: item.products?.category || null` in the return mapper.

---

## 3. Caveats

- **Supabase DB Synchronization**: In local testing, Supabase is bypassed if local demo mode is active. However, both the local storage path and Supabase paths must be aligned. This investigation audited both paths and found that only the Supabase query path in `usePartnerDetail.ts` was missing the `category` column fetch (the local path correctly populates it).
- **No other caveats**: The findings are directly verified against the files.

---

## 4. Conclusion

We have pinpointed two specific bugs preventing clean configuration and correct warranty months calculations:
1. `SalesPoliciesTab.tsx`'s `WarrantyRow` save handler wipes out category descriptions because it doesn't pass the current description property.
2. `usePartnerDetail.ts`'s Supabase query path for `purchasedItems` does not fetch or map the product's `category` column, breaking category-based warranty calculations in `PartnerDetailDialog.tsx`.

### Recommended Changes:

#### 1. In `src/components/settings/SalesPoliciesTab.tsx` (lines 465-472):
```tsx
// Before:
  const handleSave = async () => {
    if (editingWarranty[category.id] === undefined) return;
    await updateCategory.mutateAsync({
      id: category.id,
      name: category.name,
      warranty_months: editingWarranty[category.id],
    });

// After:
  const handleSave = async () => {
    if (editingWarranty[category.id] === undefined) return;
    await updateCategory.mutateAsync({
      id: category.id,
      name: category.name,
      description: category.description || "",
      warranty_months: editingWarranty[category.id],
    });
```

#### 2. In `src/hooks/usePartnerDetail.ts` (lines 164-188):
```tsx
// Before:
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          total,
          products(id, name, sku),
          orders!inner(partner_id, company_id, order_date)
        `)
        .eq("orders.partner_id", partnerId!)
        .eq("orders.company_id", companyId!);
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products?.name || "Sản phẩm không tên",
        sku: item.products?.sku || "N/A",
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        order_date: item.orders?.order_date || new Date().toISOString(),
      }));

// After:
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          total,
          products(id, name, sku, category),
          orders!inner(partner_id, company_id, order_date)
        `)
        .eq("orders.partner_id", partnerId!)
        .eq("orders.company_id", companyId!);
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products?.name || "Sản phẩm không tên",
        sku: item.products?.sku || "N/A",
        category: item.products?.category || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        order_date: item.orders?.order_date || new Date().toISOString(),
      }));
```

---

## 5. Verification Method

- Run type checking:
  `npm run typecheck`
- Run the build:
  `npm run build`
- Run local unit tests:
  `npm run test`

# Handoff Report - ERP_Local_Mini Subsystem Exploration

## 1. Observation
We observed and inspected the following files in the `ERP_Local_Mini` repository:

### A. Backup Subsystem UI & Backend
- **UI Component**: `src/components/settings/BackupTab.tsx` (Lines 1-176)
  - Exports a set of predefined tables listed in `EXPORT_TABLES`:
    ```typescript
    const EXPORT_TABLES = [
      { key: "products", label: "Sản phẩm", icon: "📦" },
      { key: "orders", label: "Đơn hàng", icon: "🛒" },
      { key: "partners", label: "Đối tác", icon: "🤝" },
      { key: "documents", label: "Tài liệu", icon: "📄" },
      { key: "perf_employees", label: "Nhân viên", icon: "👤" },
      { key: "inventory_transactions", label: "Giao dịch kho", icon: "📊" },
      { key: "payment_transactions", label: "Giao dịch thanh toán", icon: "💰" },
    ] as const;
    ```
  - Backend/Database queries are performed directly through the standard Supabase client in the `exportTable` function:
    ```typescript
    const exportTable = async (tableName: string) => {
      if (!companyId) return;
      try {
        const query = (supabase.from(tableName as any) as any).select("*");
        // Most tables have company_id
        if (tableName !== "inventory_transactions" && tableName !== "payment_transactions") {
          query.eq("company_id", companyId);
        }
        const { data, error } = await query.limit(10000);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error(`Export ${tableName} failed:`, err);
        return [];
      }
    };
    ```
  - Exports are compiled client-side and saved as JSON via browser downloads using a Blob object:
    ```typescript
    const downloadJSON = (data: any, filename: string) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };
    ```
  - Direct observations: In **Local Demo mode**, clicking "Export" queries the actual Supabase client rather than the local storage keys, resulting in blank or mismatched data downloads.

### B. System Data Audit
- **Audit Function**: `runSystemDataAudit` in `src/lib/systemDataAudit.ts` (Lines 631-640):
  ```typescript
  export async function runSystemDataAudit(companyId?: string | null) {
    if (isLocalDemoAuthEnabled()) {
      return buildSystemDataAuditReport(loadLocalSnapshot());
    }

    if (!companyId) throw new Error("Missing company context");
    const snapshot = await loadSupabaseSnapshot(companyId);
    return buildSystemDataAuditReport(snapshot);
  }
  ```
  - **Local Snapshot Loader** (`loadLocalSnapshot`): Reads directly from keys in `localStorage`:
    - `erp-mini-local-demo-products`
    - `erp-mini-local-demo-orders`
    - `erp-mini-local-demo-payment-transactions`
    - `erp-mini-local-demo-journal-entries`
    - `erp-mini-local-demo-journal-lines`
    - `erp-mini-local-demo-warehouse-stock`
    - `erp-mini-local-demo-product-bom`
  - **Supabase Snapshot Loader** (`loadSupabaseSnapshot`): Executes bulk `Promise.all` fetches across Supabase tables for the corresponding `company_id`.
  - **Audit Rules** (`buildSystemDataAuditReport`): Runs data consistency checks (e.g. comparing `products.stock_quantity` with sum of `warehouse_stock.quantity`, orders matching item totals, accounting ledger debit/credit balances).

### C. Local Demo Mode Configuration & Toggle
- **Auth Checking / Control**: `src/lib/localDemoAuth.ts`
  - Checks conditions using:
    ```typescript
    export function isLocalDemoAuthEnabled() {
      const isEnabled = import.meta.env.DEV && localStorage.getItem(LOCAL_DEMO_AUTH_KEY) === "true";
      // ...
      return isEnabled;
    }
    ```
  - **Login Switch**: `src/pages/Auth.tsx` (Lines 66-73) checks credentials:
    ```typescript
    if (isLocalDemoCredentials(formData.email, formData.password)) {
      enableLocalDemoAuth();
      // ...
      toast({ title: "Đăng nhập demo thành công", description: "Bạn đang dùng tài khoản local admin/admin." });
      navigate("/");
      return;
    }
    ```
    Where `isLocalDemoCredentials` accepts email `"admin"` and password `"admin"` if `import.meta.env.DEV` is true.

### D. Data Loading & Persistence Patterns
- **Queries & Mutations**: TanStack React Query (`useQuery`, `useMutation`).
- **Conditional Branching**: The React Query hooks (e.g. `useProducts.ts`, `useOrders.ts`, `usePartners.ts`) check `isLocalDemoAuthEnabled()` and divert operations.
  - **Supabase Branch**: Interacts with the real database using `supabase.from(tableName)`.
  - **Local Demo Branch**: Interacts with local storage keys via dedicated store libraries or local code (e.g. `getLocalProducts` in `src/lib/localInventoryStore.ts` or `localStorage.getItem("erp-mini-local-demo-orders")` directly in `useOrders.ts`).
  - **State Push-Sync**: `src/lib/localDemoSync.ts` overrides `localStorage` mutation methods (`setItem`, `removeItem`, `clear`) to automatically push local modifications to the dev server via `POST /api/local-demo-data` and poll `GET /api/local-demo-data/timestamp` every 3 seconds to keep other developers/tabs synchronized.

### E. Existing Backup Formats
- **Full Backup**: An object containing table keys mapping to arrays of rows:
  ```json
  {
    "exported_at": "2026-06-30T03:12:41Z",
    "company_id": "00000000-0000-4000-8000-000000000001",
    "products": [...],
    "orders": [...],
    "partners": [...],
    "documents": [...],
    "perf_employees": [...],
    "inventory_transactions": [...],
    "payment_transactions": [...]
  }
  ```
- **Single Table Backup**: A plain array of objects matching the schema of the exported table:
  ```json
  [
    { "id": "...", "name": "...", "sku": "..." }
  ]
  ```

---

## 2. Logic Chain
1. **Observation A & D** show that when the app is in Local Demo Mode, all data changes occur in `localStorage` under keys like `erp-mini-local-demo-products`. However, `BackupTab.tsx`'s `exportTable` function ignores this mode and always queries the database via `supabase.from(tableName)`.
2. **Observation E** demonstrates that backup files are JSON formats containing either a nested table object (Full Backup) or a list of items (Single Table).
3. To support a complete JSON import feature:
   - In **Local Demo mode**, we must read the uploaded file, determine its type, and write it directly into the relevant `localStorage` keys.
   - Due to the overridden `localStorage` methods in `localDemoSync.ts` (Observation D), any write to `localStorage` will automatically propagate to the local dev server.
   - In **Supabase mode**, we must retrieve the current `companyId` and bulk insert/upsert the rows into Supabase.
   - RLS and foreign keys in Supabase require us to sanitize `company_id` on all rows (forcing it to match the current company) and insert tables in strict dependency order to prevent constraint errors.
4. Hence, we can formulate an import strategy covering UI actions, file parsers, key mapping, insertion ordering, cache invalidation, and UI feedback.

---

## 3. Caveats
- **Documents Storage**: The `documents` table stores file references pointing to Supabase Storage (`company-documents` bucket). Importing backup rows for `documents` in Supabase mode will not restore the actual binary files in storage unless they are uploaded separately or handled manually.
- **Local Demo limitations**: The `documents` subsystem does not have a local demo backend wrapper (Observation D). Any documents imported into Local Storage will be preserved in `localStorage` but will not be utilized by the UI because `useDocuments.ts` always calls Supabase.

---

## 4. Conclusion & Proposed Implementation Strategy

We propose adding a **JSON Import Dialog** to the **Backup Tab** UI, enabling both developers (Local Demo) and cloud users to restore their backups safely.

### A. UI Integration
- Add an "Import dữ liệu từ file JSON" section to `src/components/settings/BackupTab.tsx`.
- Provide a file upload field with drag-and-drop support, accepting `.json` files.
- Provide a toggle for the restore strategy in Supabase Mode:
  - **Gộp dữ liệu (Merge/Upsert)**: Adds new items and overwrites existing ones (safe).
  - **Ghi đè hoàn toàn (Overwrite)**: Deletes all current company data first, then restores backup data.
- Provide a clear confirmation prompt since overwriting data is destructive.

### B. Import Logic Pipeline
1. **File Parsing**: Read the file client-side using `FileReader` and parse it using `JSON.parse`.
2. **Format Detection**:
   - If the root is an object containing table keys (e.g. `products`, `orders`), treat it as a **Full Backup**.
   - If it is an array, treat it as a **Single Table** backup, prompting the user to select the target table (or parse metadata/attributes to auto-detect).
3. **Data Sanitization**:
   - In Supabase Mode, iterate through every row of all tables and force the `company_id` column to match the current user's `companyId`.
4. **Execution Strategy**:
   - **Case 1: Local Demo Mode (LocalStorage)**:
     - If "Ghi đè hoàn toàn" is selected, call `resetLocalDemoData()` to wipe existing local demo keys.
     - Save the incoming tables using `localStorage.setItem(localStorageKey, JSON.stringify(tableData))`.
     - *Note: To ensure order items are preserved, orders in the backup must contain the embedded `order_items` array (which is the default format in local storage).*
   - **Case 2: Supabase Mode (Cloud Database)**:
     - **If "Ghi đè hoàn toàn" is chosen**, delete current company records in reverse dependency order:
       1. `payment_transactions`
       2. `inventory_transactions`
       3. `order_items`
       4. `orders`
       5. `products`
       6. `partners`
       7. `perf_employees`
       8. `documents`
     - **Insert/Upsert records** in forward dependency order using bulk inserts (upsert with `onConflict: 'id'`):
       1. `partners`
       2. `products`
       3. `orders`
       4. `order_items` (if present)
       5. `inventory_transactions`
       6. `payment_transactions`
       7. `perf_employees`
       8. `documents`
       
       *Query format example*:
       ```typescript
       const { error } = await supabase
         .from(tableName)
         .upsert(sanitizedRows, { onConflict: "id" });
       ```
5. **Cache Invalidation**:
   - Call `queryClient.invalidateQueries()` to force React Query to reload all data.
   - Trigger a brief timeout followed by `window.location.reload()` to guarantee a clean application state.

---

## 5. Verification Method
1. **Codebase Compiles & Runs**:
   - Execute `pnpm install` and `npm run test` or `vitest run` to ensure existing tests pass.
   - Run `npm run build` to verify there are no compilation or typescript errors.
2. **Review Key Files**:
   - Inspect `src/components/settings/BackupTab.tsx` to verify standard backup behavior.
   - Inspect `src/lib/localDemoSync.ts` to confirm how localStorage changes trigger dev server pushes.
3. **UI and Functional Validation (to be run after implementer code updates)**:
   - Log in as local admin (`admin` / `admin`).
   - Trigger an export to verify files are generated.
   - Trigger an import of the backup file and verify it loads correctly in localStorage and synchronization occurs.

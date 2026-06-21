# Handoff Report — explorer_milestone1

This report presents a thorough read-only exploration and mapping of the `multi-sale-organizer` codebase.

---

## 1. Observation

### 1.1 Tech Stack and Code Layout Mapping
* **Code Layout**:
  - `E:\multi-sale-organizer\`: Root containing configurations (`package.json`, `pnpm-workspace.yaml`, `playwright.config.ts`, `vitest.config.ts`), startup scripts (`run.bat`, `run.sh`), and the entry `index.html`.
  - `src/`: Main frontend application code.
    - `src/components/`: Sub-folders organize UI components by domain (e.g., `auth`, `bookings`, `contracts`, `dashboard`, `digital-assets`, `directives`, `documents`, `finance`, `inventory`, `layout`, `ui`).
    - `src/contexts/`: Shared React contexts (e.g., `AuthContext.tsx`).
    - `src/hooks/`: Custom state hooks and TanStack React Query hooks (e.g., `useProducts.ts`, `useCompanyContext.ts`).
    - `src/integrations/`: Integrations with external services, mainly `supabase/client.ts`.
    - `src/lib/`: Utilities for validation, Excel parsing, identity resolution, and local stores (`localDemoAuth.ts`, `localDemoSync.ts`, `localInventoryStore.ts`).
    - `src/pages/`: Entry point page components (e.g., `Auth.tsx`, `Dashboard.tsx`, `Inventory.tsx`, `POS.tsx`).
    - `src/test/`: Test environment setups (`setup.ts`).
  - `tests/`: End-to-end (E2E) test files under `tests/e2e/`.
  - `supabase/`: Database configuration (`config.toml`), migration scripts (`supabase/migrations/`), and Deno edge functions (`supabase/functions/`).

* **Tech Stack**:
  - **Framework/Language**: React (v18.3.1), TypeScript (v5.8.3).
  - **Bundling/Dev Server**: Vite (v5.4.19).
  - **Styles**: Tailwind CSS (v3.4.17) with Tailwind Animate and Typography.
  - **State/Data Fetching**: TanStack React Query (v5.83.0), React Router DOM (v6.30.1), React Hook Form (v7.61.1), Zod (v3.25.76).
  - **Database & Backend**: Supabase JS Client (v2.87.1) and Supabase Edge Functions.
  - **Component Library**: Radix UI primitives with Lucide Icons and Recharts.
  - **Testing**: Vitest (v3.2.4) for unit/integration tests and Playwright (v1.61.0) for E2E tests.

### 1.2 Package Dependencies, Node Version, and Package Manager
* **Package Manager**: Verified as **pnpm**. The root directory contains `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Additionally, `run.bat` (line 54) invokes `call pnpm install`.
* **Node Version**: No explicit `engines` or `.nvmrc`/`.node-version` file exists. TypeScript compiles with `target: ES2020` (`tsconfig.app.json` line 26) and `target: ES2022` (`tsconfig.node.json` line 3), indicating that a modern Node LTS (e.g., Node 18 or 20+) is required.
* **Dependencies**: Specified in `package.json` lines 19–100.

### 1.3 Vite Configuration and Port Settings
* **Port Settings**: The application is started locally on port `8017` via command-line CLI flag overrides inside the start scripts:
  - `run.bat` line 71: `call pnpm run dev -- --host 0.0.0.0 --port 8017`
  - `run.sh` line 86: `npm run dev -- --host 127.0.0.1 --port 8017`
* **Vite Config File**: *No `vite.config.ts` or `vite.config.js` exists in the root directory.* 

### 1.4 Local Demo Auth / Offline Mode Flow
* **Login Trigger**: Entering the username `"admin"` and password `"admin"` on the `/auth` page triggers the offline mode (in dev mode only).
  - `src/lib/localDemoAuth.ts` lines 10–12:
    ```typescript
    export function isLocalDemoCredentials(email: string, password: string) {
      return import.meta.env.DEV && email.trim().toLowerCase() === "admin" && password === "admin";
    }
    ```
  - `src/pages/Auth.tsx` lines 66–73:
    ```typescript
    if (isLocalDemoCredentials(formData.email, formData.password)) {
      enableLocalDemoAuth();
      setAuthNotice(null);
      setCanResendConfirmation(false);
      toast({ title: "Đăng nhập demo thành công", description: "Bạn đang dùng tài khoản local admin/admin." });
      navigate("/");
      return;
    }
    ```
* **Offline Auth Session**: `enableLocalDemoAuth()` sets `localStorage.setItem("erp-mini-local-demo-auth", "true")` and fires `LOCAL_DEMO_AUTH_EVENT` (`"erp-mini-local-demo-auth-changed"`).
* **Context Handling**: `src/contexts/AuthContext.tsx` handles this state (lines 79–93, 95–107):
  - Sets the active user to a mock demo user (`admin@local.test`, ID `00000000-0000-4000-8000-000000000002`).
  - Sets the company context to `Local Demo Company` (ID `00000000-0000-4000-8000-000000000001`) with the role `admin`.
* **Database Mocking**: Data queries intercept the request and redirect to LocalStorage stores if `isLocalDemoAuthEnabled()` returns true.
  - E.g., `src/hooks/useProducts.ts` line 28–30:
    ```typescript
    if (isLocalDemoAuthEnabled()) {
      return getLocalProducts(companyId);
    }
    ```
  - Storage is implemented in `src/lib/localInventoryStore.ts` using localStorage keys:
    - Products: `"erp-mini-local-demo-products"` (line 31)
    - Categories: `"erp-mini-local-demo-product-categories"` (line 32)
    - Transactions: `"erp-mini-local-demo-inventory-transactions"` (line 33)
    - Bill of Materials: `"erp-mini-local-demo-product-bom"` (line 34)
* **AI Function Simulation**: Supabase edge functions invoke calls are intercepted in `src/integrations/supabase/client.ts` lines 23–36:
  - If `isLocalDemoAuthEnabled()` is true, it calls `handleLocalFunctionInvoke(functionName, options)` from `@/lib/localAIService` instead of calling the live endpoint.

### 1.5 Exact Commands for Typecheck, Lint, and Tests
* **Typecheck**:
  - `package.json` line 13: `"typecheck": "tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit"`
* **Linting**:
  - `package.json` line 11: `"lint": "eslint ."`
* **Tests**:
  - **Vitest (Unit/Integration)**:
    - `package.json` line 14: `"test": "vitest run"`
    - `package.json` line 15: `"test:watch": "vitest"`
  - **Playwright (E2E)**:
    - Not defined in `package.json` scripts, but run via CLI: `npx playwright test` (using configs in `playwright.config.ts`).

### 1.6 Identified Potential Build/Execution Issues
1. **Missing `src/lib/localAIService.ts` File**:
   - `src/integrations/supabase/client.ts` line 21 imports `handleLocalFunctionInvoke` from `@/lib/localAIService`.
   - The file does not exist on disk, which blocks TypeScript compilation (`npm run typecheck`) and bundler tasks.
2. **Missing `vite.config.ts` or `vite.config.js` File**:
   - The Vite configuration file is missing from the root.
   - `tsconfig.node.json` line 21 includes `vite.config.ts`. Compiling node code will fail with file not found.
   - Running `vite` without a config file means React TSX compiling plugins (SWC/Babel) are not registered, which will lead to runtime parsing errors in the browser when encountering TSX syntax.
3. **Playwright E2E Port Mismatch**:
   - `playwright.config.ts` is configured with `baseURL` and `webServer.url` pointing to `http://127.0.0.1:8080` (lines 11, 23).
   - Running `npm run dev` in playwright will launch Vite on its default port (`5173`), while dev scripts (`run.bat`/`run.sh`) launch it on `8017`. Consequently, Playwright E2E tests cannot connect to the server.

---

## 2. Logic Chain

1. **Tech Stack & Layout**: Checked `package.json` for deps, `tsconfig.json` for paths/targets, and ran `list_dir` on directories (`src`, `src/lib`, `src/contexts`, `tests`, `supabase`) to map structure.
2. **Package Manager**: Found `pnpm-lock.yaml` and `pnpm-workspace.yaml` in the root list, establishing `pnpm` as the package manager.
3. **Port & Vite Config**: Searched for custom configs. Discovered that the port 8017 is set via command line arguments in `run.bat` and `run.sh` (`--port 8017`). Checked for `vite.config.ts` via file finders, finding it completely absent.
4. **Local Demo Auth & Local Store**: Traced `/auth` page actions down to `isLocalDemoCredentials` in `src/lib/localDemoAuth.ts` verifying `"admin"`/`"admin"`, setting `localStorage` credentials, which `AuthContext.tsx` uses to load mock state. Hooks like `useProducts.ts` verify offline mode and retrieve mock data using `localStorage` keys in `localInventoryStore.ts`.
5. **Static Errors**:
   - Inspected `src/integrations/supabase/client.ts` imports and tried to view `src/lib/localAIService.ts`, yielding a "file not found" error, establishing the compilation blocker.
   - Noted `vite.config.ts` is in the `tsconfig.node.json` include array but is missing from disk, creating the second compilation/runtime blocker.
   - Compared `playwright.config.ts` port (`8080`) with scripts `run.bat`/`run.sh` port (`8017`), proving the E2E test execution mismatch.

---

## 3. Caveats
- Only static code analysis was performed; code compilation or execution was not run.
- Assumed `localAIService.ts` and `vite.config.ts` should be present in the root / source directory (inferred from TS configurations and imports).

---

## 4. Conclusion
The workspace is a Vite React TypeScript application backed by Supabase using `pnpm` for packages. The local demo auth flow operates by intercepting credentials on the client side and substituting localStorage engines.
However, two critical static files are missing: `vite.config.ts` and `src/lib/localAIService.ts`. These must be added or restored for typecheck, dev mode, and build processes to succeed. E2E configs also need port alignment.

---

## 5. Verification Method
- **TypeScript & Linting compilation**:
  - Run `pnpm run typecheck` to verify import and file references.
  - Run `pnpm run lint` to verify eslint rules.
- **Port verification**:
  - Run `pnpm run dev` and check port assignment.
  - Inspect `playwright.config.ts` to see if `baseURL` matches the actual port.

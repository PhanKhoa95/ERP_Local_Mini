# Project: multi-sale-organizer

## Architecture
- **Frontend**: React (v18), Vite (v5), Tailwind CSS, Lucide Icons, React Router DOM, TanStack React Query.
- **Backend & Database**: Supabase JS client.
- **Offline / Local Demo Mode**: Intercepts auth and database queries. Stores demo data in local storage (`localStorage`). Intercepts edge function calls and forwards them to a local AI simulator service (`src/lib/localAIService.ts`).
- **Package Manager**: pnpm.

## Code Layout
- `E:\multi-sale-organizer\`: Root containing configurations (`package.json`, `pnpm-workspace.yaml`, `playwright.config.ts`, `vitest.config.ts`), startup scripts (`run.bat`, `run.sh`), and the entry `index.html`.
- `src/`: Main frontend application code.
  - `src/components/`: Sub-folders organizing UI components by domain.
  - `src/contexts/`: Shared React contexts (e.g., `AuthContext.tsx`).
  - `src/hooks/`: Custom state hooks and TanStack React Query hooks.
  - `src/integrations/`: Integrations with external services, mainly `supabase/client.ts`.
  - `src/lib/`: Utilities for validation, Excel parsing, identity resolution, local stores, and AI simulation.
  - `src/pages/`: Entry point page components.
  - `src/test/`: Test environment setups.
- `tests/`: End-to-end (E2E) test files under `tests/e2e/`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Initial Exploration | Map codebase, tech stack, port settings, offline login, and scripts. | none | DONE |
| 2 | Dev Env & Setup | Clean install of dependencies, check/restore configuration files (`vite.config.ts`, `src/lib/localAIService.ts`, `playwright.config.ts`). | M1 | DONE |
| 3 | TypeScript Compliance | Run TypeScript typechecking (`pnpm run typecheck`) and fix errors. | M2 | PLANNED |
| 4 | Linting Compliance | Run ESLint check (`pnpm run lint`) and resolve linting issues. | M3 | PLANNED |
| 5 | Unit & E2E Testing | Run Vitest unit tests (`pnpm run test`) and Playwright E2E tests (`npx playwright test`). | M4 | PLANNED |
| 6 | Dev Server & Verification | Start Vite development server on port 8017, verify demo auth login and core dashboard features. | M5 | PLANNED |

## Interface Contracts
### Supabase Client ↔ Local AI Service Mock
- File: `src/integrations/supabase/client.ts` imports `handleLocalFunctionInvoke` from `@/lib/localAIService`.
- Expected signature: `export function handleLocalFunctionInvoke(functionName: string, options?: any): Promise<{ data: any; error: any }>`
- Return: Simulated responses for calls like AI chatbot assistant.

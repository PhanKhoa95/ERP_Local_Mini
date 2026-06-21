# Project: multi-sale-organizer

## Architecture
- **Frontend**: React (v18), Vite (v5), Tailwind CSS, Lucide Icons, React Router DOM, TanStack React Query.
- **Backend & Database**: Supabase JS client.
- **Offline / Local Demo Mode**: Intercepts auth and database calls. Stores demo data in local storage (`localStorage`). Intercepts edge function calls and forwards them to a local AI simulator service if enabled.
- **Package Manager**: pnpm.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Initial Exploration | Map codebase, tech stack, port settings, offline login, and scripts. | none | DONE |
| 2 | Dev Env & Setup | Install dependencies, recreate missing `vite.config.ts`, align configs. | M1 | PLANNED |
| 3 | Local AI Mock Service | Implement missing mock service `src/lib/localAIService.ts` for offline functions. | M2 | PLANNED |
| 4 | TypeScript Verification | Fix any remaining TypeScript compilation issues; run `npm run typecheck`. | M3 | PLANNED |
| 5 | Linting Verification | Run `npm run lint` and resolve any ESLint violations. | M4 | PLANNED |
| 6 | Test Suites Execution | Run and pass Vitest unit tests (`npm run test`) and Playwright E2E tests. | M5 | PLANNED |
| 7 | Server Launch & E2E Validation | Run Vite on port 8017, verify login flow, homepage, and core pages. | M6 | PLANNED |

## Interface Contracts
### Supabase Client ↔ Local AI Service Mock
- File: `src/integrations/supabase/client.ts` imports `handleLocalFunctionInvoke` from `@/lib/localAIService`.
- Expected signature: `export function handleLocalFunctionInvoke(functionName: string, options?: any): Promise<{ data: any; error: any }>`
- Return: Simulated responses for calls like AI chatbot assistant.

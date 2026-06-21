# BRIEFING — 2026-06-21T05:45:00Z

## Mission
Conduct a thorough read-only exploration and mapping of the multi-sale-organizer project architecture, configuration, dependencies, auth/offline flows, and commands.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only codebase investigator
- Working directory: E:\multi-sale-organizer\.agents\explorer_milestone1\
- Original parent: 6ac8dc44-42e6-425d-9c5b-ab987be1269a
- Milestone: Milestone 1 - Read-only exploration and mapping

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT run npm install, build, test, or server startup commands.
- Do NOT write/modify any files outside E:\multi-sale-organizer\.agents\explorer_milestone1\.

## Current Parent
- Conversation ID: 6ac8dc44-42e6-425d-9c5b-ab987be1269a
- Updated: 2026-06-21T05:45:00Z

## Investigation State
- **Explored paths**:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
  - `eslint.config.js`
  - `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`
  - `run.bat`, `run.sh`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/routes.tsx`
  - `src/contexts/AuthContext.tsx`, `src/components/layout/ProtectedRoute.tsx`
  - `src/lib/localDemoAuth.ts`, `src/lib/localInventoryStore.ts`
  - `src/integrations/supabase/client.ts`
- **Key findings**:
  - The project manager is `pnpm` (evidenced by `pnpm-lock.yaml`, `pnpm-workspace.yaml`).
  - The tech stack is React v18.3.1, TypeScript, Vite, Supabase, Tailwind CSS, TanStack React Query, Radix UI.
  - Vite has NO root `vite.config.ts` or `vite.config.js` file, which is a major configuration and compilation issue.
  - The dev server is run on port `8017` by specifying `--port 8017` inside `run.bat` and `run.sh` script commands.
  - Playwright is configured to run at `http://127.0.0.1:8080`, which creates a port mismatch.
  - Local Demo Auth is enabled in local dev mode when entering credentials `admin` / `admin`. This is handled by `isLocalDemoCredentials` in `src/lib/localDemoAuth.ts` and `handleLogin` in `src/pages/Auth.tsx`.
  - Offline mode uses local storage keys (e.g. `erp-mini-local-demo-products`) via `src/lib/localInventoryStore.ts` to mock database operations.
  - `src/integrations/supabase/client.ts` imports from `@/lib/localAIService` which is missing from the directory, causing compile errors.
- **Unexplored areas**:
  - Edge Functions detail in Deno.
  - Exact Supabase schema and migrations details.

## Key Decisions Made
- Confirmed the tech stack, package manager (pnpm), and scripts.
- Discovered and verified static compilation errors (missing `vite.config.ts` and `localAIService.ts`).
- Fully mapped the Local Demo Auth / Offline Mode flows.

## Artifact Index
- E:\multi-sale-organizer\.agents\explorer_milestone1\ORIGINAL_REQUEST.md — Original request log
- E:\multi-sale-organizer\.agents\explorer_milestone1\progress.md — Liveness heartbeat and progress
- E:\multi-sale-organizer\.agents\explorer_milestone1\handoff.md — Final investigation report

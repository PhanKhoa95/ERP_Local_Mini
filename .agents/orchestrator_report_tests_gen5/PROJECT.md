# Project: ERP Local Mini Test Coverage Extension

## Architecture
The system consists of a Vite React SPA frontend integrating with Vitest for unit testing and Playwright for End-to-End (E2E) testing.
- **Unit Testing Framework**: Vitest, configuration in `vite.config.ts` or `vitest.config.ts`.
- **E2E Testing Framework**: Playwright, configuration in `playwright.config.ts`.
- **Target Hooks for Unit Tests**: `src/hooks/useLoyalty.ts`, `src/hooks/useWholesaleSettings.ts`, `src/hooks/usePlatformSync.ts`.
- **E2E Scenarios**: POS sales with composite product stock decrement, wholesale selling with stacked discounts and vouchers.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Coverage Gap Analysis | Analysis of current codebase, existing tests, and identifying specific hook/E2E test gaps. | None | DONE |
| 2 | Advanced E2E Tests | Implement Playwright E2E tests for (a) wholesale stacked vouchers, (b) POS combo stock decrement. | M1 | DONE (4fd79c79) |
| 3 | Deep Unit Tests | Implement Vitest tests for useLoyalty, useWholesaleSettings, usePlatformSync hooks. | M1 | DONE (4fd79c79) |
| 4 | Verification & Audit | Validate all unit/E2E tests pass, production build works, and pass Forensic Auditor. | M2, M3 | DONE (f0f9c668, 78b1e157, d572aac4) |

## Interface Contracts
- **E2E test files**: Located in `tests/e2e/`.
- **Unit test files**: Located next to their hooks or in `src/hooks/__tests__/` or as configured in the system.
- **Commands**: `npx vitest run`, `npx playwright test`, `npm run typecheck`, `npm run lint`, `npm run build`.

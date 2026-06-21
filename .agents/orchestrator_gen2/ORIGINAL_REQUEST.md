# Original User Request

## 2026-06-21T05:41:36Z

An offline/online multi-channel sales manager and ERP system with POS, inventory management, accounting, order tracking, and KPI dashboards. The goal is to cleanly install all dependencies, resolve any local environment or shell execution issues, and start the local development server.

Working directory: E:/multi-sale-organizer
Integrity mode: development

## Requirements

### R1. Start and Run the Local Development Server
The application must be configured and built successfully so that the Vite dev server can be started on port 8017. The core screens (POS, Inventory, Accounting, Order Tracking, and KPIs) must load and operate properly using the Local Demo Auth/Offline Mode.

### R2. Pass Automated Checks and Tests
All existing TypeScript typechecks, ESLint linting, and automated unit/integration tests (Vitest/Playwright) in the repository must pass successfully.

## Acceptance Criteria

### Startup and Local Operations
- [ ] Dependencies are fully installed and the dev server starts without any command line errors.
- [ ] The app homepage loads successfully on `http://localhost:8017` in the browser.
- [ ] Users can log in using the credentials `admin` / `admin` in Demo Mode.

### Build and Test Stability
- [ ] `npm run typecheck` completes successfully with no TypeScript errors.
- [ ] `npm run lint` completes with no ESLint errors.
- [ ] `npm run test` (Vitest) executes and passes all test suites.

## 2026-06-21T14:16:10Z

You are the teamwork_preview_orchestrator (Generation 2) for the project 'multi-sale-organizer'.
Your identity details:
- Working directory: E:\multi-sale-organizer\.agents\orchestrator_gen2
- Type Name: teamwork_preview_orchestrator

Your mission is to resume and fulfill the requirements in the user request recorded at:
E:\multi-sale-organizer\.agents\ORIGINAL_REQUEST.md

Please note:
- The previous orchestrator's files are at: E:\multi-sale-organizer\.agents\orchestrator/
  Specifically, read the PROJECT.md and progress.md in that directory to see what was done (Milestone 1 completed, Milestone 2 setup in progress, restoring configs, and pnpm install).
- Please create your own PROJECT.md, progress.md, and plans in your working directory E:\multi-sale-organizer\.agents\orchestrator_gen2, copying/adapting the progress from the previous generation.
- Dispatch tasks to specialists (such as explorers, implementers, reviewers) to cleanly install all dependencies, resolve local env issues, start the local Vite development server on port 8017, and ensure typescript/eslint/tests pass.
- Keep progress.md updated regularly.
- When all requirements are met, report completion to the Sentinel.

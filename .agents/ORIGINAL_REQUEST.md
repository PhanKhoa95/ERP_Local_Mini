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

# Plan: M.A.T.R.I.X POS Workflow & Auto Project Manager Integration

## Milestones

### Milestone 1: Local Verification Baseline
- **Goal**: Run static checks (Typecheck, Lint), Unit Tests (Vitest), and E2E Tests (Playwright) to verify local workspace sanity.
- **Verification Criteria**:
  - `npm run typecheck` passes with no errors.
  - `npm run lint` passes with no new errors.
  - `npx vitest run` passes 100% (22 test suites).
  - `npx playwright test` passes 100% (all E2E files).
  - `npm run build` compiles successfully and creates a clean `dist/` folder.

### Milestone 2: Supabase Remote DB Synchronization
- **Goal**: Check migration status, push any pending migrations, and regenerate types if necessary.
- **Verification Criteria**:
  - `npx supabase migration list` returns no pending migrations.
  - `src/integrations/supabase/types.ts` is up-to-date and typechecks clean.

### Milestone 3: Autopilot Automation & Security Audit
- **Goal**: Execute the APM automation script, update the audit log, run edge function security checks.
- **Verification Criteria**:
  - `node .agents/skills/auto-project-manager/scripts/run_automation.js --all` completes and writes `.agents/auto_report.md`.
  - `node scripts/audit-edge-functions.mjs` runs and updates `docs/EDGE_FUNCTIONS_AUDIT.md`.
  - Commit all changes on Git `develop` branch.

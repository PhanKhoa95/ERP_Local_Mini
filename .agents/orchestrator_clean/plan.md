# Execution Plan — Configuration and UX Clean-up

This plan outlines the steps to resolve the configuration redundancy and dynamic warranty calculations in ERP Local Mini.

## Milestones

### Milestone 1: Exploration & Impact Analysis
- **Goal**: Identify files, understand how product categories, warranty periods, and sales policies are represented, stored in localStorage, and used.
- **Verification**: List files, examine component implementation, identify required code changes.
- **Worker**: `teamwork_preview_explorer`

### Milestone 2: Implementation of Configuration & UI Clean-up
- **Goal**:
  1. Remove "Thời gian bảo hành" field from the categories creation/edit form in `CategoriesTab`.
  2. Ensure `SalesPoliciesTab` handles both segment sales policies and category warranty settings.
  3. Update `PartnerDetailDialog.tsx` under "Bảo hành & CS" to:
     - Render dynamic purchase policies configured in `SalesPoliciesTab`.
     - Calculate product warranty periods dynamically based on the product's category.
     - Optimize layout for both Desktop and Mobile to avoid layout overlap.
- **Verification**: Build/lint/typecheck check by worker.
- **Worker**: `teamwork_preview_worker`

### Milestone 3: Review and Quality Gates
- **Goal**: Code review, challenger testing (E2E Playwright), and forensic audit verification.
- **Verification**:
  - `npx playwright test` (all 18+ tests pass).
  - `npm run typecheck` (no TypeScript compilation errors).
  - Forensic audit verdict is CLEAN.
- **Workers**: `teamwork_preview_reviewer`, `teamwork_preview_challenger`, `teamwork_preview_auditor`

## Execution Steps
1. Spawn Explorer to perform codebase search, read components, and outline implementation details.
2. Spawn Worker to implement the changes and verify compilation/build.
3. Spawn Reviewer to review code changes.
4. Spawn Challenger to run Playwright E2E and unit tests.
5. Spawn Forensic Auditor to verify integrity.
6. Verify and update progress, report completion.

# Plan - Data Contract Milestone

This plan outlines the steps required to implement the Data Contract and CI Gate integration for the ERP Local Mini system.

## Architecture & Scope
We will define data contract schema in `datacontract.yaml` at the project root for 9 core tables:
- `products`
- `orders`
- `order_items`
- `payment_transactions`
- `journal_entries`
- `journal_lines`
- `product_bom`
- `memberships`
- `membership_transactions`

We will integrate `datacontract-cli` (Python-based CLI) as a CI Gate, ensuring the data schema matches actual frontend and database usage, and runs offline validation checks successfully.

## Milestones

### Milestone 10: Codebase Analysis & Data Contract Draft (datacontract.yaml)
- **Goal**: Analyze the exact schemas of the 9 target tables from both frontend typescript types and database migrations. Write a complete draft of `datacontract.yaml` at the project root defining these tables.
- **Verification**: Draft file exists and has valid YAML syntax covering all 9 tables.
- **Status**: PLANNED

### Milestone 11: CI Gate Integration
- **Goal**: Install and configure `datacontract-cli` validation. Create an automated test runner script or integrate validation checking into `npm run test` or package.json script so that it runs offline.
- **Verification**: `datacontract test` or similar command runs without errors.
- **Status**: PLANNED

### Milestone 12: Offline Verification (data-integrity-operator.test.ts)
- **Goal**: Ensure that `data-integrity-operator.test.ts` runs successfully via Vitest and covers database constraints validation. Update it if necessary.
- **Verification**: `npx vitest run src/lib/__tests__/data-integrity-operator.test.ts` returns PASS 100%.
- **Status**: PLANNED

### Milestone 13: Zero-Error Verification Gate
- **Goal**: Ensure the entire system passes TypeScript checks, lint checks, Vitest tests, and Vite build.
- **Verification**: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` all pass.
- **Status**: PLANNED

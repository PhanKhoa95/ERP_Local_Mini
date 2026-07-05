## 2026-07-05T06:51:54Z
You are teamwork_preview_worker.
Your working directory is e:\ERP_Local_Mini\.agents\teamwork_preview_worker_tests.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

Mission:
Implement the Vitest unit tests and Playwright E2E tests for the advanced POS/Wholesale workflows and target hooks as identified in the Explorer's gap analysis report.

Reference files:
- Gap analysis: e:\ERP_Local_Mini\.agents\teamwork_preview_explorer_coverage_1\analysis.md
- Skill details: e:\ERP_Local_Mini\.agents\skills\matrix-pancake-pos-workflow\SKILL.md

Tasks:
1. Implement Playwright E2E tests in tests/e2e/wholesale_pricing.spec.ts:
   - Verify tiered wholesale pricing applying when adding quantity of items exceeding thresholds.
   - Verify wholesale stacking exclusion: when wholesale pricing is applied and global settings 'no_other_discounts = true' is active, check that entering manual discounts or applying vouchers in POS is cleared/disallowed, and the appropriate toast warning is shown.
2. Implement Playwright E2E tests in tests/e2e/composite_stock.spec.ts:
   - Select a composite (combo) variant in POS and check its components' stock.
   - Perform POS checkout.
   - Verify that the ingredients' stock levels are decremented in the inventory system (check '/inventory' logs page and/or variant list).
3. Implement Vitest unit tests in:
   - src/hooks/__tests__/useLoyalty.test.ts (mocking React Query, Supabase client/endpoints or local demo localStorage flows to test useLoyaltySettings, useReferralSettings, and useLoyaltyTransactions hooks).
   - src/hooks/__tests__/useWholesaleSettings.test.ts (testing useWholesaleSettings and useProductWholesalePrices).
   - src/hooks/__tests__/usePlatformSync.test.ts (testing sync logs, sync mutations, Edge function invocation payload, success/error handling).
4. Run code verification:
   - Check TypeScript compilation: npm run typecheck
   - Check Linting: npm run lint
   - Run Vitest tests: npx vitest run (for the new files and existing files to ensure no regressions)
   - Run Playwright E2E tests: npx playwright test tests/e2e/wholesale_pricing.spec.ts and tests/e2e/composite_stock.spec.ts
   - Run production build: npm run build
5. Write your implementation report to e:\ERP_Local_Mini\.agents\teamwork_preview_worker_tests\changes.md and write a handoff.md file there. Report completion to parent.

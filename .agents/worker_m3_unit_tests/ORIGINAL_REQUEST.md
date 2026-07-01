## 2026-06-30T10:11:10Z

You are teamwork_preview_worker for milestone M3 (Verify & Expand Unit/Integration Tests).
Your working directory is: y:\ERP_Local_Mini\.agents\worker_m3_unit_tests.

Your task:
1. Run the existing Vitest unit/integration test suite: `npm run test` or `npx vitest run`.
2. Ensure that 100% of the unit/integration tests pass. If any tests fail, investigate the root cause and fix them.
3. Ensure there is coverage for:
   - Order number auto-generation logic
   - BOM backflush calculation logic
   - Role-based route access controls
   Verify if these areas are fully covered by the tests in `src/hooks/__tests__/useOrderLogic.test.ts` and `src/hooks/__tests__/useRoleAccess.test.ts`. If any gaps exist or if additional test assertions/cases are needed to make them extremely robust, implement them.
4. Document the Vitest run output and the tests you ran or added in a handoff report in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT
hardcode test results, create dummy/facade implementations, or
circumvent the intended task. A Forensic Auditor will independently
verify your work. Integrity violations WILL be detected and your
work WILL be rejected.

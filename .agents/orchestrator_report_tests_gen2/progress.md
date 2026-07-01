# Progress - Report Tests Orchestrator

Last visited: 2026-06-30T13:20:00+07:00

## Iteration Status
Current iteration: 2 / 32

- **Status**: Completed Verification & Audit
- **Milestones**:
  - [x] Initialize analysis (Milestone 1) [done]
  - [x] Create test suite (Milestone 2) [done]
  - [x] Verify test suite runs successfully (Milestone 3) [done]

## Retrospective Notes
- **What worked**: Spawning parallel Reviewers, Challengers, and Forensic Auditor allowed independent, comprehensive validation of the test suite and underlying hooks.
- **What didn't**: The hooks contain serious hidden calculation logic bugs (double counting, production joins discrepancy, incorrect type mapping) which were undetected by the standard test suite.
- **Lessons learned**: Challengers injecting faults and writing stress/challenge tests is critical. Standard happy-path unit tests are not enough to guarantee correct calculation logic when data phình to (scales up).
- **Process improvements**:
  1. Fix the double-counting of customer payments by deduplicating order paid amounts and transaction receipts.
  2. Align the Supabase mode join in `useInventoryReport` with local demo mode.
  3. Support supplier transaction tracking in orders.


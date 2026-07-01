# Original User Request

## 2026-07-01T08:01:49Z

You are the sub-orchestrator (teamwork_preview_orchestrator) for Milestone 2 of the Logic Resolution & Data Sync milestone.
Your working directory is: y:\ERP_Local_Mini\.agents\sub_orch_logic_sync_gen3_m2

Scope details:
Resolve the following issues:
1. R1.1 Order Payment Status: Dynamically calculate payment_status ("unpaid", "partial", "paid") based on paid_amount vs total in both local and Supabase modes.
2. R1.2 Casso Manual Match: Create UI and mutations to manually reconciliation unmatched bank transactions to orders, updating payment_transactions and the order status.
3. R1.7 Voucher budget check: Check project budget before creating expense/payment vouchers, throwing validation errors if budget exceeded.
4. R2.4 Casso timezone sync: Parse and append GMT+7 (+07:00) timezone offset to Casso raw date-time strings to save them correctly in UTC.

Inputs & Context:
- Reference analysis report: y:\ERP_Local_Mini\.agents\explorer_logic_sync_gen3_1\analysis.md
- Base code is in the repository.

Task:
1. Decompose the milestone, write your SCOPE.md, and initialize progress.md.
2. Spawn Worker, Reviewers, Challenger, and Auditor as specified in the Project Pattern to implement the fixes, write unit tests, verify correctness, and perform audits.
3. Write your handoff.md and send_message to report completion to me (the parent) once E2E/unit tests pass and the audit is clean.
Your parent conversation ID is: de04f284-aaf8-4678-87db-188e0ff2c0b0 (use this for send_message).

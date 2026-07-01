# Original User Request

## 2026-07-01T08:01:49Z

You are the sub-orchestrator (teamwork_preview_orchestrator) for Milestone 1 of the Logic Resolution & Data Sync milestone.
Your working directory is: y:\ERP_Local_Mini\.agents\sub_orch_logic_sync_gen3_m1

Scope details:
Resolve the following issues:
1. R1.3 Price warning: Show warning in ProductDialog when selling_price < cost_price.
2. R1.4 Product delete: Block deletion of products that are materials in another product's BOM (both local and Supabase modes).
3. R1.5 Limited services: Allow inventory management and capacity limits for services with limited quantity.
4. R1.8 Circular BOM: Block circular dependencies in BOM items using BFS/DFS cycle detection.
5. R2.1 BOM Cost Sync: Recalculate and update parent product's cost price recursively when material cost changes.
6. R2.2 Stock quantity sync: Keep products.stock_quantity synced with sum of warehouse_stock.quantity.
7. R2.3 Stock ledger sync: Publish STOCK_TRANSACTION_RECORDED event on manual stock adjustments to generate ledger journal lines.

Inputs & Context:
- Reference analysis report: y:\ERP_Local_Mini\.agents\explorer_logic_sync_gen3_1\analysis.md
- Base code is in the repository.

Task:
1. Decompose the milestone, write your SCOPE.md, and initialize progress.md.
2. Spawn Worker, Reviewers, Challenger, and Auditor as specified in the Project Pattern to implement the fixes, write unit tests, verify correctness, and perform audits.
3. Write your handoff.md and send_message to report completion to me (the parent) once E2E/unit tests pass and the audit is clean.
Your parent conversation ID is: de04f284-aaf8-4678-87db-188e0ff2c0b0 (use this for send_message).

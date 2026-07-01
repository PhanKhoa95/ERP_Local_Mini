## 2026-07-01T07:49:04Z
You are the Codebase Investigator explorer subagent.
Your goal is to inspect the ERP_Local_Mini codebase and identify:
1. The 10 business logic limitations that need to be resolved.
2. The 10 data synchronization inconsistencies that need to be resolved.

Specifically, check the latest follow-up request in `y:\ERP_Local_Mini\ORIGINAL_REQUEST.md` (dated 2026-07-01T07:45:47Z). It lists several logic issues (such as paid status based on paid_amount, Casso unmatched manual matching, warning when selling below cost, blocking deletion of products in BOM, service package quantity management, active sales channels check for billing, project budget checks on expense creation, and BOM circular reference check) and sync issues (BOM sync cost, product stock quantity matching warehouse stock, ledger entries for stock movements, GMT+7/UTC timezone alignment, project health audit logging).

Search the codebase, tests, components, and hooks to find where these rules are defined, where the current code fails or has gaps, and how they should be implemented.
Write your detailed findings (what the 10+10 issues are, their exact locations, and recommendations) to your analysis file: `y:\ERP_Local_Mini\.agents\explorer_logic_sync_1\analysis.md`.
Then send a message back to me with the summary and the path to your analysis file.

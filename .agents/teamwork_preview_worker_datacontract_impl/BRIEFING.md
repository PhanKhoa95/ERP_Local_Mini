# BRIEFING — 2026-07-17T12:21:00Z

## Mission
Implement the Data Contract and CI Gate Integration by creating datacontract.yaml, setting up datacontract-cli in .venv, implementing run-datacontract script, integration with package.json, and verifying with vitest/typecheck/lint/build.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: y:\ERP_Local_Mini\.agents\teamwork_preview_worker_datacontract_impl
- Original parent: f6ebeba4-61a7-4922-8e0c-b93106021123
- Milestone: Data Contract & CI Gate Integration

## 🔒 Key Constraints
- CODE_ONLY network mode: no external HTTP calls (wget, curl, etc.)
- Do not cheat, do not hardcode test results.
- Implement genuine logic.

## Current Parent
- Conversation ID: f6ebeba4-61a7-4922-8e0c-b93106021123
- Updated: not yet

## Task Summary
- **What to build**: Create `datacontract.yaml` for 9 core tables. Set up Python virtual environment `.venv` with `datacontract-cli`. Write helper script to validate offline. Add `package.json` validation script. Verify Vitest tests, typecheck, lint, build.
- **Success criteria**: All tables defined correctly in datacontract.yaml. datacontract CLI check passes. NPM script works. Vitest tests pass 100%. No regressions in typecheck, lint, or build.
- **Interface contracts**: datacontract.yaml schema definitions.
- **Code layout**: Root directory for datacontract.yaml, .venv, package.json, scripts/ folder for validation script.

## Key Decisions Made
- None yet.

## Artifact Index
- [TBD]

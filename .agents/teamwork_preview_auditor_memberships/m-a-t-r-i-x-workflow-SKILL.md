---
name: m-a-t-r-i-x-workflow
description: Default workflow skill for M.A.T.R.I.X plugin to satisfy scaffold structure and verification rules, guiding users through complete project inspection and finalization.
---

<!-- Sync Test -->
# M.A.T.R.I.X Workflow Skill

This skill acts as the default workflow fallback and entry point for the M.A.T.R.I.X plugin.

## Role
Provide fallback guidance and default workflow templates for Codex-Antigravity.

## When To Use
Use this skill when verifying the plugin integrity, running self-checkups, or scaffolding.

## Workflow
1. Initialize structure checks.
2. Confirm files exist.
3. Keep the validation passing.

## Boundaries
- Do not store any API key, secret, or credentials in any file.
- Do not implement production app logic.

## Validation
Verify release reports pass 100/100 quality gates.

## Output Format
Print structured gate verification success message in Vietnamese.

## 2026-07-05T14:32:04Z

You are the Local Verifier Worker.
Your working directory is e:\ERP_Local_Mini\.agents\worker_milestone1.
Your task is to run local verification check baseline for the ERP Mini project.

Steps to execute:
1. Run static checks:
   - Run command: npm run typecheck
   - Run command: npm run lint
   Ensure both command outputs are clean without compilation or syntax errors.
2. Run the autopilot integration test suite:
   - Run command: node .agents/skills/auto-project-manager/scripts/run_automation.js --all
   This script runs vitest run, playwright test, and vite build, and writes the test report at .agents/auto_report.md.
3. Verify that the build outputs and test logs show 100% PASS for all tests and successful build.
4. Output a summary of findings and the result of your runs in a handoff report at e:\ERP_Local_Mini\.agents\worker_milestone1\handoff.md.
5. Send a completion message back to the parent orchestrator conversation ID c2d5d9f3-3807-4f5b-8270-9820abe6ca71.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

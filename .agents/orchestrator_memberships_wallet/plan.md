# Implementation Plan - Memberships & Wallet Balance

This plan outlines the steps required to implement the new 'Memberships & Wallet Balance' features.

## Milestones

### Milestone 1: Exploration and Analysis
- **Goal**: Analyze the codebase, identify all files to be modified, and define the detailed code changes.
- **Verification**: Handoff report with verified code paths and mock data structure.

### Milestone 2: Implementation of Multiple Cards, Image Upload & Accounting Integration
- **Goal**: Implement multiple card support, base64 image uploading, dynamic accounting config, cashflow integration, and audit logs.
- **Verification**: Complete TypeScript typecheck and successful Vite build.

### Milestone 3: UI Enhancements and E2E Verification
- **Goal**: Polish UI (Glassmorphism cards list in partner detail, settings panel, image thumbnail), and verify all automated tests (Vitest + Playwright) pass 100%.
- **Verification**: Playwright E2E test execution reports.

## Interface Contracts
- **`Membership` type update**:
  - Add `card_image?: string` (Base64 or URL).
- **`MEMBERSHIP_ACCOUNT_KEY` in localStorage**:
  - Store the selected offset account code (defaults to `"3387"`).
- **Accounting balance offsets**:
  - Deposit: DebitCash (1111/1121) / CreditOffset (e.g. 3387/131/3388)
  - Payment: DebitOffset / CreditRevenue (511)

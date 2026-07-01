# Project: ERP Local Mini Test Suite Expansion

## Architecture
- **E2E Testing (Playwright)**: Verifies user-facing flows (login, sidebar permissions, Casso reconciliation, data quality checks, responsive layouts, core ERP flows).
- **Unit/Integration Testing (Vitest)**: Verifies backend/hook level logic (event bus, production BOM planning, report statistics, role-based route access, order number auto-generation).
- **Integrated Verification Pipeline**: Running typecheck, lint, vitest tests, and vite build to ensure overall system integrity.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Refactor Existing E2E Tests | Clean screenshot paths from old conversation IDs in `role_verification.spec.ts`, `casso_test.spec.ts`, `kpi_data_quality.spec.ts`, `responsive_test.spec.ts`, `health_test.spec.ts`. Use dynamic screenshots directory: `C:/Users/KHOA MEDIA/.gemini/antigravity/brain/0981d539-feb1-4def-9660-a5731a4a4b16`. | None | DONE (211ac5ff-86a0-4334-96b1-37f3af95b62b) |
| 2 | Create Core ERP Flow E2E Tests | Create `tests/e2e/core_erp_flows.spec.ts` covering Sales/Orders, Purchasing, Inventory, and Finance flows. | M1 | DONE (8aed3525-5d82-404a-b9e9-6efa6d60fe87) |
| 3 | Verify & Expand Unit/Integration Tests | Add tests for order number auto-generation, BOM backflush calculation, and role-based route access controls in `src/hooks/__tests__/` or `src/lib/__tests__/`. | None | DONE (bdc40795-8fa6-430b-a2d9-db57d2efc0a1) |
| 4 | Run Full Verification Pipeline | Execute `npm run test:local` and `npx playwright test` to ensure all tests compile and pass. | M1, M2, M3 | DONE (28697184-53aa-4c96-a11e-24609de1c41a) |
| 5 | Configuration Clean-up | Form thêm/sửa danh mục tại `CategoriesTab` không còn trường nhập "Thời gian bảo hành". Tab `SalesPoliciesTab` hiển thị đầy đủ 2 phần: chính sách theo phân khúc và thời gian bảo hành theo danh mục. | None | DONE (42496679) |
| 6 | Dynamic Partner Warranty Sync | Hồ sơ khách hàng (`PartnerDetailDialog`) hiển thị chính sách động và tính toán bảo hành động một cách chính xác. Optimize UI for Desktop and Mobile. | M5 | DONE (42496679) |
| 7 | Full Verification | Playwright E2E tests pass 100%. `npm run typecheck` and `npm run test` pass. | M5, M6 | DONE (bcb56270, 25dad2fb, afae5a08, 92f45180, 52e72c99) |

## Interface Contracts
- **E2E Screenshot Path**: E2E tests must read the screenshot path dynamically or from an environment variable, fallback to the current conversation brain directory `C:/Users/KHOA MEDIA/.gemini/antigravity/brain/0981d539-feb1-4def-9660-a5731a4a4b16`.

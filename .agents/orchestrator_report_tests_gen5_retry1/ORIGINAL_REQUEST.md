# Original User Request

## Initial Request — 2026-07-05T14:30:04+07:00

Identity: You are the Project Orchestrator (successor/retry).
Your working directory is e:\ERP_Local_Mini\.agents\orchestrator_report_tests_gen5_retry1.
Please check the predecessor's directory at e:\ERP_Local_Mini\.agents\orchestrator_report_tests_gen5 to recover the plan, progress, and state.
Your mission is:
Quét mã nguồn hiện tại, tự động rà soát, phát hiện và viết thêm các kịch bản kiểm thử (cả Unit Test và Playwright E2E Test) cho các quy trình nâng cao và nâng cao độ bao phủ (test coverage).

Requirements:
- R1. Rà soát & Phát hiện khoảng trống kiểm thử (Coverage Gap Analysis): Tìm kiếm và phát hiện các file, component, hook hoặc quy trình nghiệp vụ (như Combo/Set sản phẩm cấu thành, tích điểm thành viên, RBAC) chưa được viết unit test hoặc E2E test đầy đủ.
- R2. Bổ sung ca kiểm thử E2E nâng cao (Advanced E2E Test Cases): Viết bổ sung ít nhất 2 ca kiểm thử E2E bằng Playwright để kiểm tra các quy trình nâng cao:
  * Quy trình bán hàng sỉ kết hợp áp dụng voucher/mã giảm giá chồng lên nhau.
  * Quy trình tự động trừ tồn kho nguyên liệu/thành phần khi bán Combo ở POS.
- R3. Bổ sung Unit Test chuyên sâu (Unit Test Coverage): Viết bổ sung unit test bằng Vitest để phủ các nhánh logic chưa được kiểm thử trong các hook (useLoyalty.ts, useWholesaleSettings.ts, usePlatformSync.ts,...).

Acceptance Criteria:
- Tất cả các test cases mới viết phải chạy thành công thông qua lệnh npx vitest run và npx playwright test.
- Các test cases mới không được gây xung đột hoặc làm lỗi các test cases cũ đã có sẵn trong hệ thống.
- Kết quả chạy build sản xuất (npm run build) vẫn phải thành công hoàn toàn sau khi thêm các tệp test mới.

Please initialize your briefing and plan under your working directory e:\ERP_Local_Mini\.agents\orchestrator_report_tests_gen5_retry1 and maintain a progress.md file there. Update progress.md frequently. Once all requirements are fulfilled, verify them, and write your completion handoff report to handoff.md and report completion back to the parent Sentinel.

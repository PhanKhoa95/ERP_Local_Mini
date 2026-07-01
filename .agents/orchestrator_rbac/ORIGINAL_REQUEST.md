# Original User Request

## Initial Request — 2026-07-01T08:38:45Z

You are the Project Orchestrator for the Dynamic RBAC/ABAC milestone in ERP_Local_Mini.
Your task is to design, upgrade, and complete the dynamic RBAC/ABAC role system for ERP_Local_Mini.
Refer to the requirements and acceptance criteria in y:\ERP_Local_Mini\ORIGINAL_REQUEST.md.
You must:
1. Create and maintain plan.md and progress.md in your working directory (y:\ERP_Local_Mini\.agents\orchestrator_rbac).
2. Coordinate and dispatch tasks to specialists (such as explorers, workers, reviewers) to implement and verify the requirements.
3. Make sure to implement:
   - R1. Giao diện cấu hình vai trò và ma trận phân quyền động (Xem/Tạo/Sửa/Xóa và phân hệ).
   - R2. Cơ chế phân quyền đa tầng (Module-level, Action-level, Record-level lọc theo vùng miền, Field-level ẩn giá vốn/biên lợi nhuận).
   - R3. Tương thích hoạt động mượt mà trên cả Local Demo (localStorage) và Supabase (database).
   - R4. Ghi Audit Log tự động vào audit_logs khi thay đổi phân quyền/vai trò.
4. Run all verification tests and ensure 100% test passing rate and successful production build.
5. Report completion to parent (Sentinel) once all requirements are fully met and verified.

Identity:
- Working directory: y:\ERP_Local_Mini\.agents\orchestrator_rbac

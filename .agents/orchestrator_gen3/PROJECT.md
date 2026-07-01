# Project: Import JSON & Auto Audit for Backup Subsystem

## Architecture
- **Backup Tab Component** (`src/components/settings/BackupTab.tsx`): The user interface for exporting and importing data.
- **Local Storage Store**: In Local Demo mode, data is fetched from/stored in `localStorage` under `erp-mini-local-demo-*` keys.
- **Supabase Client**: In Supabase Cloud mode, data is bulk inserted/upserted into Supabase tables.
- **System Data Audit** (`src/lib/systemDataAudit.ts`): Provides `runSystemDataAudit` to calculate a data integrity score between 0 and 100%.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Local Demo Backup Support | Update export to use localStorage keys in demo mode; implement JSON file reader and LocalStorage overwrite logic on import. | None | IN_PROGRESS |
| 2 | Supabase Cloud Bulk Import | Implement bulk delete/upsert to Supabase with proper dependency ordering and company_id sanitization. | M1 | IN_PROGRESS |
| 3 | Auto Audit & UI Integration | Run `runSystemDataAudit` after restore, show Toast message with system health score, invalidate React Query cache, and reload page. | M2 | IN_PROGRESS |
| 4 | Verification & Quality Gates | Run build, typescript type-checks, lints, and test suites to verify correctness and layout. | M3 | PLANNED |

## Interface Contracts
### BackupTab ↔ runSystemDataAudit
- **Signature**: `runSystemDataAudit(companyId?: string | null): Promise<SystemDataAuditReport>`
- **Output**: `{ score: number, issues: any[], okChecks: number, totalChecks: number }`
- **Error handling**: Catch any exceptions thrown by runSystemDataAudit and fall back safely while reporting the import status.

# Module Map

## Business Modules

| Module | Routes | Primary Files | Notes |
| --- | --- | --- | --- |
| Dashboard | `/` | `src/pages/Dashboard.tsx`, `src/components/dashboard` | Executive overview and alerts |
| POS | `/pos` | `src/pages/POS.tsx`, `src/hooks/useOrders.ts` | Immediate sale, stock deduction and raw event capture |
| Orders | `/orders` | `src/pages/Orders.tsx`, `src/components/orders`, `src/hooks/useOrders.ts` | Order lifecycle, status, payment, customer and warehouse control |
| Public Store | `/order`, `/public-order` | `src/pages/PublicOrder.tsx` | Public checkout and storefront order creation |
| Order Tracking | `/tracking`, `/order-tracking` | `src/pages/OrderTracking.tsx` | Public lookup by order number and phone |
| Inventory | `/inventory`, `/warehouses` | `src/pages/Inventory.tsx`, `src/pages/Warehouses.tsx`, `src/hooks/useWarehouseStock.ts` | Products, stock and warehouse operations |
| Partners | `/partners` | `src/pages/Partners.tsx`, `src/hooks/usePartners.ts` | Customers, suppliers, debt and RFM insights |
| Bookings | `/bookings` | `src/pages/Bookings.tsx`, `src/components/bookings` | Calendar booking workflow |
| Data Hub | `/data-hub` | `src/pages/DataHub.tsx`, `src/hooks/useDataHub.ts`, `src/lib/dataHub.ts` | Multi-channel raw data collection, quality and BigData foundation |
| Finance/Accounting | `/finance`, `/accounting`, `/debt-report` | `src/pages/Finance.tsx`, `src/pages/Accounting.tsx`, `src/pages/DebtReport.tsx` | Cash flow, journal entries, debt |
| Documents | `/documents`, `/document-search`, `/trending`, `/bookmarks` | `src/pages/Documents.tsx`, `src/pages/DocumentSearch.tsx` | RAG/document workflows |
| Performance | `/performance/*`, `/work-report`, `/strategic-report`, `/projects` | `src/components/performance`, `src/hooks/useStrategicReports.ts` | KPI, reports, gamification and strategic reporting |
| Automation | `/workflows`, `/directive-dashboard`, `/sales-agent` | `src/pages/Workflows.tsx`, `src/pages/DirectiveDashboard.tsx`, `src/pages/SalesAgent.tsx` | Workflow builder, directives and AI sales assistant |
| Digital Assets | `/digital-assets` | `src/pages/DigitalAssets.tsx`, `src/components/digital-assets` | API gateway, integrations, tokens and VNeID |
| Settings | `/settings` | `src/pages/Settings.tsx`, `src/components/settings` | Company, roles, shipping, vouchers and system health |

## Shared Ownership

- Auth and company context: `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/hooks/useCompanyContext.ts`.
- Supabase client/types: `src/integrations/supabase`.
- Layout/navigation: `src/components/layout`.
- UI primitives: `src/components/ui`.
- Export helpers: `src/lib/exportExcel.ts`, `src/lib/excel.ts`.
- Validation: `src/lib/validation.ts`.
- Identity Resolution: `src/lib/identityResolution.ts`, `src/hooks/useIdentityResolution.ts`.
- SKU Resolution: `src/lib/skuResolution.ts`.

## Data Hub Ownership

Data Hub owns raw capture and quality metadata. It does not own final order, customer, product or finance state. Those stay in their domain modules.

## Webhook Ingest Ownership

The `supabase/functions/webhook-ingest` Edge Function handles external channel payloads. It writes directly to `raw_events` and `data_quality_issues`. It does not create operational entities; those are resolved downstream.

## Identity Resolution Ownership

Identity Resolution links raw events to known entities. It reads from `partners` and `orders` but does not modify them. It writes to `entity_resolution_links` and updates `raw_events.validation_status`.

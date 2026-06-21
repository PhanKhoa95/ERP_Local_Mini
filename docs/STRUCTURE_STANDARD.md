# Structure Standard

## Project Type

This repository is a webapp: Vite, React, TypeScript, shadcn/ui, Tailwind CSS and Supabase.

## Folder Rules

| Path | Rule |
| --- | --- |
| `src/pages` | One route-level page per file. Keep routing concerns here shallow. |
| `src/components/ui` | Generic shadcn/ui primitives only. Do not add domain business logic here. |
| `src/components/<domain>` | Domain-specific dialogs, panels and widgets. |
| `src/hooks` | Data access, React Query keys, mutations and cache invalidation. |
| `src/lib` | Pure helpers and cross-cutting utilities. |
| `src/integrations/supabase` | Supabase client and generated/maintained types. |
| `supabase/migrations` | Additive SQL migrations. Never edit old migrations after they are applied. |
| `supabase/functions` | Edge Functions grouped by capability. |
| `docs` | Architecture, operations and module documentation. |
| `docs/adr` | Architecture Decision Records. |

## Naming Rules

- Pages use PascalCase: `Orders.tsx`, `DataHub.tsx`.
- Hooks use `useX.ts`: `useOrders.ts`, `useDataHub.ts`.
- Feature components use PascalCase under their domain folder.
- SQL migrations use timestamp prefix and descriptive snake_case.
- Documentation files use upper snake case for stable reference docs.

## Data Rules

- New database columns require a migration and Supabase type update.
- Shared query invalidation should go through `src/lib/queryInvalidation.ts` when multiple modules depend on the data.
- Raw external payloads belong in Data Hub, not directly in operational tables.
- UI should read normalized fields first and fall back to legacy fields only for compatibility.

## UI Rules

- Use existing shadcn/ui components before adding new primitives.
- Dense ERP screens should favor tables, filters, tabs and compact cards over landing-page layouts.
- Keep cards for bounded repeated items, dialogs or panels.
- Ensure mobile and desktop states remain usable for core workflows.

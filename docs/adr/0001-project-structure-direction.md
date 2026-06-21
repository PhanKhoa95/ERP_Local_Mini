# ADR 0001: Project Structure Direction

## Status

Accepted.

## Context

ERP Mini is growing from a sales organizer into a broader ERP surface with orders, POS, inventory, partners, finance, documents, performance, automation, bookings and Data Hub. Without a clear structure, feature work can drift into oversized pages, duplicated data access and overloaded operational tables.

## Decision

Use a modular webapp structure:

- Route-level screens in `src/pages`.
- Domain UI in `src/components/<domain>`.
- Data access in `src/hooks`.
- Shared helpers in `src/lib`.
- Database changes in `supabase/migrations`.
- Server-side integration logic in `supabase/functions`.
- Architecture and operating docs in `docs`.

Raw multi-channel payloads will be captured in Data Hub tables instead of being packed directly into `orders`, `partners` or other operational records.

## Consequences

- New features need both UI placement and data ownership clarity.
- Schema changes require migrations and Supabase type updates.
- BigData/analytics work can grow without destabilizing operational screens.
- Public flows remain easier to audit because they are explicitly separated from authenticated ERP routes.
